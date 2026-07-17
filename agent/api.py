import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
from rq import Queue
from redis import Redis
from db import init_db, get_session
from db_models import SkillRequest, User
from clerk_backend_api import Clerk
from fastapi.middleware.cors import CORSMiddleware
from svix.webhooks import Webhook, WebhookVerificationError
from evaluate_skill import evaluate_skill
import config  # noqa — sets env vars at import time
from config import CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, REDIS_URI, DATABASE_URL


app = FastAPI()

allowed_origins = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)

redis_conn = Redis.from_url(REDIS_URI)
q = Queue(connection=redis_conn)

@app.on_event("startup")
def on_startup():
    init_db()

class GenerateSkillPayload(BaseModel):
    url: str
    prompt: str
    include_mcp: bool = False

def get_current_user(authorization: str = Header(None)) -> str:
    """
    Verify the Clerk JWT using the Clerk Backend SDK.
    The SDK fetches the public JWKS from Clerk and validates the signature,
    expiry, and issuer — no unverified decoding.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    try:
        # request_state holds the verified claims or an error reason
        request_state = clerk.authenticate_request(
            Request(scope={"type": "http", "headers": [(b"authorization", authorization.encode())]}),
            authenticate_request_options=None,
        )
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail=f"Clerk auth failed: {request_state.reason}")
        user_id = request_state.payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing sub claim")
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {e}")

@app.post("/api/generate_skill")
def generate_skill(
    payload: GenerateSkillPayload,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    thread_id = str(uuid.uuid4())
    
    req = SkillRequest(
        thread_id=thread_id,
        user_id=user_id,
        url=payload.url,
        prompt=payload.prompt,
        include_mcp=payload.include_mcp,
        status="pending"
    )
    session.add(req)
    session.commit()
    session.refresh(req)

    from worker import process_skill_request
    job = q.enqueue(process_skill_request, req.id, thread_id, user_id, payload.url, payload.prompt, payload.include_mcp, job_timeout='10m')

    return {"status": "enqueued", "job_id": job.id, "thread_id": thread_id, "db_id": req.id}

@app.get("/api/skill_request/{db_id}")
def get_skill_request(
    db_id: int,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    req = session.get(SkillRequest, db_id)
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Map back to what the frontend expects
    return {
        "status": req.status,
        "error": req.error,
        "createdSkill": {
            "folderName": f"skill-{req.id}",
            "displayName": "Generated Skill",
            "description": "Custom skill created via AI",
            "files": {
                "SKILL.md": req.skill_content,
                "mcp_server.py": req.mcp_script if req.mcp_script else None,
                "mcp_config.json": req.mcp_config if req.mcp_config else None
            }
        } if req.status == "completed" else None
    }
class EvaluateSkillPayload(BaseModel):
    prompt: str
    skill_content: str
    assertions: list[str]

@app.post("/api/evaluate_skill")
def evaluate_skill_endpoint(
    payload: EvaluateSkillPayload,
    user_id: str = Depends(get_current_user)
):
    try:
        results = evaluate_skill(
            prompt=payload.prompt,
            skill_content=payload.skill_content,
            assertions=payload.assertions
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhooks/clerk")
async def clerk_webhook(request: Request, session: Session = Depends(get_session)):
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="CLERK_WEBHOOK_SECRET is not configured in Infisical")
    
    headers = request.headers
    payload = await request.body()
    
    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        evt = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error verifying webhook: {str(e)}")
        
    event_type = evt.get("type")
    data = evt.get("data", {})
    
    if event_type in ["user.created", "user.updated"]:
        user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        primary_email = ""
        if email_addresses:
            # Clerk puts the primary email address ID in primary_email_address_id
            primary_email_id = data.get("primary_email_address_id")
            for em in email_addresses:
                if em.get("id") == primary_email_id:
                    primary_email = em.get("email_address", "")
                    break
            if not primary_email and len(email_addresses) > 0:
                primary_email = email_addresses[0].get("email_address", "")
                
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        
        user = session.get(User, user_id)
        if not user:
            user = User(id=user_id, email=primary_email, first_name=first_name, last_name=last_name)
            session.add(user)
        else:
            user.email = primary_email
            user.first_name = first_name
            user.last_name = last_name
            
        session.commit()
 
        # ── Sync to Neon Postgres (users table used by the frontend/skills FK) ──
        _neon_upsert_user(
            user_id=user_id,
            email=primary_email,
            first_name=first_name,
            last_name=last_name,
        )
        
    elif event_type == "user.deleted":
        user_id = data.get("id")
        user = session.get(User, user_id)
        if user:
            session.delete(user)
            session.commit()
        _neon_delete_user(user_id)
            
    return {"success": True}


# ── Neon helpers ──────────────────────────────────────────────────────────────

def _get_neon_conn():
    """Return a psycopg2 connection to Neon, or None if the driver isn't installed."""
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    except Exception:
        return None


def _neon_upsert_user(user_id: str, email: str, first_name: Optional[str], last_name: Optional[str]):
    """Upsert the user row in Neon so the skills.author_id FK is satisfiable."""
    conn = _get_neon_conn()
    if conn is None:
        return
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (id, email, first_name, last_name)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE
                      SET email      = EXCLUDED.email,
                          first_name = EXCLUDED.first_name,
                          last_name  = EXCLUDED.last_name
                    """,
                    (user_id, email, first_name, last_name),
                )
    except Exception as exc:
        print(f"[clerk_webhook] Neon upsert failed: {exc}")
    finally:
        conn.close()


def _neon_delete_user(user_id: str):
    """Remove the user row from Neon when a Clerk user.deleted event fires."""
    conn = _get_neon_conn()
    if conn is None:
        return
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    except Exception as exc:
        print(f"[clerk_webhook] Neon delete failed: {exc}")
    finally:
        conn.close()

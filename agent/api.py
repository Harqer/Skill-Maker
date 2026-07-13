import os
import uuid
from fastapi import FastAPI, Depends, HTTPException, Header
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
from rq import Queue
from redis import Redis
from db import init_db, get_session
from db_models import SkillRequest, User
from clerk_backend_api import Clerk
import jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from svix.webhooks import Webhook, WebhookVerificationError
from evaluate_skill import evaluate_skill


app = FastAPI()

# Define allowed origins based on environment
allowed_origins = os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)

# Initialize Redis and RQ
redis_url = os.getenv("REDIS_URI", os.getenv("REDIS_URL", "redis://localhost:6379"))
redis_conn = Redis.from_url(redis_url)
q = Queue(connection=redis_conn)

@app.on_event("startup")
def on_startup():
    init_db()

class GenerateSkillPayload(BaseModel):
    url: str
    prompt: str
    include_mcp: bool = False

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    try:
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified_claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/generate_skill")
def generate_skill(
    payload: GenerateSkillPayload,
    user_id: str = "anonymous",
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
    user_id: str = "anonymous",
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
    user_id: str = "anonymous"
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
    CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="CLERK_WEBHOOK_SECRET is not set")
    
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
        
    elif event_type == "user.deleted":
        user_id = data.get("id")
        user = session.get(User, user_id)
        if user:
            session.delete(user)
            session.commit()
            
    return {"success": True}

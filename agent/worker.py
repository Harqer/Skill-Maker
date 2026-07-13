import os
import sys
from sqlmodel import Session


# We must ensure the `agent` path is resolvable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import engine
from db_models import SkillRequest
from orchestrator import run_orchestrator as run_agent

def process_skill_request(db_id: int, thread_id: str, user_id: str, url: str, prompt: str, include_mcp: bool):
    """
    RQ worker function.
    Executes the LangGraph orchestrator and saves the results to NeonDB.
    """
    try:
        # Mark as processing
        with Session(engine) as session:
            req = session.get(SkillRequest, db_id)
            if not req:
                print(f"Error: DB Request {db_id} not found.")
                return
            req.status = "processing"
            session.add(req)
            session.commit()

        # Run the agent from orchestrator.py
        result = run_agent(url, prompt, include_mcp=include_mcp, thread_id=thread_id, user_id=user_id)
        
        # result is a dictionary returned by run_agent containing:
        # "skill_content", "mcp_script", "mcp_config", "trace_url"
        
        # Mark as completed
        with Session(engine) as session:
            req = session.get(SkillRequest, db_id)
            if req:
                req.status = "completed"
                req.skill_content = result.get("skill_content")
                req.mcp_script = result.get("mcp_script")
                req.mcp_config = result.get("mcp_config")
                req.trace_url = result.get("trace_url")
                session.add(req)
                session.commit()
                print(f"Successfully processed request {db_id}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        # Mark as failed
        with Session(engine) as session:
            req = session.get(SkillRequest, db_id)
            if req:
                req.status = "failed"
                req.error = str(e)
                session.add(req)
                session.commit()
                print(f"Failed processing request {db_id}")

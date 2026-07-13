from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime, timezone

class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    email: str = Field(index=True)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SkillRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    thread_id: str = Field(index=True, unique=True)
    user_id: str = Field(index=True)
    url: str
    prompt: str
    include_mcp: bool = False
    status: str = Field(default="pending") # pending, processing, completed, failed
    skill_content: Optional[str] = None
    mcp_script: Optional[str] = None
    mcp_config: Optional[str] = None
    trace_url: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

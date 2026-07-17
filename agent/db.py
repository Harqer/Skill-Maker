"""
db.py — Database engine for Skill Maker.

Connects to Neon PostgreSQL (DATABASE_URL injected from Infisical).
Falls back to SQLite only when DATABASE_URL is explicitly set to a
sqlite:// URI (useful for offline unit tests, never for production).
"""
import os
from sqlmodel import SQLModel, create_engine, Session
from config import DATABASE_URL

# asyncpg is the recommended driver for Neon with asyncio; for sync SQLModel
# usage with psycopg2 (which is simpler to wire up here), we use the standard
# postgresql+psycopg2 scheme. Neon pooler handles connection pooling.
_connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,   # detect stale Neon connections
    pool_recycle=300,     # recycle connections every 5 min (Neon idle timeout)
)


def init_db():
    from db_models import SkillRequest, User  # noqa: F401 — registers models
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

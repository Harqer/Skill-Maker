import os
from sqlmodel import SQLModel, create_engine, Session

# Use a local SQLite database to bypass Neon connection issues in this environment
DATABASE_URL = "sqlite:///./local.db"

# For SQLite, we need connect_args={"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db():
    from db_models import SkillRequest
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

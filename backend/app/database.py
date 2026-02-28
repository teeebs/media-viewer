from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings

# Auto-create the parent directory for SQLite databases
if settings.database_url.startswith("sqlite:///"):
    # sqlite:///relative/path or sqlite:////absolute/path
    db_file = settings.database_url[len("sqlite:///"):]
    if db_file:
        Path(db_file).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from . import models  # noqa: F401 - ensure models are registered
    Base.metadata.create_all(bind=engine)

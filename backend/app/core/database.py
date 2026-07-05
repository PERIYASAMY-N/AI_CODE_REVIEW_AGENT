from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Render's free PostgreSQL gives URLs starting with "postgres://" but
# SQLAlchemy requires "postgresql://". Fix it transparently here.
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
engine = create_engine(_db_url)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

# Dependency for getting database sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

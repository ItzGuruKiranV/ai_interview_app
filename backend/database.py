from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ✅ PostgreSQL connection string
DATABASE_URL = "postgresql://postgres:Guru%406366@localhost:5432/interview_db"

# ✅ Engine connects to your PostgreSQL database
engine = create_engine(DATABASE_URL)

# ✅ SessionLocal is used to interact with the database per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base class for all ORM models (tables)
Base = declarative_base()

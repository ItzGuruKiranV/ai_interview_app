from .database import SessionLocal
from sqlalchemy.orm import Session

# This function is used as a dependency in your API routes
def get_db():
    db = SessionLocal()  # Start a new DB session
    try:
        yield db          # Give it to the route
    finally:
        db.close()        # Make sure to close it after use

from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from backend.database import Base

class UserHistory(Base):
    __tablename__ = "user_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)  # Clerk user ID or email
    action_type = Column(String)          # e.g., "resume_upload", "test_submission"
    question = Column(Text)
    answer = Column(Text)
    evaluation = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

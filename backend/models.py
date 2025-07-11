from sqlalchemy import Column, String
from .database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, index=True)  # only email for now

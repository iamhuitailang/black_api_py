from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "tb_jifen_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(100), default="")
    avatar = Column(String(500), default="")
    phone = Column(String(20), default="")
    email = Column(String(100), default="")
    points = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    role = Column(String(20), default="user")
    profile_completed = Column(Boolean, default=False)
    invite_code = Column(String(20), unique=True, index=True)
    invited_by = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

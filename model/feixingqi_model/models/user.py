from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class User(Base):
    __tablename__ = "tb_feixingqi_model_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(50))
    avatar = Column(String(255))
    role = Column(String(20), default="user")
    score = Column(Integer, default=1000)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    status = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

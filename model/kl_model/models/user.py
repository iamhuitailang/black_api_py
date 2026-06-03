from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class User(Base):
    __tablename__ = "tb_kl_model_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(255), default="")
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    coins = Column(Float, default=10000.0)
    diamonds = Column(Float, default=100.0)
    bio = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Park(Base):
    __tablename__ = "tb_kl_model_park"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    level = Column(Integer, default=1)
    rating = Column(Float, default=0.0)
    visitor_count = Column(Integer, default=0)
    income = Column(Float, default=0.0)
    reputation = Column(Integer, default=0)
    safety_level = Column(Integer, default=50)
    park_size = Column(Integer, default=1000)
    theme = Column(String(50), default="default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Route(Base):
    __tablename__ = "tb_kl_model_route"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    waypoints = Column(Text, default="[]")
    duration = Column(Integer, default=60)
    popularity = Column(Integer, default=0)
    safety_rating = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

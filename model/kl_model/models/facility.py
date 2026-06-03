from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Facility(Base):
    __tablename__ = "tb_kl_model_facility"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    level = Column(Integer, default=1)
    capacity = Column(Integer, default=10)
    income_per_hour = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    width = Column(Float, default=50.0)
    height = Column(Float, default=50.0)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

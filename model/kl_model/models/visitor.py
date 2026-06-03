from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Visitor(Base):
    __tablename__ = "tb_kl_model_visitor"

    id = Column(Integer, primary_key=True, index=True)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, default=30)
    happiness = Column(Integer, default=80)
    satisfaction = Column(Integer, default=70)
    spending = Column(Float, default=0.0)
    current_route_id = Column(Integer, ForeignKey("tb_kl_model_route.id"), nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    status = Column(String(20), default="exploring")
    is_in_park = Column(Boolean, default=True)
    entry_time = Column(DateTime(timezone=True), server_default=func.now())
    exit_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

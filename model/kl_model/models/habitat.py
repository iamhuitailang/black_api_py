from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Habitat(Base):
    __tablename__ = "tb_kl_model_habitat"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    level = Column(Integer, default=1)
    capacity = Column(Integer, default=5)
    size = Column(Integer, default=100)
    security_level = Column(Integer, default=50)
    comfort = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    decorations = Column(Text, default="[]")
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    width = Column(Float, default=100.0)
    height = Column(Float, default=100.0)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

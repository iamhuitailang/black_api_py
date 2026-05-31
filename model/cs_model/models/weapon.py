from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from ..database.db import Base

class Weapon(Base):
    __tablename__ = "tb_cs_model_weapon"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(30), nullable=False)
    damage = Column(Integer, default=0)
    fire_rate = Column(Float, default=0)
    magazine_size = Column(Integer, default=0)
    reload_time = Column(Float, default=0)
    accuracy = Column(Float, default=0)
    recoil = Column(Float, default=0)
    price = Column(Integer, default=0)
    description = Column(String(500), default="")
    image = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

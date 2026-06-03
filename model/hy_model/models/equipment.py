from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Equipment(Base):
    __tablename__ = "tb_hy_model_equipment"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    image = Column(String(255), default="")
    type = Column(String(50), default="pressure")
    rarity = Column(String(20), default="common")
    level = Column(Integer, default=1)
    effect_type = Column(String(50), default="pressure_resistance")
    effect_value = Column(Float, default=10.0)
    price = Column(Integer, default=100)
    currency_type = Column(String(20), default="coins")
    unlock_level = Column(Integer, default=1)
    upgrade_cost = Column(Integer, default=50)
    max_level = Column(Integer, default=10)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

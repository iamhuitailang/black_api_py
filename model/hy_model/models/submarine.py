from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Submarine(Base):
    __tablename__ = "tb_hy_model_submarine"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    image = Column(String(255), default="")
    max_depth = Column(Float, default=100.0)
    speed = Column(Float, default=1.0)
    capacity = Column(Integer, default=10)
    pressure_resistance = Column(Float, default=100.0)
    durability = Column(Integer, default=100)
    price = Column(Integer, default=0)
    currency_type = Column(String(20), default="coins")
    unlock_level = Column(Integer, default=1)
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Treasure(Base):
    __tablename__ = "tb_hy_model_treasure"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    image = Column(String(255), default="")
    rarity = Column(String(20), default="common")
    category = Column(String(50), default="coin")
    min_depth = Column(Float, default=0.0)
    max_depth = Column(Float, default=1000.0)
    coins_value = Column(Integer, default=10)
    gems_value = Column(Integer, default=0)
    exp_value = Column(Integer, default=5)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

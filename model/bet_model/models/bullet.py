from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database.config import Base


class Bullet(Base):
    __tablename__ = "tb_bet_model_bullet"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    type = Column(String(20), default="normal")
    damage = Column(Float, default=10.0)
    speed = Column(Float, default=8.0)
    size = Column(Integer, default=8)
    color = Column(String(20), default="#ff6b6b")
    description = Column(String(255), nullable=True)
    is_tracking = Column(Integer, default=0)
    cooldown = Column(Float, default=0.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

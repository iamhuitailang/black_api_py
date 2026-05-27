from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database.config import Base


class Player(Base):
    __tablename__ = "tb_bet_model_player"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    health = Column(Float, default=100.0)
    max_health = Column(Float, default=100.0)
    x = Column(Float, default=100.0)
    y = Column(Float, default=300.0)
    velocity_x = Column(Float, default=0.0)
    velocity_y = Column(Float, default=0.0)
    score = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database.config import Base


class GameRecord(Base):
    __tablename__ = "tb_bet_model_game_record"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    player1_id = Column(Integer, nullable=False)
    player2_id = Column(Integer, nullable=False)
    winner_id = Column(Integer, nullable=True)
    player1_health = Column(Float, default=0.0)
    player2_health = Column(Float, default=0.0)
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    scene = Column(String(50), default="space")
    game_mode = Column(String(20), default="single")
    duration = Column(Float, default=0.0)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

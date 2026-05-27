from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database.config import Base


class GameSave(Base):
    __tablename__ = "tb_bet_model_game_save"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    player_id = Column(Integer, nullable=False)
    game_mode = Column(String(20), default="single")
    scene = Column(String(50), default="space")
    player_health = Column(Float, default=100.0)
    enemy_health = Column(Float, default=100.0)
    player_x = Column(Float, default=100.0)
    player_y = Column(Float, default=300.0)
    enemy_x = Column(Float, default=700.0)
    enemy_y = Column(Float, default=300.0)
    score = Column(Integer, default=0)
    game_state = Column(String(20), default="playing")
    is_active = Column(Boolean, default=True)
    game_data = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

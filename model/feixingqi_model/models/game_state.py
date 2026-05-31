from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class GameState(Base):
    __tablename__ = "tb_feixingqi_model_game_state"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, nullable=False, unique=True)
    current_player_index = Column(Integer, default=0)
    players_state = Column(Text, default="[]")
    board_state = Column(Text, default="[]")
    dice_value = Column(Integer, default=0)
    game_phase = Column(String(20), default="waiting")
    turn_count = Column(Integer, default=0)
    is_game_over = Column(Integer, default=0)
    winner_id = Column(Integer)
    last_action = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

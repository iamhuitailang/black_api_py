from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class GameRecord(Base):
    __tablename__ = "tb_feixingqi_model_game_record"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, nullable=False)
    room_code = Column(String(20))
    player_ids = Column(Text, default="[]")
    winner_id = Column(Integer)
    game_data = Column(Text)
    duration = Column(Integer, default=0)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

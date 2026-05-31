from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class Room(Base):
    __tablename__ = "tb_feixingqi_model_room"

    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(100), nullable=False)
    room_code = Column(String(20), unique=True, index=True)
    creator_id = Column(Integer, nullable=False)
    max_players = Column(Integer, default=4)
    current_players = Column(Integer, default=0)
    player_ids = Column(Text, default="[]")
    status = Column(String(20), default="waiting")
    game_mode = Column(String(20), default="classic")
    password = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

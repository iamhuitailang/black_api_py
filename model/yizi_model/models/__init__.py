from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "tb_yizi_model_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(100), default="椅子斗士")
    win_count = Column(Integer, default=0)
    lose_count = Column(Integer, default=0)
    total_games = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    game_records = relationship("GameRecord", back_populates="player")


class GameRecord(Base):
    __tablename__ = "tb_yizi_model_game_records"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("tb_yizi_model_users.id"), nullable=False)
    enemy_type = Column(String(50), nullable=False)
    result = Column(String(20), nullable=False)
    player_hp_remaining = Column(Integer, default=0)
    enemy_hp_remaining = Column(Integer, default=0)
    duration = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    player = relationship("User", back_populates="game_records")

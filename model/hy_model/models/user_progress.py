from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class UserProgress(Base):
    __tablename__ = "tb_hy_model_user_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    current_depth = Column(Float, default=0.0)
    deepest_reached = Column(Float, default=0.0)
    total_coins_earned = Column(Integer, default=0)
    total_creatures_caught = Column(Integer, default=0)
    total_treasures_found = Column(Integer, default=0)
    total_ruins_explored = Column(Integer, default=0)
    unlocked_submarines = Column(String(500), default="1")
    unlocked_equipment = Column(String(500), default="")
    unlocked_music = Column(String(500), default="1")
    discovered_ruins = Column(String(500), default="")
    current_music_id = Column(Integer, default=1)
    game_state = Column(Text, default="{}")
    last_save_time = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "tb_renlei_model_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True)
    nickname = Column(String(50))
    avatar = Column(String(255))
    current_character_id = Column(Integer, ForeignKey("tb_renlei_model_character.id"))
    current_level_id = Column(Integer, ForeignKey("tb_renlei_model_level.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    progresses = relationship("UserProgress", back_populates="user")
    game_sessions = relationship("GameSession", back_populates="user")


class Character(Base):
    __tablename__ = "tb_renlei_model_character"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    color = Column(String(20), default="#FFB6C1")
    head_color = Column(String(20), default="#FFE4E1")
    body_color = Column(String(20), default="#FFB6C1")
    unlock_condition = Column(String(255))
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Level(Base):
    __tablename__ = "tb_renlei_model_level"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    level_type = Column(String(50))
    difficulty = Column(Integer, default=1)
    theme = Column(String(50))
    start_position = Column(Text)
    end_position = Column(Text)
    obstacles = Column(Text)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserProgress(Base):
    __tablename__ = "tb_renlei_model_user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_renlei_model_user.id"))
    level_id = Column(Integer, ForeignKey("tb_renlei_model_level.id"))
    is_completed = Column(Boolean, default=False)
    best_time = Column(Float)
    attempts = Column(Integer, default=0)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="progresses")


class GameSession(Base):
    __tablename__ = "tb_renlei_model_game_session"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_renlei_model_user.id"))
    session_token = Column(String(255), unique=True, index=True)
    level_id = Column(Integer, ForeignKey("tb_renlei_model_level.id"))
    character_id = Column(Integer, ForeignKey("tb_renlei_model_character.id"))
    game_state = Column(Text)
    player_position = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="game_sessions")

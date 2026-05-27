from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "tb_balance_model_user"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nickname = Column(String(50))
    avatar = Column(String(255))
    total_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    saves = relationship("GameSave", back_populates="user")
    scores = relationship("ScoreRecord", back_populates="user")


class Level(Base):
    __tablename__ = "tb_balance_model_level"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    difficulty = Column(Integer, default=1)
    target_height = Column(Float, default=0)
    target_score = Column(Integer, default=0)
    gravity = Column(Float, default=9.8)
    wind_force = Column(Float, default=0)
    wind_direction = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    saves = relationship("GameSave", back_populates="level")
    scores = relationship("ScoreRecord", back_populates="level")


class GameSave(Base):
    __tablename__ = "tb_balance_model_game_save"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_balance_model_user.id"))
    level_id = Column(Integer, ForeignKey("tb_balance_model_level.id"))
    save_name = Column(String(100))
    blocks_data = Column(Text, nullable=False)
    current_score = Column(Integer, default=0)
    current_height = Column(Float, default=0)
    is_auto_save = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="saves")
    level = relationship("Level", back_populates="saves")


class ScoreRecord(Base):
    __tablename__ = "tb_balance_model_score_record"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_balance_model_user.id"))
    level_id = Column(Integer, ForeignKey("tb_balance_model_level.id"))
    score = Column(Integer, nullable=False)
    height = Column(Float, default=0)
    blocks_used = Column(Integer, default=0)
    is_stable = Column(Boolean, default=False)
    play_time = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="scores")
    level = relationship("Level", back_populates="scores")


class BlockTemplate(Base):
    __tablename__ = "tb_balance_model_block_template"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    load_capacity = Column(Float, nullable=False)
    color = Column(String(20))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "tb_chengyu_077_model_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(50))
    avatar = Column(String(255))
    total_games = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    games = relationship("Game", back_populates="user")
    scores = relationship("Score", back_populates="user")
    user_achievements = relationship("UserAchievement", back_populates="user")


class Idiom(Base):
    __tablename__ = "tb_chengyu_077_model_idiom"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(50), unique=True, index=True, nullable=False)
    pinyin = Column(String(200))
    explanation = Column(Text)
    example = Column(Text)
    first_char = Column(String(10), index=True)
    last_char = Column(String(10), index=True)
    first_pinyin = Column(String(50), index=True)
    last_pinyin = Column(String(50), index=True)
    difficulty = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class Game(Base):
    __tablename__ = "tb_chengyu_077_model_game"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_chengyu_077_model_user.id"))
    game_type = Column(String(20), nullable=False)
    mode = Column(String(20), default="single")
    status = Column(String(20), default="playing")
    current_idiom = Column(String(50))
    used_idioms = Column(Text)
    score = Column(Integer, default=0)
    combo = Column(Integer, default=0)
    max_combo = Column(Integer, default=0)
    time_limit = Column(Integer, default=60)
    time_used = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="games")
    scores = relationship("Score", back_populates="game")


class Score(Base):
    __tablename__ = "tb_chengyu_077_model_score"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_chengyu_077_model_user.id"))
    game_id = Column(Integer, ForeignKey("tb_chengyu_077_model_game.id"))
    game_type = Column(String(20))
    score = Column(Integer, default=0)
    combo = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    time_used = Column(Integer, default=0)
    is_win = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scores")
    game = relationship("Game", back_populates="scores")


class Achievement(Base):
    __tablename__ = "tb_chengyu_077_model_achievement"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(String(255))
    icon = Column(String(255))
    condition_type = Column(String(50))
    condition_value = Column(Integer, default=0)
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "tb_chengyu_077_model_user_achievement"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_chengyu_077_model_user.id"))
    achievement_id = Column(Integer, ForeignKey("tb_chengyu_077_model_achievement.id"))
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class Rank(Base):
    __tablename__ = "tb_feixingqi_model_rank"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True)
    username = Column(String(50))
    nickname = Column(String(50))
    avatar = Column(String(255))
    score = Column(Integer, default=1000)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    win_rate = Column(Integer, default=0)
    rank = Column(Integer)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

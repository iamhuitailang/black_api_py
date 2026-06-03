from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Music(Base):
    __tablename__ = "tb_hy_model_music"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    file_path = Column(String(255), default="")
    genre = Column(String(50), default="ambient")
    bpm = Column(Integer, default=100)
    mood = Column(String(50), default="calm")
    duration = Column(Integer, default=180)
    unlock_level = Column(Integer, default=1)
    price = Column(Integer, default=0)
    currency_type = Column(String(20), default="coins")
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

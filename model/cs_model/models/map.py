from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from ..database.db import Base

class Map(Base):
    __tablename__ = "tb_cs_model_map"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(500), default="")
    type = Column(String(30), default="bomb")
    max_players = Column(Integer, default=10)
    thumbnail = Column(String(255), default="")
    scene_data = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

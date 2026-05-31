from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class Spectator(Base):
    __tablename__ = "tb_feixingqi_model_spectator"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

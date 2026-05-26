from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class PointsRecord(Base):
    __tablename__ = "tb_jifen_points_record"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    points = Column(Integer, default=0)
    type = Column(String(50), default="task")
    description = Column(String(500), default="")
    related_id = Column(Integer, default=0)
    balance_after = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

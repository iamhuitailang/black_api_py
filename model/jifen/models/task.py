from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class Task(Base):
    __tablename__ = "tb_jifen_task"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    icon = Column(String(50), default="")
    points = Column(Integer, default=0)
    type = Column(String(50), default="daily")
    limit_count = Column(Integer, default=1)
    limit_period = Column(String(20), default="day")
    is_active = Column(Boolean, default=True)
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

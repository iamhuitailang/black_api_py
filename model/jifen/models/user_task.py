from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class UserTask(Base):
    __tablename__ = "tb_jifen_user_task"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    task_id = Column(Integer, index=True, nullable=False)
    completed_count = Column(Integer, default=0)
    last_completed_at = Column(DateTime)
    period_date = Column(String(20), default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

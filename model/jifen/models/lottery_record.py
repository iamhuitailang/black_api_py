from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class LotteryRecord(Base):
    __tablename__ = "tb_jifen_lottery_record"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    product_id = Column(Integer, index=True, nullable=False)
    result = Column(Integer, default=0)
    result_description = Column(String(500), default="")
    created_at = Column(DateTime, server_default=func.now())

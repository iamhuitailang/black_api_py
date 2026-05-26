from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Signin(Base):
    __tablename__ = "tb_jifen_signin"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    signin_date = Column(String(20), index=True, nullable=False)
    continuous_days = Column(Integer, default=1)
    points = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

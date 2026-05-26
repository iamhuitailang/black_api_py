from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class Address(Base):
    __tablename__ = "tb_jifen_address"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    receiver_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    province = Column(String(50), default="")
    city = Column(String(50), default="")
    district = Column(String(50), default="")
    detail = Column(String(500), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

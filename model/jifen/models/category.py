from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Category(Base):
    __tablename__ = "tb_jifen_category"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(50), default="")
    description = Column(String(255), default="")
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

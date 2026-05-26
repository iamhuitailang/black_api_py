from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class Product(Base):
    __tablename__ = "tb_jifen_product"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    image = Column(String(500), default="")
    images = Column(Text, default="")
    price = Column(Integer, default=0)
    original_price = Column(Integer, default=0)
    stock = Column(Integer, default=0)
    total_stock = Column(Integer, default=0)
    is_hot = Column(Boolean, default=False)
    is_online = Column(Boolean, default=True)
    is_virtual = Column(Boolean, default=True)
    limit_type = Column(String(20), default="none")
    limit_count = Column(Integer, default=0)
    exchange_count = Column(Integer, default=0)
    sort = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

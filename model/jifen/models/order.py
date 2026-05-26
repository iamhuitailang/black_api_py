from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Order(Base):
    __tablename__ = "tb_jifen_order"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    product_id = Column(Integer, index=True, nullable=False)
    product_name = Column(String(200), default="")
    product_image = Column(String(500), default="")
    price = Column(Integer, default=0)
    quantity = Column(Integer, default=1)
    total_price = Column(Integer, default=0)
    status = Column(String(20), default="pending")
    receiver_name = Column(String(100), default="")
    receiver_phone = Column(String(20), default="")
    receiver_address = Column(String(500), default="")
    express_no = Column(String(100), default="")
    express_company = Column(String(100), default="")
    remark = Column(String(500), default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

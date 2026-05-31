from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class Item(Base):
    __tablename__ = "tb_feixingqi_model_item"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(50), nullable=False)
    item_type = Column(String(20))
    item_icon = Column(String(255))
    description = Column(Text)
    effect = Column(Text)
    price = Column(Integer, default=0)
    rarity = Column(String(20), default="common")
    status = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

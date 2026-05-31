from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from model.feixingqi_model.database import Base

class UserItem(Base):
    __tablename__ = "tb_feixingqi_model_user_item"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    item_id = Column(Integer, nullable=False)
    quantity = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

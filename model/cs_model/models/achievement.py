from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..database.db import Base

class Achievement(Base):
    __tablename__ = "tb_cs_model_achievement"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(500), default="")
    type = Column(String(30), default="kill")
    target_value = Column(Integer, default=0)
    icon = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

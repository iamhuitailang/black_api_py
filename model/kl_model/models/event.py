from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Event(Base):
    __tablename__ = "tb_kl_model_event"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, default="")
    severity = Column(String(20), default="normal")
    dinosaur_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur.id"), nullable=True)
    habitat_id = Column(Integer, ForeignKey("tb_kl_model_habitat.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    reward_coins = Column(Integer, default=0)
    penalty_coins = Column(Integer, default=0)
    reputation_change = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

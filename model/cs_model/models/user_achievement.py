from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database.db import Base

class UserAchievement(Base):
    __tablename__ = "tb_cs_model_user_achievement"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_cs_model_user.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("tb_cs_model_achievement.id"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database.config import Base


class Skill(Base):
    __tablename__ = "tb_bet_model_skill"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    type = Column(String(20), default="attack")
    damage = Column(Float, default=25.0)
    cooldown = Column(Float, default=10.0)
    bullet_count = Column(Integer, default=3)
    description = Column(String(255), nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

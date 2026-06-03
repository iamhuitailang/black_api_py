from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Ruin(Base):
    __tablename__ = "tb_hy_model_ruin"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    image = Column(String(255), default="")
    depth = Column(Float, default=500.0)
    difficulty = Column(String(20), default="easy")
    treasure_reward = Column(Integer, default=0)
    exp_reward = Column(Integer, default=100)
    required_level = Column(Integer, default=1)
    is_discovered = Column(Integer, default=0)
    story = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

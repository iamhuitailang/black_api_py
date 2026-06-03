from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Behavior(Base):
    __tablename__ = "tb_kl_model_behavior"

    id = Column(Integer, primary_key=True, index=True)
    dinosaur_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur.id"), nullable=False)
    behavior_type = Column(String(50), nullable=False)
    description = Column(Text, default="")
    duration = Column(Integer, default=60)
    energy_cost = Column(Integer, default=10)
    hunger_change = Column(Integer, default=0)
    happiness_change = Column(Integer, default=0)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    target_dinosaur_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BehaviorTemplate(Base):
    __tablename__ = "tb_kl_model_behavior_template"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, default="")
    min_aggression = Column(Integer, default=0)
    max_aggression = Column(Integer, default=100)
    min_hunger = Column(Integer, default=0)
    min_energy = Column(Integer, default=0)
    duration_min = Column(Integer, default=10)
    duration_max = Column(Integer, default=120)
    energy_cost = Column(Integer, default=5)
    hunger_change = Column(Integer, default=0)
    happiness_change = Column(Integer, default=0)
    probability = Column(Float, default=0.1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class DinosaurSpecies(Base):
    __tablename__ = "tb_kl_model_dinosaur_species"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    era = Column(String(50), nullable=False)
    diet = Column(String(20), nullable=False)
    height = Column(Float, nullable=False)
    length = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    aggression = Column(Integer, default=50)
    intelligence = Column(Integer, default=50)
    speed = Column(Integer, default=50)
    rarity = Column(String(20), default="common")
    fossil_cost = Column(Integer, default=100)
    clone_cost = Column(Float, default=1000.0)
    habitat_type = Column(String(50), nullable=False)
    description = Column(Text, default="")
    image = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

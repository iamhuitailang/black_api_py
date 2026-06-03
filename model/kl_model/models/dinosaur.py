from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Dinosaur(Base):
    __tablename__ = "tb_kl_model_dinosaur"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    park_id = Column(Integer, ForeignKey("tb_kl_model_park.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur_species.id"), nullable=False)
    habitat_id = Column(Integer, ForeignKey("tb_kl_model_habitat.id"), nullable=True)
    name = Column(String(100), nullable=False)
    gender = Column(String(10), default="unknown")
    age = Column(Integer, default=0)
    health = Column(Integer, default=100)
    hunger = Column(Integer, default=100)
    happiness = Column(Integer, default=100)
    energy = Column(Integer, default=100)
    is_genetically_modified = Column(Boolean, default=False)
    gene_modifications = Column(Text, default="{}")
    aggression = Column(Integer, default=50)
    intelligence = Column(Integer, default=50)
    speed = Column(Integer, default=50)
    status = Column(String(20), default="healthy")
    behavior = Column(String(50), default="idle")
    last_fed = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

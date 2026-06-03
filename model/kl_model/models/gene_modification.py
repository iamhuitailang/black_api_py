from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class GeneModification(Base):
    __tablename__ = "tb_kl_model_gene_modification"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, default="")
    type = Column(String(50), nullable=False)
    effect_aggression = Column(Integer, default=0)
    effect_intelligence = Column(Integer, default=0)
    effect_speed = Column(Integer, default=0)
    effect_health = Column(Integer, default=0)
    effect_size = Column(Float, default=0.0)
    rarity = Column(String(20), default="common")
    cost_coins = Column(Float, default=0.0)
    cost_diamonds = Column(Float, default=0.0)
    success_rate = Column(Float, default=0.7)
    is_unlockable = Column(Boolean, default=True)
    unlock_level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DinosaurGeneModification(Base):
    __tablename__ = "tb_kl_model_dinosaur_gene_mod"

    id = Column(Integer, primary_key=True, index=True)
    dinosaur_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur.id"), nullable=False)
    gene_modification_id = Column(Integer, ForeignKey("tb_kl_model_gene_modification.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

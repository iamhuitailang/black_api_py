from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Fossil(Base):
    __tablename__ = "tb_kl_model_fossil"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("tb_kl_model_dinosaur_species.id"), nullable=False)
    quality = Column(Integer, default=1)
    is_complete = Column(Boolean, default=False)
    fragments = Column(Integer, default=1)
    fragments_needed = Column(Integer, default=5)
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(String(100), default="")

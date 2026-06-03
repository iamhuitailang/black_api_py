from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Share(Base):
    __tablename__ = "tb_kl_model_share"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    share_type = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text, default="")
    related_id = Column(Integer, nullable=True)
    related_type = Column(String(50), nullable=True)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    visibility = Column(String(20), default="public")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShareInteraction(Base):
    __tablename__ = "tb_kl_model_share_interaction"

    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(Integer, ForeignKey("tb_kl_model_share.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    interaction_type = Column(String(20), nullable=False)
    comment = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

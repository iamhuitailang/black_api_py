from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from model.kl_model.database.db import Base


class Friend(Base):
    __tablename__ = "tb_kl_model_friend"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    status = Column(String(20), default="pending")
    friendship_level = Column(Integer, default=1)
    interaction_count = Column(Integer, default=0)
    last_interaction = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FriendInvite(Base):
    __tablename__ = "tb_kl_model_friend_invite"

    id = Column(Integer, primary_key=True, index=True)
    inviter_id = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=False)
    invitee_email = Column(String(100), nullable=False)
    invite_code = Column(String(50), unique=True, nullable=False)
    message = Column(Text, default="")
    is_accepted = Column(Boolean, default=False)
    accepted_by = Column(Integer, ForeignKey("tb_kl_model_user.id"), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Invite(Base):
    __tablename__ = "tb_jifen_invite"

    id = Column(Integer, primary_key=True, index=True)
    inviter_id = Column(Integer, index=True, nullable=False)
    invitee_id = Column(Integer, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

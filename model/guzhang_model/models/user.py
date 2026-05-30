from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from utils.database import Base


class TbGuzhangModelUser(Base):
    __tablename__ = "tb_guzhang_model_user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码")
    nickname = Column(String(50), comment="昵称")
    avatar = Column(String(255), comment="头像")
    total_games = Column(Integer, default=0, comment="总游戏次数")
    total_wins = Column(Integer, default=0, comment="胜利次数")
    highest_score = Column(Float, default=0, comment="最高得分")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

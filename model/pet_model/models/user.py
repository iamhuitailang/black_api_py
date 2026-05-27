from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from model.pet_model.core.database import Base


class User(Base):
    __tablename__ = "tb_pet_model_user"

    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    username = Column(String(50), unique=True, index=True, comment="用户名")
    password = Column(String(255), comment="密码")
    nickname = Column(String(50), comment="昵称")
    avatar = Column(String(255), comment="头像")
    phone = Column(String(20), unique=True, comment="手机号")
    email = Column(String(100), comment="邮箱")
    role = Column(String(20), default="user", comment="角色: user(普通用户)/adopter(领养人)/sender(送养人)/admin(管理员)")
    status = Column(Integer, default=1, comment="状态: 1正常 0禁用")
    address = Column(String(255), comment="地址")
    description = Column(Text, comment="个人描述")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

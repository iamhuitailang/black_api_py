from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from model.pet_model.core.database import Base


class Pet(Base):
    __tablename__ = "tb_pet_model_pet"

    id = Column(Integer, primary_key=True, index=True, comment="宠物ID")
    name = Column(String(50), comment="宠物名称")
    breed = Column(String(50), comment="品种")
    type = Column(String(20), comment="宠物类型: dog/cat/other")
    age = Column(Integer, comment="年龄(月)")
    gender = Column(String(10), comment="性别: male/female")
    weight = Column(Float, comment="体重(kg)")
    color = Column(String(50), comment="颜色")
    vaccinated = Column(Integer, default=0, comment="是否接种疫苗: 0否 1是")
    sterilized = Column(Integer, default=0, comment="是否绝育: 0否 1是")
    dewormed = Column(Integer, default=0, comment="是否驱虫: 0否 1是")
    description = Column(Text, comment="宠物描述")
    images = Column(Text, comment="宠物图片，多个用逗号分隔")
    status = Column(String(20), default="pending", comment="状态: pending(待审核)/available(可领养)/adopted(已领养)/rejected(已拒绝)")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="送养人ID")
    address = Column(String(255), comment="所在地址")
    view_count = Column(Integer, default=0, comment="浏览次数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    owner = relationship("User", foreign_keys=[user_id])

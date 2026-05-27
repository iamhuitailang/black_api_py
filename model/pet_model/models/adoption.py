from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from model.pet_model.core.database import Base


class AdoptionApplication(Base):
    __tablename__ = "tb_pet_model_adoption_application"

    id = Column(Integer, primary_key=True, index=True, comment="申请ID")
    pet_id = Column(Integer, ForeignKey("tb_pet_model_pet.id"), comment="宠物ID")
    applicant_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="申请人ID")
    reason = Column(Text, comment="领养理由")
    experience = Column(Text, comment="养宠经验")
    living_condition = Column(Text, comment="居住条件")
    work_situation = Column(Text, comment="工作情况")
    family_members = Column(String(255), comment="家庭成员")
    has_other_pets = Column(Integer, default=0, comment="是否有其他宠物: 0否 1是")
    agreement = Column(Integer, default=0, comment="是否同意协议: 0否 1是")
    status = Column(String(20), default="pending", comment="状态: pending(待审核)/approved(已通过)/rejected(已拒绝)/completed(已完成)")
    reject_reason = Column(Text, comment="拒绝理由")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    pet = relationship("Pet")
    applicant = relationship("User", foreign_keys=[applicant_id])


class AdoptionFeedback(Base):
    __tablename__ = "tb_pet_model_adoption_feedback"

    id = Column(Integer, primary_key=True, index=True, comment="反馈ID")
    application_id = Column(Integer, ForeignKey("tb_pet_model_adoption_application.id"), comment="申请ID")
    pet_id = Column(Integer, ForeignKey("tb_pet_model_pet.id"), comment="宠物ID")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="反馈人ID")
    content = Column(Text, comment="反馈内容")
    images = Column(Text, comment="反馈图片，多个用逗号分隔")
    rating = Column(Integer, comment="评分: 1-5")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    application = relationship("AdoptionApplication")
    pet = relationship("Pet")
    user = relationship("User")


class AdoptionAgreement(Base):
    __tablename__ = "tb_pet_model_adoption_agreement"

    id = Column(Integer, primary_key=True, index=True, comment="协议ID")
    title = Column(String(255), comment="协议标题")
    content = Column(Text, comment="协议内容")
    version = Column(String(20), comment="版本号")
    status = Column(Integer, default=1, comment="状态: 1启用 0禁用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

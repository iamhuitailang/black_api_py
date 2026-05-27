from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from model.pet_model.core.database import Base


class Favorite(Base):
    __tablename__ = "tb_pet_model_favorite"

    id = Column(Integer, primary_key=True, index=True, comment="收藏ID")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="用户ID")
    pet_id = Column(Integer, ForeignKey("tb_pet_model_pet.id"), comment="宠物ID")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    user = relationship("User")
    pet = relationship("Pet")


class Message(Base):
    __tablename__ = "tb_pet_model_message"

    id = Column(Integer, primary_key=True, index=True, comment="消息ID")
    sender_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="发送人ID")
    receiver_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="接收人ID")
    content = Column(Text, comment="消息内容")
    type = Column(String(20), default="text", comment="消息类型: text/image")
    is_read = Column(Integer, default=0, comment="是否已读: 0否 1是")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class Review(Base):
    __tablename__ = "tb_pet_model_review"

    id = Column(Integer, primary_key=True, index=True, comment="评价ID")
    pet_id = Column(Integer, ForeignKey("tb_pet_model_pet.id"), comment="宠物ID")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="评价人ID")
    content = Column(Text, comment="评价内容")
    rating = Column(Integer, comment="评分: 1-5")
    images = Column(Text, comment="评价图片，多个用逗号分隔")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    pet = relationship("Pet")
    user = relationship("User")


class Question(Base):
    __tablename__ = "tb_pet_model_question"

    id = Column(Integer, primary_key=True, index=True, comment="问题ID")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="提问人ID")
    title = Column(String(255), comment="问题标题")
    content = Column(Text, comment="问题内容")
    images = Column(Text, comment="问题图片，多个用逗号分隔")
    view_count = Column(Integer, default=0, comment="浏览次数")
    status = Column(Integer, default=1, comment="状态: 1正常 0删除")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    user = relationship("User")


class Answer(Base):
    __tablename__ = "tb_pet_model_answer"

    id = Column(Integer, primary_key=True, index=True, comment="回答ID")
    question_id = Column(Integer, ForeignKey("tb_pet_model_question.id"), comment="问题ID")
    user_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="回答人ID")
    content = Column(Text, comment="回答内容")
    images = Column(Text, comment="回答图片，多个用逗号分隔")
    like_count = Column(Integer, default=0, comment="点赞数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    question = relationship("Question")
    user = relationship("User")


class Article(Base):
    __tablename__ = "tb_pet_model_article"

    id = Column(Integer, primary_key=True, index=True, comment="文章ID")
    title = Column(String(255), comment="文章标题")
    content = Column(Text, comment="文章内容")
    cover = Column(String(255), comment="封面图")
    category = Column(String(50), comment="分类: knowledge/guide/news")
    view_count = Column(Integer, default=0, comment="浏览次数")
    status = Column(Integer, default=1, comment="状态: 1正常 0下架")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class Notice(Base):
    __tablename__ = "tb_pet_model_notice"

    id = Column(Integer, primary_key=True, index=True, comment="公告ID")
    title = Column(String(255), comment="公告标题")
    content = Column(Text, comment="公告内容")
    type = Column(String(20), default="system", comment="类型: system/activity")
    status = Column(Integer, default=1, comment="状态: 1正常 0关闭")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")


class Report(Base):
    __tablename__ = "tb_pet_model_report"

    id = Column(Integer, primary_key=True, index=True, comment="举报ID")
    reporter_id = Column(Integer, ForeignKey("tb_pet_model_user.id"), comment="举报人ID")
    target_type = Column(String(20), comment="举报类型: pet/user/comment")
    target_id = Column(Integer, comment="举报目标ID")
    reason = Column(String(255), comment="举报原因")
    description = Column(Text, comment="详细描述")
    images = Column(Text, comment="举报图片，多个用逗号分隔")
    status = Column(String(20), default="pending", comment="状态: pending(待处理)/resolved(已处理)/rejected(已驳回)")
    handle_result = Column(Text, comment="处理结果")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    reporter = relationship("User")

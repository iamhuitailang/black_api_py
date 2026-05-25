from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from ..core.database import Base


class Novel(Base):
    __tablename__ = "tb_xiaoshuo_novel"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="书名")
    author = Column(String(100), nullable=False, comment="作者")
    cover = Column(String(500), default="", comment="封面图片URL")
    category_id = Column(Integer, ForeignKey("tb_xiaoshuo_category.id"), comment="分类ID")
    status = Column(String(20), default="连载中", comment="状态: 连载中/已完结")
    word_count = Column(Integer, default=0, comment="总字数")
    rating = Column(Float, default=0.0, comment="评分")
    description = Column(Text, default="", comment="小说简介")
    is_hot = Column(Boolean, default=False, comment="是否热门")
    is_recommend = Column(Boolean, default=False, comment="是否推荐")
    is_finished = Column(Boolean, default=False, comment="是否完本推荐")
    click_count = Column(Integer, default=0, comment="点击量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    chapters = relationship("Chapter", back_populates="novel", cascade="all, delete-orphan")
    shelf_items = relationship("ShelfItem", back_populates="novel", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="novel", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "cover": self.cover,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "",
            "status": self.status,
            "word_count": self.word_count,
            "rating": self.rating,
            "description": self.description,
            "is_hot": self.is_hot,
            "is_recommend": self.is_recommend,
            "is_finished": self.is_finished,
            "click_count": self.click_count,
            "chapter_count": len(self.chapters) if self.chapters else 0,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else "",
        }


class Chapter(Base):
    __tablename__ = "tb_xiaoshuo_chapter"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    chapter_no = Column(Integer, nullable=False, comment="章节序号")
    title = Column(String(200), nullable=False, comment="章节标题")
    content = Column(Text, default="", comment="章节正文")
    word_count = Column(Integer, default=0, comment="章节字数")
    is_free = Column(Boolean, default=True, comment="是否免费")
    is_cached = Column(Boolean, default=False, comment="是否已离线缓存")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    novel = relationship("Novel", back_populates="chapters")

    def to_dict(self):
        return {
            "id": self.id,
            "novel_id": self.novel_id,
            "chapter_no": self.chapter_no,
            "title": self.title,
            "content": self.content,
            "word_count": self.word_count,
            "is_free": self.is_free,
            "is_cached": self.is_cached,
        }

    def to_dict_simple(self):
        return {
            "id": self.id,
            "novel_id": self.novel_id,
            "chapter_no": self.chapter_no,
            "title": self.title,
            "word_count": self.word_count,
        }


class Category(Base):
    __tablename__ = "tb_xiaoshuo_category"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    name = Column(String(50), nullable=False, unique=True, comment="分类名称")
    icon = Column(String(50), default="📚", comment="分类图标")
    sort = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    novels = relationship("Novel", backref="category")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "sort": self.sort,
            "novel_count": len(self.novels) if self.novels else 0,
        }


class ShelfItem(Base):
    __tablename__ = "tb_xiaoshuo_shelf"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(Integer, default=1, comment="用户ID")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    group_name = Column(String(50), default="默认分组", comment="分组名称")
    last_read_chapter_id = Column(Integer, nullable=True, comment="最后阅读章节ID")
    last_read_position = Column(Float, default=0.0, comment="最后阅读进度(0-1)")
    total_read_seconds = Column(Integer, default=0, comment="总阅读时长(秒)")
    is_pinned = Column(Boolean, default=False, comment="是否置顶")
    created_at = Column(DateTime, default=datetime.now, comment="加入时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    novel = relationship("Novel", back_populates="shelf_items")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "novel_id": self.novel_id,
            "novel_title": self.novel.title if self.novel else "",
            "novel_cover": self.novel.cover if self.novel else "",
            "novel_author": self.novel.author if self.novel else "",
            "group_name": self.group_name,
            "last_read_chapter_id": self.last_read_chapter_id,
            "last_read_position": self.last_read_position,
            "total_read_seconds": self.total_read_seconds,
            "is_pinned": self.is_pinned,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else "",
        }


class ReadingRecord(Base):
    __tablename__ = "tb_xiaoshuo_reading_record"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(Integer, default=1, comment="用户ID")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    chapter_id = Column(Integer, ForeignKey("tb_xiaoshuo_chapter.id"), nullable=False, comment="章节ID")
    position = Column(Float, default=0.0, comment="阅读进度(0-1)")
    scroll_position = Column(Integer, default=0, comment="滚动位置(像素)")
    read_seconds = Column(Integer, default=0, comment="本次阅读时长")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "novel_id": self.novel_id,
            "chapter_id": self.chapter_id,
            "position": self.position,
            "scroll_position": self.scroll_position,
            "read_seconds": self.read_seconds,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
        }


class Bookmark(Base):
    __tablename__ = "tb_xiaoshuo_bookmark"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(Integer, default=1, comment="用户ID")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    chapter_id = Column(Integer, ForeignKey("tb_xiaoshuo_chapter.id"), nullable=False, comment="章节ID")
    title = Column(String(200), default="", comment="书签标题")
    position = Column(Float, default=0.0, comment="阅读进度位置")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "novel_id": self.novel_id,
            "chapter_id": self.chapter_id,
            "title": self.title,
            "position": self.position,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
        }


class Comment(Base):
    __tablename__ = "tb_xiaoshuo_comment"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(Integer, default=1, comment="用户ID")
    user_name = Column(String(50), default="匿名用户", comment="用户名")
    user_avatar = Column(String(500), default="", comment="头像")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    content = Column(Text, default="", comment="评论内容")
    rating = Column(Integer, default=5, comment="评分(1-5)")
    like_count = Column(Integer, default=0, comment="点赞数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    novel = relationship("Novel", back_populates="comments")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "user_avatar": self.user_avatar,
            "novel_id": self.novel_id,
            "content": self.content,
            "rating": self.rating,
            "like_count": self.like_count,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
        }


class Banner(Base):
    __tablename__ = "tb_xiaoshuo_banner"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="标题")
    image = Column(String(500), nullable=False, comment="图片URL")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=True, comment="关联小说ID")
    link = Column(String(500), default="", comment="跳转链接")
    sort = Column(Integer, default=0, comment="排序")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "image": self.image,
            "novel_id": self.novel_id,
            "link": self.link,
            "sort": self.sort,
            "is_active": self.is_active,
        }


class OfflineCache(Base):
    __tablename__ = "tb_xiaoshuo_offline_cache"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    user_id = Column(Integer, default=1, comment="用户ID")
    novel_id = Column(Integer, ForeignKey("tb_xiaoshuo_novel.id"), nullable=False, comment="小说ID")
    chapter_id = Column(Integer, ForeignKey("tb_xiaoshuo_chapter.id"), nullable=False, comment="章节ID", unique=True)
    cached_at = Column(DateTime, default=datetime.now, comment="缓存时间")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "novel_id": self.novel_id,
            "chapter_id": self.chapter_id,
            "cached_at": self.cached_at.strftime("%Y-%m-%d %H:%M:%S") if self.cached_at else "",
        }

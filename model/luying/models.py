from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "tb_luying_user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    nickname = Column(String(100), nullable=True)
    avatar = Column(String(500), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String(20), default="user")
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plans = relationship("CampingPlan", back_populates="user", cascade="all, delete-orphan")
    equipments = relationship("Equipment", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")
    following = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")


class CampingPlan(Base):
    __tablename__ = "tb_luying_plan"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    title = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=True)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    status = Column(Integer, default=0)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="plans")
    items = relationship("PlanItem", back_populates="plan", cascade="all, delete-orphan")


class PlanItem(Base):
    __tablename__ = "tb_luying_plan_item"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(Integer, ForeignKey("tb_luying_plan.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)
    quantity = Column(Integer, default=1)
    is_checked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan = relationship("CampingPlan", back_populates="items")


class Equipment(Base):
    __tablename__ = "tb_luying_equipment"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    weight = Column(Float, nullable=True)
    price = Column(Float, nullable=True)
    purchase_date = Column(String(20), nullable=True)
    image = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    condition = Column(String(50), default="good")
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="equipments")


class Campsite(Base):
    __tablename__ = "tb_luying_campsite"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    location = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    images = Column(Text, nullable=True)
    facilities = Column(Text, nullable=True)
    best_season = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=True)
    price_info = Column(String(200), nullable=True)
    tips = Column(Text, nullable=True)
    status = Column(Integer, default=1)
    view_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews = relationship("Review", back_populates="campsite", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="campsite", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "tb_luying_review"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    campsite_id = Column(Integer, ForeignKey("tb_luying_campsite.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    rating = Column(Integer, default=5)
    content = Column(Text, nullable=True)
    images = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campsite = relationship("Campsite", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class Favorite(Base):
    __tablename__ = "tb_luying_favorite"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    campsite_id = Column(Integer, ForeignKey("tb_luying_campsite.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campsite = relationship("Campsite", back_populates="favorites")
    user = relationship("User", back_populates="favorites")


class Post(Base):
    __tablename__ = "tb_luying_post"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    images = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    view_count = Column(Integer, default=0)
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "tb_luying_comment"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("tb_luying_post.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Like(Base):
    __tablename__ = "tb_luying_like"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("tb_luying_post.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")


class Follow(Base):
    __tablename__ = "tb_luying_follow"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    follower_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("tb_luying_user.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="followers")
    following = relationship("User", foreign_keys=[following_id], back_populates="following")

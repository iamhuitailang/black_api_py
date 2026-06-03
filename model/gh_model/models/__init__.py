from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "tb_gh_model_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    coins = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    game_state = relationship("UserGameState", back_populates="user", uselist=False)
    tasks = relationship("UserTask", back_populates="user")
    evidence = relationship("UserEvidence", back_populates="user")
    inventory = relationship("UserInventory", back_populates="user")


class GhostType(Base):
    __tablename__ = "tb_gh_model_ghost_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    difficulty = Column(Integer, default=1)
    weakness = Column(String(100))
    evidence_required = Column(Integer, default=3)
    behavior = Column(Text)


class Location(Base):
    __tablename__ = "tb_gh_model_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    difficulty = Column(Integer, default=1)
    is_night = Column(Boolean, default=False)
    ghost_count = Column(Integer, default=1)
    unlocked_level = Column(Integer, default=1)


class Equipment(Base):
    __tablename__ = "tb_gh_model_equipments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    type = Column(String(20))
    description = Column(Text)
    level = Column(Integer, default=1)
    max_level = Column(Integer, default=5)
    power = Column(Integer, default=10)
    price = Column(Integer, default=50)
    upgrade_cost = Column(Integer, default=100)
    effect = Column(String(100))


class Task(Base):
    __tablename__ = "tb_gh_model_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    location_id = Column(Integer, ForeignKey("tb_gh_model_locations.id"))
    ghost_type_id = Column(Integer, ForeignKey("tb_gh_model_ghost_types.id"))
    reward_coins = Column(Integer, default=50)
    reward_exp = Column(Integer, default=20)
    difficulty = Column(Integer, default=1)
    story = Column(Text)


class EvidenceType(Base):
    __tablename__ = "tb_gh_model_evidence_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    icon = Column(String(50))


class UserGameState(Base):
    __tablename__ = "tb_gh_model_user_game_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_gh_model_users.id"), unique=True)
    current_location_id = Column(Integer, ForeignKey("tb_gh_model_locations.id"))
    current_task_id = Column(Integer, ForeignKey("tb_gh_model_tasks.id"))
    is_exploring = Column(Boolean, default=False)
    ghost_found = Column(Boolean, default=False)
    evidence_collected = Column(Integer, default=0)
    sanity = Column(Integer, default=100)
    game_time = Column(String(20), default="day")

    user = relationship("User", back_populates="game_state")


class UserTask(Base):
    __tablename__ = "tb_gh_model_user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_gh_model_users.id"))
    task_id = Column(Integer, ForeignKey("tb_gh_model_tasks.id"))
    status = Column(String(20), default="pending")
    progress = Column(Integer, default=0)
    completed_at = Column(DateTime)
    ghost_identified = Column(String(50))

    user = relationship("User", back_populates="tasks")


class UserEvidence(Base):
    __tablename__ = "tb_gh_model_user_evidences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_gh_model_users.id"))
    evidence_type_id = Column(Integer, ForeignKey("tb_gh_model_evidence_types.id"))
    location_id = Column(Integer, ForeignKey("tb_gh_model_locations.id"))
    task_id = Column(Integer, ForeignKey("tb_gh_model_tasks.id"))
    collected_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    user = relationship("User", back_populates="evidence")


class UserInventory(Base):
    __tablename__ = "tb_gh_model_user_inventories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_gh_model_users.id"))
    equipment_id = Column(Integer, ForeignKey("tb_gh_model_equipments.id"))
    level = Column(Integer, default=1)
    is_equipped = Column(Boolean, default=False)

    user = relationship("User", back_populates="inventory")


class GhostArchive(Base):
    __tablename__ = "tb_gh_model_ghost_archives"

    id = Column(Integer, primary_key=True, index=True)
    ghost_type_id = Column(Integer, ForeignKey("tb_gh_model_ghost_types.id"))
    user_id = Column(Integer, ForeignKey("tb_gh_model_users.id"))
    discovered = Column(Boolean, default=False)
    encounters = Column(Integer, default=0)
    defeated = Column(Integer, default=0)
    story_unlocked = Column(Text)

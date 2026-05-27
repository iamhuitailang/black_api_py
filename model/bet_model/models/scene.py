from sqlalchemy import Column, Integer, String, Text
from database.config import Base


class Scene(Base):
    __tablename__ = "tb_bet_model_scene"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    background_color = Column(String(20), default="#0a0a1a")
    ground_color = Column(String(20), default="#1a1a2e")
    accent_color = Column(String(20), default="#4a90d9")
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)

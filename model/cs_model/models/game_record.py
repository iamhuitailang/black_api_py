from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import func
from ..database.db import Base

class GameRecord(Base):
    __tablename__ = "tb_cs_model_game_record"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_cs_model_user.id"), nullable=False)
    map_id = Column(Integer, ForeignKey("tb_cs_model_map.id"))
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    damage_dealt = Column(Integer, default=0)
    headshots = Column(Integer, default=0)
    is_win = Column(Integer, default=0)
    game_duration = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

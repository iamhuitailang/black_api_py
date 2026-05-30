from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from utils.database import Base


class TbGuzhangModelGameRecord(Base):
    __tablename__ = "tb_guzhang_model_game_record"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("tb_guzhang_model_user.id"), comment="用户ID")
    player_score = Column(Float, default=0, comment="玩家得分")
    opponent_score = Column(Float, default=0, comment="对手得分")
    is_win = Column(Boolean, default=False, comment="是否胜利")
    duration = Column(Integer, default=0, comment="游戏时长(秒)")
    max_cheer = Column(Float, default=0, comment="最高喝彩值")
    combo_count = Column(Integer, default=0, comment="最大连击数")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

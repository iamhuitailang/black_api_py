from typing import Optional, List
from fastapi import Request, Query
from pydantic import BaseModel, Field
from app.business.shooter import ShooterBusiness


class GameRecordRequest(BaseModel):
    player_name: str = Field(..., max_length=50, description="玩家名称")
    final_health: int = Field(..., ge=0, le=100, description="剩余血量")
    time_used: float = Field(..., gt=0, description="用时(秒)")
    score: Optional[float] = Field(None, description="可选的分数，不传则自动计算")
    cleared: bool = Field(..., description="是否通关")
    sniper_used: List[int] = Field(default_factory=list, description="使用过的狙击位索引")
    enemies_killed: int = Field(0, ge=0, description="消灭敌人数")


class ShooterController:
    def __init__(self):
        self.business = ShooterBusiness()

    def ActionShooterRecordsPost(self, request: Request, body: GameRecordRequest):
        """
        提交游戏成绩
        POST /api/shooter/records/post
        """
        result = self.business.submit_record(
            player_name=body.player_name,
            final_health=body.final_health,
            time_used=body.time_used,
            cleared=body.cleared,
            sniper_used=body.sniper_used,
            enemies_killed=body.enemies_killed,
            score=body.score
        )
        return result

    def ActionShooterRecordsGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        查询单条游戏记录
        GET /api/shooter/records/get
        参数: id - 记录ID
        """
        result = self.business.get_record(id)
        return result

    def ActionShooterLeaderboardGet(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜TOP10
        GET /api/shooter/leaderboard/get
        参数: limit - 排名数量
        """
        result = self.business.get_leaderboard(limit)
        return result

    def ActionShooterLeaderboardPersonalGet(self, request: Request, player_name: str = Query(..., max_length=50)):
        """
        获取个人最佳成绩
        GET /api/shooter/leaderboard/personal/get
        参数: player_name - 玩家名称
        """
        result = self.business.get_personal_best(player_name)
        return result

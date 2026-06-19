from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.swordsman import SwordsmanBusiness


class SaveProgressRequest(BaseModel):
    player_name: str
    strength: int
    agility: int
    will: int
    soul_stones: int
    current_area: int
    equipment: List[str]
    total_kills: int


class SubmitScoreRequest(BaseModel):
    player_name: str
    kills: int
    areas_cleared: int
    remaining_hp: int


class SwordsmanController:
    def __init__(self):
        self.business = SwordsmanBusiness()

    def ActionSwordsmanPlayerGet(self, request: Request, player_name: str = Query(..., min_length=1)):
        """
        获取或创建玩家角色
        GET /api/swordsman/player/get
        参数: player_name - 玩家名
        """
        return self.business.create_or_get_player(player_name)

    def ActionSwordsmanPlayerSave(self, request: Request, body: SaveProgressRequest):
        """
        保存玩家进度
        POST /api/swordsman/player/save
        """
        return self.business.save_player_progress(
            body.player_name,
            body.strength,
            body.agility,
            body.will,
            body.soul_stones,
            body.current_area,
            body.equipment,
            body.total_kills
        )

    def ActionSwordsmanEquipmentGet(self, request: Request):
        """
        获取所有装备列表
        GET /api/swordsman/equipment/get
        """
        return self.business.get_equipment_list()

    def ActionSwordsmanEquipmentGetarea(self, request: Request, area: int = Query(..., ge=0, le=4)):
        """
        获取指定区域装备
        GET /api/swordsman/equipment/getarea
        参数: area - 区域编号(0-4)
        """
        return self.business.get_equipment_by_area(area)

    def ActionSwordsmanScoreSubmit(self, request: Request, body: SubmitScoreRequest):
        """
        提交游戏得分
        POST /api/swordsman/score/submit
        """
        return self.business.submit_score(
            body.player_name,
            body.kills,
            body.areas_cleared,
            body.remaining_hp
        )

    def ActionSwordsmanLeaderboardGet(self, request: Request, page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100)):
        """
        获取排行榜（分页）
        GET /api/swordsman/leaderboard/get
        参数: page - 页码, page_size - 每页数量
        """
        return self.business.get_leaderboard(page, page_size)

    def ActionSwordsmanLeaderboardGettop(self, request: Request, limit: int = Query(10, ge=1, le=100)):
        """
        获取TOP排行榜
        GET /api/swordsman/leaderboard/gettop
        参数: limit - 数量
        """
        return self.business.get_top_leaderboard(limit)

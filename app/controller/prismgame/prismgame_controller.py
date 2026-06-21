from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request, Body
from pydantic import BaseModel
from app.business.prismgame import LevelBusiness, GameBusiness, ScoreboardBusiness


class CreateLevelRequest(BaseModel):
    name: str
    level_number: int
    description: str = ''
    difficulty: str = 'normal'


class UpdateLevelRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None


class SaveSolutionRequest(BaseModel):
    level_id: int
    player_name: str = 'Anonymous'
    rotations_used: int = 0
    is_success: bool = False
    light_path: str = ''
    prism_rotations: str = ''
    light_intensity: float = 1.0


class ValidatePathRequest(BaseModel):
    level_id: int
    prism_rotations: List[Dict[str, Any]] = []


class AddScoreRequest(BaseModel):
    player_name: str
    score: int
    rotations: int = 0
    level_cleared: bool = False


class PrismgameController:
    def __init__(self):
        self.level_business = LevelBusiness()
        self.game_business = GameBusiness()
        self.scoreboard_business = ScoreboardBusiness()

    def ActionPrismgameLevelsGet(self, request: Request):
        """
        获取所有关卡列表
        GET /api/prismgame/levels/get
        """
        return self.level_business.get_all_levels()

    def ActionPrismgameLevelGet(self, request: Request, 
                                level_id: Optional[int] = Query(None, ge=1),
                                level_number: Optional[int] = Query(None, ge=1)):
        """
        获取关卡详情
        GET /api/prismgame/level/get
        参数: level_id 或 level_number
        """
        if level_id:
            return self.level_business.get_level_detail(level_id)
        elif level_number:
            return self.level_business.get_level_by_number(level_number)
        else:
            return {
                'code': 1,
                'message': 'level_id or level_number is required',
                'data': None
            }

    def ActionPrismgameLevelCreatePost(self, request: Request, body: CreateLevelRequest):
        """
        创建新关卡
        POST /api/prismgame/level/create
        """
        return self.level_business.create_level(
            name=body.name,
            level_number=body.level_number,
            description=body.description,
            difficulty=body.difficulty
        )

    def ActionPrismgameLevelUpdatePut(self, request: Request, body: UpdateLevelRequest,
                                    level_id: int = Query(..., ge=1)):
        """
        更新关卡信息
        PUT /api/prismgame/level/update
        """
        return self.level_business.update_level(
            level_id=level_id,
            name=body.name,
            description=body.description,
            difficulty=body.difficulty
        )

    def ActionPrismgameLevelDelete(self, request: Request, 
                                    level_id: int = Query(..., ge=1)):
        """
        删除关卡
        DELETE /api/prismgame/level/delete
        """
        return self.level_business.delete_level(level_id)

    def ActionPrismgameLevelsGeneratePost(self, request: Request):
        """
        生成默认关卡
        POST /api/prismgame/levels/generate
        """
        return self.level_business.generate_default_levels()

    def ActionPrismgameSolutionSavePost(self, request: Request, body: SaveSolutionRequest):
        """
        保存通关方案
        POST /api/prismgame/solution/save
        """
        return self.game_business.save_solution(
            level_id=body.level_id,
            player_name=body.player_name,
            rotations_used=body.rotations_used,
            is_success=body.is_success,
            light_path=body.light_path,
            prism_rotations=body.prism_rotations,
            light_intensity=body.light_intensity
        )

    def ActionPrismgameSolutionsGet(self, request: Request, 
                                     level_id: int = Query(..., ge=1),
                                     limit: int = Query(10, ge=1, le=100)):
        """
        获取关卡的通关方案列表
        GET /api/prismgame/solutions/get
        """
        return self.game_business.get_level_solutions(level_id, limit)

    def ActionPrismgameSolutionGet(self, request: Request, 
                                    solution_id: int = Query(..., ge=1)):
        """
        获取通关方案详情
        GET /api/prismgame/solution/get
        """
        return self.game_business.get_solution_detail(solution_id)

    def ActionPrismgameValidatePathPost(self, request: Request, body: ValidatePathRequest):
        """
        验证光路
        POST /api/prismgame/validate/path
        """
        return self.game_business.validate_light_path(
            level_id=body.level_id,
            prism_rotations=body.prism_rotations
        )

    def ActionPrismgameScoreboardTopGet(self, request: Request,
                                         limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜前列
        GET /api/prismgame/scoreboard/top/get
        """
        return self.scoreboard_business.get_top_scores(limit)

    def ActionPrismgameScoreboardPlayerGet(self, request: Request,
                                            player_name: str = Query(...)):
        """
        获取玩家排名信息
        GET /api/prismgame/scoreboard/player/get
        """
        return self.scoreboard_business.get_player_rank(player_name)

    def ActionPrismgameScoreboardAddPost(self, request: Request, body: AddScoreRequest):
        """
        添加分数到排行榜
        POST /api/prismgame/scoreboard/add
        """
        return self.scoreboard_business.add_score(
            player_name=body.player_name,
            score=body.score,
            rotations=body.rotations,
            level_cleared=body.level_cleared
        )

    def ActionPrismgameScoreboardListGet(self, request: Request,
                                          page: int = Query(1, ge=1),
                                          page_size: int = Query(10, ge=1, le=100)):
        """
        分页获取排行榜
        GET /api/prismgame/scoreboard/list/get
        """
        return self.scoreboard_business.get_paginated_scores(page, page_size)

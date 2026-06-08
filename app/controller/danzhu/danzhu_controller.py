from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.danzhu import (
    PinballBusiness,
    GameStateBusiness,
    ScoreBusiness,
    AchievementBusiness
)
from app.business.auth import AuthBusiness


class PinballConfigAddRequest(BaseModel):
    name: str = Field(..., description="机关名称")
    type: str = Field(..., description="机关类型：bumper/accelerator/rotator/portal_in/portal_out/multiplier/splitter")
    config_json: Optional[str] = Field(default='{}', description="配置JSON")
    position_json: Optional[str] = Field(default='{}', description="位置JSON")
    score: Optional[int] = Field(default=0, description="基础得分")
    sort_order: Optional[int] = Field(default=0, description="排序")
    is_active: Optional[int] = Field(default=1, description="是否启用")


class PinballConfigUpdateRequest(BaseModel):
    id: int = Field(..., description="配置ID")
    name: Optional[str] = Field(default=None, description="机关名称")
    type: Optional[str] = Field(default=None, description="机关类型")
    config_json: Optional[str] = Field(default=None, description="配置JSON")
    position_json: Optional[str] = Field(default=None, description="位置JSON")
    score: Optional[int] = Field(default=None, description="基础得分")
    sort_order: Optional[int] = Field(default=None, description="排序")
    is_active: Optional[int] = Field(default=None, description="是否启用")


class GameStateSaveRequest(BaseModel):
    state_json: str = Field(default='{}', description="游戏状态JSON")
    score: int = Field(default=0, description="当前分数")
    combo: int = Field(default=0, description="当前连击数")
    balls_left: int = Field(default=5, description="剩余弹珠数")
    highest_combo: int = Field(default=0, description="最高连击数")


class ScoreSubmitRequest(BaseModel):
    score: int = Field(..., description="最终得分")
    highest_combo: Optional[int] = Field(default=0, description="最高连击数")
    level_id: Optional[int] = Field(default=1, description="关卡ID")
    level_name: Optional[str] = Field(default='默认关卡', description="关卡名称")
    balls_used: Optional[int] = Field(default=0, description="使用弹珠数")


class AchievementCheckRequest(BaseModel):
    score: Optional[int] = Field(default=0, description="得分")
    highest_combo: Optional[int] = Field(default=0, description="最高连击")
    gadget_types: Optional[List[str]] = Field(default_factory=list, description="触发的机关类型列表")
    levels_played: Optional[List[int]] = Field(default_factory=list, description="游玩过的关卡ID列表")
    launch_count: Optional[int] = Field(default=0, description="本局发射次数")


class DanzhuController:
    def __init__(self):
        self.pinball_business = PinballBusiness()
        self.game_state_business = GameStateBusiness()
        self.score_business = ScoreBusiness()
        self.achievement_business = AchievementBusiness()
        self.auth_business = AuthBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _is_admin(self, token: str) -> bool:
        user = self.auth_business.verify_token(token)
        if not user:
            return False
        return user.get('role') == 'admin'

    def ActionDanzhuConfigListGet(self, request: Request):
        """
        获取机关配置列表（激活的）
        GET /api/danzhu/config/list/get
        """
        return self.pinball_business.get_configs(only_active=True)

    def ActionDanzhuConfigAllGet(self, request: Request,
                                 authorization: Optional[str] = Header(None)):
        """
        获取全部机关配置（管理员）
        GET /api/danzhu/config/all/get
        """
        token = self._get_token(request, authorization)
        if not self._is_admin(token):
            return {
                'code': 1,
                'message': '无权限',
                'data': None
            }
        return self.pinball_business.get_configs(only_active=False)

    def ActionDanzhuConfigItemGet(self, request: Request,
                                   id: int = Query(..., ge=1, description="配置ID")):
        """
        获取单个机关配置
        GET /api/danzhu/config/item/get
        """
        return self.pinball_business.get_config_by_id(id)

    def ActionDanzhuConfigItemAddPost(self, request: Request, body: PinballConfigAddRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        添加机关配置（管理员）
        POST /api/danzhu/config/item/add
        """
        token = self._get_token(request, authorization)
        if not self._is_admin(token):
            return {
                'code': 1,
                'message': '无权限',
                'data': None
            }
        return self.pinball_business.add_config(
            name=body.name,
            type=body.type,
            config_json=body.config_json or '{}',
            position_json=body.position_json or '{}',
            score=body.score or 0,
            sort_order=body.sort_order or 0,
            is_active=body.is_active if body.is_active is not None else 1
        )

    def ActionDanzhuConfigItemUpdatePost(self, request: Request, body: PinballConfigUpdateRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        更新机关配置（管理员）
        POST /api/danzhu/config/item/update
        """
        token = self._get_token(request, authorization)
        if not self._is_admin(token):
            return {
                'code': 1,
                'message': '无权限',
                'data': None
            }

        update_kwargs = {}
        for key in ['name', 'type', 'config_json', 'position_json', 'score', 'sort_order', 'is_active']:
            val = getattr(body, key, None)
            if val is not None:
                update_kwargs[key] = val

        return self.pinball_business.update_config(body.id, **update_kwargs)

    def ActionDanzhuConfigDelete(self, request: Request,
                                  id: int = Query(..., ge=1, description="配置ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除机关配置（管理员）
        DELETE /api/danzhu/config/delete
        """
        token = self._get_token(request, authorization)
        if not self._is_admin(token):
            return {
                'code': 1,
                'message': '无权限',
                'data': None
            }
        return self.pinball_business.delete_config(id)

    def ActionDanzhuGameStateSavePost(self, request: Request, body: GameStateSaveRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        保存游戏状态
        POST /api/danzhu/game/state/save
        """
        token = self._get_token(request, authorization)
        return self.game_state_business.save_state(
            token=token,
            state_json=body.state_json,
            score=body.score,
            combo=body.combo,
            balls_left=body.balls_left,
            highest_combo=body.highest_combo
        )

    def ActionDanzhuGameStateGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取游戏状态
        GET /api/danzhu/game/state/get
        """
        token = self._get_token(request, authorization)
        return self.game_state_business.get_state(token)

    def ActionDanzhuGameStateClearPost(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        清除游戏状态
        POST /api/danzhu/game/state/clear
        """
        token = self._get_token(request, authorization)
        return self.game_state_business.clear_state(token)

    def ActionDanzhuScoreSubmitPost(self, request: Request, body: ScoreSubmitRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        提交分数
        POST /api/danzhu/score/submit
        """
        token = self._get_token(request, authorization)
        return self.score_business.submit_score(
            token=token,
            score=body.score,
            highest_combo=body.highest_combo or 0,
            level_id=body.level_id or 1,
            level_name=body.level_name or '默认关卡',
            balls_used=body.balls_used or 0
        )

    def ActionDanzhuScoreLeaderboardGet(self, request: Request,
                                         period: str = Query(default='all', description="排行榜周期：all/daily/weekly"),
                                         limit: int = Query(default=50, description="数量限制")):
        """
        获取排行榜
        GET /api/danzhu/score/leaderboard/get
        """
        return self.score_business.get_leaderboard(period=period, limit=limit)

    def ActionDanzhuScoreBestGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户最高分
        GET /api/danzhu/score/best/get
        """
        token = self._get_token(request, authorization)
        return self.score_business.get_user_best(token)

    def ActionDanzhuScoreMyGet(self, request: Request,
                                authorization: Optional[str] = Header(None),
                                limit: int = Query(default=20, description="数量限制")):
        """
        获取我的分数记录
        GET /api/danzhu/score/my/get
        """
        token = self._get_token(request, authorization)
        return self.score_business.get_user_scores(token, limit=limit)

    def ActionDanzhuAchievementListGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取成就列表
        GET /api/danzhu/achievement/list/get
        """
        token = self._get_token(request, authorization)
        return self.achievement_business.get_all_achievements(token if token else None)

    def ActionDanzhuAchievementCheckPost(self, request: Request, body: AchievementCheckRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        检查成就解锁
        POST /api/danzhu/achievement/check
        """
        token = self._get_token(request, authorization)
        game_data = {
            'score': body.score or 0,
            'highest_combo': body.highest_combo or 0,
            'gadget_types': body.gadget_types or [],
            'levels_played': body.levels_played or [],
            'launch_count': body.launch_count or 0
        }
        return self.achievement_business.check_unlock_achievements(token, game_data)

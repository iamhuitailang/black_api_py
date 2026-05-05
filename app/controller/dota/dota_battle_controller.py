from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartBattleRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")
    stage_id: int = Field(..., description="关卡ID")


class ExecuteBattleRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")
    stage_id: int = Field(..., description="关卡ID")
    skill_id: Optional[int] = Field(None, description="技能ID，为空则普通攻击")
    target_index: Optional[int] = Field(0, description="目标敌人索引")


class AutoBattleRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")
    stage_id: int = Field(..., description="关卡ID")


class DotaBattleController:
    def __init__(self):
        from app.business.dota.battle_business import DotaBattleBusiness
        from app.business.dota.user_business import DotaUserBusiness
        self.battle_business = DotaBattleBusiness()
        self.user_business = DotaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDotaStageInfoGet(self, request: Request, stage_id: Optional[int] = Query(None, description="关卡ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取关卡信息接口
        GET /api/dota/stage/info/get
        获取指定关卡或当前关卡的详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_stage_info(user.get('id'), stage_id)

    def ActionDotaStageChapterGet(self, request: Request, chapter: int = Query(1, description="章节"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取章节关卡列表接口
        GET /api/dota/stage/chapter/get
        获取指定章节的所有关卡信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_chapter_stages(user.get('id'), chapter)

    def ActionDotaStageCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前关卡接口
        GET /api/dota/stage/current/get
        获取用户当前的关卡进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_current_stage(user.get('id'))

    def ActionDotaBattleStartPost(self, request: Request, body: StartBattleRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        开始战斗接口
        POST /api/dota/battle/start
        初始化战斗状态，返回英雄和敌人信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.start_battle(
            user.get('id'),
            body.hero_id,
            body.stage_id
        )

    def ActionDotaBattleRoundPost(self, request: Request, body: ExecuteBattleRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        执行战斗回合接口
        POST /api/dota/battle/round
        执行一个回合的战斗，包括玩家攻击和敌人反击
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.execute_battle_round(
            user.get('id'),
            body.hero_id,
            body.stage_id,
            body.skill_id,
            body.target_index or 0
        )

    def ActionDotaBattleAutoPost(self, request: Request, body: AutoBattleRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        自动战斗接口
        POST /api/dota/battle/auto
        自动完成整个战斗过程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.auto_battle(
            user.get('id'),
            body.hero_id,
            body.stage_id
        )

    def ActionDotaBattleHistoryGet(self, request: Request, limit: int = Query(20, description="返回数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取战斗历史接口
        GET /api/dota/battle/history/get
        获取用户的战斗历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_battle_history(user.get('id'), limit)

    def ActionDotaBattleStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取战斗统计接口
        GET /api/dota/battle/stats/get
        获取用户的战斗统计信息（胜率、总场次等）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_user_battle_stats(user.get('id'))

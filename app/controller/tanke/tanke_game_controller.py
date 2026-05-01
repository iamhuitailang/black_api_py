from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SaveGameResultRequest(BaseModel):
    wave: int = Field(..., description="到达波次")
    score: int = Field(..., description="本局得分")
    killed: int = Field(..., description="击杀数")


class TankeGameController:
    def __init__(self):
        from app.business.tanke.game_business import TankeGameBusiness
        self.game_business = TankeGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tanke.user_business import TankeUserBusiness
        user_business = TankeUserBusiness()
        return user_business.verify_token(token)

    def ActionTankeGameSavePost(self, request: Request, body: SaveGameResultRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        保存游戏结果接口
        POST /api/tanke/game/save
        保存游戏对局结果到服务器
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.save_game_result(
            user_id=user.get('id'),
            wave=body.wave,
            score=body.score,
            killed=body.killed
        )

    def ActionTankeGameRecordsGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取游戏记录接口
        GET /api/tanke/game/records/get
        获取当前用户的游戏历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_user_records(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionTankeGameHighScoreGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取最高分接口
        GET /api/tanke/game/high/score/get
        获取当前用户的历史最高分
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_user_high_score(user.get('id'))

    def ActionTankeGameLeaderboardGet(self, request: Request,
                                        limit: int = Query(10, description="排行榜数量")):
        """
        获取排行榜接口
        GET /api/tanke/game/leaderboard/get
        获取全服最高分排行榜
        """
        return self.game_business.get_leaderboard(limit=limit)

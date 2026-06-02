from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitGameRequest(BaseModel):
    score: int = Field(..., description="得分")
    duration: Optional[int] = Field(60, description="游戏时长(秒)")
    ores_collected: Optional[list] = Field(None, description="收集的矿石列表")


class HuangjinGameController:
    def __init__(self):
        from app.business.huangjin_model.game_business import GameBusiness
        self.game_business = GameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.huangjin_model.auth_business import HuangjinAuthBusiness
        return HuangjinAuthBusiness().verify_token(token)

    def ActionHuangjinGameStartGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        GET /api/huangjin/game/start/get
        获取游戏初始化数据（矿石列表、时间等）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.start_game(user.get('id'))

    def ActionHuangjinGameSubmitPost(self, request: Request, body: SubmitGameRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        提交游戏结果接口
        POST /api/huangjin/game/submit
        提交游戏结果，记录分数，检查成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.submit_game(
            user_id=user.get('id'),
            score=body.score,
            duration=body.duration or 60,
            ores_collected=body.ores_collected or []
        )

    def ActionHuangjinGameRecordsGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取游戏记录接口
        GET /api/huangjin/game/records/get
        获取当前用户的游戏记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.get_game_records(user.get('id'), page, page_size)

    def ActionHuangjinGameLeaderboardGet(self, request: Request,
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取排行榜接口
        GET /api/huangjin/game/leaderboard/get
        获取积分排行榜
        """
        return self.game_business.get_leaderboard(page, page_size)

    def ActionHuangjinGameAllRecordsGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         user_id: Optional[int] = Query(None, description="用户ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取所有游戏记录接口
        GET /api/huangjin/game/all/records/get
        管理员获取所有游戏记录
        """
        return self.game_business.get_all_records(page, page_size, user_id)

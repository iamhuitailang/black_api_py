from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartGameRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")


class CompleteGameRequest(BaseModel):
    record_id: int = Field(..., description="游戏记录ID")
    time_used: int = Field(..., description="用时(秒)")
    hints_used: int = Field(0, description="使用提示次数")
    differences_found: int = Field(0, description="找到不同点数")


class FailGameRequest(BaseModel):
    record_id: int = Field(..., description="游戏记录ID")
    time_used: int = Field(..., description="用时(秒)")
    hints_used: int = Field(0, description="使用提示次数")
    differences_found: int = Field(0, description="找到不同点数")


class ZbtGameController:
    def __init__(self):
        from app.business.zhaobutong.game_business import ZbtGameBusiness
        from app.business.zhaobutong.user_business import ZbtUserBusiness
        self.game_business = ZbtGameBusiness()
        self.user_business = ZbtUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionZbtGameStartPost(self, request: Request, body: StartGameRequest,
                                authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        POST /api/zbt/game/start
        选择关卡开始游戏，返回游戏数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.start_game(user.get('id'), body.level_id)

    def ActionZbtGameHintGet(self, request: Request, record_id: int = Query(..., description="游戏记录ID"),
                              authorization: Optional[str] = Header(None)):
        """
        获取提示接口
        GET /api/zbt/game/hint/get
        获取一个不同点的提示位置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.get_hint(record_id, user.get('id'))

    def ActionZbtGameCompletePost(self, request: Request, body: CompleteGameRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        完成游戏接口
        POST /api/zbt/game/complete
        提交游戏完成结果
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.complete_game(
            body.record_id, user.get('id'), body.time_used,
            body.hints_used, body.differences_found
        )

    def ActionZbtGameFailPost(self, request: Request, body: FailGameRequest,
                               authorization: Optional[str] = Header(None)):
        """
        游戏失败接口
        POST /api/zbt/game/fail
        提交游戏失败结果
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.fail_game(
            body.record_id, user.get('id'), body.time_used,
            body.hints_used, body.differences_found
        )

    def ActionZbtGameLeaderboardGet(self, request: Request,
                                     level_id: Optional[int] = Query(None, description="关卡ID"),
                                     limit: int = Query(50, ge=1, le=200, description="返回数量")):
        """
        排行榜接口
        GET /api/zbt/game/leaderboard/get
        获取用时排行榜
        """
        return self.game_business.get_leaderboard(level_id, limit)

    def ActionZbtGameRecordsGet(self, request: Request,
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的游戏记录接口
        GET /api/zbt/game/records/get
        获取当前用户的游戏记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.get_user_records(user.get('id'), status)

    def ActionZbtGameStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏统计接口
        GET /api/zbt/game/stats/get
        管理员获取游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user or user.get('role') != 1:
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.game_business.get_stats()

    def ActionZbtGameRecentGet(self, request: Request,
                                limit: int = Query(20, ge=1, le=100, description="返回数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取最近游戏记录接口
        GET /api/zbt/game/recent/get
        管理员获取最近游戏记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user or user.get('role') != 1:
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.game_business.get_recent_records(limit)

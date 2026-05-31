from typing import Optional
from fastapi import Request
from pydantic import BaseModel, Field
from app.business.chengyu_077.game_business import GameBusiness
from app.business.chengyu_077.user_business import ChengyuUserBusiness


class GameStartRequest(BaseModel):
    game_type: str = Field('classic', description="游戏类型")
    mode: str = Field('single', description="游戏模式")
    time_limit: int = Field(60, description="时间限制(秒)")


class GamePlayRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    idiom: str = Field(..., description="用户输入的成语")


class GameEndRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    won: bool = Field(False, description="是否获胜")


class ChengyuGameController:
    def __init__(self):
        self.business = GameBusiness()
        self.user_business = ChengyuUserBusiness()

    def _get_token(self, request: Request) -> str:
        auth = request.headers.get('authorization', '')
        if auth and auth.startswith('Bearer '):
            return auth[7:]
        return request.query_params.get('token', '')

    def _get_current_user_id(self, request: Request) -> Optional[int]:
        token = self._get_token(request)
        if not token:
            return None
        user = self.user_business.verify_token(token)
        if user:
            return user.get('id')
        return None

    def ActionChengyuGameStartPost(self, request: Request, body: GameStartRequest):
        """
        开始游戏
        POST /api/chengyu/game/start
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.start_game(user_id, body.game_type, body.mode, body.time_limit)

    def ActionChengyuGamePlayPost(self, request: Request, body: GamePlayRequest):
        """
        游戏接龙
        POST /api/chengyu/game/play
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.play_turn(user_id, body.game_id, body.idiom)

    def ActionChengyuGameEndPost(self, request: Request, body: GameEndRequest):
        """
        结束游戏
        POST /api/chengyu/game/end/post
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.end_game(user_id, body.game_id, body.won)

    def ActionChengyuGameLeaderboardGet(self, request: Request, game_type: Optional[str] = None, limit: int = 100):
        """
        获取排行榜（公开接口）
        GET /api/chengyu/game/leaderboard
        """
        return self.business.get_leaderboard(game_type, limit)

    def ActionChengyuGameMyscoresGet(self, request: Request):
        """
        获取我的游戏记录
        GET /api/chengyu/game/my-scores
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.get_my_scores(user_id)

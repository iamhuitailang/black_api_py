from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitScoreRequest(BaseModel):
    score: int = Field(..., description="分数")
    level: int = Field(..., description="关卡")
    combo: Optional[int] = Field(0, description="最大连击")
    duration: Optional[int] = Field(0, description="游戏时长(秒)")
    balls_fired: Optional[int] = Field(0, description="发射珠子数")
    balls_matched: Optional[int] = Field(0, description="消除珠子数")


class SaveGameStateRequest(BaseModel):
    game_state: Dict[str, Any] = Field(..., description="游戏状态")


class ZumaGameController:
    def __init__(self):
        from app.business.zuma.game_business import ZumaGameBusiness
        from app.business.zuma.user_business import ZumaUserBusiness
        self.game_business = ZumaGameBusiness()
        self.user_business = ZumaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionZumaGameScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        提交游戏分数接口
        POST /api/zuma/game/score/submit
        游戏结束后提交分数
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.submit_score(
            user_id=user.get('id'),
            score=body.score,
            level=body.level,
            combo=body.combo,
            duration=body.duration,
            balls_fired=body.balls_fired,
            balls_matched=body.balls_matched
        )

    def ActionZumaGameScoreTopGet(self, request: Request, limit: int = Query(100, description="获取数量")):
        """
        获取最高分排行榜接口
        GET /api/zuma/game/score/top
        获取历史最高分排行
        """
        return self.game_business.get_top_scores(limit)

    def ActionZumaGameScoreMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的游戏记录接口
        GET /api/zuma/game/score/my
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

        return self.game_business.get_user_scores(user.get('id'), page, page_size)

    def ActionZumaGameStateSavePost(self, request: Request, body: SaveGameStateRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        保存游戏状态接口
        POST /api/zuma/game/state/save
        保存当前游戏状态以便继续游戏
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.save_game_state(user.get('id'), body.game_state)

    def ActionZumaGameStateGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏状态接口
        GET /api/zuma/game/state/get
        获取保存的游戏状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_state(user.get('id'))

    def ActionZumaGameStateClearPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        清除游戏状态接口
        POST /api/zuma/game/state/clear
        清除保存的游戏状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.clear_game_state(user.get('id'))

from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.wordchain import GameBusiness
from app.business.auth import AuthBusiness


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class SubmitWordRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    word: str = Field(..., description="接龙词语")


class TimeoutRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class WordChainController:
    def __init__(self):
        self.game_business = GameBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.verify_token(token)

    def ActionWordchainRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/wordchain/register
        注册新用户
        """
        return self.game_business.register(
            username=body.username,
            password=body.password
        )

    def ActionWordchainGameStartPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        POST /api/wordchain/game/start
        开始新的词语接龙游戏，系统随机给出起始词
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.start_game(user_id=user.get('id'))

    def ActionWordchainGameSubmitPost(self, request: Request, body: SubmitWordRequest, authorization: Optional[str] = Header(None)):
        """
        提交词语接口
        POST /api/wordchain/game/submit
        玩家提交接龙词语，后端校验并计分
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.submit_word(
            user_id=user.get('id'),
            game_id=body.game_id,
            word=body.word
        )

    def ActionWordchainGameTimeoutPost(self, request: Request, body: TimeoutRequest, authorization: Optional[str] = Header(None)):
        """
        超时接口
        POST /api/wordchain/game/timeout
        玩家超时未作答，结束游戏
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.timeout(
            user_id=user.get('id'),
            game_id=body.game_id
        )

    def ActionWordchainGameHistoryGet(self, request: Request, game_id: int = Query(..., description="游戏ID"), authorization: Optional[str] = Header(None)):
        """
        获取游戏历史接口
        GET /api/wordchain/game/history/get
        获取指定游戏的接龙历史记录
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.get_game_history(
            user_id=user.get('id'),
            game_id=game_id
        )

    def ActionWordchainUserStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户统计接口
        GET /api/wordchain/user/stats/get
        获取当前用户的游戏统计数据
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.get_user_stats(user_id=user.get('id'))

    def ActionWordchainGameResumeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        恢复游戏接口
        GET /api/wordchain/game/resume/get
        获取当前用户未完成的游戏，用于刷新页面后恢复
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }
        
        return self.game_business.resume_game(user_id=user.get('id'))

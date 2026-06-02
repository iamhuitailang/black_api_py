from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):
    mode: Optional[str] = Field('5v5', description="游戏模式：5v5, 3v3, 1v1")


class JoinRoomRequest(BaseModel):
    room_id: str = Field(..., description="房间ID")


class SelectHeroRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    hero_id: int = Field(..., description="英雄ID")


class WangzheGameController:
    def __init__(self):
        from app.business.wangzhe_model.game_business import WangzheGameBusiness
        self.game_business = WangzheGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        user_business = WangzheUserBusiness()
        return user_business.verify_token(token)

    def ActionWangzheGameRoomCreatePost(self, request: Request, body: CreateRoomRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建房间接口
        POST /api/wangzhe/game/room/create
        创建游戏房间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.create_room(user.get('id'), body.mode)

    def ActionWangzheGameRoomJoinPost(self, request: Request, body: JoinRoomRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        加入房间接口
        POST /api/wangzhe/game/room/join
        加入游戏房间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.join_room(user.get('id'), body.room_id)

    def ActionWangzheGameHeroSelectPost(self, request: Request, body: SelectHeroRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        选择英雄接口
        POST /api/wangzhe/game/hero/select
        在游戏中选择英雄
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.select_hero(body.game_id, user.get('id'), body.hero_id)

    def ActionWangzheGameStartPost(self, request: Request, game_id: int = Query(..., description="游戏ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        开始游戏接口
        POST /api/wangzhe/game/start
        开始游戏
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.start_game(game_id)

    def ActionWangzheGameEndPost(self, request: Request, game_id: int = Query(..., description="游戏ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        结束游戏接口
        POST /api/wangzhe/game/end
        结束游戏并结算
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.end_game(game_id)

    def ActionWangzheGameResultGet(self, request: Request, game_id: int = Query(..., description="游戏ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取游戏结果接口
        GET /api/wangzhe/game/result/get
        获取游戏结果和详细数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_result(game_id)

    def ActionWangzheGameHistoryGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(20, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取游戏历史接口
        GET /api/wangzhe/game/history/get
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

        return self.game_business.get_user_game_history(user.get('id'), page, page_size)


class QuickStartRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")
    mode: Optional[str] = Field('1v1', description="游戏模式：5v5, 3v3, 1v1")
    game_type: Optional[str] = Field('casual', description="游戏类型：casual, ranked")


class WangzheGameQuickController:
    def __init__(self):
        from app.business.wangzhe_model.game_business import WangzheGameBusiness
        self.game_business = WangzheGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        user_business = WangzheUserBusiness()
        return user_business.verify_token(token)

    def ActionWangzheGameQuickStartPost(self, request: Request, body: QuickStartRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        快速开始游戏接口
        POST /api/wangzhe/game/quick/start
        一键开始游戏，自动匹配AI对手
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.quick_start_game(
            user.get('id'),
            body.hero_id,
            body.mode,
            body.game_type
        )

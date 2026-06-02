from typing import Optional, Dict, Any
from fastapi import Request, Query, Header, Body
from pydantic import BaseModel
from app.business.majiang import MajiangGameBusiness
from app.business.majiang import MajiangUserBusiness


class DiscardTileRequest(BaseModel):
    tile_type: str
    value: int


class CalculateFanRequest(BaseModel):
    hand_data: Dict[str, Any]
    winning_tile_data: Dict[str, Any]
    is_self_draw: bool = False
    is_dealer: bool = False


class MajiangGameController:
    def __init__(self):
        self.game_business = MajiangGameBusiness()
        self.user_business = MajiangUserBusiness()

    def _verify_user(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.user_business.verify_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangGameCreatePost(self, request: Request,
                                     difficulty: int = Query(2, description='AI难度：1简单 2中等 3困难'),
                                     ai_count: int = Query(3, description='AI数量'),
                                     authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.create_game(user.get('id'), difficulty, ai_count)

    def ActionMajiangGameTestCreatePost(self, request: Request,
                                        test_type: str = Query('ready', description='测试类型：ready(听牌) seven_pairs_ready(七对子听牌)'),
                                        authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.create_test_game(user.get('id'), test_type)

    def ActionMajiangGameStateGet(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.get_game_state(user.get('id'))

    def ActionMajiangGameDrawPost(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.draw_tile(user.get('id'))

    def ActionMajiangGameDiscardPost(self, request: Request,
                                      body: DiscardTileRequest,
                                      authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.discard_tile(user.get('id'), body.tile_type, body.value)

    def ActionMajiangGameAiPlayPost(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.ai_play(user.get('id'))

    def ActionMajiangGameHuPost(self, request: Request,
                                 authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.hu(user.get('id'))

    def ActionMajiangGameCancelPost(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.cancel_game(user.get('id'))

    def ActionMajiangGameHistoryGet(self, request: Request,
                                     page: int = Query(1, description='页码'),
                                     page_size: int = Query(10, description='每页数量'),
                                     authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.get_game_history(user.get('id'), page, page_size)

    def ActionMajiangGameCheckReadyGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.game_business.check_ready(user.get('id'))

    def ActionMajiangGameCalculateFanPost(self, request: Request,
                                           body: CalculateFanRequest):
        return self.game_business.calculate_fan(
            body.hand_data,
            body.winning_tile_data,
            body.is_self_draw,
            body.is_dealer
        )

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateGameRequest(BaseModel):
    max_rounds: int = Field(30, description="最大回合数")
    name: str = Field('', description="房间名称")
    max_players: int = Field(4, description="最大人数", ge=2, le=4)


class JoinGameRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class GameIdRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")


class BuyLandRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    cell_id: int = Field(..., description="格子ID")


class UpgradeLandRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    cell_id: int = Field(..., description="格子ID")


class SellLandRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    cell_id: int = Field(..., description="格子ID")


class BuyItemRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    item_id: int = Field(..., description="道具ID")


class UseItemRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    item_id: int = Field(..., description="道具ID")
    target_user_id: Optional[int] = Field(None, description="目标用户ID")


class DafuwengGameController:
    def __init__(self):
        from app.business.dafuweng.game_business import GameBusiness
        from app.business.dafuweng.user_business import DafuwengUserBusiness
        self.game_business = GameBusiness()
        self.user_business = DafuwengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _verify_user(self, token):
        from app.business.dafuweng.user_business import DafuwengUserBusiness
        business = DafuwengUserBusiness()
        user = business.verify_token(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return None

    def ActionDafuwengGameCreatePost(self, request: Request, body: CreateGameRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        result = self.game_business.create_game(
            max_rounds=body.max_rounds,
            name=body.name,
            max_players=body.max_players,
            creator_id=user.get('id', 0)
        )

        if result.get('code') == 0 and result.get('data'):
            game_id = result['data'].get('id')
            if game_id:
                self.game_business.join_game(game_id=game_id, user_id=user.get('id'))

        return result

    def ActionDafuwengGameJoinPost(self, request: Request, body: JoinGameRequest,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.join_game(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameStartPost(self, request: Request, body: GameIdRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.start_game(
            game_id=body.game_id
        )

    def ActionDafuwengGameRollPost(self, request: Request, body: GameIdRequest,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.roll_dice(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameBuyLandPost(self, request: Request, body: BuyLandRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.buy_land(
            game_id=body.game_id,
            cell_id=body.cell_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameUpgradeLandPost(self, request: Request, body: UpgradeLandRequest,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.upgrade_land(
            game_id=body.game_id,
            cell_id=body.cell_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameSellLandPost(self, request: Request, body: SellLandRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.sell_land(
            game_id=body.game_id,
            cell_id=body.cell_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameBuyItemPost(self, request: Request, body: BuyItemRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.buy_item(
            game_id=body.game_id,
            item_id=body.item_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameUseItemPost(self, request: Request, body: UseItemRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.use_item(
            game_id=body.game_id,
            item_id=body.item_id,
            user_id=user.get('id'),
            target_user_id=body.target_user_id
        )

    def ActionDafuwengGameEventTriggerPost(self, request: Request, body: GameIdRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.trigger_random_event(
            game_id=body.game_id,
            user_id=user.get('id')
        )

    def ActionDafuwengGameNextTurnPost(self, request: Request, body: GameIdRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.next_turn(
            game_id=body.game_id
        )

    def ActionDafuwengGameStateGet(self, request: Request, game_id: int = Query(..., description="游戏ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_state(
            game_id=game_id
        )

    def ActionDafuwengGameListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[str] = Query(None, description="游戏状态")):
        return self.game_business.get_game_list(
            page=page,
            page_size=page_size,
            status=status
        )

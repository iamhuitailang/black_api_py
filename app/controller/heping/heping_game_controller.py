from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartGameRequest(BaseModel):
    map_id: int = Field(..., description="地图ID")


class SaveGameStateRequest(BaseModel):
    state_data: str = Field(..., description="游戏状态数据")


class EndGameRequest(BaseModel):
    map_id: int = Field(..., description="地图ID")
    rank: int = Field(..., description="排名")
    kills: int = Field(..., description="击杀数")
    damage_dealt: float = Field(..., description="造成伤害")
    damage_taken: float = Field(..., description="受到伤害")
    survive_time: float = Field(..., description="存活时间")
    weapons_used: Optional[str] = Field(None, description="使用武器")
    items_collected: Optional[str] = Field(None, description="收集物品")
    is_win: bool = Field(..., description="是否获胜")


class HepingGameController:
    def __init__(self):
        from app.business.heping.game_business import GameBusiness
        from app.business.heping.user_business import HepingUserBusiness
        self.game_business = GameBusiness()
        self.user_business = HepingUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHepingGameStartPost(self, request: Request, body: StartGameRequest,
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
            user_id=user.get('id'),
            map_id=body.map_id
        )

    def ActionHepingGameStateSavePost(self, request: Request, body: SaveGameStateRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.save_game_state(
            user_id=user.get('id'),
            state_data=body.state_data
        )

    def ActionHepingGameStateLoadGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.load_game_state(user_id=user.get('id'))

    def ActionHepingGameEndPost(self, request: Request, body: EndGameRequest,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.end_game(
            user_id=user.get('id'),
            map_id=body.map_id,
            rank=body.rank,
            kills=body.kills,
            damage_dealt=body.damage_dealt,
            damage_taken=body.damage_taken,
            survive_time=body.survive_time,
            weapons_used=body.weapons_used or '',
            items_collected=body.items_collected or '',
            is_win=body.is_win
        )

    def ActionHepingGameRecordListGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.get_game_records(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionHepingGameLeaderboardGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.game_business.get_leaderboard(
            page=page,
            page_size=page_size
        )

    def ActionHepingGameUserStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.game_business.get_user_stats(user_id=user.get('id'))

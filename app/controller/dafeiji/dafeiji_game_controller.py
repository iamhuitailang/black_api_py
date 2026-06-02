from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SaveGameStateRequest(BaseModel):
    score: Optional[int] = Field(None, description="分数")
    wave: Optional[int] = Field(None, description="关卡")
    hp: Optional[int] = Field(None, description="生命值")
    lives: Optional[int] = Field(None, description="命数")
    aircraft_id: Optional[int] = Field(None, description="飞机ID")
    weapon_level: Optional[int] = Field(None, description="武器等级")
    items: Optional[str] = Field(None, description="道具数据")
    enemies_killed: Optional[int] = Field(None, description="击杀敌人数")
    play_time: Optional[int] = Field(None, description="游戏时长")


class SubmitScoreRequest(BaseModel):
    score: int = Field(..., description="分数")
    wave: Optional[int] = Field(None, description="关卡")
    aircraft_id: Optional[int] = Field(None, description="飞机ID")
    enemies_killed: Optional[int] = Field(None, description="击杀敌人数")
    items_collected: Optional[str] = Field(None, description="收集道具数据")
    play_time: Optional[int] = Field(None, description="游戏时长")


class DafeijiGameController:
    def __init__(self):
        from app.business.dafeiji.game_business import DafeijiGameBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.game_business = DafeijiGameBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiGameStateSavePost(self, request: Request, body: SaveGameStateRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.game_business.save_state(
            user_id=user.get('id'),
            state_data=data
        )

    def ActionDafeijiGameStateLoadGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.load_state(user_id=user.get('id'))

    def ActionDafeijiGameScoreSubmitPost(self, request: Request, body: SubmitScoreRequest,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        game_data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.game_business.submit_score(
            user_id=user.get('id'),
            game_data=game_data
        )

    def ActionDafeijiGameRecordsGet(self, request: Request,
                                     limit: int = Query(10, ge=1, le=100, description="记录数量"),
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
            limit=limit
        )

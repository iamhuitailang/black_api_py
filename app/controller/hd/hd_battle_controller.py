from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartBattleRequest(BaseModel):
    player2_id: int = Field(..., description="玩家2ID")
    battle_type: int = Field(..., description="对战类型")


class EndBattleRequest(BaseModel):
    battle_id: int = Field(..., description="对战ID")
    winner_id: int = Field(..., description="获胜者ID")
    player1_score: int = Field(..., description="玩家1得分")
    player2_score: int = Field(..., description="玩家2得分")
    duration: int = Field(..., description="对战时长(秒)")


class CreateBattleRequest(BaseModel):
    player1_id: int = Field(..., description="玩家1ID")
    player2_id: int = Field(..., description="玩家2ID")
    battle_type: int = Field(..., description="对战类型")


class HdBattleController:
    def __init__(self):
        from app.business.hd.battle_business import HdBattleBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.battle_business = HdBattleBusiness()
        self.user_business = HdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[Dict[str, Any]]:
        return self.user_business.verify_token(token)

    def ActionHdBattleStartPost(self, request: Request, body: StartBattleRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        开始对战
        POST /api/hd/battle/start
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.start_battle(
            player1_id=user.get('id'),
            player2_id=body.player2_id,
            battle_type=body.battle_type
        )

    def ActionHdBattleEndPost(self, request: Request, body: EndBattleRequest,
                               authorization: Optional[str] = Header(None)):
        """
        结束对战
        POST /api/hd/battle/end
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.end_battle(
            battle_id=body.battle_id,
            winner_id=body.winner_id,
            player1_score=body.player1_score,
            player2_score=body.player2_score,
            duration=body.duration
        )

    def ActionHdBattleUserGet(self, request: Request,
                               battle_type: Optional[int] = Query(None, description="对战类型"),
                               page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户对战记录
        GET /api/hd/battle/user/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_user_battles(
            user_id=user.get('id'),
            battle_type=battle_type,
            page=page,
            page_size=page_size
        )

    def ActionHdBattleStatsGet(self, request: Request,
                                authorization: Optional[str] = Header(None)):
        """
        获取用户对战统计
        GET /api/hd/battle/stats/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.battle_business.get_user_stats(user.get('id'))

    def ActionHdBattleRankingGet(self, request: Request,
                                  battle_type: Optional[int] = Query(None, description="对战类型"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取排行榜
        GET /api/hd/battle/ranking/get
        """
        return self.battle_business.get_ranking_list(
            battle_type=battle_type,
            page=page,
            page_size=page_size
        )

    def ActionHdBattleCreatePost(self, request: Request, body: CreateBattleRequest):
        """
        创建对战记录
        POST /api/hd/battle/create
        """
        data = {
            'player1_id': body.player1_id,
            'player2_id': body.player2_id,
            'battle_type': body.battle_type
        }
        return self.battle_business.create_battle(data)

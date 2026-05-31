from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PlayCardsRequest(BaseModel):
    game_id: str = Field(..., description="游戏ID")
    card_ids: Optional[List[str]] = Field(None, description="要出的牌的ID列表，不传则为不出")


class BidRequest(BaseModel):
    game_id: str = Field(..., description="游戏ID")
    bid_score: int = Field(..., description="叫分，1-3分")


class DoudizhuGameController:
    def __init__(self):
        from app.business.doudizhu_model.game_business import DoudizhuGameBusiness
        from app.business.doudizhu_model.achievement_business import DoudizhuAchievementBusiness
        from app.business.doudizhu_model.ai_config_business import DoudizhuAiConfigBusiness
        self.game_business = DoudizhuGameBusiness()
        self.achievement_business = DoudizhuAchievementBusiness()
        self.ai_config_business = DoudizhuAiConfigBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.doudizhu_model.user_business import DoudizhuUserBusiness
        user_business = DoudizhuUserBusiness()
        return user_business.verify_token(token)

    def ActionDoudizhuModelGameCreatePost(self, request: Request, authorization: Optional[str] = Header(None),
                                           ai_difficulty: int = Query(1, description="AI难度：0简单，1普通，2困难")):
        """
        创建游戏接口
        POST /api/doudizhu_model/game/create
        创建新的斗地主游戏，返回游戏ID和初始牌局
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.create_game(
            user_id=user.get('id'),
            ai_difficulty=ai_difficulty
        )

    def ActionDoudizhuModelGameStateGet(self, request: Request, game_id: str = Query(..., description="游戏ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取游戏状态接口
        GET /api/doudizhu_model/game/state/get
        获取当前游戏状态信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_state(game_id)

    def ActionDoudizhuModelGameBidPost(self, request: Request, body: BidRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        叫地主接口
        POST /api/doudizhu_model/game/bid
        玩家叫地主
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.player_bid(
            game_id=body.game_id,
            user_id=user.get('id'),
            bid_score=body.bid_score
        )

    def ActionDoudizhuModelGamePassBidPost(self, request: Request, game_id: str = Query(..., description="游戏ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        不叫地主接口
        POST /api/doudizhu_model/game/pass/bid
        玩家不叫地主
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.player_pass_bid(
            game_id=game_id,
            user_id=user.get('id')
        )

    def ActionDoudizhuModelGameAiBidPost(self, request: Request, game_id: str = Query(..., description="游戏ID"),
                                          ai_difficulty: int = Query(1, description="AI难度"),
                                          authorization: Optional[str] = Header(None)):
        """
        AI叫地主接口
        POST /api/doudizhu_model/game/ai/bid
        AI进行叫地主操作
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.ai_bid(game_id, ai_difficulty)

    def ActionDoudizhuModelGamePlayPost(self, request: Request, body: PlayCardsRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        玩家出牌接口
        POST /api/doudizhu_model/game/play
        玩家出牌或不出
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.player_play(
            game_id=body.game_id,
            user_id=user.get('id'),
            card_ids=body.card_ids or []
        )

    def ActionDoudizhuModelGameAiPlayPost(self, request: Request, game_id: str = Query(..., description="游戏ID"),
                                           ai_difficulty: int = Query(1, description="AI难度"),
                                           authorization: Optional[str] = Header(None)):
        """
        AI出牌接口
        POST /api/doudizhu_model/game/ai/play
        AI进行出牌操作
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.ai_play(game_id, ai_difficulty)

    def ActionDoudizhuModelGamePlayedCardsGet(self, request: Request, game_id: str = Query(..., description="游戏ID"),
                                               authorization: Optional[str] = Header(None)):
        """
        获取已出牌记录接口（记牌器）
        GET /api/doudizhu_model/game/played/cards/get
        获取本局游戏所有已出的牌，用于记牌器功能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_played_cards(game_id)

    def ActionDoudizhuModelGameHistoryGet(self, request: Request, page: int = Query(1, description="页码"),
                                           page_size: int = Query(20, description="每页数量"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取游戏历史记录接口
        GET /api/doudizhu_model/game/history/get
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

        return self.game_business.get_game_history(user.get('id'), page, page_size)

    def ActionDoudizhuModelGameStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户游戏统计接口
        GET /api/doudizhu_model/game/stats/get
        获取当前用户的游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_user_stats(user.get('id'))

    def ActionDoudizhuModelAchievementListGet(self, request: Request, page: int = Query(1, description="页码"),
                                               page_size: int = Query(20, description="每页数量"),
                                               type: Optional[int] = Query(None, description="成就类型")):
        """
        获取成就列表接口
        GET /api/doudizhu_model/achievement/list/get
        获取所有成就列表
        """
        return self.achievement_business.get_achievement_list(page, page_size, type)

    def ActionDoudizhuModelAchievementUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户成就接口
        GET /api/doudizhu_model/achievement/user/get
        获取当前用户的成就解锁情况
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user.get('id'))

    def ActionDoudizhuModelAiConfigListGet(self, request: Request, page: int = Query(1, description="页码"),
                                            page_size: int = Query(10, description="每页数量"),
                                            difficulty: Optional[int] = Query(None, description="难度")):
        """
        获取AI配置列表接口
        GET /api/doudizhu_model/ai/config/list/get
        获取AI难度配置列表
        """
        return self.ai_config_business.get_ai_config_list(page, page_size, difficulty)

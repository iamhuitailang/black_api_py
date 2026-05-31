from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SaveRecordRequest(BaseModel):
    theme_id: int = Field(..., description="主题ID")
    score: int = Field(0, description="得分")
    duration: int = Field(0, description="游戏时长(秒)")
    combo: int = Field(0, description="连击数")
    max_combo: int = Field(0, description="最大连击")
    pairs_cleared: int = Field(0, description="消除对数")
    hints_used: int = Field(0, description="使用提示次数")
    props_used: int = Field(0, description="使用道具次数")
    is_completed: int = Field(0, description="是否完成")


class LlkGameController:
    def __init__(self):
        from app.business.lianliankan077.game_business import LlkGameBusiness
        self.game_business = LlkGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.lianliankan077.user_business import LlkUserBusiness
        return LlkUserBusiness().verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.lianliankan077.admin_business import LlkAdminBusiness
        return LlkAdminBusiness().verify_token(token)

    def ActionLlkGameRecordSavePost(self, request: Request, body: SaveRecordRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        保存游戏记录
        POST /api/lianliankan/game/record/save
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.game_business.save_record(
            user_id=user.get('id'),
            theme_id=body.theme_id,
            score=body.score,
            duration=body.duration,
            combo=body.combo,
            max_combo=body.max_combo,
            pairs_cleared=body.pairs_cleared,
            hints_used=body.hints_used,
            props_used=body.props_used,
            is_completed=body.is_completed
        )

    def ActionLlkGameRecordListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户游戏记录
        GET /api/lianliankan/game/record/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.game_business.get_user_records(user.get('id'), page, page_size)

    def ActionLlkGameLeaderboardGet(self, request: Request,
                                     theme_id: Optional[int] = Query(None, description="主题ID"),
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取游戏排行榜
        GET /api/lianliankan/game/leaderboard/get
        """
        return self.game_business.get_leaderboard(theme_id, page, page_size)

    def ActionLlkGameScoreLeaderboardGet(self, request: Request,
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(20, ge=1, le=100, description="每页数量")):
        """
        获取积分排行榜
        GET /api/lianliankan/game/score/leaderboard/get
        """
        return self.game_business.get_score_leaderboard(page, page_size)

    def ActionLlkGameStatisticsGet(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        """
        获取游戏统计（管理员）
        GET /api/lianliankan/game/statistics/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.game_business.get_statistics()

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JinwutuanStatsController:
    def __init__(self):
        from app.business.jinwutuan.stats_business import JinwutuanStatsBusiness
        from app.business.jinwutuan.user_business import JinwutuanUserBusiness
        self.stats_business = JinwutuanStatsBusiness()
        self.user_business = JinwutuanUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJinwutuanStatsUserGet(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.stats_business.get_user_stats(user_id=user.get('id'))

    def ActionJinwutuanStatsDashboardGet(self, request: Request):
        return self.stats_business.get_dashboard_stats()

    def ActionJinwutuanStatsLeaderboardGet(self, request: Request,
                                           sort_by: str = Query('total_score', description="排序字段"),
                                           page: int = Query(1, ge=1, description="页码"),
                                           page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.stats_business.get_leaderboard(
            sort_by=sort_by,
            page=page,
            page_size=page_size
        )

    def ActionJinwutuanStatsRecentGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.stats_business.get_recent_scores(
            page=page,
            page_size=page_size
        )

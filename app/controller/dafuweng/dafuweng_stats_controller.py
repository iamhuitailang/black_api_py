from typing import Optional
from fastapi import Request, Header


class DafuwengStatsController:
    def __init__(self):
        from app.business.dafuweng.stats_business import StatsBusiness
        self.stats_business = StatsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_admin(self, token):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        business = DafuwengAdminBusiness()
        admin = business.verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '管理员未登录', 'data': None}
        return None

    def ActionDafuwengStatsDashboardGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.stats_business.get_dashboard_stats()

    def ActionDafuwengStatsUsersGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.stats_business.get_user_stats()

    def ActionDafuwengStatsGamesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.stats_business.get_game_stats()

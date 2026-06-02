from typing import Optional
from fastapi import Request, Header


class JinwutuanAchievementController:
    def __init__(self):
        from app.business.jinwutuan.achievement_business import JinwutuanAchievementBusiness
        from app.business.jinwutuan.user_business import JinwutuanUserBusiness
        self.achievement_business = JinwutuanAchievementBusiness()
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

    def ActionJinwutuanAchievementAllGet(self, request: Request):
        return self.achievement_business.get_all_achievements()

    def ActionJinwutuanAchievementUserGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(
            user_id=user.get('id')
        )

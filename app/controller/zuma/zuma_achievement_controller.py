from typing import Optional
from fastapi import Request, Header


class ZumaAchievementController:
    def __init__(self):
        from app.business.zuma.achievement_business import ZumaAchievementBusiness
        from app.business.zuma.user_business import ZumaUserBusiness
        self.achievement_business = ZumaAchievementBusiness()
        self.user_business = ZumaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionZumaAchievementAllGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有成就接口
        GET /api/zuma/achievement/all
        获取所有成就列表，登录后会返回是否已解锁
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        user_id = user.get('id') if user else None
        return self.achievement_business.get_all_achievements(user_id)

    def ActionZumaAchievementMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的成就接口
        GET /api/zuma/achievement/my
        获取当前用户已解锁的成就
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

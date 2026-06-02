from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class HepingAchievementController:
    def __init__(self):
        from app.business.heping.achievement_business import AchievementBusiness
        from app.business.heping.user_business import HepingUserBusiness
        self.achievement_business = AchievementBusiness()
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

    def ActionHepingAchievementListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.achievement_business.get_achievement_list()

    def ActionHepingAchievementUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.achievement_business.get_user_achievements(user_id=user.get('id'))

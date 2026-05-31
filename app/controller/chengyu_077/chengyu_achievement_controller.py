from typing import Optional
from fastapi import Request
from app.business.chengyu_077.achievement_business import AchievementBusiness
from app.business.chengyu_077.user_business import ChengyuUserBusiness


class ChengyuAchievementController:
    def __init__(self):
        self.business = AchievementBusiness()
        self.user_business = ChengyuUserBusiness()

    def _get_token(self, request: Request) -> str:
        auth = request.headers.get('authorization', '')
        if auth and auth.startswith('Bearer '):
            return auth[7:]
        return request.query_params.get('token', '')

    def _get_current_user_id(self, request: Request) -> Optional[int]:
        token = self._get_token(request)
        if not token:
            return None
        user = self.user_business.verify_token(token)
        if user:
            return user.get('id')
        return None

    def ActionChengyuAchievementListGet(self, request: Request):
        """
        获取所有成就列表（公开接口）
        GET /api/chengyu/achievement/list
        """
        return self.business.get_all_achievements()

    def ActionChengyuAchievementMyGet(self, request: Request):
        """
        获取我的成就
        GET /api/chengyu/achievement/my
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.get_my_achievements(user_id)

    def ActionChengyuAchievementUnlockPost(self, request: Request, achievement_id: int):
        """
        解锁成就
        POST /api/chengyu/achievement/unlock
        """
        user_id = self._get_current_user_id(request)
        if not user_id:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.business.unlock_achievement(user_id, achievement_id)

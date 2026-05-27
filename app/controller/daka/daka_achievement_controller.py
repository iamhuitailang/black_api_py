from typing import Optional
from fastapi import Request, Header, Query


class DakaAchievementController:
    def __init__(self):
        from app.business.daka.achievement_business import DakaAchievementBusiness
        from app.business.daka.user_business import DakaUserBusiness
        self.achievement_business = DakaAchievementBusiness()
        self.user_business = DakaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDakaAchievementListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有成就列表
        GET /api/daka/achievement/list/get
        获取所有成就及其解锁状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.achievement_business.get_all_achievements(user_id)

    def ActionDakaAchievementUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户已解锁成就
        GET /api/daka/achievement/user/list/get
        获取当前用户已解锁的成就列表
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

    def ActionDakaAchievementCategoryListGet(self, request: Request, category: str = Query(..., description="成就分类"),
                                              authorization: Optional[str] = Header(None)):
        """
        按分类获取成就列表
        GET /api/daka/achievement/category/list/get
        根据分类获取成就列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.achievement_business.get_achievements_by_category(category, user_id)

    def ActionDakaAchievementDetailGet(self, request: Request, achievement_id: int = Query(..., description="成就ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取成就详情
        GET /api/daka/achievement/detail/get
        根据成就ID获取成就详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.achievement_business.get_achievement_detail(achievement_id, user_id)

    def ActionDakaAchievementCheckGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        检查是否有新成就解锁
        GET /api/daka/achievement/check/get
        检查是否有新成就可以解锁
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.check_new_achievements(user.get('id'))

    def ActionDakaAchievementCategoriesGet(self, request: Request):
        """
        获取成就分类列表
        GET /api/daka/achievement/categories/get
        获取所有成就分类
        """
        return self.achievement_business.get_achievement_categories()

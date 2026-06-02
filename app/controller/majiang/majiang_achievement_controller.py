from typing import Optional, Dict, Any
from fastapi import Request, Query, Header, Body
from pydantic import BaseModel
from app.business.majiang import MajiangAchievementBusiness
from app.business.majiang import MajiangUserBusiness, MajiangAdminBusiness


class CreateAchievementRequest(BaseModel):
    name: str
    description: str
    category: int
    condition_type: str
    condition_value: int
    reward_coins: int = 0
    reward_exp: int = 0
    icon: str = ''
    rarity: int = 1


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[int] = None
    condition_type: Optional[str] = None
    condition_value: Optional[int] = None
    reward_coins: Optional[int] = None
    reward_exp: Optional[int] = None
    icon: Optional[str] = None
    rarity: Optional[int] = None
    status: Optional[int] = None


class MajiangAchievementController:
    def __init__(self):
        self.achievement_business = MajiangAchievementBusiness()
        self.user_business = MajiangUserBusiness()
        self.admin_business = MajiangAdminBusiness()

    def _verify_user(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.user_business.verify_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def _verify_admin(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.admin_business.verify_admin_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangAchievementAllGet(self, request: Request):
        return self.achievement_business.get_all_achievements()

    def ActionMajiangAchievementCategoryGet(self, request: Request,
                                             category: int = Query(..., description='分类')):
        return self.achievement_business.get_achievements_by_category(category)

    def ActionMajiangAchievementUserGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user.get('id'))

    def ActionMajiangAchievementCheckPost(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.achievement_business.check_and_unlock_achievements(user.get('id'))

    def ActionMajiangAchievementClaimPost(self, request: Request,
                                           achievement_id: int = Query(..., description='成就ID'),
                                           authorization: Optional[str] = Header(None)):
        user = self._verify_user(authorization)
        if not user:
            return {
                'code': 1,
                'msg': '用户未登录',
                'data': None
            }

        return self.achievement_business.claim_achievement_reward(user.get('id'), achievement_id)

    def ActionMajiangAchievementListGet(self, request: Request,
                                         page: int = Query(1, description='页码'),
                                         page_size: int = Query(10, description='每页数量'),
                                         category: Optional[int] = Query(None, description='分类筛选'),
                                         status: Optional[int] = Query(None, description='状态筛选'),
                                         authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.achievement_business.get_achievement_list(page, page_size, category, status)

    def ActionMajiangAchievementCreatePost(self, request: Request,
                                            body: CreateAchievementRequest,
                                            authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.achievement_business.create_achievement(
            name=body.name,
            description=body.description,
            category=body.category,
            condition_type=body.condition_type,
            condition_value=body.condition_value,
            reward_coins=body.reward_coins,
            reward_exp=body.reward_exp,
            icon=body.icon,
            rarity=body.rarity
        )

    def ActionMajiangAchievementUpdatePost(self, request: Request,
                                            achievement_id: int = Query(..., description='成就ID'),
                                            body: UpdateAchievementRequest = Body(...),
                                            authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        data = {k: v for k, v in body.dict().items() if v is not None}
        return self.achievement_business.update_achievement(achievement_id, data)

    def ActionMajiangAchievementDeletePost(self, request: Request,
                                            achievement_id: int = Query(..., description='成就ID'),
                                            authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.achievement_business.delete_achievement(achievement_id)

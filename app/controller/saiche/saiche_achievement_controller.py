from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddAchievementRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    condition_type: str = Field(..., description="条件类型: race_count/win_count/coins/level/track_count/consecutive_win")
    condition_value: int = Field(..., description="条件值")
    reward_coins: Optional[int] = Field(0, description="奖励金币")
    reward_exp: Optional[int] = Field(0, description="奖励经验")
    icon: Optional[str] = Field(None, description="成就图标")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    condition_type: Optional[str] = Field(None, description="条件类型")
    condition_value: Optional[int] = Field(None, description="条件值")
    reward_coins: Optional[int] = Field(None, description="奖励金币")
    reward_exp: Optional[int] = Field(None, description="奖励经验")
    icon: Optional[str] = Field(None, description="成就图标")
    is_active: Optional[int] = Field(None, description="是否启用")


class SaicheAchievementController:
    def __init__(self):
        from app.business.saiche.achievement_business import SaicheAchievementBusiness
        from app.business.saiche.user_business import SaicheUserBusiness
        self.achievement_business = SaicheAchievementBusiness()
        self.user_business = SaicheUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.saiche.admin_business import SaicheAdminBusiness
        admin_business = SaicheAdminBusiness()
        return admin_business.verify_token(token)

    def ActionSaicheAchievementListGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                        condition_type: Optional[str] = Query(None, description="条件类型")):
        """
        获取成就列表接口
        GET /api/saiche/achievement/list/get
        获取所有成就列表
        """
        return self.achievement_business.get_achievement_list(
            page=page,
            page_size=page_size,
            condition_type=condition_type
        )

    def ActionSaicheAchievementUserListGet(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        获取用户成就列表接口
        GET /api/saiche/achievement/user/list/get
        获取当前登录用户的成就列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user_id=user.get('id'))

    def ActionSaicheAchievementCheckPost(self, request: Request,
                                          authorization: Optional[str] = Header(None)):
        """
        检查并解锁成就接口
        POST /api/saiche/achievement/check
        检查用户是否满足成就条件并解锁
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.check_and_unlock_achievements(user_id=user.get('id'))

    def ActionSaicheAchievementUnlockPost(self, request: Request,
                                           achievement_id: int = Query(..., description="成就ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        解锁成就接口
        POST /api/saiche/achievement/unlock
        手动解锁指定成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.unlock_achievement(
            user_id=user.get('id'),
            achievement_id=achievement_id
        )

    def ActionSaicheAchievementAddPost(self, request: Request, body: AddAchievementRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        添加成就接口（管理员）
        POST /api/saiche/achievement/add
        管理员添加新成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.achievement_business.add_achievement(data=data)

    def ActionSaicheAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                           achievement_id: int = Query(..., description="成就ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        更新成就接口（管理员）
        POST /api/saiche/achievement/update
        管理员更新成就信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = body.dict(exclude_unset=True)
        return self.achievement_business.update_achievement(achievement_id=achievement_id, data=data)

    def ActionSaicheAchievementDeletePost(self, request: Request,
                                           achievement_id: int = Query(..., description="成就ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除成就接口（管理员）
        POST /api/saiche/achievement/delete
        管理员删除成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.delete_achievement(achievement_id=achievement_id)

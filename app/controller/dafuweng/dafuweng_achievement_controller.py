from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class AchievementCreateRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    achievement_type: str = Field(..., description="成就类型")
    condition: str = Field(..., description="达成条件")
    description: Optional[str] = Field(None, description="描述")
    icon: Optional[str] = Field(None, description="图标")


class AchievementUpdateRequest(BaseModel):
    achievement_id: int = Field(..., description="成就ID")
    name: Optional[str] = Field(None, description="成就名称")
    achievement_type: Optional[str] = Field(None, description="成就类型")
    condition: Optional[str] = Field(None, description="达成条件")
    description: Optional[str] = Field(None, description="描述")
    icon: Optional[str] = Field(None, description="图标")


class AchievementDeleteRequest(BaseModel):
    achievement_id: int = Field(..., description="成就ID")


class DafuwengAchievementController:
    def __init__(self):
        from app.business.dafuweng.achievement_business import AchievementBusiness
        from app.business.dafuweng.user_business import DafuwengUserBusiness
        self.achievement_business = AchievementBusiness()
        self.user_business = DafuwengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _verify_admin(self, token):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        business = DafuwengAdminBusiness()
        admin = business.verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '管理员未登录', 'data': None}
        return None

    def ActionDafuwengAchievementListGet(self, request: Request):
        return self.achievement_business.get_all_achievements()

    def ActionDafuwengAchievementMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user_id=user.get('id'))

    def ActionDafuwengAchievementCreatePost(self, request: Request, body: AchievementCreateRequest,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.achievement_business.create_achievement(
            data={'name': body.name, 'achievement_type': body.achievement_type, 'condition': body.condition, 'description': body.description, 'icon': body.icon}
        )

    def ActionDafuwengAchievementUpdatePost(self, request: Request, body: AchievementUpdateRequest,
                                              authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.achievement_type is not None:
            data['achievement_type'] = body.achievement_type
        if body.condition is not None:
            data['condition'] = body.condition
        if body.description is not None:
            data['description'] = body.description
        if body.icon is not None:
            data['icon'] = body.icon

        return self.achievement_business.update_achievement(
            achievement_id=body.achievement_id,
            data=data
        )

    def ActionDafuwengAchievementDeleteDelete(self, request: Request, body: AchievementDeleteRequest,
                                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.achievement_business.delete_achievement(achievement_id=body.achievement_id)

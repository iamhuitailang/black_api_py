from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAchievementRequest(BaseModel):
    name: str = Field(..., description="成就标识")
    title: str = Field(..., description="成就名称")
    description: str = Field('', description="成就描述")
    icon: str = Field('', description="成就图标")
    type: str = Field('special', description="成就类型")
    condition_value: int = Field(0, description="条件值")
    sort_order: int = Field(0, description="排序")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就标识")
    title: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    icon: Optional[str] = Field(None, description="成就图标")
    type: Optional[str] = Field(None, description="成就类型")
    condition_value: Optional[int] = Field(None, description="条件值")
    sort_order: Optional[int] = Field(None, description="排序")


class ZbtAchievementController:
    def __init__(self):
        from app.business.zhaobutong.achievement_business import ZbtAchievementBusiness
        from app.business.zhaobutong.user_business import ZbtUserBusiness
        self.achievement_business = ZbtAchievementBusiness()
        self.user_business = ZbtUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionZbtAchievementListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取成就列表接口
        GET /api/zbt/achievement/list/get
        获取所有成就及当前用户解锁状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None
        return self.achievement_business.get_all_achievements(user_id)

    def ActionZbtAchievementMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的成就接口
        GET /api/zbt/achievement/my/get
        获取当前用户已解锁的成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.achievement_business.get_user_achievements(user.get('id'))

    def ActionZbtAchievementCreatePost(self, request: Request, body: CreateAchievementRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建成就接口
        POST /api/zbt/achievement/create
        管理员创建新成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user or user.get('role') != 1:
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        data = body.model_dump()
        return self.achievement_business.create_achievement(data)

    def ActionZbtAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                        achievement_id: int = Query(..., description="成就ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新成就接口
        POST /api/zbt/achievement/update
        管理员更新成就信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user or user.get('role') != 1:
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.achievement_business.update_achievement(achievement_id, data)

    def ActionZbtAchievementDeletePost(self, request: Request,
                                        achievement_id: int = Query(..., description="成就ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除成就接口
        POST /api/zbt/achievement/delete
        管理员删除成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user or user.get('role') != 1:
            return {'code': 1, 'msg': '需要管理员权限', 'data': None}
        return self.achievement_business.delete_achievement(achievement_id)

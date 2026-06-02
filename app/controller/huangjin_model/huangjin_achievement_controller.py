from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAchievementRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    description: Optional[str] = Field('', description="成就描述")
    condition_type: str = Field(..., description="达成条件类型")
    condition_value: int = Field(..., description="达成条件值")
    icon: Optional[str] = Field('', description="图标")
    badge_color: Optional[str] = Field('#FFD700', description="徽章颜色")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    condition_type: Optional[str] = Field(None, description="达成条件类型")
    condition_value: Optional[int] = Field(None, description="达成条件值")
    icon: Optional[str] = Field(None, description="图标")
    badge_color: Optional[str] = Field(None, description="徽章颜色")
    sort_order: Optional[int] = Field(None, description="排序")


class HuangjinAchievementController:
    def __init__(self):
        from app.business.huangjin_model.achievement_business import AchievementBusiness
        self.achievement_business = AchievementBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.huangjin_model.auth_business import HuangjinAuthBusiness
        return HuangjinAuthBusiness().verify_token(token)

    def ActionHuangjinAchievementListGet(self, request: Request,
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          condition_type: Optional[str] = Query(None, description="条件类型"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取成就列表接口
        GET /api/huangjin/achievement/list/get
        管理员获取所有成就列表
        """
        return self.achievement_business.get_all_achievements(page, page_size, status, condition_type)

    def ActionHuangjinAchievementUserGet(self, request: Request,
                                          authorization: Optional[str] = Header(None)):
        """
        获取用户成就接口
        GET /api/huangjin/achievement/user/get
        获取当前用户的成就列表（含解锁状态）
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

    def ActionHuangjinAchievementCreatePost(self, request: Request, body: CreateAchievementRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        创建成就接口
        POST /api/huangjin/achievement/create
        管理员创建新成就
        """
        return self.achievement_business.create_achievement(
            name=body.name,
            description=body.description or '',
            condition_type=body.condition_type,
            condition_value=body.condition_value,
            icon=body.icon or '',
            badge_color=body.badge_color or '#FFD700',
            sort_order=body.sort_order or 0
        )

    def ActionHuangjinAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                             achievement_id: int = Query(..., description="成就ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        更新成就接口
        POST /api/huangjin/achievement/update
        管理员更新成就信息
        """
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.achievement_business.update_achievement(achievement_id, data)

    def ActionHuangjinAchievementDeletePost(self, request: Request,
                                             achievement_id: int = Query(..., description="成就ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        删除成就接口
        POST /api/huangjin/achievement/delete
        管理员删除成就
        """
        return self.achievement_business.delete_achievement(achievement_id)

    def ActionHuangjinAchievementToggleStatusPost(self, request: Request,
                                                    achievement_id: int = Query(..., description="成就ID"),
                                                    authorization: Optional[str] = Header(None)):
        """
        切换成就状态接口
        POST /api/huangjin/achievement/toggle/status
        管理员切换成就启用/禁用状态
        """
        return self.achievement_business.toggle_achievement_status(achievement_id)

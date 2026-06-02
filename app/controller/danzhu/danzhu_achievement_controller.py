from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAchievementRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    description: Optional[str] = Field('', description="成就描述")
    type: Optional[str] = Field('score', description="类型")
    icon: Optional[str] = Field('', description="图标")
    condition_type: Optional[str] = Field('', description="条件类型")
    condition_value: Optional[int] = Field(0, description="条件值")
    reward_points: Optional[int] = Field(0, description="奖励点数")
    status: Optional[int] = Field(0, description="状态")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    type: Optional[str] = Field(None, description="类型")
    icon: Optional[str] = Field(None, description="图标")
    condition_type: Optional[str] = Field(None, description="条件类型")
    condition_value: Optional[int] = Field(None, description="条件值")
    reward_points: Optional[int] = Field(None, description="奖励点数")
    status: Optional[int] = Field(None, description="状态")


class DanzhuAchievementController:
    def __init__(self):
        from app.business.danzhu import DanzhuAchievementBusiness
        self.achievement_business = DanzhuAchievementBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str):
        from app.business.danzhu import DanzhuAuthBusiness
        auth_business = DanzhuAuthBusiness()
        return auth_business.verify_admin_token(token)

    def ActionDanzhuAchievementAllGet(self, request: Request):
        """
        获取所有成就接口
        GET /api/danzhu/achievement/all/get
        获取所有可用成就列表
        """
        return self.achievement_business.get_all_achievements()

    def ActionDanzhuAchievementUserGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取用户成就接口
        GET /api/danzhu/achievement/user/get
        获取当前用户的成就解锁情况
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        token = self._get_token_from_header(request, authorization)
        user = user_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user.get('id'))

    def ActionDanzhuAchievementListGet(self, request: Request,
                                        page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        type: Optional[str] = Query(None, description="类型"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        keyword: Optional[str] = Query(None, description="关键词"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取成就列表接口
        GET /api/danzhu/achievement/list/get
        管理员获取所有成就列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.achievement_business.get_achievement_list(page, page_size, type, status, keyword)

    def ActionDanzhuAchievementDetailGet(self, request: Request,
                                          achievement_id: int = Query(..., description="成就ID")):
        """
        获取成就详情接口
        GET /api/danzhu/achievement/detail/get
        获取指定成就的详细信息
        """
        return self.achievement_business.get_achievement_detail(achievement_id)

    def ActionDanzhuAchievementCreatePost(self, request: Request, body: CreateAchievementRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        创建成就接口
        POST /api/danzhu/achievement/create
        管理员创建新成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.achievement_business.create_achievement(
            name=body.name,
            description=body.description,
            type=body.type,
            icon=body.icon,
            condition_type=body.condition_type,
            condition_value=body.condition_value,
            reward_points=body.reward_points,
            status=body.status
        )

    def ActionDanzhuAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                            achievement_id: int = Query(..., description="成就ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        更新成就接口
        POST /api/danzhu/achievement/update
        管理员更新成就信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['type'] = body.type
        if body.icon is not None:
            data['icon'] = body.icon
        if body.condition_type is not None:
            data['condition_type'] = body.condition_type
        if body.condition_value is not None:
            data['condition_value'] = body.condition_value
        if body.reward_points is not None:
            data['reward_points'] = body.reward_points
        if body.status is not None:
            data['status'] = body.status

        return self.achievement_business.update_achievement(achievement_id, data)

    def ActionDanzhuAchievementDeletePost(self, request: Request,
                                            achievement_id: int = Query(..., description="成就ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        删除成就接口
        POST /api/danzhu/achievement/delete
        管理员删除成就
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.achievement_business.delete_achievement(achievement_id)

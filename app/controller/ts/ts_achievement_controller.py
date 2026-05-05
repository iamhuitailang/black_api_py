from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateAchievementRequest(BaseModel):
    name: str = Field(..., description="成就名称")
    description: str = Field(..., description="成就描述")
    condition_type: str = Field(..., description="条件类型: total/single/streak")
    condition_value: int = Field(..., description="条件值")
    badge_icon: Optional[str] = Field(None, description="徽章图标")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    description: Optional[str] = Field(None, description="成就描述")
    condition_type: Optional[str] = Field(None, description="条件类型")
    condition_value: Optional[int] = Field(None, description="条件值")
    badge_icon: Optional[str] = Field(None, description="徽章图标")


class TsAchievementController:
    def __init__(self):
        from app.business.ts.achievement_business import TsAchievementBusiness
        self.achievement_business = TsAchievementBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ts.user_business import TsUserBusiness
        user_business = TsUserBusiness()
        return user_business.verify_token(token)

    def ActionTsAchievementListGet(self, request: Request):
        """
        获取所有成就列表接口
        GET /api/ts/achievement/list/get
        获取所有成就列表
        """
        return self.achievement_business.get_all_achievements()

    def ActionTsAchievementTypeGet(self, request: Request,
                                    condition_type: str = Query(..., description="条件类型: total/single/streak")):
        """
        按类型获取成就列表接口
        GET /api/ts/achievement/type/get
        按条件类型获取成就列表
        """
        return self.achievement_business.get_achievements_by_type(condition_type=condition_type)

    def ActionTsAchievementUserGet(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户已解锁成就接口
        GET /api/ts/achievement/user/get
        获取用户已解锁的成就列表
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

    def ActionTsAchievementProgressGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取成就解锁进度接口
        GET /api/ts/achievement/progress/get
        获取所有成就的解锁进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_achievement_progress(user_id=user.get('id'))

    def ActionTsAchievementRecentGet(self, request: Request,
                                       limit: int = Query(5, description="返回数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取最近解锁成就接口
        GET /api/ts/achievement/recent/get
        获取用户最近解锁的成就
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_recent_achievements(
            user_id=user.get('id'),
            limit=limit
        )

    def ActionTsAchievementDetailGet(self, request: Request,
                                      achievement_id: int = Query(..., description="成就ID")):
        """
        获取成就详情接口
        GET /api/ts/achievement/detail/get
        获取成就详情
        """
        return self.achievement_business.get_achievement_by_id(achievement_id=achievement_id)

    def ActionTsAchievementStatsGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        获取成就统计接口
        GET /api/ts/achievement/stats/get
        获取用户的成就统计信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_achievement_stats(user_id=user.get('id'))

    def ActionTsAchievementCreatePost(self, request: Request, body: CreateAchievementRequest):
        """
        创建成就接口
        POST /api/ts/achievement/create
        创建新成就（管理员功能）
        """
        return self.achievement_business.create_achievement(
            name=body.name,
            description=body.description,
            condition_type=body.condition_type,
            condition_value=body.condition_value,
            badge_icon=body.badge_icon or ''
        )

    def ActionTsAchievementUpdatePost(self, request: Request, body: UpdateAchievementRequest,
                                        achievement_id: int = Query(..., description="成就ID")):
        """
        更新成就接口
        POST /api/ts/achievement/update
        更新成就信息（管理员功能）
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.condition_type is not None:
            data['condition_type'] = body.condition_type
        if body.condition_value is not None:
            data['condition_value'] = body.condition_value
        if body.badge_icon is not None:
            data['badge_icon'] = body.badge_icon

        return self.achievement_business.update_achievement(
            achievement_id=achievement_id,
            data=data
        )

    def ActionTsAchievementDeletePost(self, request: Request,
                                        achievement_id: int = Query(..., description="成就ID")):
        """
        删除成就接口
        POST /api/ts/achievement/delete
        删除成就（管理员功能）
        """
        return self.achievement_business.delete_achievement(achievement_id=achievement_id)

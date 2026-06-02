from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CheckAchievementRequest(BaseModel):
    stats: dict = Field(..., description="统计数据")


class CreateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    category: Optional[str] = Field(None, description="成就分类")
    condition: Optional[str] = Field(None, description="达成条件")
    reward: Optional[str] = Field(None, description="奖励")
    description: Optional[str] = Field(None, description="描述")


class UpdateAchievementRequest(BaseModel):
    name: Optional[str] = Field(None, description="成就名称")
    category: Optional[str] = Field(None, description="成就分类")
    condition: Optional[str] = Field(None, description="达成条件")
    reward: Optional[str] = Field(None, description="奖励")
    description: Optional[str] = Field(None, description="描述")


class DafeijiAchievementController:
    def __init__(self):
        from app.business.dafeiji.achievement_business import DafeijiAchievementBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.achievement_business = DafeijiAchievementBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiAchievementListGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         category: Optional[str] = Query(None, description="成就分类")):
        return self.achievement_business.get_all_achievements(
            page=page,
            page_size=page_size,
            category=category
        )

    def ActionDafeijiAchievementUserGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievements(user_id=user.get('id'))

    def ActionDafeijiAchievementCheckPost(self, request: Request, body: CheckAchievementRequest,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.check_and_unlock(
            user_id=user.get('id'),
            stats=body.stats
        )

    def ActionDafeijiAchievementCreatePost(self, request: Request, body: CreateAchievementRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.achievement_business.create(data=data)

    def ActionDafeijiAchievementUpdatePost(self, request: Request,
                                            achievement_id: int = Query(..., description="成就ID"),
                                            body: UpdateAchievementRequest = None,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.achievement_business.update(
            achievement_id=achievement_id,
            data=data
        )

    def ActionDafeijiAchievementDeletePost(self, request: Request,
                                            achievement_id: int = Query(..., description="成就ID"),
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.achievement_business.delete(achievement_id=achievement_id)

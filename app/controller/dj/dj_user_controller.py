from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjUserBusiness, DjAuthBusiness


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")


class UpdateStatusRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="状态 1正常/2禁用")


class SetVendorRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    is_vendor: int = Field(..., description="是否摊主 1是/0否")


class DjUserController:
    def __init__(self):
        self.user_business = DjUserBusiness()
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None
        return user

    def ActionDjUserListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), status: Optional[int] = Query(None, description="状态"), authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/dj/user/list
        分页获取用户列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, status)

    def ActionDjUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"), authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/dj/user/detail
        获取用户详细信息
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_detail(user_id)

    def ActionDjUserProfileGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户资料接口
        GET /api/dj/user/profile
        获取当前登录用户的资料
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_detail(user.get('id'))

    def ActionDjUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
        """
        更新用户资料接口
        POST /api/dj/user/profile/update
        更新当前登录用户的资料
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        update_data = {}
        if body.nickname is not None:
            update_data['nickname'] = body.nickname
        if body.avatar is not None:
            update_data['avatar'] = body.avatar

        return self.user_business.update_profile(user.get('id'), update_data)

    def ActionDjUserStatusUpdatePost(self, request: Request, body: UpdateStatusRequest, authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/dj/user/status/update
        更新用户状态（管理端使用）
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(body.user_id, body.status)

    def ActionDjUserVendorSetPost(self, request: Request, body: SetVendorRequest, authorization: Optional[str] = Header(None)):
        """
        设置用户为摊主接口
        POST /api/dj/user/vendor/set
        设置用户是否为摊主
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.set_vendor(body.user_id, body.is_vendor)

    def ActionDjUserStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户统计接口
        GET /api/dj/user/statistics
        获取用户统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_statistics()

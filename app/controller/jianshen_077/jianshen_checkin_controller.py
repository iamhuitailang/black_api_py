from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CheckinRequest(BaseModel):
    booking_id: int = Field(..., description="预约ID")


class AdminCheckinRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    course_id: int = Field(..., description="课程ID")


class UpdateCheckinStatusRequest(BaseModel):
    checkin_id: int = Field(..., description="签到ID")
    status: int = Field(..., description="状态")


class JianshenCheckinController:
    def __init__(self):
        from app.business.jianshen_077.checkin_business import CheckinBusiness
        self.checkin_business = CheckinBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        return JianshenAuthBusiness().verify_token(token)

    def ActionJianshenCheckinCreatePost(self, request: Request, body: CheckinRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        用户签到接口
        POST /api/jianshen/checkin/create
        用户通过预约ID进行签到
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.checkin(
            user_id=user.get('id'),
            booking_id=body.booking_id
        )

    def ActionJianshenCheckinAdminCreatePost(self, request: Request, body: AdminCheckinRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        管理员代签到接口
        POST /api/jianshen/checkin/admin/create
        管理员为用户进行签到
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.checkin_business.admin_checkin(
            user_id=body.user_id,
            course_id=body.course_id
        )

    def ActionJianshenCheckinMyListGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我的签到记录接口
        GET /api/jianshen/checkin/my/list/get
        用户查看自己的签到记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.get_my_checkins(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionJianshenCheckinAllListGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         keyword: Optional[str] = Query(None, description="搜索关键词"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取所有签到记录接口
        GET /api/jianshen/checkin/all/list/get
        管理员查看所有签到记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.checkin_business.get_all_checkins(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionJianshenCheckinStatusUpdatePost(self, request: Request, body: UpdateCheckinStatusRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        更新签到状态接口
        POST /api/jianshen/checkin/status/update
        管理员更新签到状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.checkin_business.update_checkin_status(body.checkin_id, body.status)

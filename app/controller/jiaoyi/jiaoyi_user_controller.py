from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    school: Optional[str] = Field(None, description="学校")
    major: Optional[str] = Field(None, description="专业")
    grade: Optional[str] = Field(None, description="年级")
    role: Optional[str] = Field('buyer', description="角色")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名/手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    school: Optional[str] = Field(None, description="学校")
    major: Optional[str] = Field(None, description="专业")
    grade: Optional[str] = Field(None, description="年级")
    role: Optional[str] = Field(None, description="角色")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class JiaoyiUserController:
    def __init__(self):
        from app.business.jiaoyi import JiaoyiUserBusiness
        self.user_business = JiaoyiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJiaoyiUserRegisterPost(self, request: Request, body: RegisterRequest):
        return self.user_business.register(
            username=body.username,
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            school=body.school or '',
            major=body.major or '',
            grade=body.grade or '',
            role=body.role or 'buyer'
        )

    def ActionJiaoyiUserLoginPost(self, request: Request, body: LoginRequest):
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionJiaoyiUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionJiaoyiUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionJiaoyiUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.school is not None:
            data['school'] = body.school
        if body.major is not None:
            data['major'] = body.major
        if body.grade is not None:
            data['grade'] = body.grade
        if body.role is not None:
            data['role'] = body.role

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionJiaoyiUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJiaoyiUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        return self.user_business.get_user_by_id(user_id)

    def ActionJiaoyiUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 school: Optional[str] = Query(None, description="学校"),
                                 keyword: Optional[str] = Query(None, description="关键词"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, status, school, keyword)

    def ActionJiaoyiUserStatusUpdatePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                          status: int = Query(..., description="状态"),
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(user_id, status)

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    role: Optional[str] = Field('student', description="角色")
    student_no: Optional[str] = Field(None, description="学号")
    teacher_no: Optional[str] = Field(None, description="教师号")
    department: Optional[str] = Field(None, description="院系")
    major: Optional[str] = Field(None, description="专业")
    class_name: Optional[str] = Field(None, description="班级")
    grade: Optional[str] = Field(None, description="年级")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="电话")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="电话")
    avatar: Optional[str] = Field(None, description="头像")
    department: Optional[str] = Field(None, description="院系")
    major: Optional[str] = Field(None, description="专业")
    class_name: Optional[str] = Field(None, description="班级")
    grade: Optional[str] = Field(None, description="年级")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class XuankeUserController:
    def __init__(self):
        from app.business.xuanke.user_business import XuankeUserBusiness
        self.user_business = XuankeUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXuankeUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/xuanke/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            password=body.password,
            real_name=body.real_name or '',
            role=body.role or 'student',
            student_no=body.student_no,
            teacher_no=body.teacher_no,
            department=body.department or '',
            major=body.major or '',
            class_name=body.class_name or '',
            grade=body.grade or '',
            email=body.email or '',
            phone=body.phone or ''
        )

    def ActionXuankeUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/xuanke/user/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionXuankeUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/xuanke/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionXuankeUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/xuanke/user/current/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionXuankeUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/xuanke/user/profile/update
        更新个人资料
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        for key in ['real_name', 'email', 'phone', 'avatar', 'department', 'major', 'class_name', 'grade']:
            if getattr(body, key, None) is not None:
                data[key] = getattr(body, key)

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionXuankeUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/xuanke/user/password/change
        验证原密码后修改为新密码
        """
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

    def ActionXuankeUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/xuanke/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionXuankeUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量"),
                             role: Optional[str] = Query(None, description="角色"),
                             status: Optional[int] = Query(None, description="状态"),
                             keyword: Optional[str] = Query(None, description="关键词"),
                             authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/xuanke/user/list/get
        管理员获取用户列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, role, status, keyword)

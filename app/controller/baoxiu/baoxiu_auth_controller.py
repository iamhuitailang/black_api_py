from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    phone: Optional[str] = Field(None, description="手机号")
    role: Optional[str] = Field('student', description="角色: student/repairman/admin")
    student_no: Optional[str] = Field(None, description="学号")
    dormitory_id: Optional[int] = Field(None, description="宿舍楼ID")
    room_number: Optional[str] = Field(None, description="房间号")
    worker_no: Optional[str] = Field(None, description="工号")
    specialty: Optional[str] = Field(None, description="维修专长")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class BaoxiuAuthController:
    def __init__(self):
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def ActionBaoxiuAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/baoxiu/auth/register
        """
        return self.auth_business.register(
            username=body.username,
            password=body.password,
            real_name=body.real_name or '',
            phone=body.phone or '',
            role=body.role or 'student',
            student_no=body.student_no or '',
            dormitory_id=body.dormitory_id or 0,
            room_number=body.room_number or '',
            worker_no=body.worker_no or '',
            specialty=body.specialty or ''
        )

    def ActionBaoxiuAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/baoxiu/auth/login
        """
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionBaoxiuAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/baoxiu/auth/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionBaoxiuAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/baoxiu/auth/current/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.get_current_user(token)

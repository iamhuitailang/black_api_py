from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class VerifyRealNameRequest(BaseModel):
    real_name: str = Field(..., description="真实姓名")
    id_card: str = Field(..., description="身份证号")


class UpdateProfileRequest(BaseModel):
    avatar_url: Optional[str] = Field(None, description="头像URL")
    nickname: Optional[str] = Field(None, description="昵称")


class UpdateContactRequest(BaseModel):
    contact_phone: Optional[str] = Field(None, description="联系电话")
    wechat_qrcode_url: Optional[str] = Field(None, description="微信二维码URL")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class DdUserController:
    def __init__(self):
        from app.business.dd.user_business import DdUserBusiness
        self.user_business = DdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDdUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/dd/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password
        )

    def ActionDdUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/dd/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionDdUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/dd/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionDdUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/dd/user/current/get
        根据token获取当前登录用户信息
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.get_current_user(token)

    def ActionDdUserVerifyPost(self, request: Request, body: VerifyRealNameRequest, 
                                authorization: Optional[str] = Header(None)):
        """
        实名认证接口
        POST /api/dd/user/verify
        提交真实姓名和身份证号进行实名认证
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.user_business.verify_real_name(
            user_id=user.get('id'),
            real_name=body.real_name,
            id_card=body.id_card
        )

    def ActionDdUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/dd/user/profile/update
        更新头像、昵称等个人资料
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
        if body.avatar_url is not None:
            data['avatar_url'] = body.avatar_url
        if body.nickname is not None:
            data['nickname'] = body.nickname
        
        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionDdUserContactUpdatePost(self, request: Request, body: UpdateContactRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新联系方式接口
        POST /api/dd/user/contact/update
        更新联系电话和微信二维码
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.user_business.update_contact_info(
            user_id=user.get('id'),
            contact_phone=body.contact_phone,
            wechat_qrcode_url=body.wechat_qrcode_url
        )

    def ActionDdUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/dd/user/password/change
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

    def ActionDdUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/dd/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

    def ActionDdUserListGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                            page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                            authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/dd/user/list/get
        分页获取用户列表
        """
        return self.user_business.get_user_list(page, page_size)

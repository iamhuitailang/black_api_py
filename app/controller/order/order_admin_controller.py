from typing import Optional
from fastapi import Header
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class OrderAdminController:
    def __init__(self):
        from app.business.order.admin_auth_business import OrderAdminAuthBusiness
        self.auth_business = OrderAdminAuthBusiness()

    def _get_token_from_header(self, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        return ''

    def ActionOrderAdminLoginPost(self, body: LoginRequest):
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionOrderAdminLogoutPost(self, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(authorization)
        return self.auth_business.logout(token)

    def ActionOrderAdminCurrentUserGet(self, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(authorization)
        return self.auth_business.get_current_user(token)
from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    phone: Optional[str] = Field(None, description="手机号")


class OrderUserController:
    def __init__(self):
        from app.business.order.user_auth_business import OrderUserAuthBusiness
        self.auth_business = OrderUserAuthBusiness()

    def ActionOrderUserLoginPost(self, body: LoginRequest):
        return self.auth_business.login(
            username=body.username,
            password=body.password
        )

    def ActionOrderUserRegisterPost(self, body: RegisterRequest):
        return self.auth_business.register(
            username=body.username,
            password=body.password,
            real_name=body.real_name or '',
            phone=body.phone or ''
        )

    def ActionOrderUserGet(self, user_id: int):
        return self.auth_business.get_user_by_id(user_id)
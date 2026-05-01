from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class TieluAuthController:
    def __init__(self):
        from app.business.tielu import TieluUserBusiness
        from app.model.tielu import (
            TieluUserModel, TieluTokenModel, TieluCityModel,
            TieluTrainModel, TieluGoodsConfigModel, TieluTrainConfigModel,
            TieluTrackConfigModel
        )
        TieluUserModel.create_table()
        TieluTokenModel.create_table()
        TieluCityModel.create_table()
        TieluTrainModel.create_table()
        from app.model.tielu.warehouse import TieluWarehouseModel
        TieluWarehouseModel.create_table()
        TieluGoodsConfigModel.create_table()
        TieluGoodsConfigModel.init_default_data()
        TieluTrainConfigModel.create_table()
        TieluTrainConfigModel.init_default_data()
        TieluTrackConfigModel.create_table()
        TieluTrackConfigModel.init_default_data()

        self.user_business = TieluUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionTieluAuthRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/tielu/auth/register
        新用户注册铁道大亨游戏，返回用户信息和token
        """
        return self.user_business.register(
            username=body.username,
            password=body.password
        )

    def ActionTieluAuthLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/tielu/auth/login
        用户名密码登录，返回用户信息和token
        """
        return self.user_business.login(
            username=body.username,
            password=body.password
        )

    def ActionTieluAuthLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/tielu/auth/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionTieluAuthCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/tielu/auth/current/get
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

        return self.user_business.get_user_profile(user.get('id'))

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    height: Optional[int] = Field(None, description="身高(cm)")
    weight: Optional[float] = Field(None, description="体重(kg)")


class UpdateDailyGoalRequest(BaseModel):
    daily_goal: int = Field(..., description="每日目标跳绳数量")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class TsUserController:
    def __init__(self):
        from app.business.ts.user_business import TsUserBusiness
        self.user_business = TsUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionTsUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/ts/user/register
        新用户注册，返回用户信息和token
        """
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or ''
        )

    def ActionTsUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/ts/user/login
        手机号密码登录，返回用户信息和token
        """
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionTsUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        用户登出接口
        POST /api/ts/user/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionTsUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息接口
        GET /api/ts/user/current/get
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

    def ActionTsUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/ts/user/profile/update
        更新昵称、头像、身高、体重等个人资料
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
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.height is not None:
            data['height'] = body.height
        if body.weight is not None:
            data['weight'] = body.weight

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionTsUserGoalUpdatePost(self, request: Request, body: UpdateDailyGoalRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        更新每日目标接口
        POST /api/ts/user/goal/update
        设置每日跳绳目标数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_daily_goal(
            user_id=user.get('id'),
            daily_goal=body.daily_goal
        )

    def ActionTsUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/ts/user/password/change
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

    def ActionTsUserStatsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户统计信息接口
        GET /api/ts/user/stats/get
        获取用户的详细统计信息（累计数据、最佳记录、成就统计等）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_stats(user.get('id'))

    def ActionTsUserRankingGet(self, request: Request, 
                                limit: int = Query(10, description="返回数量"),
                                order_by: str = Query('total_count', description="排序字段")):
        """
        获取排行榜接口
        GET /api/ts/user/ranking/get
        获取用户排行榜
        """
        return self.user_business.get_ranking(limit, order_by)

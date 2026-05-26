from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")
    bio: Optional[str] = Field(None, description="个人简介")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class TodoUserController:
    def __init__(self):
        from app.business.todo.todo_user_business import TodoUserBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.user_business = TodoUserBusiness()
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新个人资料接口
        POST /api/todo/user/profile/update
        更新昵称、邮箱、头像、个人简介等个人资料
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
        if body.email is not None:
            data['email'] = body.email
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.bio is not None:
            data['bio'] = body.bio

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionTodoUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        修改密码接口
        POST /api/todo/user/password/change
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

    def ActionTodoUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口
        GET /api/todo/user/detail/get
        根据用户ID获取公开的用户信息
        """
        return self.user_business.get_user_by_id(user_id)

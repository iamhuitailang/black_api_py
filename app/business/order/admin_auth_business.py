from typing import Dict, Any, Optional
from app.model.order.user import UserModel
from app.model.order.admin_token import AdminTokenModel


class OrderAdminAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = AdminTokenModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {
                'code': 1,
                'msg': '用户名不能为空',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_DISABLED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        if user.get('role') != self.user_model.ROLE_ADMIN:
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        self.token_model.delete_by_admin_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user),
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if token:
            self.token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_admin_by_token(token)

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.verify_token(token)
        if user:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.user_model.to_public_dict(user)
            }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }
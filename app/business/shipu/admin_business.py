from typing import Dict, Any, Optional
from app.model.shipu_077_model import AdminModel, AdminTokenModel


class ShipuAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
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

        admin = self.admin_model.verify_password(username, password)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if admin.get('status') == self.admin_model.STATUS_DISABLED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        self.token_model.delete_by_admin_id(admin.get('id'))
        token = self.token_model.create_token(admin.get('id'), hours=24)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': admin,
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        self.token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_admin_by_token(token)

    def get_current_admin(self, token: str) -> Dict[str, Any]:
        admin = self.token_model.get_admin_by_token(token)
        if admin:
            return {
                'code': 0,
                'msg': 'success',
                'data': admin
            }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }

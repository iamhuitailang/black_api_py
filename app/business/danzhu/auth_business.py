from typing import Dict, Any
from app.model.danzhu_model import AdminModel, AdminTokenModel
import re


class DanzhuAuthBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.admin_token_model = AdminTokenModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 20:
            return False
        pattern = r'^[a-zA-Z0-9_]+$'
        return re.match(pattern, username) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def admin_login(self, username: str, password: str) -> Dict[str, Any]:
        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确',
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

        self.admin_token_model.delete_by_admin_id(admin.get('id'))
        token = self.admin_token_model.create_token(admin.get('id'), hours=24)

        admin_full = self.admin_model.get_by_id(admin.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': self.admin_model.to_dict(admin_full),
                'token': token
            }
        }

    def admin_logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        self.admin_token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_admin_token(self, token: str):
        return self.admin_token_model.get_admin_by_token(token)

    def get_current_admin(self, token: str) -> Dict[str, Any]:
        admin = self.admin_token_model.get_admin_by_token(token)
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

    def change_admin_password(self, admin_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        if old_password == new_password:
            return {
                'code': 1,
                'msg': '新密码不能与原密码相同',
                'data': None
            }

        username = admin.get('username', '')
        verify_result = self.admin_model.verify_password(username, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'msg': '原密码错误',
                'data': None
            }

        if not self._validate_password(new_password):
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        affected = self.admin_model.update_password(admin_id, new_password)
        if affected > 0:
            self.admin_token_model.delete_by_admin_id(admin_id)
            return {
                'code': 0,
                'msg': '密码修改成功，请重新登录',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码修改失败',
            'data': None
        }

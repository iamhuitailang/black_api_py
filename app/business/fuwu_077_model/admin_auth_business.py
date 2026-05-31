from typing import Dict, Any, Optional
from app.model.fuwu_077_model import UserModel, AdminTokenModel


class AdminAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = AdminTokenModel()

    def login(self, phone: str, password: str) -> Dict[str, Any]:
        if not phone or not password:
            return {
                'code': 1,
                'msg': '账号和密码不能为空',
                'data': None
            }

        user = self.user_model.verify_password(phone, password)
        if user is None:
            return {
                'code': 1,
                'msg': '账号或密码错误',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无管理员权限',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        self.token_model.delete_by_admin_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)

        user_full = self.user_model.get_by_id(user.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user_full),
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

    def change_password(self, admin_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        admin = self.user_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        phone = admin.get('phone', '')
        verify_result = self.user_model.verify_password(phone, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'msg': '原密码错误',
                'data': None
            }

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        affected = self.user_model.update_password(admin_id, new_password)
        if affected > 0:
            self.token_model.delete_by_admin_id(admin_id)
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

from typing import Dict, Any, Optional
from app.model.qx import AdminModel, QxAdminTokenModel


class QxAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.token_model = QxAdminTokenModel()

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

        if admin.get('status') == AdminModel.STATUS_DISABLED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        self.token_model.delete_by_admin_id(admin.get('id'))
        token = self.token_model.create_token(admin.get('id'), hours=24)

        admin_full = self.admin_model.get_by_id(admin.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': self.admin_model.to_public_dict(admin_full),
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

    def get_admin_by_id(self, admin_id: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.admin_model.to_public_dict(admin)
        }

    def get_admin_list(self, page: int = 1, page_size: int = 10,
                       status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.admin_model.get_all(page, page_size, status, keyword)
        items = [self.admin_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def create_admin(self, username: str, password: str, nickname: str = '',
                     role: str = AdminModel.ROLE_ADMIN) -> Dict[str, Any]:
        if not username or len(username) < 2:
            return {
                'code': 1,
                'msg': '用户名至少2位',
                'data': None
            }

        if not password or len(password) < 6:
            return {
                'code': 1,
                'msg': '密码至少6位',
                'data': None
            }

        existing = self.admin_model.get_by_username(username)
        if existing:
            return {
                'code': 1,
                'msg': '用户名已存在',
                'data': None
            }

        admin_id = self.admin_model.create(username, password, nickname, role)
        if admin_id > 0:
            admin = self.admin_model.get_by_id(admin_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.admin_model.to_public_dict(admin)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_admin_status(self, admin_id: int, status: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        affected = self.admin_model.update_status(admin_id, status)
        if affected > 0:
            updated_admin = self.admin_model.get_by_id(admin_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.admin_model.to_public_dict(updated_admin)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def change_password(self, admin_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
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

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码至少6位',
                'data': None
            }

        affected = self.admin_model.update_password(admin_id, new_password)
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

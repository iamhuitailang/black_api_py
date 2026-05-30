from typing import Dict, Any, Optional
from app.model.biaoqing_model import AdminModel, AdminTokenModel


class BqAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.admin_token_model = AdminTokenModel()

    def _validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 20:
            return False
        return True

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def login(self, username: str, password: str, ip: str = '') -> Dict[str, Any]:
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

        admin = self.admin_model.verify_password(username, password, ip)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
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

    def logout(self, token: str) -> Dict[str, Any]:
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

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
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

    def create_admin(self, username: str, password: str, nickname: str = '',
                     avatar: str = '', role: int = 1, current_admin_role: int = 0) -> Dict[str, Any]:
        if current_admin_role != AdminModel.ROLE_SUPER_ADMIN:
            return {
                'code': 1,
                'msg': '无权限创建管理员',
                'data': None
            }

        if not self._validate_username(username):
            return {
                'code': 1,
                'msg': '用户名格式不正确',
                'data': None
            }

        if not self._validate_password(password):
            return {
                'code': 1,
                'msg': '密码长度至少6位',
                'data': None
            }

        existing = self.admin_model.get_by_username(username)
        if existing:
            return {
                'code': 1,
                'msg': '用户名已存在',
                'data': None
            }

        admin_id = self.admin_model.create(username, password, nickname, avatar, role)
        if admin_id > 0:
            admin = self.admin_model.get_by_id(admin_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.admin_model.to_dict(admin)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_admin_list(self, page: int = 1, page_size: int = 20,
                       status: int = None, role: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.admin_model.get_all(page, page_size, status, role, keyword)
        items = [self.admin_model.to_dict(item) for item in result.get('items', [])]

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

    def update_admin_status(self, admin_id: int, status: int, current_admin_role: int = 0) -> Dict[str, Any]:
        if current_admin_role != AdminModel.ROLE_SUPER_ADMIN:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        affected = self.admin_model.update_status(admin_id, status)
        if affected > 0:
            updated = self.admin_model.get_by_id(admin_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.admin_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_password(self, admin_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
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

    def delete_admin(self, admin_id: int, current_admin_role: int = 0) -> Dict[str, Any]:
        if current_admin_role != AdminModel.ROLE_SUPER_ADMIN:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        if admin.get('role') == AdminModel.ROLE_SUPER_ADMIN:
            return {
                'code': 1,
                'msg': '不能删除超级管理员',
                'data': None
            }

        affected = self.admin_model.delete(admin_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

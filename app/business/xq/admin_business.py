from typing import Dict, Any, Optional
from app.model.xq import AdminModel, XqAdminTokenModel


class XqAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.token_model = XqAdminTokenModel()

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

        self.token_model.delete_by_admin_id(admin.get('id'))
        token = self.token_model.create_token(admin.get('id'), hours=24)

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

    def create_admin(self, username: str, password: str, real_name: str = '') -> Dict[str, Any]:
        if not username or len(username) < 3:
            return {
                'code': 1,
                'msg': '用户名至少3个字符',
                'data': None
            }

        if not password or len(password) < 6:
            return {
                'code': 1,
                'msg': '密码至少6个字符',
                'data': None
            }

        existing = self.admin_model.get_by_username(username)
        if existing:
            return {
                'code': 1,
                'msg': '用户名已存在',
                'data': None
            }

        admin_id = self.admin_model.create(username, password, real_name)
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
                'msg': '新密码至少6个字符',
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

    def update_profile(self, admin_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        affected = self.admin_model.update_profile(admin_id, data)
        if affected >= 0:
            updated_admin = self.admin_model.get_by_id(admin_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.admin_model.to_dict(updated_admin)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_admin_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.admin_model.get_all(page, page_size)
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

    def delete_admin(self, admin_id: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        if admin.get('username') == 'admin':
            return {
                'code': 1,
                'msg': '不能删除超级管理员',
                'data': None
            }

        self.token_model.delete_by_admin_id(admin_id)
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

    def disable_admin(self, admin_id: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        if admin.get('username') == 'admin':
            return {
                'code': 1,
                'msg': '不能禁用超级管理员',
                'data': None
            }

        affected = self.admin_model.update_status(admin_id, AdminModel.STATUS_DISABLED)
        if affected > 0:
            self.token_model.delete_by_admin_id(admin_id)
            return {
                'code': 0,
                'msg': '禁用成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '禁用失败',
            'data': None
        }

    def enable_admin(self, admin_id: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        affected = self.admin_model.update_status(admin_id, AdminModel.STATUS_ACTIVE)
        if affected > 0:
            return {
                'code': 0,
                'msg': '启用成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '启用失败',
            'data': None
        }

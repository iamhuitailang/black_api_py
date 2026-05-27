from typing import Dict, Any, Optional
from app.model.jiaoyi import AdminModel, AdminTokenModel


class JiaoyiAdminBusiness:
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
                'admin': self.admin_model.to_public_dict(admin),
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

        if len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
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

    def get_admin_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.admin_model.get_all(page, page_size)
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

    def create_admin(self, username: str, password: str, nickname: str = '') -> Dict[str, Any]:
        if not username or len(username) < 3:
            return {
                'code': 1,
                'msg': '用户名长度至少3位',
                'data': None
            }

        if not password or len(password) < 6:
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

        admin_id = self.admin_model.create(username, password, nickname)
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

    def delete_admin(self, admin_id: int, current_admin_id: int) -> Dict[str, Any]:
        if admin_id == current_admin_id:
            return {
                'code': 1,
                'msg': '不能删除自己',
                'data': None
            }

        admin = self.admin_model.get_by_id(admin_id)
        if admin and admin.get('role') == self.admin_model.ROLE_SUPER:
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

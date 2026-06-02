from typing import Dict, Any
from app.model.danzhu_model import AdminModel


class DanzhuAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()

    def get_admin_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.admin_model.get_all(page, page_size)
        items = [self.admin_model.to_dict(admin) for admin in result.get('items', [])]

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

    def get_admin_detail(self, admin_id: int) -> Dict[str, Any]:
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
            'data': self.admin_model.to_dict(admin)
        }

    def create_admin(self, username: str, password: str, real_name: str = '') -> Dict[str, Any]:
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

    def update_admin(self, admin_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
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

    def delete_admin(self, admin_id: int) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
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
                'data': self.admin_model.to_dict(updated_admin)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

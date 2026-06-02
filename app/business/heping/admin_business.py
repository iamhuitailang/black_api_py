from typing import Dict, Any, Optional
from app.model.heping_model import HepingAdminModel, HepingAdminTokenModel, HepingUserModel


class HepingAdminBusiness:
    def __init__(self):
        self.admin_model = HepingAdminModel()
        self.admin_token_model = HepingAdminTokenModel()
        self.user_model = HepingUserModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not password:
            return {
                'code': 1,
                'msg': '用户名和密码不能为空',
                'data': None
            }

        admin = self.admin_model.verify_password(username, password)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        self.admin_token_model.delete_by_admin_id(admin.get('id'))
        token = self.admin_token_model.create_token(admin.get('id'), hours=24)

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
            admin_full = self.admin_model.get_by_id(admin.get('id'))
            if admin_full:
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': admin_full
                }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      keyword: str = None, status: int = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, status, keyword)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]

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

    def update_user_status(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.delete(user_id)
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

from typing import Dict, Any
from app.model.huangjin_model import HuangjinUserModel, HuangjinTokenModel
from app.business.huangjin_model.auth_business import HuangjinAuthBusiness


class HuangjinAdminBusiness:
    def __init__(self):
        self.user_model = HuangjinUserModel()
        self.token_model = HuangjinTokenModel()
        self.auth_business = HuangjinAuthBusiness()

    def admin_login(self, username: str, password: str) -> Dict[str, Any]:
        user = self.user_model.verify_password(username, password)
        if user is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if user.get('role') != self.user_model.ROLE_ADMIN:
            return {
                'code': 1,
                'msg': '无管理员权限',
                'data': None
            }

        self.token_model.delete_by_user_id(user.get('id'))
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

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, role: int = None,
                      keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, status, role, keyword)
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

    def ban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('role') == self.user_model.ROLE_ADMIN:
            return {
                'code': 1,
                'msg': '不能封禁管理员',
                'data': None
            }

        affected = self.user_model.update_status(user_id, self.user_model.STATUS_BANNED)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '封禁成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '封禁失败',
            'data': None
        }

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, self.user_model.STATUS_ACTIVE)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '解封成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '解封失败',
            'data': None
        }

    def set_admin_role(self, user_id: int, role: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_role(user_id, role)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '角色更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '角色更新失败',
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

        if user.get('username') == 'admin':
            return {
                'code': 1,
                'msg': '不能删除超级管理员',
                'data': None
            }

        self.token_model.delete_by_user_id(user_id)
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

    def reset_user_password(self, user_id: int, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码至少6位',
                'data': None
            }

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '密码重置成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码重置失败',
            'data': None
        }

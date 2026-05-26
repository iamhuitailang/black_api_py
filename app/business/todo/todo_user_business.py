from typing import Dict, Any, Optional
from app.model.todo import TodoUserModel


class TodoUserBusiness:
    def __init__(self):
        self.user_model = TodoUserModel()

    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.user_model.to_public_dict(user)
        }

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_profile(user_id, data)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        from app.model.todo import TodoTokenModel
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
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

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            token_model = TodoTokenModel()
            token_model.delete_by_user_id(user_id)
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

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, keyword: str = None) -> Dict[str, Any]:
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

from typing import Dict, Any, Optional
from app.model.jianshen import JianshenUserModel, JianshenTokenModel


class JianshenUserBusiness:
    def __init__(self):
        self.user_model = JianshenUserModel()
        self.token_model = JianshenTokenModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {'code': 1, 'msg': '用户名不能为空', 'data': None}
        if not password:
            return {'code': 1, 'msg': '密码不能为空', 'data': None}
        user = self.user_model.verify_password(username, password)
        if user is None:
            return {'code': 1, 'msg': '用户名或密码错误', 'data': None}
        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'))
        user_full = self.user_model.get_by_id(user.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_dict(user_full),
                'token': token
            }
        }

    def register(self, username: str, password: str, nickname: str = '', email: str = '') -> Dict[str, Any]:
        if not username or len(username) < 3:
            return {'code': 1, 'msg': '用户名至少3个字符', 'data': None}
        if not password or len(password) < 6:
            return {'code': 1, 'msg': '密码至少6个字符', 'data': None}
        if self.user_model.get_by_username(username):
            return {'code': 1, 'msg': '用户名已存在', 'data': None}
        user_id = self.user_model.create(username, password, nickname, email)
        if user_id > 0:
            user = self.user_model.get_by_id(user_id)
            token = self.token_model.create_token(user_id)
            return {
                'code': 0,
                'msg': '注册成功',
                'data': {
                    'user': self.user_model.to_dict(user),
                    'token': token
                }
            }
        return {'code': 1, 'msg': '注册失败', 'data': None}

    def logout(self, token: str) -> Dict[str, Any]:
        if token:
            self.token_model.delete_token(token)
        return {'code': 0, 'msg': '退出成功', 'data': None}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {'code': 0, 'msg': 'success', 'data': user}
        return {'code': 1, 'msg': 'token无效或已过期', 'data': None}

    def get_profile(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.user_model.to_dict(user)}

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.user_model.update_profile(user_id, data)
        updated = self.user_model.get_by_id(user_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.user_model.to_dict(updated)}

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        verify = self.user_model.verify_password(user.get('username', ''), old_password)
        if verify is None:
            return {'code': 1, 'msg': '原密码错误', 'data': None}
        if not new_password or len(new_password) < 6:
            return {'code': 1, 'msg': '新密码至少6个字符', 'data': None}
        if old_password == new_password:
            return {'code': 1, 'msg': '新密码不能与原密码相同', 'data': None}
        self.user_model.update_password(user_id, new_password)
        self.token_model.delete_by_user_id(user_id)
        return {'code': 0, 'msg': '密码修改成功，请重新登录', 'data': None}

    def update_settings(self, user_id: int, notification_enabled: int = None,
                        theme: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.user_model.update_settings(user_id, notification_enabled, theme)
        updated = self.user_model.get_by_id(user_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.user_model.to_dict(updated)}

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, status, keyword)
        items = [self.user_model.to_dict(item) for item in result.get('items', [])]
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

    def disable_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.user_model.update_status(user_id, JianshenUserModel.STATUS_DISABLED)
        self.token_model.delete_by_user_id(user_id)
        return {'code': 0, 'msg': '禁用成功', 'data': None}

    def enable_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.user_model.update_status(user_id, JianshenUserModel.STATUS_ACTIVE)
        return {'code': 0, 'msg': '启用成功', 'data': None}

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        self.token_model.delete_by_user_id(user_id)
        if self.user_model.delete(user_id) > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

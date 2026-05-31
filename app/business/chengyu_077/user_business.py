from typing import Dict, Any, Optional
from app.model.chengyu_077.user import ChengyuUserModel
from app.model.auth.token import TokenModel


class ChengyuUserBusiness:
    def __init__(self):
        self.user_model = ChengyuUserModel()
        self.token_model = TokenModel()

    def register(self, username: str, password: str, nickname: str = '', email: str = '') -> Dict[str, Any]:
        if not username or not username.strip():
            return {'code': 1, 'message': '用户名不能为空', 'data': None}
        if not password or len(password) < 6:
            return {'code': 1, 'message': '密码长度至少6位', 'data': None}
        existing = self.user_model.get_by_username(username.strip())
        if existing:
            return {'code': 1, 'message': '用户名已存在', 'data': None}
        user_id = self.user_model.create(username.strip(), password, nickname.strip(), email.strip())
        user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'message': '注册成功',
            'data': {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'email': user.get('email')
            }
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not password:
            return {'code': 1, 'message': '用户名和密码不能为空', 'data': None}
        user = self.user_model.verify_password(username.strip(), password)
        if user is None:
            return {'code': 1, 'message': '用户名或密码错误', 'data': None}
        if user.get('status') != 1:
            return {'code': 1, 'message': '账号已被禁用', 'data': None}
        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)
        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'access_token': token,
                'user': {
                    'id': user.get('id'),
                    'username': user.get('username'),
                    'nickname': user.get('nickname'),
                    'email': user.get('email'),
                    'total_score': user.get('total_score', 0),
                    'total_games': user.get('total_games', 0),
                    'total_wins': user.get('total_wins', 0)
                }
            }
        }

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if not user:
            return {'code': 1, 'message': '未登录或登录已过期', 'data': None}
        full_user = self.user_model.get_by_id(user.get('id'))
        if not full_user:
            return {'code': 1, 'message': '用户不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': full_user.get('id'),
                'username': full_user.get('username'),
                'nickname': full_user.get('nickname'),
                'email': full_user.get('email'),
                'total_score': full_user.get('total_score', 0),
                'total_games': full_user.get('total_games', 0),
                'total_wins': full_user.get('total_wins', 0)
            }
        }

    def update_profile(self, user_id: int, nickname: str = None, email: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}
        self.user_model.update_profile(user_id, nickname, email)
        updated = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'message': '修改成功',
            'data': {
                'id': updated.get('id'),
                'username': updated.get('username'),
                'nickname': updated.get('nickname'),
                'email': updated.get('email')
            }
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}
        verify = self.user_model.verify_password(user.get('username'), old_password)
        if verify is None:
            return {'code': 1, 'message': '原密码错误', 'data': None}
        if old_password == new_password:
            return {'code': 1, 'message': '新密码不能与原密码相同', 'data': None}
        if not new_password or len(new_password) < 6:
            return {'code': 1, 'message': '新密码长度至少6位', 'data': None}
        self.user_model.update_password(user_id, new_password)
        self.token_model.delete_by_user_id(user_id)
        return {'code': 0, 'message': '密码修改成功，请重新登录', 'data': None}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

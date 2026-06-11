from typing import Dict, Any, Optional
from app.model.auth import UserModel, TokenModel


class AuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()

    def register(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }

        if not password or len(password) < 6:
            return {
                'code': 1,
                'message': '密码长度至少6位',
                'data': None
            }

        username = username.strip()

        existing = self.user_model.get_by_username(username)
        if existing:
            return {
                'code': 1,
                'message': '用户名已存在',
                'data': None
            }

        user_id = self.user_model.create(username, password)
        if user_id <= 0:
            return {
                'code': 1,
                'message': '注册失败',
                'data': None
            }

        token = self.token_model.create_token(user_id, hours=24)

        return {
            'code': 0,
            'message': '注册成功',
            'data': {
                'user': {
                    'id': user_id,
                    'username': username
                },
                'token': token
            }
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }
        
        if not password or not password.strip():
            return {
                'code': 1,
                'message': '密码不能为空',
                'data': None
            }
        
        user = self.user_model.verify_password(username.strip(), password)
        
        if user is None:
            return {
                'code': 1,
                'message': '用户名或密码错误',
                'data': None
            }
        
        if user.get('status') != 1:
            return {
                'code': 1,
                'message': '用户已被禁用',
                'data': None
            }
        
        self.token_model.delete_by_user_id(user.get('id'))
        
        token = self.token_model.create_token(user.get('id'), hours=24)
        
        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'user': {
                    'id': user.get('id'),
                    'username': user.get('username')
                },
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'message': 'success',
                'data': None
            }
        
        affected = self.token_model.delete_token(token)
        if affected > 0:
            return {
                'code': 0,
                'message': '退出成功',
                'data': None
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }
        
        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'message': '原密码错误',
                'data': None
            }
        
        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'message': '新密码长度至少6位',
                'data': None
            }
        
        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {
                'code': 0,
                'message': '密码修改成功，请重新登录',
                'data': None
            }
        
        return {
            'code': 1,
            'message': '密码修改失败',
            'data': None
        }

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {
                'code': 0,
                'message': 'success',
                'data': user
            }
        
        return {
            'code': 1,
            'message': 'token无效或已过期',
            'data': None
        }

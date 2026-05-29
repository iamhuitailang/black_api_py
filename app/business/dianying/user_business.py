import hashlib
import secrets
from typing import Dict, Any, Optional
from app.model.dianying.user import DianyingUserModel


class DianyingUserBusiness:
    def __init__(self):
        self.model = DianyingUserModel()

    def register(self, username: str, password: str, email: str = '') -> Dict[str, Any]:
        existing = self.model.get_by_username(username)
        if existing:
            return {'code': 1, 'message': '用户名已存在', 'data': None}
        try:
            user_id = self.model.create(username, password, email)
            user = self.model.get_by_id(user_id)
            return {
                'code': 0,
                'message': '注册成功',
                'data': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user.get('email', ''),
                    'role': user.get('role', 'user'),
                    'avatar': user.get('avatar', '')
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def login(self, username: str, password: str) -> Dict[str, Any]:
        user = self.model.verify_password(username, password)
        if not user:
            return {'code': 1, 'message': '用户名或密码错误', 'data': None}
        token = self._generate_token(user['id'], user['username'], user['role'])
        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'access_token': token,
                'token_type': 'bearer',
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user.get('email', ''),
                    'role': user.get('role', 'user'),
                    'avatar': user.get('avatar', '')
                }
            }
        }

    def get_user_info(self, user_id: int) -> Dict[str, Any]:
        user = self.model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': user['id'],
                'username': user['username'],
                'email': user.get('email', ''),
                'role': user.get('role', 'user'),
                'avatar': user.get('avatar', ''),
                'created_at': user.get('created_at', '')
            }
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        if old_password == new_password:
            return {'code': 1, 'message': '新密码不能与原密码相同', 'data': None}
        success = self.model.change_password(user_id, old_password, new_password)
        if not success:
            return {'code': 1, 'message': '原密码错误', 'data': None}
        return {'code': 0, 'message': '密码修改成功', 'data': None}

    def update_profile(self, user_id: int, email: str = None, avatar: str = None) -> Dict[str, Any]:
        self.model.update_profile(user_id, email, avatar)
        return self.get_user_info(user_id)

    def _generate_token(self, user_id: int, username: str, role: str) -> str:
        import time
        raw = f"{user_id}:{username}:{role}:{time.time()}:{secrets.token_hex(16)}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.dianying.user import DianyingUserModel
        db = DianyingUserModel().db
        parts = token.split(':')
        if len(parts) < 2:
            try:
                row = db.fetch_one("SELECT * FROM tb_dianying_model_token WHERE token = ?", (token,))
                if row:
                    user = self.model.get_by_id(row['user_id'])
                    if user:
                        return {
                            'id': user['id'],
                            'username': user['username'],
                            'role': user.get('role', 'user')
                        }
            except Exception:
                pass
            return None
        return None

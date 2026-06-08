from typing import Dict, Any, Optional
import re
from app.model.dafeiji import DafeijiUserModel


class DafeijiAuthBusiness:
    def __init__(self):
        self.user_model = DafeijiUserModel()

    def register(self, username: str, password: str, confirm_password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {'code': 1, 'message': '用户名不能为空', 'data': None}

        username = username.strip()
        if len(username) < 3 or len(username) > 20:
            return {'code': 1, 'message': '用户名长度需在3-20个字符之间', 'data': None}

        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return {'code': 1, 'message': '用户名只能包含字母、数字和下划线', 'data': None}

        if not password or len(password) < 6 or len(password) > 32:
            return {'code': 1, 'message': '密码长度需在6-32个字符之间', 'data': None}

        if password != confirm_password:
            return {'code': 1, 'message': '两次输入的密码不一致', 'data': None}

        existing = self.user_model.get_by_username(username)
        if existing:
            return {'code': 1, 'message': '用户名已存在', 'data': None}

        user_id = self.user_model.create(username, password, role='user')
        if user_id > 0:
            return {'code': 0, 'message': '注册成功', 'data': {'user_id': user_id, 'username': username}}

        return {'code': 1, 'message': '注册失败', 'data': None}

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {'code': 1, 'message': '用户名不能为空', 'data': None}

        if not password:
            return {'code': 1, 'message': '密码不能为空', 'data': None}

        user = self.user_model.verify_password(username.strip(), password)
        if user is None:
            return {'code': 1, 'message': '用户名或密码错误', 'data': None}

        if user.get('status') != 1:
            return {'code': 1, 'message': '用户已被禁用', 'data': None}

        token = DafeijiUserModel.create_token(
            user_id=user.get('id'),
            username=user.get('username'),
            role=user.get('role', 'user')
        )

        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'token': token,
                'user': {
                    'id': user.get('id'),
                    'username': user.get('username'),
                    'role': user.get('role', 'user')
                }
            }
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {'code': 1, 'message': '原密码错误', 'data': None}

        if not new_password or len(new_password) < 6 or len(new_password) > 32:
            return {'code': 1, 'message': '新密码长度需在6-32个字符之间', 'data': None}

        if old_password == new_password:
            return {'code': 1, 'message': '新密码不能与旧密码相同', 'data': None}

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            return {'code': 0, 'message': '密码修改成功', 'data': None}

        return {'code': 1, 'message': '密码修改失败', 'data': None}

    def get_current_user(self, token: str) -> Dict[str, Any]:
        payload = DafeijiUserModel.decode_token(token)
        if not payload:
            return {'code': 1, 'message': 'token无效或已过期', 'data': None}

        user_id = payload.get('user_id')
        user = self.user_model.get_by_id(user_id)
        if not user or user.get('status') != 1:
            return {'code': 1, 'message': '用户不存在或已被禁用', 'data': None}

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': user.get('id'),
                'username': user.get('username'),
                'role': user.get('role', 'user'),
                'total_score': user.get('total_score', 0),
                'total_kills': user.get('total_kills', 0),
                'highest_wave': user.get('highest_wave', 0)
            }
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        payload = DafeijiUserModel.decode_token(token)
        if not payload:
            return None
        user_id = payload.get('user_id')
        user = self.user_model.get_by_id(user_id)
        if not user or user.get('status') != 1:
            return None
        return {
            'user_id': user_id,
            'username': user.get('username'),
            'role': user.get('role', 'user')
        }

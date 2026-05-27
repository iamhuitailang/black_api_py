from typing import Dict, Any, Optional
from app.model.renlei import UserModel
import hashlib
import secrets
from datetime import datetime, timedelta
import json


class UserBusiness:
    def __init__(self):
        self.model = UserModel()
        self.SECRET_KEY = 'renlei-game-secret-key'

    def _create_token(self, user_id: int, username: str) -> str:
        payload = {
            'user_id': user_id,
            'username': username,
            'exp': (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        import base64
        return base64.b64encode(json.dumps(payload).encode()).decode()

    def _decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            import base64
            payload = json.loads(base64.b64decode(token.encode()).decode())
            if 'exp' in payload and datetime.fromisoformat(payload['exp']) < datetime.utcnow():
                return None
            return payload
        except:
            return None

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        payload = self._decode_token(token)
        if not payload:
            return None
        user = self.model.get_by_id(payload['user_id'])
        if not user:
            return None
        return {
            'id': user['id'],
            'username': user['username'],
            'nickname': user['nickname'],
            'email': user['email'],
            'avatar': user['avatar'],
            'current_character_id': user['current_character_id'],
            'current_level_id': user['current_level_id']
        }

    def register(self, username: str, password: str, email: str = None, nickname: str = None) -> Dict[str, Any]:
        if not username or not password:
            return {'code': 1, 'message': '用户名和密码不能为空', 'data': None}
        
        if len(password) < 6:
            return {'code': 1, 'message': '密码长度至少6位', 'data': None}
        
        existing = self.model.get_by_username(username)
        if existing:
            return {'code': 1, 'message': '用户名已存在', 'data': None}
        
        user_id = self.model.create(username, password, email, nickname)
        user = self.model.get_by_id(user_id)
        
        return {
            'code': 0,
            'message': '注册成功',
            'data': {
                'id': user['id'],
                'username': user['username'],
                'nickname': user['nickname']
            }
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        user_info = self.model.verify_password(username, password)
        if not user_info:
            return {'code': 1, 'message': '用户名或密码错误', 'data': None}
        
        token = self._create_token(user_info['id'], user_info['username'])
        
        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'token': token,
                'user': user_info
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
                'nickname': user['nickname'],
                'email': user['email'],
                'avatar': user['avatar'],
                'current_character_id': user['current_character_id'],
                'current_level_id': user['current_level_id']
            }
        }

    def update_user(self, user_id: int, **kwargs) -> Dict[str, Any]:
        affected = self.model.update(user_id, **kwargs)
        if affected > 0:
            user = self.model.get_by_id(user_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': {
                    'id': user['id'],
                    'nickname': user['nickname'],
                    'email': user['email'],
                    'avatar': user['avatar']
                }
            }
        return {'code': 1, 'message': '更新失败', 'data': None}

    def set_current_character(self, user_id: int, character_id: int) -> Dict[str, Any]:
        affected = self.model.set_current_character(user_id, character_id)
        if affected > 0:
            return {'code': 0, 'message': '设置成功', 'data': {'current_character_id': character_id}}
        return {'code': 1, 'message': '设置失败', 'data': None}

    def set_current_level(self, user_id: int, level_id: int) -> Dict[str, Any]:
        affected = self.model.set_current_level(user_id, level_id)
        if affected > 0:
            return {'code': 0, 'message': '设置成功', 'data': {'current_level_id': level_id}}
        return {'code': 1, 'message': '设置失败', 'data': None}

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        if len(new_password) < 6:
            return {'code': 1, 'message': '新密码长度至少6位', 'data': None}
        
        success = self.model.change_password(user_id, old_password, new_password)
        if success:
            return {'code': 0, 'message': '密码修改成功', 'data': None}
        return {'code': 1, 'message': '原密码错误', 'data': None}

    def list_users(self, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        users = self.model.get_all(skip, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'id': u['id'],
                'username': u['username'],
                'nickname': u['nickname'],
                'email': u['email'],
                'is_active': u['is_active']
            } for u in users]
        }

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        affected = self.model.delete(user_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

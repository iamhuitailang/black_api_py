from typing import Dict, Any, Optional
from app.model.blog import BlogUserModel, BlogTokenModel


class BlogAuthBusiness:
    def __init__(self):
        self.user_model = BlogUserModel()
        self.token_model = BlogTokenModel()

    def register(self, username: str, password: str, nickname: str = None, email: str = None) -> Dict[str, Any]:
        if not username or len(username.strip()) < 3:
            return {
                'code': 1,
                'message': '用户名至少 3 个字符',
                'data': None
            }
        if not password or len(password) < 6:
            return {
                'code': 1,
                'message': '密码至少 6 位',
                'data': None
            }
        if self.user_model.exists_by_username(username):
            return {
                'code': 1,
                'message': '用户名已被注册',
                'data': None
            }

        user_id = self.user_model.create(
            username=username,
            password=password,
            nickname=nickname,
            email=email
        )

        if user_id > 0:
            user = self.user_model.get_by_id(user_id)
            token = self.token_model.create_token(user_id, hours=24 * 7)
            return {
                'code': 0,
                'message': '注册成功',
                'data': {
                    'user': self.user_model.to_dict(user),
                    'token': token
                }
            }

        return {
            'code': 1,
            'message': '注册失败',
            'data': None
        }

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }
        if not password:
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

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24 * 7)

        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'user': user,
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {'code': 0, 'message': 'success', 'data': None}
        self.token_model.delete_token(token)
        return {'code': 0, 'message': '退出成功', 'data': None}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

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
            'message': 'token 无效或已过期',
            'data': None
        }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {'code': 1, 'message': '原密码错误', 'data': None}

        if old_password == new_password:
            return {'code': 1, 'message': '新密码不能与原密码相同', 'data': None}

        if not new_password or len(new_password) < 6:
            return {'code': 1, 'message': '新密码至少 6 位', 'data': None}

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {'code': 0, 'message': '密码修改成功，请重新登录', 'data': None}

        return {'code': 1, 'message': '密码修改失败', 'data': None}

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        affected = self.user_model.update_profile(user_id, data)
        if affected >= 0:
            updated = self.user_model.get_by_id(user_id)
            return {'code': 0, 'message': '保存成功', 'data': self.user_model.to_dict(updated)}

        return {'code': 1, 'message': '保存失败', 'data': None}

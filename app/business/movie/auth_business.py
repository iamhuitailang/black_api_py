from typing import Dict, Any, Optional
from app.model.movie import UserModel, TokenModel


class MovieAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()

    def register(self, username: str, password: str, nickname: str = '',
                 email: str = '', phone: str = '') -> Dict[str, Any]:
        if not username or len(username) < 3:
            return {'code': 1, 'msg': '用户名至少3个字符', 'data': None}

        if not password or len(password) < 6:
            return {'code': 1, 'msg': '密码至少6个字符', 'data': None}

        existing = self.user_model.get_by_username(username)
        if existing:
            return {'code': 1, 'msg': '用户名已存在', 'data': None}

        user_id = self.user_model.create(
            username=username,
            password=password,
            nickname=nickname,
            email=email,
            phone=phone,
            role=UserModel.ROLE_USER
        )
        if user_id > 0:
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '注册成功',
                'data': self.user_model.to_public_dict(user)
            }

        return {'code': 1, 'msg': '注册失败', 'data': None}

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {'code': 1, 'msg': '用户名不能为空', 'data': None}

        if not password:
            return {'code': 1, 'msg': '密码不能为空', 'data': None}

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {'code': 1, 'msg': '用户名或密码错误', 'data': None}

        if user.get('status') == UserModel.STATUS_BANNED:
            return {'code': 1, 'msg': '账号已被封禁', 'data': None}

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), role=user.get('role'), hours=24)

        user_full = self.user_model.get_by_id(user.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user_full),
                'token': token
            }
        }

    def admin_login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {'code': 1, 'msg': '用户名不能为空', 'data': None}

        if not password:
            return {'code': 1, 'msg': '密码不能为空', 'data': None}

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {'code': 1, 'msg': '用户名或密码错误', 'data': None}

        if user.get('role') != UserModel.ROLE_ADMIN:
            return {'code': 1, 'msg': '权限不足，仅管理员可登录', 'data': None}

        if user.get('status') == UserModel.STATUS_BANNED:
            return {'code': 1, 'msg': '账号已被封禁', 'data': None}

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), role=UserModel.ROLE_ADMIN, hours=24)

        user_full = self.user_model.get_by_id(user.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user_full),
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {'code': 0, 'msg': 'success', 'data': None}

        self.token_model.delete_token(token)
        return {'code': 0, 'msg': '退出成功', 'data': None}

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {'code': 0, 'msg': 'success', 'data': user}

        return {'code': 1, 'msg': 'token无效或已过期', 'data': None}

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        username = user.get('username', '')
        verify_result = self.user_model.verify_password(username, old_password)
        if verify_result is None:
            return {'code': 1, 'msg': '原密码错误', 'data': None}

        if not new_password or len(new_password) < 6:
            return {'code': 1, 'msg': '新密码至少6个字符', 'data': None}

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {'code': 0, 'msg': '密码修改成功，请重新登录', 'data': None}

        return {'code': 1, 'msg': '密码修改失败', 'data': None}

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        affected = self.user_model.update_profile(user_id, data)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {'code': 1, 'msg': '更新失败', 'data': None}
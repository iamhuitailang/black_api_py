from typing import Dict, Any, Optional
from app.model.bm import UserModel, AdminTokenModel, UserTokenModel


class BmAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.admin_token_model = AdminTokenModel()
        self.user_token_model = UserTokenModel()

    def admin_login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not password:
            return {
                'code': 1,
                'msg': '用户名和密码不能为空',
                'data': None
            }

        user = self.user_model.verify_admin_password(username, password)
        if not user:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        self.admin_token_model.delete_by_user_id(user.get('id'))
        token = self.admin_token_model.create_token(user.get('id'), hours=24)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user),
                'token': token
            }
        }

    def admin_logout(self, token: str) -> Dict[str, Any]:
        if token:
            self.admin_token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def get_admin_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        return self.admin_token_model.get_user_by_token(token)

    def user_register(self, phone: str, password: str, nickname: str = '',
                      real_name: str = '', email: str = '') -> Dict[str, Any]:
        if not phone or not password:
            return {
                'code': 1,
                'msg': '手机号和密码不能为空',
                'data': None
            }

        existing = self.user_model.get_by_phone(phone)
        if existing:
            return {
                'code': 1,
                'msg': '该手机号已注册',
                'data': None
            }

        user_id = self.user_model.create(
            username=phone,
            password=password,
            nickname=nickname or f'用户{phone[-4:]}',
            real_name=real_name,
            phone=phone,
            email=email
        )

        if user_id > 0:
            user = self.user_model.get_by_id(user_id)
            token = self.user_token_model.create_token(user_id, hours=24)
            return {
                'code': 0,
                'msg': '注册成功',
                'data': {
                    'user': self.user_model.to_public_dict(user),
                    'token': token
                }
            }

        return {
            'code': 1,
            'msg': '注册失败',
            'data': None
        }

    def user_login(self, phone: str, password: str) -> Dict[str, Any]:
        if not phone or not password:
            return {
                'code': 1,
                'msg': '手机号和密码不能为空',
                'data': None
            }

        user = self.user_model.verify_user_password(phone, password)
        if not user:
            return {
                'code': 1,
                'msg': '手机号或密码错误',
                'data': None
            }

        self.user_token_model.delete_by_user_id(user.get('id'))
        token = self.user_token_model.create_token(user.get('id'), hours=24)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user),
                'token': token
            }
        }

    def user_logout(self, token: str) -> Dict[str, Any]:
        if token:
            self.user_token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        return self.user_token_model.get_user_by_token(token)

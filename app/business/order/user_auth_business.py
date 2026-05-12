from typing import Dict, Any, Optional
from app.model.order.user import UserModel


class OrderUserAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {
                'code': 1,
                'msg': '用户名不能为空',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        user = self.user_model.verify_password(username, password)
        if user is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_DISABLED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': self.user_model.to_public_dict(user)
            }
        }

    def register(self, username: str, password: str, real_name: str = '',
                 phone: str = '') -> Dict[str, Any]:
        if not username:
            return {
                'code': 1,
                'msg': '用户名不能为空',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        existing_user = self.user_model.get_by_username(username)
        if existing_user:
            return {
                'code': 1,
                'msg': '该用户名已被注册',
                'data': None
            }

        user_id = self.user_model.create(
            username=username,
            password=password,
            real_name=real_name,
            phone=phone,
            role=self.user_model.ROLE_USER
        )
        if user_id > 0:
            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '注册成功',
                'data': {
                    'user': self.user_model.to_public_dict(user)
                }
            }

        return {
            'code': 1,
            'msg': '注册失败',
            'data': None
        }

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
from typing import Dict, Any, Optional
from app.model.dj import UserModel, TokenModel


class DjAuthBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()

    def login(self, phone: str, password: str) -> Dict[str, Any]:
        if not phone or not phone.strip():
            return {
                'code': 1,
                'msg': '手机号不能为空',
                'data': None
            }

        if not password or not password.strip():
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        phone = phone.strip()
        if not phone.isdigit() or len(phone) != 11:
            return {
                'code': 1,
                'msg': '手机号格式不正确',
                'data': None
            }

        user = self.user_model.verify_password(phone, password)

        if user is None:
            return {
                'code': 1,
                'msg': '手机号或密码错误',
                'data': None
            }

        if user.get('status') != 1:
            return {
                'code': 1,
                'msg': '用户已被禁用',
                'data': None
            }

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24 * 7)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'user': user,
                'token': token
            }
        }

    def register(self, phone: str, password: str, nickname: str = None) -> Dict[str, Any]:
        if not phone or not phone.strip():
            return {
                'code': 1,
                'msg': '手机号不能为空',
                'data': None
            }

        if not password or not password.strip():
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        phone = phone.strip()
        if not phone.isdigit() or len(phone) != 11:
            return {
                'code': 1,
                'msg': '手机号格式不正确',
                'data': None
            }

        if len(password) < 6:
            return {
                'code': 1,
                'msg': '密码长度至少6位',
                'data': None
            }

        existing_user = self.user_model.get_by_phone(phone)
        if existing_user:
            return {
                'code': 1,
                'msg': '该手机号已被注册',
                'data': None
            }

        user_id = self.user_model.create(phone, password, nickname)

        if user_id > 0:
            token = self.token_model.create_token(user_id, hours=24 * 7)
            user = self.user_model.get_by_id(user_id)

            return {
                'code': 0,
                'msg': '注册成功',
                'data': {
                    'user': {
                        'id': user.get('id'),
                        'phone': user.get('phone'),
                        'nickname': user.get('nickname'),
                        'avatar': user.get('avatar'),
                        'status': user.get('status'),
                        'is_vendor': user.get('is_vendor')
                    },
                    'token': token
                }
            }

        return {
            'code': 1,
            'msg': '注册失败',
            'data': None
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        self.token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_user_by_token(token)

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        phone = user.get('phone', '')
        verify_result = self.user_model.verify_password(phone, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'msg': '原密码错误',
                'data': None
            }

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '密码修改成功，请重新登录',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码修改失败',
            'data': None
        }

    def reset_password(self, phone: str, new_password: str) -> Dict[str, Any]:
        if not phone or not phone.strip():
            return {
                'code': 1,
                'msg': '手机号不能为空',
                'data': None
            }

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        user = self.user_model.get_by_phone(phone)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_id = user.get('id')
        affected = self.user_model.update_password(user_id, new_password)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '密码重置成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码重置失败',
            'data': None
        }

    def get_current_user(self, token: str) -> Dict[str, Any]:
        user = self.token_model.get_user_by_token(token)
        if user:
            return {
                'code': 0,
                'msg': 'success',
                'data': user
            }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }

from typing import Dict, Any, Optional
from app.model.jaoyou_077 import UserModel, UserTokenModel
import re


class JaoyouUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = UserTokenModel()

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return False
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def register(self, phone: str, password: str, nickname: str = '', gender: int = 1) -> Dict[str, Any]:
        if not self._validate_phone(phone):
            return {
                'code': 1,
                'msg': '手机号格式不正确',
                'data': None
            }

        if not self._validate_password(password):
            return {
                'code': 1,
                'msg': '密码长度至少6位',
                'data': None
            }

        existing_user = self.user_model.get_by_phone(phone)
        if existing_user:
            return {
                'code': 1,
                'msg': '该手机号已注册',
                'data': None
            }

        user_id = self.user_model.create(phone, password, nickname, gender)
        if user_id > 0:
            token = self.token_model.create_token(user_id, hours=24 * 30)
            user = self.user_model.get_by_id(user_id)
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

    def login(self, phone: str, password: str) -> Dict[str, Any]:
        if not self._validate_phone(phone):
            return {
                'code': 1,
                'msg': '手机号格式不正确',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        user = self.user_model.verify_password(phone, password)
        if user is None:
            return {
                'code': 1,
                'msg': '手机号或密码错误',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封禁，请联系管理员',
                'data': None
            }

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24 * 30)

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

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_profile(user_id, data)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

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

        if not self._validate_password(new_password):
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        if old_password == new_password:
            return {
                'code': 1,
                'msg': '新密码不能与原密码相同',
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

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, gender: int = None, city: str = None,
                      keyword: str = None, exclude_user_id: int = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, status, gender, city, keyword, exclude_user_id)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_opposite_gender_users(self, current_user_id: int, page: int = 1, page_size: int = 10,
                                   city: str = None, keyword: str = None) -> Dict[str, Any]:
        current_user = self.user_model.get_by_id(current_user_id)
        if not current_user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        current_gender = current_user.get('gender', 1)
        opposite_gender = 2 if current_gender == 1 else 1

        return self.get_user_list(page, page_size, self.user_model.STATUS_ACTIVE, opposite_gender, city, keyword, current_user_id)

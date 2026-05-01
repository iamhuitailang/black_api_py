from typing import Dict, Any, Optional
from app.model.feipin import UserModel, FeipinTokenModel
import re


class FeipinUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = FeipinTokenModel()

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return False
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def register(self, phone: str, password: str, role: str = UserModel.ROLE_USER,
                 nickname: str = '') -> Dict[str, Any]:
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

        if role not in [UserModel.ROLE_USER, UserModel.ROLE_COLLECTOR]:
            return {
                'code': 1,
                'msg': '角色类型不正确',
                'data': None
            }

        existing_user = self.user_model.get_by_phone(phone)
        if existing_user:
            return {
                'code': 1,
                'msg': '该手机号已注册',
                'data': None
            }

        user_id = self.user_model.create(phone, password, role, nickname)
        if user_id > 0:
            token = self.token_model.create_token(user_id, hours=24)
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

        if user.get('status') == UserModel.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被禁用，请联系管理员',
                'data': None
            }

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)

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

    def apply_collector(self, user_id: int, id_card: str, id_card_photo: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('role') == UserModel.ROLE_COLLECTOR:
            if user.get('status') == UserModel.STATUS_PENDING:
                return {
                    'code': 1,
                    'msg': '您的申请正在审核中',
                    'data': None
                }
            elif user.get('status') == UserModel.STATUS_ACTIVE:
                return {
                    'code': 1,
                    'msg': '您已成为回收员',
                    'data': None
                }

        data = {
            'role': UserModel.ROLE_COLLECTOR,
            'id_card': id_card,
            'id_card_photo': id_card_photo,
            'status': UserModel.STATUS_PENDING
        }
        affected = self.user_model.update_profile(user_id, data)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '申请成功，请等待审核',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '申请失败',
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
                      role: str = None, status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, role, status, keyword)
        items = [self.user_model.to_admin_dict(item) for item in result.get('items', [])]

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

    def verify_collector(self, user_id: int, approved: bool, note: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user or user.get('role') != UserModel.ROLE_COLLECTOR:
            return {
                'code': 1,
                'msg': '用户不存在或不是回收员',
                'data': None
            }

        affected = self.user_model.verify_collector(user_id, approved, note)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '审核成功',
                'data': self.user_model.to_admin_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def ban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, UserModel.STATUS_BANNED)
        if affected > 0:
            self.token_model.delete_by_user_id(user_id)
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '禁用成功',
                'data': self.user_model.to_admin_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '禁用失败',
            'data': None
        }

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, UserModel.STATUS_ACTIVE)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '启用成功',
                'data': self.user_model.to_admin_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '启用失败',
            'data': None
        }

    def get_collectors(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.user_model.get_collectors(page, page_size)
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

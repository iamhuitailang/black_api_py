from typing import Dict, Any, Optional
from app.model.dd import UserModel, DdTokenModel
import re


class DdUserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = DdTokenModel()

    def _validate_phone(self, phone: str) -> bool:
        if not phone:
            return False
        pattern = r'^1[3-9]\d{9}$'
        return re.match(pattern, phone) is not None

    def _validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True

    def register(self, phone: str, password: str) -> Dict[str, Any]:
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
        
        user_id = self.user_model.create(phone, password)
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

    def verify_real_name(self, user_id: int, real_name: str, id_card: str) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        
        if user.get('is_verified') == 1:
            return {
                'code': 1,
                'msg': '已完成实名认证，请勿重复操作',
                'data': None
            }
        
        if not real_name or len(real_name) < 2:
            return {
                'code': 1,
                'msg': '请输入真实姓名',
                'data': None
            }
        
        if not id_card or len(id_card) not in [15, 18]:
            return {
                'code': 1,
                'msg': '身份证号格式不正确',
                'data': None
            }
        
        affected = self.user_model.verify_user(user_id, real_name, id_card)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '实名认证成功',
                'data': self.user_model.to_public_dict(updated_user)
            }
        
        return {
            'code': 1,
            'msg': '实名认证失败',
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

    def update_contact_info(self, user_id: int, contact_phone: str = None, 
                            wechat_qrcode_url: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        
        data = {}
        if contact_phone is not None:
            data['contact_phone'] = contact_phone
        if wechat_qrcode_url is not None:
            data['wechat_qrcode_url'] = wechat_qrcode_url
        
        if not data:
            return {
                'code': 1,
                'msg': '没有需要更新的内容',
                'data': None
            }
        
        affected = self.user_model.update_profile(user_id, data)
        if affected >= 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '联系方式更新成功',
                'data': {
                    'contact_phone': updated_user.get('contact_phone'),
                    'wechat_qrcode_url': updated_user.get('wechat_qrcode_url')
                }
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

    def get_user_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size)
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

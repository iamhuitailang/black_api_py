from typing import Dict, Any, List, Optional
from app.model.farm import ConsumerModel


class ConsumerBusiness:
    def __init__(self):
        self.consumer_model = ConsumerModel()

    def register(self, name: str, phone: str, password: str = '', address: str = '') -> Dict[str, Any]:
        existing = self.consumer_model.get_by_phone(phone)
        if existing:
            return {'code': 400, 'message': '该手机号已注册', 'data': None}

        consumer_id = self.consumer_model.create(name=name, phone=phone, password=password, address=address)
        consumer = self.consumer_model.get_by_id(consumer_id)
        return {'code': 0, 'message': '注册成功', 'data': consumer}

    def login(self, phone: str, password: str) -> Dict[str, Any]:
        consumer_with_pwd = self.consumer_model.get_by_phone(phone, include_password=True)
        if not consumer_with_pwd:
            return {'code': 404, 'message': '用户不存在', 'data': None}

        stored_pwd = consumer_with_pwd.get('password', '')
        if not self.consumer_model.verify_password(consumer_with_pwd['id'], password):
            if stored_pwd and stored_pwd == password:
                pass
            else:
                return {'code': 401, 'message': '密码错误', 'data': None}

        consumer_safe = self.consumer_model.get_by_id(consumer_with_pwd['id'])
        return {'code': 0, 'message': '登录成功', 'data': consumer_safe}

    def change_password(self, consumer_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        if not self.consumer_model.verify_password(consumer_id, old_password):
            return {'code': 401, 'message': '原密码错误', 'data': None}
        if not new_password or len(new_password) < 4:
            return {'code': 400, 'message': '新密码至少4位', 'data': None}
        self.consumer_model.update_password(consumer_id, new_password)
        return {'code': 0, 'message': '密码修改成功', 'data': None}

    def get_consumer(self, consumer_id: int) -> Dict[str, Any]:
        consumer = self.consumer_model.get_by_id(consumer_id)
        if not consumer:
            return {'code': 404, 'message': '用户不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': consumer}

    def update(self, consumer_id: int, **kwargs) -> Dict[str, Any]:
        self.consumer_model.update(consumer_id, **kwargs)
        consumer = self.consumer_model.get_by_id(consumer_id)
        return {'code': 0, 'message': '更新成功', 'data': consumer}

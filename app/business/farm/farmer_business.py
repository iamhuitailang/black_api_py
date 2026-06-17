from typing import Dict, Any, List, Optional
from app.model.farm import FarmerModel


class FarmerBusiness:
    def __init__(self):
        self.farmer_model = FarmerModel()

    def register(self, name: str, phone: str, address: str, categories: str = '',
                 certification: str = 'none', certification_desc: str = '',
                 password: str = '') -> Dict[str, Any]:
        existing = self.farmer_model.get_by_phone(phone)
        if existing:
            return {'code': 400, 'message': '该手机号已注册', 'data': None}

        farmer_id = self.farmer_model.create(
            name=name, phone=phone, address=address, categories=categories,
            certification=certification, certification_desc=certification_desc,
            password=password
        )
        farmer = self.farmer_model.get_by_id(farmer_id)
        return {'code': 0, 'message': '注册成功，等待管理员审核', 'data': farmer}

    def login(self, phone: str, password: str) -> Dict[str, Any]:
        farmer_with_pwd = self.farmer_model.get_by_phone(phone, include_password=True)
        if not farmer_with_pwd:
            return {'code': 404, 'message': '农户不存在', 'data': None}

        stored_pwd = farmer_with_pwd.get('password', '')
        if not self.farmer_model.verify_password(farmer_with_pwd['id'], password):
            if stored_pwd and stored_pwd == password:
                pass
            else:
                return {'code': 401, 'message': '密码错误', 'data': None}

        if farmer_with_pwd.get('status') != FarmerModel.STATUS_APPROVED:
            farmer_safe = self.farmer_model.get_by_id(farmer_with_pwd['id'])
            return {'code': 403, 'message': '店铺尚未通过审核', 'data': farmer_safe}

        farmer_safe = self.farmer_model.get_by_id(farmer_with_pwd['id'])
        return {'code': 0, 'message': '登录成功', 'data': farmer_safe}

    def change_password(self, farmer_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        if not self.farmer_model.verify_password(farmer_id, old_password):
            return {'code': 401, 'message': '原密码错误', 'data': None}
        if not new_password or len(new_password) < 4:
            return {'code': 400, 'message': '新密码至少4位', 'data': None}
        self.farmer_model.update_password(farmer_id, new_password)
        return {'code': 0, 'message': '密码修改成功', 'data': None}

    def get_farmer(self, farmer_id: int) -> Dict[str, Any]:
        farmer = self.farmer_model.get_by_id(farmer_id)
        if not farmer:
            return {'code': 404, 'message': '农户不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': farmer}

    def update_shop(self, farmer_id: int, shop_name: str = None, shop_description: str = None) -> Dict[str, Any]:
        self.farmer_model.update_shop(farmer_id, shop_name=shop_name, shop_description=shop_description)
        farmer = self.farmer_model.get_by_id(farmer_id)
        return {'code': 0, 'message': '更新成功', 'data': farmer}

    def list_all(self, status: str = None) -> Dict[str, Any]:
        farmers = self.farmer_model.get_all(status=status)
        return {'code': 0, 'message': 'success', 'data': farmers}

    def list_approved(self) -> Dict[str, Any]:
        farmers = self.farmer_model.get_approved()
        return {'code': 0, 'message': 'success', 'data': farmers}

    def approve(self, farmer_id: int) -> Dict[str, Any]:
        rows = self.farmer_model.approve(farmer_id)
        if rows == 0:
            return {'code': 404, 'message': '农户不存在', 'data': None}
        farmer = self.farmer_model.get_by_id(farmer_id)
        return {'code': 0, 'message': '审核通过', 'data': farmer}

    def reject(self, farmer_id: int) -> Dict[str, Any]:
        rows = self.farmer_model.reject(farmer_id)
        if rows == 0:
            return {'code': 404, 'message': '农户不存在', 'data': None}
        farmer = self.farmer_model.get_by_id(farmer_id)
        return {'code': 0, 'message': '已拒绝', 'data': farmer}

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
        farmer = self.farmer_model.get_by_phone(phone)
        if not farmer:
            return {'code': 404, 'message': '农户不存在', 'data': None}
        if farmer.get('password') and farmer.get('password') != password:
            return {'code': 401, 'message': '密码错误', 'data': None}
        if farmer.get('status') != FarmerModel.STATUS_APPROVED:
            return {'code': 403, 'message': '店铺尚未通过审核', 'data': farmer}
        return {'code': 0, 'message': '登录成功', 'data': farmer}

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

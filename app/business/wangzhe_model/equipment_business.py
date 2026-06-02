from typing import Dict, Any, Optional
from app.model.wangzhe_model import EquipmentModel, UserModel


class WangzheEquipmentBusiness:
    def __init__(self):
        self.equipment_model = EquipmentModel()
        self.user_model = UserModel()

    def get_equipment_list(self, page: int = 1, page_size: int = 50, type: str = None,
                           keyword: str = None) -> Dict[str, Any]:
        result = self.equipment_model.get_all(page, page_size, type, keyword, status=0)
        items = [self.equipment_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_equipment_detail(self, equipment_id: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment or equipment.get('status') != 0:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.equipment_model.to_public_dict(equipment)
        }

    def purchase_equipment(self, user_id: int, equipment_id: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment or equipment.get('status') != 0:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        price = equipment.get('price', 0)
        if user.get('gold', 0) < price:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        affected = self.user_model.update_gold(user_id, -price)
        if affected > 0:
            return {
                'code': 0,
                'msg': '购买成功',
                'data': {
                    'remaining_gold': user.get('gold', 0) - price
                }
            }

        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def create_equipment(self, **kwargs) -> Dict[str, Any]:
        name = kwargs.get('name')
        if not name:
            return {
                'code': 1,
                'msg': '装备名称不能为空',
                'data': None
            }

        existing = self.equipment_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该装备名称已存在',
                'data': None
            }

        equipment_id = self.equipment_model.create(**kwargs)
        if equipment_id > 0:
            equipment = self.equipment_model.get_by_id(equipment_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.equipment_model.to_public_dict(equipment)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_equipment(self, equipment_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        name = data.get('name')
        if name and name != equipment.get('name'):
            existing = self.equipment_model.get_by_name(name)
            if existing:
                return {
                    'code': 1,
                    'msg': '该装备名称已存在',
                    'data': None
                }

        affected = self.equipment_model.update(equipment_id, data)
        if affected > 0:
            updated_equipment = self.equipment_model.get_by_id(equipment_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.equipment_model.to_public_dict(updated_equipment)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_equipment(self, equipment_id: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_id(equipment_id)
        if not equipment:
            return {
                'code': 1,
                'msg': '装备不存在',
                'data': None
            }

        affected = self.equipment_model.delete(equipment_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_admin_equipment_list(self, page: int = 1, page_size: int = 50, type: str = None,
                                 keyword: str = None, status: int = None) -> Dict[str, Any]:
        result = self.equipment_model.get_all(page, page_size, type, keyword, status)
        items = [self.equipment_model.to_public_dict(item) for item in result.get('items', [])]

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

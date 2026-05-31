from typing import Dict, Any
from app.model.lianliankan077 import LlkPropModel, LlkUserPropModel


class LlkPropBusiness:
    def __init__(self):
        self.prop_model = LlkPropModel()
        self.user_prop_model = LlkUserPropModel()

    def get_active_props(self) -> Dict[str, Any]:
        props = self.prop_model.get_active_props()
        items = [self.prop_model.to_dict(p) for p in props]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_prop_by_id(self, prop_id: int) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.prop_model.to_dict(prop)
        }

    def get_prop_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.prop_model.get_all(page, page_size, status)
        items = [self.prop_model.to_dict(p) for p in result.get('items', [])]

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

    def create_prop(self, name: str, icon: str, effect_type: str, description: str = '',
                    effect_value: int = 0, price: int = 0, sort_order: int = 0) -> Dict[str, Any]:
        existing = self.prop_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '道具名称已存在',
                'data': None
            }

        prop_id = self.prop_model.create(name, icon, effect_type, description, effect_value, price, sort_order)
        if prop_id > 0:
            prop = self.prop_model.get_by_id(prop_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.prop_model.to_dict(prop)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_prop(self, prop_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        if 'name' in data:
            existing = self.prop_model.get_by_name(data['name'])
            if existing and existing.get('id') != prop_id:
                return {
                    'code': 1,
                    'msg': '道具名称已存在',
                    'data': None
                }

        affected = self.prop_model.update(prop_id, data)
        if affected >= 0:
            updated_prop = self.prop_model.get_by_id(prop_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.prop_model.to_dict(updated_prop)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_prop_status(self, prop_id: int, status: int) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        affected = self.prop_model.update_status(prop_id, status)
        if affected > 0:
            updated_prop = self.prop_model.get_by_id(prop_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.prop_model.to_dict(updated_prop)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_prop(self, prop_id: int) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        affected = self.prop_model.delete(prop_id)
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

    def get_user_props(self, user_id: int) -> Dict[str, Any]:
        props = self.user_prop_model.get_user_prop_detail(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': props
        }

    def buy_prop(self, user_id: int, prop_id: int, quantity: int = 1) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        if prop.get('status') != LlkPropModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '道具已下架',
                'data': None
            }

        self.user_prop_model.add_prop(user_id, prop_id, quantity)

        updated_props = self.user_prop_model.get_user_prop_detail(user_id)
        return {
            'code': 0,
            'msg': '购买成功',
            'data': updated_props
        }

    def use_prop(self, user_id: int, prop_id: int) -> Dict[str, Any]:
        prop = self.prop_model.get_by_id(prop_id)
        if not prop:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        result = self.user_prop_model.use_prop(user_id, prop_id)
        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('msg', '使用失败'),
                'data': None
            }

        return {
            'code': 0,
            'msg': '使用成功',
            'data': {
                'effect_type': prop.get('effect_type'),
                'effect_value': prop.get('effect_value'),
                'remaining': result.get('remaining', 0)
            }
        }

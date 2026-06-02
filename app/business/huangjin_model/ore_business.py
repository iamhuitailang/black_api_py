from typing import Dict, Any
from app.model.huangjin_model import OreModel


class OreBusiness:
    def __init__(self):
        self.ore_model = OreModel()

    def get_ore_list(self, page: int = 1, page_size: int = 10,
                     status: int = None, rarity: int = None) -> Dict[str, Any]:
        result = self.ore_model.get_all(page, page_size, status, rarity)
        items = [self.ore_model.to_dict(item) for item in result.get('items', [])]
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

    def get_enabled_ores(self) -> Dict[str, Any]:
        ores = self.ore_model.get_enabled()
        items = [self.ore_model.to_dict(ore) for ore in ores]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_ore_detail(self, ore_id: int) -> Dict[str, Any]:
        ore = self.ore_model.get_by_id(ore_id)
        if not ore:
            return {
                'code': 1,
                'msg': '矿石不存在',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': self.ore_model.to_dict(ore)
        }

    def create_ore(self, name: str, value: int, weight: float, color: str = '#FFD700',
                   icon: str = '', rarity: int = 0, description: str = '',
                   sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '矿石名称不能为空',
                'data': None
            }
        if value < 0:
            return {
                'code': 1,
                'msg': '矿石价值不能为负',
                'data': None
            }
        if weight <= 0:
            return {
                'code': 1,
                'msg': '矿石重量必须大于0',
                'data': None
            }

        ore_id = self.ore_model.create(name, value, weight, color, icon, rarity, description, sort_order)
        if ore_id > 0:
            ore = self.ore_model.get_by_id(ore_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.ore_model.to_dict(ore)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_ore(self, ore_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ore = self.ore_model.get_by_id(ore_id)
        if not ore:
            return {
                'code': 1,
                'msg': '矿石不存在',
                'data': None
            }

        affected = self.ore_model.update(ore_id, data)
        if affected >= 0:
            updated_ore = self.ore_model.get_by_id(ore_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ore_model.to_dict(updated_ore)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_ore(self, ore_id: int) -> Dict[str, Any]:
        ore = self.ore_model.get_by_id(ore_id)
        if not ore:
            return {
                'code': 1,
                'msg': '矿石不存在',
                'data': None
            }

        affected = self.ore_model.delete(ore_id)
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

    def toggle_ore_status(self, ore_id: int) -> Dict[str, Any]:
        ore = self.ore_model.get_by_id(ore_id)
        if not ore:
            return {
                'code': 1,
                'msg': '矿石不存在',
                'data': None
            }

        new_status = self.ore_model.STATUS_DISABLED if ore.get('status') == self.ore_model.STATUS_ENABLED else self.ore_model.STATUS_ENABLED
        affected = self.ore_model.update_status(ore_id, new_status)
        if affected > 0:
            updated_ore = self.ore_model.get_by_id(ore_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.ore_model.to_dict(updated_ore)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

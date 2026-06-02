from typing import Dict, Any
from app.model.danzhu_model import ItemModel


class DanzhuItemBusiness:
    def __init__(self):
        self.item_model = ItemModel()

    def get_item_list(self, page: int = 1, page_size: int = 10,
                     type: str = None, status: int = None,
                     keyword: str = None) -> Dict[str, Any]:
        result = self.item_model.get_all(page, page_size, type, status, keyword)
        items = [self.item_model.to_dict(item) for item in result.get('items', [])]

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

    def get_active_items(self) -> Dict[str, Any]:
        items = self.item_model.get_all_active()
        result = [self.item_model.to_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_items_by_type(self, type: str) -> Dict[str, Any]:
        items = self.item_model.get_by_type(type)
        result = [self.item_model.to_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_item_detail(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.item_model.to_dict(item)
        }

    def create_item(self, name: str, type: str, description: str = '', icon: str = '',
                    color: str = '#ff6b6b', radius: float = 25, score_value: int = 100,
                    combo_bonus: int = 0, special_effect: str = '', status: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '道具名称不能为空',
                'data': None
            }

        if not type:
            return {
                'code': 1,
                'msg': '道具类型不能为空',
                'data': None
            }

        item_id = self.item_model.create(
            name=name,
            type=type,
            description=description,
            icon=icon,
            color=color,
            radius=radius,
            score_value=score_value,
            combo_bonus=combo_bonus,
            special_effect=special_effect,
            status=status
        )

        if item_id > 0:
            item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.item_model.to_dict(item)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_item(self, item_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        affected = self.item_model.update(item_id, data)
        if affected >= 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.item_model.to_dict(updated_item)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_item(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '道具不存在',
                'data': None
            }

        affected = self.item_model.delete(item_id)
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

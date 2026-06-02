from typing import Dict, Any, List, Optional
from app.model.saiche_model import ItemModel


class SaicheItemBusiness:
    def __init__(self):
        self.item_model = ItemModel()

    def get_item_list(self, page: int = 1, page_size: int = 10, item_type: str = None) -> Dict[str, Any]:
        result = self.item_model.get_all(page, page_size, item_type)
        items = [self.item_model.to_public_dict(item) for item in result.get('items', [])]

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
            'data': self.item_model.to_public_dict(item)
        }

    def get_items_by_type(self, item_type: str) -> Dict[str, Any]:
        items = self.item_model.get_by_type(item_type)
        result = [self.item_model.to_public_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_random_item(self) -> Dict[str, Any]:
        item = self.item_model.get_random_item()
        if not item:
            return {
                'code': 1,
                'msg': '获取道具失败',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.item_model.to_public_dict(item)
        }

    def add_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'type']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必填字段: {field}',
                    'data': None
                }

        item_id = self.item_model.create(data)
        if item_id > 0:
            item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.item_model.to_public_dict(item)
            }

        return {
            'code': 1,
            'msg': '添加失败',
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
        if affected > 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.item_model.to_public_dict(updated_item)
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

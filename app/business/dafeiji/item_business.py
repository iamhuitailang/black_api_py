from typing import Dict, Any
from app.model.dafeiji_model import DafeijiItemModel


class DafeijiItemBusiness:
    def __init__(self):
        self.item_model = DafeijiItemModel()

    def get_list(self, page: int = 1, page_size: int = 10, type_filter: str = None) -> Dict[str, Any]:
        result = self.item_model.get_all(page, page_size, type_filter)
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

    def get_all(self, type_filter: str = None) -> Dict[str, Any]:
        items = self.item_model.get_all_list(type_filter)
        return {'code': 0, 'msg': 'success', 'data': [self.item_model.to_dict(item) for item in items]}

    def get_by_id(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {'code': 1, 'msg': '道具不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.item_model.to_dict(item)}

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {'code': 1, 'msg': '道具名称不能为空', 'data': None}
        if not data.get('type'):
            return {'code': 1, 'msg': '道具类型不能为空', 'data': None}
        item_id = self.item_model.create(data)
        if item_id > 0:
            item = self.item_model.get_by_id(item_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.item_model.to_dict(item)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update(self, item_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {'code': 1, 'msg': '道具不存在', 'data': None}
        affected = self.item_model.update(item_id, data)
        if affected >= 0:
            updated = self.item_model.get_by_id(item_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.item_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {'code': 1, 'msg': '道具不存在', 'data': None}
        affected = self.item_model.delete(item_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

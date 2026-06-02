from typing import Dict, Any
from app.model.dafuweng import ItemModel


class ItemBusiness:
    def __init__(self):
        self.item_model = ItemModel()

    def get_all_items(self) -> Dict[str, Any]:
        items = self.item_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.item_model.to_dict(item) for item in items]
        }

    def get_item_by_id(self, item_id: int) -> Dict[str, Any]:
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

    def get_items_by_type(self, item_type: int) -> Dict[str, Any]:
        items = self.item_model.get_by_type(item_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.item_model.to_dict(item) for item in items]
        }

    def create_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get('name')
        item_type = data.get('item_type')

        if not name or item_type is None:
            return {
                'code': 1,
                'msg': '缺少必要参数',
                'data': None
            }

        item_id = self.item_model.create(
            name=name,
            description=data.get('description', ''),
            item_type=item_type,
            price=data.get('price', 0),
            effect_value=data.get('effect_value', 0),
            icon=data.get('icon', '')
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

    def reset_items(self) -> Dict[str, Any]:
        items = self.item_model.get_all()
        for item in items:
            self.item_model.delete(item.get('id'))

        ItemModel.init_default_items()

        new_items = self.item_model.get_all()
        return {
            'code': 0,
            'msg': '道具重置成功',
            'data': [self.item_model.to_dict(item) for item in new_items]
        }

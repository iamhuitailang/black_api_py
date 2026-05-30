from typing import Dict, Any, Optional
from app.model.jieyong_model import ItemModel, CategoryModel


class JieyongItemBusiness:
    def __init__(self):
        self.item_model = ItemModel()
        self.category_model = CategoryModel()

    def create(self, category_id: int, name: str, description: str = '', rules: str = '',
               total_quantity: int = 0, image: str = '', location: str = '',
               max_borrow_days: int = 7) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '物品名称不能为空',
                'data': None
            }

        if total_quantity < 0:
            return {
                'code': 1,
                'msg': '库存数量不能为负数',
                'data': None
            }

        if category_id:
            category = self.category_model.get_by_id(category_id)
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }

        item_id = self.item_model.create(
            category_id=category_id,
            name=name,
            description=description,
            rules=rules,
            total_quantity=total_quantity,
            image=image,
            location=location,
            max_borrow_days=max_borrow_days
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

    def update(self, item_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }

        if 'category_id' in data and data['category_id']:
            category = self.category_model.get_by_id(data['category_id'])
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }

        if 'total_quantity' in data and data['total_quantity'] < 0:
            return {
                'code': 1,
                'msg': '库存数量不能为负数',
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

    def delete(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }

        from app.model.jieyong_model import BorrowModel
        borrow_model = BorrowModel()
        borrowed_count = borrow_model.get_item_borrowed_count(item_id)
        if borrowed_count > 0:
            return {
                'code': 1,
                'msg': '该物品还有未归还的借用记录，无法删除',
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

    def get_by_id(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.item_model.to_dict(item)
        }

    def get_list(self, page: int = 1, page_size: int = 10, category_id: int = None,
                 status: int = None, keyword: str = None, only_available: bool = False) -> Dict[str, Any]:
        result = self.item_model.get_all(page, page_size, category_id, status, keyword, only_available)
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

    def get_hot_items(self, limit: int = 10) -> Dict[str, Any]:
        items = self.item_model.get_hot_items(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def check_availability(self, item_id: int, quantity: int) -> Dict[str, Any]:
        available = self.item_model.check_availability(item_id, quantity)
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'available': available,
                'available_quantity': item.get('available_quantity'),
                'max_borrow_days': item.get('max_borrow_days')
            }
        }

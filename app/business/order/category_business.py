from typing import Dict, Any, List, Optional
from app.model.order.category import CategoryModel


class OrderCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def create(self, name: str, icon: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        category_id = self.category_model.create(name, icon, sort_order)
        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': category
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        affected = self.category_model.update(category_id, data)
        if affected >= 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        affected = self.category_model.delete(category_id)
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

    def get_by_id(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': category
        }

    def get_list(self) -> Dict[str, Any]:
        items = self.category_model.get_list()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.category_model.get_all(page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
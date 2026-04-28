from typing import Dict, Any, List, Optional
from app.model.dj import CategoryModel


class DjCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def create_category(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        category_id = self.category_model.create(data)
        if category_id > 0:
            return {
                'code': 0,
                'msg': '创建成功',
                'data': {'id': category_id}
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_category_list(self) -> Dict[str, Any]:
        categories = self.category_model.get_tree()

        result = []
        for cat in categories:
            result.append({
                'id': cat.get('id'),
                'name': cat.get('name'),
                'parent_id': cat.get('parent_id'),
                'icon': cat.get('icon'),
                'sort': cat.get('sort'),
                'children': cat.get('children', [])
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_parent_categories(self) -> Dict[str, Any]:
        categories = self.category_model.get_parent_categories()

        result = []
        for cat in categories:
            result.append({
                'id': cat.get('id'),
                'name': cat.get('name'),
                'icon': cat.get('icon'),
                'sort': cat.get('sort')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_category_detail(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        children = self.category_model.get_children(category_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': category.get('id'),
                'name': category.get('name'),
                'parent_id': category.get('parent_id'),
                'icon': category.get('icon'),
                'sort': category.get('sort'),
                'children': children
            }
        }

    def update_category(self, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        affected = self.category_model.update(category_id, data)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_category(self, category_id: int) -> Dict[str, Any]:
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

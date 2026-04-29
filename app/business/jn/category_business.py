from typing import Dict, Any, List, Optional
from app.model.jn import CategoryModel


class JnCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def get_category_tree(self) -> Dict[str, Any]:
        result = self.category_model.get_tree(only_active=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_all_categories(self) -> Dict[str, Any]:
        result = self.category_model.get_all(only_active=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.category_model.to_dict(item) for item in result]
        }

    def get_parent_categories(self) -> Dict[str, Any]:
        result = self.category_model.get_parents(only_active=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.category_model.to_dict(item) for item in result]
        }

    def get_children_categories(self, parent_code: str) -> Dict[str, Any]:
        result = self.category_model.get_children(parent_code, only_active=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.category_model.to_dict(item) for item in result]
        }

    def get_category_by_code(self, code: str) -> Dict[str, Any]:
        category = self.category_model.get_by_code(code)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.category_model.to_dict(category)
        }

    def create_category(self, code: str, name: str, parent_code: str = '',
                        description: str = '') -> Dict[str, Any]:
        if not code or not name:
            return {
                'code': 1,
                'msg': '分类编码和名称不能为空',
                'data': None
            }

        existing = self.category_model.get_by_code(code)
        if existing:
            return {
                'code': 1,
                'msg': '分类编码已存在',
                'data': None
            }

        if parent_code:
            parent = self.category_model.get_by_code(parent_code)
            if not parent:
                return {
                    'code': 1,
                    'msg': '父分类不存在',
                    'data': None
                }

        category_id = self.category_model.create(code, name, parent_code, description)
        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.category_model.to_dict(category)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
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
        if affected >= 0:
            updated_category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.category_model.to_dict(updated_category)
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

        children = self.category_model.get_children(category.get('code', ''), only_active=False)
        if children:
            return {
                'code': 1,
                'msg': '该分类下还有子分类，无法删除',
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

    def get_admin_category_tree(self) -> Dict[str, Any]:
        result = self.category_model.get_tree(only_active=False)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import CategoryModel


class BqCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def create(self, name: str, icon: str = '', description: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        existing = self.category_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '分类名称已存在',
                'data': None
            }

        category_id = self.category_model.create(name, icon, description, sort_order)
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

    def update(self, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        if 'name' in data and data['name']:
            existing = self.category_model.get_by_name(data['name'])
            if existing and existing.get('id') != category_id:
                return {
                    'code': 1,
                    'msg': '分类名称已存在',
                    'data': None
                }

        affected = self.category_model.update(category_id, data)
        if affected >= 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.category_model.to_dict(updated)
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

        if category.get('emoji_count', 0) > 0:
            return {
                'code': 1,
                'msg': '该分类下还有表情包，不能删除',
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
            'data': self.category_model.to_dict(category)
        }

    def get_all(self, include_disabled: bool = False) -> Dict[str, Any]:
        status = None if include_disabled else CategoryModel.STATUS_ACTIVE
        result = self.category_model.get_all_list(status)
        items = [self.category_model.to_dict(item) for item in result]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_list(self, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        result = self.category_model.get_all(page, page_size, status)
        items = [self.category_model.to_dict(item) for item in result.get('items', [])]

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

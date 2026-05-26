from typing import Dict, Any, List, Optional
from app.model.jianli import TemplateCategoryModel, TemplateModel


class TemplateCategoryBusiness:
    def __init__(self):
        self.category_model = TemplateCategoryModel()
        self.template_model = TemplateModel()

    def create(self, name: str, code: str, description: str = '',
               sort_order: int = 0) -> Dict[str, Any]:
        if not name or not code:
            return {
                'code': 1,
                'msg': '分类名称和编码不能为空',
                'data': None
            }

        existing = self.category_model.get_by_code(code)
        if existing:
            return {
                'code': 1,
                'msg': '分类编码已存在',
                'data': None
            }

        category_id = self.category_model.create(name, code, description, sort_order)
        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.category_model.to_public_dict(category)
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

        if 'code' in data:
            existing = self.category_model.get_by_code(data['code'])
            if existing and existing['id'] != category_id:
                return {
                    'code': 1,
                    'msg': '分类编码已存在',
                    'data': None
                }

        affected = self.category_model.update(category_id, data)
        if affected >= 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.category_model.to_public_dict(updated)
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

        templates = self.template_model.get_published_list(category_id=category_id)
        if templates:
            return {
                'code': 1,
                'msg': '该分类下还有模板，无法删除',
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
            'data': self.category_model.to_public_dict(category)
        }

    def get_list(self, page: int = 1, page_size: int = 10,
                 status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.category_model.get_all(page, page_size, status, keyword)
        items = [self.category_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_all_active(self) -> Dict[str, Any]:
        items = self.category_model.get_all_active()
        items = [self.category_model.to_public_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_status(self, category_id: int, status: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        affected = self.category_model.update_status(category_id, status)
        if affected > 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.category_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

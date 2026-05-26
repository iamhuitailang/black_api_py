from typing import Dict, Any, List, Optional
from app.model.jianli import TemplateModel, TemplateCategoryModel


class TemplateBusiness:
    def __init__(self):
        self.template_model = TemplateModel()
        self.category_model = TemplateCategoryModel()

    def create(self, name: str, category_id: int, category_code: str = '',
               description: str = '', thumbnail: str = '', preview_url: str = '',
               style_config: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '模板名称不能为空',
                'data': None
            }

        if category_id <= 0:
            return {
                'code': 1,
                'msg': '请选择模板分类',
                'data': None
            }

        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        template_id = self.template_model.create(
            name, category_id, category_code or category.get('code', ''),
            description, thumbnail, preview_url, style_config, sort_order
        )
        if template_id > 0:
            template = self.template_model.get_by_id(template_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.template_model.to_public_dict(template)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, template_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {
                'code': 1,
                'msg': '模板不存在',
                'data': None
            }

        if 'category_id' in data and data['category_id'] > 0:
            category = self.category_model.get_by_id(data['category_id'])
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }
            data['category_code'] = category.get('code', '')

        affected = self.template_model.update(template_id, data)
        if affected >= 0:
            updated = self.template_model.get_by_id(template_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.template_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def publish(self, template_id: int) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {
                'code': 1,
                'msg': '模板不存在',
                'data': None
            }

        affected = self.template_model.publish(template_id)
        if affected > 0:
            updated = self.template_model.get_by_id(template_id)
            return {
                'code': 0,
                'msg': '上架成功',
                'data': self.template_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '上架失败',
            'data': None
        }

    def unpublish(self, template_id: int) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {
                'code': 1,
                'msg': '模板不存在',
                'data': None
            }

        affected = self.template_model.unpublish(template_id)
        if affected > 0:
            updated = self.template_model.get_by_id(template_id)
            return {
                'code': 0,
                'msg': '下架成功',
                'data': self.template_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '下架失败',
            'data': None
        }

    def delete(self, template_id: int) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {
                'code': 1,
                'msg': '模板不存在',
                'data': None
            }

        affected = self.template_model.delete(template_id)
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

    def get_by_id(self, template_id: int) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {
                'code': 1,
                'msg': '模板不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.template_model.to_public_dict(template)
        }

    def get_list(self, page: int = 1, page_size: int = 10, status: int = None,
                 category_id: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.template_model.get_all(page, page_size, status, category_id, keyword)
        items = [self.template_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_published(self, page: int = 1, page_size: int = 100,
                      category_id: int = None, category_code: str = None) -> Dict[str, Any]:
        result = self.template_model.get_published(page, page_size, category_id, category_code)
        items = [self.template_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_published_list(self, category_id: int = None,
                           category_code: str = None) -> Dict[str, Any]:
        items = self.template_model.get_published_list(category_id, category_code)
        items = [self.template_model.to_public_dict(item) for item in items]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def increment_use_count(self, template_id: int) -> Dict[str, Any]:
        self.template_model.increment_use_count(template_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

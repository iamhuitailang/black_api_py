from typing import Dict, Any, Optional
from app.model.xq import CategoryModel
from app.model.xq.post import PostModel


class XqCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def get_list(self, only_active: bool = True) -> Dict[str, Any]:
        categories = self.category_model.get_all(only_active=only_active)
        items = [self.category_model.to_dict(cat) for cat in categories]

        if not items:
            from app.model.xq.category import CategoryModel as CatModel
            CatModel.init_default_categories()
            categories = self.category_model.get_all(only_active=only_active)
            items = [self.category_model.to_dict(cat) for cat in categories]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_default_categories(self) -> Dict[str, Any]:
        categories = []
        for cat in PostModel.CATEGORIES:
            categories.append({
                'code': cat['code'],
                'name': cat['name'],
                'description': cat['desc']
            })
        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }

    def create(self, code: str, name: str, description: str = '',
               sort_order: int = 0) -> Dict[str, Any]:
        if not code or len(code) < 2:
            return {
                'code': 1,
                'msg': '分类代码至少2个字符',
                'data': None
            }

        if not name or len(name) < 2:
            return {
                'code': 1,
                'msg': '分类名称至少2个字符',
                'data': None
            }

        existing = self.category_model.get_by_code(code)
        if existing:
            return {
                'code': 1,
                'msg': '分类代码已存在',
                'data': None
            }

        category_id = self.category_model.create(
            code=code,
            name=name,
            description=description,
            sort_order=sort_order
        )

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

        if 'code' in data:
            existing = self.category_model.get_by_code(data['code'])
            if existing and existing.get('id') != category_id:
                return {
                    'code': 1,
                    'msg': '分类代码已存在',
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
            'data': self.category_model.to_dict(category)
        }

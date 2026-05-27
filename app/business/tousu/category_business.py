from typing import Dict, Any, List
from app.model.tousu_model import CategoryModel, LogModel


class TousuCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()
        self.log_model = LogModel()

    def create_category(self, name: str, code: str, description: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name or not code:
            return {
                'code': 1,
                'msg': '名称和编码不能为空',
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
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_CREATE,
                target_type='category',
                target_id=category_id,
                description=f'创建分类: {name}'
            )
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.category_model.to_dict(self.category_model.get_by_id(category_id))
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
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_UPDATE,
                target_type='category',
                target_id=category_id,
                description='更新分类'
            )
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.category_model.to_dict(self.category_model.get_by_id(category_id))
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
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_DELETE,
                target_type='category',
                target_id=category_id,
                description=f'删除分类: {category.get("name", "")}'
            )
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

    def get_category(self, category_id: int) -> Dict[str, Any]:
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

    def get_all_categories(self, status: int = None, keyword: str = None) -> Dict[str, Any]:
        items = self.category_model.get_all(status, keyword)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': [self.category_model.to_dict(item) for item in items]
            }
        }
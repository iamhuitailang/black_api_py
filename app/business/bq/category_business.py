from typing import Dict, Any, List, Optional
from app.model.bq import BqCategoryModel


class BqCategoryBusiness:
    def __init__(self):
        self.category_model = BqCategoryModel()

    def create(self, user_id: int, name: str, color: str = '#FFF9C4') -> Dict[str, Any]:
        if not name or len(name.strip()) == 0:
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        existing = self.category_model.get_by_name_and_user(name.strip(), user_id)
        if existing:
            return {
                'code': 1,
                'msg': '分类名称已存在',
                'data': None
            }

        category_id = self.category_model.create(
            user_id=user_id,
            name=name.strip(),
            color=color or '#FFF9C4'
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

    def get_by_id(self, user_id: int, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id_and_user(category_id, user_id)
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

    def update(self, user_id: int, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id_and_user(category_id, user_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        if 'name' in data and data['name']:
            existing = self.category_model.get_by_name_and_user(data['name'].strip(), user_id)
            if existing and existing.get('id') != category_id:
                return {
                    'code': 1,
                    'msg': '分类名称已存在',
                    'data': None
                }
            data['name'] = data['name'].strip()

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

    def delete(self, user_id: int, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id_and_user(category_id, user_id)
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

    def get_list(self, user_id: int) -> Dict[str, Any]:
        categories = self.category_model.get_all_with_default(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }

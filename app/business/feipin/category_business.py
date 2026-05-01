from typing import Dict, Any, List, Optional
from app.model.feipin import CategoryModel


class FeipinCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def get_tree(self) -> Dict[str, Any]:
        tree = self.category_model.get_tree()
        return {
            'code': 0,
            'msg': 'success',
            'data': tree
        }

    def get_category_list(self, only_active: bool = True) -> Dict[str, Any]:
        categories = self.category_model.get_all(only_active)
        items = [self.category_model.to_dict(cat) for cat in categories]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_parent_categories(self, only_active: bool = True) -> Dict[str, Any]:
        categories = self.category_model.get_by_parent_id(0, only_active)
        items = [self.category_model.to_dict(cat) for cat in categories]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_sub_categories(self, parent_id: int, only_active: bool = True) -> Dict[str, Any]:
        categories = self.category_model.get_by_parent_id(parent_id, only_active)
        items = [self.category_model.to_dict(cat) for cat in categories]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_category_by_id(self, category_id: int) -> Dict[str, Any]:
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

    def create_category(self, name: str, parent_id: int = 0, price: float = 0.0,
                        description: str = '', icon: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        if parent_id > 0:
            parent = self.category_model.get_by_id(parent_id)
            if not parent:
                return {
                    'code': 1,
                    'msg': '父级分类不存在',
                    'data': None
                }

        category_id = self.category_model.create(name, parent_id, price, description, icon, sort_order)
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

        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'price' in data:
            update_data['price'] = data['price']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'icon' in data:
            update_data['icon'] = data['icon']
        if 'sort_order' in data:
            update_data['sort_order'] = data['sort_order']
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']

        if not update_data:
            return {
                'code': 1,
                'msg': '没有要更新的数据',
                'data': None
            }

        affected = self.category_model.update(category_id, update_data)
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

    def calculate_price(self, category_id: int, weight: float) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        price_per_kg = category.get('price', 0.0)
        total_price = price_per_kg * weight

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'category_id': category_id,
                'category_name': category.get('name'),
                'price_per_kg': price_per_kg,
                'weight': weight,
                'total_price': round(total_price, 2)
            }
        }

from typing import Dict, Any, List, Optional
from app.model.order.dish import DishModel


class OrderDishBusiness:
    def __init__(self):
        self.dish_model = DishModel()

    def create(self, category_id: int, name: str, price: float, cost: float = 0,
               stock: int = 999, image_url: str = '', description: str = '',
               sort_order: int = 0) -> Dict[str, Any]:
        if not category_id:
            return {
                'code': 1,
                'msg': '请选择分类',
                'data': None
            }

        if not name:
            return {
                'code': 1,
                'msg': '菜品名称不能为空',
                'data': None
            }

        if price is None or price < 0:
            return {
                'code': 1,
                'msg': '价格不能为负数',
                'data': None
            }

        dish_id = self.dish_model.create(
            category_id=category_id,
            name=name,
            price=price,
            cost=cost,
            stock=stock,
            image_url=image_url,
            description=description,
            sort_order=sort_order
        )
        if dish_id > 0:
            dish = self.dish_model.get_by_id(dish_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': dish
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, dish_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        dish = self.dish_model.get_by_id(dish_id)
        if not dish:
            return {
                'code': 1,
                'msg': '菜品不存在',
                'data': None
            }

        affected = self.dish_model.update(dish_id, data)
        if affected >= 0:
            updated = self.dish_model.get_by_id(dish_id)
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

    def delete(self, dish_id: int) -> Dict[str, Any]:
        dish = self.dish_model.get_by_id(dish_id)
        if not dish:
            return {
                'code': 1,
                'msg': '菜品不存在',
                'data': None
            }

        affected = self.dish_model.delete(dish_id)
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

    def get_by_id(self, dish_id: int) -> Dict[str, Any]:
        dish = self.dish_model.get_by_id(dish_id)
        if not dish:
            return {
                'code': 1,
                'msg': '菜品不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': dish
        }

    def get_list(self, category_id: int = None) -> Dict[str, Any]:
        items = self.dish_model.get_list(category_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                category_id: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.dish_model.get_all(page, page_size, status, category_id, keyword)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
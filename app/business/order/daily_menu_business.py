from typing import Dict, Any, List, Optional
from app.model.order.daily_menu import DailyMenuModel
from app.model.order.meal_config import MealConfigModel


class OrderDailyMenuBusiness:
    def __init__(self):
        self.daily_menu_model = DailyMenuModel()
        self.meal_config_model = MealConfigModel()

    def create(self, menu_date: str, meal_type: str, dish_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not menu_date:
            return {
                'code': 1,
                'msg': '请选择日期',
                'data': None
            }

        if not meal_type:
            return {
                'code': 1,
                'msg': '请选择餐段',
                'data': None
            }

        if not dish_list or len(dish_list) == 0:
            return {
                'code': 1,
                'msg': '请选择菜品',
                'data': None
            }

        self.daily_menu_model.delete_by_date_and_type(menu_date, meal_type)

        count = self.daily_menu_model.batch_create(menu_date, meal_type, dish_list)
        if count > 0:
            return {
                'code': 0,
                'msg': f'成功发布{count}道菜品',
                'data': {
                    'count': count
                }
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def update(self, menu_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        menu = self.daily_menu_model.get_by_id(menu_id)
        if not menu:
            return {
                'code': 1,
                'msg': '菜单不存在',
                'data': None
            }

        affected = self.daily_menu_model.update(menu_id, data)
        if affected >= 0:
            updated = self.daily_menu_model.get_by_id(menu_id)
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

    def delete(self, menu_id: int) -> Dict[str, Any]:
        menu = self.daily_menu_model.get_by_id(menu_id)
        if not menu:
            return {
                'code': 1,
                'msg': '菜单不存在',
                'data': None
            }

        affected = self.daily_menu_model.delete(menu_id)
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

    def get_by_date_and_type(self, menu_date: str, meal_type: str) -> Dict[str, Any]:
        items = self.daily_menu_model.get_menu_details(menu_date, meal_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_all(self, page: int = 1, page_size: int = 10, menu_date: str = None,
                meal_type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.daily_menu_model.get_all(page, page_size, menu_date, meal_type, status)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_meal_types(self) -> Dict[str, Any]:
        items = self.meal_config_model.get_active_list()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }
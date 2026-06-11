from typing import Dict, Any, List, Optional
from app.model.restaurant import DishModel


class DishBusiness:
    def __init__(self):
        self.model = DishModel()

    def get_dish(self, dish_id: int) -> Dict[str, Any]:
        dish = self.model.get_by_id(dish_id)
        if dish:
            return {
                'code': 0,
                'message': 'success',
                'data': dish
            }
        return {
            'code': 1,
            'message': 'Dish not found',
            'data': None
        }

    def get_all_dishes(self, category: str = None, is_active: int = None) -> Dict[str, Any]:
        dishes = self.model.get_all(category, is_active)
        return {
            'code': 0,
            'message': 'success',
            'data': dishes
        }

    def get_dishes_by_category(self, category: str) -> Dict[str, Any]:
        dishes = self.model.get_by_category(category)
        return {
            'code': 0,
            'message': 'success',
            'data': dishes
        }

    def create_dish(self, name: str, category: str, price: float, description: str = None,
                    spicy_level: int = 0, image_url: str = None, is_active: int = 1) -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': 'Dish name cannot be empty',
                'data': None
            }
        if not category or not category.strip():
            return {
                'code': 1,
                'message': 'Category cannot be empty',
                'data': None
            }
        if price is None or price < 0:
            return {
                'code': 1,
                'message': 'Invalid price',
                'data': None
            }
        if spicy_level is None or spicy_level < 0 or spicy_level > 3:
            return {
                'code': 1,
                'message': 'Spicy level must be between 0 and 3',
                'data': None
            }

        name = name.strip()
        category = category.strip()
        description = description.strip() if description else None
        image_url = image_url.strip() if image_url else None

        dish_id = self.model.create(name, category, price, description, spicy_level, image_url, is_active)
        dish = self.model.get_by_id(dish_id)

        return {
            'code': 0,
            'message': 'Dish created successfully',
            'data': dish
        }

    def update_dish(self, dish_id: int, name: str = None, category: str = None, price: float = None,
                    description: str = None, spicy_level: int = None, image_url: str = None,
                    is_active: int = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(dish_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Dish not found',
                'data': None
            }

        if name is not None:
            name = name.strip()
            if not name:
                return {
                    'code': 1,
                    'message': 'Dish name cannot be empty',
                    'data': None
                }
        if category is not None:
            category = category.strip()
            if not category:
                return {
                    'code': 1,
                    'message': 'Category cannot be empty',
                    'data': None
                }
        if price is not None and price < 0:
            return {
                'code': 1,
                'message': 'Invalid price',
                'data': None
            }
        if spicy_level is not None and (spicy_level < 0 or spicy_level > 3):
            return {
                'code': 1,
                'message': 'Spicy level must be between 0 and 3',
                'data': None
            }

        affected = self.model.update(dish_id, name, category, price, description, spicy_level, image_url, is_active)
        if affected > 0:
            dish = self.model.get_by_id(dish_id)
            return {
                'code': 0,
                'message': 'Dish updated successfully',
                'data': dish
            }
        return {
            'code': 1,
            'message': 'Update failed',
            'data': None
        }

    def delete_dish(self, dish_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(dish_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Dish not found',
                'data': None
            }

        affected = self.model.delete(dish_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'Dish deleted successfully',
                'data': None
            }
        return {
            'code': 1,
            'message': 'Delete failed',
            'data': None
        }

    def set_dish_active(self, dish_id: int, is_active: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(dish_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Dish not found',
                'data': None
            }

        affected = self.model.set_active(dish_id, is_active)
        if affected > 0:
            dish = self.model.get_by_id(dish_id)
            return {
                'code': 0,
                'message': 'Dish status updated successfully',
                'data': dish
            }
        return {
            'code': 1,
            'message': 'Update failed',
            'data': None
        }

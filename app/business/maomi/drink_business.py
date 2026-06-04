from typing import Dict, Any, List, Optional
from app.model.maomi_model import DrinkModel


class DrinkBusiness:
    def __init__(self):
        self.model = DrinkModel()

    def get_all_drinks(self, user_id: int) -> Dict[str, Any]:
        try:
            drinks = self.model.get_by_user_id(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': drinks,
                    'count': len(drinks)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_available_drinks(self, user_id: int) -> Dict[str, Any]:
        try:
            drinks = self.model.get_available(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': drinks,
                    'count': len(drinks)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_drinks_by_type(self, user_id: int, type: str) -> Dict[str, Any]:
        try:
            drinks = self.model.get_by_type(user_id, type)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': drinks,
                    'count': len(drinks)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_drink(self, drink_id: int) -> Dict[str, Any]:
        drink = self.model.get_by_id(drink_id)
        if drink:
            return {
                'code': 0,
                'message': 'success',
                'data': drink
            }
        return {
            'code': 1,
            'message': '饮品不存在',
            'data': None
        }

    def add_drink(self, user_id: int, name: str, type: str, price: int, cost: int = 0,
                   description: str = '', preparation_time: int = 5) -> Dict[str, Any]:
        if type not in ['drink', 'dessert']:
            return {
                'code': 1,
                'message': '类型必须是drink或dessert',
                'data': None
            }
        if price <= 0:
            return {
                'code': 1,
                'message': '价格必须大于0',
                'data': None
            }
        try:
            drink_id = self.model.create(
                user_id=user_id,
                name=name,
                type=type,
                price=price,
                cost=cost,
                description=description,
                preparation_time=preparation_time
            )
            return self.get_drink(drink_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_drink(self, user_id: int, drink_id: int, name: str = None, type: str = None,
                   price: int = None, cost: int = None, description: str = None,
                   stock: int = None, preparation_time: int = None) -> Dict[str, Any]:
        drink = self.model.get_by_id(drink_id)
        if not drink:
            return {
                'code': 1,
                'message': '饮品不存在',
                'data': None
            }
        if drink.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此饮品',
                'data': None
            }
        try:
            self.model.update(drink_id, name=name, type=type, price=price, cost=cost,
                              description=description, stock=stock,
                              preparation_time=preparation_time)
            return self.get_drink(drink_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def toggle_available(self, user_id: int, drink_id: int) -> Dict[str, Any]:
        drink = self.model.get_by_id(drink_id)
        if not drink:
            return {
                'code': 1,
                'message': '饮品不存在',
                'data': None
            }
        if drink.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此饮品',
                'data': None
            }
        try:
            drink = self.model.toggle_available(drink_id)
            if drink:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': drink
                }
            return {
                'code': 1,
                'message': '操作失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_drink(self, user_id: int, drink_id: int) -> Dict[str, Any]:
        drink = self.model.get_by_id(drink_id)
        if not drink:
            return {
                'code': 1,
                'message': '饮品不存在',
                'data': None
            }
        if drink.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此饮品',
                'data': None
            }
        try:
            affected = self.model.delete(drink_id)
            if affected > 0:
                return {
                    'code': 0,
                    'message': '删除成功',
                    'data': None
                }
            return {
                'code': 1,
                'message': '删除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def create_default_drinks(self, user_id: int) -> Dict[str, Any]:
        try:
            count = self.model.create_default_drinks(user_id)
            return {
                'code': 0,
                'message': f'成功创建{count}个默认饮品',
                'data': {
                    'count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_popularity(self, user_id: int, drink_id: int, delta: int) -> Dict[str, Any]:
        drink = self.model.get_by_id(drink_id)
        if not drink:
            return {
                'code': 1,
                'message': '饮品不存在',
                'data': None
            }
        if drink.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此饮品',
                'data': None
            }
        try:
            self.model.update_popularity(drink_id, delta)
            return self.get_drink(drink_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

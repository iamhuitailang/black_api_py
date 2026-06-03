from typing import Dict, Any, Optional
from app.model.ty_model import ResourceModel, UserResourceModel, UserModel


class TyResourceBusiness:
    def __init__(self):
        self.resource_model = ResourceModel()
        self.user_resource_model = UserResourceModel()
        self.user_model = UserModel()

    def get_all_resources(self, page: int = 1, page_size: int = 20,
                          resource_type: str = None, rarity: int = None) -> Dict[str, Any]:
        result = self.resource_model.get_all(page, page_size, resource_type, rarity)
        items = [self.resource_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_user_resources(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_resource_model.get_by_user_id(user_id, page, page_size)
        items = [self.user_resource_model.to_public_dict(item) for item in result.get('items', [])]

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

    def buy_resource(self, user_id: int, resource_id: int, quantity: int = 1) -> Dict[str, Any]:
        if quantity < 1:
            return {
                'code': 1,
                'msg': '购买数量必须大于0',
                'data': None
            }

        resource = self.resource_model.get_by_id(resource_id)
        if not resource or resource.get('status') != 1:
            return {
                'code': 1,
                'msg': '资源不存在或已下架',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        total_price = resource.get('price', 10) * quantity
        if user.get('gold', 0) < total_price:
            return {
                'code': 1,
                'msg': f'金币不足，需要{total_price}金币',
                'data': None
            }

        self.user_model.add_gold(user_id, -total_price)
        affected = self.user_resource_model.add_resource(user_id, resource_id, quantity)

        if affected > 0:
            resource_type = resource.get('resource_type')
            resource_value = resource.get('value', 1) * quantity

            if resource_type == 'paint':
                self.user_model.add_paint(user_id, resource_value)
            elif resource_type == 'canvas':
                self.user_model.add_canvas(user_id, resource_value)

            return {
                'code': 0,
                'msg': '购买成功',
                'data': {
                    'resource_id': resource_id,
                    'quantity': quantity,
                    'total_price': total_price
                }
            }

        self.user_model.add_gold(user_id, total_price)
        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def use_resource(self, user_id: int, resource_id: int, quantity: int = 1) -> Dict[str, Any]:
        if quantity < 1:
            return {
                'code': 1,
                'msg': '使用数量必须大于0',
                'data': None
            }

        resource = self.resource_model.get_by_id(resource_id)
        if not resource:
            return {
                'code': 1,
                'msg': '资源不存在',
                'data': None
            }

        if not self.user_resource_model.use_resource(user_id, resource_id, quantity):
            return {
                'code': 1,
                'msg': '资源数量不足',
                'data': None
            }

        resource_type = resource.get('resource_type')
        resource_value = resource.get('value', 1) * quantity

        effect_result = {}
        if resource_type == 'paint':
            self.user_model.add_paint(user_id, resource_value)
            effect_result = {'paint_added': resource_value}
        elif resource_type == 'canvas':
            self.user_model.add_canvas(user_id, resource_value)
            effect_result = {'canvas_added': resource_value}
        elif resource_type == 'skill_book':
            pass

        return {
            'code': 0,
            'msg': '使用成功',
            'data': effect_result
        }

    def create_resource(self, name: str, resource_type: str, rarity: int = 1,
                        description: str = '', image: str = '', effect: str = '',
                        value: int = 1, price: int = 10) -> Dict[str, Any]:
        resource_id = self.resource_model.create(
            name=name,
            resource_type=resource_type,
            rarity=rarity,
            description=description,
            image=image,
            effect=effect,
            value=value,
            price=price
        )

        if resource_id > 0:
            resource = self.resource_model.get_by_id(resource_id)
            return {
                'code': 0,
                'msg': '资源创建成功',
                'data': self.resource_model.to_public_dict(resource)
            }

        return {
            'code': 1,
            'msg': '资源创建失败',
            'data': None
        }

    def add_resource_to_user(self, user_id: int, resource_id: int, quantity: int = 1) -> Dict[str, Any]:
        affected = self.user_resource_model.add_resource(user_id, resource_id, quantity)
        if affected > 0:
            return {
                'code': 0,
                'msg': '资源添加成功',
                'data': {'user_id': user_id, 'resource_id': resource_id, 'quantity': quantity}
            }
        return {
            'code': 1,
            'msg': '资源添加失败',
            'data': None
        }

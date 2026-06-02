from typing import Dict, Any, List, Optional
from app.model.saiche_model import CarModel, UserCarModel, UserModel


class SaicheCarBusiness:
    def __init__(self):
        self.car_model = CarModel()
        self.user_car_model = UserCarModel()
        self.user_model = UserModel()

    def get_car_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.car_model.get_all(page, page_size)
        items = [self.car_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_car_detail(self, car_id: int) -> Dict[str, Any]:
        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '赛车不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.car_model.to_public_dict(car)
        }

    def get_user_cars(self, user_id: int) -> Dict[str, Any]:
        user_cars = self.user_car_model.get_user_cars(user_id)
        items = [self.user_car_model.to_public_dict(uc) for uc in user_cars]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_active_car(self, user_id: int) -> Dict[str, Any]:
        active_car = self.user_car_model.get_active_car(user_id)
        if not active_car:
            return {
                'code': 1,
                'msg': '没有激活的赛车',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.user_car_model.to_public_dict(active_car)
        }

    def set_active_car(self, user_id: int, user_car_id: int) -> Dict[str, Any]:
        user_car = self.user_car_model.get_by_id(user_car_id)
        if not user_car or user_car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '赛车不存在',
                'data': None
            }

        affected = self.user_car_model.set_active_car(user_id, user_car_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '设置成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '设置失败',
            'data': None
        }

    def upgrade_car(self, user_id: int, user_car_id: int, attribute: str) -> Dict[str, Any]:
        valid_attributes = ['speed', 'acceleration', 'handling', 'nitro']
        if attribute not in valid_attributes:
            return {
                'code': 1,
                'msg': '无效的属性类型',
                'data': None
            }

        user_car = self.user_car_model.get_by_id(user_car_id)
        if not user_car or user_car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '赛车不存在',
                'data': None
            }

        car = self.car_model.get_by_id(user_car.get('car_id'))
        if not car:
            return {
                'code': 1,
                'msg': '赛车数据异常',
                'data': None
            }

        level_field = f'{attribute}_level'
        current_level = user_car.get(level_field, 0)

        if current_level >= self.user_car_model.MAX_LEVEL:
            return {
                'code': 1,
                'msg': '该属性已满级',
                'data': None
            }

        upgrade_cost = self.user_car_model.get_upgrade_cost(car, attribute, current_level)

        user = self.user_model.get_by_id(user_id)
        if not user or user.get('coins', 0) < upgrade_cost:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        self.user_model.update_coins(user_id, -upgrade_cost)
        affected = self.user_car_model.upgrade_attribute(user_car_id, attribute)

        if affected > 0:
            updated_user_car = self.user_car_model.get_by_id(user_car_id)
            return {
                'code': 0,
                'msg': '升级成功',
                'data': self.user_car_model.to_public_dict(updated_user_car)
            }

        return {
            'code': 1,
            'msg': '升级失败',
            'data': None
        }

    def add_car(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'base_speed', 'base_acceleration',
                           'base_handling', 'base_nitro', 'max_speed',
                           'max_acceleration', 'max_handling', 'max_nitro']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必填字段: {field}',
                    'data': None
                }

        car_id = self.car_model.create(data)
        if car_id > 0:
            car = self.car_model.get_by_id(car_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.car_model.to_public_dict(car)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_car(self, car_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '赛车不存在',
                'data': None
            }

        affected = self.car_model.update(car_id, data)
        if affected > 0:
            updated_car = self.car_model.get_by_id(car_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.car_model.to_public_dict(updated_car)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_car(self, car_id: int) -> Dict[str, Any]:
        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '赛车不存在',
                'data': None
            }

        affected = self.car_model.delete(car_id)
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

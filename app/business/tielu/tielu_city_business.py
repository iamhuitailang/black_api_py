from typing import Dict, Any, List, Optional
from app.model.tielu import TieluCityModel, TieluUserModel, TieluGoodsConfigModel


class TieluCityBusiness:
    def __init__(self):
        self.city_model = TieluCityModel()
        self.user_model = TieluUserModel()
        self.goods_config_model = TieluGoodsConfigModel()

    def get_user_cities(self, user_id: int) -> Dict[str, Any]:
        cities = self.city_model.get_by_user_id(user_id)
        result = [self.city_model.to_public_dict(c) for c in cities]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_unlocked_cities(self, user_id: int) -> Dict[str, Any]:
        cities = self.city_model.get_unlocked_cities(user_id)
        result = [self.city_model.to_public_dict(c) for c in cities]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def unlock_city(self, user_id: int, city_name: str) -> Dict[str, Any]:
        city = self.city_model.get_by_name(user_id, city_name)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        if city.get('unlocked') == 1:
            return {
                'code': 1,
                'msg': '该城市已解锁',
                'data': None
            }

        unlock_cost = city.get('unlock_cost', 500)
        user = self.user_model.get_by_id(user_id)

        if user.get('gold', 0) < unlock_cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要 {unlock_cost} 金币',
                'data': None
            }

        if self.user_model.spend_gold(user_id, unlock_cost):
            result = self.city_model.unlock_city(user_id, city_name)
            if result.get('success'):
                return {
                    'code': 0,
                    'msg': result.get('msg'),
                    'data': {
                        'city': city_name,
                        'cost': unlock_cost
                    }
                }

        return {
            'code': 1,
            'msg': '解锁失败',
            'data': None
        }

    def upgrade_city_station(self, user_id: int, city_name: str) -> Dict[str, Any]:
        city = self.city_model.get_by_name(user_id, city_name)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        if city.get('unlocked') != 1:
            return {
                'code': 1,
                'msg': '请先解锁该城市',
                'data': None
            }

        current_level = city.get('station_level', 1)
        if current_level >= 4:
            return {
                'code': 1,
                'msg': '车站已达到最高等级',
                'data': None
            }

        upgrade_costs = {
            1: 1000,
            2: 2000,
            3: 3000,
            4: 4000
        }
        cost = upgrade_costs.get(current_level, 1000)

        user = self.user_model.get_by_id(user_id)
        if user.get('gold', 0) < cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要 {cost} 金币',
                'data': None
            }

        if self.user_model.spend_gold(user_id, cost):
            result = self.city_model.upgrade_station(user_id, city_name)
            if result.get('success'):
                return {
                    'code': 0,
                    'msg': result.get('msg'),
                    'data': {
                        'old_level': result.get('old_level'),
                        'new_level': result.get('new_level'),
                        'cost': cost
                    }
                }

        return {
            'code': 1,
            'msg': '升级失败',
            'data': None
        }

    def get_city_goods(self, city_name: str) -> Dict[str, Any]:
        goods = self.goods_config_model.get_by_city(city_name)
        result = [self.goods_config_model.to_public_dict(g) for g in goods]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_goods_config(self) -> Dict[str, Any]:
        goods = self.goods_config_model.get_all()
        result = [self.goods_config_model.to_public_dict(g) for g in goods]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_city_by_name(self, user_id: int, city_name: str) -> Dict[str, Any]:
        city = self.city_model.get_by_name(user_id, city_name)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.city_model.to_public_dict(city)
        }

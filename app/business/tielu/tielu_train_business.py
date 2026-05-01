from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.model.tielu import TieluTrainModel, TieluTrainConfigModel, TieluUserModel, TieluCityModel


class TieluTrainBusiness:
    def __init__(self):
        self.train_model = TieluTrainModel()
        self.train_config_model = TieluTrainConfigModel()
        self.user_model = TieluUserModel()
        self.city_model = TieluCityModel()

    def get_user_trains(self, user_id: int) -> Dict[str, Any]:
        trains = self.train_model.get_by_user_id(user_id)
        result = [self.train_model.to_public_dict(t) for t in trains]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_train_by_id(self, train_id: int, user_id: int) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train:
            return {
                'code': 1,
                'msg': '火车不存在',
                'data': None
            }

        if train.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该火车',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.train_model.to_public_dict(train)
        }

    def get_idle_trains(self, user_id: int) -> Dict[str, Any]:
        trains = self.train_model.get_by_user_and_status(user_id, self.train_model.STATUS_IDLE)
        result = [self.train_model.to_public_dict(t) for t in trains]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_moving_trains(self, user_id: int) -> Dict[str, Any]:
        trains = self.train_model.get_by_user_and_status(user_id, self.train_model.STATUS_MOVING)
        result = []
        for t in trains:
            train_dict = self.train_model.to_public_dict(t)
            estimated_arrival = t.get('estimated_arrival')
            if estimated_arrival:
                try:
                    if isinstance(estimated_arrival, str):
                        arrival_dt = datetime.fromisoformat(estimated_arrival)
                    else:
                        arrival_dt = estimated_arrival
                    now = datetime.now()
                    remaining = (arrival_dt - now).total_seconds()
                    train_dict['remaining_seconds'] = max(0, int(remaining))
                except:
                    train_dict['remaining_seconds'] = 0
            result.append(train_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def upgrade_train(self, train_id: int, user_id: int) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train:
            return {
                'code': 1,
                'msg': '火车不存在',
                'data': None
            }

        if train.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该火车',
                'data': None
            }

        if train.get('status') != self.train_model.STATUS_IDLE:
            return {
                'code': 1,
                'msg': '火车行驶中，无法升级',
                'data': None
            }

        current_level = train.get('level', 1)
        upgrade_costs = {
            1: 200,
            2: 500,
            3: 800,
            4: 1200,
            5: 1800,
            6: 2500,
            7: 3500,
            8: 5000,
            9: 7000,
        }
        cost = upgrade_costs.get(current_level, 200)

        if current_level >= 10:
            return {
                'code': 1,
                'msg': '火车已达到最高等级',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if user.get('gold', 0) < cost:
            return {
                'code': 1,
                'msg': f'金币不足，需要 {cost} 金币',
                'data': None
            }

        if self.user_model.spend_gold(user_id, cost):
            result = self.train_model.add_level(train_id)
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

    def get_train_config(self) -> Dict[str, Any]:
        configs = self.train_config_model.get_all()
        result = [self.train_config_model.to_public_dict(c) for c in configs]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_train_capacity(self, train: Dict[str, Any]) -> int:
        train_type = train.get('train_type', '')
        level = train.get('level', 1)

        config = self.train_config_model.get_by_name(train_type)
        if not config:
            return 10

        base_capacity = config.get('capacity', 10)
        bonus = (level - 1) * 2

        return base_capacity + bonus

    def get_train_speed(self, train: Dict[str, Any]) -> int:
        train_type = train.get('train_type', '')
        level = train.get('level', 1)

        config = self.train_config_model.get_by_name(train_type)
        if not config:
            return 60

        base_speed = config.get('speed', 60)
        bonus = (level - 1) * 5

        return base_speed + bonus

    def calculate_travel_time(self, train_id: int, destination: str) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train:
            return {
                'code': 1,
                'msg': '火车不存在',
                'data': None
            }

        current_city = train.get('current_city', '起点镇')
        user_id = train.get('user_id')

        cities = self.city_model.get_by_user_id(user_id)
        current_city_info = None
        dest_city_info = None

        for city in cities:
            if city.get('name') == current_city:
                current_city_info = city
            if city.get('name') == destination:
                dest_city_info = city

        if not dest_city_info:
            return {
                'code': 1,
                'msg': '目标城市不存在',
                'data': None
            }

        if dest_city_info.get('unlocked') != 1:
            return {
                'code': 1,
                'msg': '目标城市未解锁',
                'data': None
            }

        distance = abs(dest_city_info.get('distance', 0) - current_city_info.get('distance', 0) if current_city_info else 0)
        if distance == 0:
            distance = dest_city_info.get('distance', 0)

        speed = self.get_train_speed(train)
        hours = distance / speed
        seconds = int(hours * 3600)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'from': current_city,
                'to': destination,
                'distance': distance,
                'speed': speed,
                'hours': round(hours, 2),
                'seconds': seconds
            }
        }

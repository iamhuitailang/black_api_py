from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.model.tielu import (
    TieluTrainModel, TieluCityModel, TieluWarehouseModel, 
    TieluGoodsConfigModel, TieluUserModel, TieluTrainConfigModel
)


class TieluGameBusiness:
    def __init__(self):
        self.train_model = TieluTrainModel()
        self.city_model = TieluCityModel()
        self.warehouse_model = TieluWarehouseModel()
        self.goods_config_model = TieluGoodsConfigModel()
        self.user_model = TieluUserModel()
        self.train_config_model = TieluTrainConfigModel()

    def get_game_data(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        cities = self.city_model.get_by_user_id(user_id)
        trains = self.train_model.get_by_user_id(user_id)
        warehouses = self.warehouse_model.get_by_user_id(user_id)

        user_dict = self.user_model.to_public_dict(user) if user else None
        cities_list = [self.city_model.to_public_dict(c) for c in cities]
        trains_list = []

        for t in trains:
            train_dict = self.train_model.to_public_dict(t)
            if t.get('status') == self.train_model.STATUS_MOVING:
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
            trains_list.append(train_dict)

        warehouse_dict = {}
        for w in warehouses:
            city = w.get('city_name', '')
            goods = w.get('goods_type', '')
            amount = w.get('amount', 0)
            if city not in warehouse_dict:
                warehouse_dict[city] = {}
            warehouse_dict[city][goods] = amount

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': user_dict,
                'cities': cities_list,
                'trains': trains_list,
                'warehouse': warehouse_dict
            }
        }

    def start_transport(self, user_id: int, train_id: int, destination: str, 
                        cargo: List[Dict]) -> Dict[str, Any]:
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
                'msg': '火车正在行驶中',
                'data': None
            }

        current_city = train.get('current_city', '起点镇')

        dest_city = self.city_model.get_by_name(user_id, destination)
        if not dest_city:
            return {
                'code': 1,
                'msg': '目标城市不存在',
                'data': None
            }

        if dest_city.get('unlocked') != 1:
            return {
                'code': 1,
                'msg': '目标城市未解锁',
                'data': None
            }

        total_amount = sum(item.get('amount', 0) for item in cargo)

        train_config = self.train_config_model.get_by_name(train.get('train_type', ''))
        base_capacity = train_config.get('capacity', 10) if train_config else 10
        level_bonus = (train.get('level', 1) - 1) * 2
        max_capacity = base_capacity + level_bonus

        if total_amount > max_capacity:
            return {
                'code': 1,
                'msg': f'货物重量超过火车载重上限，最大载重 {max_capacity} 吨',
                'data': None
            }

        for item in cargo:
            goods_type = item.get('goods_type', '')
            amount = item.get('amount', 0)
            if amount > 0:
                warehouse = self.warehouse_model.get_by_user_city_goods(user_id, current_city, goods_type)
                if not warehouse or warehouse.get('amount', 0) < amount:
                    return {
                        'code': 1,
                        'msg': f'{current_city} 的 {goods_type} 不足',
                        'data': None
                    }

        for item in cargo:
            goods_type = item.get('goods_type', '')
            amount = item.get('amount', 0)
            if amount > 0:
                self.warehouse_model.remove_goods(user_id, current_city, goods_type, amount)

        distance = abs(dest_city.get('distance', 0))
        if current_city != '起点镇':
            current_city_info = self.city_model.get_by_name(user_id, current_city)
            if current_city_info:
                distance = abs(dest_city.get('distance', 0) - current_city_info.get('distance', 0))

        base_speed = train_config.get('speed', 60) if train_config else 60
        speed_bonus = (train.get('level', 1) - 1) * 5
        speed = base_speed + speed_bonus

        hours = distance / speed
        travel_seconds = int(hours * 3600)

        if travel_seconds < 10:
            travel_seconds = 10

        estimated_arrival = datetime.now() + timedelta(seconds=travel_seconds)

        self.train_model.start_journey(train_id, destination, cargo, estimated_arrival)

        return {
            'code': 0,
            'msg': '运输任务已开始',
            'data': {
                'train_id': train_id,
                'from': current_city,
                'to': destination,
                'distance': distance,
                'speed': speed,
                'travel_seconds': travel_seconds,
                'estimated_arrival': estimated_arrival.isoformat(),
                'cargo': cargo
            }
        }

    def check_arrival(self, user_id: int, train_id: int) -> Dict[str, Any]:
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

        if train.get('status') != self.train_model.STATUS_MOVING:
            return {
                'code': 1,
                'msg': '火车不在行驶中',
                'data': None
            }

        estimated_arrival = train.get('estimated_arrival')
        if estimated_arrival:
            try:
                if isinstance(estimated_arrival, str):
                    arrival_dt = datetime.fromisoformat(estimated_arrival)
                else:
                    arrival_dt = estimated_arrival
                now = datetime.now()

                if now < arrival_dt:
                    remaining = int((arrival_dt - now).total_seconds())
                    return {
                        'code': 0,
                        'msg': f'还在行驶中，剩余 {remaining} 秒',
                        'data': {
                            'arrived': False,
                            'remaining_seconds': remaining
                        }
                    }
            except:
                pass

        result = self.train_model.complete_journey(train_id)

        if not result.get('success'):
            return {
                'code': 1,
                'msg': result.get('msg'),
                'data': None
            }

        cargo = result.get('cargo', [])
        destination = result.get('destination')

        total_gold = 0
        total_exp = 0

        for item in cargo:
            goods_type = item.get('goods_type', '')
            amount = item.get('amount', 0)
            if amount > 0:
                goods_config = self.goods_config_model.get_by_name(goods_type)
                if goods_config:
                    price = goods_config.get('price', 0)
                    total_gold += price * amount
                    total_exp += amount * 10

                self.warehouse_model.add_goods(user_id, destination, goods_type, amount)

        if total_gold > 0:
            self.user_model.add_gold(user_id, total_gold)

        level_up_result = {'level_up': False}
        if total_exp > 0:
            level_up_result = self.user_model.add_exp(user_id, total_exp)

        user = self.user_model.get_by_id(user_id)

        return {
            'code': 0,
            'msg': '运输完成！',
            'data': {
                'arrived': True,
                'train_id': train_id,
                'destination': destination,
                'cargo': cargo,
                'gold_earned': total_gold,
                'exp_earned': total_exp,
                'level_up': level_up_result.get('level_up', False),
                'old_level': level_up_result.get('old_level'),
                'new_level': level_up_result.get('new_level'),
                'current_gold': user.get('gold', 0) if user else 0,
                'current_exp': user.get('exp', 0) if user else 0,
                'current_level': user.get('level', 1) if user else 1
            }
        }

    def collect_all_arrived(self, user_id: int) -> Dict[str, Any]:
        trains = self.train_model.get_by_user_and_status(user_id, self.train_model.STATUS_MOVING)

        results = []
        total_gold = 0
        total_exp = 0

        for train in trains:
            train_id = train.get('id')
            result = self.check_arrival(user_id, train_id)

            if result.get('code') == 0:
                data = result.get('data', {})
                if data.get('arrived'):
                    results.append({
                        'train_id': train_id,
                        'train_type': train.get('train_type'),
                        'destination': data.get('destination'),
                        'gold_earned': data.get('gold_earned', 0),
                        'exp_earned': data.get('exp_earned', 0)
                    })
                    total_gold += data.get('gold_earned', 0)
                    total_exp += data.get('exp_earned', 0)

        return {
            'code': 0,
            'msg': '收集完成',
            'data': {
                'completed_count': len(results),
                'results': results,
                'total_gold': total_gold,
                'total_exp': total_exp
            }
        }

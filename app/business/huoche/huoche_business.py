from typing import Dict, Any, List, Optional
import random
from app.model.huoche import (
    TrainTypeModel, TrainModel, RouteModel, StationModel,
    PassengerModel, CargoModel, UserGameModel, GameRecordModel
)
from app.model.auth import UserModel


class HuocheBusiness:
    def __init__(self):
        self.train_type_model = TrainTypeModel()
        self.train_model = TrainModel()
        self.route_model = RouteModel()
        self.station_model = StationModel()
        self.passenger_model = PassengerModel()
        self.cargo_model = CargoModel()
        self.user_game_model = UserGameModel()
        self.game_record_model = GameRecordModel()
        self.user_model = UserModel()

    def register_user(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {
                'code': 1,
                'message': '用户名不能为空',
                'data': None
            }
        
        if not password or len(password) < 6:
            return {
                'code': 1,
                'message': '密码长度至少6位',
                'data': None
            }
        
        existing_user = self.user_model.get_by_username(username.strip())
        if existing_user:
            return {
                'code': 1,
                'message': '用户名已存在',
                'data': None
            }
        
        user_id = self.user_model.create(username.strip(), password)
        
        self.user_game_model.create(user_id)
        
        steam_train_type = self.train_type_model.get_by_code('steam')
        if steam_train_type:
            self.train_model.create(user_id, steam_train_type['id'], f'{username}的蒸汽机车')
        
        return {
            'code': 0,
            'message': '注册成功',
            'data': {
                'user_id': user_id,
                'username': username
            }
        }

    def get_user_game_info(self, user_id: int) -> Dict[str, Any]:
        user_game = self.user_game_model.get_or_create(user_id)
        user_trains = self.train_model.get_user_train_with_type(user_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user_game': user_game,
                'trains': user_trains
            }
        }

    def get_all_train_types(self) -> Dict[str, Any]:
        train_types = self.train_type_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': train_types
        }

    def get_available_routes(self, user_id: int) -> Dict[str, Any]:
        user_game = self.user_game_model.get_or_create(user_id)
        level = user_game.get('level', 1)
        routes = self.route_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'routes': routes,
                'user_level': level
            }
        }

    def get_route_stations(self, route_id: int) -> Dict[str, Any]:
        stations = self.station_model.get_by_route_id(route_id)
        return {
            'code': 0,
            'message': 'success',
            'data': stations
        }

    def buy_train(self, user_id: int, train_type_id: int, train_name: str) -> Dict[str, Any]:
        train_type = self.train_type_model.get_by_id(train_type_id)
        if not train_type:
            return {
                'code': 1,
                'message': '火车类型不存在',
                'data': None
            }
        
        if self.train_model.has_train_type(user_id, train_type_id):
            return {
                'code': 1,
                'message': '您已经拥有该类型的火车',
                'data': None
            }
        
        user_game = self.user_game_model.get_or_create(user_id)
        user_level = user_game.get('level', 1)
        
        if user_level < train_type.get('unlock_level', 1):
            return {
                'code': 1,
                'message': f'需要等级{train_type.get("unlock_level", 1)}才能购买此火车',
                'data': None
            }
        
        price = train_type.get('base_price', 0)
        if price > 0:
            if not self.user_game_model.spend_coins(user_id, price):
                return {
                    'code': 1,
                    'message': '金币不足',
                    'data': None
                }
        
        train_id = self.train_model.create(user_id, train_type_id, train_name or train_type.get('name', '新火车'))
        
        return {
            'code': 0,
            'message': '购买成功',
            'data': {
                'train_id': train_id
            }
        }

    def upgrade_train_attribute(self, user_id: int, train_id: int, attribute: str) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train or train.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '火车不存在或不属于您',
                'data': None
            }
        
        upgrade_costs = {
            'speed_level': 500,
            'capacity_level': 400,
            'efficiency_level': 600,
            'reliability_level': 700
        }
        
        if attribute not in upgrade_costs:
            return {
                'code': 1,
                'message': '无效的升级属性',
                'data': None
            }
        
        current_level = train.get(attribute, 1)
        if current_level >= 10:
            return {
                'code': 1,
                'message': '已达到最高等级',
                'data': None
            }
        
        cost = upgrade_costs[attribute] * current_level
        if not self.user_game_model.spend_coins(user_id, cost):
            return {
                'code': 1,
                'message': '金币不足',
                'data': None
            }
        
        self.train_model.upgrade_attribute(train_id, attribute)
        
        return {
            'code': 0,
            'message': '升级成功',
            'data': {
                'attribute': attribute,
                'new_level': current_level + 1,
                'cost': cost
            }
        }

    def start_game(self, user_id: int, train_id: int, route_id: int) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train or train.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '火车不存在或不属于您',
                'data': None
            }
        
        route = self.route_model.get_by_id(route_id)
        if not route:
            return {
                'code': 1,
                'message': '线路不存在',
                'data': None
            }
        
        user_game = self.user_game_model.get_or_create(user_id)
        if user_game.get('level', 1) < route.get('unlock_level', 1):
            return {
                'code': 1,
                'message': '等级不足，无法使用此线路',
                'data': None
            }
        
        stations = self.station_model.get_by_route_id(route_id)
        train_type = self.train_type_model.get_by_id(train.get('train_type_id'))
        
        weather_conditions = ['clear', 'cloudy', 'rain', 'fog', 'snow']
        weather = random.choice(weather_conditions[:route.get('weather_effect', 1) + 1])
        
        game_record_id = self.game_record_model.start_game(
            user_id, train_id, route_id, route.get('estimated_time', 60)
        )
        
        passenger_count = random.randint(
            int(train_type.get('capacity', 100) * 0.5),
            train_type.get('capacity', 100)
        )
        passenger_names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', 
                          '郑十一', '王小明', '李小红', '张美丽', '刘德华', '周杰伦', '林俊杰']
        
        passengers = []
        for i in range(passenger_count):
            dest_station = random.choice(stations[1:]) if len(stations) > 1 else stations[-1]
            passengers.append({
                'user_id': user_id,
                'game_record_id': game_record_id,
                'name': random.choice(passenger_names) + str(i + 1),
                'age': random.randint(18, 70),
                'destination_station_id': dest_station.get('id'),
                'ticket_price': random.randint(20, 100),
                'satisfaction': 100.0
            })
        
        if passengers:
            self.passenger_model.create_batch(passengers)
        
        cargo_types = [
            {'name': '煤炭', 'type': 'bulk'},
            {'name': '粮食', 'type': 'food'},
            {'name': '钢材', 'type': 'metal'},
            {'name': '电子产品', 'type': 'fragile'},
            {'name': '家具', 'type': 'general'}
        ]
        cargo_count = random.randint(3, 8)
        cargo_list = []
        for i in range(cargo_count):
            cargo_type = random.choice(cargo_types)
            dest_station = random.choice(stations[1:]) if len(stations) > 1 else stations[-1]
            cargo_list.append({
                'user_id': user_id,
                'game_record_id': game_record_id,
                'name': cargo_type['name'],
                'type': cargo_type['type'],
                'weight': round(random.uniform(5, 50), 2),
                'destination_station_id': dest_station.get('id'),
                'shipping_fee': random.randint(50, 300),
                'condition': 100.0
            })
        
        if cargo_list:
            self.cargo_model.create_batch(cargo_list)
        
        return {
            'code': 0,
            'message': '游戏开始',
            'data': {
                'game_record_id': game_record_id,
                'train': train,
                'train_type': train_type,
                'route': route,
                'stations': stations,
                'weather': weather,
                'passenger_count': passenger_count,
                'cargo_count': cargo_count
            }
        }

    def complete_game(self, user_id: int, game_record_id: int, game_data: Dict[str, Any]) -> Dict[str, Any]:
        game_record = self.game_record_model.get_by_id(game_record_id)
        if not game_record or game_record.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '游戏记录不存在或不属于您',
                'data': None
            }
        
        if game_record.get('is_completed'):
            return {
                'code': 1,
                'message': '游戏已完成',
                'data': None
            }
        
        self.game_record_model.complete_game(game_record_id, game_data)
        
        coins_earned = game_data.get('coins_earned', 0)
        exp_earned = game_data.get('exp_earned', 0)
        
        if coins_earned > 0:
            self.user_game_model.add_coins(user_id, coins_earned)
        
        if exp_earned > 0:
            level_result = self.user_game_model.add_experience(user_id, exp_earned)
        else:
            level_result = {}
        
        distance = game_data.get('distance', 0)
        passengers = game_data.get('passengers_transported', 0)
        cargo = game_data.get('cargo_transported', 0)
        is_perfect = game_data.get('is_perfect', False)
        
        self.user_game_model.add_stats(user_id, distance, passengers, cargo, is_perfect)
        
        train_id = game_record.get('train_id')
        self.train_model.add_stats(train_id, distance, passengers, cargo)
        
        updated_record = self.game_record_model.get_by_id(game_record_id)
        
        return {
            'code': 0,
            'message': '游戏完成',
            'data': {
                'game_record': updated_record,
                'level_result': level_result
            }
        }

    def get_game_history(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        records = self.game_record_model.get_by_user_id(user_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_best_scores(self, user_id: int, limit: int = 10) -> Dict[str, Any]:
        scores = self.game_record_model.get_user_best_scores(user_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': scores
        }

    def repair_train(self, user_id: int, train_id: int) -> Dict[str, Any]:
        train = self.train_model.get_by_id(train_id)
        if not train or train.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '火车不存在或不属于您',
                'data': None
            }
        
        current_condition = train.get('current_condition', 100)
        if current_condition >= 100:
            return {
                'code': 1,
                'message': '火车状态良好，无需维修',
                'data': None
            }
        
        repair_cost = int((100 - current_condition) * 10)
        if not self.user_game_model.spend_coins(user_id, repair_cost):
            return {
                'code': 1,
                'message': '金币不足',
                'data': None
            }
        
        self.train_model.update_condition(train_id, 100.0)
        
        return {
            'code': 0,
            'message': '维修成功',
            'data': {
                'cost': repair_cost
            }
        }

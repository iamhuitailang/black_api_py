from typing import Dict, Any, List, Optional
from app.model.tielu import TieluTrainConfigModel, TieluTrackConfigModel, TieluUserModel, TieluTrainModel


class TieluShopBusiness:
    def __init__(self):
        self.train_config_model = TieluTrainConfigModel()
        self.track_config_model = TieluTrackConfigModel()
        self.user_model = TieluUserModel()
        self.train_model = TieluTrainModel()

    def get_shop_items(self, user_level: int = 1) -> Dict[str, Any]:
        train_configs = self.train_config_model.get_all()
        track_configs = self.track_config_model.get_all()

        trains = []
        for t in train_configs:
            train_dict = self.train_config_model.to_public_dict(t)
            train_dict['available'] = t.get('min_level', 1) <= user_level
            train_dict['locked'] = t.get('min_level', 1) > user_level
            trains.append(train_dict)

        tracks = []
        for t in track_configs:
            track_dict = self.track_config_model.to_public_dict(t)
            track_dict['available'] = t.get('min_level', 1) <= user_level
            track_dict['locked'] = t.get('min_level', 1) > user_level
            tracks.append(track_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'trains': trains,
                'tracks': tracks
            }
        }

    def buy_train(self, user_id: int, train_type: str) -> Dict[str, Any]:
        train_config = self.train_config_model.get_by_name(train_type)
        if not train_config:
            return {
                'code': 1,
                'msg': '火车类型不存在',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_level = user.get('level', 1)
        min_level = train_config.get('min_level', 1)
        if user_level < min_level:
            return {
                'code': 1,
                'msg': f'等级不足，需要等级 {min_level}',
                'data': None
            }

        price = train_config.get('price', 0)
        user_gold = user.get('gold', 0)

        if user_gold < price:
            return {
                'code': 1,
                'msg': f'金币不足，需要 {price} 金币',
                'data': None
            }

        if self.user_model.spend_gold(user_id, price):
            train_id = self.train_model.create(user_id, train_type)
            if train_id > 0:
                updated_user = self.user_model.get_by_id(user_id)
                return {
                    'code': 0,
                    'msg': '购买成功',
                    'data': {
                        'train_id': train_id,
                        'train_type': train_type,
                        'price': price,
                        'remaining_gold': updated_user.get('gold', 0)
                    }
                }

        return {
            'code': 1,
            'msg': '购买失败',
            'data': None
        }

    def get_user_trains_count(self, user_id: int) -> int:
        trains = self.train_model.get_by_user_id(user_id)
        return len(trains)

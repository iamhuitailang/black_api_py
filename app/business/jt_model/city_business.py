from typing import Dict, Any
from app.model.jt_model import CityModel, RoadModel, SignalModel, TransitModel, AccidentModel


class JtCityBusiness:
    def __init__(self):
        self.city_model = CityModel()
        self.road_model = RoadModel()
        self.signal_model = SignalModel()
        self.transit_model = TransitModel()
        self.accident_model = AccidentModel()

    def get_or_create_city(self, user_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_user_id(user_id)
        if city:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.city_model.to_public_dict(city)
            }

        city_id = self.city_model.create(user_id)
        if city_id > 0:
            city = self.city_model.get_by_id(city_id)
            return {
                'code': 0,
                'msg': '城市创建成功',
                'data': self.city_model.to_public_dict(city)
            }

        return {
            'code': 1,
            'msg': '城市创建失败',
            'data': None
        }

    def get_city(self, user_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_user_id(user_id)
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

    def update_city(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        city = self.city_model.get_by_user_id(user_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        affected = self.city_model.update_city(city.get('id'), data)
        if affected >= 0:
            updated_city = self.city_model.get_by_id(city.get('id'))
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.city_model.to_public_dict(updated_city)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def upgrade_city(self, user_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_user_id(user_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        current_level = city.get('level', 1)
        cost = current_level * 1000
        current_funds = city.get('funds', 0)

        if current_funds < cost:
            return {
                'code': 1,
                'msg': f'资金不足，升级需要{cost}金币',
                'data': None
            }

        new_level = current_level + 1
        new_funds = current_funds - cost
        self.city_model.update_city(city.get('id'), {
            'level': new_level,
            'funds': new_funds
        })

        updated_city = self.city_model.get_by_id(city.get('id'))
        return {
            'code': 0,
            'msg': '升级成功',
            'data': self.city_model.to_public_dict(updated_city)
        }

    def recalculate_satisfaction(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        roads = self.road_model.get_by_city_id(city_id)
        signals = self.signal_model.get_by_city_id(city_id)
        transits = self.transit_model.get_by_city_id(city_id)
        accidents = self.accident_model.get_active_by_city_id(city_id)

        road_score = 50
        if roads:
            avg_congestion = sum(r.get('congestion_level', 0) for r in roads) / len(roads)
            active_roads = sum(1 for r in roads if r.get('status') == RoadModel.STATUS_ACTIVE)
            road_score = min(100, max(0, 80 - int(avg_congestion * 3) + active_roads * 2))

        signal_score = 50
        if signals:
            active_signals = sum(1 for s in signals if s.get('is_active', 1))
            adaptive_signals = sum(1 for s in signals if s.get('signal_type') == SignalModel.TYPE_ADAPTIVE)
            signal_score = min(100, 40 + active_signals * 5 + adaptive_signals * 10)

        transit_score = 50
        if transits:
            total_ridership = sum(t.get('ridership', 0) for t in transits)
            active_transits = sum(1 for t in transits if t.get('status') == TransitModel.STATUS_ACTIVE)
            transit_score = min(100, 40 + active_transits * 8 + min(total_ridership // 100, 20))

        safety_score = 70
        if accidents:
            avg_severity = sum(a.get('severity', 1) for a in accidents) / len(accidents)
            safety_score = max(0, 80 - len(accidents) * 5 - int(avg_severity * 10))

        overall = int((road_score * 0.3 + signal_score * 0.15 + transit_score * 0.25 + safety_score * 0.3))

        self.city_model.update_city(city_id, {
            'satisfaction': overall,
            'traffic_efficiency': road_score
        })

        updated_city = self.city_model.get_by_id(city_id)
        return {
            'code': 0,
            'msg': '满意度已重算',
            'data': {
                'city': self.city_model.to_public_dict(updated_city),
                'scores': {
                    'road_score': road_score,
                    'signal_score': signal_score,
                    'transit_score': transit_score,
                    'safety_score': safety_score,
                    'overall_score': overall
                }
            }
        }

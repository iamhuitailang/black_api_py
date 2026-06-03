from typing import Dict, Any
from app.model.jt_model import AccidentModel, RoadModel, CityModel, JtUserModel
from datetime import datetime
import random


class JtAccidentBusiness:
    def __init__(self):
        self.accident_model = AccidentModel()
        self.road_model = RoadModel()
        self.city_model = CityModel()
        self.user_model = JtUserModel()

    def create_accident(self, city_id: int, road_id: int = None,
                        accident_type: str = 'collision', severity: int = 1,
                        position_x: float = 0, position_y: float = 0,
                        description: str = '') -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        accident_id = self.accident_model.create(
            city_id=city_id,
            road_id=road_id,
            accident_type=accident_type,
            severity=severity,
            position_x=position_x,
            position_y=position_y,
            description=description
        )

        if accident_id > 0:
            accident = self.accident_model.get_by_id(accident_id)
            return {
                'code': 0,
                'msg': '事故记录创建成功',
                'data': accident
            }

        return {
            'code': 1,
            'msg': '事故记录创建失败',
            'data': None
        }

    def get_accidents(self, city_id: int, status: str = None) -> Dict[str, Any]:
        result = self.accident_model.get_by_city_id(city_id, status=status)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def respond_accident(self, accident_id: int) -> Dict[str, Any]:
        accident = self.accident_model.get_by_id(accident_id)
        if not accident:
            return {
                'code': 1,
                'msg': '事故不存在',
                'data': None
            }

        if accident.get('status') != AccidentModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '该事故状态无法响应',
                'data': None
            }

        created_at = accident.get('created_at', '')
        response_time = 0
        if created_at:
            try:
                created_dt = datetime.fromisoformat(created_at) if isinstance(created_at, str) else created_at
                response_time = int((datetime.now() - created_dt).total_seconds() / 60)
            except (ValueError, TypeError):
                response_time = 0

        self.accident_model.update(accident_id, {
            'status': AccidentModel.STATUS_RESPONDING,
            'response_time': response_time
        })

        updated_accident = self.accident_model.get_by_id(accident_id)
        return {
            'code': 0,
            'msg': '已响应事故',
            'data': updated_accident
        }

    def resolve_accident(self, accident_id: int) -> Dict[str, Any]:
        accident = self.accident_model.get_by_id(accident_id)
        if not accident:
            return {
                'code': 1,
                'msg': '事故不存在',
                'data': None
            }

        if accident.get('status') != AccidentModel.STATUS_RESPONDING:
            return {
                'code': 1,
                'msg': '该事故状态无法解决',
                'data': None
            }

        severity = accident.get('severity', 1)
        reward = severity * 50

        self.accident_model.resolve(
            accident_id,
            response_time=accident.get('response_time', 0)
        )

        city_id = accident.get('city_id')
        city = self.city_model.get_by_id(city_id)
        if city:
            from app.model.jt_model import JtUserModel
            user_model = JtUserModel()
            user_model.update_coins(city.get('user_id'), reward)

        updated_accident = self.accident_model.get_by_id(accident_id)
        return {
            'code': 0,
            'msg': f'事故已解决，获得{reward}金币奖励',
            'data': {
                'accident': updated_accident,
                'reward': reward
            }
        }

    def generate_random_accident(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        roads = self.road_model.get_by_city_id(city_id)
        if not roads:
            return {
                'code': 1,
                'msg': '城市没有道路，无法生成事故',
                'data': None
            }

        road = random.choice(roads)
        accident_types = [AccidentModel.TYPE_COLLISION, AccidentModel.TYPE_BREAKDOWN,
                         AccidentModel.TYPE_SPILL, AccidentModel.TYPE_CONSTRUCTION]
        accident_type = random.choice(accident_types)
        severity = random.choices([1, 2, 3], weights=[5, 3, 1])[0]

        start_x = road.get('start_x', 0)
        start_y = road.get('start_y', 0)
        end_x = road.get('end_x', 100)
        end_y = road.get('end_y', 0)
        t = random.random()
        pos_x = start_x + (end_x - start_x) * t
        pos_y = start_y + (end_y - start_y) * t

        descriptions = {
            AccidentModel.TYPE_COLLISION: '发生车辆碰撞事故',
            AccidentModel.TYPE_BREAKDOWN: '车辆发生故障',
            AccidentModel.TYPE_SPILL: '货物洒漏',
            AccidentModel.TYPE_CONSTRUCTION: '施工区域事故'
        }

        accident_id = self.accident_model.create(
            city_id=city_id,
            road_id=road.get('id'),
            accident_type=accident_type,
            severity=severity,
            position_x=pos_x,
            position_y=pos_y,
            description=descriptions.get(accident_type, '未知事故')
        )

        if accident_id > 0:
            accident = self.accident_model.get_by_id(accident_id)
            return {
                'code': 0,
                'msg': '随机事故已生成',
                'data': accident
            }

        return {
            'code': 1,
            'msg': '随机事故生成失败',
            'data': None
        }

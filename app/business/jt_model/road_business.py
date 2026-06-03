from typing import Dict, Any
from app.model.jt_model import RoadModel, CityModel
import random


class JtRoadBusiness:
    ROAD_COST = {
        RoadModel.TYPE_NORMAL: 500,
        RoadModel.TYPE_HIGHWAY: 2000,
        RoadModel.TYPE_EXPRESS: 1000
    }

    def __init__(self):
        self.road_model = RoadModel()
        self.city_model = CityModel()

    def create_road(self, city_id: int, road_type: str = 'normal', name: str = '',
                    start_x: float = 0, start_y: float = 0,
                    end_x: float = 100, end_y: float = 0,
                    lanes: int = 2, speed_limit: int = 60) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        cost = self.ROAD_COST.get(road_type, 500)
        current_funds = city.get('funds', 0)

        if current_funds < cost:
            return {
                'code': 1,
                'msg': f'资金不足，建设该道路需要{cost}金币',
                'data': None
            }

        capacity = lanes * speed_limit // 30

        road_id = self.road_model.create(
            city_id=city_id,
            road_type=road_type,
            name=name,
            start_x=start_x,
            start_y=start_y,
            end_x=end_x,
            end_y=end_y,
            lanes=lanes,
            speed_limit=speed_limit,
            capacity=capacity
        )

        if road_id > 0:
            self.city_model.update_city(city_id, {'funds': current_funds - cost})
            road = self.road_model.get_by_id(road_id)
            return {
                'code': 0,
                'msg': '道路创建成功',
                'data': road
            }

        return {
            'code': 1,
            'msg': '道路创建失败',
            'data': None
        }

    def get_roads(self, city_id: int) -> Dict[str, Any]:
        roads = self.road_model.get_by_city_id(city_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': roads
        }

    def update_road(self, road_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        road = self.road_model.get_by_id(road_id)
        if not road:
            return {
                'code': 1,
                'msg': '道路不存在',
                'data': None
            }

        affected = self.road_model.update(road_id, data)
        if affected >= 0:
            updated_road = self.road_model.get_by_id(road_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_road
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_road(self, road_id: int) -> Dict[str, Any]:
        road = self.road_model.get_by_id(road_id)
        if not road:
            return {
                'code': 1,
                'msg': '道路不存在',
                'data': None
            }

        affected = self.road_model.delete(road_id)
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

    def simulate_traffic(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        roads = self.road_model.get_by_city_id(city_id)
        updated_roads = []
        population = city.get('population', 10000)

        for road in roads:
            if road.get('status') != RoadModel.STATUS_ACTIVE:
                updated_roads.append(road)
                continue

            capacity = road.get('capacity', 100)
            road_type = road.get('road_type', RoadModel.TYPE_NORMAL)

            base_flow = int(population * random.uniform(0.005, 0.02))
            if road_type == RoadModel.TYPE_HIGHWAY:
                base_flow = int(base_flow * 1.5)
            elif road_type == RoadModel.TYPE_EXPRESS:
                base_flow = int(base_flow * 1.2)

            current_flow = min(base_flow, capacity * 2)
            congestion_level = 0
            if current_flow > capacity:
                congestion_level = min(10, int((current_flow - capacity) / capacity * 10))
            elif current_flow > capacity * 0.7:
                congestion_level = min(5, int((current_flow - capacity * 0.7) / (capacity * 0.3) * 5))

            self.road_model.update_flow(road.get('id'), current_flow, congestion_level)
            updated_road = self.road_model.get_by_id(road.get('id'))
            updated_roads.append(updated_road)

        return {
            'code': 0,
            'msg': '交通模拟完成',
            'data': updated_roads
        }

from typing import Dict, Any
from app.model.jt_model import TransitModel, CityModel


class JtTransitBusiness:
    TRANSIT_COST = {
        TransitModel.TYPE_BUS: 3000,
        TransitModel.TYPE_SUBWAY: 10000,
        TransitModel.TYPE_TRAM: 5000,
        TransitModel.TYPE_BIKE: 1000
    }

    def __init__(self):
        self.transit_model = TransitModel()
        self.city_model = CityModel()

    def create_transit(self, city_id: int, transit_type: str = 'bus',
                       name: str = '', route_data: str = '{}',
                       capacity: int = 50, frequency: int = 10,
                       fare: float = 2.0) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        cost = self.TRANSIT_COST.get(transit_type, 3000)
        current_funds = city.get('funds', 0)

        if current_funds < cost:
            return {
                'code': 1,
                'msg': f'资金不足，建设该交通线路需要{cost}金币',
                'data': None
            }

        transit_id = self.transit_model.create(
            city_id=city_id,
            transit_type=transit_type,
            name=name,
            route_data=route_data,
            capacity=capacity,
            frequency=frequency,
            fare=fare
        )

        if transit_id > 0:
            self.city_model.update_city(city_id, {'funds': current_funds - cost})
            transit = self.transit_model.get_by_id(transit_id)
            return {
                'code': 0,
                'msg': '交通线路创建成功',
                'data': transit
            }

        return {
            'code': 1,
            'msg': '交通线路创建失败',
            'data': None
        }

    def get_transits(self, city_id: int) -> Dict[str, Any]:
        transits = self.transit_model.get_by_city_id(city_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': transits
        }

    def update_transit(self, transit_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        transit = self.transit_model.get_by_id(transit_id)
        if not transit:
            return {
                'code': 1,
                'msg': '交通线路不存在',
                'data': None
            }

        affected = self.transit_model.update(transit_id, data)
        if affected >= 0:
            updated_transit = self.transit_model.get_by_id(transit_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_transit
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_transit(self, transit_id: int) -> Dict[str, Any]:
        transit = self.transit_model.get_by_id(transit_id)
        if not transit:
            return {
                'code': 1,
                'msg': '交通线路不存在',
                'data': None
            }

        affected = self.transit_model.delete(transit_id)
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

    def simulate_ridership(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        transits = self.transit_model.get_by_city_id(city_id)
        population = city.get('population', 10000)
        updated_transits = []

        for transit in transits:
            if transit.get('status') != TransitModel.STATUS_ACTIVE:
                updated_transits.append(transit)
                continue

            frequency = transit.get('frequency', 10)
            capacity = transit.get('capacity', 50)
            transit_type = transit.get('transit_type', TransitModel.TYPE_BUS)

            type_factor = {
                TransitModel.TYPE_BUS: 0.15,
                TransitModel.TYPE_SUBWAY: 0.35,
                TransitModel.TYPE_TRAM: 0.10,
                TransitModel.TYPE_BIKE: 0.05
            }
            factor = type_factor.get(transit_type, 0.1)

            base_ridership = int(population * factor)
            frequency_factor = max(0.5, 60 / max(frequency, 1))
            ridership = int(base_ridership * frequency_factor)
            ridership = min(ridership, capacity * frequency)

            self.transit_model.update_ridership(transit.get('id'), ridership)
            updated_transit = self.transit_model.get_by_id(transit.get('id'))
            updated_transits.append(updated_transit)

        return {
            'code': 0,
            'msg': '客流量模拟完成',
            'data': updated_transits
        }

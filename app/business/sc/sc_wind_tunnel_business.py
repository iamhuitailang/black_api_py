from typing import Dict, Any, List, Optional
from app.model.sc import ScWindTunnelModel, ScCarModel, ScCarPartModel, ScPartModel


class ScWindTunnelBusiness:
    def __init__(self):
        self.wind_tunnel_model = ScWindTunnelModel()
        self.car_model = ScCarModel()
        self.car_part_model = ScCarPartModel()
        self.part_model = ScPartModel()

    def _validate_test_type(self, test_type: str) -> bool:
        valid_types = [
            ScWindTunnelModel.TEST_TYPE_DRAG,
            ScWindTunnelModel.TEST_TYPE_DOWNFORCE,
            ScWindTunnelModel.TEST_TYPE_BALANCE
        ]
        return test_type in valid_types

    def _calculate_drag_coefficient(self, car: Dict[str, Any]) -> float:
        weight = car.get('total_weight', 500)
        aerodynamics = car.get('total_aerodynamics', 0)

        base_drag = 0.5
        weight_factor = weight / 1000.0
        aero_factor = 1.0 - (aerodynamics / 200.0)
        aero_factor = max(0.3, min(aero_factor, 1.0))

        drag_coefficient = base_drag * weight_factor * aero_factor
        return round(drag_coefficient, 4)

    def _calculate_downforce(self, car: Dict[str, Any], car_parts: List[Dict[str, Any]]) -> Dict[str, float]:
        total_aero = car.get('total_aerodynamics', 0)
        body_aero = 0
        aero_kit_aero = 0

        for car_part in car_parts:
            part = self.part_model.get_by_id(car_part['part_id'])
            if part:
                part_type = part.get('type', '')
                part_aero = part.get('aerodynamics', 0)
                if part_type == ScPartModel.TYPE_BODY:
                    body_aero = part_aero
                elif part_type == ScPartModel.TYPE_AERO:
                    aero_kit_aero = part_aero

        front_downforce = (body_aero * 0.4 + aero_kit_aero * 0.3) * 2.5
        rear_downforce = (body_aero * 0.3 + aero_kit_aero * 0.7) * 3.0
        total_downforce = front_downforce + rear_downforce

        return {
            'front_downforce': round(front_downforce, 2),
            'rear_downforce': round(rear_downforce, 2),
            'total_downforce': round(total_downforce, 2)
        }

    def _calculate_balance_score(self, front_downforce: float, rear_downforce: float) -> float:
        if front_downforce + rear_downforce == 0:
            return 0.0

        front_ratio = front_downforce / (front_downforce + rear_downforce)
        optimal_ratio = 0.45
        balance_score = 100.0 - (abs(front_ratio - optimal_ratio) * 200.0)
        balance_score = max(0.0, min(balance_score, 100.0))

        return round(balance_score, 2)

    def _calculate_top_speed(self, car: Dict[str, Any], drag_coefficient: float) -> float:
        power = car.get('total_power', 200)
        weight = car.get('total_weight', 500)

        if drag_coefficient <= 0:
            drag_coefficient = 0.3

        power_factor = power / 200.0
        weight_factor = 1000.0 / weight
        drag_factor = 0.3 / drag_coefficient

        base_speed = 200.0
        top_speed = base_speed * power_factor * weight_factor * drag_factor
        top_speed = max(100.0, min(top_speed, 400.0))

        return round(top_speed, 2)

    def run_test(self, user_id: int, car_id: int, test_type: str) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        if not self._validate_test_type(test_type):
            return {
                'code': 1,
                'msg': '测试类型无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权测试该车辆',
                'data': None
            }

        car_parts = self.car_part_model.get_by_car_id(car_id)

        drag_coefficient = self._calculate_drag_coefficient(car)
        downforce_data = self._calculate_downforce(car, car_parts)
        balance_score = self._calculate_balance_score(
            downforce_data['front_downforce'],
            downforce_data['rear_downforce']
        )
        top_speed_estimate = self._calculate_top_speed(car, drag_coefficient)

        test_id = self.wind_tunnel_model.create(
            user_id=user_id,
            car_id=car_id,
            test_type=test_type,
            drag_coefficient=drag_coefficient,
            downforce=downforce_data['total_downforce'],
            balance_score=balance_score,
            front_downforce=downforce_data['front_downforce'],
            rear_downforce=downforce_data['rear_downforce'],
            top_speed_estimate=top_speed_estimate
        )

        if test_id > 0:
            test_detail = self.wind_tunnel_model.get_by_id(test_id)
            return {
                'code': 0,
                'msg': '风洞测试完成',
                'data': {
                    'test_id': test_id,
                    'test_type': test_type,
                    'test_type_text': self.wind_tunnel_model.get_test_type_text(test_type),
                    'drag_coefficient': drag_coefficient,
                    'downforce': downforce_data['total_downforce'],
                    'front_downforce': downforce_data['front_downforce'],
                    'rear_downforce': downforce_data['rear_downforce'],
                    'balance_score': balance_score,
                    'top_speed_estimate': top_speed_estimate,
                    'test_date': test_detail.get('test_date') if test_detail else None
                }
            }

        return {
            'code': 1,
            'msg': '风洞测试失败',
            'data': None
        }

    def get_user_tests(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0
                }
            }

        result = self.wind_tunnel_model.get_all(page, page_size, user_id=user_id)
        items = result.get('items', [])

        for item in items:
            item['test_type_text'] = self.wind_tunnel_model.get_test_type_text(item.get('test_type', ''))
            car = self.car_model.get_by_id(item.get('car_id', 0))
            if car:
                item['car_name'] = car.get('name', '')

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

    def get_car_tests(self, user_id: int, car_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': []
            }

        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': []
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': []
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该车辆的测试记录',
                'data': []
            }

        tests = self.wind_tunnel_model.get_by_car_id(car_id)
        for test in tests:
            test['test_type_text'] = self.wind_tunnel_model.get_test_type_text(test.get('test_type', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': tests
        }

    def get_latest_test(self, user_id: int, car_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该车辆的测试记录',
                'data': None
            }

        latest_test = self.wind_tunnel_model.get_latest_by_car(car_id)
        if latest_test:
            latest_test['test_type_text'] = self.wind_tunnel_model.get_test_type_text(latest_test.get('test_type', ''))
            return {
                'code': 0,
                'msg': 'success',
                'data': latest_test
            }

        return {
            'code': 0,
            'msg': '暂无测试记录',
            'data': None
        }

    def get_test_detail(self, test_id: int, user_id: int) -> Dict[str, Any]:
        if not test_id or test_id <= 0:
            return {
                'code': 1,
                'msg': '测试记录ID无效',
                'data': None
            }

        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        test = self.wind_tunnel_model.get_by_id(test_id)
        if not test:
            return {
                'code': 1,
                'msg': '测试记录不存在',
                'data': None
            }

        if test.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该测试记录',
                'data': None
            }

        test['test_type_text'] = self.wind_tunnel_model.get_test_type_text(test.get('test_type', ''))
        car = self.car_model.get_by_id(test.get('car_id', 0))
        if car:
            test['car_name'] = car.get('name', '')
            test['car_stats'] = {
                'total_weight': car.get('total_weight', 0),
                'total_power': car.get('total_power', 0),
                'total_grip': car.get('total_grip', 0),
                'total_aerodynamics': car.get('total_aerodynamics', 0)
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': test
        }

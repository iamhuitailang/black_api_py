from typing import Dict, Any
from app.model.jt_model import SignalModel, CityModel


class JtSignalBusiness:
    SIGNAL_COST = {
        SignalModel.TYPE_FIXED: 300,
        SignalModel.TYPE_ADAPTIVE: 800,
        SignalModel.TYPE_PEDESTRIAN: 500
    }

    def __init__(self):
        self.signal_model = SignalModel()
        self.city_model = CityModel()

    def create_signal(self, city_id: int, road_id: int = None,
                      position_x: float = 0, position_y: float = 0,
                      signal_type: str = 'fixed',
                      red_duration: int = 30, green_duration: int = 30,
                      yellow_duration: int = 5) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        cost = self.SIGNAL_COST.get(signal_type, 300)
        current_funds = city.get('funds', 0)

        if current_funds < cost:
            return {
                'code': 1,
                'msg': f'资金不足，安装该信号灯需要{cost}金币',
                'data': None
            }

        signal_id = self.signal_model.create(
            city_id=city_id,
            road_id=road_id,
            position_x=position_x,
            position_y=position_y,
            signal_type=signal_type,
            red_duration=red_duration,
            green_duration=green_duration,
            yellow_duration=yellow_duration
        )

        if signal_id > 0:
            self.city_model.update_city(city_id, {'funds': current_funds - cost})
            signal = self.signal_model.get_by_id(signal_id)
            return {
                'code': 0,
                'msg': '信号灯创建成功',
                'data': signal
            }

        return {
            'code': 1,
            'msg': '信号灯创建失败',
            'data': None
        }

    def get_signals(self, city_id: int) -> Dict[str, Any]:
        signals = self.signal_model.get_by_city_id(city_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': signals
        }

    def update_signal(self, signal_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        signal = self.signal_model.get_by_id(signal_id)
        if not signal:
            return {
                'code': 1,
                'msg': '信号灯不存在',
                'data': None
            }

        affected = self.signal_model.update(signal_id, data)
        if affected >= 0:
            updated_signal = self.signal_model.get_by_id(signal_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_signal
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_signal(self, signal_id: int) -> Dict[str, Any]:
        signal = self.signal_model.get_by_id(signal_id)
        if not signal:
            return {
                'code': 1,
                'msg': '信号灯不存在',
                'data': None
            }

        affected = self.signal_model.delete(signal_id)
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

    def toggle_signal(self, signal_id: int) -> Dict[str, Any]:
        signal = self.signal_model.get_by_id(signal_id)
        if not signal:
            return {
                'code': 1,
                'msg': '信号灯不存在',
                'data': None
            }

        current_active = signal.get('is_active', 1)
        new_active = 0 if current_active == 1 else 1

        self.signal_model.update(signal_id, {'is_active': new_active})
        updated_signal = self.signal_model.get_by_id(signal_id)
        return {
            'code': 0,
            'msg': '信号灯状态切换成功',
            'data': updated_signal
        }

    def simulate_signals(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        signals = self.signal_model.get_by_city_id(city_id)
        updated_signals = []
        state_cycle = [SignalModel.STATE_GREEN, SignalModel.STATE_YELLOW, SignalModel.STATE_RED]

        for signal in signals:
            if not signal.get('is_active', 1):
                updated_signals.append(signal)
                continue

            current_state = signal.get('current_state', SignalModel.STATE_RED)
            signal_type = signal.get('signal_type', SignalModel.TYPE_FIXED)

            if signal_type == SignalModel.TYPE_ADAPTIVE:
                road_id = signal.get('road_id')
                if road_id:
                    from app.model.jt_model import RoadModel
                    road_model = RoadModel()
                    road = road_model.get_by_id(road_id)
                    if road and road.get('congestion_level', 0) > 5:
                        current_state = SignalModel.STATE_GREEN
                    elif road and road.get('congestion_level', 0) < 3:
                        current_state = SignalModel.STATE_RED
                    else:
                        current_idx = state_cycle.index(current_state) if current_state in state_cycle else 0
                        current_state = state_cycle[(current_idx + 1) % len(state_cycle)]
                else:
                    current_idx = state_cycle.index(current_state) if current_state in state_cycle else 0
                    current_state = state_cycle[(current_idx + 1) % len(state_cycle)]
            else:
                current_idx = state_cycle.index(current_state) if current_state in state_cycle else 0
                current_state = state_cycle[(current_idx + 1) % len(state_cycle)]

            self.signal_model.update_state(signal.get('id'), current_state)
            updated_signal = self.signal_model.get_by_id(signal.get('id'))
            updated_signals.append(updated_signal)

        return {
            'code': 0,
            'msg': '信号灯模拟完成',
            'data': updated_signals
        }

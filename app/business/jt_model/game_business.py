from typing import Dict, Any
from app.model.jt_model import GameStateModel, SatisfactionModel, CityModel, RoadModel, SignalModel, TransitModel, AccidentModel, JtUserModel
import random


class JtGameBusiness:
    def __init__(self):
        self.game_state_model = GameStateModel()
        self.satisfaction_model = SatisfactionModel()
        self.city_model = CityModel()
        self.road_model = RoadModel()
        self.signal_model = SignalModel()
        self.transit_model = TransitModel()
        self.accident_model = AccidentModel()
        self.user_model = JtUserModel()

    def save_game(self, user_id: int, game_data: str = '{}',
                  current_music: str = 'default', game_speed: int = 1,
                  day_count: int = 1, time_of_day: int = 480,
                  is_peak_hour: int = 0) -> Dict[str, Any]:
        data = {
            'game_data': game_data,
            'current_music': current_music,
            'game_speed': game_speed,
            'day_count': day_count,
            'time_of_day': time_of_day,
            'is_peak_hour': is_peak_hour
        }

        affected = self.game_state_model.save_state(user_id, data)
        if affected > 0:
            state = self.game_state_model.load_state(user_id)
            return {
                'code': 0,
                'msg': '游戏保存成功',
                'data': state
            }

        return {
            'code': 1,
            'msg': '游戏保存失败',
            'data': None
        }

    def load_game(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.load_state(user_id)
        if state:
            return {
                'code': 0,
                'msg': 'success',
                'data': state
            }

        return {
            'code': 1,
            'msg': '没有找到存档',
            'data': None
        }

    def get_satisfaction(self, city_id: int) -> Dict[str, Any]:
        satisfaction = self.satisfaction_model.get_latest_by_city_id(city_id)
        if satisfaction:
            return {
                'code': 0,
                'msg': 'success',
                'data': satisfaction
            }

        return {
            'code': 1,
            'msg': '暂无满意度数据',
            'data': None
        }

    def get_satisfaction_history(self, city_id: int, period: str = 'daily',
                                 limit: int = 30) -> Dict[str, Any]:
        history = self.satisfaction_model.get_history(city_id, period, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': history
        }

    def calculate_satisfaction(self, city_id: int) -> Dict[str, Any]:
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

        traffic_score = 50
        if roads:
            avg_congestion = sum(r.get('congestion_level', 0) for r in roads) / len(roads)
            active_roads = sum(1 for r in roads if r.get('status') == RoadModel.STATUS_ACTIVE)
            traffic_score = min(100, max(0, 80 - int(avg_congestion * 3) + active_roads * 2))

        transit_score = 50
        if transits:
            total_ridership = sum(t.get('ridership', 0) for t in transits)
            active_transits = sum(1 for t in transits if t.get('status') == TransitModel.STATUS_ACTIVE)
            transit_score = min(100, 40 + active_transits * 8 + min(total_ridership // 100, 20))

        safety_score = 70
        if accidents:
            avg_severity = sum(a.get('severity', 1) for a in accidents) / len(accidents)
            safety_score = max(0, 80 - len(accidents) * 5 - int(avg_severity * 10))

        environment_score = 60
        if roads:
            high_speed_roads = sum(1 for r in roads if r.get('speed_limit', 60) > 80)
            environment_score = max(20, 70 - high_speed_roads * 3)
        if transits:
            green_transits = sum(1 for t in transits if t.get('transit_type') in [TransitModel.TYPE_SUBWAY, TransitModel.TYPE_BIKE])
            environment_score = min(100, environment_score + green_transits * 5)

        signal_score = 50
        if signals:
            active_signals = sum(1 for s in signals if s.get('is_active', 1))
            adaptive_signals = sum(1 for s in signals if s.get('signal_type') == SignalModel.TYPE_ADAPTIVE)
            signal_score = min(100, 40 + active_signals * 5 + adaptive_signals * 10)

        overall_score = int(
            traffic_score * 0.25 +
            signal_score * 0.1 +
            transit_score * 0.25 +
            safety_score * 0.25 +
            environment_score * 0.15
        )

        satisfaction_id = self.satisfaction_model.create(
            city_id=city_id,
            overall_score=overall_score,
            traffic_score=traffic_score,
            transit_score=transit_score,
            safety_score=safety_score,
            environment_score=environment_score
        )

        self.city_model.update_city(city_id, {
            'satisfaction': overall_score,
            'traffic_efficiency': traffic_score
        })

        if satisfaction_id > 0:
            satisfaction = self.satisfaction_model.get_by_id(satisfaction_id)
            return {
                'code': 0,
                'msg': '满意度计算完成',
                'data': {
                    'satisfaction': satisfaction,
                    'scores': {
                        'traffic_score': traffic_score,
                        'transit_score': transit_score,
                        'safety_score': safety_score,
                        'environment_score': environment_score,
                        'overall_score': overall_score
                    }
                }
            }

        return {
            'code': 1,
            'msg': '满意度计算失败',
            'data': None
        }

    def advance_time(self, user_id: int, minutes: int = 10) -> Dict[str, Any]:
        state = self.game_state_model.load_state(user_id)
        if not state:
            return {
                'code': 1,
                'msg': '没有找到游戏存档',
                'data': None
            }

        current_time = state.get('time_of_day', 480)
        current_day = state.get('day_count', 1)
        game_speed = state.get('game_speed', 1)

        new_time = current_time + minutes * game_speed

        while new_time >= 1440:
            new_time -= 1440
            current_day += 1

        is_peak_hour = 0
        if (420 <= new_time <= 540) or (1020 <= new_time <= 1140):
            is_peak_hour = 1

        update_data = {
            'time_of_day': new_time,
            'day_count': current_day,
            'is_peak_hour': is_peak_hour
        }
        self.game_state_model.save_state(user_id, update_data)

        updated_state = self.game_state_model.load_state(user_id)
        return {
            'code': 0,
            'msg': '时间推进成功',
            'data': updated_state
        }

    def trigger_event(self, city_id: int) -> Dict[str, Any]:
        city = self.city_model.get_by_id(city_id)
        if not city:
            return {
                'code': 1,
                'msg': '城市不存在',
                'data': None
            }

        events = ['accident', 'road_closure', 'signal_malfunction', 'transit_delay', 'funding_bonus']
        event_type = random.choice(events)

        if event_type == 'accident':
            from app.business.jt_model.accident_business import AccidentBusiness
            accident_business = AccidentBusiness()
            result = accident_business.generate_random_accident(city_id)
            return {
                'code': 0,
                'msg': '随机事件：发生交通事故',
                'data': {
                    'event_type': event_type,
                    'event_data': result.get('data')
                }
            }

        elif event_type == 'road_closure':
            roads = self.road_model.get_by_city_id(city_id)
            if roads:
                road = random.choice(roads)
                self.road_model.update_status(road.get('id'), RoadModel.STATUS_CONSTRUCTION)
                return {
                    'code': 0,
                    'msg': '随机事件：道路封闭施工',
                    'data': {
                        'event_type': event_type,
                        'road_id': road.get('id'),
                        'road_name': road.get('name', '')
                    }
                }

        elif event_type == 'signal_malfunction':
            signals = self.signal_model.get_by_city_id(city_id)
            if signals:
                signal = random.choice(signals)
                self.signal_model.update(signal.get('id'), {'is_active': 0})
                return {
                    'code': 0,
                    'msg': '随机事件：信号灯故障',
                    'data': {
                        'event_type': event_type,
                        'signal_id': signal.get('id')
                    }
                }

        elif event_type == 'transit_delay':
            transits = self.transit_model.get_by_city_id(city_id)
            if transits:
                transit = random.choice(transits)
                self.transit_model.update(transit.get('id'), {'frequency': transit.get('frequency', 10) * 2})
                return {
                    'code': 0,
                    'msg': '随机事件：公共交通延误',
                    'data': {
                        'event_type': event_type,
                        'transit_id': transit.get('id')
                    }
                }

        elif event_type == 'funding_bonus':
            bonus = random.randint(500, 3000)
            current_funds = city.get('funds', 0)
            self.city_model.update_city(city_id, {'funds': current_funds + bonus})
            return {
                'code': 0,
                'msg': f'随机事件：获得{bonus}金币补贴',
                'data': {
                    'event_type': event_type,
                    'bonus': bonus
                }
            }

        return {
            'code': 0,
            'msg': '随机事件未触发',
            'data': {
                'event_type': event_type
            }
        }

from typing import Dict, Any, Optional, List
from datetime import datetime
from app.model.qx import RideModel, UserModel


class QxRideBusiness:
    def __init__(self):
        self.ride_model = RideModel()
        self.user_model = UserModel()

    def create_ride(self, user_id: int, activity_id: int = 0, date: str = None,
                    distance: float = 0.0, duration: int = 0, avg_speed: float = 0.0,
                    max_speed: float = 0.0, elevation: int = 0, route_name: str = '',
                    images: List[str] = None, notes: str = '') -> Dict[str, Any]:
        if distance <= 0:
            return {
                'code': 1,
                'msg': '骑行距离必须大于0',
                'data': None
            }

        if duration <= 0:
            return {
                'code': 1,
                'msg': '骑行时长必须大于0',
                'data': None
            }

        if avg_speed <= 0 and distance > 0 and duration > 0:
            avg_speed = (distance * 60) / duration

        ride_id = self.ride_model.create(
            user_id=user_id,
            activity_id=activity_id,
            date=date or datetime.now().isoformat(),
            distance=distance,
            duration=duration,
            avg_speed=round(avg_speed, 2),
            max_speed=round(max_speed, 2) if max_speed else 0,
            elevation=elevation,
            route_name=route_name,
            images=images,
            notes=notes
        )

        if ride_id > 0:
            self.user_model.update_stats(user_id, distance, duration)
            ride = self.ride_model.get_by_id(ride_id)
            return {
                'code': 0,
                'msg': '记录创建成功',
                'data': self.ride_model.to_dict(ride)
            }

        return {
            'code': 1,
            'msg': '记录创建失败',
            'data': None
        }

    def get_ride_by_id(self, ride_id: int) -> Dict[str, Any]:
        ride = self.ride_model.get_by_id(ride_id)
        if not ride:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.ride_model.to_dict(ride)
        }

    def get_my_rides(self, user_id: int, page: int = 1, page_size: int = 10,
                     start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.ride_model.get_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date
        )

        items = [self.ride_model.to_dict(item) for item in result.get('items', [])]

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

    def get_rides_by_activity(self, activity_id: int) -> Dict[str, Any]:
        rides = self.ride_model.get_by_activity(activity_id)
        items = []
        for ride in rides:
            ride_dict = self.ride_model.to_dict(ride)
            user = self.user_model.get_by_id(ride.get('user_id', 0))
            if user:
                ride_dict['user'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level')
                }
            items.append(ride_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_ride(self, ride_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ride = self.ride_model.get_by_id(ride_id)
        if not ride:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if ride.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此记录',
                'data': None
            }

        affected = self.ride_model.update(ride_id, data)
        if affected >= 0:
            updated_ride = self.ride_model.get_by_id(ride_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ride_model.to_dict(updated_ride)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_ride(self, ride_id: int, user_id: int) -> Dict[str, Any]:
        ride = self.ride_model.get_by_id(ride_id)
        if not ride:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if ride.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此记录',
                'data': None
            }

        affected = self.ride_model.delete(ride_id)
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

    def get_statistics(self, user_id: int, month: str = None, year: str = None) -> Dict[str, Any]:
        stats = self.ride_model.get_statistics(user_id, month, year)
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_monthly_statistics(self, user_id: int, year: str) -> Dict[str, Any]:
        stats = self.ride_model.get_monthly_statistics(user_id, year)
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def estimate_power(self, speed: float, elevation: float, weight: float = 70.0) -> Dict[str, Any]:
        gravity = 9.81
        drag_coefficient = 0.5
        frontal_area = 0.5
        air_density = 1.225

        speed_mps = speed / 3.6
        elevation_gain_m = elevation

        power_rolling = weight * gravity * 0.005 * speed_mps
        power_air = 0.5 * drag_coefficient * frontal_area * air_density * (speed_mps ** 3)

        power_climbing = 0
        if elevation_gain_m > 0 and speed > 0:
            time_hours = (elevation_gain_m / 1000) / speed
            time_seconds = time_hours * 3600
            power_climbing = (weight * gravity * elevation_gain_m) / max(time_seconds, 1)

        total_power = power_rolling + power_air + power_climbing

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_power': round(total_power, 1),
                'rolling_power': round(power_rolling, 1),
                'air_power': round(power_air, 1),
                'climbing_power': round(power_climbing, 1),
                'speed_kmh': speed,
                'weight_kg': weight,
                'elevation_m': elevation
            }
        }

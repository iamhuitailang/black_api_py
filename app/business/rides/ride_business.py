from typing import Dict, Any, List, Optional
import hashlib
from app.model.rides import RideModel


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def _verify_password(password: str, password_hash: str) -> bool:
    return _hash_password(password) == password_hash


def _format_ride(ride: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': ride.get('id'),
        'from_location': ride.get('from_location'),
        'to_location': ride.get('to_location'),
        'departure_time': ride.get('departure_time'),
        'weekdays': bool(ride.get('weekdays', 0)),
        'seats': ride.get('seats'),
        'available_seats': ride.get('available_seats'),
        'contact': ride.get('contact'),
        'status': ride.get('status'),
        'remark': ride.get('remark', ''),
        'created_at': ride.get('created_at')
    }


class RideBusiness:
    def __init__(self):
        self.model = RideModel()

    def create_ride(self, from_location: str, to_location: str, departure_time: str,
                    weekdays: bool, seats: int, contact: str, password: str,
                    available_seats: int = None, remark: str = '') -> Dict[str, Any]:
        if not from_location or not from_location.strip():
            return {'code': 1, 'message': '出发地不能为空', 'data': None}
        if not to_location or not to_location.strip():
            return {'code': 1, 'message': '目的地不能为空', 'data': None}
        if not departure_time or not departure_time.strip():
            return {'code': 1, 'message': '出发时间不能为空', 'data': None}
        if seats is None or seats < 1:
            return {'code': 1, 'message': '座位数必须大于0', 'data': None}
        if not contact or not contact.strip():
            return {'code': 1, 'message': '联系方式不能为空', 'data': None}
        if not password or not password.strip():
            return {'code': 1, 'message': '请设置密码', 'data': None}

        if available_seats is None:
            available_seats = seats
        if available_seats < 0 or available_seats > seats:
            available_seats = seats

        try:
            password_hash = _hash_password(password.strip())
            new_id = self.model.create(
                from_location=from_location.strip(),
                to_location=to_location.strip(),
                departure_time=departure_time.strip(),
                weekdays=weekdays,
                seats=seats,
                available_seats=available_seats,
                contact=contact.strip(),
                password_hash=password_hash,
                remark=remark.strip() if remark else ''
            )
            return self.get_ride_by_id(new_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_ride_by_id(self, record_id: int) -> Dict[str, Any]:
        ride = self.model.get_by_id(record_id)
        if ride:
            return {'code': 0, 'message': 'success', 'data': _format_ride(ride)}
        return {'code': 1, 'message': '拼车信息不存在', 'data': None}

    def search_rides(self, from_location: str = None, to_location: str = None,
                     status: str = 'active', auto_clean: bool = True) -> Dict[str, Any]:
        try:
            if auto_clean:
                self.model.delete_expired(24)

            rides = self.model.search(
                from_location=from_location.strip() if from_location else None,
                to_location=to_location.strip() if to_location else None,
                status=status
            )
            result = [_format_ride(r) for r in rides]
            return {'code': 0, 'message': 'success', 'data': {'items': result, 'count': len(result)}}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def mark_full(self, record_id: int, password: str) -> Dict[str, Any]:
        ride = self.model.get_by_id(record_id)
        if not ride:
            return {'code': 1, 'message': '拼车信息不存在', 'data': None}
        if not _verify_password(password or '', ride.get('password_hash', '')):
            return {'code': 2, 'message': '密码错误', 'data': None}

        affected = self.model.update_status(record_id, 'full')
        if affected > 0:
            return self.get_ride_by_id(record_id)
        return {'code': 1, 'message': '操作失败', 'data': None}

    def mark_active(self, record_id: int, password: str) -> Dict[str, Any]:
        ride = self.model.get_by_id(record_id)
        if not ride:
            return {'code': 1, 'message': '拼车信息不存在', 'data': None}
        if not _verify_password(password or '', ride.get('password_hash', '')):
            return {'code': 2, 'message': '密码错误', 'data': None}

        affected = self.model.update_status(record_id, 'active')
        if affected > 0:
            return self.get_ride_by_id(record_id)
        return {'code': 1, 'message': '操作失败', 'data': None}

    def delete_ride(self, record_id: int, password: str) -> Dict[str, Any]:
        ride = self.model.get_by_id(record_id)
        if not ride:
            return {'code': 1, 'message': '拼车信息不存在', 'data': None}
        if not _verify_password(password or '', ride.get('password_hash', '')):
            return {'code': 2, 'message': '密码错误', 'data': None}

        affected = self.model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def clean_expired(self, expiry_hours: int = 24) -> Dict[str, Any]:
        try:
            count = self.model.delete_expired(expiry_hours)
            return {'code': 0, 'message': 'success', 'data': {'cleaned_count': count}}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

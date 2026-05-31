from typing import Dict, Any
from app.model.jiudian_077_model import BookingModel, RoomModel, UserModel
from datetime import datetime, timedelta


class JiudianStatisticsBusiness:
    def __init__(self):
        self.booking_model = BookingModel()
        self.room_model = RoomModel()
        self.user_model = UserModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        stats = self.booking_model.get_statistics(thirty_days_ago, today)

        total_rooms = self.room_model.count()
        available_rooms = self.room_model.query.count({'status': self.room_model.STATUS_AVAILABLE})
        occupied_rooms = self.room_model.query.count({'status': self.room_model.STATUS_OCCUPIED})

        total_users = self.user_model.query.count({'role': 'user'})
        new_users_today = self._get_new_users_today(today)

        today_bookings = self._get_today_bookings(today)
        today_check_ins = self._get_today_check_ins(today)
        today_check_outs = self._get_today_check_outs(today)

        data = {
            'total_bookings': stats.get('total_bookings', 0),
            'confirmed_bookings': stats.get('confirmed_bookings', 0),
            'total_revenue': stats.get('total_revenue', 0),
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': occupied_rooms,
            'occupancy_rate': round(occupied_rooms / total_rooms * 100, 2) if total_rooms > 0 else 0,
            'total_users': total_users,
            'new_users_today': new_users_today,
            'today_bookings': today_bookings,
            'today_check_ins': today_check_ins,
            'today_check_outs': today_check_outs,
            'daily_stats': stats.get('daily_stats', []),
            'room_type_stats': stats.get('room_type_stats', [])
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': data
        }

    def _get_new_users_today(self, today: str) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.user_model.TABLE_NAME} WHERE DATE(created_at) = ?"
        result = self.user_model.db.fetch_one(sql, (today,))
        return result['cnt'] if result else 0

    def _get_today_bookings(self, today: str) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.booking_model.TABLE_NAME} WHERE DATE(created_at) = ?"
        result = self.booking_model.db.fetch_one(sql, (today,))
        return result['cnt'] if result else 0

    def _get_today_check_ins(self, today: str) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.booking_model.TABLE_NAME} WHERE DATE(check_in_time) = ?"
        result = self.booking_model.db.fetch_one(sql, (today,))
        return result['cnt'] if result else 0

    def _get_today_check_outs(self, today: str) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.booking_model.TABLE_NAME} WHERE DATE(check_out_time) = ?"
        result = self.booking_model.db.fetch_one(sql, (today,))
        return result['cnt'] if result else 0

    def get_booking_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        stats = self.booking_model.get_statistics(start_date, end_date)

        room_type_stats = []
        for item in stats.get('room_type_stats', []):
            room_type_stats.append({
                'room_type': item.get('room_type'),
                'room_type_text': self.room_model.get_type_text(item.get('room_type')),
                'count': item.get('count')
            })

        data = {
            'total_bookings': stats.get('total_bookings', 0),
            'confirmed_bookings': stats.get('confirmed_bookings', 0),
            'total_revenue': stats.get('total_revenue', 0),
            'daily_stats': stats.get('daily_stats', []),
            'room_type_stats': room_type_stats,
            'start_date': start_date,
            'end_date': end_date
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': data
        }

    def get_room_statistics(self) -> Dict[str, Any]:
        total_rooms = self.room_model.count()
        available_rooms = self.room_model.query.count({'status': self.room_model.STATUS_AVAILABLE})
        occupied_rooms = self.room_model.query.count({'status': self.room_model.STATUS_OCCUPIED})
        maintenance_rooms = self.room_model.query.count({'status': self.room_model.STATUS_MAINTENANCE})
        cleaning_rooms = self.room_model.query.count({'status': self.room_model.STATUS_CLEANING})

        sql = f"""
            SELECT type, COUNT(*) as count
            FROM {self.room_model.TABLE_NAME}
            GROUP BY type
        """
        type_stats = self.room_model.db.fetch_all(sql)

        type_stats_formatted = []
        for item in type_stats:
            type_stats_formatted.append({
                'type': item.get('type'),
                'type_text': self.room_model.get_type_text(item.get('type')),
                'count': item.get('count')
            })

        data = {
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': occupied_rooms,
            'maintenance_rooms': maintenance_rooms,
            'cleaning_rooms': cleaning_rooms,
            'occupancy_rate': round(occupied_rooms / total_rooms * 100, 2) if total_rooms > 0 else 0,
            'type_stats': type_stats_formatted
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': data
        }

    def get_user_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count({'role': 'user'})
        total_admins = self.user_model.query.count({'role': 'admin'})
        active_users = self.user_model.query.count({'role': 'user', 'status': 0})
        disabled_users = self.user_model.query.count({'role': 'user', 'status': 1})

        today = datetime.now().strftime('%Y-%m-%d')
        new_users_today = self._get_new_users_today(today)

        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        sql = f"""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM {self.user_model.TABLE_NAME}
            WHERE role = 'user' AND created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        daily_new_users = self.user_model.db.fetch_all(sql, (thirty_days_ago,))

        data = {
            'total_users': total_users,
            'total_admins': total_admins,
            'active_users': active_users,
            'disabled_users': disabled_users,
            'new_users_today': new_users_today,
            'daily_new_users': daily_new_users
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': data
        }

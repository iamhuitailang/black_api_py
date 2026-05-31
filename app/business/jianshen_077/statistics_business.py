from typing import Dict, Any
from app.model.jianshen_077_model import CourseModel, BookingModel, CheckinModel, JianshenUserModel
from app.common.sqlite.db import get_db


class StatisticsBusiness:
    def __init__(self):
        self.course_model = CourseModel()
        self.booking_model = BookingModel()
        self.checkin_model = CheckinModel()
        self.user_model = JianshenUserModel()

    def get_dashboard(self) -> Dict[str, Any]:
        db = get_db()

        total_users = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_user WHERE role = 0")
        total_users_count = total_users['total'] if total_users else 0

        total_courses = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_course")
        total_courses_count = total_courses['total'] if total_courses else 0

        active_courses = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_course WHERE status = 1")
        active_courses_count = active_courses['total'] if active_courses else 0

        total_bookings = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_booking")
        total_bookings_count = total_bookings['total'] if total_bookings else 0

        confirmed_bookings = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_booking WHERE status = 1")
        confirmed_bookings_count = confirmed_bookings['total'] if confirmed_bookings else 0

        total_checkins = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_checkin")
        total_checkins_count = total_checkins['total'] if total_checkins else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users_count,
                'total_courses': total_courses_count,
                'active_courses': active_courses_count,
                'total_bookings': total_bookings_count,
                'confirmed_bookings': confirmed_bookings_count,
                'total_checkins': total_checkins_count
            }
        }

    def get_course_statistics(self) -> Dict[str, Any]:
        db = get_db()

        category_stats = db.fetch_all(
            "SELECT category, COUNT(*) as count FROM tb_jianshen_077_model_course GROUP BY category"
        )

        status_stats = db.fetch_all(
            "SELECT status, COUNT(*) as count FROM tb_jianshen_077_model_course GROUP BY status"
        )

        booking_ranking = db.fetch_all("""
            SELECT c.id, c.title, c.coach, c.current_booking, c.max_capacity,
                   c.category
            FROM tb_jianshen_077_model_course c
            ORDER BY c.current_booking DESC
            LIMIT 10
        """)

        for item in booking_ranking:
            item['category_name'] = self.course_model.get_category_name(item.get('category', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'category_stats': category_stats,
                'status_stats': status_stats,
                'booking_ranking': booking_ranking
            }
        }

    def get_member_statistics(self) -> Dict[str, Any]:
        db = get_db()

        total_users = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_user WHERE role = 0")
        total_users_count = total_users['total'] if total_users else 0

        active_users = db.fetch_one("SELECT COUNT(*) as total FROM tb_jianshen_077_model_user WHERE role = 0 AND status = 0")
        active_users_count = active_users['total'] if active_users else 0

        booking_ranking = db.fetch_all("""
            SELECT u.id, u.username, u.nickname, COUNT(b.id) as booking_count
            FROM tb_jianshen_077_model_user u
            LEFT JOIN tb_jianshen_077_model_booking b ON u.id = b.user_id
            WHERE u.role = 0
            GROUP BY u.id
            ORDER BY booking_count DESC
            LIMIT 10
        """)

        checkin_ranking = db.fetch_all("""
            SELECT u.id, u.username, u.nickname, COUNT(ck.id) as checkin_count
            FROM tb_jianshen_077_model_user u
            LEFT JOIN tb_jianshen_077_model_checkin ck ON u.id = ck.user_id
            WHERE u.role = 0
            GROUP BY u.id
            ORDER BY checkin_count DESC
            LIMIT 10
        """)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users_count,
                'active_users': active_users_count,
                'booking_ranking': booking_ranking,
                'checkin_ranking': checkin_ranking
            }
        }

from typing import Dict, Any
from app.model.jianshen_077_model import CheckinModel, BookingModel, CourseModel, NotificationModel


class CheckinBusiness:
    def __init__(self):
        self.checkin_model = CheckinModel()
        self.booking_model = BookingModel()
        self.course_model = CourseModel()
        self.notification_model = NotificationModel()

    def checkin(self, user_id: int, booking_id: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预约记录不存在',
                'data': None
            }

        if booking.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此预约',
                'data': None
            }

        if booking.get('status') not in (BookingModel.STATUS_CONFIRMED, BookingModel.STATUS_PENDING):
            return {
                'code': 1,
                'msg': '当前预约状态无法签到',
                'data': None
            }

        existing = self.checkin_model.get_by_booking(booking_id)
        if existing:
            return {
                'code': 1,
                'msg': '已签到，请勿重复签到',
                'data': None
            }

        course_id = booking.get('course_id')
        checkin_id = self.checkin_model.create(user_id, booking_id, course_id)
        if checkin_id > 0:
            self.booking_model.update_status(booking_id, BookingModel.STATUS_COMPLETED)

            course = self.course_model.get_by_id(course_id)
            self.notification_model.create(
                user_id=user_id,
                title='签到成功',
                content=f'您已成功签到课程「{course.get("title", "")}」',
                ntype=NotificationModel.TYPE_CHECKIN,
                related_id=course_id
            )

            checkin = self.checkin_model.get_by_id(checkin_id)
            return {
                'code': 0,
                'msg': '签到成功',
                'data': self.checkin_model.to_dict(checkin)
            }

        return {
            'code': 1,
            'msg': '签到失败',
            'data': None
        }

    def admin_checkin(self, user_id: int, course_id: int) -> Dict[str, Any]:
        existing = self.checkin_model.get_by_user_and_course(user_id, course_id)
        if existing:
            return {
                'code': 1,
                'msg': '该用户已签到此课程',
                'data': None
            }

        sql = "SELECT id FROM tb_jianshen_077_model_booking WHERE user_id = ? AND course_id = ? AND status IN (?, ?)"
        from app.common.sqlite.db import get_db
        db = get_db()
        booking = db.fetch_one(sql, (user_id, course_id, BookingModel.STATUS_CONFIRMED, BookingModel.STATUS_PENDING))

        if not booking:
            return {
                'code': 1,
                'msg': '该用户未预约此课程',
                'data': None
            }

        booking_id = booking.get('id')
        checkin_id = self.checkin_model.create(user_id, booking_id, course_id)
        if checkin_id > 0:
            self.booking_model.update_status(booking_id, BookingModel.STATUS_COMPLETED)

            course = self.course_model.get_by_id(course_id)
            self.notification_model.create(
                user_id=user_id,
                title='签到成功',
                content=f'管理员已为您签到课程「{course.get("title", "")}」',
                ntype=NotificationModel.TYPE_CHECKIN,
                related_id=course_id
            )

            checkin = self.checkin_model.get_by_id(checkin_id)
            return {
                'code': 0,
                'msg': '签到成功',
                'data': self.checkin_model.to_dict(checkin)
            }

        return {
            'code': 1,
            'msg': '签到失败',
            'data': None
        }

    def update_checkin_status(self, checkin_id: int, status: int) -> Dict[str, Any]:
        checkin = self.checkin_model.get_by_id(checkin_id)
        if not checkin:
            return {
                'code': 1,
                'msg': '签到记录不存在',
                'data': None
            }

        affected = self.checkin_model.update_status(checkin_id, status)
        if affected > 0:
            updated = self.checkin_model.get_by_id(checkin_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.checkin_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def get_my_checkins(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.checkin_model.get_by_user(user_id, page, page_size)
        items = []
        for item in result.get('items', []):
            checkin_dict = self.checkin_model.to_dict(item)
            course = self.course_model.get_by_id(item.get('course_id'))
            if course:
                checkin_dict['course_title'] = course.get('title', '')
                checkin_dict['course_coach'] = course.get('coach', '')
            items.append(checkin_dict)

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

    def get_all_checkins(self, page: int = 1, page_size: int = 10,
                         status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.checkin_model.get_all(page, page_size, status, keyword)
        items = [self.checkin_model.to_dict(item) for item in result.get('items', [])]

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

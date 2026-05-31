from typing import Dict, Any
from app.model.jianshen_077_model import BookingModel, CourseModel, NotificationModel


class BookingBusiness:
    def __init__(self):
        self.booking_model = BookingModel()
        self.course_model = CourseModel()
        self.notification_model = NotificationModel()

    def create_booking(self, user_id: int, course_id: int, remark: str = '') -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        if course.get('status') != CourseModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '该课程当前不可预约',
                'data': None
            }

        if course.get('current_booking', 0) >= course.get('max_capacity', 0):
            return {
                'code': 1,
                'msg': '课程名额已满',
                'data': None
            }

        existing = self.booking_model.get_active_booking(user_id, course_id)
        if existing:
            return {
                'code': 1,
                'msg': '您已预约过该课程',
                'data': None
            }

        booking_id = self.booking_model.create(user_id, course_id, remark)
        if booking_id > 0:
            self.course_model.increment_booking(course_id)

            self.notification_model.create(
                user_id=user_id,
                title='预约成功',
                content=f'您已成功预约课程「{course.get("title")}」',
                ntype=NotificationModel.TYPE_BOOKING_CONFIRMED,
                related_id=course_id
            )

            booking = self.booking_model.get_by_id(booking_id)
            result = self.booking_model.to_dict(booking)
            result['course_title'] = course.get('title', '')
            result['course_start_time'] = course.get('start_time', '')
            result['course_end_time'] = course.get('end_time', '')
            result['course_coach'] = course.get('coach', '')

            return {
                'code': 0,
                'msg': '预约成功',
                'data': result
            }

        return {
            'code': 1,
            'msg': '预约失败',
            'data': None
        }

    def cancel_booking(self, booking_id: int, user_id: int) -> Dict[str, Any]:
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

        if booking.get('status') == BookingModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '预约已取消',
                'data': None
            }

        if booking.get('status') == BookingModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '已完成的课程无法取消',
                'data': None
            }

        affected = self.booking_model.update_status(booking_id, BookingModel.STATUS_CANCELLED)
        if affected > 0:
            course_id = booking.get('course_id')
            self.course_model.decrement_booking(course_id)

            course = self.course_model.get_by_id(course_id)
            self.notification_model.create(
                user_id=user_id,
                title='取消预约',
                content=f'您已取消课程「{course.get("title", "")}」的预约',
                ntype=NotificationModel.TYPE_BOOKING_CANCELLED,
                related_id=course_id
            )

            return {
                'code': 0,
                'msg': '取消预约成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消预约失败',
            'data': None
        }

    def get_my_bookings(self, user_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        result = self.booking_model.get_by_user(user_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            booking_dict = self.booking_model.to_dict(item)
            course = self.course_model.get_by_id(item.get('course_id'))
            if course:
                booking_dict['course_title'] = course.get('title', '')
                booking_dict['course_start_time'] = course.get('start_time', '')
                booking_dict['course_end_time'] = course.get('end_time', '')
                booking_dict['course_coach'] = course.get('coach', '')
                booking_dict['course_category'] = course.get('category', '')
                booking_dict['course_category_name'] = self.course_model.get_category_name(course.get('category', ''))
                booking_dict['course_location'] = course.get('location', '')
                booking_dict['course_status'] = course.get('status', '')
                booking_dict['course_status_text'] = self.course_model.get_status_text(course.get('status', 0))
            items.append(booking_dict)

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

    def get_course_bookings(self, course_id: int, page: int = 1, page_size: int = 10,
                            status: int = None) -> Dict[str, Any]:
        result = self.booking_model.get_by_course(course_id, page, page_size, status)
        items = [self.booking_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all_bookings(self, page: int = 1, page_size: int = 10,
                         status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.booking_model.get_all(page, page_size, status, keyword)
        items = [self.booking_model.to_dict(item) for item in result.get('items', [])]

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

    def update_booking_status(self, booking_id: int, status: int) -> Dict[str, Any]:
        booking = self.booking_model.get_by_id(booking_id)
        if not booking:
            return {
                'code': 1,
                'msg': '预约记录不存在',
                'data': None
            }

        affected = self.booking_model.update_status(booking_id, status)
        if affected > 0:
            updated_booking = self.booking_model.get_by_id(booking_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.booking_model.to_dict(updated_booking)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

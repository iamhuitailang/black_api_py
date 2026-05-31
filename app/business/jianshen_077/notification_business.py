from typing import Dict, Any
from app.model.jianshen_077_model import NotificationModel, CourseModel, BookingModel


class NotificationBusiness:
    def __init__(self):
        self.notification_model = NotificationModel()
        self.course_model = CourseModel()
        self.booking_model = BookingModel()

    def get_my_notifications(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.notification_model.get_by_user(user_id, page, page_size)
        items = [self.notification_model.to_dict(item) for item in result.get('items', [])]

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

    def get_unread_notifications(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.notification_model.get_unread_by_user(user_id, page, page_size)
        items = [self.notification_model.to_dict(item) for item in result.get('items', [])]

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

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.notification_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'count': count
            }
        }

    def mark_as_read(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {
                'code': 1,
                'msg': '通知不存在',
                'data': None
            }

        if notification.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此通知',
                'data': None
            }

        self.notification_model.mark_as_read(notification_id)
        return {
            'code': 0,
            'msg': '标记成功',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        count = self.notification_model.mark_all_as_read(user_id)
        return {
            'code': 0,
            'msg': f'已标记{count}条通知为已读',
            'data': None
        }

    def send_course_reminder(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        bookings = self.booking_model.get_by_course(course_id, page=1, page_size=1000,
                                                     status=BookingModel.STATUS_CONFIRMED)
        count = 0
        for booking in bookings.get('items', []):
            user_id = booking.get('user_id')
            self.notification_model.create(
                user_id=user_id,
                title='课程提醒',
                content=f'课程「{course.get("title")}」即将开始，请准时参加',
                ntype=NotificationModel.TYPE_COURSE_REMINDER,
                related_id=course_id
            )
            count += 1

        return {
            'code': 0,
            'msg': f'已发送{count}条课程提醒',
            'data': {'count': count}
        }

    def delete_notification(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {
                'code': 1,
                'msg': '通知不存在',
                'data': None
            }

        if notification.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除此通知',
                'data': None
            }

        self.notification_model.delete(notification_id)
        return {
            'code': 0,
            'msg': '删除成功',
            'data': None
        }

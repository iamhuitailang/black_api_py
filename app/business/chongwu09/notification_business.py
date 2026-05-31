from typing import Dict, Any
from app.model.chongwu09 import NotificationModel


class NotificationBusiness:
    def __init__(self):
        self.notification_model = NotificationModel()

    def get_notifications(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
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

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.notification_model.get_unread_count(user_id)
        return {'code': 0, 'msg': 'success', 'data': {'count': count}}

    def mark_as_read(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {'code': 1, 'msg': '通知不存在', 'data': None}
        if notification.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        self.notification_model.mark_as_read(notification_id)
        return {'code': 0, 'msg': '操作成功', 'data': None}

    def mark_all_read(self, user_id: int) -> Dict[str, Any]:
        self.notification_model.mark_all_read(user_id)
        return {'code': 0, 'msg': '操作成功', 'data': None}

    def delete_notification(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {'code': 1, 'msg': '通知不存在', 'data': None}
        if notification.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        self.notification_model.delete(notification_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

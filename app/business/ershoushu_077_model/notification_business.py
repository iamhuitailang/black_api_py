from typing import Dict, Any
from app.model.ershoushu_077_model import ErshoushuNotificationModel


class ErshoushuNotificationBusiness:
    def __init__(self):
        self.notification_model = ErshoushuNotificationModel()

    def get_notifications(self, user_id: int, page: int = 1, page_size: int = 10,
                          is_read: int = None) -> Dict[str, Any]:
        result = self.notification_model.get_by_user(user_id, page, page_size, is_read)
        items = [self.notification_model.to_dict(item) for item in result.get('items', [])]
        return {
            'code': 0, 'msg': 'success',
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
            return {'code': 1, 'msg': '无权操作此通知', 'data': None}

        affected = self.notification_model.mark_as_read(notification_id)
        if affected > 0:
            return {'code': 0, 'msg': '已标记为已读', 'data': None}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.notification_model.mark_all_as_read(user_id)
        return {'code': 0, 'msg': f'已将{affected}条通知标记为已读', 'data': None}

    def create_notification(self, user_id: int, title: str, content: str,
                            ntype: str = 'system', related_id: int = 0) -> Dict[str, Any]:
        notification_id = self.notification_model.create(user_id, title, content, ntype, related_id)
        if notification_id > 0:
            notification = self.notification_model.get_by_id(notification_id)
            return {'code': 0, 'msg': 'success', 'data': self.notification_model.to_dict(notification)}
        return {'code': 1, 'msg': '创建通知失败', 'data': None}

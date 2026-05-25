from typing import Dict, Any
from app.model.baoxiu import NotificationModel


class BaoxiuNotificationBusiness:
    def __init__(self):
        self.notification_model = NotificationModel()

    def get_notifications(self, user_id: int, page: int = 1,
                          page_size: int = 10, is_read: int = None) -> Dict[str, Any]:
        result = self.notification_model.get_by_user_id(user_id, page, page_size, is_read)
        items = []
        for item in result.get('items', []):
            item_dict = dict(item)
            item_dict['type_text'] = self.notification_model.get_type_text(item.get('type', 'system'))
            items.append(item_dict)

        unread_count = self.notification_model.get_unread_count(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'unread_count': unread_count
            }
        }

    def mark_as_read(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {'code': 1, 'msg': '通知不存在', 'data': None}

        if notification.get('user_id') != user_id:
            return {'code': 1, 'msg': '您没有权限操作该通知', 'data': None}

        self.notification_model.mark_as_read(notification_id)
        return {'code': 0, 'msg': '已标记为已读', 'data': None}

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        self.notification_model.mark_all_as_read(user_id)
        return {'code': 0, 'msg': '全部标记为已读', 'data': None}

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.notification_model.get_unread_count(user_id)
        return {'code': 0, 'msg': 'success', 'data': {'unread_count': count}}

    def delete_notification(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification:
            return {'code': 1, 'msg': '通知不存在', 'data': None}

        if notification.get('user_id') != user_id:
            return {'code': 1, 'msg': '您没有权限操作该通知', 'data': None}

        self.notification_model.delete(notification_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

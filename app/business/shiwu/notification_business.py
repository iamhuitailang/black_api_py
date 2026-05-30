from typing import Dict, Any
from app.model.shiwu_model import NotificationModel


class NotificationBusiness:
    def __init__(self):
        self.notification_model = NotificationModel()

    def get_my_notifications(self, user_id: int, page: int = 1, page_size: int = 10,
                            status: int = None, notification_type: str = None) -> Dict[str, Any]:
        result = self.notification_model.get_by_user(user_id, page, page_size, status, notification_type)
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
            'data': {'unread_count': count}
        }

    def mark_as_read(self, user_id: int, notification_id: int) -> Dict[str, Any]:
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
                'msg': '无权限操作',
                'data': None
            }

        affected = self.notification_model.mark_as_read(notification_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '操作成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.notification_model.mark_all_as_read(user_id)
        return {
            'code': 0,
            'msg': f'已标记{affected}条通知为已读',
            'data': {'count': affected}
        }

    def delete_notification(self, user_id: int, notification_id: int) -> Dict[str, Any]:
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
                'msg': '无权限删除',
                'data': None
            }

        affected = self.notification_model.delete(notification_id)
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

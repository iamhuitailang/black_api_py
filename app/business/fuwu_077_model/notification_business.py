from typing import Dict, Any, List, Optional
from app.model.fuwu_077_model import NotificationModel


class NotificationBusiness:
    def __init__(self):
        self.notification_model = NotificationModel()

    def get_notification_list(self, user_id: int, page: int = 1,
                              page_size: int = 10, status: int = None,
                              notification_type: str = None) -> Dict[str, Any]:
        result = self.notification_model.get_by_user_id(
            user_id, page, page_size, status, notification_type
        )
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
                'unread_count': count
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
                'msg': '无权操作该通知',
                'data': None
            }

        affected = self.notification_model.mark_as_read(notification_id, user_id)
        if affected > 0:
            updated = self.notification_model.get_by_id(notification_id)
            return {
                'code': 0,
                'msg': '标记成功',
                'data': self.notification_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '标记失败',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.notification_model.mark_all_as_read(user_id)
        return {
            'code': 0,
            'msg': f'已标记{affected}条通知为已读',
            'data': {
                'marked_count': affected
            }
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
                'msg': '无权删除该通知',
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

    def create_notification(self, user_id: int, title: str, 
                            content: str = '', notification_type: str = 'system',
                            related_id: int = None) -> Dict[str, Any]:
        if not user_id:
            return {
                'code': 1,
                'msg': '用户ID不能为空',
                'data': None
            }

        if not title:
            return {
                'code': 1,
                'msg': '通知标题不能为空',
                'data': None
            }

        notification_id = self.notification_model.create(
            user_id=user_id,
            title=title,
            content=content,
            notification_type=notification_type,
            related_id=related_id
        )

        if notification_id > 0:
            notification = self.notification_model.get_by_id(notification_id)
            return {
                'code': 0,
                'msg': '发送成功',
                'data': self.notification_model.to_dict(notification)
            }

        return {
            'code': 1,
            'msg': '发送失败',
            'data': None
        }

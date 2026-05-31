from typing import Dict, Any
from app.model.jaoyou_077 import MessageModel


class JaoyouMessageBusiness:
    def __init__(self):
        self.message_model = MessageModel()

    def get_user_messages(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None, msg_type: int = None) -> Dict[str, Any]:
        result = self.message_model.get_user_messages(user_id, page, page_size, status, msg_type)
        items = [self.message_model.to_public_dict(item) for item in result.get('items', [])]

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

    def mark_as_read(self, message_id: int, user_id: int) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }

        if message.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此消息',
                'data': None
            }

        affected = self.message_model.mark_as_read(message_id)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '已标记为已读',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.message_model.mark_all_as_read(user_id)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '已全部标记为已读',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def delete_message(self, message_id: int, user_id: int) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }

        if message.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除此消息',
                'data': None
            }

        affected = self.message_model.delete(message_id)
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

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.message_model.count_unread(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

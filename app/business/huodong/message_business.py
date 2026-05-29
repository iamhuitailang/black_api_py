from typing import Dict, Any
from app.model.huodong import MessageModel


class MessageBusiness:
    def __init__(self):
        self.message_model = MessageModel()

    def get_messages(self, user_id: int, page: int = 1, page_size: int = 20,
                      message_type: str = None, is_read: int = None) -> Dict[str, Any]:
        result = self.message_model.get_by_user(user_id, page, page_size, message_type, is_read)
        items = [self.message_model.to_dict(m) for m in result.get('items', [])]
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
        count = self.message_model.count_unread(user_id)
        return {'code': 0, 'msg': 'success', 'data': {'unread_count': count}}

    def mark_as_read(self, user_id: int, message_id: int) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {'code': 1, 'msg': '消息不存在', 'data': None}
        if message.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        self.message_model.mark_as_read(message_id)
        return {'code': 0, 'msg': 'success', 'data': None}

    def mark_all_read(self, user_id: int) -> Dict[str, Any]:
        count = self.message_model.mark_all_read(user_id)
        return {'code': 0, 'msg': f'已标记{count}条消息为已读', 'data': None}

    def delete_message(self, user_id: int, message_id: int) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {'code': 1, 'msg': '消息不存在', 'data': None}
        if message.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        self.message_model.delete(message_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

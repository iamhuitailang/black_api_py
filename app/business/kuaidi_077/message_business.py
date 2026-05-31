from typing import Dict, Any, Optional
from app.model.kuaidi_077_model import KuaidiMessageModel


class KuaidiMessageBusiness:
    def __init__(self):
        self.message_model = KuaidiMessageModel()

    def get_message_by_id(self, message_id: int) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.message_model.to_dict(message)
        }

    def get_user_messages(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.message_model.get_by_user_id(user_id, page, page_size, status)
        items = [self.message_model.to_dict(item) for item in result.get('items', [])]

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
        count = self.message_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'count': count
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
                'msg': '无权限操作',
                'data': None
            }

        affected = self.message_model.mark_as_read(message_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '标记成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '标记失败',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.message_model.mark_all_as_read(user_id)
        return {
            'code': 0,
            'msg': '标记成功',
            'data': {
                'count': affected
            }
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
                'msg': '无权限操作',
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

    def get_message_list(self, page: int = 1, page_size: int = 10, user_id: int = None,
                        status: int = None, msg_type: int = None) -> Dict[str, Any]:
        result = self.message_model.get_all(page, page_size, user_id, status, msg_type)
        items = [self.message_model.to_dict(item) for item in result.get('items', [])]

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

    def send_system_message(self, user_id: int, title: str, content: str = '') -> Dict[str, Any]:
        message_id = self.message_model.create(user_id, self.message_model.TYPE_SYSTEM, title, content)
        if message_id > 0:
            return {
                'code': 0,
                'msg': '发送成功',
                'data': {
                    'message_id': message_id
                }
            }

        return {
            'code': 1,
            'msg': '发送失败',
            'data': None
        }

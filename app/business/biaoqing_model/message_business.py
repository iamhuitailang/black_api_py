from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import MessageModel


class BqMessageBusiness:
    def __init__(self):
        self.message_model = MessageModel()

    def create(self, user_id: int, type: int = 0, title: str = '',
                 content: str = '', from_user_id: int = 0,
                 emoji_id: int = 0, extra_data: str = '') -> Dict[str, Any]:
        if user_id <= 0:
            return {
                'code': 1,
                'msg': '接收用户ID不能为空',
                'data': None
            }

        message_id = self.message_model.create(
            user_id=user_id, type=type, title=title,
            content=content,
            from_user_id=from_user_id,
            emoji_id=emoji_id,
            extra_data=extra_data
        )

        if message_id > 0:
            message = self.message_model.get_by_id(message_id)
            return {
                'code': 0,
                'msg': '发送成功',
                'data': self.message_model.to_dict(message)
            }

        return {
            'code': 1,
            'msg': '发送失败',
            'data': None
        }

    def get_by_id(self, message_id: int, user_id: int) -> Dict[str, Any]:
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
                'msg': '无权限查看',
                'data': None
            }

        if message.get('status') == MessageModel.STATUS_UNREAD:
            self.message_model.mark_as_read(message_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': self.message_model.to_dict(message)
        }

    def get_list(self, user_id: int, page: int = 1, page_size: int = 20,
                 status: int = None, type: int = None) -> Dict[str, Any]:
        result = self.message_model.get_by_user_id(user_id, page, page_size, status, type)
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
            'data': {'count': count}
        }

    def mark_all_read(self, message_id: int, user_id: int) -> Dict[str, Any]:
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
            'msg': '操作失败',
            'data': None
        }

    def mark_all_as_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.message_model.mark_all_as_read(user_id)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '标记成功',
                'data': {'count': affected}
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def delete(self, message_id: int, user_id: int) -> Dict[str, Any]:
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

    def send_system_message(self, user_id: int, title: str, content: str) -> Dict[str, Any]:
        return self.create(
            user_id=user_id,
            type=MessageModel.TYPE_SYSTEM,
            title=title,
            content=content
        )

from typing import Dict, Any
from app.model.jiudian_077_model import MessageModel


class JiudianMessageBusiness:
    def __init__(self):
        self.message_model = MessageModel()

    def get_my_messages(self, user_id: int, page: int = 1, page_size: int = 10,
                        status: int = None, type: str = None) -> Dict[str, Any]:
        result = self.message_model.get_by_user_id(user_id, page, page_size, status, type)
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

    def get_message_by_id(self, message_id: int, user_id: int = None, is_admin: bool = False) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }

        if not is_admin and message.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权查看他人的消息',
                'data': None
            }

        if message.get('status') == self.message_model.STATUS_UNREAD:
            self.message_model.mark_as_read(message_id)
            message = self.message_model.get_by_id(message_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': self.message_model.to_public_dict(message)
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
                'msg': '无权操作他人的消息',
                'data': None
            }

        affected = self.message_model.mark_as_read(message_id)
        if affected > 0:
            updated_message = self.message_model.get_by_id(message_id)
            return {
                'code': 0,
                'msg': '标记成功',
                'data': self.message_model.to_public_dict(updated_message)
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
            'msg': f'已标记{affected}条消息为已读',
            'data': {'count': affected}
        }

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.message_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

    def delete_message(self, message_id: int, user_id: int, is_admin: bool = False) -> Dict[str, Any]:
        message = self.message_model.get_by_id(message_id)
        if not message:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }

        if not is_admin and message.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除他人的消息',
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
        if not title:
            return {
                'code': 1,
                'msg': '消息标题不能为空',
                'data': None
            }

        if not content:
            return {
                'code': 1,
                'msg': '消息内容不能为空',
                'data': None
            }

        from app.model.jiudian_077_model import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        message_id = self.message_model.send_system_message(user_id, title, content)
        if message_id > 0:
            message = self.message_model.get_by_id(message_id)
            return {
                'code': 0,
                'msg': '发送成功',
                'data': self.message_model.to_public_dict(message)
            }

        return {
            'code': 1,
            'msg': '发送失败',
            'data': None
        }

    def get_message_list(self, page: int = 1, page_size: int = 10, user_id: int = None,
                         status: int = None, type: str = None) -> Dict[str, Any]:
        result = self.message_model.get_all(page, page_size, user_id, status, type)
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

    def get_message_types(self) -> Dict[str, Any]:
        types = [
            {'key': 'booking_confirm', 'label': '预订确认'},
            {'key': 'booking_cancel', 'label': '预订取消'},
            {'key': 'check_in_remind', 'label': '入住提醒'},
            {'key': 'check_out_remind', 'label': '退房提醒'},
            {'key': 'system', 'label': '系统消息'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': types
        }

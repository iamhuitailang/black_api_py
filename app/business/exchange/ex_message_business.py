from typing import Dict, Any
from app.model.exchange import ExMessageModel


class ExMessageBusiness:
    def __init__(self):
        self.model = ExMessageModel()

    def get_my_messages(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        try:
            result = self.model.get_by_receiver(
                receiver_id=user_id,
                page=page,
                page_size=page_size
            )

            items = []
            for item in result.get('items', []):
                items.append(self.model.to_public_dict(item))

            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'list': items,
                    'total': result.get('total', 0),
                    'page': result.get('page', 1),
                    'page_size': result.get('page_size', 20),
                    'total_pages': result.get('total_pages', 0)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        try:
            count = self.model.get_unread_count(user_id)

            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'unread_count': count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def mark_as_read(self, message_id: int, user_id: int) -> Dict[str, Any]:
        try:
            message = self.model.get_by_id(message_id)

            if not message:
                return {
                    'code': 1,
                    'msg': '消息不存在',
                    'data': None
                }

            if message.get('receiver_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权操作此消息',
                    'data': None
                }

            affected = self.model.mark_as_read(message_id)

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
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def mark_all_read(self, user_id: int) -> Dict[str, Any]:
        try:
            affected = self.model.mark_all_read(user_id)

            return {
                'code': 0,
                'msg': '全部标记已读成功',
                'data': {
                    'affected_count': affected
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

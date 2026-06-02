from typing import Dict, Any
from app.model.xiangqi077_model import XiangqiChatModel


class XiangqiChatBusiness:
    def __init__(self):
        self.chat_model = XiangqiChatModel()

    def send_game_message(self, user_id: int, username: str, nickname: str,
                          content: str, game_id: int) -> Dict[str, Any]:
        if not content or not content.strip():
            return {'code': 1, 'msg': '消息内容不能为空', 'data': None}
        if len(content) > 500:
            return {'code': 1, 'msg': '消息内容不能超过500字', 'data': None}
        msg_id = self.chat_model.create(
            user_id=user_id,
            content=content.strip(),
            game_id=game_id,
            username=username,
            nickname=nickname,
            chat_type=XiangqiChatModel.TYPE_GAME
        )
        if msg_id > 0:
            return {'code': 0, 'msg': '发送成功', 'data': {'id': msg_id}}
        return {'code': 1, 'msg': '发送失败', 'data': None}

    def send_hall_message(self, user_id: int, username: str, nickname: str,
                          content: str) -> Dict[str, Any]:
        if not content or not content.strip():
            return {'code': 1, 'msg': '消息内容不能为空', 'data': None}
        if len(content) > 500:
            return {'code': 1, 'msg': '消息内容不能超过500字', 'data': None}
        msg_id = self.chat_model.create(
            user_id=user_id,
            content=content.strip(),
            username=username,
            nickname=nickname,
            chat_type=XiangqiChatModel.TYPE_HALL
        )
        if msg_id > 0:
            return {'code': 0, 'msg': '发送成功', 'data': {'id': msg_id}}
        return {'code': 1, 'msg': '发送失败', 'data': None}

    def get_game_messages(self, game_id: int, limit: int = 50) -> Dict[str, Any]:
        messages = self.chat_model.get_game_messages(game_id, limit)
        items = [self.chat_model.to_dict(m) for m in messages]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_hall_messages(self, limit: int = 50) -> Dict[str, Any]:
        messages = self.chat_model.get_hall_messages(limit)
        items = [self.chat_model.to_dict(m) for m in reversed(messages)]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_all_messages(self, page: int = 1, page_size: int = 10,
                         chat_type: int = None, game_id: int = None) -> Dict[str, Any]:
        result = self.chat_model.get_all(page, page_size, chat_type, game_id)
        items = [self.chat_model.to_dict(item) for item in result.get('items', [])]
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

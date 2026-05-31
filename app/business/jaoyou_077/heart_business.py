from typing import Dict, Any
from app.model.jaoyou_077 import HeartModel, MatchModel, MessageModel, UserModel


class JaoyouHeartBusiness:
    def __init__(self):
        self.heart_model = HeartModel()
        self.match_model = MatchModel()
        self.message_model = MessageModel()
        self.user_model = UserModel()

    def send_heart(self, from_user_id: int, to_user_id: int) -> Dict[str, Any]:
        if from_user_id == to_user_id:
            return {
                'code': 1,
                'msg': '不能给自己发送心动',
                'data': None
            }

        existing = self.heart_model.get_by_users(from_user_id, to_user_id)
        if existing:
            return {
                'code': 1,
                'msg': '已经发送过心动了',
                'data': None
            }

        heart_id = self.heart_model.create(from_user_id, to_user_id)
        if heart_id > 0:
            from_user = self.user_model.get_by_id(from_user_id)
            if from_user:
                self.message_model.create(
                    user_id=to_user_id,
                    msg_type=self.message_model.TYPE_HEART,
                    title='收到心动',
                    content=f'{from_user.get("nickname")}对你心动了！',
                    related_id=heart_id
                )

            reverse_heart = self.heart_model.get_by_users(to_user_id, from_user_id)
            if reverse_heart and reverse_heart.get('status') == self.heart_model.STATUS_ACCEPTED:
                self.heart_model.update_status(heart_id, self.heart_model.STATUS_ACCEPTED)
                match_id = self.match_model.create(from_user_id, to_user_id)

                self.message_model.create(
                    user_id=from_user_id,
                    msg_type=self.message_model.TYPE_MATCH,
                    title='匹配成功',
                    content=f'你和对方互有好感，匹配成功！',
                    related_id=match_id
                )
                self.message_model.create(
                    user_id=to_user_id,
                    msg_type=self.message_model.TYPE_MATCH,
                    title='匹配成功',
                    content=f'你和对方互有好感，匹配成功！',
                    related_id=match_id
                )

            return {
                'code': 0,
                'msg': '心动发送成功',
                'data': {'heart_id': heart_id}
            }

        return {
            'code': 1,
            'msg': '心动发送失败',
            'data': None
        }

    def respond_heart(self, heart_id: int, user_id: int, accepted: bool) -> Dict[str, Any]:
        heart = self.heart_model.get_by_id(heart_id)
        if not heart:
            return {
                'code': 1,
                'msg': '心动记录不存在',
                'data': None
            }

        if heart.get('to_user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此心动记录',
                'data': None
            }

        if heart.get('status') != self.heart_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该心动已处理',
                'data': None
            }

        status = self.heart_model.STATUS_ACCEPTED if accepted else self.heart_model.STATUS_REJECTED
        affected = self.heart_model.update_status(heart_id, status)

        if affected > 0 and accepted:
            from_user_id = heart.get('from_user_id')
            to_user_id = heart.get('to_user_id')

            reverse_heart = self.heart_model.get_by_users(to_user_id, from_user_id)
            if reverse_heart and reverse_heart.get('status') == self.heart_model.STATUS_ACCEPTED:
                match_id = self.match_model.create(from_user_id, to_user_id)

                self.message_model.create(
                    user_id=from_user_id,
                    msg_type=self.message_model.TYPE_MATCH,
                    title='匹配成功',
                    content=f'你和对方互有好感，匹配成功！',
                    related_id=match_id
                )
                self.message_model.create(
                    user_id=to_user_id,
                    msg_type=self.message_model.TYPE_MATCH,
                    title='匹配成功',
                    content=f'你和对方互有好感，匹配成功！',
                    related_id=match_id
                )

            return {
                'code': 0,
                'msg': '已接受心动',
                'data': None
            }

        if affected > 0:
            return {
                'code': 0,
                'msg': '已拒绝心动',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_sent_hearts(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.heart_model.get_sent_hearts(user_id, page, page_size)
        items = [self.heart_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_received_hearts(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.heart_model.get_received_hearts(user_id, page, page_size, status)
        items = [self.heart_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_pending_count(self, user_id: int) -> Dict[str, Any]:
        count = self.heart_model.count_pending(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

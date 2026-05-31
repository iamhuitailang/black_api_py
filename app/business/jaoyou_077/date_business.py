from typing import Dict, Any
from app.model.jaoyou_077 import DateModel, MessageModel, UserModel


class JaoyouDateBusiness:
    def __init__(self):
        self.date_model = DateModel()
        self.message_model = MessageModel()
        self.user_model = UserModel()

    def send_date(self, from_user_id: int, to_user_id: int, title: str, description: str, location: str, date_time: str) -> Dict[str, Any]:
        if from_user_id == to_user_id:
            return {
                'code': 1,
                'msg': '不能给自己发送约会邀请',
                'data': None
            }

        if not title:
            return {
                'code': 1,
                'msg': '约会标题不能为空',
                'data': None
            }

        if not date_time:
            return {
                'code': 1,
                'msg': '约会时间不能为空',
                'data': None
            }

        date_id = self.date_model.create(from_user_id, to_user_id, title, description, location, date_time)
        if date_id > 0:
            from_user = self.user_model.get_by_id(from_user_id)
            if from_user:
                self.message_model.create(
                    user_id=to_user_id,
                    msg_type=self.message_model.TYPE_DATE,
                    title='收到约会邀请',
                    content=f'{from_user.get("nickname")}邀请你约会：{title}',
                    related_id=date_id
                )

            return {
                'code': 0,
                'msg': '约会邀请发送成功',
                'data': {'date_id': date_id}
            }

        return {
            'code': 1,
            'msg': '约会邀请发送失败',
            'data': None
        }

    def respond_date(self, date_id: int, user_id: int, accepted: bool) -> Dict[str, Any]:
        date = self.date_model.get_by_id(date_id)
        if not date:
            return {
                'code': 1,
                'msg': '约会记录不存在',
                'data': None
            }

        if date.get('to_user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此约会记录',
                'data': None
            }

        if date.get('status') != self.date_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该约会已处理',
                'data': None
            }

        status = self.date_model.STATUS_ACCEPTED if accepted else self.date_model.STATUS_REJECTED
        affected = self.date_model.update_status(date_id, status)

        if affected > 0:
            msg = '已接受约会邀请' if accepted else '已拒绝约会邀请'
            return {
                'code': 0,
                'msg': msg,
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def cancel_date(self, date_id: int, user_id: int) -> Dict[str, Any]:
        date = self.date_model.get_by_id(date_id)
        if not date:
            return {
                'code': 1,
                'msg': '约会记录不存在',
                'data': None
            }

        if date.get('from_user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权取消此约会',
                'data': None
            }

        if date.get('status') in [self.date_model.STATUS_CANCELLED, self.date_model.STATUS_COMPLETED]:
            return {
                'code': 1,
                'msg': '该约会已取消或完成',
                'data': None
            }

        affected = self.date_model.update_status(date_id, self.date_model.STATUS_CANCELLED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已取消约会',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_sent_dates(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.date_model.get_sent_dates(user_id, page, page_size, status)
        items = [self.date_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_received_dates(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.date_model.get_received_dates(user_id, page, page_size, status)
        items = [self.date_model.to_public_dict(item) for item in result.get('items', [])]

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
        count = self.date_model.count_pending(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

    def get_all_dates(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.date_model.get_all(page, page_size, status)
        items = [self.date_model.to_public_dict(item) for item in result.get('items', [])]

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

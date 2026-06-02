from typing import Dict, Any, Optional
from app.model.meng_model import FriendModel, UserModel


class MengFriendBusiness:
    def __init__(self):
        self.friend_model = FriendModel()
        self.user_model = UserModel()

    def add_friend(self, user_id: int, friend_id: int) -> Dict[str, Any]:
        try:
            if user_id == friend_id:
                return {
                    'code': 1,
                    'msg': '不能添加自己为好友',
                    'data': None
                }

            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            friend = self.user_model.get_by_id(friend_id)
            if not friend:
                return {
                    'code': 1,
                    'msg': '好友用户不存在',
                    'data': None
                }

            if self.friend_model.is_friend(user_id, friend_id):
                return {
                    'code': 1,
                    'msg': '已经是好友关系',
                    'data': None
                }

            existing_pending = self.friend_model.query.find_one({
                'user_id': user_id,
                'friend_id': friend_id
            })
            if existing_pending:
                return {
                    'code': 1,
                    'msg': '已发送好友请求，请勿重复发送',
                    'data': None
                }

            record_id = self.friend_model.create(user_id, friend_id, FriendModel.STATUS_PENDING)

            if record_id > 0:
                record = self.friend_model.get_by_id(record_id)
                return {
                    'code': 0,
                    'msg': '好友请求已发送',
                    'data': self.friend_model.to_dict(record)
                }

            return {
                'code': 1,
                'msg': '发送好友请求失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def accept_friend(self, user_id: int, record_id: int) -> Dict[str, Any]:
        try:
            record = self.friend_model.get_by_id(record_id)
            if not record:
                return {
                    'code': 1,
                    'msg': '好友请求不存在',
                    'data': None
                }

            if record.get('friend_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权限操作此请求',
                    'data': None
                }

            if record.get('status') != FriendModel.STATUS_PENDING:
                return {
                    'code': 1,
                    'msg': '该请求已处理',
                    'data': None
                }

            requester_id = record.get('user_id')
            respondent_id = record.get('friend_id')

            affected = self.friend_model.update_status(record_id, FriendModel.STATUS_FRIEND)
            if affected <= 0:
                return {
                    'code': 1,
                    'msg': '接受好友请求失败',
                    'data': None
                }

            self.friend_model.create(respondent_id, requester_id, FriendModel.STATUS_FRIEND)

            updated_record = self.friend_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '已接受好友请求',
                'data': self.friend_model.to_dict(updated_record)
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def reject_friend(self, user_id: int, record_id: int) -> Dict[str, Any]:
        try:
            record = self.friend_model.get_by_id(record_id)
            if not record:
                return {
                    'code': 1,
                    'msg': '好友请求不存在',
                    'data': None
                }

            if record.get('friend_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权限操作此请求',
                    'data': None
                }

            if record.get('status') != FriendModel.STATUS_PENDING:
                return {
                    'code': 1,
                    'msg': '该请求已处理',
                    'data': None
                }

            affected = self.friend_model.update_status(record_id, FriendModel.STATUS_REJECTED)
            if affected > 0:
                updated_record = self.friend_model.get_by_id(record_id)
                return {
                    'code': 0,
                    'msg': '已拒绝好友请求',
                    'data': self.friend_model.to_dict(updated_record)
                }

            return {
                'code': 1,
                'msg': '拒绝好友请求失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def delete_friend(self, user_id: int, record_id: int) -> Dict[str, Any]:
        try:
            record = self.friend_model.get_by_id(record_id)
            if not record:
                return {
                    'code': 1,
                    'msg': '好友记录不存在',
                    'data': None
                }

            if record.get('user_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权限删除此好友',
                    'data': None
                }

            friend_id = record.get('friend_id')

            affected = self.friend_model.delete(record_id)
            if affected <= 0:
                return {
                    'code': 1,
                    'msg': '删除好友失败',
                    'data': None
                }

            reverse_record = self.friend_model.query.find_one({
                'user_id': friend_id,
                'friend_id': user_id
            })
            if reverse_record:
                self.friend_model.delete(reverse_record['id'])

            return {
                'code': 0,
                'msg': '已删除好友',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_friends(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            result = self.friend_model.get_friends(user_id, page, page_size)

            if result.get('list'):
                result['list'] = [self.friend_model.to_dict(item) for item in result['list']]

            return {
                'code': 0,
                'msg': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def get_pending_requests(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        try:
            user = self.user_model.get_by_id(user_id)
            if not user:
                return {
                    'code': 1,
                    'msg': '用户不存在',
                    'data': None
                }

            result = self.friend_model.get_pending_requests(user_id, page, page_size)

            if result.get('list'):
                result['list'] = [self.friend_model.to_dict(item) for item in result['list']]

            return {
                'code': 0,
                'msg': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

    def is_friend(self, user_id: int, friend_id: int) -> Dict[str, Any]:
        try:
            result = self.friend_model.is_friend(user_id, friend_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': {'is_friend': result}
            }
        except Exception as e:
            return {
                'code': 1,
                'msg': str(e),
                'data': None
            }

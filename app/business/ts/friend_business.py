from typing import Dict, Any, List, Optional
from app.model.ts import TsFriendModel, TsUserModel


class TsFriendBusiness:
    def __init__(self):
        self.friend_model = TsFriendModel()
        self.user_model = TsUserModel()

    def send_friend_request(self, user_id: int, friend_phone: str) -> Dict[str, Any]:
        friend_user = self.user_model.get_by_phone(friend_phone)
        if not friend_user:
            return {
                'code': 1,
                'msg': '该手机号用户不存在',
                'data': None
            }

        friend_id = friend_user.get('id')
        if friend_id == user_id:
            return {
                'code': 1,
                'msg': '不能添加自己为好友',
                'data': None
            }

        if self.friend_model.is_friend(user_id, friend_id):
            return {
                'code': 1,
                'msg': '已经是好友关系',
                'data': None
            }

        relationship = self.friend_model.get_relationship(user_id, friend_id)
        if relationship:
            status = relationship.get('status')
            if status == self.friend_model.STATUS_PENDING:
                if relationship.get('user_id') == user_id:
                    return {
                        'code': 1,
                        'msg': '已发送好友请求，等待对方确认',
                        'data': None
                    }
                else:
                    return {
                        'code': 1,
                        'msg': '对方已发送好友请求，请在待确认列表中处理',
                        'data': None
                    }
            elif status == self.friend_model.STATUS_REJECTED:
                pass

        result = self.friend_model.create(user_id, friend_id)
        if result > 0:
            return {
                'code': 0,
                'msg': '好友请求已发送',
                'data': None
            }

        return {
            'code': 1,
            'msg': '发送好友请求失败',
            'data': None
        }

    def accept_friend_request(self, user_id: int, relationship_id: int) -> Dict[str, Any]:
        relationship = self.friend_model.get_by_id(relationship_id)
        if not relationship:
            return {
                'code': 1,
                'msg': '好友请求不存在',
                'data': None
            }

        if relationship.get('friend_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限处理此请求',
                'data': None
            }

        if relationship.get('status') != self.friend_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '此请求已处理过',
                'data': None
            }

        affected = self.friend_model.accept_request(relationship_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已接受好友请求',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def reject_friend_request(self, user_id: int, relationship_id: int) -> Dict[str, Any]:
        relationship = self.friend_model.get_by_id(relationship_id)
        if not relationship:
            return {
                'code': 1,
                'msg': '好友请求不存在',
                'data': None
            }

        if relationship.get('friend_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限处理此请求',
                'data': None
            }

        if relationship.get('status') != self.friend_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '此请求已处理过',
                'data': None
            }

        affected = self.friend_model.reject_request(relationship_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已拒绝好友请求',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_friends(self, user_id: int) -> Dict[str, Any]:
        friends = self.friend_model.get_friends(user_id)

        formatted_friends = []
        for friend in friends:
            formatted_friends.append({
                'user_id': friend.get('user_id') if friend.get('user_id') != user_id else friend.get('friend_id'),
                'nickname': friend.get('nickname'),
                'avatar': friend.get('avatar'),
                'total_count': friend.get('total_count'),
                'streak_days': friend.get('streak_days')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_friends
        }

    def get_pending_requests(self, user_id: int) -> Dict[str, Any]:
        requests = self.friend_model.get_pending_requests(user_id)

        formatted_requests = []
        for req in requests:
            formatted_requests.append({
                'id': req.get('id'),
                'user_id': req.get('user_id'),
                'nickname': req.get('nickname'),
                'avatar': req.get('avatar'),
                'created_at': req.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_requests
        }

    def get_sent_requests(self, user_id: int) -> Dict[str, Any]:
        requests = self.friend_model.get_sent_requests(user_id)

        formatted_requests = []
        for req in requests:
            formatted_requests.append({
                'id': req.get('id'),
                'friend_id': req.get('friend_id'),
                'nickname': req.get('nickname'),
                'avatar': req.get('avatar'),
                'created_at': req.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_requests
        }

    def remove_friend(self, user_id: int, friend_id: int) -> Dict[str, Any]:
        if not self.friend_model.is_friend(user_id, friend_id):
            return {
                'code': 1,
                'msg': '不是好友关系',
                'data': None
            }

        affected = self.friend_model.remove_friend(user_id, friend_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已删除好友',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_friend_ranking(self, user_id: int, period: str = 'week', limit: int = 10) -> Dict[str, Any]:
        rankings = self.friend_model.get_friend_ranking(user_id, period, limit)

        formatted_rankings = []
        for i, rank in enumerate(rankings):
            formatted_rankings.append({
                'rank': i + 1,
                'user_id': rank.get('user_id'),
                'nickname': rank.get('nickname'),
                'avatar': rank.get('avatar'),
                'total_count': rank.get('total_count'),
                'total_calories': rank.get('total_calories')
            })

        user = self.user_model.get_by_id(user_id)
        if user:
            formatted_rankings.insert(0, {
                'rank': 0,
                'user_id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'total_count': user.get('total_count'),
                'total_calories': user.get('total_calories'),
                'is_me': True
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': formatted_rankings
        }

    def search_user(self, phone: str) -> Dict[str, Any]:
        user = self.user_model.get_by_phone(phone)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }
        }

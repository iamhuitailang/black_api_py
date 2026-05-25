from typing import Dict, Any
from app.model.jianshen import JianshenUserModel


class JianshenRankingBusiness:
    def __init__(self):
        self.user_model = JianshenUserModel()

    def get_ranking(self, rank_type: str = 'total', limit: int = 50) -> Dict[str, Any]:
        if rank_type not in ['total', 'consecutive', 'level']:
            rank_type = 'total'
        users = self.user_model.get_ranking(by=rank_type, limit=limit)
        items = []
        for i, u in enumerate(users):
            d = self.user_model.to_public_dict(u)
            d['rank'] = i + 1
            if rank_type == 'total':
                d['value'] = u.get('total_checkins', 0)
            elif rank_type == 'consecutive':
                d['value'] = u.get('consecutive_days', 0)
            else:
                d['value'] = u.get('level', 1)
            items.append(d)
        return {'code': 0, 'msg': 'success', 'data': {'items': items, 'type': rank_type}}

    def get_my_rank(self, user_id: int, rank_type: str = 'total') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        rank = self.user_model.get_rank(user_id, by=rank_type)
        value = 0
        if rank_type == 'total':
            value = user.get('total_checkins', 0)
        elif rank_type == 'consecutive':
            value = user.get('consecutive_days', 0)
        else:
            value = user.get('level', 1)
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'rank': rank,
                'value': value,
                'type': rank_type,
                'user': self.user_model.to_public_dict(user)
            }
        }

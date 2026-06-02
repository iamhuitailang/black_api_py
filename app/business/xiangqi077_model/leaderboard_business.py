from typing import Dict, Any
from app.model.xiangqi077_model import XiangqiLeaderboardModel


class XiangqiLeaderboardBusiness:
    def __init__(self):
        self.leaderboard_model = XiangqiLeaderboardModel()

    def get_leaderboard(self, period: int = 3, period_key: str = '', limit: int = 50) -> Dict[str, Any]:
        items = self.leaderboard_model.get_leaderboard(period, period_key, limit)
        result = [self.leaderboard_model.to_dict(item) for item in items]
        return {'code': 0, 'msg': 'success', 'data': result}

    def get_user_rank(self, user_id: int, period: int = 3, period_key: str = '') -> Dict[str, Any]:
        record = self.leaderboard_model.get_user_rank(user_id, period, period_key)
        if not record:
            return {'code': 1, 'msg': '暂无排行数据', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.leaderboard_model.to_dict(record)}

    def get_all_leaderboards(self, page: int = 1, page_size: int = 10, period: int = None) -> Dict[str, Any]:
        result = self.leaderboard_model.get_all(page, page_size, period)
        items = [self.leaderboard_model.to_dict(item) for item in result.get('items', [])]
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

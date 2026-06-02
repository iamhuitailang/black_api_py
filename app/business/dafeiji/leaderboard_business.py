from typing import Dict, Any
from app.model.dafeiji_model import DafeijiLeaderboardModel


class DafeijiLeaderboardBusiness:
    def __init__(self):
        self.leaderboard_model = DafeijiLeaderboardModel()

    def get_top(self, limit: int = 10) -> Dict[str, Any]:
        records = self.leaderboard_model.get_top(limit)
        items = [self.leaderboard_model.to_dict(r) for r in records]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_user_best(self, user_id: int) -> Dict[str, Any]:
        record = self.leaderboard_model.get_user_best(user_id)
        if record:
            rank = self.leaderboard_model.get_user_rank(user_id)
            result = self.leaderboard_model.to_dict(record)
            result['rank'] = rank
            return {'code': 0, 'msg': 'success', 'data': result}
        return {'code': 0, 'msg': '暂无记录', 'data': None}

    def get_user_rank(self, user_id: int) -> Dict[str, Any]:
        rank = self.leaderboard_model.get_user_rank(user_id)
        return {'code': 0, 'msg': 'success', 'data': {'rank': rank}}

    def get_user_history(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        records = self.leaderboard_model.get_user_history(user_id, limit)
        items = [self.leaderboard_model.to_dict(r) for r in records]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.leaderboard_model.get_all(page, page_size)
        items = [self.leaderboard_model.to_dict(r) for r in result.get('items', [])]
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

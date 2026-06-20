from typing import Dict, Any
from app.model.game import LeaderboardModel


class LeaderboardBusiness:
    def __init__(self):
        self.model = LeaderboardModel()

    def submit_score(self, player_name: str, score: int, time_spent: float, hp_remaining: int) -> Dict[str, Any]:
        if score < 0:
            return {'code': 1, 'message': 'Score cannot be negative', 'data': None}
        if time_spent < 0:
            return {'code': 1, 'message': 'Time cannot be negative', 'data': None}
        if hp_remaining < 0:
            return {'code': 1, 'message': 'HP cannot be negative', 'data': None}

        name = (player_name or 'Anonymous').strip()[:20] or 'Anonymous'
        new_id = self.model.create(name, score, time_spent, hp_remaining)
        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'submit success',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'time_spent': record.get('time_spent'),
                'hp_remaining': record.get('hp_remaining'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        limit = max(1, min(limit, 100))
        records = self.model.get_top(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': records,
                'total': self.model.count()
            }
        }

from typing import Dict, Any, List
from app.model.cloud_runner import GameRankModel


class CloudRunnerBusiness:
    def __init__(self):
        self.model = GameRankModel()

    def submit_score(self, player_name: str, score: int, distance: float) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        if len(player_name) > 20:
            return {
                'code': 1,
                'message': 'Player name too long (max 20 characters)',
                'data': None
            }

        if score < 0 or distance < 0:
            return {
                'code': 1,
                'message': 'Invalid score or distance',
                'data': None
            }

        new_id = self.model.create(player_name, int(score), float(distance))
        rank = self.model.get_rank_by_score(int(score))
        record = self.model.get_by_id(new_id)

        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'distance': record.get('distance'),
                'rank': rank,
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100

        records = self.model.get_top_n(limit)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': records,
                'total': self.model.count()
            }
        }

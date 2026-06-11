from typing import Dict, Any, List
from app.model.runner import RunnerScoreModel


class RunnerBusiness:
    def __init__(self):
        self.model = RunnerScoreModel()

    def submit_score(self, player_name: str, distance: int, rings: int) -> Dict[str, Any]:
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
                'message': 'Player name cannot exceed 20 characters',
                'data': None
            }

        if distance < 0:
            distance = 0
        if rings < 0:
            rings = 0

        new_id = self.model.create(player_name, distance, rings)
        record = self.model.get_by_id(new_id)

        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'distance': record.get('distance'),
                'rings': record.get('rings'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100

        records = self.model.get_leaderboard(limit)
        leaderboard = []
        for idx, record in enumerate(records):
            leaderboard.append({
                'rank': idx + 1,
                'player_name': record.get('player_name'),
                'distance': record.get('distance'),
                'rings': record.get('rings'),
                'created_at': record.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': leaderboard
        }

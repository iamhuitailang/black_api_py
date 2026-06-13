from typing import Dict, Any, List
from app.model.archer import ArcherScoreModel


class ArcherBusiness:
    def __init__(self):
        self.model = ArcherScoreModel()

    def submit_score(self, player_name: str, wave: int, score: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        if len(player_name) > 50:
            return {
                'code': 1,
                'message': 'Player name too long (max 50 characters)',
                'data': None
            }

        if wave < 0 or wave > 100:
            return {
                'code': 1,
                'message': 'Invalid wave number',
                'data': None
            }

        if score < 0 or score > 1000000:
            return {
                'code': 1,
                'message': 'Invalid score',
                'data': None
            }

        new_id = self.model.create(player_name, wave, score)
        record = self.model.get_by_id(new_id)

        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'wave': record.get('wave'),
                'score': record.get('score'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100

        scores = self.model.get_top_scores(limit)
        result = []
        for i, score in enumerate(scores):
            result.append({
                'rank': i + 1,
                'player_name': score.get('player_name'),
                'wave': score.get('wave'),
                'score': score.get('score'),
                'created_at': score.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result,
                'total': self.model.count()
            }
        }

    def get_player_best(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        record = self.model.get_player_best(player_name.strip())
        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_name': record.get('player_name'),
                    'wave': record.get('wave'),
                    'score': record.get('score'),
                    'created_at': record.get('created_at')
                }
            }

        return {
            'code': 0,
            'message': 'No record found',
            'data': None
        }

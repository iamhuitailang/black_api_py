from typing import Dict, Any, List, Optional
from app.model.tower_defense import TowerDefenseScoreModel


class TowerDefenseBusiness:
    def __init__(self):
        self.model = TowerDefenseScoreModel()

    def submit_score(self, player_name: str, wave_cleared: int, score: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        if len(player_name) > 50:
            player_name = player_name[:50]

        if wave_cleared is None or wave_cleared < 0:
            wave_cleared = 0

        if score is None or score < 0:
            score = 0

        new_id = self.model.create(player_name, wave_cleared, score)
        record = self.model.get_by_id(new_id)

        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'wave_cleared': record.get('wave_cleared'),
                'score': record.get('score'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100

        scores = self.model.get_top_scores(limit)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': scores,
                'count': len(scores)
            }
        }

    def get_all_scores(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result['items'],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

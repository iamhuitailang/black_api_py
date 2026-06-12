from typing import Dict, Any
from app.model.asteroid import AsteroidScoreModel


class AsteroidBusiness:
    def __init__(self):
        self.model = AsteroidScoreModel()

    def submit_score(self, player_name: str, score: int, wave: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {'code': 1, 'message': 'Player name cannot be empty', 'data': None}
        player_name = player_name.strip()[:20]
        if score < 0 or wave < 0:
            return {'code': 1, 'message': 'Invalid score or wave', 'data': None}
        new_id = self.model.create(player_name, score, wave)
        return {
            'code': 0,
            'message': 'success',
            'data': {'id': new_id, 'player_name': player_name, 'score': score, 'wave': wave}
        }

    def get_leaderboard(self) -> Dict[str, Any]:
        items = self.model.get_top20()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': len(items)
            }
        }

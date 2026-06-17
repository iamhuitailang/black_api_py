import json
from typing import Dict, Any
from app.model.game import ProgressModel


class ProgressBusiness:
    def __init__(self):
        self.model = ProgressModel()

    def get_progress(self, player_id: str = 'default') -> Dict[str, Any]:
        progress = self.model.get_by_player_id(player_id)

        if not progress:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_id': player_id,
                    'bio_samples': 0,
                    'completed_levels': [],
                    'tower_upgrades': {}
                }
            }

        completed_levels = []
        try:
            completed_levels = json.loads(progress.get('completed_levels', '[]'))
        except (json.JSONDecodeError, TypeError):
            completed_levels = []

        tower_upgrades = {}
        try:
            tower_upgrades = json.loads(progress.get('tower_upgrades', '{}'))
        except (json.JSONDecodeError, TypeError):
            tower_upgrades = {}

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'player_id': progress.get('player_id'),
                'bio_samples': progress.get('bio_samples'),
                'completed_levels': completed_levels,
                'tower_upgrades': tower_upgrades,
                'updated_at': progress.get('updated_at')
            }
        }

    def save_progress(self, player_id: str = 'default', bio_samples: int = 0,
                      completed_levels: list = None, tower_upgrades: dict = None) -> Dict[str, Any]:
        if completed_levels is None:
            completed_levels = []
        if tower_upgrades is None:
            tower_upgrades = {}

        try:
            completed_levels_str = json.dumps(completed_levels)
            tower_upgrades_str = json.dumps(tower_upgrades)
        except (TypeError, ValueError) as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

        self.model.upsert(
            player_id=player_id,
            bio_samples=bio_samples,
            completed_levels=completed_levels_str,
            tower_upgrades=tower_upgrades_str
        )

        return self.get_progress(player_id)

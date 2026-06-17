import json
from typing import Dict, Any, List
from app.model.game import LevelModel, ProgressModel


class LevelBusiness:
    def __init__(self):
        self.model = LevelModel()
        self.progress_model = ProgressModel()

    def get_levels(self, player_id: str = 'default') -> Dict[str, Any]:
        levels = self.model.get_all()
        progress = self.progress_model.get_by_player_id(player_id)
        completed_levels = []
        if progress:
            try:
                completed_levels = json.loads(progress.get('completed_levels', '[]'))
            except (json.JSONDecodeError, TypeError):
                completed_levels = []

        result = []
        for level in levels:
            level_id = level.get('id')
            is_unlocked = level_id == 1 or level_id in completed_levels
            is_completed = level_id in completed_levels
            result.append({
                'id': level_id,
                'name': level.get('name'),
                'difficulty': level.get('difficulty'),
                'wave_count': level.get('wave_count'),
                'is_unlocked': is_unlocked,
                'is_completed': is_completed
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_level_detail(self, level_id: int) -> Dict[str, Any]:
        level = self.model.get_by_id(level_id)
        if not level:
            return {
                'code': 1,
                'message': 'Level not found',
                'data': None
            }

        map_config = None
        try:
            map_config = json.loads(level.get('map_config', ''))
        except (json.JSONDecodeError, TypeError):
            map_config = None

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': level.get('id'),
                'name': level.get('name'),
                'difficulty': level.get('difficulty'),
                'wave_count': level.get('wave_count'),
                'map_config': map_config
            }
        }

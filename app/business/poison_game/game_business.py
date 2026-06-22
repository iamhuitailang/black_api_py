from typing import Dict, Any, List, Optional
from app.model.poison_game import GameRecordModel, PlayerProgressModel


class PoisonGameBusiness:
    def __init__(self):
        self.record_model = GameRecordModel()
        self.progress_model = PlayerProgressModel()

    def get_progress(self, player_id: str) -> Dict[str, Any]:
        if not player_id:
            return {
                'code': 1,
                'message': 'player_id is required',
                'data': None
            }

        progress = self.progress_model.get_by_player(player_id)
        if progress:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_id': progress.get('player_id'),
                    'unlocked_level': progress.get('unlocked_level', 1),
                    'total_completions': progress.get('total_completions', 0),
                    'last_played': progress.get('last_played')
                }
            }

        return {
            'code': 1,
            'message': 'Failed to get player progress',
            'data': None
        }

    def get_records(self, player_id: str, level: int = None) -> Dict[str, Any]:
        if not player_id:
            return {
                'code': 1,
                'message': 'player_id is required',
                'data': None
            }

        records = self.record_model.get_by_player(player_id, level)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_best_record(self, player_id: str, level: int) -> Dict[str, Any]:
        if not player_id or not level:
            return {
                'code': 1,
                'message': 'player_id and level are required',
                'data': None
            }

        if level < 1 or level > 12:
            return {
                'code': 1,
                'message': 'Level must be between 1 and 12',
                'data': None
            }

        record = self.record_model.get_best_by_level(player_id, level)
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def submit_record(self, player_id: str, level: int, completion_time: float,
                      purification_found: int, purification_total: int,
                      death_count: int = 0) -> Dict[str, Any]:
        if not player_id:
            return {
                'code': 1,
                'message': 'player_id is required',
                'data': None
            }

        if level < 1 or level > 12:
            return {
                'code': 1,
                'message': 'Level must be between 1 and 12',
                'data': None
            }

        if completion_time <= 0:
            return {
                'code': 1,
                'message': 'Completion time must be positive',
                'data': None
            }

        if purification_found < 0 or purification_total < 0:
            return {
                'code': 1,
                'message': 'Purification counts cannot be negative',
                'data': None
            }

        record_id = self.record_model.create(
            player_id=player_id,
            level=level,
            completion_time=completion_time,
            purification_found=purification_found,
            purification_total=purification_total,
            death_count=death_count
        )

        self.progress_model.increment_completions(player_id)

        next_level = level + 1
        if next_level <= 12:
            self.progress_model.update_unlocked_level(player_id, next_level)

        self.progress_model.update_last_played(player_id)

        record = self.record_model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'Record saved successfully',
            'data': record
        }

    def get_all_records(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.record_model.paginate(page=page, page_size=page_size)
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

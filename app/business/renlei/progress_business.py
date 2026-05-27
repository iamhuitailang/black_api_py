from typing import Dict, Any
from app.model.renlei import UserProgressModel


class ProgressBusiness:
    def __init__(self):
        self.model = UserProgressModel()

    def get_my_progress(self, user_id: int) -> Dict[str, Any]:
        progresses = self.model.get_by_user(user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'id': p['id'],
                'level_id': p['level_id'],
                'is_completed': p['is_completed'],
                'best_time': p['best_time'],
                'attempts': p['attempts'],
                'completed_at': p['completed_at']
            } for p in progresses]
        }

    def get_level_progress(self, user_id: int, level_id: int) -> Dict[str, Any]:
        progress = self.model.get_or_create(user_id, level_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': progress['id'],
                'level_id': progress['level_id'],
                'is_completed': progress['is_completed'],
                'best_time': progress['best_time'],
                'attempts': progress['attempts'],
                'completed_at': progress['completed_at']
            }
        }

    def increment_attempts(self, user_id: int, level_id: int) -> Dict[str, Any]:
        progress = self.model.increment_attempts(user_id, level_id)
        return {'code': 0, 'message': 'success', 'data': {'attempts': progress['attempts']}}

    def complete_level(self, user_id: int, level_id: int, completion_time: float = None) -> Dict[str, Any]:
        progress = self.model.complete_level(user_id, level_id, completion_time)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'is_completed': progress['is_completed'],
                'best_time': progress['best_time'],
                'attempts': progress['attempts']
            }
        }

    def get_completed_levels(self, user_id: int) -> Dict[str, Any]:
        completed = self.model.get_completed_by_user(user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': [{
                'level_id': p['level_id'],
                'best_time': p['best_time'],
                'attempts': p['attempts'],
                'completed_at': p['completed_at']
            } for p in completed]
        }

from typing import Dict, Any, List, Optional
from app.model.corridor import LeaderboardModel


class LeaderboardBusiness:
    def __init__(self):
        self.model = LeaderboardModel()

    def get_leaderboard(self, limit: int = 20) -> Dict[str, Any]:
        records = self.model.get_top(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_leaderboard_paginated(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.get_all_paginated(page, page_size)
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

    def submit_score(self, player_name: str, total_time: float,
                     segment_times: List[float], weapon_preference: str,
                     final_hp: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        if total_time <= 0:
            return {
                'code': 1,
                'message': 'Total time must be positive',
                'data': None
            }

        new_id = self.model.create(
            player_name=player_name.strip(),
            total_time=total_time,
            segment_times=segment_times,
            weapon_preference=weapon_preference,
            final_hp=final_hp
        )

        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': record
        }

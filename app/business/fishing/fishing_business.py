from typing import Dict, Any, List, Optional
from app.model.fishing import FishingScoreModel


class FishingBusiness:
    def __init__(self):
        self.model = FishingScoreModel()

    def submit_score(self, player_name: str, score: int, fish_count: int, biggest_fish: float) -> Dict[str, Any]:
        if not player_name or not str(player_name).strip():
            player_name = 'Anonymous'

        if len(player_name) > 32:
            player_name = player_name[:32]

        try:
            score = int(score)
            fish_count = int(fish_count)
            biggest_fish = float(biggest_fish)
        except (ValueError, TypeError):
            return {
                'code': 1,
                'message': 'Invalid data types',
                'data': None
            }

        if score < 0:
            return {
                'code': 1,
                'message': 'Score cannot be negative',
                'data': None
            }
        if fish_count < 0:
            return {
                'code': 1,
                'message': 'Fish count cannot be negative',
                'data': None
            }
        if biggest_fish < 0:
            return {
                'code': 1,
                'message': 'Biggest fish cannot be negative',
                'data': None
            }

        try:
            new_id = self.model.create(player_name, score, fish_count, biggest_fish)
            record = self.model.get_by_id(new_id)
            return {
                'code': 0,
                'message': 'Score submitted successfully',
                'data': record
            }
        except Exception as e:
            return {
                'code': 1,
                'message': f'Submit failed: {str(e)}',
                'data': None
            }

    def get_leaderboard(self, limit: int = 50, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if limit and limit > 0:
            items = self.model.get_leaderboard(limit)
            for item in items:
                if 'biggest_fish' in item:
                    item['biggest_fish'] = round(item['biggest_fish'], 2)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'total': self.model.count()
                }
            }
        else:
            result = self.model.paginate_leaderboard(page, page_size)
            for item in result['items']:
                if 'biggest_fish' in item:
                    item['biggest_fish'] = round(item['biggest_fish'], 2)
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

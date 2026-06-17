from typing import Dict, Any, List, Optional
from app.model.gear_game import GameRecordModel


class GearGameBusiness:
    def __init__(self):
        self.model = GameRecordModel()

    def save_game_record(self, level: int, score: int, max_combo: int, steps_used: int, is_win: bool) -> Dict[str, Any]:
        if level < 1:
            return {
                'code': 1,
                'message': 'Level must be at least 1',
                'data': None
            }
        
        if score < 0:
            return {
                'code': 1,
                'message': 'Score cannot be negative',
                'data': None
            }
        
        if max_combo < 0:
            return {
                'code': 1,
                'message': 'Max combo cannot be negative',
                'data': None
            }
        
        if steps_used < 0:
            return {
                'code': 1,
                'message': 'Steps used cannot be negative',
                'data': None
            }
        
        new_id = self.model.create(level, score, max_combo, steps_used, is_win)
        record = self.model.get_by_id(new_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': record.get('id'),
                'level': record.get('level'),
                'score': record.get('score'),
                'max_combo': record.get('max_combo'),
                'steps_used': record.get('steps_used'),
                'is_win': bool(record.get('is_win')),
                'created_at': record.get('created_at')
            }
        }

    def get_highest_score(self, level: int = None) -> Dict[str, Any]:
        record = self.model.get_highest_score(level)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'score': record.get('score') if record else 0,
                'level': record.get('level') if record else None,
                'max_combo': record.get('max_combo') if record else 0,
                'created_at': record.get('created_at') if record else None
            }
        }

    def get_highest_combo(self, level: int = None) -> Dict[str, Any]:
        record = self.model.get_highest_combo(level)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'max_combo': record.get('max_combo') if record else 0,
                'score': record.get('score') if record else 0,
                'level': record.get('level') if record else None,
                'created_at': record.get('created_at') if record else None
            }
        }

    def get_records(self, level: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(level, page, page_size)
        items = []
        for item in result['items']:
            items.append({
                'id': item.get('id'),
                'level': item.get('level'),
                'score': item.get('score'),
                'max_combo': item.get('max_combo'),
                'steps_used': item.get('steps_used'),
                'is_win': bool(item.get('is_win')),
                'created_at': item.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def get_game_stats(self, level: int = None) -> Dict[str, Any]:
        highest_score = self.model.get_highest_score(level)
        highest_combo = self.model.get_highest_combo(level)
        total_games = self.model.count(level)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'highest_score': highest_score.get('score') if highest_score else 0,
                'highest_combo': highest_combo.get('max_combo') if highest_combo else 0,
                'total_games': total_games
            }
        }

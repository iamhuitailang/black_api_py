from typing import Dict, Any, List, Optional
from app.model.ski_game import GameScoreModel


class SkiGameBusiness:
    def __init__(self):
        self.model = GameScoreModel()

    def submit_score(self, player_name: str, score: int, distance: float, 
                     max_speed: float, gates_passed: int, slope_level: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }
        
        player_name = player_name.strip()
        
        if score < 0:
            return {
                'code': 1,
                'message': 'Score cannot be negative',
                'data': None
            }
        
        new_id = self.model.create(player_name, score, distance, max_speed, gates_passed, slope_level)
        record = self.model.get_by_id(new_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def get_top_scores(self, limit: int = 10) -> Dict[str, Any]:
        if limit <= 0:
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

    def get_score_by_id(self, record_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(record_id)
        
        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': record
            }
        
        return {
            'code': 1,
            'message': 'Score not found',
            'data': None
        }

    def get_score_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
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

    def delete_score(self, record_id: int) -> Dict[str, Any]:
        if not record_id:
            return {
                'code': 1,
                'message': 'Record id is required',
                'data': None
            }
        
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }
        
        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }

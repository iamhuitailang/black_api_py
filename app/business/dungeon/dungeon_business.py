from typing import Dict, Any, List, Optional
from app.model.dungeon import DungeonScoreModel


class DungeonBusiness:
    def __init__(self):
        self.model = DungeonScoreModel()

    def submit_score(self, player_name: str, depth: int, kills: int, gold: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }
        
        player_name = player_name.strip()[:50]
        
        if depth < 0:
            depth = 0
        if kills < 0:
            kills = 0
        if gold < 0:
            gold = 0
        
        new_id = self.model.create(player_name, depth, kills, gold)
        record = self.model.get_by_id(new_id)
        
        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'depth': record.get('depth'),
                'kills': record.get('kills'),
                'gold': record.get('gold'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 10, sort_by: str = 'gold') -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100
        
        if sort_by == 'depth':
            scores = self.model.get_top_by_depth(limit)
        else:
            scores = self.model.get_top_scores(limit)
        
        formatted_scores = []
        for idx, score in enumerate(scores):
            formatted_scores.append({
                'rank': idx + 1,
                'id': score.get('id'),
                'player_name': score.get('player_name'),
                'depth': score.get('depth'),
                'kills': score.get('kills'),
                'gold': score.get('gold'),
                'created_at': score.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'scores': formatted_scores,
                'total': self.model.count(),
                'sort_by': sort_by
            }
        }

    def get_player_best(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }
        
        player_name = player_name.strip()
        record = self.model.get_player_best(player_name)
        
        if not record:
            return {
                'code': 0,
                'message': 'No records found for this player',
                'data': None
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'depth': record.get('depth'),
                'kills': record.get('kills'),
                'gold': record.get('gold'),
                'created_at': record.get('created_at')
            }
        }

    def get_scores_paginated(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        
        formatted_items = []
        for idx, item in enumerate(result['items']):
            formatted_items.append({
                'rank': (page - 1) * page_size + idx + 1,
                'id': item.get('id'),
                'player_name': item.get('player_name'),
                'depth': item.get('depth'),
                'kills': item.get('kills'),
                'gold': item.get('gold'),
                'created_at': item.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': formatted_items,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

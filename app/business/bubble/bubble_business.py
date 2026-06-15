from typing import Dict, Any, List, Optional
from app.model.bubble import BubbleScoreModel


class BubbleBusiness:
    def __init__(self):
        self.model = BubbleScoreModel()

    def submit_score(self, player_name: str, score: int, level: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        if len(player_name) > 50:
            player_name = player_name[:50]

        if score < 0:
            score = 0
        if level < 1:
            level = 1
        if level > 8:
            level = 8

        new_id = self.model.create(player_name, score, level)
        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'level': record.get('level'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, limit: int = 100) -> Dict[str, Any]:
        if limit < 1:
            limit = 1
        if limit > 500:
            limit = 500

        records = self.model.get_leaderboard(limit)
        items = []
        for idx, record in enumerate(records):
            items.append({
                'rank': idx + 1,
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'level': record.get('level'),
                'created_at': record.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': len(items)
            }
        }

    def get_leaderboard_paginated(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
        if page_size > 100:
            page_size = 100

        result = self.model.paginate(page, page_size)
        items = []
        rank_start = (page - 1) * page_size
        for idx, record in enumerate(result['items']):
            items.append({
                'rank': rank_start + idx + 1,
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'level': record.get('level'),
                'created_at': record.get('created_at')
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

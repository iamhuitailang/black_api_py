from typing import Dict, Any, List, Optional
from app.model.cyber_ninja import ScoreModel


class CyberNinjaBusiness:
    def __init__(self):
        self.model = ScoreModel()

    def submit_score(self, player_name: str, score: int, level: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            player_name = "匿名忍者"
        
        player_name = player_name.strip()[:20]
        
        if score < 0:
            score = 0
        
        if level < 1:
            level = 1
        
        new_id = self.model.create(player_name, score, level)
        record = self.model.get_by_id(new_id)
        
        if record:
            return {
                'code': 0,
                'message': '成绩提交成功',
                'data': {
                    'id': record.get('id'),
                    'player_name': record.get('player_name'),
                    'score': record.get('score'),
                    'level': record.get('level'),
                    'created_at': record.get('created_at')
                }
            }
        
        return {
            'code': 1,
            'message': '提交失败',
            'data': None
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100
        
        scores = self.model.get_top_scores(limit)
        
        formatted_scores = []
        for idx, score in enumerate(scores, 1):
            formatted_scores.append({
                'rank': idx,
                'id': score.get('id'),
                'player_name': score.get('player_name'),
                'score': score.get('score'),
                'level': score.get('level'),
                'created_at': score.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': formatted_scores,
                'total': len(formatted_scores)
            }
        }

    def get_player_best(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': '玩家名称不能为空',
                'data': None
            }
        
        player_name = player_name.strip()
        record = self.model.get_player_best(player_name)
        
        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': record.get('id'),
                    'player_name': record.get('player_name'),
                    'score': record.get('score'),
                    'level': record.get('level'),
                    'created_at': record.get('created_at')
                }
            }
        
        return {
            'code': 0,
            'message': '暂无记录',
            'data': None
        }

    def get_all_scores(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        
        formatted_items = []
        for idx, item in enumerate(result['items'], 1):
            formatted_items.append({
                'rank': (page - 1) * page_size + idx,
                'id': item.get('id'),
                'player_name': item.get('player_name'),
                'score': item.get('score'),
                'level': item.get('level'),
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

from typing import Dict, Any
from app.model.danzhu_model import ScoreModel


class DanzhuScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()

    def get_top_scores(self, level_id: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_top_scores(level_id, page, page_size)
        items = [self.score_model.to_dict(score) for score in result.get('items', [])]

        for idx, item in enumerate(items):
            item['rank'] = (page - 1) * page_size + idx + 1

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_user_scores(user_id, page, page_size)
        items = [self.score_model.to_dict(score) for score in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_high_score(self, user_id: int) -> Dict[str, Any]:
        score = self.score_model.get_user_high_score(user_id)
        if score:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.score_model.to_dict(score)
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

    def get_user_rank(self, user_id: int, level_id: int = None) -> Dict[str, Any]:
        rank = self.score_model.get_user_rank(user_id, level_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'rank': rank
            }
        }

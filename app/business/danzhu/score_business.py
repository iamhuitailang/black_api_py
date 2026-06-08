from typing import Dict, Any, List, Optional
from app.model.danzhu import ScoreModel
from app.business.auth import AuthBusiness


class ScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()
        self.auth_business = AuthBusiness()

    def submit_score(self, token: str, score: int,
                     highest_combo: int = 0,
                     level_id: int = 1,
                     level_name: str = '默认关卡',
                     balls_used: int = 0) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        if score < 0:
            return {
                'code': 1,
                'message': '分数无效',
                'data': None
            }

        user_id = user.get('id')
        username = user.get('username', '')

        record_id = self.score_model.create(
            user_id=user_id,
            username=username,
            score=score,
            highest_combo=highest_combo,
            level_id=level_id,
            level_name=level_name,
            balls_used=balls_used
        )

        if record_id > 0:
            rank = self.score_model.get_user_rank(user_id, 'all')
            return {
                'code': 0,
                'message': '提交成功',
                'data': {
                    'id': record_id,
                    'rank': rank
                }
            }

        return {
            'code': 1,
            'message': '提交失败',
            'data': None
        }

    def get_leaderboard(self, period: str = 'all', limit: int = 50) -> Dict[str, Any]:
        if period not in ['all', 'daily', 'weekly']:
            period = 'all'
        if limit < 1 or limit > 100:
            limit = 50

        scores = self.score_model.get_top_scores(limit=limit, period=period)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': scores,
                'total': len(scores),
                'period': period
            }
        }

    def get_user_best(self, token: str) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        best = self.score_model.get_user_best(user.get('id'))
        rank = self.score_model.get_user_rank(user.get('id'), 'all')

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'best_score': best,
                'rank': rank
            }
        }

    def get_user_scores(self, token: str, limit: int = 20) -> Dict[str, Any]:
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        scores = self.score_model.get_user_scores(user.get('id'), limit=limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': scores,
                'total': len(scores)
            }
        }

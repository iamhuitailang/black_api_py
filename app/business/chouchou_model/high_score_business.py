from typing import Dict, Any, List
from app.model.chouchou_model import HighScoreModel


class HighScoreBusiness:
    def __init__(self):
        self.high_score_model = HighScoreModel()

    def get_user_best(self, user_id: int, score_type: str = None) -> Dict[str, Any]:
        if score_type:
            best = self.high_score_model.get_user_best(user_id, score_type)
            if best:
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': self.high_score_model.to_dict(best)
                }
            return {
                'code': 1,
                'msg': '暂无记录',
                'data': None
            }
        else:
            scores = self.high_score_model.get_user_all_best(user_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': scores
            }

    def get_leaderboard(self, score_type: str, limit: int = 10) -> Dict[str, Any]:
        scores = self.high_score_model.get_leaderboard(score_type, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.high_score_model.to_dict(s) for s in scores]
        }

    def get_all_leaderboards(self, limit: int = 10) -> Dict[str, Any]:
        boards = self.high_score_model.get_all_leaderboards(limit)
        result = {}
        for score_type, scores in boards.items():
            result[score_type] = [self.high_score_model.to_dict(s) for s in scores]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_and_update(self, user_id: int, score_type: str, score: int,
                         game_id: int = None, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        result = self.high_score_model.check_and_update_high_score(
            user_id, score_type, score, game_id, metadata
        )
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_score_types(self) -> Dict[str, Any]:
        types = [
            {'code': HighScoreModel.TYPE_SINGLE_GAME, 'name': '单局最高分'},
            {'code': HighScoreModel.TYPE_TOTAL_SCORE, 'name': '累计总积分'},
            {'code': HighScoreModel.TYPE_WIN_STREAK, 'name': '连胜场次'},
            {'code': HighScoreModel.TYPE_GAMES_WON, 'name': '获胜场次'}
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': types
        }

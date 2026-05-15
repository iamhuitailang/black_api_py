from typing import Dict, Any, List, Optional
from app.model.ranking import LeaderboardConfigModel, ScoreRecordModel, UserModel


class ScoreBusiness:
    def __init__(self):
        self.config_model = LeaderboardConfigModel()
        self.score_model = ScoreRecordModel()
        self.user_model = UserModel()

    def submit_score(self, user_id: int, game_type: str, period: str,
                     score: int, ip_address: str = '') -> Dict[str, Any]:
        leaderboard = self.config_model.get_by_game_and_period(game_type, period)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        if score < 0:
            return {
                'code': 1,
                'msg': '分数不能为负数',
                'data': None
            }

        submit_count = self.score_model.get_submit_count(user_id, leaderboard['id'], minutes=5)
        if submit_count >= 10:
            return {
                'code': 1,
                'msg': '提交过于频繁，请5分钟后再试',
                'data': None
            }

        if ip_address:
            ip_user_count = self.score_model.get_user_count_by_ip(ip_address, minutes=5)
            if ip_user_count >= 5:
                return {
                    'code': 1,
                    'msg': '同一IP提交过于频繁',
                    'data': None
                }

        record_id = self.score_model.create(user_id, leaderboard['id'], score, ip_address)
        if record_id > 0:
            rank = self.score_model.get_user_rank(user_id, leaderboard['id'])
            return {
                'code': 0,
                'msg': '提交成功',
                'data': {
                    'score': score,
                    'rank': rank,
                    'record_id': record_id
                }
            }

        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }

    def get_leaderboard(self, game_type: str, period: str, limit: int = 100) -> Dict[str, Any]:
        leaderboard = self.config_model.get_by_game_and_period(game_type, period)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        scores = self.score_model.get_leaderboard_scores(leaderboard['id'], limit)

        unique_scores = []
        seen_users = set()
        for score in scores:
            if score['user_id'] not in seen_users:
                seen_users.add(score['user_id'])
                unique_scores.append({
                    'rank': len(unique_scores) + 1,
                    'user_id': score['user_id'],
                    'username': score['username'],
                    'avatar': score['avatar'],
                    'score': score['score'],
                    'created_at': score['created_at']
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'leaderboard': leaderboard,
                'scores': unique_scores[:limit]
            }
        }

    def get_user_rank_and_score(self, user_id: int, game_type: str, period: str) -> Dict[str, Any]:
        leaderboard = self.config_model.get_by_game_and_period(game_type, period)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        best_score = self.score_model.get_user_best_score(user_id, leaderboard['id'])
        rank = self.score_model.get_user_rank(user_id, leaderboard['id'])

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'best_score': best_score.get('best_score') if best_score else 0,
                'rank': rank,
                'updated_at': best_score.get('created_at') if best_score else None
            }
        }

    def get_user_history(self, user_id: int, game_type: str = None, limit: int = 20) -> Dict[str, Any]:
        leaderboard_id = None
        if game_type:
            leaderboard = self.config_model.get_by_game_and_period(game_type, 'all')
            if leaderboard:
                leaderboard_id = leaderboard['id']

        history = self.score_model.get_user_history(user_id, leaderboard_id, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': history
        }

    def reset_period_scores(self, game_type: str, period: str) -> Dict[str, Any]:
        if period == 'all':
            return {
                'code': 1,
                'msg': '总榜不能重置',
                'data': None
            }

        leaderboard = self.config_model.get_by_game_and_period(game_type, period)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        deleted_count = self.score_model.clear_old_scores(leaderboard['id'], period)
        return {
            'code': 0,
            'msg': '重置成功',
            'data': {
                'deleted_count': deleted_count
            }
        }

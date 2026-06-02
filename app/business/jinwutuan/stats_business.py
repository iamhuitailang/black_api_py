from typing import Dict, Any, Optional
from app.model.jinwutuan import GameStatsModel, UserModel, ScoreModel


class JinwutuanStatsBusiness:
    def __init__(self):
        self.game_stats_model = GameStatsModel()
        self.user_model = UserModel()
        self.score_model = ScoreModel()

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        stats = self.game_stats_model.get_or_create(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': self.game_stats_model.to_dict(stats)
        }

    def get_dashboard_stats(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count()
        total_songs_sql = "SELECT COUNT(*) as total FROM tb_jinwutuan_model_song"
        total_songs_result = self.score_model.db.fetch_one(total_songs_sql)
        total_songs = total_songs_result['total'] if total_songs_result else 0

        total_scores = self.score_model.query.count()

        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        today_scores_sql = "SELECT COUNT(*) as total FROM tb_jinwutuan_model_score WHERE created_at LIKE ?"
        today_result = self.score_model.db.fetch_one(today_scores_sql, (f'{today}%',))
        total_games_today = today_result['total'] if today_result else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_songs': total_songs,
                'total_scores': total_scores,
                'total_games_today': total_games_today
            }
        }

    def get_leaderboard(self, sort_by: str = 'total_score', page: int = 1,
                        page_size: int = 10) -> Dict[str, Any]:
        allowed_sorts = ['total_score', 'max_combo', 'total_games']
        if sort_by not in allowed_sorts:
            sort_by = 'total_score'

        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.game_stats_model.TABLE_NAME}"
        total_result = self.game_stats_model.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.game_stats_model.TABLE_NAME}
            ORDER BY {sort_by} DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.game_stats_model.db.fetch_all(select_sql)

        leaderboard = []
        for stats in items:
            stats_data = self.game_stats_model.to_dict(stats)
            user = self.user_model.get_by_id(stats.get('user_id'))
            if user:
                stats_data['user'] = self.user_model.to_public_dict(user)
            leaderboard.append(stats_data)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': leaderboard,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def get_recent_scores(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.score_model.TABLE_NAME}"
        total_result = self.score_model.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.score_model.TABLE_NAME}
            ORDER BY created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.score_model.db.fetch_all(select_sql)

        scores = []
        for score in items:
            score_data = self.score_model.to_dict(score)
            user = self.user_model.get_by_id(score.get('user_id'))
            if user:
                score_data['user'] = self.user_model.to_public_dict(user)
            scores.append(score_data)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': scores,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

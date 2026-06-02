from typing import Dict, Any
from app.model.danzhu_model import (
    UserModel, LevelModel, ScoreModel, GameRecordModel,
    AchievementModel, UserAchievementModel
)
from datetime import datetime, timedelta


class DanzhuStatisticsBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.level_model = LevelModel()
        self.score_model = ScoreModel()
        self.game_record_model = GameRecordModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_overview_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count({'status': 0, 'role': 'user'})
        total_admins = self.user_model.query.count({'role': 'admin'})
        total_levels = self.level_model.query.count()
        published_levels = self.level_model.query.count({'status': 1})

        score_stats = self.score_model.get_statistics()

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_admins': total_admins,
                'total_levels': total_levels,
                'published_levels': published_levels,
                'total_games': score_stats.get('total_games', 0),
                'total_score': score_stats.get('total_score', 0),
                'avg_score': score_stats.get('avg_score', 0),
                'max_score': score_stats.get('max_score', 0),
                'total_players': score_stats.get('total_players', 0)
            }
        }

    def get_game_statistics(self, level_id: int = None,
                            start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        stats = self.game_record_model.get_item_hit_statistics(level_id, start_date, end_date)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_score': stats.get('total_score', 0),
                'total_hits': stats.get('total_hits', 0),
                'total_combos': stats.get('total_combos', 0),
                'avg_combo_max': stats.get('avg_combo_max', 0),
                'avg_duration': stats.get('avg_duration', 0),
                'total_games': stats.get('total_games', 0),
                'total_players': stats.get('total_players', 0),
                'start_date': start_date,
                'end_date': end_date
            }
        }

    def get_daily_trend(self, days: int = 7) -> Dict[str, Any]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)

        daily_data = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')

            stats = self.game_record_model.get_item_hit_statistics(
                None, date_str, date_str
            )

            daily_data.append({
                'date': date_str,
                'games': stats.get('total_games', 0),
                'players': stats.get('total_players', 0),
                'score': stats.get('total_score', 0)
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': daily_data
        }

    def get_user_growth(self, days: int = 7) -> Dict[str, Any]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)

        daily_data = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')

            sql = f"""
                SELECT COUNT(*) as count
                FROM {self.user_model.TABLE_NAME}
                WHERE DATE(created_at) = ? AND role = 'user'
            """
            result = self.user_model.db.fetch_one(sql, (date_str,))
            new_users = result.get('count', 0) if result else 0

            sql_total = f"""
                SELECT COUNT(*) as count
                FROM {self.user_model.TABLE_NAME}
                WHERE DATE(created_at) <= ? AND role = 'user'
            """
            result_total = self.user_model.db.fetch_one(sql_total, (date_str,))
            total_users = result_total.get('count', 0) if result_total else 0

            daily_data.append({
                'date': date_str,
                'new_users': new_users,
                'total_users': total_users
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': daily_data
        }

    def get_achievement_statistics(self) -> Dict[str, Any]:
        total_achievements = self.achievement_model.query.count({'status': 0})

        sql = f"""
            SELECT a.id, a.name, COUNT(ua.id) as unlock_count
            FROM {self.achievement_model.TABLE_NAME} a
            LEFT JOIN {self.user_achievement_model.TABLE_NAME} ua ON a.id = ua.achievement_id
            WHERE a.status = 0
            GROUP BY a.id
            ORDER BY unlock_count DESC
            LIMIT 10
        """
        top_achievements = self.achievement_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_achievements': total_achievements,
                'top_achievements': top_achievements
            }
        }

    def get_level_statistics(self) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                l.id,
                l.name,
                l.difficulty,
                l.play_count,
                COUNT(s.id) as game_count,
                AVG(s.score) as avg_score,
                MAX(s.score) as max_score
            FROM {self.level_model.TABLE_NAME} l
            LEFT JOIN {self.score_model.TABLE_NAME} s ON l.id = s.level_id
            WHERE l.status = 1
            GROUP BY l.id
            ORDER BY l.play_count DESC
        """
        level_stats = self.level_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': level_stats
        }

    def get_top_players(self, limit: int = 10) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                u.id,
                u.nickname,
                u.avatar,
                u.highest_score,
                u.total_score,
                u.games_played,
                u.combo_max
            FROM {self.user_model.TABLE_NAME} u
            WHERE u.status = 0 AND u.role = 'user'
            ORDER BY u.highest_score DESC
            LIMIT {limit}
        """
        players = self.user_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': players
        }

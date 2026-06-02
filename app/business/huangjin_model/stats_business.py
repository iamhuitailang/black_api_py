from typing import Dict, Any
from app.model.huangjin_model import GameRecordModel, HuangjinUserModel, OreModel, AchievementModel, UserAchievementModel


class StatsBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()
        self.user_model = HuangjinUserModel()
        self.ore_model = OreModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        game_stats = self.game_record_model.get_statistics()
        today_stats = self.game_record_model.get_today_statistics()
        total_users = self.user_model.query.count()
        total_ores = self.ore_model.query.count({'status': self.ore_model.STATUS_ENABLED})
        total_achievements = self.achievement_model.query.count({'status': self.achievement_model.STATUS_ENABLED})

        recent_records = self.game_record_model.get_recent_records(5)
        recent_items = []
        for record in recent_records:
            user = self.user_model.get_by_id(record.get('user_id'))
            recent_items.append({
                'id': record.get('id'),
                'user_id': record.get('user_id'),
                'username': user.get('username', '') if user else '',
                'nickname': user.get('nickname', '') if user else '',
                'score': record.get('score'),
                'ore_count': record.get('ore_count'),
                'created_at': record.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_games': game_stats.get('total_games', 0),
                'total_score': game_stats.get('total_score', 0),
                'avg_score': round(game_stats.get('avg_score', 0), 1),
                'max_score': game_stats.get('max_score', 0),
                'today_games': today_stats.get('total_games', 0),
                'today_score': today_stats.get('total_score', 0),
                'today_avg_score': round(today_stats.get('avg_score', 0), 1),
                'total_ores': total_ores,
                'total_achievements': total_achievements,
                'recent_records': recent_items
            }
        }

    def get_score_distribution(self) -> Dict[str, Any]:
        sql = f"""
            SELECT
                CASE
                    WHEN score < 50 THEN '0-49'
                    WHEN score < 100 THEN '50-99'
                    WHEN score < 200 THEN '100-199'
                    WHEN score < 500 THEN '200-499'
                    WHEN score < 1000 THEN '500-999'
                    ELSE '1000+'
                END as score_range,
                COUNT(*) as count
            FROM {self.game_record_model.TABLE_NAME}
            GROUP BY score_range
            ORDER BY MIN(score)
        """
        distribution = self.user_model.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': distribution
        }

    def get_ore_stats(self) -> Dict[str, Any]:
        ores = self.ore_model.get_enabled()
        ore_stats = []
        for ore in ores:
            ore_dict = self.ore_model.to_dict(ore)
            ore_stats.append(ore_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': ore_stats
        }

    def get_achievement_stats(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_enabled()
        ach_stats = []
        for ach in achievements:
            ach_dict = self.achievement_model.to_dict(ach)
            unlock_count = self.user_achievement_model.query.count({
                'achievement_id': ach.get('id')
            })
            ach_dict['unlock_count'] = unlock_count
            ach_stats.append(ach_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': ach_stats
        }

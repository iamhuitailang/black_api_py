from typing import Dict, Any
from app.model.doudizhu_model import GameRecordModel, UserModel, AchievementModel, UserAchievementModel


class DoudizhuStatsBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()
        self.user_model = UserModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def get_overall_stats(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count()
        active_users = self.user_model.query.count({'status': 0})
        total_games = self.game_record_model.query.count()
        total_wins = self.game_record_model.query.count({'result': 1})

        total_coins_sql = "SELECT SUM(coins) as total FROM tb_doudizhu_model_users"
        total_coins_result = self.user_model.db.fetch_one(total_coins_sql)
        total_coins = total_coins_result.get('total', 0) if total_coins_result else 0

        total_bombs_sql = "SELECT SUM(bomb_count) as total FROM tb_doudizhu_model_game_records"
        total_bombs_result = self.game_record_model.db.fetch_one(total_bombs_sql)
        total_bombs = total_bombs_result.get('total', 0) if total_bombs_result else 0

        total_achievements = self.achievement_model.query.count({'status': 1})
        total_unlocked = self.user_achievement_model.query.count()

        win_rate = round(total_wins / total_games * 100, 2) if total_games > 0 else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'total_games': total_games,
                'total_wins': total_wins,
                'total_loses': total_games - total_wins,
                'win_rate': win_rate,
                'total_coins': total_coins,
                'total_bombs': total_bombs,
                'total_achievements': total_achievements,
                'total_unlocked_achievements': total_unlocked
            }
        }

    def get_daily_stats(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        sql = f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_games,
                SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as lose_count,
                SUM(score) as total_score,
                SUM(bomb_count) as total_bombs,
                SUM(CASE WHEN is_spring = 1 THEN 1 ELSE 0 END) as spring_count,
                SUM(coins_change) as total_coins_change
            FROM tb_doudizhu_model_game_records
            WHERE {' AND '.join(where_clauses)}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        items = self.game_record_model.db.fetch_all(sql, tuple(params) if params else None)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_difficulty_stats(self) -> Dict[str, Any]:
        sql = """
            SELECT 
                ai_difficulty,
                COUNT(*) as total_games,
                SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as lose_count,
                AVG(score) as avg_score
            FROM tb_doudizhu_model_game_records
            GROUP BY ai_difficulty
            ORDER BY ai_difficulty
        """
        items = self.game_record_model.db.fetch_all(sql)

        difficulty_map = {0: '简单', 1: '普通', 2: '困难'}
        for item in items:
            item['difficulty_text'] = difficulty_map.get(item.get('ai_difficulty', 1), '未知')
            total = item.get('total_games', 0)
            wins = item.get('win_count', 0)
            item['win_rate'] = round(wins / total * 100, 2) if total > 0 else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_role_stats(self) -> Dict[str, Any]:
        sql = """
            SELECT 
                role,
                COUNT(*) as total_games,
                SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as lose_count
            FROM tb_doudizhu_model_game_records
            GROUP BY role
        """
        items = self.game_record_model.db.fetch_all(sql)

        role_map = {0: '农民', 1: '地主'}
        for item in items:
            item['role_text'] = role_map.get(item.get('role', 0), '未知')
            total = item.get('total_games', 0)
            wins = item.get('win_count', 0)
            item['win_rate'] = round(wins / total * 100, 2) if total > 0 else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items
            }
        }

    def get_all_game_records(self, page: int = 1, page_size: int = 20,
                             user_id: int = None, result: int = None,
                             start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result_data = self.game_record_model.get_all(page, page_size, user_id, result, start_date, end_date)
        items = []
        for item in result_data.get('items', []):
            record_dict = self.game_record_model.to_dict(item)
            user = self.user_model.get_by_id(item.get('user_id', 0))
            if user:
                record_dict['user'] = {
                    'id': user.get('id'),
                    'username': user.get('username'),
                    'nickname': user.get('nickname')
                }
            items.append(record_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result_data.get('total'),
                'page': result_data.get('page'),
                'page_size': result_data.get('page_size'),
                'total_pages': result_data.get('total_pages')
            }
        }

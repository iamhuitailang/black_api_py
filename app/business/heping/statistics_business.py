from typing import Dict, Any
from app.common.sqlite.db import get_db
from app.model.heping_model import HepingUserModel, GameRecordModel


class StatisticsBusiness:
    def __init__(self):
        self.db = get_db()

    def get_overview(self) -> Dict[str, Any]:
        user_count_sql = f"SELECT COUNT(*) as total FROM {HepingUserModel.TABLE_NAME}"
        user_result = self.db.fetch_one(user_count_sql)
        total_users = user_result['total'] if user_result else 0

        active_sql = f"SELECT COUNT(*) as total FROM {HepingUserModel.TABLE_NAME} WHERE status = 0"
        active_result = self.db.fetch_one(active_sql)
        active_users = active_result['total'] if active_result else 0

        game_count_sql = f"SELECT COUNT(*) as total FROM {GameRecordModel.TABLE_NAME}"
        game_result = self.db.fetch_one(game_count_sql)
        total_games = game_result['total'] if game_result else 0

        kills_sql = f"SELECT COALESCE(SUM(kills), 0) as total FROM {GameRecordModel.TABLE_NAME}"
        kills_result = self.db.fetch_one(kills_sql)
        total_kills = kills_result['total'] if kills_result else 0

        survive_sql = f"SELECT COALESCE(AVG(survive_time), 0) as avg_time FROM {GameRecordModel.TABLE_NAME}"
        survive_result = self.db.fetch_one(survive_sql)
        avg_survive_time = round(survive_result['avg_time'], 1) if survive_result else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'total_games': total_games,
                'total_kills': total_kills,
                'avg_survive_time': avg_survive_time
            }
        }

    def get_trend(self, days: int = 7) -> Dict[str, Any]:
        sql = f"""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM {GameRecordModel.TABLE_NAME}
            WHERE created_at >= datetime('now', '-{days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """
        items = self.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_weapon_stats(self) -> Dict[str, Any]:
        sql = f"""
            SELECT weapons_used, COUNT(*) as count
            FROM {GameRecordModel.TABLE_NAME}
            WHERE weapons_used IS NOT NULL AND weapons_used != ''
            GROUP BY weapons_used
            ORDER BY count DESC
            LIMIT 20
        """
        items = self.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_map_stats(self) -> Dict[str, Any]:
        sql = f"""
            SELECT map_id, COUNT(*) as count,
                   AVG(rank) as avg_rank,
                   AVG(survive_time) as avg_survive_time
            FROM {GameRecordModel.TABLE_NAME}
            GROUP BY map_id
            ORDER BY count DESC
        """
        items = self.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_growth(self, days: int = 30) -> Dict[str, Any]:
        sql = f"""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM {HepingUserModel.TABLE_NAME}
            WHERE created_at >= datetime('now', '-{days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """
        items = self.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

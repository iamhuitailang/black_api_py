from datetime import datetime
from typing import Dict, Any, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameRecordModel:
    TABLE_NAME = 'tb_heping_model_game_records'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                map_id INTEGER DEFAULT 0,
                rank INTEGER DEFAULT 0,
                kills INTEGER DEFAULT 0,
                damage_dealt REAL DEFAULT 0,
                damage_taken REAL DEFAULT 0,
                survive_time INTEGER DEFAULT 0,
                weapons_used TEXT DEFAULT '[]',
                items_collected TEXT DEFAULT '[]',
                is_win INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_map_id ON {cls.TABLE_NAME}(map_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, map_id: int = 0, rank: int = 0, kills: int = 0,
               damage_dealt: float = 0, damage_taken: float = 0, survive_time: int = 0,
               weapons_used: list = None, items_collected: list = None,
               is_win: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'map_id': map_id,
            'rank': rank,
            'kills': kills,
            'damage_dealt': damage_dealt,
            'damage_taken': damage_taken,
            'survive_time': survive_time,
            'weapons_used': json.dumps(weapons_used or [], ensure_ascii=False),
            'items_collected': json.dumps(items_collected or [], ensure_ascii=False),
            'is_win': is_win,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id,))

        parsed_items = []
        for item in items:
            parsed_item = dict(item)
            if isinstance(parsed_item.get('weapons_used'), str):
                try:
                    parsed_item['weapons_used'] = json.loads(parsed_item['weapons_used'])
                except (json.JSONDecodeError, TypeError):
                    parsed_item['weapons_used'] = []
            if isinstance(parsed_item.get('items_collected'), str):
                try:
                    parsed_item['items_collected'] = json.loads(parsed_item['items_collected'])
                except (json.JSONDecodeError, TypeError):
                    parsed_item['items_collected'] = []
            parsed_items.append(parsed_item)

        return {
            'items': parsed_items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_recent(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            ORDER BY created_at DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql)

    def get_stats_by_user(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT
                COUNT(*) as total_games,
                SUM(kills) as total_kills,
                SUM(deaths) as total_deaths,
                SUM(CASE WHEN is_win = 1 THEN 1 ELSE 0 END) as total_wins,
                AVG(kills) as avg_kills,
                AVG(damage_dealt) as avg_damage_dealt,
                AVG(survive_time) as avg_survive_time,
                MAX(kills) as max_kills,
                MIN(rank) as best_rank
            FROM {self.TABLE_NAME}
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if not result:
            return {
                'total_games': 0,
                'total_kills': 0,
                'total_deaths': 0,
                'total_wins': 0,
                'avg_kills': 0,
                'avg_damage_dealt': 0,
                'avg_survive_time': 0,
                'max_kills': 0,
                'best_rank': 0
            }

        total_kills = result.get('total_kills') or 0
        total_deaths = result.get('total_deaths') or 0
        total_games = result.get('total_games') or 0

        return {
            'total_games': total_games,
            'total_kills': total_kills,
            'total_deaths': total_deaths,
            'total_wins': result.get('total_wins') or 0,
            'avg_kills': round(result.get('avg_kills') or 0, 2),
            'avg_damage_dealt': round(result.get('avg_damage_dealt') or 0, 2),
            'avg_survive_time': round(result.get('avg_survive_time') or 0, 2),
            'max_kills': result.get('max_kills') or 0,
            'best_rank': result.get('best_rank') or 0,
            'kd_ratio': round(total_kills / total_deaths, 2) if total_deaths > 0 else float(total_kills),
            'win_rate': round((result.get('total_wins') or 0) / total_games * 100, 1) if total_games > 0 else 0.0
        }

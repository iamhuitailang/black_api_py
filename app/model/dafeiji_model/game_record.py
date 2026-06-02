from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DafeijiGameRecordModel:
    TABLE_NAME = 'tb_dafeiji_model_game_record'

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
                score INTEGER DEFAULT 0,
                wave INTEGER DEFAULT 1,
                aircraft_id INTEGER DEFAULT 1,
                enemies_killed INTEGER DEFAULT 0,
                items_collected INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_records(self, user_id: int, limit: int = 20) -> list:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC', limit=limit)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def get_total_games(self) -> int:
        return self.query.count({})

    def get_total_score(self) -> int:
        sql = f"SELECT COALESCE(SUM(score), 0) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def get_avg_score(self) -> float:
        sql = f"SELECT COALESCE(AVG(score), 0) as avg FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return round(result.get('avg', 0), 2) if result else 0

    def get_total_enemies_killed(self) -> int:
        sql = f"SELECT COALESCE(SUM(enemies_killed), 0) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def get_total_play_time(self) -> int:
        sql = f"SELECT COALESCE(SUM(play_time), 0) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def get_max_wave(self) -> int:
        sql = f"SELECT COALESCE(MAX(wave), 0) as max_wave FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result.get('max_wave', 0) if result else 0

    def get_daily_stats(self, days: int = 7) -> list:
        sql = f"""
            SELECT DATE(created_at) as date,
                   COUNT(*) as games,
                   COALESCE(SUM(score), 0) as total_score,
                   COALESCE(AVG(score), 0) as avg_score,
                   COALESCE(SUM(enemies_killed), 0) as total_kills
            FROM {self.TABLE_NAME}
            WHERE created_at >= DATE('now', '-{days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        """
        return self.db.fetch_all(sql)

    def get_popular_aircraft(self) -> list:
        sql = f"""
            SELECT aircraft_id, COUNT(*) as usage_count,
                   COALESCE(AVG(score), 0) as avg_score
            FROM {self.TABLE_NAME}
            GROUP BY aircraft_id
            ORDER BY usage_count DESC
            LIMIT 10
        """
        return self.db.fetch_all(sql)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'score': record.get('score', 0),
            'wave': record.get('wave', 1),
            'aircraft_id': record.get('aircraft_id', 1),
            'enemies_killed': record.get('enemies_killed', 0),
            'items_collected': record.get('items_collected', 0),
            'play_time': record.get('play_time', 0),
            'created_at': record.get('created_at')
        }

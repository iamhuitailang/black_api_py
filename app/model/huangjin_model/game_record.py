from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'tb_huangjin_model_game_record'

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
                score INTEGER NOT NULL DEFAULT 0,
                duration INTEGER NOT NULL DEFAULT 60,
                ores_collected TEXT DEFAULT '',
                ore_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at DESC)"
        db.execute(index_sql)

    def create(self, user_id: int, score: int, duration: int = 60,
               ores_collected: str = '', ore_count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'score': score,
            'duration': duration,
            'ores_collected': ores_collected,
            'ore_count': ore_count,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            {'user_id': user_id},
            order_by='created_at DESC'
        )

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_recent_records(self, limit: int = 10) -> list:
        return self.query.find_all(
            fields=['id', 'user_id', 'score', 'duration', 'ore_count', 'created_at'],
            order_by='created_at DESC',
            limit=limit
        )

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total_games, COALESCE(SUM(score), 0) as total_score, COALESCE(AVG(score), 0) as avg_score, COALESCE(MAX(score), 0) as max_score FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result if result else {
            'total_games': 0,
            'total_score': 0,
            'avg_score': 0,
            'max_score': 0
        }

    def get_today_statistics(self) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"SELECT COUNT(*) as total_games, COALESCE(SUM(score), 0) as total_score, COALESCE(AVG(score), 0) as avg_score FROM {self.TABLE_NAME} WHERE created_at LIKE ?"
        result = self.db.fetch_one(sql, (f'{today}%',))
        return result if result else {
            'total_games': 0,
            'total_score': 0,
            'avg_score': 0
        }

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'score': record.get('score'),
            'duration': record.get('duration'),
            'ores_collected': record.get('ores_collected'),
            'ore_count': record.get('ore_count'),
            'created_at': record.get('created_at')
        }

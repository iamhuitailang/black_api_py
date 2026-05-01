from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TankeGameRecordModel:
    TABLE_NAME = 'tb_tank_game_record'

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
                wave INTEGER DEFAULT 1,
                score INTEGER DEFAULT 0,
                killed INTEGER DEFAULT 0,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_played_at ON {cls.TABLE_NAME}(played_at)"
        db.execute(index_sql2)

    def create(self, user_id: int, wave: int, score: int, killed: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'wave': wave,
            'score': score,
            'killed': killed,
            'played_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='played_at DESC'
        )

    def get_user_high_score(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? 
            ORDER BY score DESC 
            LIMIT 1
        """
        result = self.db.fetch_one(sql, (user_id,))
        return result

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.nickname 
            FROM {self.TABLE_NAME} r
            JOIN tb_tank_game_user u ON r.user_id = u.id
            ORDER BY r.score DESC 
            LIMIT {limit}
        """
        return self.db.fetch_all(sql)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'wave': record.get('wave'),
            'score': record.get('score'),
            'killed': record.get('killed'),
            'played_at': record.get('played_at')
        }

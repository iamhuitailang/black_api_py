from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DafeijiLeaderboardModel:
    TABLE_NAME = 'tb_dafeiji_model_leaderboard'

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
                score INTEGER NOT NULL,
                wave INTEGER DEFAULT 1,
                aircraft_id INTEGER DEFAULT 1,
                enemies_killed INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

    def add_record(self, user_id: int, score: int, wave: int = 1, aircraft_id: int = 1,
                   enemies_killed: int = 0, play_time: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'score': score,
            'wave': wave,
            'aircraft_id': aircraft_id,
            'enemies_killed': enemies_killed,
            'play_time': play_time,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_top(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT l.*, u.username, u.nickname, u.avatar
            FROM {self.TABLE_NAME} l
            LEFT JOIN tb_dafeiji_model_user u ON l.user_id = u.id
            ORDER BY l.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def get_user_best(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT l.*, u.username, u.nickname
            FROM {self.TABLE_NAME} l
            LEFT JOIN tb_dafeiji_model_user u ON l.user_id = u.id
            WHERE l.user_id = ?
            ORDER BY l.score DESC
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def get_user_rank(self, user_id: int) -> int:
        best = self.get_user_best(user_id)
        if not best:
            return 0
        sql = f"SELECT COUNT(*) + 1 as rank FROM {self.TABLE_NAME} WHERE score > ?"
        result = self.db.fetch_one(sql, (best.get('score', 0),))
        return result.get('rank', 0) if result else 0

    def get_user_history(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ?
            ORDER BY score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0
        sql = f"""
            SELECT l.*, u.username, u.nickname, u.avatar
            FROM {self.TABLE_NAME} l
            LEFT JOIN tb_dafeiji_model_user u ON l.user_id = u.id
            ORDER BY l.score DESC
            LIMIT ? OFFSET ?
        """
        items = self.db.fetch_all(sql, (page_size, offset))
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'username': record.get('username', ''),
            'nickname': record.get('nickname', ''),
            'avatar': record.get('avatar', ''),
            'score': record.get('score', 0),
            'wave': record.get('wave', 1),
            'aircraft_id': record.get('aircraft_id', 1),
            'enemies_killed': record.get('enemies_killed', 0),
            'play_time': record.get('play_time', 0),
            'created_at': record.get('created_at')
        }

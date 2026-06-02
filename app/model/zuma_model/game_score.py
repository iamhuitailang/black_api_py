from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZumaGameScoreModel:
    TABLE_NAME = 'tb_zuma_model_game_scores'

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
                level INTEGER NOT NULL,
                combo INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                balls_fired INTEGER DEFAULT 0,
                balls_matched INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, score: int, level: int, combo: int = 0,
               duration: int = 0, balls_fired: int = 0, balls_matched: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'score': score,
            'level': level,
            'combo': combo,
            'duration': duration,
            'balls_fired': balls_fired,
            'balls_matched': balls_matched,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(
            page,
            page_size,
            {'user_id': user_id},
            order_by='created_at DESC'
        )

    def get_top_scores(self, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT gs.*, u.username, u.nickname, u.avatar
            FROM {self.TABLE_NAME} gs
            JOIN tb_zuma_model_users u ON gs.user_id = u.id
            WHERE u.status = 0
            ORDER BY gs.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def get_user_best_score(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ?
            ORDER BY score DESC
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

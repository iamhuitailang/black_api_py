from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RecordModel:
    TABLE_NAME = "tb_zashua02_model_record"

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
                level INTEGER DEFAULT 1,
                score INTEGER DEFAULT 0,
                combo INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                character_type TEXT DEFAULT 'clown',
                difficulty TEXT DEFAULT 'normal',
                passed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql)

    def create(self, user_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        defaults = {"level": 1, "score": 0, "combo": 0, "max_combo": 0, "character_type": "clown", "difficulty": "normal", "passed": 0}
        data = {**defaults, **kwargs, "user_id": user_id, "created_at": now}
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {"user_id": user_id}, order_by="created_at DESC")

    def get_high_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.username, u.nickname 
            FROM {self.TABLE_NAME} r 
            LEFT JOIN tb_zashua02_model_user u ON r.user_id = u.id 
            ORDER BY r.score DESC, r.max_combo DESC 
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def list_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by="created_at DESC")

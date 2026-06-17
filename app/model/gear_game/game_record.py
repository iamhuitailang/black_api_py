from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'gear_game_records'
    
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
                level INTEGER NOT NULL,
                score INTEGER NOT NULL,
                max_combo INTEGER NOT NULL,
                steps_used INTEGER NOT NULL,
                is_win INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql2)

    def create(self, level: int, score: int, max_combo: int, steps_used: int, is_win: bool) -> int:
        now = datetime.now().isoformat()
        data = {
            'level': level,
            'score': score,
            'max_combo': max_combo,
            'steps_used': steps_used,
            'is_win': 1 if is_win else 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_highest_score(self, level: int = None) -> Optional[Dict[str, Any]]:
        conditions = {}
        if level is not None:
            conditions['level'] = level
        return self.query.find_one(conditions=conditions, order_by='score DESC')

    def get_highest_combo(self, level: int = None) -> Optional[Dict[str, Any]]:
        conditions = {}
        if level is not None:
            conditions['level'] = level
        return self.query.find_one(conditions=conditions, order_by='max_combo DESC')

    def get_all(self, level: int = None, limit: int = 100) -> List[Dict[str, Any]]:
        conditions = {}
        if level is not None:
            conditions['level'] = level
        return self.query.find_all(conditions=conditions, order_by='score DESC', limit=limit)

    def count(self, level: int = None) -> int:
        conditions = {}
        if level is not None:
            conditions['level'] = level
        return self.query.count(conditions=conditions)

    def paginate(self, level: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {}
        if level is not None:
            conditions['level'] = level
        return self.query.paginate(page, page_size, conditions=conditions, order_by='score DESC')

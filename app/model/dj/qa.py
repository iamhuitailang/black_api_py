from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class QAModel:
    TABLE_NAME = 'tb_dj_qa'

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
                market_id INTEGER,
                question TEXT NOT NULL,
                best_answer TEXT,
                answerer_id INTEGER,
                status INTEGER DEFAULT 1,
                is_answered INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                question_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql1)
        db.execute(index_sql2)
        db.execute(index_sql3)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'user_id': data.get('user_id'),
            'market_id': data.get('market_id'),
            'question': data.get('question'),
            'status': data.get('status', 1),
            'is_answered': 0,
            'created_at': now,
            'question_time': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_market_id(self, market_id: int, limit: int = None) -> List[Dict[str, Any]]:
        return self.query.find_all({'market_id': market_id, 'status': 1}, order_by='created_at DESC', limit=limit)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='created_at DESC')

    def get_pending_questions(self, limit: int = None) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_answered': 0, 'status': 1}, order_by='created_at ASC', limit=limit)

    def get_recent_questions(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': 1}, order_by='created_at DESC', limit=limit)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def answer(self, record_id: int, answer: str, answerer_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'best_answer': answer,
            'answerer_id': answerer_id,
            'is_answered': 1
        }
        return self.update(record_id, data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)

    def search_questions(self, keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE (question LIKE ? OR best_answer LIKE ?) AND status = 1
            ORDER BY created_at DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (f'%{keyword}%', f'%{keyword}%', limit))

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserProgressModel:
    TABLE_NAME = 'tb_renlei_model_user_progress'
    
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
                level_id INTEGER NOT NULL,
                is_completed INTEGER DEFAULT 0,
                best_time REAL,
                attempts INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_level ON {cls.TABLE_NAME}(user_id, level_id)"
        db.execute(index_sql)

    def create(self, user_id: int, level_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level_id': level_id,
            'is_completed': 0,
            'attempts': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_or_create(self, user_id: int, level_id: int) -> Dict[str, Any]:
        progress = self.query.find_one({'user_id': user_id, 'level_id': level_id})
        if not progress:
            self.create(user_id, level_id)
            progress = self.query.find_one({'user_id': user_id, 'level_id': level_id})
        return progress

    def get_by_user_and_level(self, user_id: int, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'level_id': level_id})

    def increment_attempts(self, user_id: int, level_id: int) -> Dict[str, Any]:
        progress = self.get_or_create(user_id, level_id)
        now = datetime.now().isoformat()
        self.exec.update_by_id(progress['id'], {
            'attempts': progress['attempts'] + 1,
            'updated_at': now
        })
        return self.query.find_by_id(progress['id'])

    def complete_level(self, user_id: int, level_id: int, completion_time: float = None) -> Dict[str, Any]:
        progress = self.get_or_create(user_id, level_id)
        now = datetime.now().isoformat()
        update_data = {
            'is_completed': 1,
            'completed_at': now,
            'updated_at': now
        }
        if completion_time:
            if not progress.get('best_time') or completion_time < progress['best_time']:
                update_data['best_time'] = completion_time
        self.exec.update_by_id(progress['id'], update_data)
        return self.query.find_by_id(progress['id'])

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='level_id ASC')

    def get_completed_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_completed': 1}, order_by='level_id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

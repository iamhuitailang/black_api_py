from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class JianshenCheckinModel:
    TABLE_NAME = 'tb_jianshen_checkins'

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
                checkin_date TEXT NOT NULL,
                projects TEXT DEFAULT '',
                details TEXT DEFAULT '',
                duration INTEGER DEFAULT 0,
                calories INTEGER DEFAULT 0,
                remark TEXT DEFAULT '',
                mood TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(checkin_date)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_date ON {cls.TABLE_NAME}(user_id, checkin_date)")

    def create(self, user_id: int, checkin_date: str, projects: str = '',
               details: str = '', duration: int = 0, calories: int = 0,
               remark: str = '', mood: str = '') -> int:
        now = datetime.now().isoformat()
        return self.exec.insert({
            'user_id': user_id,
            'checkin_date': checkin_date,
            'projects': projects,
            'details': details,
            'duration': duration,
            'calories': calories,
            'remark': remark,
            'mood': mood,
            'created_at': now,
            'updated_at': now
        })

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_date(self, user_id: int, checkin_date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'checkin_date': checkin_date}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items()
                       if k in ['projects', 'details', 'duration', 'calories', 'remark', 'mood']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'user_id': user_id}, order_by='checkin_date DESC, id DESC')

    def get_by_user_date_range(self, user_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND checkin_date >= ? AND checkin_date <= ? ORDER BY checkin_date DESC"
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def get_recent(self, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='checkin_date DESC, id DESC', limit=limit)

    def count_by_user(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def sum_duration_by_user(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(duration), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result['total'] if result else 0

    def sum_calories_by_user(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(calories), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result['total'] if result else 0

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if keyword:
            return self.search(keyword, page, page_size, user_id)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10, user_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        where_clauses.append("(remark LIKE ? OR projects LIKE ? OR checkin_date LIKE ?)")
        like = f"%{keyword}%"
        params.extend([like, like, like])
        total_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total = self.db.fetch_one(total_sql, tuple(params))['total']
        select_sql = f"SELECT * FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)} ORDER BY id DESC LIMIT {page_size} OFFSET {offset}"
        items = self.db.fetch_all(select_sql, tuple(params))
        return {'items': items, 'total': total, 'page': page, 'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size}

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        projects = record.get('projects', '')
        try:
            projects_parsed = json.loads(projects) if projects else []
        except (json.JSONDecodeError, TypeError):
            projects_parsed = projects
        details = record.get('details', '')
        try:
            details_parsed = json.loads(details) if details else []
        except (json.JSONDecodeError, TypeError):
            details_parsed = details
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'checkin_date': record.get('checkin_date'),
            'projects': projects_parsed,
            'details': details_parsed,
            'duration': record.get('duration', 0),
            'calories': record.get('calories', 0),
            'remark': record.get('remark', ''),
            'mood': record.get('mood', ''),
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at')
        }

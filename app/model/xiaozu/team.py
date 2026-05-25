from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random
import string


class TeamModel:
    TABLE_NAME = 'tb_xiaozu_teams'

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                owner_id INTEGER NOT NULL,
                invite_code TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_owner_id ON {cls.TABLE_NAME}(owner_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_invite_code ON {cls.TABLE_NAME}(invite_code)"
        db.execute(index_sql2)

    @staticmethod
    def _generate_invite_code() -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

    def create(self, name: str, description: str, owner_id: int) -> int:
        invite_code = self._generate_invite_code()
        while self.query.find_one({'invite_code': invite_code}):
            invite_code = self._generate_invite_code()

        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description or '',
            'owner_id': owner_id,
            'invite_code': invite_code,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_invite_code(self, invite_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'invite_code': invite_code})

    def get_by_owner_id(self, owner_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'owner_id': owner_id}, order_by='id DESC')

    def update(self, team_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in ['name', 'description']}
        return self.exec.update_by_id(team_id, update_data)

    def regenerate_invite_code(self, team_id: int) -> str:
        new_code = self._generate_invite_code()
        while self.query.find_one({'invite_code': new_code}):
            new_code = self._generate_invite_code()

        self.exec.update_by_id(team_id, {'invite_code': new_code})
        return new_code

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        if keyword:
            return self.search(keyword, page, page_size)
        return self.query.paginate(page, page_size, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["name LIKE ?"]
        like_pattern = f"%{keyword}%"
        params = [like_pattern]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

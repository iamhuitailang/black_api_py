from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from datetime import datetime


class SectionModel:
    TABLE_NAME = 'tb_journal_section'

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
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        existing = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if existing and existing['total'] == 0:
            now = datetime.now().isoformat()
            default_sections = [
                ('基础研究', '原创性基础理论研究论文', 1, 1, now, now),
                ('应用技术', '工程技术应用研究', 2, 1, now, now),
                ('综述评论', '学术综述与评论文章', 3, 1, now, now),
                ('研究简报', '简短研究成果报道', 4, 1, now, now),
            ]
            db.execute_many(
                f"INSERT INTO {cls.TABLE_NAME} (name, description, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                default_sections
            )

    def create(self, name: str, description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'sort_order': sort_order,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'status': 1}, order_by='sort_order ASC')

    def update(self, record_id: int, name: str = None, description: str = None,
               sort_order: int = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if name is not None:
            data['name'] = name
        if description is not None:
            data['description'] = description
        if sort_order is not None:
            data['sort_order'] = sort_order
        if status is not None:
            data['status'] = status
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

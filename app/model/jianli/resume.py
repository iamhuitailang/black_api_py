from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ResumeModel:
    TABLE_NAME = 'tb_jianli_resumes'

    STATUS_DRAFT = 0
    STATUS_COMPLETED = 1

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
                template_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                name TEXT DEFAULT '',
                gender TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                birthday TEXT DEFAULT '',
                address TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                job_intention TEXT DEFAULT '',
                expected_salary TEXT DEFAULT '',
                self_evaluation TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                download_count INTEGER DEFAULT 0,
                last_edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_template_id ON {cls.TABLE_NAME}(template_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, template_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'template_id': template_id,
            'title': title,
            'name': '',
            'gender': '',
            'phone': '',
            'email': '',
            'birthday': '',
            'address': '',
            'avatar': '',
            'job_intention': '',
            'expected_salary': '',
            'self_evaluation': '',
            'status': self.STATUS_DRAFT,
            'download_count': 0,
            'last_edited_at': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_id(self, user_id: int, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'id': record_id, 'user_id': user_id})

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='last_edited_at DESC, id DESC'
        )

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'template_id', 'title', 'name', 'gender', 'phone', 'email',
            'birthday', 'address', 'avatar', 'job_intention', 'expected_salary',
            'self_evaluation', 'status'
        ]}
        update_data['updated_at'] = now
        update_data['last_edited_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now,
            'last_edited_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def increment_download_count(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET download_count = download_count + 1, updated_at = ? WHERE id = ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now, record_id))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, user_id, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               user_id: int = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(title LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, resume: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': resume.get('id'),
            'user_id': resume.get('user_id'),
            'template_id': resume.get('template_id'),
            'title': resume.get('title'),
            'name': resume.get('name'),
            'gender': resume.get('gender'),
            'phone': resume.get('phone'),
            'email': resume.get('email'),
            'birthday': resume.get('birthday'),
            'address': resume.get('address'),
            'avatar': resume.get('avatar'),
            'job_intention': resume.get('job_intention'),
            'expected_salary': resume.get('expected_salary'),
            'self_evaluation': resume.get('self_evaluation'),
            'status': resume.get('status'),
            'status_text': self.get_status_text(resume.get('status')),
            'download_count': resume.get('download_count'),
            'last_edited_at': resume.get('last_edited_at'),
            'created_at': resume.get('created_at')
        }

    def count(self) -> int:
        return self.query.count()

    def count_by_user_id(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

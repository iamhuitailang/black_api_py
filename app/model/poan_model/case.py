from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CaseModel:
    TABLE_NAME = 'tb_poan_model_case'

    TANG = 'tang'
    SONG = 'song'
    MING = 'ming'
    QING = 'qing'
    MINGUO = 'minguo'

    ERAS = {
        TANG: '唐朝',
        SONG: '宋朝',
        MING: '明朝',
        QING: '清朝',
        MINGUO: '民国'
    }

    STATUS_DRAFT = 0
    STATUS_ONLINE = 1
    STATUS_OFFLINE = 2

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
                title TEXT NOT NULL,
                era TEXT NOT NULL,
                year TEXT DEFAULT '',
                description TEXT DEFAULT '',
                background_story TEXT DEFAULT '',
                difficulty INTEGER DEFAULT 1,
                cover_image TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_era ON {cls.TABLE_NAME}(era)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, title: str, era: str, year: str = '', description: str = '',
               background_story: str = '', difficulty: int = 1, cover_image: str = '',
               status: int = 0, order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'era': era,
            'year': year,
            'description': description,
            'background_story': background_story,
            'difficulty': difficulty,
            'cover_image': cover_image,
            'status': status,
            'order_num': order_num,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'era', 'year', 'description', 'background_story',
            'difficulty', 'cover_image', 'status', 'order_num'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10, era: str = None,
                 difficulty: int = None, status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if era:
            conditions['era'] = era
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, era, difficulty, status)

        return self.query.paginate(page, page_size, conditions, order_by='order_num ASC, id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               era: str = None, difficulty: int = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if era:
            where_clauses.append("era = ?")
            params.append(era)

        if difficulty is not None:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY order_num ASC, id DESC
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

    def get_online_list(self, page: int = 1, page_size: int = 10, era: str = None,
                        difficulty: int = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_ONLINE}
        if era:
            conditions['era'] = era
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        return self.query.paginate(page, page_size, conditions, order_by='order_num ASC, id DESC')

    def to_dict(self, case: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': case.get('id'),
            'title': case.get('title'),
            'era': case.get('era'),
            'era_name': self.ERAS.get(case.get('era'), '未知'),
            'year': case.get('year'),
            'description': case.get('description'),
            'background_story': case.get('background_story'),
            'difficulty': case.get('difficulty'),
            'cover_image': case.get('cover_image'),
            'status': case.get('status'),
            'order_num': case.get('order_num'),
            'created_at': case.get('created_at'),
            'updated_at': case.get('updated_at')
        }

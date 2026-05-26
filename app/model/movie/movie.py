from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MovieModel:
    TABLE_NAME = 'tb_movie'

    STATUS_SHOWING = 0
    STATUS_COMING = 1
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
                poster TEXT DEFAULT '',
                description TEXT DEFAULT '',
                duration INTEGER DEFAULT 0,
                genre TEXT DEFAULT '',
                director TEXT DEFAULT '',
                actors TEXT DEFAULT '',
                language TEXT DEFAULT '',
                rating REAL DEFAULT 0,
                trailer_url TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                release_date TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_title ON {cls.TABLE_NAME}(title)"
        db.execute(index_sql)

    def create(self, title: str, poster: str = '', description: str = '',
               duration: int = 0, genre: str = '', director: str = '',
               actors: str = '', language: str = '', rating: float = 0,
               trailer_url: str = '', status: int = 0, release_date: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'poster': poster,
            'description': description,
            'duration': duration,
            'genre': genre,
            'director': director,
            'actors': actors,
            'language': language,
            'rating': rating,
            'trailer_url': trailer_url,
            'status': status,
            'release_date': release_date,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'poster', 'description', 'duration', 'genre',
            'director', 'actors', 'language', 'rating', 'trailer_url',
            'status', 'release_date'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None, genre: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword or genre:
            return self.search(keyword, page, page_size, status, genre)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str = None, page: int = 1, page_size: int = 10,
               status: int = None, genre: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if genre:
            where_clauses.append("genre LIKE ?")
            params.append(f"%{genre}%")

        if keyword:
            where_clauses.append("(title LIKE ? OR director LIKE ? OR actors LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

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

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def count_movies(self, status: int = None) -> int:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_SHOWING: '上映中',
            self.STATUS_COMING: '即将上映',
            self.STATUS_OFFLINE: '已下映'
        }
        return status_map.get(status, '未知')
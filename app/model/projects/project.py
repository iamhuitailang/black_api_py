from datetime import datetime
from typing import Dict, Any, List, Optional
import json
import random
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ProjectModel:
    TABLE_NAME = 'projects'

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
                github_url TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                language TEXT,
                stars INTEGER DEFAULT 0,
                tags TEXT DEFAULT '[]',
                priority TEXT DEFAULT 'want_to_read',
                note TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_language ON {cls.TABLE_NAME}(language)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_priority ON {cls.TABLE_NAME}(priority)"
        db.execute(index_sql2)

    def _parse_tags(self, tags_str: Optional[str]) -> List[str]:
        if not tags_str:
            return []
        try:
            return json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            return []

    def _serialize_tags(self, tags: Optional[List[str]]) -> str:
        if tags is None:
            return '[]'
        return json.dumps(tags, ensure_ascii=False)

    def _format_row(self, row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not row:
            return None
        row['tags'] = self._parse_tags(row.get('tags'))
        return row

    def _format_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self._format_row(row) for row in rows]

    def create(self, github_url: str, name: str, description: Optional[str] = None,
               language: Optional[str] = None, stars: int = 0,
               tags: Optional[List[str]] = None, priority: str = 'want_to_read',
               note: Optional[str] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'github_url': github_url,
            'name': name,
            'description': description,
            'language': language,
            'stars': stars,
            'tags': self._serialize_tags(tags),
            'priority': priority,
            'note': note,
            'added_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, project_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(project_id)
        return self._format_row(row)

    def get_by_github_url(self, github_url: str) -> Optional[Dict[str, Any]]:
        row = self.query.find_one(conditions={'github_url': github_url})
        return self._format_row(row)

    def get_all(self, search: Optional[str] = None, language: Optional[str] = None,
                priority: Optional[str] = None, tag: Optional[str] = None,
                order_by: str = 'added_at DESC', limit: int = 1000) -> List[Dict[str, Any]]:
        where_clauses = []
        params: List[Any] = []

        if search:
            where_clauses.append("(name LIKE ? OR note LIKE ?)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])

        if language:
            where_clauses.append("language = ?")
            params.append(language)

        if priority:
            where_clauses.append("priority = ?")
            params.append(priority)

        if tag:
            where_clauses.append("tags LIKE ?")
            params.append(f'%"{tag}"%')

        where_dict = {}
        if where_clauses:
            sql = f"SELECT * FROM {self.TABLE_NAME}"
            sql += f" WHERE {' AND '.join(where_clauses)}"
            sql += f" ORDER BY {order_by}"
            sql += f" LIMIT {limit}"
            rows = self.db.fetch_all(sql, tuple(params))
        else:
            rows = self.query.find_all(order_by=order_by, limit=limit)

        return self._format_rows(rows)

    def get_distinct_languages(self) -> List[str]:
        sql = f"SELECT DISTINCT language FROM {self.TABLE_NAME} WHERE language IS NOT NULL ORDER BY language"
        rows = self.db.fetch_all(sql)
        return [row['language'] for row in rows if row['language']]

    def get_random_want_to_read(self) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE priority = 'want_to_read'"
        rows = self.db.fetch_all(sql)
        if not rows:
            return None
        random_row = random.choice(rows)
        return self._format_row(random_row)

    def update(self, project_id: int, tags: Optional[List[str]] = None,
               priority: Optional[str] = None, note: Optional[str] = None) -> int:
        data: Dict[str, Any] = {}
        if tags is not None:
            data['tags'] = self._serialize_tags(tags)
        if priority is not None:
            data['priority'] = priority
        if note is not None:
            data['note'] = note
        if not data:
            return 0
        return self.exec.update_by_id(project_id, data)

    def delete(self, project_id: int) -> int:
        return self.exec.delete_by_id(project_id)

    def batch_delete(self, ids: List[int]) -> int:
        if not ids:
            return 0
        placeholders = ','.join(['?' for _ in ids])
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE id IN ({placeholders})"
        cursor = self.db.execute(sql, tuple(ids))
        return cursor.rowcount

    def count(self) -> int:
        return self.query.count()

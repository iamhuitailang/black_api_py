from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BqNoteModel:
    TABLE_NAME = 'tb_bq_notes'

    STATUS_NORMAL = 'normal'
    STATUS_DELETED = 'deleted'

    DEFAULT_COLOR = '#FFF9C4'

    COLOR_OPTIONS = [
        {'name': '默认', 'value': '#FFF9C4', 'desc': '淡黄'},
        {'name': '蓝色', 'value': '#E3F2FD', 'desc': '淡蓝'},
        {'name': '绿色', 'value': '#E8F5E9', 'desc': '淡绿'},
        {'name': '粉色', 'value': '#FCE4EC', 'desc': '淡粉'},
        {'name': '紫色', 'value': '#F3E5F5', 'desc': '淡紫'},
        {'name': '橙色', 'value': '#FFF3E0', 'desc': '淡橙'},
    ]

    CATEGORIES = [
        {'code': 'work', 'name': '工作'},
        {'code': 'life', 'name': '生活'},
        {'code': 'study', 'name': '学习'},
        {'code': 'inspiration', 'name': '灵感'},
    ]

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
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                color TEXT DEFAULT '#FFF9C4',
                category TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                is_pinned INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                remind_at TIMESTAMP,
                status TEXT DEFAULT 'normal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_pinned ON {cls.TABLE_NAME}(is_pinned)"
        db.execute(index_sql)

    def _serialize_tags(self, tags: List[str]) -> str:
        if tags is None:
            return '[]'
        return json.dumps(tags, ensure_ascii=False)

    def _deserialize_tags(self, tags_str: str) -> List[str]:
        if not tags_str:
            return []
        try:
            return json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            return []

    def create(self, user_id: int, title: str = '', content: str = '',
               color: str = None, category: str = '', tags: List[str] = None,
               is_pinned: bool = False, is_completed: bool = False,
               remind_at: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title or '',
            'content': content or '',
            'color': color or self.DEFAULT_COLOR,
            'category': category or '',
            'tags': self._serialize_tags(tags),
            'is_pinned': 1 if is_pinned else 0,
            'is_completed': 1 if is_completed else 0,
            'remind_at': remind_at,
            'status': self.STATUS_NORMAL,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_id_and_user(self, record_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'id': record_id, 'user_id': user_id})

    def update(self, note_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'content', 'color', 'category', 'is_pinned', 'is_completed', 'remind_at', 'status'
        ]}
        if 'tags' in data:
            update_data['tags'] = self._serialize_tags(data['tags'])
        update_data['updated_at'] = now
        return self.exec.update_by_id(note_id, update_data)

    def soft_delete(self, note_id: int) -> int:
        return self.update(note_id, {'status': self.STATUS_DELETED})

    def restore(self, note_id: int) -> int:
        return self.update(note_id, {'status': self.STATUS_NORMAL})

    def delete_permanently(self, note_id: int) -> int:
        return self.exec.delete_by_id(note_id)

    def toggle_pin(self, note_id: int, is_pinned: bool) -> int:
        return self.update(note_id, {'is_pinned': 1 if is_pinned else 0})

    def toggle_complete(self, note_id: int, is_completed: bool) -> int:
        return self.update(note_id, {'is_completed': 1 if is_completed else 0})

    def get_user_notes(self, user_id: int, page: int = 1, page_size: int = 20,
                       status: str = STATUS_NORMAL, category: str = None,
                       is_pinned: bool = None, keyword: str = None,
                       tags: List[str] = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'status': status}

        if category:
            conditions['category'] = category

        if is_pinned is not None:
            conditions['is_pinned'] = 1 if is_pinned else 0

        if keyword or tags:
            return self.search_notes(user_id, page, page_size, status, category, is_pinned, keyword, tags)

        order_by = 'is_pinned DESC, updated_at DESC'
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search_notes(self, user_id: int, page: int = 1, page_size: int = 20,
                     status: str = STATUS_NORMAL, category: str = None,
                     is_pinned: bool = None, keyword: str = None,
                     tags: List[str] = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["user_id = ?", "status = ?"]
        params = [user_id, status]

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if is_pinned is not None:
            where_clauses.append("is_pinned = ?")
            params.append(1 if is_pinned else 0)

        if keyword:
            like_pattern = f"%{keyword}%"
            where_clauses.append("(title LIKE ? OR content LIKE ?)")
            params.extend([like_pattern, like_pattern])

        if tags and len(tags) > 0:
            tag_conditions = []
            for tag in tags:
                tag_conditions.append("tags LIKE ?")
                params.append(f'%"{tag}"%')
            where_clauses.append(f"({' OR '.join(tag_conditions)})")

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY is_pinned DESC, updated_at DESC
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

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        total_result = self.db.fetch_one(sql, (user_id, self.STATUS_NORMAL))
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ? AND is_pinned = 1"
        pinned_result = self.db.fetch_one(sql, (user_id, self.STATUS_NORMAL))
        pinned = pinned_result['count'] if pinned_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        trash_result = self.db.fetch_one(sql, (user_id, self.STATUS_DELETED))
        trash = trash_result['count'] if trash_result else 0

        sql = f"SELECT category, COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ? GROUP BY category"
        category_stats = self.db.fetch_all(sql, (user_id, self.STATUS_NORMAL))

        return {
            'total': total,
            'pinned': pinned,
            'trash': trash,
            'category_stats': category_stats
        }

    def get_all_for_export(self, user_id: int) -> List[Dict[str, Any]]:
        items = self.query.find_all(
            {'user_id': user_id},
            order_by='created_at DESC'
        )
        return items

    def batch_restore(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET status = ? WHERE user_id = ? AND status = ?",
            (self.STATUS_NORMAL, user_id, self.STATUS_DELETED)
        )

    def empty_trash(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?",
            (user_id, self.STATUS_DELETED)
        )

    def to_dict(self, note: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': note.get('id'),
            'user_id': note.get('user_id'),
            'title': note.get('title', ''),
            'content': note.get('content', ''),
            'color': note.get('color', self.DEFAULT_COLOR),
            'category': note.get('category', ''),
            'category_name': self.get_category_name(note.get('category', '')),
            'tags': self._deserialize_tags(note.get('tags', '[]')),
            'is_pinned': bool(note.get('is_pinned', 0)),
            'is_completed': bool(note.get('is_completed', 0)),
            'remind_at': note.get('remind_at'),
            'status': note.get('status', self.STATUS_NORMAL),
            'created_at': note.get('created_at'),
            'updated_at': note.get('updated_at')
        }

    def get_category_name(self, category_code: str) -> str:
        for cat in self.CATEGORIES:
            if cat['code'] == category_code:
                return cat['name']
        return ''

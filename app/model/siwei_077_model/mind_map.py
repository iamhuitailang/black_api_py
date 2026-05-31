from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MindMapModel:
    TABLE_NAME = 'tb_siwei_077_model_mind_map'

    STATUS_PRIVATE = 0
    STATUS_PUBLIC = 1
    STATUS_SHARED = 2

    THEME_CLASSIC = 'classic'
    THEME_DARK = 'dark'
    THEME_FRESH = 'fresh'
    THEME_WARM = 'warm'
    THEME_BUSINESS = 'business'
    THEME_TECH = 'tech'

    THEMES = [
        {'code': THEME_CLASSIC, 'name': '经典', 'bg_color': '#ffffff', 'node_color': '#409eff', 'line_color': '#909399'},
        {'code': THEME_DARK, 'name': '暗黑', 'bg_color': '#1e1e1e', 'node_color': '#67c23a', 'line_color': '#606266'},
        {'code': THEME_FRESH, 'name': '清新', 'bg_color': '#f0f9eb', 'node_color': '#67c23a', 'line_color': '#b3e19d'},
        {'code': THEME_WARM, 'name': '温暖', 'bg_color': '#fef0f0', 'node_color': '#f56c6c', 'line_color': '#fab6b6'},
        {'code': THEME_BUSINESS, 'name': '商务', 'bg_color': '#f4f4f5', 'node_color': '#909399', 'line_color': '#c0c4cc'},
        {'code': THEME_TECH, 'name': '科技', 'bg_color': '#0d1117', 'node_color': '#58a6ff', 'line_color': '#30363d'},
    ]

    LAYOUT_RIGHT = 'right'
    LAYOUT_CENTER = 'center'
    LAYOUT_DOWN = 'down'

    LAYOUTS = [
        {'code': LAYOUT_RIGHT, 'name': '向右展开'},
        {'code': LAYOUT_CENTER, 'name': '中心展开'},
        {'code': LAYOUT_DOWN, 'name': '向下展开'},
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
                title TEXT NOT NULL DEFAULT '未命名思维导图',
                description TEXT DEFAULT '',
                theme TEXT DEFAULT 'classic',
                layout TEXT DEFAULT 'right',
                status INTEGER DEFAULT 0,
                is_template INTEGER DEFAULT 0,
                thumbnail TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_template ON {cls.TABLE_NAME}(is_template)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str = '未命名思维导图', description: str = '',
               theme: str = 'classic', layout: str = 'right') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'description': description,
            'theme': theme,
            'layout': layout,
            'status': self.STATUS_PRIVATE,
            'is_template': 0,
            'thumbnail': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, map_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'theme', 'layout', 'status', 'is_template', 'thumbnail'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(map_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if keyword:
            return self.search_by_user(user_id, keyword, page, page_size)
        return self.query.paginate(page, page_size, conditions, order_by='updated_at DESC')

    def search_by_user(self, user_id: int, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["user_id = ?"]
        params = [user_id]
        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY updated_at DESC
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

    def get_public_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_PUBLIC}
        if keyword:
            return self.search_public(keyword, page, page_size)
        return self.query.paginate(page, page_size, conditions, order_by='updated_at DESC')

    def search_public(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["status = ?"]
        params = [self.STATUS_PUBLIC]
        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY updated_at DESC
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

    def get_template_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'is_template': 1}
        return self.query.paginate(page, page_size, conditions, order_by='updated_at DESC')

    def to_dict(self, mind_map: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': mind_map.get('id'),
            'user_id': mind_map.get('user_id'),
            'title': mind_map.get('title'),
            'description': mind_map.get('description'),
            'theme': mind_map.get('theme'),
            'layout': mind_map.get('layout'),
            'status': mind_map.get('status'),
            'is_template': mind_map.get('is_template'),
            'thumbnail': mind_map.get('thumbnail'),
            'created_at': mind_map.get('created_at'),
            'updated_at': mind_map.get('updated_at')
        }

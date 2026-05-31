from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LlkThemeModel:
    TABLE_NAME = 'tb_lianliankan077_model_theme'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                name TEXT NOT NULL UNIQUE,
                icon TEXT NOT NULL,
                description TEXT DEFAULT '',
                items_json TEXT NOT NULL,
                rows INTEGER DEFAULT 4,
                cols INTEGER DEFAULT 6,
                difficulty INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_themes(cls):
        model = cls()
        existing = model.get_by_name('动物世界')
        if not existing:
            model.create(
                name='动物世界',
                icon='🐾',
                description='可爱的动物主题',
                items_json='["🐶","🐱","🐰","🐻","🐼","🐨","🦁","🐯","🦊","🦋","🐢","🐬"]',
                rows=4,
                cols=6,
                difficulty=1,
                sort_order=1
            )

        existing = model.get_by_name('水果乐园')
        if not existing:
            model.create(
                name='水果乐园',
                icon='🍎',
                description='缤纷的水果主题',
                items_json='["🍎","🍊","🍋","🍇","🍓","🍑","🍒","🥝","🍌","🍉","🥭","🍍"]',
                rows=4,
                cols=6,
                difficulty=1,
                sort_order=2
            )

        existing = model.get_by_name('色彩缤纷')
        if not existing:
            model.create(
                name='色彩缤纷',
                icon='🎨',
                description='绚丽的颜色主题',
                items_json='["❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💝","💟","💠"]',
                rows=4,
                cols=6,
                difficulty=2,
                sort_order=3
            )

    def create(self, name: str, icon: str, items_json: str, description: str = '',
               rows: int = 4, cols: int = 6, difficulty: int = 1, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'icon': icon,
            'description': description,
            'items_json': items_json,
            'rows': rows,
            'cols': cols,
            'difficulty': difficulty,
            'status': self.STATUS_ACTIVE,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, theme_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'icon', 'description', 'items_json', 'rows', 'cols', 'difficulty', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(theme_id, update_data)

    def update_status(self, theme_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(theme_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def get_active_themes(self) -> list:
        return self.query.find_all(
            conditions={'status': self.STATUS_ACTIVE},
            order_by='sort_order ASC, id ASC'
        )

    def to_dict(self, theme: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': theme.get('id'),
            'name': theme.get('name'),
            'icon': theme.get('icon'),
            'description': theme.get('description'),
            'items_json': theme.get('items_json'),
            'rows': theme.get('rows'),
            'cols': theme.get('cols'),
            'difficulty': theme.get('difficulty'),
            'status': theme.get('status'),
            'sort_order': theme.get('sort_order'),
            'created_at': theme.get('created_at')
        }

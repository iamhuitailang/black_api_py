from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BackgroundModel:
    TABLE_NAME = 'tb_heka_model_background'

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
                holiday_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                image_url TEXT NOT NULL,
                color TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_holiday_id ON {cls.TABLE_NAME}(holiday_id)"
        db.execute(index_sql)

    @classmethod
    def init_default_backgrounds(cls):
        model = cls()
        if model.count() > 0:
            return

        backgrounds = []
        bg_colors = {
            1: ['#FF0000', '#FFD700', '#FF6B6B', '#FFE4E1'],
            2: ['#FF0000', '#008000', '#FFFFFF', '#C41E3A'],
            3: ['#FF69B4', '#87CEEB', '#FFD700', '#98FB98'],
            4: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB'],
            5: ['#FF8C00', '#8B4513', '#DAA520', '#CD853F'],
            6: ['#FFB6C1', '#FFFFE0', '#98FB98', '#87CEEB'],
            7: ['#FF0000', '#FFD700', '#DC143C', '#FF6347']
        }

        for holiday_id, colors in bg_colors.items():
            for idx, color in enumerate(colors, 1):
                backgrounds.append({
                    'holiday_id': holiday_id,
                    'name': f'背景{idx}',
                    'image_url': '',
                    'color': color,
                    'sort_order': idx
                })

        for bg in backgrounds:
            model.create(**bg)

    def create(self, holiday_id: int, name: str, image_url: str = '', color: str = '',
               sort_order: int = 0, status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'holiday_id': holiday_id,
            'name': name,
            'image_url': image_url,
            'color': color,
            'sort_order': sort_order,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_holiday_id(self, holiday_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'holiday_id': holiday_id, 'status': 1}, order_by='sort_order ASC, id ASC')

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'status': 1}, order_by='holiday_id ASC, sort_order ASC, id ASC')

    def update(self, record_id: int, holiday_id: int = None, name: str = None,
               image_url: str = None, color: str = None, sort_order: int = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if holiday_id is not None:
            data['holiday_id'] = holiday_id
        if name is not None:
            data['name'] = name
        if image_url is not None:
            data['image_url'] = image_url
        if color is not None:
            data['color'] = color
        if sort_order is not None:
            data['sort_order'] = sort_order
        if status is not None:
            data['status'] = status

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count({'status': 1})

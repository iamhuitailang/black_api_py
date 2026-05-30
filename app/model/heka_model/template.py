from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TemplateModel:
    TABLE_NAME = 'tb_heka_model_template'

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
                preview_url TEXT NOT NULL,
                width INTEGER DEFAULT 500,
                height INTEGER DEFAULT 600,
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
    def init_default_templates(cls):
        model = cls()
        if model.count() > 0:
            return

        templates = []

        for holiday_id in range(1, 8):
            template_count = 6 if holiday_id <= 3 else (5 if holiday_id == 4 else 4)
            for i in range(1, template_count + 1):
                templates.append({
                    'holiday_id': holiday_id,
                    'name': f'模板{i}',
                    'image_url': f'/static/heka_web/images/template_{holiday_id}_{i}.png',
                    'preview_url': f'/static/heka_web/images/template_{holiday_id}_{i}_preview.png',
                    'width': 500,
                    'height': 600,
                    'sort_order': i
                })

        for template in templates:
            model.create(**template)

    def create(self, holiday_id: int, name: str, image_url: str, preview_url: str,
               width: int = 500, height: int = 600, sort_order: int = 0, status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'holiday_id': holiday_id,
            'name': name,
            'image_url': image_url,
            'preview_url': preview_url,
            'width': width,
            'height': height,
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
               image_url: str = None, preview_url: str = None,
               width: int = None, height: int = None, sort_order: int = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if holiday_id is not None:
            data['holiday_id'] = holiday_id
        if name is not None:
            data['name'] = name
        if image_url is not None:
            data['image_url'] = image_url
        if preview_url is not None:
            data['preview_url'] = preview_url
        if width is not None:
            data['width'] = width
        if height is not None:
            data['height'] = height
        if sort_order is not None:
            data['sort_order'] = sort_order
        if status is not None:
            data['status'] = status

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count({'status': 1})

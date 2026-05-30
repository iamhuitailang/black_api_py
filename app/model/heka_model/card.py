from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CardModel:
    TABLE_NAME = 'tb_heka_model_card'

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
                template_id INTEGER NOT NULL,
                background_id INTEGER DEFAULT 0,
                title TEXT DEFAULT '',
                message TEXT DEFAULT '',
                signature TEXT DEFAULT '',
                date TEXT DEFAULT '',
                font_family TEXT DEFAULT 'Arial',
                font_size INTEGER DEFAULT 24,
                font_color TEXT DEFAULT '#000000',
                stickers TEXT DEFAULT '[]',
                image_url TEXT DEFAULT '',
                share_code TEXT DEFAULT '',
                view_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_share_code ON {cls.TABLE_NAME}(share_code)"
        db.execute(index_sql)

    def create(self, holiday_id: int, template_id: int, background_id: int = 0,
               title: str = '', message: str = '', signature: str = '', date: str = '',
               font_family: str = 'Arial', font_size: int = 24, font_color: str = '#000000',
               stickers: str = '[]', image_url: str = '', share_code: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'holiday_id': holiday_id,
            'template_id': template_id,
            'background_id': background_id,
            'title': title,
            'message': message,
            'signature': signature,
            'date': date,
            'font_family': font_family,
            'font_size': font_size,
            'font_color': font_color,
            'stickers': stickers,
            'image_url': image_url,
            'share_code': share_code,
            'view_count': 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_share_code(self, share_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'share_code': share_code, 'status': 1})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'status': 1}, order_by='created_at DESC')

    def update(self, record_id: int, holiday_id: int = None, template_id: int = None,
               background_id: int = None, title: str = None, message: str = None,
               signature: str = None, date: str = None, font_family: str = None,
               font_size: int = None, font_color: str = None, stickers: str = None,
               image_url: str = None, share_code: str = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if holiday_id is not None:
            data['holiday_id'] = holiday_id
        if template_id is not None:
            data['template_id'] = template_id
        if background_id is not None:
            data['background_id'] = background_id
        if title is not None:
            data['title'] = title
        if message is not None:
            data['message'] = message
        if signature is not None:
            data['signature'] = signature
        if date is not None:
            data['date'] = date
        if font_family is not None:
            data['font_family'] = font_family
        if font_size is not None:
            data['font_size'] = font_size
        if font_color is not None:
            data['font_color'] = font_color
        if stickers is not None:
            data['stickers'] = stickers
        if image_url is not None:
            data['image_url'] = image_url
        if share_code is not None:
            data['share_code'] = share_code
        if status is not None:
            data['status'] = status

        return self.exec.update_by_id(record_id, data)

    def increment_view_count(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count({'status': 1})

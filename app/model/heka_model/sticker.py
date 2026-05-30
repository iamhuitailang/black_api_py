from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StickerModel:
    TABLE_NAME = 'tb_heka_model_sticker'

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
                category TEXT DEFAULT 'default',
                width INTEGER DEFAULT 50,
                height INTEGER DEFAULT 50,
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
    def init_default_stickers(cls):
        model = cls()
        if model.count() > 0:
            return

        stickers = []
        sticker_names = {
            1: ['灯笼', '鞭炮', '福字', '生肖', '红包', '中国结'],
            2: ['圣诞树', '雪花', '礼物', '驯鹿', '圣诞老人', '铃铛'],
            3: ['蛋糕', '气球', '礼物', '彩带', '蜡烛', '派对帽'],
            4: ['爱心', '玫瑰', '小熊', '巧克力', '戒指'],
            5: ['南瓜', '枫叶', '火鸡', '玉米'],
            6: ['彩蛋', '兔子', '花朵', '篮子'],
            7: ['国旗', '烟花', '天安门', '和平鸽']
        }

        for holiday_id, names in sticker_names.items():
            for idx, name in enumerate(names, 1):
                stickers.append({
                    'holiday_id': holiday_id,
                    'name': name,
                    'image_url': f'/static/heka_web/images/sticker_{holiday_id}_{idx}.png',
                    'category': 'default',
                    'width': 60,
                    'height': 60,
                    'sort_order': idx
                })

        for sticker in stickers:
            model.create(**sticker)

    def create(self, holiday_id: int, name: str, image_url: str, category: str = 'default',
               width: int = 50, height: int = 50, sort_order: int = 0, status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'holiday_id': holiday_id,
            'name': name,
            'image_url': image_url,
            'category': category,
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
               image_url: str = None, category: str = None,
               width: int = None, height: int = None, sort_order: int = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if holiday_id is not None:
            data['holiday_id'] = holiday_id
        if name is not None:
            data['name'] = name
        if image_url is not None:
            data['image_url'] = image_url
        if category is not None:
            data['category'] = category
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

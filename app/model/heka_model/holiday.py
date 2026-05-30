from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class HolidayModel:
    TABLE_NAME = 'tb_heka_model_holiday'

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
                name TEXT NOT NULL,
                emoji TEXT NOT NULL,
                primary_color TEXT NOT NULL,
                secondary_color TEXT NOT NULL,
                elements TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def init_default_holidays(cls):
        model = cls()
        if model.count() > 0:
            return

        holidays = [
            {
                'name': '春节',
                'emoji': '🧧',
                'primary_color': '#FF0000',
                'secondary_color': '#FFD700',
                'elements': '灯笼、鞭炮、福字、生肖',
                'sort_order': 1
            },
            {
                'name': '圣诞节',
                'emoji': '🎄',
                'primary_color': '#FF0000',
                'secondary_color': '#008000',
                'elements': '圣诞树、雪花、礼物、驯鹿',
                'sort_order': 2
            },
            {
                'name': '生日',
                'emoji': '🎂',
                'primary_color': '#FF69B4',
                'secondary_color': '#87CEEB',
                'elements': '蛋糕、气球、礼物、彩带',
                'sort_order': 3
            },
            {
                'name': '情人节',
                'emoji': '💕',
                'primary_color': '#FF69B4',
                'secondary_color': '#FF0000',
                'elements': '爱心、玫瑰、小熊',
                'sort_order': 4
            },
            {
                'name': '感恩节',
                'emoji': '🦃',
                'primary_color': '#FF8C00',
                'secondary_color': '#8B4513',
                'elements': '南瓜、枫叶、火鸡',
                'sort_order': 5
            },
            {
                'name': '复活节',
                'emoji': '🐰',
                'primary_color': '#FFB6C1',
                'secondary_color': '#FFFFE0',
                'elements': '彩蛋、兔子、花朵',
                'sort_order': 6
            },
            {
                'name': '国庆节',
                'emoji': '🇨🇳',
                'primary_color': '#FF0000',
                'secondary_color': '#FFD700',
                'elements': '国旗、烟花、天安门',
                'sort_order': 7
            }
        ]

        for holiday in holidays:
            model.create(**holiday)

    def create(self, name: str, emoji: str, primary_color: str, secondary_color: str,
               elements: str, sort_order: int = 0, status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'emoji': emoji,
            'primary_color': primary_color,
            'secondary_color': secondary_color,
            'elements': elements,
            'sort_order': sort_order,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'status': 1}, order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, name: str = None, emoji: str = None,
               primary_color: str = None, secondary_color: str = None,
               elements: str = None, sort_order: int = None, status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if name is not None:
            data['name'] = name
        if emoji is not None:
            data['emoji'] = emoji
        if primary_color is not None:
            data['primary_color'] = primary_color
        if secondary_color is not None:
            data['secondary_color'] = secondary_color
        if elements is not None:
            data['elements'] = elements
        if sort_order is not None:
            data['sort_order'] = sort_order
        if status is not None:
            data['status'] = status

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count({'status': 1})

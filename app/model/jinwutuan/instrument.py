from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class InstrumentModel:
    TABLE_NAME = 'tb_jinwutuan_model_instrument'

    TYPE_GUITAR = 'guitar'
    TYPE_KEYBOARD = 'keyboard'
    TYPE_DRUMS = 'drums'
    TYPE_BASS = 'bass'
    TYPE_VIOLIN = 'violin'

    TYPES = [
        {'code': TYPE_GUITAR, 'name': '吉他'},
        {'code': TYPE_KEYBOARD, 'name': '键盘'},
        {'code': TYPE_DRUMS, 'name': '鼓'},
        {'code': TYPE_BASS, 'name': '贝斯'},
        {'code': TYPE_VIOLIN, 'name': '小提琴'}
    ]

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    DEFAULT_INSTRUMENTS = [
        {
            'name': '经典吉他',
            'type': TYPE_GUITAR,
            'icon': '🎸',
            'color': '#E74C3C',
            'description': '经典六弦吉他',
            'unlock_level': 1,
            'key_count': 4
        },
        {
            'name': '电子键盘',
            'type': TYPE_KEYBOARD,
            'icon': '🎹',
            'color': '#3498DB',
            'description': '电子琴键盘',
            'unlock_level': 1,
            'key_count': 5
        },
        {
            'name': '架子鼓',
            'type': TYPE_DRUMS,
            'icon': '🥁',
            'color': '#E67E22',
            'description': '标准架子鼓组',
            'unlock_level': 3,
            'key_count': 4
        },
        {
            'name': '电贝斯',
            'type': TYPE_BASS,
            'icon': '🎸',
            'color': '#9B59B6',
            'description': '四弦电贝斯',
            'unlock_level': 5,
            'key_count': 4
        },
        {
            'name': '小提琴',
            'type': TYPE_VIOLIN,
            'icon': '🎻',
            'color': '#1ABC9C',
            'description': '古典小提琴',
            'unlock_level': 8,
            'key_count': 6
        },
        {
            'name': '高级吉他',
            'type': TYPE_GUITAR,
            'icon': '🎸',
            'color': '#C0392B',
            'description': '七键高级吉他',
            'unlock_level': 10,
            'key_count': 7
        },
        {
            'name': '高级键盘',
            'type': TYPE_KEYBOARD,
            'icon': '🎹',
            'color': '#2980B9',
            'description': '七键高级键盘',
            'unlock_level': 12,
            'key_count': 7
        }
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
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                icon TEXT DEFAULT '',
                color TEXT DEFAULT '',
                description TEXT DEFAULT '',
                unlock_level INTEGER DEFAULT 1,
                key_count INTEGER DEFAULT 4,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_key_count ON {cls.TABLE_NAME}(key_count)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlock_level ON {cls.TABLE_NAME}(unlock_level)"
        db.execute(index_sql)

    @classmethod
    def init_default_instruments(cls):
        model = cls()

        for inst in cls.DEFAULT_INSTRUMENTS:
            existing = model.query.find_one({'name': inst['name']})
            if not existing:
                model.create(
                    name=inst['name'],
                    type=inst['type'],
                    icon=inst['icon'],
                    color=inst['color'],
                    description=inst['description'],
                    unlock_level=inst['unlock_level'],
                    key_count=inst['key_count']
                )

    def create(self, name: str, type: str, icon: str = '', color: str = '',
               description: str = '', unlock_level: int = 1,
               key_count: int = 4) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'icon': icon,
            'color': color,
            'description': description,
            'unlock_level': unlock_level,
            'key_count': key_count,
            'status': self.STATUS_ENABLED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, instrument_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'icon', 'color', 'description',
            'unlock_level', 'key_count', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(instrument_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, type: str = None,
                status: int = None, key_count: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if type:
            conditions['type'] = type
        if key_count is not None:
            conditions['key_count'] = key_count

        return self.query.paginate(page, page_size, conditions, order_by='unlock_level ASC')

    def get_type_name(self, type: str) -> str:
        for t in self.TYPES:
            if t['code'] == type:
                return t['name']
        return '其他'

    def to_dict(self, instrument: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': instrument.get('id'),
            'name': instrument.get('name'),
            'type': instrument.get('type'),
            'type_name': self.get_type_name(instrument.get('type')),
            'icon': instrument.get('icon'),
            'color': instrument.get('color'),
            'description': instrument.get('description'),
            'unlock_level': instrument.get('unlock_level'),
            'key_count': instrument.get('key_count'),
            'status': instrument.get('status'),
            'created_at': instrument.get('created_at'),
            'updated_at': instrument.get('updated_at')
        }

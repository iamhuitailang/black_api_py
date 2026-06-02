from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RandomEventModel:
    TABLE_NAME = 'tb_dafuweng_model_random_event'

    TYPE_GAIN_MONEY = 0
    TYPE_LOSE_MONEY = 1
    TYPE_FORWARD = 2
    TYPE_BACKWARD = 3
    TYPE_GAIN_ITEM = 4
    TYPE_TAX_FREE = 5

    EVENT_TYPES = [
        {'code': TYPE_GAIN_MONEY, 'name': '获得金钱'},
        {'code': TYPE_LOSE_MONEY, 'name': '失去金钱'},
        {'code': TYPE_FORWARD, 'name': '前进'},
        {'code': TYPE_BACKWARD, 'name': '后退'},
        {'code': TYPE_GAIN_ITEM, 'name': '获得道具'},
        {'code': TYPE_TAX_FREE, 'name': '免税'}
    ]

    DEFAULT_EVENTS = [
        {'name': '中奖', 'description': '恭喜你中奖了！获得1000金币', 'event_type': 0, 'effect_value': 1000, 'probability': 15},
        {'name': '投资收益', 'description': '你的投资获得了丰厚回报，获得2000金币', 'event_type': 0, 'effect_value': 2000, 'probability': 8},
        {'name': '罚款', 'description': '违章停车，罚款500金币', 'event_type': 1, 'effect_value': 500, 'probability': 12},
        {'name': '修理费', 'description': '房屋需要维修，支付800金币', 'event_type': 1, 'effect_value': 800, 'probability': 10},
        {'name': '顺风车', 'description': '搭上顺风车，前进2步', 'event_type': 2, 'effect_value': 2, 'probability': 10},
        {'name': '绕路', 'description': '前方施工，后退3步', 'event_type': 3, 'effect_value': 3, 'probability': 8},
        {'name': '赠送道具', 'description': '神秘人赠送你一个道具', 'event_type': 4, 'effect_value': 1, 'probability': 10},
        {'name': '免税券', 'description': '获得免税券，下次税收免费', 'event_type': 5, 'effect_value': 1, 'probability': 8},
        {'name': '生日红包', 'description': '今天是你的生日，获得500金币', 'event_type': 0, 'effect_value': 500, 'probability': 12},
        {'name': '踩到香蕉皮', 'description': '踩到香蕉皮，后退1步', 'event_type': 3, 'effect_value': 1, 'probability': 7}
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
                description TEXT DEFAULT '',
                event_type INTEGER NOT NULL,
                effect_value INTEGER DEFAULT 0,
                probability INTEGER DEFAULT 10,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_event_type ON {cls.TABLE_NAME}(event_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_events(cls):
        model = cls()
        existing = model.get_all()
        if not existing:
            for event_data in cls.DEFAULT_EVENTS:
                model.create(**event_data)

    def create(self, name: str, description: str = '', event_type: int = 0,
               effect_value: int = 0, probability: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'event_type': event_type,
            'effect_value': effect_value,
            'probability': probability,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_active_events(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='probability DESC')

    def update(self, event_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'event_type', 'effect_value', 'probability', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(event_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_event_type_name(self, event_type: int) -> str:
        for et in self.EVENT_TYPES:
            if et['code'] == event_type:
                return et['name']
        return '未知'

    def to_dict(self, event: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': event.get('id'),
            'name': event.get('name'),
            'description': event.get('description'),
            'event_type': event.get('event_type'),
            'event_type_name': self.get_event_type_name(event.get('event_type')),
            'effect_value': event.get('effect_value'),
            'probability': event.get('probability'),
            'is_active': event.get('is_active'),
            'created_at': event.get('created_at'),
            'updated_at': event.get('updated_at')
        }

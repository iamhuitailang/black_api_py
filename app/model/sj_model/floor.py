from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json
import random


class SjFloorModel:
    TABLE_NAME = 'tb_sj_model_floor'

    FLOOR_TYPE_NORMAL = 'normal'
    FLOOR_TYPE_BOSS = 'boss'
    FLOOR_TYPE_EVENT = 'event'
    FLOOR_TYPE_REST = 'rest'
    FLOOR_TYPE_SHOP = 'shop'
    FLOOR_TYPE_TREASURE = 'treasure'

    FLOOR_TYPES = {
        FLOOR_TYPE_NORMAL: '战斗层',
        FLOOR_TYPE_BOSS: 'BOSS层',
        FLOOR_TYPE_EVENT: '事件层',
        FLOOR_TYPE_REST: '休息层',
        FLOOR_TYPE_SHOP: '商店层',
        FLOOR_TYPE_TREASURE: '宝藏层'
    }

    STATUS_PENDING = 0
    STATUS_CLEARED = 1
    STATUS_FAILED = 2
    STATUS_SKIPPED = 3

    ENEMY_DATA = {
        1: {'name': '时间碎片', 'hp': 30, 'attack': 5, 'defense': 2, 'exp': 15, 'gold': 10},
        2: {'name': '时钟守卫', 'hp': 45, 'attack': 8, 'defense': 4, 'exp': 25, 'gold': 15},
        3: {'name': '时光幽灵', 'hp': 35, 'attack': 12, 'defense': 2, 'exp': 30, 'gold': 20},
        4: {'name': '回溯者', 'hp': 55, 'attack': 10, 'defense': 6, 'exp': 35, 'gold': 25},
        5: {'name': '时钟蜘蛛', 'hp': 40, 'attack': 14, 'defense': 3, 'exp': 40, 'gold': 20},
        6: {'name': '永恒哨兵', 'hp': 65, 'attack': 13, 'defense': 8, 'exp': 45, 'gold': 30},
        7: {'name': '时间猎犬', 'hp': 50, 'attack': 16, 'defense': 5, 'exp': 50, 'gold': 35},
        8: {'name': '虚空行者', 'hp': 60, 'attack': 18, 'defense': 7, 'exp': 55, 'gold': 40},
        9: {'name': '时间裂隙', 'hp': 70, 'attack': 15, 'defense': 10, 'exp': 60, 'gold': 45},
        10: {'name': '时空领主', 'hp': 100, 'attack': 20, 'defense': 12, 'exp': 100, 'gold': 80}
    }

    BOSS_DATA = {
        5: {'name': '时钟守卫长', 'hp': 150, 'attack': 18, 'defense': 10, 'exp': 80, 'gold': 60, 'drop': '守卫长的护盾'},
        10: {'name': '时间领主·初代', 'hp': 250, 'attack': 25, 'defense': 15, 'exp': 150, 'gold': 120, 'drop': '时间领主之冠'},
        15: {'name': '永恒守望者', 'hp': 350, 'attack': 30, 'defense': 18, 'exp': 200, 'gold': 180, 'drop': '永恒守望者之心'},
        20: {'name': '时空裂隙兽', 'hp': 500, 'attack': 38, 'defense': 22, 'exp': 300, 'gold': 250, 'drop': '裂隙核心'},
        25: {'name': '时间水晶守护者', 'hp': 800, 'attack': 45, 'defense': 28, 'exp': 500, 'gold': 400, 'drop': '时间水晶碎片'}
    }

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        empty_json = '{}'
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id INTEGER NOT NULL,
                floor_number INTEGER NOT NULL,
                floor_type TEXT NOT NULL,
                enemy_data TEXT DEFAULT '{empty_json}',
                is_boss INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_floor_number ON {cls.TABLE_NAME}(floor_number)"
        db.execute(index_sql2)

    def generate_floor(self, character_id: int, floor_number: int) -> Dict[str, Any]:
        if floor_number in self.BOSS_DATA:
            floor_type = self.FLOOR_TYPE_BOSS
            enemy_data = self.BOSS_DATA[floor_number]
            is_boss = 1
        else:
            roll = random.random()
            if roll < 0.5:
                floor_type = self.FLOOR_TYPE_NORMAL
                tier = min(10, max(1, (floor_number - 1) // 2 + 1))
                base = self.ENEMY_DATA.get(tier, self.ENEMY_DATA[1])
                scale = 1 + (floor_number - 1) * 0.1
                enemy_data = {
                    'name': base['name'],
                    'hp': int(base['hp'] * scale),
                    'attack': int(base['attack'] * scale),
                    'defense': int(base['defense'] * scale),
                    'exp': int(base['exp'] * scale),
                    'gold': int(base['gold'] * scale)
                }
                is_boss = 0
            elif roll < 0.7:
                floor_type = self.FLOOR_TYPE_EVENT
                enemy_data = {}
                is_boss = 0
            elif roll < 0.8:
                floor_type = self.FLOOR_TYPE_REST
                enemy_data = {}
                is_boss = 0
            elif roll < 0.9:
                floor_type = self.FLOOR_TYPE_SHOP
                enemy_data = {}
                is_boss = 0
            else:
                floor_type = self.FLOOR_TYPE_TREASURE
                enemy_data = {}
                is_boss = 0

        now = datetime.now().isoformat()
        data = {
            'character_id': character_id,
            'floor_number': floor_number,
            'floor_type': floor_type,
            'enemy_data': json.dumps(enemy_data, ensure_ascii=False),
            'is_boss': is_boss,
            'status': self.STATUS_PENDING,
            'created_at': now
        }
        record_id = self.exec.insert(data)
        record = self.get_by_id(record_id)
        return self.to_dict(record) if record else data

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            record = self._parse_json_fields(record)
        return record

    def get_by_character(self, character_id: int) -> List[Dict[str, Any]]:
        records = self.query.find_all({'character_id': character_id}, order_by='floor_number ASC')
        return [self._parse_json_fields(r) for r in records]

    def get_current_floor(self, character_id: int, floor_number: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_one({'character_id': character_id, 'floor_number': floor_number})
        if record:
            record = self._parse_json_fields(record)
        return record

    def update_status(self, floor_id: int, status: int) -> int:
        return self.exec.update_by_id(floor_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def _parse_json_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if record and 'enemy_data' in record and isinstance(record['enemy_data'], str):
            try:
                record['enemy_data'] = json.loads(record['enemy_data'])
            except (json.JSONDecodeError, TypeError):
                record['enemy_data'] = {}
        return record

    def to_dict(self, floor: Dict[str, Any]) -> Dict[str, Any]:
        floor = self._parse_json_fields(floor)
        return {
            'id': floor.get('id'),
            'character_id': floor.get('character_id'),
            'floor_number': floor.get('floor_number'),
            'floor_type': floor.get('floor_type'),
            'floor_type_name': self.FLOOR_TYPES.get(floor.get('floor_type'), '未知'),
            'enemy_data': floor.get('enemy_data', {}),
            'is_boss': floor.get('is_boss'),
            'status': floor.get('status'),
            'status_name': {0: '待挑战', 1: '已通过', 2: '失败', 3: '跳过'}.get(floor.get('status'), '未知'),
            'created_at': floor.get('created_at')
        }

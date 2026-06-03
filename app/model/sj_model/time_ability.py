from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SjTimeAbilityModel:
    TABLE_NAME = 'tb_sj_model_time_ability'

    ABILITY_PAUSE = 'pause'
    ABILITY_ACCELERATE = 'accelerate'
    ABILITY_REWIND = 'rewind'
    ABILITY_FORESEE = 'foresee'
    ABILITY_FREEZE = 'freeze'
    ABILITY_REWIND_HEALTH = 'rewind_health'

    ABILITIES = {
        ABILITY_PAUSE: {
            'name': '时间暂停',
            'type': 'active',
            'description': '暂停时间2秒，期间你可以自由行动',
            'mp_cost': 15,
            'cooldown': 3,
            'unlock_floor': 1
        },
        ABILITY_ACCELERATE: {
            'name': '时间加速',
            'type': 'active',
            'description': '加速自身行动，速度翻倍持续3秒',
            'mp_cost': 20,
            'cooldown': 4,
            'unlock_floor': 3
        },
        ABILITY_REWIND: {
            'name': '时间回溯',
            'type': 'active',
            'description': '回溯到3秒前的状态（HP/MP恢复）',
            'mp_cost': 30,
            'cooldown': 5,
            'unlock_floor': 5
        },
        ABILITY_FORESEE: {
            'name': '预知未来',
            'type': 'passive',
            'description': '预知敌人下一次攻击，增加闪避率',
            'mp_cost': 10,
            'cooldown': 2,
            'unlock_floor': 8
        },
        ABILITY_FREEZE: {
            'name': '时间冻结',
            'type': 'active',
            'description': '冻结敌人5秒，使其无法行动',
            'mp_cost': 40,
            'cooldown': 6,
            'unlock_floor': 12
        },
        ABILITY_REWIND_HEALTH: {
            'name': '生命回溯',
            'type': 'active',
            'description': '将生命值恢复到战斗开始时的50%',
            'mp_cost': 50,
            'cooldown': 8,
            'unlock_floor': 18
        }
    }

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
                character_id INTEGER NOT NULL,
                ability_name TEXT NOT NULL,
                ability_type TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                cooldown INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                unlocked INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)

    def init_abilities_for_character(self, character_id: int, current_floor: int = 0) -> List[int]:
        ids = []
        for ability_key, ability_info in self.ABILITIES.items():
            unlocked = 1 if current_floor >= ability_info['unlock_floor'] else 0
            now = datetime.now().isoformat()
            data = {
                'character_id': character_id,
                'ability_name': ability_key,
                'ability_type': ability_info['type'],
                'level': 1,
                'cooldown': ability_info['cooldown'],
                'description': ability_info['description'],
                'unlocked': unlocked,
                'created_at': now
            }
            ids.append(self.exec.insert(data))
        return ids

    def get_by_character(self, character_id: int) -> List[Dict[str, Any]]:
        records = self.query.find_all({'character_id': character_id}, order_by='id ASC')
        return [self.to_dict(r) for r in records]

    def get_unlocked(self, character_id: int) -> List[Dict[str, Any]]:
        records = self.query.find_all({'character_id': character_id, 'unlocked': 1}, order_by='id ASC')
        return [self.to_dict(r) for r in records]

    def check_and_unlock(self, character_id: int, current_floor: int) -> List[Dict[str, Any]]:
        newly_unlocked = []
        for ability_key, ability_info in self.ABILITIES.items():
            if current_floor >= ability_info['unlock_floor']:
                record = self.query.find_one({
                    'character_id': character_id,
                    'ability_name': ability_key
                })
                if record and record.get('unlocked') == 0:
                    self.exec.update_by_id(record.get('id'), {'unlocked': 1})
                    updated_record = self.query.find_by_id(record.get('id'))
                    newly_unlocked.append(self.to_dict(updated_record))
        return newly_unlocked

    def update_level(self, ability_id: int, level: int) -> int:
        return self.exec.update_by_id(ability_id, {'level': level})

    def to_dict(self, ability: Dict[str, Any]) -> Dict[str, Any]:
        ability_info = self.ABILITIES.get(ability.get('ability_name', ''), {})
        return {
            'id': ability.get('id'),
            'character_id': ability.get('character_id'),
            'ability_name': ability.get('ability_name'),
            'name': ability_info.get('name', ability.get('ability_name', '')),
            'ability_type': ability.get('ability_type'),
            'level': ability.get('level'),
            'cooldown': ability.get('cooldown'),
            'mp_cost': ability_info.get('mp_cost', 0),
            'description': ability.get('description'),
            'unlocked': ability.get('unlocked'),
            'unlock_floor': ability_info.get('unlock_floor', 0),
            'created_at': ability.get('created_at')
        }

from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class SjCharacterModel:
    TABLE_NAME = 'tb_sj_model_character'

    CLASS_WARRIOR = 'warrior'
    CLASS_MAGE = 'mage'
    CLASS_THIEF = 'thief'

    CLASSES = {
        CLASS_WARRIOR: {'name': '战士', 'hp': 120, 'mp': 30, 'attack': 15, 'defense': 12, 'speed': 8, 'desc': '坚韧的近战战士，擅长承受伤害'},
        CLASS_MAGE: {'name': '法师', 'hp': 70, 'mp': 80, 'attack': 20, 'defense': 6, 'speed': 10, 'desc': '强大的魔法使用者，擅长远程攻击'},
        CLASS_THIEF: {'name': '盗贼', 'hp': 90, 'mp': 50, 'attack': 18, 'defense': 8, 'speed': 15, 'desc': '敏捷的暗影行者，擅长暴击和闪避'}
    }

    STATUS_ALIVE = 0
    STATUS_DEAD = 1

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
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                class_type TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                mp INTEGER DEFAULT 30,
                max_mp INTEGER DEFAULT 30,
                attack INTEGER DEFAULT 10,
                defense INTEGER DEFAULT 5,
                speed INTEGER DEFAULT 8,
                luck INTEGER DEFAULT 5,
                exp INTEGER DEFAULT 0,
                exp_next INTEGER DEFAULT 100,
                gold INTEGER DEFAULT 0,
                current_floor INTEGER DEFAULT 0,
                max_floor INTEGER DEFAULT 0,
                time_energy INTEGER DEFAULT 100,
                time_energy_max INTEGER DEFAULT 100,
                status INTEGER DEFAULT 0,
                skills TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, class_type: str) -> int:
        class_info = self.CLASSES.get(class_type)
        if not class_info:
            raise ValueError(f"Invalid class type: {class_type}")

        now = datetime.now().isoformat()
        skills_map = {
            self.CLASS_WARRIOR: ['猛击', '坚守', '战吼'],
            self.CLASS_MAGE: ['火球术', '冰冻术', '魔力护盾'],
            self.CLASS_THIEF: ['暗影突袭', '闪避', '毒刃']
        }
        data = {
            'user_id': user_id,
            'name': name,
            'class_type': class_type,
            'level': 1,
            'hp': class_info['hp'],
            'max_hp': class_info['hp'],
            'mp': class_info['mp'],
            'max_mp': class_info['mp'],
            'attack': class_info['attack'],
            'defense': class_info['defense'],
            'speed': class_info['speed'],
            'luck': 5,
            'exp': 0,
            'exp_next': 100,
            'gold': 50,
            'current_floor': 0,
            'max_floor': 0,
            'time_energy': 100,
            'time_energy_max': 100,
            'status': self.STATUS_ALIVE,
            'skills': json.dumps(skills_map.get(class_type, []), ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            record = self._parse_json_fields(record)
        return record

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        records = self.query.find_all({'user_id': user_id}, order_by='id DESC')
        return [self._parse_json_fields(r) for r in records]

    def update(self, character_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'level', 'hp', 'max_hp', 'mp', 'max_mp',
            'attack', 'defense', 'speed', 'luck', 'exp', 'exp_next',
            'gold', 'current_floor', 'max_floor', 'time_energy',
            'time_energy_max', 'status', 'skills'
        ]}
        if 'skills' in update_data and isinstance(update_data['skills'], list):
            update_data['skills'] = json.dumps(update_data['skills'], ensure_ascii=False)
        update_data['updated_at'] = now
        return self.exec.update_by_id(character_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def _parse_json_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if record and 'skills' in record and isinstance(record['skills'], str):
            try:
                record['skills'] = json.loads(record['skills'])
            except (json.JSONDecodeError, TypeError):
                record['skills'] = []
        return record

    def to_dict(self, character: Dict[str, Any]) -> Dict[str, Any]:
        character = self._parse_json_fields(character)
        class_info = self.CLASSES.get(character.get('class_type'), {})
        return {
            'id': character.get('id'),
            'user_id': character.get('user_id'),
            'name': character.get('name'),
            'class_type': character.get('class_type'),
            'class_name': class_info.get('name', '未知'),
            'class_desc': class_info.get('desc', ''),
            'level': character.get('level'),
            'hp': character.get('hp'),
            'max_hp': character.get('max_hp'),
            'mp': character.get('mp'),
            'max_mp': character.get('max_mp'),
            'attack': character.get('attack'),
            'defense': character.get('defense'),
            'speed': character.get('speed'),
            'luck': character.get('luck'),
            'exp': character.get('exp'),
            'exp_next': character.get('exp_next'),
            'gold': character.get('gold'),
            'current_floor': character.get('current_floor'),
            'max_floor': character.get('max_floor'),
            'time_energy': character.get('time_energy'),
            'time_energy_max': character.get('time_energy_max'),
            'status': character.get('status'),
            'skills': character.get('skills', []),
            'created_at': character.get('created_at'),
            'updated_at': character.get('updated_at')
        }

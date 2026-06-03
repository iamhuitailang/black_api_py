from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class SjSaveModel:
    TABLE_NAME = 'tb_sj_model_save'

    ENDING_NONE = ''
    ENDING_WARRIOR = 'warrior'
    ENDING_MAGE = 'mage'
    ENDING_THIEF = 'thief'
    ENDING_TIME_MASTER = 'time_master'
    ENDING_FALL = 'fall'

    ENDINGS = {
        ENDING_WARRIOR: '战士之终 - 以力量征服时间',
        ENDING_MAGE: '法师之终 - 以智慧驾驭时间',
        ENDING_THIEF: '盗贼之终 - 以速度超越时间',
        ENDING_TIME_MASTER: '时间之主 - 完全掌控时间水晶',
        ENDING_FALL: '堕落 - 被时间之力吞噬'
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
                user_id INTEGER NOT NULL,
                character_id INTEGER NOT NULL,
                save_name TEXT DEFAULT '',
                save_data TEXT DEFAULT '{empty_json}',
                current_floor INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                ending_type TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, character_id: int, save_name: str,
               save_data: Dict[str, Any], current_floor: int = 0,
               play_time: int = 0, ending_type: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'character_id': character_id,
            'save_name': save_name,
            'save_data': json.dumps(save_data, ensure_ascii=False),
            'current_floor': current_floor,
            'play_time': play_time,
            'ending_type': ending_type,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            record = self._parse_json_fields(record)
        return record

    def get_by_user(self, user_id: int) -> list:
        records = self.query.find_all({'user_id': user_id}, order_by='updated_at DESC')
        return [self._parse_json_fields(r) for r in records]

    def get_by_character(self, character_id: int) -> list:
        records = self.query.find_all({'character_id': character_id}, order_by='updated_at DESC')
        return [self._parse_json_fields(r) for r in records]

    def update(self, save_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'save_name', 'save_data', 'current_floor', 'play_time', 'ending_type'
        ]}
        if 'save_data' in update_data and isinstance(update_data['save_data'], dict):
            update_data['save_data'] = json.dumps(update_data['save_data'], ensure_ascii=False)
        update_data['updated_at'] = now
        return self.exec.update_by_id(save_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def _parse_json_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if record and 'save_data' in record and isinstance(record['save_data'], str):
            try:
                record['save_data'] = json.loads(record['save_data'])
            except (json.JSONDecodeError, TypeError):
                record['save_data'] = {}
        return record

    def to_dict(self, save: Dict[str, Any]) -> Dict[str, Any]:
        save = self._parse_json_fields(save)
        return {
            'id': save.get('id'),
            'user_id': save.get('user_id'),
            'character_id': save.get('character_id'),
            'save_name': save.get('save_name'),
            'save_data': save.get('save_data', {}),
            'current_floor': save.get('current_floor'),
            'play_time': save.get('play_time'),
            'ending_type': save.get('ending_type'),
            'ending_name': self.ENDINGS.get(save.get('ending_type', ''), ''),
            'created_at': save.get('created_at'),
            'updated_at': save.get('updated_at')
        }

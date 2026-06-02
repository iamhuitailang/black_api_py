from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class CreatureModel:
    TABLE_NAME = 'tb_meng_model_creatures'

    TYPE_NPC = 'npc'
    TYPE_FRIENDLY = 'friendly'
    TYPE_HOSTILE = 'hostile'
    TYPE_CUSTOM = 'custom'

    BEHAVIOR_WANDER = 'wander'
    BEHAVIOR_FOLLOW = 'follow'
    BEHAVIOR_PATROL = 'patrol'
    BEHAVIOR_GUARD = 'guard'
    BEHAVIOR_CUSTOM = 'custom'

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
                dream_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                creature_type TEXT DEFAULT 'npc',
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                z REAL DEFAULT 0,
                health INTEGER DEFAULT 100,
                max_health INTEGER DEFAULT 100,
                behavior TEXT DEFAULT 'wander',
                script TEXT DEFAULT '',
                properties TEXT DEFAULT '',
                skin TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dream_id ON {cls.TABLE_NAME}(dream_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_creature_type ON {cls.TABLE_NAME}(creature_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_behavior ON {cls.TABLE_NAME}(behavior)"
        db.execute(index_sql)

    def create(self, dream_id: int, name: str, creature_type: str = 'npc',
               x: float = 0, y: float = 0, z: float = 0,
               health: int = 100, max_health: int = 100,
               behavior: str = 'wander', script: Dict[str, Any] = None,
               properties: Dict[str, Any] = None, skin: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'dream_id': dream_id,
            'name': name,
            'creature_type': creature_type,
            'x': x,
            'y': y,
            'z': z,
            'health': health,
            'max_health': max_health,
            'behavior': behavior,
            'script': json.dumps(script) if script else '',
            'properties': json.dumps(properties) if properties else '',
            'skin': skin,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_dream(self, dream_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'dream_id': dream_id}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'creature_type', 'x', 'y', 'z', 'health', 'max_health',
            'behavior', 'script', 'properties', 'skin'
        ]}
        if 'script' in update_data and isinstance(update_data['script'], dict):
            update_data['script'] = json.dumps(update_data['script'])
        if 'properties' in update_data and isinstance(update_data['properties'], dict):
            update_data['properties'] = json.dumps(update_data['properties'])
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_dream(self, dream_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE dream_id = ?"
        return self.db.execute(sql, (dream_id,))

    def to_dict(self, creature: Dict[str, Any]) -> Dict[str, Any]:
        if not creature:
            return {}
        
        script_data = creature.get('script', '')
        properties_data = creature.get('properties', '')
        
        return {
            'id': creature.get('id'),
            'dream_id': creature.get('dream_id'),
            'name': creature.get('name'),
            'creature_type': creature.get('creature_type'),
            'x': creature.get('x'),
            'y': creature.get('y'),
            'z': creature.get('z'),
            'health': creature.get('health'),
            'max_health': creature.get('max_health'),
            'behavior': creature.get('behavior'),
            'script': json.loads(script_data) if script_data else {},
            'properties': json.loads(properties_data) if properties_data else {},
            'skin': creature.get('skin'),
            'created_at': creature.get('created_at'),
            'updated_at': creature.get('updated_at')
        }

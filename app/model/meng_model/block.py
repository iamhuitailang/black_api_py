from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class BlockModel:
    TABLE_NAME = 'tb_meng_model_blocks'

    BLOCK_TYPE_GRASS = 'grass'
    BLOCK_TYPE_STONE = 'stone'
    BLOCK_TYPE_WOOD = 'wood'
    BLOCK_TYPE_GLASS = 'glass'
    BLOCK_TYPE_LIGHT = 'light'
    BLOCK_TYPE_DREAM_BLOCK = 'dream_block'

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
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                z INTEGER NOT NULL,
                block_type TEXT DEFAULT 'grass',
                color TEXT DEFAULT '#ffffff',
                properties TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(dream_id, x, y, z)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dream_id ON {cls.TABLE_NAME}(dream_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_block_type ON {cls.TABLE_NAME}(block_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_position ON {cls.TABLE_NAME}(dream_id, x, y, z)"
        db.execute(index_sql)

    def create(self, dream_id: int, x: int, y: int, z: int,
               block_type: str = 'grass', color: str = '#ffffff',
               properties: Dict[str, Any] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'dream_id': dream_id,
            'x': x,
            'y': y,
            'z': z,
            'block_type': block_type,
            'color': color,
            'properties': json.dumps(properties) if properties else '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def batch_create(self, blocks: List[Dict[str, Any]]) -> int:
        if not blocks:
            return 0

        now = datetime.now().isoformat()
        data_list = []
        for block in blocks:
            data_list.append({
                'dream_id': block.get('dream_id'),
                'x': block.get('x'),
                'y': block.get('y'),
                'z': block.get('z'),
                'block_type': block.get('block_type', 'grass'),
                'color': block.get('color', '#ffffff'),
                'properties': json.dumps(block.get('properties')) if block.get('properties') else '',
                'created_at': now,
                'updated_at': now
            })
        return self.exec.insert_many(data_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_dream(self, dream_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'dream_id': dream_id}, order_by='x, y, z')

    def get_by_position(self, dream_id: int, x: int, y: int, z: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'dream_id': dream_id,
            'x': x,
            'y': y,
            'z': z
        })

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'block_type', 'color', 'properties'
        ]}
        if 'properties' in update_data and isinstance(update_data['properties'], dict):
            update_data['properties'] = json.dumps(update_data['properties'])
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_dream(self, dream_id: int) -> int:
        return self.exec.delete({'dream_id': dream_id})

    def batch_delete(self, ids: List[int]) -> int:
        if not ids:
            return 0

        placeholders = ', '.join(['?' for _ in ids])
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE id IN ({placeholders})"
        return self.db.execute(sql, tuple(ids))

    def to_dict(self, block: Dict[str, Any]) -> Dict[str, Any]:
        if not block:
            return {}

        properties_data = block.get('properties', '')

        return {
            'id': block.get('id'),
            'dream_id': block.get('dream_id'),
            'x': block.get('x'),
            'y': block.get('y'),
            'z': block.get('z'),
            'block_type': block.get('block_type'),
            'color': block.get('color'),
            'properties': json.loads(properties_data) if properties_data else {},
            'created_at': block.get('created_at'),
            'updated_at': block.get('updated_at')
        }

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class IceLayerModel:
    TABLE_NAME = 'tb_glacier_ice_layer'

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
                game_id INTEGER NOT NULL,
                layer_index INTEGER NOT NULL,
                thickness REAL NOT NULL,
                temperature REAL NOT NULL,
                dug_progress REAL DEFAULT 0,
                has_crack INTEGER DEFAULT 0,
                crack_found INTEGER DEFAULT 0,
                has_supply INTEGER DEFAULT 0,
                supply_used INTEGER DEFAULT 0,
                supply_trapped INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_layer ON {cls.TABLE_NAME}(game_id, layer_index)"
        db.execute(index_sql2)

    def create(self, game_id: int, layer_index: int, thickness: float,
               temperature: float, has_crack: bool = False,
               has_supply: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'layer_index': layer_index,
            'thickness': thickness,
            'temperature': temperature,
            'dug_progress': 0,
            'has_crack': 1 if has_crack else 0,
            'crack_found': 0,
            'has_supply': 1 if has_supply else 0,
            'supply_used': 0,
            'supply_trapped': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_and_layer(self, game_id: int, layer_index: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'layer_index': layer_index})

    def get_layers_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='layer_index ASC')

    def update_progress(self, record_id: int, dug_progress: float) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'dug_progress': dug_progress,
            'updated_at': now
        })

    def mark_crack_found(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'crack_found': 1,
            'updated_at': now
        })

    def mark_supply_used(self, record_id: int, trapped: bool = False) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'supply_used': 1,
            'supply_trapped': 1 if trapped else 0,
            'updated_at': now
        })

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.delete({'game_id': game_id})

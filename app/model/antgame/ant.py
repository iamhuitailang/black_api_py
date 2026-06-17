from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AntModel:
    TABLE_NAME = 'ant_game_ant'
    
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
                save_id INTEGER NOT NULL,
                ant_type TEXT NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                target_x REAL,
                target_y REAL,
                state TEXT DEFAULT 'idle',
                health INTEGER DEFAULT 100,
                energy INTEGER DEFAULT 100,
                carrying TEXT,
                carrying_amount INTEGER DEFAULT 0,
                speed REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, ant_type: str, x: float, y: float, 
               state: str = 'idle', health: int = 100, speed: float = 1.0) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'ant_type': ant_type,
            'x': x,
            'y': y,
            'state': state,
            'health': health,
            'energy': 100,
            'speed': speed,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def create_many(self, ants: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for ant in ants:
            data = {
                'save_id': ant['save_id'],
                'ant_type': ant['ant_type'],
                'x': ant['x'],
                'y': ant['y'],
                'state': ant.get('state', 'idle'),
                'health': ant.get('health', 100),
                'energy': ant.get('energy', 100),
                'speed': ant.get('speed', 1.0),
                'created_at': now,
                'updated_at': now
            }
            data_list.append(data)
        return self.exec.insert_many(data_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='id ASC')

    def get_by_type(self, save_id: int, ant_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id, 'ant_type': ant_type}, order_by='id ASC')

    def count_by_save(self, save_id: int) -> int:
        return self.query.count({'save_id': save_id})

    def count_by_type(self, save_id: int, ant_type: str) -> int:
        return self.query.count({'save_id': save_id, 'ant_type': ant_type})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_save_id(self, save_id: int) -> int:
        return self.exec.delete({'save_id': save_id})

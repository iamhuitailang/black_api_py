from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CargoModel:
    TABLE_NAME = 'tb_huoche_cargo'
    
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
                game_record_id INTEGER,
                name TEXT NOT NULL,
                type TEXT DEFAULT 'general',
                weight REAL DEFAULT 0,
                destination_station_id INTEGER,
                shipping_fee INTEGER DEFAULT 0,
                condition REAL DEFAULT 100.0,
                loaded INTEGER DEFAULT 0,
                unloaded INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES tb_auth_user(id),
                FOREIGN KEY (game_record_id) REFERENCES tb_huoche_game_record(id),
                FOREIGN KEY (destination_station_id) REFERENCES tb_huoche_station(id)
            )
        """
        db.execute(sql)
        
        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_record_id ON {cls.TABLE_NAME}(game_record_id)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def create_batch(self, cargo_list: List[Dict[str, Any]]) -> int:
        if not cargo_list:
            return 0
        now = datetime.now().isoformat()
        for c in cargo_list:
            c['created_at'] = now
            c['updated_at'] = now
        return self.exec.insert_many(cargo_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_record_id(self, game_record_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_record_id': game_record_id}, order_by='id ASC')

    def get_by_user_id(self, user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def update_condition(self, record_id: int, condition: float) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'condition': condition, 'updated_at': now})

    def mark_loaded(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'loaded': 1, 'updated_at': now})

    def mark_unloaded(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'unloaded': 1, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

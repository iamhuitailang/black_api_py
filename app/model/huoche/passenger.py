from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PassengerModel:
    TABLE_NAME = 'tb_huoche_passenger'
    
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
                age INTEGER DEFAULT 30,
                destination_station_id INTEGER,
                ticket_price INTEGER DEFAULT 0,
                satisfaction REAL DEFAULT 100.0,
                boarded INTEGER DEFAULT 0,
                alighted INTEGER DEFAULT 0,
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

    def create_batch(self, passengers: List[Dict[str, Any]]) -> int:
        if not passengers:
            return 0
        now = datetime.now().isoformat()
        for p in passengers:
            p['created_at'] = now
            p['updated_at'] = now
        return self.exec.insert_many(passengers)

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

    def update_satisfaction(self, record_id: int, satisfaction: float) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'satisfaction': satisfaction, 'updated_at': now})

    def mark_boarded(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'boarded': 1, 'updated_at': now})

    def mark_alighted(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'alighted': 1, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

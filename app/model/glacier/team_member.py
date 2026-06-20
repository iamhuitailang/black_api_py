from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TeamMemberModel:
    TABLE_NAME = 'tb_glacier_team_member'

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
                name TEXT NOT NULL,
                cold_resistance REAL NOT NULL,
                max_cold_resistance REAL NOT NULL,
                dig_efficiency REAL NOT NULL,
                base_dig_efficiency REAL NOT NULL,
                is_frostbitten INTEGER DEFAULT 0,
                health REAL DEFAULT 100,
                max_health REAL DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)

    def create(self, game_id: int, name: str, cold_resistance: float,
               dig_efficiency: float, health: float = 100) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'name': name,
            'cold_resistance': cold_resistance,
            'max_cold_resistance': cold_resistance,
            'dig_efficiency': dig_efficiency,
            'base_dig_efficiency': dig_efficiency,
            'is_frostbitten': 0,
            'health': health,
            'max_health': health,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_members_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='id ASC')

    def update_member(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def set_frostbitten(self, record_id: int, frostbitten: bool = True) -> int:
        now = datetime.now().isoformat()
        efficiency = 1.0 if frostbitten else None
        data = {
            'is_frostbitten': 1 if frostbitten else 0,
            'updated_at': now
        }
        if efficiency is not None:
            data['dig_efficiency'] = efficiency
        return self.exec.update_by_id(record_id, data)

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.delete({'game_id': game_id})

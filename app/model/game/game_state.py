from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameStateModel:
    TABLE_NAME = 'game_state'
    
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
                player_name TEXT NOT NULL DEFAULT 'Survivor',
                game_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

    def create(self, player_name: str, game_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'game_data': json.dumps(game_data, ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row:
            row['game_data'] = json.loads(row['game_data'])
        return row

    def get_by_player_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        row = self.query.find_one({'player_name': player_name}, order_by='id DESC')
        if row:
            row['game_data'] = json.loads(row['game_data'])
        return row

    def get_latest(self) -> Optional[Dict[str, Any]]:
        row = self.query.find_one(order_by='id DESC')
        if row:
            row['game_data'] = json.loads(row['game_data'])
        return row

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by='id DESC', limit=limit)
        for row in rows:
            row['game_data'] = json.loads(row['game_data'])
        return rows

    def update(self, record_id: int, game_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_data': json.dumps(game_data, ensure_ascii=False),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.query.paginate(page, page_size, order_by='id DESC')
        for row in result['items']:
            row['game_data'] = json.loads(row['game_data'])
        return result

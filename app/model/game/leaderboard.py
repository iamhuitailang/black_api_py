from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardModel:
    TABLE_NAME = 'leaderboard'
    
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
                player_id INTEGER NOT NULL UNIQUE,
                player_name TEXT NOT NULL,
                total_time REAL NOT NULL,
                total_kills INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES game_player(id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_time ON {cls.TABLE_NAME}(total_time ASC)"
        db.execute(index_sql)

    def create_or_update(self, player_id: int, player_name: str, total_time: float, total_kills: int) -> int:
        now = datetime.now().isoformat()
        existing = self.query.find_one({'player_id': player_id})
        
        if existing:
            if total_time < existing['total_time']:
                data = {
                    'total_time': total_time,
                    'total_kills': total_kills,
                    'updated_at': now
                }
                return self.exec.update_by_id(existing['id'], data)
            return 0
        else:
            data = {
                'player_id': player_id,
                'player_name': player_name,
                'total_time': total_time,
                'total_kills': total_kills,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_top_players(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='total_time ASC', limit=limit)

    def get_player_rank(self, player_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT *, 
                   (SELECT COUNT(*) + 1 FROM {self.TABLE_NAME} lb2 
                    WHERE lb2.total_time < lb1.total_time) as rank
            FROM {self.TABLE_NAME} lb1
            WHERE player_id = ?
        """
        return self.db.fetch_one(sql, (player_id,))

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def paginate(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='total_time ASC')

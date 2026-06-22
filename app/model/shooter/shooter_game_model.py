from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class ShooterGameModel:
    TABLE_NAME = 'shooter_game_records'
    
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
                player_name VARCHAR(50) NOT NULL,
                final_health INTEGER NOT NULL CHECK (final_health >= 0 AND final_health <= 100),
                time_used REAL NOT NULL CHECK (time_used > 0),
                score REAL NOT NULL,
                cleared BOOLEAN NOT NULL DEFAULT 0,
                sniper_used TEXT,
                enemies_killed INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, player_name: str, final_health: int, time_used: float, 
               score: float, cleared: bool, sniper_used: list, enemies_killed: int) -> int:
        data = {
            'player_name': player_name,
            'final_health': final_health,
            'time_used': time_used,
            'score': score,
            'cleared': 1 if cleared else 0,
            'sniper_used': json.dumps(sniper_used),
            'enemies_killed': enemies_killed
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            record['sniper_used'] = json.loads(record['sniper_used']) if record.get('sniper_used') else []
        return record

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
                id,
                player_name,
                score,
                final_health,
                time_used,
                cleared,
                enemies_killed,
                created_at
            FROM {self.TABLE_NAME}
            WHERE cleared = 1
            ORDER BY score DESC
            LIMIT ?
        """
        records = self.db.fetch_all(sql, (limit,))
        return records

    def get_personal_best(self, player_name: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT 
                ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
                id,
                player_name,
                score,
                final_health,
                time_used,
                cleared,
                enemies_killed,
                created_at
            FROM {self.TABLE_NAME}
            WHERE player_name = ? AND cleared = 1
            ORDER BY score DESC
            LIMIT 1
        """
        return self.db.fetch_one(sql, (player_name,))

    def get_total_players(self) -> int:
        sql = f"SELECT COUNT(DISTINCT player_name) as total FROM {self.TABLE_NAME} WHERE cleared = 1"
        result = self.db.fetch_one(sql)
        return result['total'] if result else 0

    def get_rank(self, record_id: int) -> int:
        sql = f"""
            SELECT COUNT(*) + 1 as rank
            FROM {self.TABLE_NAME}
            WHERE cleared = 1 AND score > (
                SELECT score FROM {self.TABLE_NAME} WHERE id = ?
            )
        """
        result = self.db.fetch_one(sql, (record_id,))
        return result['rank'] if result else 1

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BattleRecordModel:
    TABLE_NAME = 'fighter_battle_record'

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
                player1_character TEXT NOT NULL,
                player2_character TEXT NOT NULL,
                player1_wins INTEGER NOT NULL DEFAULT 0,
                player2_wins INTEGER NOT NULL DEFAULT 0,
                winner TEXT NOT NULL,
                winner_character TEXT NOT NULL,
                total_rounds INTEGER NOT NULL DEFAULT 0,
                max_combo_p1 INTEGER NOT NULL DEFAULT 0,
                max_combo_p2 INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, player1_character: str, player2_character: str,
               player1_wins: int, player2_wins: int, winner: str,
               winner_character: str, total_rounds: int,
               max_combo_p1: int = 0, max_combo_p2: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'player1_character': player1_character,
            'player2_character': player2_character,
            'player1_wins': player1_wins,
            'player2_wins': player2_wins,
            'winner': winner,
            'winner_character': winner_character,
            'total_rounds': total_rounds,
            'max_combo_p1': max_combo_p1,
            'max_combo_p2': max_combo_p2,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def count(self) -> int:
        return self.query.count()

    def get_total_battles(self) -> int:
        return self.query.count()

    def get_wins_by_character(self, character: str) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE winner_character = ?"
        result = self.db.fetch_one(sql, (character,))
        return result['total'] if result else 0

    def get_usage_by_character(self, character: str) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE player1_character = ? OR player2_character = ?"
        result = self.db.fetch_one(sql, (character, character))
        return result['total'] if result else 0

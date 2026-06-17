from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LetterFragmentModel:
    TABLE_NAME = 'tb_letter_fragment'

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
                player_name TEXT NOT NULL,
                letter_id INTEGER NOT NULL,
                fragment_index INTEGER NOT NULL,
                collected INTEGER NOT NULL DEFAULT 0,
                collected_at TIMESTAMP,
                UNIQUE(player_name, letter_id, fragment_index)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_letter_id ON {cls.TABLE_NAME}(player_name, letter_id)"
        db.execute(index_sql2)

    def create(self, player_name: str, letter_id: int, fragment_index: int) -> int:
        data = {
            'player_name': player_name,
            'letter_id': letter_id,
            'fragment_index': fragment_index,
            'collected': 0,
            'collected_at': None
        }
        return self.exec.insert(data)

    def get_by_player(self, player_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'player_name': player_name},
            order_by='letter_id ASC, fragment_index ASC'
        )

    def collect_fragment(self, player_name: str, letter_id: int, fragment_index: int) -> bool:
        now = datetime.now().isoformat()
        sql = f"""
            UPDATE {self.TABLE_NAME}
            SET collected = 1, collected_at = ?
            WHERE player_name = ? AND letter_id = ? AND fragment_index = ? AND collected = 0
        """
        cursor = self.db.execute(sql, (now, player_name, letter_id, fragment_index))
        if cursor.rowcount > 0:
            return True

        sql_check = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE player_name = ? AND letter_id = ? AND fragment_index = ?
        """
        result = self.db.fetch_one(sql_check, (player_name, letter_id, fragment_index))
        if result and result['total'] == 0:
            data = {
                'player_name': player_name,
                'letter_id': letter_id,
                'fragment_index': fragment_index,
                'collected': 1,
                'collected_at': now
            }
            self.exec.insert(data)
            return True

        return False

    def check_all_collected(self, player_name: str, letter_id: int) -> bool:
        sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE player_name = ? AND letter_id = ? AND collected = 1
        """
        result = self.db.fetch_one(sql, (player_name, letter_id))
        return result['total'] == 3 if result else False

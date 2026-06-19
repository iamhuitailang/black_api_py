from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReputationModel:
    TABLE_NAME = 'tb_game_reputation_log'

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
                faction TEXT NOT NULL,
                change_amount INTEGER NOT NULL DEFAULT 0,
                reason TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, faction: str, change_amount: int, reason: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'faction': faction,
            'change_amount': change_amount,
            'reason': reason,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='id DESC', limit=limit)

    def get_faction_summary(self, save_id: int) -> Dict[str, int]:
        sql = f"""
            SELECT faction, SUM(change_amount) as total
            FROM {self.TABLE_NAME}
            WHERE save_id = ?
            GROUP BY faction
        """
        rows = self.db.fetch_all(sql, (save_id,))
        result = {'military': 0, 'pirate': 0, 'corporate': 0, 'neutral': 0}
        for row in rows:
            result[row['faction']] = row['total'] or 0
        return result

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CharacterStatModel:
    TABLE_NAME = 'fighter_character_stat'

    CHARACTERS = ['warrior', 'ninja', 'samurai']

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
                character_name TEXT NOT NULL UNIQUE,
                usage_count INTEGER NOT NULL DEFAULT 0,
                win_count INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character ON {cls.TABLE_NAME}(character_name)"
        db.execute(index_sql)

        for char in cls.CHARACTERS:
            check_sql = f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME} WHERE character_name = ?"
            result = db.fetch_one(check_sql, (char,))
            if not result or result['total'] == 0:
                insert_sql = f"INSERT INTO {cls.TABLE_NAME} (character_name, usage_count, win_count) VALUES (?, 0, 0)"
                db.execute(insert_sql, (char,))

    def increment_usage(self, character_name: str) -> int:
        now = datetime.now().isoformat()
        record = self.query.find_one({'character_name': character_name})
        if record:
            data = {
                'usage_count': record['usage_count'] + 1,
                'updated_at': now
            }
            return self.exec.update(data, {'character_name': character_name})
        return 0

    def increment_win(self, character_name: str) -> int:
        now = datetime.now().isoformat()
        record = self.query.find_one({'character_name': character_name})
        if record:
            data = {
                'win_count': record['win_count'] + 1,
                'updated_at': now
            }
            return self.exec.update(data, {'character_name': character_name})
        return 0

    def get_by_character(self, character_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'character_name': character_name})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='usage_count DESC')

    def get_statistics(self) -> List[Dict[str, Any]]:
        results = self.query.find_all(order_by='usage_count DESC')
        stats = []
        for r in results:
            usage = r['usage_count']
            wins = r['win_count']
            win_rate = round((wins / usage * 100), 2) if usage > 0 else 0.0
            stats.append({
                'character_name': r['character_name'],
                'usage_count': usage,
                'win_count': wins,
                'win_rate': win_rate
            })
        return stats

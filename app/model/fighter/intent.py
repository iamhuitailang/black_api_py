from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FistIntentStatsModel:
    TABLE_NAME = 'fighter_intent_stats'

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
                battle_id INTEGER NOT NULL,
                side TEXT NOT NULL,
                from_intent TEXT NOT NULL,
                to_intent TEXT NOT NULL,
                round_num INTEGER NOT NULL,
                trigger_reason TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_battle_id ON {cls.TABLE_NAME}(battle_id)"
        db.execute(index_sql)

    def create(self, battle_id: int, side: str, from_intent: str, to_intent: str,
               round_num: int, trigger_reason: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'battle_id': battle_id,
            'side': side,
            'from_intent': from_intent,
            'to_intent': to_intent,
            'round_num': round_num,
            'trigger_reason': trigger_reason,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_battle_id(self, battle_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(where='battle_id = ?', params=(battle_id,), order_by='round_num ASC')

    def get_switch_count_by_intent(self, side: str = None) -> Dict[str, Any]:
        db = get_db()
        where_clause = ''
        params = ()
        if side:
            where_clause = 'WHERE side = ?'
            params = (side,)
        
        sql = f"""
            SELECT from_intent, to_intent, COUNT(*) as count
            FROM {self.TABLE_NAME}
            {where_clause}
            GROUP BY from_intent, to_intent
            ORDER BY count DESC
        """
        results = db.fetch_all(sql, params) if params else db.fetch_all(sql)
        return {'items': results}

    def get_trigger_reason_stats(self, side: str = None) -> Dict[str, Any]:
        db = get_db()
        where_clause = ''
        params = ()
        if side:
            where_clause = 'WHERE side = ?'
            params = (side,)
        
        sql = f"""
            SELECT trigger_reason, COUNT(*) as count
            FROM {self.TABLE_NAME}
            {where_clause}
            GROUP BY trigger_reason
            ORDER BY count DESC
        """
        results = db.fetch_all(sql, params) if params else db.fetch_all(sql)
        return {'items': results}

    def count(self) -> int:
        return self.query.count()

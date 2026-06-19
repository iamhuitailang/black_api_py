from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DiplomacyModel:
    TABLE_NAME = 'tb_diplomacy'

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
                tribe_id INTEGER NOT NULL,
                foreign_tribe_id INTEGER NOT NULL,
                relation TEXT NOT NULL DEFAULT 'neutral',
                trade_cooldown INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tribe_id) REFERENCES tb_tribe(id),
                FOREIGN KEY (foreign_tribe_id) REFERENCES tb_foreign_tribe(id),
                UNIQUE(tribe_id, foreign_tribe_id)
            )
        """
        db.execute(sql)
        idx_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tribe_id ON {cls.TABLE_NAME}(tribe_id)"
        db.execute(idx_sql)

    def create(self, tribe_id: int, foreign_tribe_id: int, relation: str = 'neutral') -> int:
        now = datetime.now().isoformat()
        data = {
            'tribe_id': tribe_id,
            'foreign_tribe_id': foreign_tribe_id,
            'relation': relation,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_tribe(self, tribe_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id}, order_by='id ASC')

    def get_relation(self, tribe_id: int, foreign_tribe_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'tribe_id': tribe_id, 'foreign_tribe_id': foreign_tribe_id})

    def update_relation(self, tribe_id: int, foreign_tribe_id: int, relation: str) -> int:
        now = datetime.now().isoformat()
        conditions = {'tribe_id': tribe_id, 'foreign_tribe_id': foreign_tribe_id}
        return self.exec.update({'relation': relation, 'updated_at': now}, conditions=conditions)

    def update_trade_cooldown(self, tribe_id: int, foreign_tribe_id: int, cooldown: int) -> int:
        now = datetime.now().isoformat()
        conditions = {'tribe_id': tribe_id, 'foreign_tribe_id': foreign_tribe_id}
        return self.exec.update({'trade_cooldown': cooldown, 'updated_at': now}, conditions=conditions)

    def decrement_cooldowns(self, tribe_id: int) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET trade_cooldown = MAX(0, trade_cooldown - 1), updated_at = ?
            WHERE tribe_id = ? AND trade_cooldown > 0
        """
        cursor = self.db.execute(sql, (datetime.now().isoformat(), tribe_id))
        return cursor.rowcount

    def delete_by_tribe(self, tribe_id: int) -> int:
        return self.exec.delete({'tribe_id': tribe_id})

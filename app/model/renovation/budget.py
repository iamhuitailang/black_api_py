from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BudgetModel:
    TABLE_NAME = 'tb_renovation_budget'

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
                total_budget REAL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        existing = db.fetch_one(f"SELECT COUNT(*) as cnt FROM {cls.TABLE_NAME}")
        if existing and existing['cnt'] == 0:
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (total_budget, updated_at) VALUES (0, ?)",
                (now,)
            )

    def get(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one()

    def set_budget(self, total_budget: float) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        existing = self.get()
        if existing:
            self.exec.update_by_id(existing['id'], {'total_budget': total_budget, 'updated_at': now})
        else:
            self.exec.insert({'total_budget': total_budget, 'updated_at': now})
        return self.get()

from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityTagModel:
    TABLE_NAME = 'tb_bm_activity_tags'

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
                activity_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tag_id ON {cls.TABLE_NAME}(tag_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, tag_id: int) -> int:
        data = {
            'activity_id': activity_id,
            'tag_id': tag_id
        }
        return self.exec.insert(data)

    def get_by_activity(self, activity_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT t.* FROM {self.TABLE_NAME} at
            JOIN tb_bm_tags t ON at.tag_id = t.id
            WHERE at.activity_id = ?
            ORDER BY t.sort_order ASC
        """
        return self.db.fetch_all(sql, (activity_id,))

    def delete_by_activity(self, activity_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE activity_id = ?"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

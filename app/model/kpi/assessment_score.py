from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AssessmentScoreModel:
    TABLE_NAME = 'tb_kpi_assessment_score'

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
                record_id INTEGER NOT NULL,
                dimension_id INTEGER NOT NULL,
                self_score INTEGER,
                self_comment TEXT,
                supervisor_score INTEGER,
                supervisor_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_record ON {cls.TABLE_NAME}(record_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dimension ON {cls.TABLE_NAME}(dimension_id)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def batch_create(self, scores: List[Dict[str, Any]]) -> List[int]:
        ids = []
        for score in scores:
            ids.append(self.create(score))
        return ids

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_record_id(self, record_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.*, d.name as dimension_name, d.weight, d.description as dimension_description
            FROM {self.TABLE_NAME} s
            LEFT JOIN tb_kpi_assessment_dimension d ON s.dimension_id = d.id
            WHERE s.record_id = ?
            ORDER BY d.sort_order ASC, d.id ASC
        """
        return self.db.fetch_all(sql, (record_id,))

    def delete_by_record_id(self, record_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE record_id = ?"
        cursor = self.db.execute(sql, (record_id,))
        return cursor.rowcount if cursor else 0

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class FormFieldModel:
    TABLE_NAME = 'tb_bm_form_fields'

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
                field_name TEXT NOT NULL,
                field_type TEXT NOT NULL,
                is_required INTEGER DEFAULT 0,
                options TEXT,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, field_name: str, field_type: str,
               is_required: int = 0, options: List[str] = None, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'field_name': field_name,
            'field_type': field_type,
            'is_required': is_required,
            'options': json.dumps(options) if options else None,
            'sort_order': sort_order,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_activity(self, activity_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE activity_id = ? ORDER BY sort_order ASC, id ASC"
        return self.db.fetch_all(sql, (activity_id,))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'field_name', 'field_type', 'is_required', 'options', 'sort_order'
        ]}
        if 'options' in update_data and update_data['options']:
            update_data['options'] = json.dumps(update_data['options'])
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_activity(self, activity_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE activity_id = ?"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def to_dict(self, field: Dict[str, Any]) -> Dict[str, Any]:
        options = field.get('options')
        if options:
            try:
                options = json.loads(options)
            except:
                options = None
        return {
            'id': field.get('id'),
            'activity_id': field.get('activity_id'),
            'field_name': field.get('field_name'),
            'field_type': field.get('field_type'),
            'is_required': field.get('is_required'),
            'options': options,
            'sort_order': field.get('sort_order'),
            'created_at': field.get('created_at')
        }

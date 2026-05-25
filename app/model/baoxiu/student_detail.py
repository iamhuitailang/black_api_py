from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StudentDetailModel:
    TABLE_NAME = 'tb_baoxiu_student_detail'

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
                user_id INTEGER NOT NULL UNIQUE,
                student_no TEXT DEFAULT '',
                dormitory_id INTEGER DEFAULT 0,
                room_number TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dormitory_id ON {cls.TABLE_NAME}(dormitory_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, student_no: str = '',
               dormitory_id: int = 0, room_number: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'student_no': student_no,
            'dormitory_id': dormitory_id,
            'room_number': room_number,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'student_no', 'dormitory_id', 'room_number'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def update_by_user_id(self, user_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'student_no', 'dormitory_id', 'room_number'
        ]}
        return self.exec.update(update_data, conditions={'user_id': user_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def get_all(self, page: int = 1, page_size: int = 10,
                dormitory_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if dormitory_id:
            conditions['dormitory_id'] = dormitory_id

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_dormitory(self, dormitory_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('dormitory_id', dormitory_id)

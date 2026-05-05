from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SignRecordModel:
    TABLE_NAME = 'tb_qd_sign_record'

    SIGN_TYPE_NORMAL = 0
    SIGN_TYPE_SUPPLEMENT = 1

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
                user_id INTEGER NOT NULL,
                sign_date TEXT NOT NULL,
                continuous_days INTEGER DEFAULT 1,
                reward_points INTEGER DEFAULT 0,
                sign_type INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sign_date ON {cls.TABLE_NAME}(sign_date)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_date ON {cls.TABLE_NAME}(user_id, sign_date)"
        db.execute(index_sql3)

    def create(self, user_id: int, sign_date: str, continuous_days: int = 1,
               reward_points: int = 0, sign_type: int = SIGN_TYPE_NORMAL) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'sign_date': sign_date,
            'continuous_days': continuous_days,
            'reward_points': reward_points,
            'sign_type': sign_type,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_date(self, user_id: int, sign_date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'sign_date': sign_date})

    def get_user_signs_by_month(self, user_id: int, year: int, month: int) -> List[Dict[str, Any]]:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"

        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND sign_date >= ? AND sign_date < ?
            ORDER BY sign_date
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def get_last_sign(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? 
            ORDER BY sign_date DESC 
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def get_today_sign_count(self, today: str = None) -> int:
        if today is None:
            today = date.today().isoformat()
        
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE sign_date = ?"
        result = self.db.fetch_one(sql, (today,))
        return result['total'] if result else 0

    def delete_by_id(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_sign_list(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='sign_date DESC')

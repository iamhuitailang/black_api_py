from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RepairmanDetailModel:
    TABLE_NAME = 'tb_baoxiu_repairman_detail'

    STATUS_ONLINE = 0
    STATUS_OFFLINE = 1
    STATUS_BUSY = 2

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
                worker_no TEXT DEFAULT '',
                specialty TEXT DEFAULT '',
                rating REAL DEFAULT 5.0,
                order_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_specialty ON {cls.TABLE_NAME}(specialty)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, user_id: int, worker_no: str = '',
               specialty: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'worker_no': worker_no,
            'specialty': specialty,
            'rating': 5.0,
            'order_count': 0,
            'status': self.STATUS_ONLINE,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'worker_no', 'specialty', 'status'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def update_by_user_id(self, user_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'worker_no', 'specialty', 'status'
        ]}
        return self.exec.update(update_data, conditions={'user_id': user_id})

    def update_rating(self, user_id: int, new_rating: float) -> int:
        detail = self.get_by_user_id(user_id)
        if not detail:
            return 0
        current_rating = detail.get('rating', 5.0)
        order_count = detail.get('order_count', 0)
        new_avg = ((current_rating * order_count) + new_rating) / (order_count + 1)
        data = {
            'rating': round(new_avg, 1),
            'order_count': order_count + 1
        }
        return self.exec.update(data, conditions={'user_id': user_id})

    def update_status(self, user_id: int, status: int) -> int:
        return self.exec.update({'status': status}, conditions={'user_id': user_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def get_all(self, page: int = 1, page_size: int = 10,
                specialty: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if specialty:
            conditions['specialty'] = specialty
        if status is not None:
            conditions['status'] = status

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_available(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_ONLINE},
            order_by='rating DESC'
        )

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ONLINE: '在线',
            self.STATUS_OFFLINE: '离线',
            self.STATUS_BUSY: '忙碌'
        }
        return status_map.get(status, '未知')

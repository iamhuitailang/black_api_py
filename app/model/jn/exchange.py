from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ExchangeModel:
    TABLE_NAME = 'tb_jn_exchanges'

    STATUS_PENDING = '待确认'
    STATUS_ACCEPTED = '已接受'
    STATUS_IN_PROGRESS = '进行中'
    STATUS_COMPLETED = '已完成'
    STATUS_REJECTED = '已拒绝'
    STATUS_CANCELLED = '已取消'

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
                from_user INTEGER NOT NULL,
                to_user INTEGER NOT NULL,
                offer_skill_id INTEGER NOT NULL,
                need_skill_id INTEGER NOT NULL,
                status TEXT DEFAULT '待确认',
                message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_from_user ON {cls.TABLE_NAME}(from_user)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_to_user ON {cls.TABLE_NAME}(to_user)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, from_user: int, to_user: int, offer_skill_id: int,
               need_skill_id: int, message: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'from_user': from_user,
            'to_user': to_user,
            'offer_skill_id': offer_skill_id,
            'need_skill_id': need_skill_id,
            'status': self.STATUS_PENDING,
            'message': message,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_from_user(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'from_user': user_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_to_user(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'to_user': user_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_user(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        where_clauses = ["(from_user = ? OR to_user = ?)"]
        params = [user_id, user_id]

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC
        """
        return self.db.fetch_all(sql, tuple(params))

    def get_all(self, page: int = 1, page_size: int = 10,
                status: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("message LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update_status(self, exchange_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(exchange_id, data)

    def accept(self, exchange_id: int) -> int:
        return self.update_status(exchange_id, self.STATUS_ACCEPTED)

    def reject(self, exchange_id: int) -> int:
        return self.update_status(exchange_id, self.STATUS_REJECTED)

    def start(self, exchange_id: int) -> int:
        return self.update_status(exchange_id, self.STATUS_IN_PROGRESS)

    def complete(self, exchange_id: int) -> int:
        return self.update_status(exchange_id, self.STATUS_COMPLETED)

    def cancel(self, exchange_id: int) -> int:
        return self.update_status(exchange_id, self.STATUS_CANCELLED)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def check_pending_exists(self, from_user: int, to_user: int) -> bool:
        conditions = {
            'from_user': from_user,
            'to_user': to_user,
            'status': self.STATUS_PENDING
        }
        result = self.query.find_one(conditions)
        return result is not None

    def to_dict(self, exchange: Dict[str, Any]) -> Dict[str, Any]:
        status_list = [
            self.STATUS_PENDING, self.STATUS_ACCEPTED, self.STATUS_IN_PROGRESS,
            self.STATUS_COMPLETED, self.STATUS_REJECTED, self.STATUS_CANCELLED
        ]
        status_order = {s: i for i, s in enumerate(status_list)}
        current_status = exchange.get('status', '')

        return {
            'id': exchange.get('id'),
            'from_user': exchange.get('from_user'),
            'to_user': exchange.get('to_user'),
            'offer_skill_id': exchange.get('offer_skill_id'),
            'need_skill_id': exchange.get('need_skill_id'),
            'status': current_status,
            'status_order': status_order.get(current_status, 0),
            'message': exchange.get('message'),
            'created_at': exchange.get('created_at'),
            'updated_at': exchange.get('updated_at')
        }

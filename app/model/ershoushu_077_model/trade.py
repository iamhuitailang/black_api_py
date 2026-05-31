from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ErshoushuTradeModel:
    TABLE_NAME = 'tb_ershoushu_077_model_trade'

    STATUS_PENDING = 0
    STATUS_CONFIRMED = 1
    STATUS_COMPLETED = 2
    STATUS_CANCELLED = 3

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
                book_id INTEGER NOT NULL,
                buyer_id INTEGER NOT NULL,
                seller_id INTEGER NOT NULL,
                price REAL NOT NULL,
                status INTEGER DEFAULT 0,
                buyer_confirmed INTEGER DEFAULT 0,
                seller_confirmed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_book_id ON {cls.TABLE_NAME}(book_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_buyer_id ON {cls.TABLE_NAME}(buyer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_seller_id ON {cls.TABLE_NAME}(seller_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, book_id: int, buyer_id: int, seller_id: int, price: float) -> int:
        now = datetime.now().isoformat()
        data = {
            'book_id': book_id,
            'buyer_id': buyer_id,
            'seller_id': seller_id,
            'price': price,
            'status': self.STATUS_PENDING,
            'buyer_confirmed': 0,
            'seller_confirmed': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, trade_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(trade_id, data)

    def buyer_confirm(self, trade_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'buyer_confirmed': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(trade_id, data)

    def seller_confirm(self, trade_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'seller_confirmed': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(trade_id, data)

    def get_by_buyer(self, buyer_id: int, page: int = 1, page_size: int = 10,
                     status: int = None) -> Dict[str, Any]:
        conditions = {'buyer_id': buyer_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_seller(self, seller_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        conditions = {'seller_id': seller_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["(buyer_id = ? OR seller_id = ?)"]
        params = [user_id, user_id]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY created_at DESC
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

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_book(self, book_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'book_id': book_id}, order_by='created_at DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_CONFIRMED: '已确认',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, trade: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': trade.get('id'),
            'book_id': trade.get('book_id'),
            'buyer_id': trade.get('buyer_id'),
            'seller_id': trade.get('seller_id'),
            'price': trade.get('price'),
            'status': trade.get('status'),
            'status_text': self.get_status_text(trade.get('status')),
            'buyer_confirmed': trade.get('buyer_confirmed'),
            'seller_confirmed': trade.get('seller_confirmed'),
            'created_at': trade.get('created_at'),
            'updated_at': trade.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        confirmed_result = self.db.fetch_one(sql, (self.STATUS_CONFIRMED,))
        confirmed = confirmed_result['count'] if confirmed_result else 0

        completed_result = self.db.fetch_one(sql, (self.STATUS_COMPLETED,))
        completed = completed_result['count'] if completed_result else 0

        cancelled_result = self.db.fetch_one(sql, (self.STATUS_CANCELLED,))
        cancelled = cancelled_result['count'] if cancelled_result else 0

        sql = f"SELECT SUM(price) as total_amount FROM {self.TABLE_NAME} WHERE status = ?"
        amount_result = self.db.fetch_one(sql, (self.STATUS_COMPLETED,))
        total_amount = amount_result['total_amount'] if amount_result and amount_result['total_amount'] else 0

        return {
            'total': total,
            'pending': pending,
            'confirmed': confirmed,
            'completed': completed,
            'cancelled': cancelled,
            'total_amount': round(total_amount, 2)
        }

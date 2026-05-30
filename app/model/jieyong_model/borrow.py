from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BorrowModel:
    TABLE_NAME = 'tb_jieyong_model_borrow'

    STATUS_PENDING = 0
    STATUS_BORROWED = 1
    STATUS_RETURNED = 2
    STATUS_OVERDUE = 3
    STATUS_REJECTED = 4

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
                item_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                expected_return_date TIMESTAMP NOT NULL,
                actual_return_date TIMESTAMP,
                remark TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                reject_reason TEXT DEFAULT '',
                fine_amount REAL DEFAULT 0,
                admin_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item ON {cls.TABLE_NAME}(item_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expected ON {cls.TABLE_NAME}(expected_return_date)"
        db.execute(index_sql4)

    def create(self, user_id: int, item_id: int, quantity: int, expected_return_date: str,
               remark: str = '', status: int = STATUS_BORROWED) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'item_id': item_id,
            'quantity': quantity,
            'expected_return_date': expected_return_date,
            'remark': remark,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                item_id: int = None, status: int = None, keyword: str = None,
                start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if item_id:
            conditions['item_id'] = item_id
        if status is not None:
            conditions['status'] = status

        if keyword or start_date or end_date:
            return self.search(keyword, page, page_size, user_id, item_id, status, start_date, end_date)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               user_id: int = None, item_id: int = None, status: int = None,
               start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        if item_id:
            where_clauses.append("item_id = ?")
            params.append(item_id)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if start_date:
            where_clauses.append("created_at >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("created_at <= ?")
            params.append(end_date + ' 23:59:59')

        if keyword:
            where_clauses.append("(remark LIKE ? OR reject_reason LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern])

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

    def update_status(self, record_id: int, status: int, reject_reason: str = '',
                      admin_id: int = None, fine_amount: float = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if reject_reason:
            data['reject_reason'] = reject_reason
        if admin_id:
            data['admin_id'] = admin_id
        if fine_amount > 0:
            data['fine_amount'] = fine_amount
        if status == self.STATUS_RETURNED:
            data['actual_return_date'] = now
        return self.exec.update_by_id(record_id, data)

    def return_item(self, record_id: int, fine_amount: float = 0, admin_id: int = None) -> int:
        return self.update_status(record_id, self.STATUS_RETURNED, admin_id=admin_id, fine_amount=fine_amount)

    def reject(self, record_id: int, reject_reason: str, admin_id: int = None) -> int:
        return self.update_status(record_id, self.STATUS_REJECTED, reject_reason=reject_reason, admin_id=admin_id)

    def mark_overdue(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_OVERDUE)

    def check_and_mark_overdue(self) -> List[int]:
        now = datetime.now().isoformat()
        sql = f"""
            SELECT id FROM {self.TABLE_NAME} 
            WHERE status IN (?, ?) 
            AND expected_return_date < ?
        """
        overdue_records = self.db.fetch_all(sql, (self.STATUS_PENDING, self.STATUS_BORROWED, now))
        
        updated_ids = []
        for record in overdue_records:
            record_id = record.get('id')
            if self.update_status(record_id, self.STATUS_OVERDUE) > 0:
                updated_ids.append(record_id)
        
        return updated_ids

    def get_overdue_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.get_all(page, page_size, status=self.STATUS_OVERDUE)

    def get_user_borrowed_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_BORROWED})

    def get_item_borrowed_count(self, item_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(quantity), 0) as total FROM {self.TABLE_NAME} WHERE item_id = ? AND status IN (?, ?)"
        result = self.db.fetch_one(sql, (item_id, self.STATUS_PENDING, self.STATUS_BORROWED))
        return result.get('total', 0) if result else 0

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_BORROWED: '借用中',
            self.STATUS_RETURNED: '已归还',
            self.STATUS_OVERDUE: '已逾期',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

    def is_overdue(self, expected_return_date: str) -> bool:
        try:
            if isinstance(expected_return_date, str):
                expected_dt = datetime.fromisoformat(expected_return_date)
            else:
                expected_dt = expected_return_date
            return expected_dt < datetime.now()
        except (ValueError, TypeError):
            return False

    def calculate_overdue_days(self, expected_return_date: str) -> int:
        try:
            if isinstance(expected_return_date, str):
                expected_dt = datetime.fromisoformat(expected_return_date)
            else:
                expected_dt = expected_return_date
            now = datetime.now()
            if expected_dt < now:
                return (now - expected_dt).days
            return 0
        except (ValueError, TypeError):
            return 0

    def to_dict(self, borrow: Dict[str, Any], include_user: bool = True, 
                include_item: bool = True) -> Dict[str, Any]:
        status = borrow.get('status')
        status_str_map = {
            self.STATUS_PENDING: 'pending',
            self.STATUS_BORROWED: 'borrowing',
            self.STATUS_RETURNED: 'returned',
            self.STATUS_OVERDUE: 'overdue',
            self.STATUS_REJECTED: 'rejected'
        }
        status_str = status_str_map.get(status, 'unknown')
        
        created_at = borrow.get('created_at')
        actual_return_date = borrow.get('actual_return_date')
        expected_return_date = borrow.get('expected_return_date')
        
        borrow_date = ''
        if created_at:
            try:
                borrow_date = created_at[:10]
            except:
                borrow_date = str(created_at)
        
        return_date = ''
        if actual_return_date:
            try:
                return_date = actual_return_date[:10]
            except:
                return_date = str(actual_return_date)
        
        overdue_days = 0
        is_overdue = status == self.STATUS_OVERDUE or (
            status in [self.STATUS_PENDING, self.STATUS_BORROWED] and 
            self.is_overdue(expected_return_date)
        )
        if is_overdue and expected_return_date:
            overdue_days = self.calculate_overdue_days(expected_return_date)
        
        result = {
            'id': borrow.get('id'),
            'user_id': borrow.get('user_id'),
            'item_id': borrow.get('item_id'),
            'quantity': borrow.get('quantity'),
            'expected_return_date': expected_return_date[:10] if expected_return_date else '',
            'actual_return_date': actual_return_date,
            'return_date': return_date,
            'borrow_date': borrow_date,
            'remark': borrow.get('remark'),
            'status': status_str,
            'status_num': status,
            'status_text': self.get_status_text(status),
            'reject_reason': borrow.get('reject_reason'),
            'fine_amount': borrow.get('fine_amount'),
            'admin_id': borrow.get('admin_id'),
            'is_overdue': is_overdue,
            'overdue_days': overdue_days,
            'created_at': created_at
        }

        if include_user and borrow.get('user_id'):
            from app.model.jieyong_model.user import UserModel
            user_model = UserModel()
            user = user_model.get_by_id(borrow.get('user_id'))
            if user:
                result['user_nickname'] = user.get('nickname')
                result['user_phone'] = user.get('phone')

        if include_item and borrow.get('item_id'):
            from app.model.jieyong_model.item import ItemModel
            item_model = ItemModel()
            item = item_model.get_by_id(borrow.get('item_id'))
            if item:
                result['item_name'] = item.get('name')
                result['item_image'] = item.get('image')

        return result

    def get_statistics(self) -> Dict[str, Any]:
        total_borrows = self.query.count()
        pending_count = self.query.count({'status': self.STATUS_PENDING})
        borrowed_count = self.query.count({'status': self.STATUS_BORROWED})
        returned_count = self.query.count({'status': self.STATUS_RETURNED})
        overdue_count = self.query.count({'status': self.STATUS_OVERDUE})
        rejected_count = self.query.count({'status': self.STATUS_REJECTED})

        sql = f"""
            SELECT item_id, COUNT(*) as borrow_count 
            FROM {self.TABLE_NAME} 
            GROUP BY item_id 
            ORDER BY borrow_count DESC 
            LIMIT 10
        """
        top_items = self.db.fetch_all(sql)

        from app.model.jieyong_model.item import ItemModel
        item_model = ItemModel()
        hot_items = []
        for row in top_items:
            item = item_model.get_by_id(row.get('item_id'))
            if item:
                hot_items.append({
                    'item_id': row.get('item_id'),
                    'item_name': item.get('name'),
                    'borrow_count': row.get('borrow_count')
                })

        sql2 = f"""
            SELECT user_id, COUNT(*) as borrow_count 
            FROM {self.TABLE_NAME} 
            GROUP BY user_id 
            ORDER BY borrow_count DESC 
            LIMIT 10
        """
        top_users = self.db.fetch_all(sql2)

        from app.model.jieyong_model.user import UserModel
        user_model = UserModel()
        active_users = []
        for row in top_users:
            user = user_model.get_by_id(row.get('user_id'))
            if user:
                active_users.append({
                    'user_id': row.get('user_id'),
                    'user_nickname': user.get('nickname'),
                    'borrow_count': row.get('borrow_count')
                })

        return {
            'total_borrows': total_borrows,
            'pending_count': pending_count,
            'borrowed_count': borrowed_count,
            'returned_count': returned_count,
            'overdue_count': overdue_count,
            'rejected_count': rejected_count,
            'hot_items': hot_items,
            'active_users': active_users
        }

    def get_unread_overdue_count(self, user_id: int) -> int:
        return self.query.count({
            'user_id': user_id,
            'status': self.STATUS_OVERDUE
        })

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random
import string


class KuaidiPackageModel:
    TABLE_NAME = 'tb_kuaidi_077_model_package'

    STATUS_PENDING = 0
    STATUS_STORED = 1
    STATUS_PICKED = 2
    STATUS_OVERDUE = 3
    STATUS_RETURNED = 4

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
                tracking_number TEXT NOT NULL UNIQUE,
                courier_company TEXT DEFAULT '',
                recipient_name TEXT NOT NULL,
                recipient_phone TEXT NOT NULL,
                user_id INTEGER DEFAULT 0,
                package_type TEXT DEFAULT '',
                weight REAL DEFAULT 0,
                cabinet_number TEXT DEFAULT '',
                shelf_number TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                stored_at TIMESTAMP,
                picked_at TIMESTAMP,
                picked_by INTEGER DEFAULT 0,
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tracking_number ON {cls.TABLE_NAME}(tracking_number)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipient_phone ON {cls.TABLE_NAME}(recipient_phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_stored_at ON {cls.TABLE_NAME}(stored_at)"
        db.execute(index_sql)

    def create(self, tracking_number: str, courier_company: str, recipient_name: str,
               recipient_phone: str, user_id: int = 0, package_type: str = '',
               weight: float = 0, cabinet_number: str = '', shelf_number: str = '',
               remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'tracking_number': tracking_number,
            'courier_company': courier_company,
            'recipient_name': recipient_name,
            'recipient_phone': recipient_phone,
            'user_id': user_id,
            'package_type': package_type,
            'weight': weight,
            'cabinet_number': cabinet_number,
            'shelf_number': shelf_number,
            'status': self.STATUS_STORED,
            'stored_at': now,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_tracking_number(self, tracking_number: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'tracking_number': tracking_number})

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_user_id_or_phone(self, user_id: int, phone: str, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["(user_id = ? OR recipient_phone = ?)"]
        params = [user_id, phone]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

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
            'total_pages': (total + page_size - 1) // page_size if total > 0 else 0
        }

    def bind_user_id(self, phone: str, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET user_id = ?, updated_at = ? WHERE recipient_phone = ? AND user_id = 0"
        cursor = self.db.execute(sql, (user_id, datetime.now().isoformat(), phone))
        return cursor.rowcount

    def get_by_phone(self, phone: str, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'recipient_phone': phone}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update_status(self, package_id: int, status: int, picked_by: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_PICKED:
            data['picked_at'] = now
            data['picked_by'] = picked_by
        return self.exec.update_by_id(package_id, data)

    def update(self, package_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'tracking_number', 'courier_company', 'recipient_name',
            'recipient_phone', 'user_id', 'package_type', 'weight',
            'cabinet_number', 'shelf_number', 'remark'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(package_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword or start_date or end_date:
            return self.search(keyword, page, page_size, status, start_date, end_date)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str = None, page: int = 1, page_size: int = 10,
               status: int = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if keyword:
            where_clauses.append("(tracking_number LIKE ? OR recipient_name LIKE ? OR recipient_phone LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

        if start_date:
            where_clauses.append("DATE(stored_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(stored_at) <= ?")
            params.append(end_date)

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

    def get_overdue_packages(self, days: int = 3, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        overdue_date = (datetime.now() - timedelta(days=days)).isoformat()

        where_clauses = ["status = ?", "stored_at < ?"]
        params = [self.STATUS_STORED, overdue_date]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY stored_at ASC
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

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                status, COUNT(*) as count
            FROM {self.TABLE_NAME}
            GROUP BY status
        """
        results = self.db.fetch_all(sql)

        stats = {
            'total': 0,
            'pending': 0,
            'stored': 0,
            'picked': 0,
            'overdue': 0,
            'returned': 0
        }

        for result in results:
            status = result['status']
            count = result['count']
            stats['total'] += count
            if status == self.STATUS_PENDING:
                stats['pending'] = count
            elif status == self.STATUS_STORED:
                stats['stored'] = count
            elif status == self.STATUS_PICKED:
                stats['picked'] = count
            elif status == self.STATUS_OVERDUE:
                stats['overdue'] = count
            elif status == self.STATUS_RETURNED:
                stats['returned'] = count

        today = datetime.now().date().isoformat()
        today_sql = f"""
            SELECT COUNT(*) as count
            FROM {self.TABLE_NAME}
            WHERE DATE(stored_at) = ?
        """
        today_result = self.db.fetch_one(today_sql, (today,))
        stats['today_stored'] = today_result['count'] if today_result else 0

        today_picked_sql = f"""
            SELECT COUNT(*) as count
            FROM {self.TABLE_NAME}
            WHERE DATE(picked_at) = ?
        """
        today_picked_result = self.db.fetch_one(today_picked_sql, (today,))
        stats['today_picked'] = today_picked_result['count'] if today_picked_result else 0

        return stats

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待入库',
            self.STATUS_STORED: '已入库',
            self.STATUS_PICKED: '已取件',
            self.STATUS_OVERDUE: '已超时',
            self.STATUS_RETURNED: '已退回'
        }
        return status_map.get(status, '未知')

    def to_dict(self, package: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': package.get('id'),
            'tracking_number': package.get('tracking_number'),
            'courier_company': package.get('courier_company'),
            'recipient_name': package.get('recipient_name'),
            'recipient_phone': package.get('recipient_phone'),
            'user_id': package.get('user_id'),
            'package_type': package.get('package_type'),
            'weight': package.get('weight'),
            'cabinet_number': package.get('cabinet_number'),
            'shelf_number': package.get('shelf_number'),
            'status': package.get('status'),
            'status_text': self.get_status_text(package.get('status')),
            'stored_at': package.get('stored_at'),
            'picked_at': package.get('picked_at'),
            'picked_by': package.get('picked_by'),
            'remark': package.get('remark'),
            'created_at': package.get('created_at')
        }

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_fuwu_077_model_order'

    STATUS_PENDING = 0
    STATUS_ASSIGNED = 1
    STATUS_CONFIRMED = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4

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
                order_no TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                service_name TEXT DEFAULT '',
                service_price REAL DEFAULT 0,
                staff_id INTEGER DEFAULT NULL,
                appointment_time TIMESTAMP NOT NULL,
                address TEXT DEFAULT '',
                contact_name TEXT DEFAULT '',
                contact_phone TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                user_confirmed INTEGER DEFAULT 0,
                staff_confirmed INTEGER DEFAULT 0,
                total_amount REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_staff_id ON {cls.TABLE_NAME}(staff_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_service_id ON {cls.TABLE_NAME}(service_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_appointment ON {cls.TABLE_NAME}(appointment_time)"
        db.execute(index_sql)

    def _generate_order_no(self) -> str:
        now = datetime.now()
        prefix = now.strftime('%Y%m%d%H%M%S')
        import random
        suffix = str(random.randint(1000, 9999))
        return f'FW{prefix}{suffix}'

    def create(self, user_id: int, service_id: int, service_name: str, 
               service_price: float, appointment_time: str, address: str,
               contact_name: str, contact_phone: str, remark: str = '') -> int:
        order_no = self._generate_order_no()
        now = datetime.now().isoformat()
        data = {
            'order_no': order_no,
            'user_id': user_id,
            'service_id': service_id,
            'service_name': service_name,
            'service_price': service_price,
            'staff_id': None,
            'appointment_time': appointment_time,
            'address': address,
            'contact_name': contact_name,
            'contact_phone': contact_phone,
            'remark': remark,
            'status': self.STATUS_PENDING,
            'user_confirmed': 0,
            'staff_confirmed': 0,
            'total_amount': service_price,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def get_by_user_id(self, user_id: int, page: int = 1, 
                       page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_staff_id(self, staff_id: int, page: int = 1, 
                        page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'staff_id': staff_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def assign_staff(self, order_id: int, staff_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'staff_id': staff_id,
            'status': self.STATUS_ASSIGNED,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def user_confirm(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        order = self.get_by_id(order_id)
        if not order:
            return 0
        
        data = {
            'user_confirmed': 1,
            'updated_at': now
        }
        
        if order.get('staff_confirmed') == 1:
            data['status'] = self.STATUS_COMPLETED
        
        return self.exec.update_by_id(order_id, data)

    def staff_confirm(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        order = self.get_by_id(order_id)
        if not order:
            return 0
        
        data = {
            'staff_confirmed': 1,
            'updated_at': now
        }
        
        if order.get('user_confirmed') == 1:
            data['status'] = self.STATUS_COMPLETED
        
        return self.exec.update_by_id(order_id, data)

    def update_status(self, order_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def cancel_order(self, order_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                user_id: int = None, staff_id: int = None, 
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if user_id:
            conditions['user_id'] = user_id
        if staff_id:
            conditions['staff_id'] = staff_id

        if keyword:
            return self.search(keyword, page, page_size, status, user_id, staff_id)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, user_id: int = None, 
               staff_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if staff_id:
            where_clauses.append("staff_id = ?")
            params.append(staff_id)

        where_clauses.append("(order_no LIKE ? OR service_name LIKE ? OR contact_name LIKE ? OR contact_phone LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

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

    def get_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        where_sql = ' AND '.join(where_clauses)

        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as assigned_orders,
                SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as confirmed_orders,
                SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(total_amount) as total_amount
            FROM {self.TABLE_NAME} 
            WHERE {where_sql}
        """
        result = self.db.fetch_one(sql, tuple(params) if params else None)

        daily_sql = f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                SUM(total_amount) as daily_amount
            FROM {self.TABLE_NAME} 
            WHERE {where_sql}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        daily_stats = self.db.fetch_all(daily_sql, tuple(params) if params else None)

        service_sql = f"""
            SELECT 
                service_name,
                COUNT(*) as order_count,
                SUM(total_amount) as service_amount
            FROM {self.TABLE_NAME} 
            WHERE {where_sql}
            GROUP BY service_name
            ORDER BY order_count DESC
            LIMIT 10
        """
        service_stats = self.db.fetch_all(service_sql, tuple(params) if params else None)

        return {
            'overview': result or {},
            'daily_stats': daily_stats,
            'service_stats': service_stats
        }

    def get_upcoming_orders(self, hours: int = 24) -> List[Dict[str, Any]]:
        from datetime import datetime, timedelta
        start_time = datetime.now().isoformat()
        end_time = (datetime.now() + timedelta(hours=hours)).isoformat()
        
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE appointment_time >= ? AND appointment_time <= ?
            AND status IN (0, 1)
            ORDER BY appointment_time ASC
        """
        return self.db.fetch_all(sql, (start_time, end_time))

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待派单',
            self.STATUS_ASSIGNED: '已派单',
            self.STATUS_CONFIRMED: '已确认',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, order: Dict[str, Any], user: Dict[str, Any] = None, 
                staff: Dict[str, Any] = None, service: Dict[str, Any] = None) -> Dict[str, Any]:
        result = {
            'id': order.get('id'),
            'order_no': order.get('order_no'),
            'user_id': order.get('user_id'),
            'service_id': order.get('service_id'),
            'service_name': order.get('service_name'),
            'service_price': order.get('service_price'),
            'staff_id': order.get('staff_id'),
            'appointment_time': order.get('appointment_time'),
            'address': order.get('address'),
            'contact_name': order.get('contact_name'),
            'contact_phone': order.get('contact_phone'),
            'remark': order.get('remark'),
            'status': order.get('status'),
            'status_text': self.get_status_text(order.get('status')),
            'user_confirmed': order.get('user_confirmed'),
            'staff_confirmed': order.get('staff_confirmed'),
            'total_amount': order.get('total_amount'),
            'created_at': order.get('created_at'),
            'updated_at': order.get('updated_at')
        }
        
        if user:
            result['user'] = {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }
        
        if staff:
            result['staff'] = {
                'id': staff.get('id'),
                'name': staff.get('name'),
                'phone': staff.get('phone'),
                'avatar': staff.get('avatar'),
                'rating': staff.get('rating')
            }
        
        if service:
            result['service'] = {
                'id': service.get('id'),
                'name': service.get('name'),
                'category': service.get('category'),
                'description': service.get('description'),
                'price': service.get('price'),
                'unit': service.get('unit'),
                'duration': service.get('duration'),
                'image': service.get('image')
            }
        
        return result

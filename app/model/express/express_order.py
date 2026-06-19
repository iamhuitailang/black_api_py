from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import IntEnum
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderStatus(IntEnum):
    PENDING = 0
    ACCEPTED = 1
    PICKED_UP = 2
    DELIVERED = 3
    CANCELLED = 4


class ExpressOrderModel:
    TABLE_NAME = 'tb_express_order'
    
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
                publisher_id INTEGER NOT NULL,
                taker_id INTEGER,
                courier_company TEXT NOT NULL,
                pickup_location TEXT NOT NULL,
                estimated_arrival TIMESTAMP NOT NULL,
                pickup_deadline TIMESTAMP NOT NULL,
                reward REAL NOT NULL DEFAULT 0.0,
                pickup_code TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                accepted_at TIMESTAMP,
                picked_up_at TIMESTAMP,
                delivered_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_publisher_id ON {cls.TABLE_NAME}(publisher_id)"
        db.execute(index_sql2)
        
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_taker_id ON {cls.TABLE_NAME}(taker_id)"
        db.execute(index_sql3)
    
    def create_order(self, publisher_id: int, courier_company: str, pickup_location: str,
                     estimated_arrival: str, pickup_deadline: str, reward: float,
                     pickup_code: str = '', remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'publisher_id': publisher_id,
            'courier_company': courier_company,
            'pickup_location': pickup_location,
            'estimated_arrival': estimated_arrival,
            'pickup_deadline': pickup_deadline,
            'reward': reward,
            'pickup_code': pickup_code,
            'remark': remark,
            'status': OrderStatus.PENDING.value,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)
    
    def get_by_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(order_id)
    
    def get_order_detail(self, order_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT o.*, 
                   pu.nickname as publisher_nickname, 
                   pu.avatar as publisher_avatar,
                   pu.reputation as publisher_reputation,
                   tu.nickname as taker_nickname,
                   tu.avatar as taker_avatar,
                   tu.reputation as taker_reputation
            FROM {self.TABLE_NAME} o
            LEFT JOIN tb_express_user_profile pu ON o.publisher_id = pu.user_id
            LEFT JOIN tb_express_user_profile tu ON o.taker_id = tu.user_id
            WHERE o.id = ?
        """
        return self.db.fetch_one(sql, (order_id,))
    
    def get_list(self, status: int = None, page: int = 1, page_size: int = 20,
                 user_id: int = None, role: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        
        where_clauses = []
        params = []
        
        if status is not None:
            where_clauses.append('o.status = ?')
            params.append(status)
        
        if user_id is not None and role:
            if role == 'publisher':
                where_clauses.append('o.publisher_id = ?')
                params.append(user_id)
            elif role == 'taker':
                where_clauses.append('o.taker_id = ?')
                params.append(user_id)
        
        where_sql = ''
        if where_clauses:
            where_sql = 'WHERE ' + ' AND '.join(where_clauses)
        
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} o {where_sql}"
        total_result = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total = total_result.get('total', 0) if total_result else 0
        
        list_sql = f"""
            SELECT o.*, 
                   pu.nickname as publisher_nickname, 
                   pu.avatar as publisher_avatar,
                   pu.reputation as publisher_reputation
            FROM {self.TABLE_NAME} o
            LEFT JOIN tb_express_user_profile pu ON o.publisher_id = pu.user_id
            {where_sql}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([page_size, offset])
        items = self.db.fetch_all(list_sql, tuple(params))
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    def accept_order(self, order_id: int, taker_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'taker_id': taker_id,
            'status': OrderStatus.ACCEPTED.value,
            'accepted_at': now,
            'updated_at': now
        }
        conditions = {
            'id': order_id,
            'status': OrderStatus.PENDING.value
        }
        return self.exec.update(data, conditions)
    
    def pick_up_order(self, order_id: int, taker_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': OrderStatus.PICKED_UP.value,
            'picked_up_at': now,
            'updated_at': now
        }
        conditions = {
            'id': order_id,
            'taker_id': taker_id,
            'status': OrderStatus.ACCEPTED.value
        }
        return self.exec.update(data, conditions)
    
    def confirm_delivery(self, order_id: int, publisher_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': OrderStatus.DELIVERED.value,
            'delivered_at': now,
            'updated_at': now
        }
        conditions = {
            'id': order_id,
            'publisher_id': publisher_id,
            'status': OrderStatus.PICKED_UP.value
        }
        return self.exec.update(data, conditions)
    
    def cancel_order(self, order_id: int, publisher_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': OrderStatus.CANCELLED.value,
            'updated_at': now
        }
        conditions = {
            'id': order_id,
            'publisher_id': publisher_id
        }
        return self.exec.update(data, conditions)
    
    def get_user_order_count(self, user_id: int, role: str = 'publisher') -> Dict[str, int]:
        role_field = 'publisher_id' if role == 'publisher' else 'taker_id'
        
        sql = f"""
            SELECT status, COUNT(*) as count
            FROM {self.TABLE_NAME}
            WHERE {role_field} = ?
            GROUP BY status
        """
        results = self.db.fetch_all(sql, (user_id,))
        
        counts = {
            'total': 0,
            'pending': 0,
            'accepted': 0,
            'picked_up': 0,
            'delivered': 0,
            'cancelled': 0
        }
        
        status_map = {
            OrderStatus.PENDING.value: 'pending',
            OrderStatus.ACCEPTED.value: 'accepted',
            OrderStatus.PICKED_UP.value: 'picked_up',
            OrderStatus.DELIVERED.value: 'delivered',
            OrderStatus.CANCELLED.value: 'cancelled'
        }
        
        for row in results:
            status = row.get('status')
            count = row.get('count', 0)
            status_key = status_map.get(status)
            if status_key:
                counts[status_key] = count
                counts['total'] += count
        
        return counts

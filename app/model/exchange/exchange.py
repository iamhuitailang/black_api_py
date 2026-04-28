from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ExExchangeModel:
    TABLE_NAME = 'tb_ex_exchanges'
    
    STATUS_PENDING = 1
    STATUS_AGREED = 2
    STATUS_COMPLETED = 3
    STATUS_REJECTED = 4
    STATUS_CANCELLED = 5
    
    STATUS_TEXT = {
        1: '待处理',
        2: '已同意',
        3: '已完成',
        4: '已拒绝',
        5: '已取消'
    }
    
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
                requester_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                requester_item_id INTEGER NOT NULL,
                receiver_item_id INTEGER NOT NULL,
                message TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_requester ON {cls.TABLE_NAME}(requester_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_receiver ON {cls.TABLE_NAME}(receiver_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, requester_id: int, receiver_id: int, requester_item_id: int,
               receiver_item_id: int, message: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'requester_id': requester_id,
            'receiver_id': receiver_id,
            'requester_item_id': requester_item_id,
            'receiver_item_id': receiver_item_id,
            'message': message,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_sent_list(self, user_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        conditions = {'requester_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_received_list(self, user_id: int, page: int = 1, page_size: int = 10,
                          status: int = None) -> Dict[str, Any]:
        conditions = {'receiver_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update_status(self, exchange_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_COMPLETED:
            data['completed_at'] = now
        return self.exec.update_by_id(exchange_id, data)

    def check_pending_exists(self, requester_id: int, receiver_item_id: int) -> bool:
        return self.query.exists({
            'requester_id': requester_id,
            'receiver_item_id': receiver_item_id,
            'status': self.STATUS_PENDING
        })

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, exchange: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': exchange.get('id'),
            'requester_id': exchange.get('requester_id'),
            'receiver_id': exchange.get('receiver_id'),
            'requester_item_id': exchange.get('requester_item_id'),
            'receiver_item_id': exchange.get('receiver_item_id'),
            'message': exchange.get('message'),
            'status': exchange.get('status'),
            'status_text': self.STATUS_TEXT.get(exchange.get('status'), '未知'),
            'created_at': exchange.get('created_at'),
            'updated_at': exchange.get('updated_at'),
            'completed_at': exchange.get('completed_at')
        }


class ExReviewModel:
    TABLE_NAME = 'tb_ex_reviews'
    
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
                exchange_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                reviewee_id INTEGER NOT NULL,
                description_score INTEGER DEFAULT 5,
                attitude_score INTEGER DEFAULT 5,
                efficiency_score INTEGER DEFAULT 5,
                comment TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_exchange ON {cls.TABLE_NAME}(exchange_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer ON {cls.TABLE_NAME}(reviewer_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewee ON {cls.TABLE_NAME}(reviewee_id)"
        db.execute(index_sql3)

    def create(self, exchange_id: int, reviewer_id: int, reviewee_id: int,
               description_score: int, attitude_score: int, efficiency_score: int,
               comment: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'exchange_id': exchange_id,
            'reviewer_id': reviewer_id,
            'reviewee_id': reviewee_id,
            'description_score': description_score,
            'attitude_score': attitude_score,
            'efficiency_score': efficiency_score,
            'comment': comment,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_exchange(self, exchange_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'exchange_id': exchange_id}, order_by='id ASC')

    def get_by_reviewee(self, reviewee_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reviewee_id': reviewee_id}, order_by='id DESC')

    def check_exists(self, exchange_id: int, reviewer_id: int) -> bool:
        return self.query.exists({
            'exchange_id': exchange_id,
            'reviewer_id': reviewer_id
        })

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'exchange_id': review.get('exchange_id'),
            'reviewer_id': review.get('reviewer_id'),
            'reviewee_id': review.get('reviewee_id'),
            'description_score': review.get('description_score'),
            'attitude_score': review.get('attitude_score'),
            'efficiency_score': review.get('efficiency_score'),
            'comment': review.get('comment'),
            'created_at': review.get('created_at')
        }


class ExMessageModel:
    TABLE_NAME = 'tb_ex_messages'
    
    TYPE_SYSTEM = 0
    TYPE_USER = 1
    
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
                sender_id INTEGER DEFAULT 0,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                msg_type INTEGER DEFAULT 0,
                exchange_id INTEGER,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_receiver ON {cls.TABLE_NAME}(receiver_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_exchange ON {cls.TABLE_NAME}(exchange_id)"
        db.execute(index_sql3)

    def create(self, receiver_id: int, content: str, sender_id: int = 0,
               msg_type: int = 0, exchange_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'msg_type': msg_type,
            'exchange_id': exchange_id,
            'is_read': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_receiver(self, receiver_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.query.paginate(page, page_size, {'receiver_id': receiver_id}, order_by='id DESC')
        return result

    def get_unread_count(self, receiver_id: int) -> int:
        return self.query.count({'receiver_id': receiver_id, 'is_read': 0})

    def mark_as_read(self, message_id: int) -> int:
        return self.exec.update_by_id(message_id, {'is_read': 1})

    def mark_all_read(self, receiver_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE receiver_id = ? AND is_read = 0",
            (receiver_id,)
        )

    def send_system_message(self, receiver_id: int, content: str, exchange_id: int = None) -> int:
        return self.create(receiver_id, content, sender_id=0, msg_type=self.TYPE_SYSTEM, exchange_id=exchange_id)

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, msg: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': msg.get('id'),
            'sender_id': msg.get('sender_id'),
            'receiver_id': msg.get('receiver_id'),
            'content': msg.get('content'),
            'msg_type': msg.get('msg_type'),
            'exchange_id': msg.get('exchange_id'),
            'is_read': msg.get('is_read'),
            'created_at': msg.get('created_at')
        }

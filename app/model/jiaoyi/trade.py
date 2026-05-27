from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_jiaoyi_model_orders'

    STATUS_PENDING = 0
    STATUS_PAID = 1
    STATUS_SHIPPED = 2
    STATUS_RECEIVED = 3
    STATUS_COMPLETED = 4
    STATUS_CANCELLED = 5
    STATUS_REFUNDING = 6
    STATUS_REFUNDED = 7

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
                buyer_id INTEGER NOT NULL,
                seller_id INTEGER NOT NULL,
                book_id INTEGER NOT NULL,
                book_title TEXT DEFAULT '',
                book_image TEXT DEFAULT '',
                price REAL DEFAULT 0,
                quantity INTEGER DEFAULT 1,
                total_price REAL DEFAULT 0,
                status INTEGER DEFAULT 0,
                receiver_name TEXT DEFAULT '',
                receiver_phone TEXT DEFAULT '',
                receiver_address TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                cancel_reason TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP DEFAULT NULL,
                shipped_at TIMESTAMP DEFAULT NULL,
                received_at TIMESTAMP DEFAULT NULL,
                completed_at TIMESTAMP DEFAULT NULL
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_buyer_id ON {cls.TABLE_NAME}(buyer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_seller_id ON {cls.TABLE_NAME}(seller_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def _generate_order_no(self) -> str:
        now = datetime.now()
        return f"JY{now.strftime('%Y%m%d%H%M%S')}{now.microsecond // 1000:03d}"

    def create(self, buyer_id: int, seller_id: int, book_id: int, book_title: str = '',
               book_image: str = '', price: float = 0, quantity: int = 1,
               receiver_name: str = '', receiver_phone: str = '',
               receiver_address: str = '', remark: str = '') -> int:
        order_no = self._generate_order_no()
        total_price = price * quantity
        now = datetime.now().isoformat()
        data = {
            'order_no': order_no,
            'buyer_id': buyer_id,
            'seller_id': seller_id,
            'book_id': book_id,
            'book_title': book_title,
            'book_image': book_image,
            'price': price,
            'quantity': quantity,
            'total_price': total_price,
            'status': self.STATUS_PENDING,
            'receiver_name': receiver_name,
            'receiver_phone': receiver_phone,
            'receiver_address': receiver_address,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def update_status(self, record_id: int, status: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'status': status, 'updated_at': now}
        
        if status == self.STATUS_PAID:
            data['paid_at'] = now
        elif status == self.STATUS_SHIPPED:
            data['shipped_at'] = now
        elif status == self.STATUS_RECEIVED:
            data['received_at'] = now
        elif status == self.STATUS_COMPLETED:
            data['completed_at'] = now
        
        data.update(kwargs)
        return self.exec.update_by_id(record_id, data)

    def cancel(self, record_id: int, reason: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'cancel_reason': reason,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_by_buyer(self, buyer_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["buyer_id = ?"]
        params = [buyer_id]

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
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_by_seller(self, seller_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["seller_id = ?"]
        params = [seller_id]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT o.*, u.nickname as buyer_name
            FROM {self.TABLE_NAME} o
            LEFT JOIN tb_jiaoyi_model_users u ON o.buyer_id = u.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY o.id DESC 
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

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None, keyword: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if keyword:
            where_clauses.append("(order_no LIKE ? OR book_title LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT o.*, b.nickname as buyer_name, s.nickname as seller_name
            FROM {self.TABLE_NAME} o
            LEFT JOIN tb_jiaoyi_model_users b ON o.buyer_id = b.id
            LEFT JOIN tb_jiaoyi_model_users s ON o.seller_id = s.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY o.id DESC 
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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待付款',
            self.STATUS_PAID: '已付款',
            self.STATUS_SHIPPED: '已发货',
            self.STATUS_RECEIVED: '已收货',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_REFUNDING: '退款中',
            self.STATUS_REFUNDED: '已退款'
        }
        return status_map.get(status, '未知')


class AnnouncementModel:
    TABLE_NAME = 'tb_jiaoyi_model_announcements'

    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_ARCHIVED = 2

    TYPE_SYSTEM = 'system'
    TYPE_ACTIVITY = 'activity'
    TYPE_NOTICE = 'notice'

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
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                type TEXT DEFAULT 'notice',
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_announcements(cls):
        model = cls()
        default_announcements = [
            {
                'title': '欢迎使用校园二手教材交易平台',
                'content': '欢迎同学们使用校园二手教材交易平台，在这里您可以方便地买卖二手教材，实现资源循环利用！',
                'type': cls.TYPE_SYSTEM,
                'status': cls.STATUS_PUBLISHED,
                'sort_order': 1
            },
            {
                'title': '新学期教材交易活动开始啦',
                'content': '新学期来临，平台推出教材交易优惠活动，发布教材即可获得积分奖励！',
                'type': cls.TYPE_ACTIVITY,
                'status': cls.STATUS_PUBLISHED,
                'sort_order': 2
            }
        ]
        
        for ann in default_announcements:
            existing = model.query.find_one({'title': ann['title']})
            if not existing:
                model.create(**ann)

    def create(self, title: str, content: str = '', type: str = TYPE_NOTICE,
               status: int = STATUS_DRAFT, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'content': content,
            'type': type,
            'status': status,
            'sort_order': sort_order,
            'view_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['title', 'content', 'type', 'status', 'sort_order']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update_view_count(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (record_id,))
        return cursor.rowcount

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                type: str = None, keyword: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if type:
            where_clauses.append("type = ?")
            params.append(type)

        if keyword:
            where_clauses.append("(title LIKE ? OR content LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY sort_order ASC, id DESC 
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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_PUBLISHED: '已发布',
            self.STATUS_ARCHIVED: '已归档'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统公告',
            self.TYPE_ACTIVITY: '活动公告',
            self.TYPE_NOTICE: '普通通知'
        }
        return type_map.get(type, '未知')


class ChatModel:
    TABLE_NAME = 'tb_jiaoyi_model_chats'

    STATUS_UNREAD = 0
    STATUS_READ = 1

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
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                book_id INTEGER DEFAULT 0,
                content TEXT DEFAULT '',
                type TEXT DEFAULT 'text',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sender_id ON {cls.TABLE_NAME}(sender_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_receiver_id ON {cls.TABLE_NAME}(receiver_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_book_id ON {cls.TABLE_NAME}(book_id)"
        db.execute(index_sql)

    def create(self, sender_id: int, receiver_id: int, book_id: int = 0,
               content: str = '', type: str = 'text') -> int:
        now = datetime.now().isoformat()
        data = {
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'book_id': book_id,
            'content': content,
            'type': type,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def mark_as_read(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_READ})

    def mark_conversation_as_read(self, user_id: int, other_id: int) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET status = ? 
            WHERE receiver_id = ? AND sender_id = ? AND status = ?
        """
        cursor = self.db.execute(sql, (self.STATUS_READ, user_id, other_id, self.STATUS_UNREAD))
        return cursor.rowcount

    def get_conversation(self, user_id: int, other_id: int, book_id: int = 0,
                         page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))"]
        params = [user_id, other_id, other_id, user_id]

        if book_id > 0:
            where_clauses.append("book_id = ?")
            params.append(book_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT c.*, s.nickname as sender_name, s.avatar as sender_avatar
            FROM {self.TABLE_NAME} c
            LEFT JOIN tb_jiaoyi_model_users s ON c.sender_id = s.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY c.id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))
        items.reverse()

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_conversation_list(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
                MAX(id) as last_msg_id
            FROM {self.TABLE_NAME}
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_id
            ORDER BY last_msg_id DESC
        """
        conversations = self.db.fetch_all(sql, (user_id, user_id, user_id))
        
        result = []
        for conv in conversations:
            msg = self.get_by_id(conv['last_msg_id'])
            if msg:
                other_id = conv['other_id']
                other_user_sql = "SELECT id, nickname, avatar FROM tb_jiaoyi_model_users WHERE id = ?"
                other_user = self.db.fetch_one(other_user_sql, (other_id,))
                
                unread_sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE sender_id = ? AND receiver_id = ? AND status = ?"
                unread_result = self.db.fetch_one(unread_sql, (other_id, user_id, self.STATUS_UNREAD))
                
                result.append({
                    'other_id': other_id,
                    'other_user': other_user,
                    'last_message': msg,
                    'unread_count': unread_result.get('count', 0) if unread_result else 0
                })
        
        return result


class RefundModel:
    TABLE_NAME = 'tb_jiaoyi_model_refunds'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    STATUS_COMPLETED = 3

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
                order_id INTEGER NOT NULL,
                order_no TEXT DEFAULT '',
                buyer_id INTEGER NOT NULL,
                seller_id INTEGER NOT NULL,
                reason TEXT DEFAULT '',
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                amount REAL DEFAULT 0,
                status INTEGER DEFAULT 0,
                reject_reason TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_buyer_id ON {cls.TABLE_NAME}(buyer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, order_id: int, order_no: str = '', buyer_id: int = 0, seller_id: int = 0,
               reason: str = '', description: str = '', images: str = '', amount: float = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'order_no': order_no,
            'buyer_id': buyer_id,
            'seller_id': seller_id,
            'reason': reason,
            'description': description,
            'images': images,
            'amount': amount,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_id': order_id})

    def update_status(self, record_id: int, status: int, reject_reason: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if reject_reason:
            data['reject_reason'] = reject_reason
        return self.exec.update_by_id(record_id, data)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                buyer_id: int = None, seller_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if buyer_id is not None:
            where_clauses.append("buyer_id = ?")
            params.append(buyer_id)

        if seller_id is not None:
            where_clauses.append("seller_id = ?")
            params.append(seller_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT r.*, b.nickname as buyer_name, s.nickname as seller_name
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_jiaoyi_model_users b ON r.buyer_id = b.id
            LEFT JOIN tb_jiaoyi_model_users s ON r.seller_id = s.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY r.id DESC 
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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_APPROVED: '已同意',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')


class ReportModel:
    TABLE_NAME = 'tb_jiaoyi_model_reports'

    STATUS_PENDING = 0
    STATUS_PROCESSING = 1
    STATUS_RESOLVED = 2
    STATUS_REJECTED = 3

    TYPE_SCAM = 'scam'
    TYPE_FAKE = 'fake'
    TYPE_INAPPROPRIATE = 'inappropriate'
    TYPE_OTHER = 'other'

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
                reporter_id INTEGER NOT NULL,
                target_type TEXT DEFAULT '',
                target_id INTEGER DEFAULT 0,
                type TEXT DEFAULT '',
                reason TEXT DEFAULT '',
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                admin_id INTEGER DEFAULT 0,
                admin_note TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reporter_id ON {cls.TABLE_NAME}(reporter_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_type, target_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, reporter_id: int, target_type: str, target_id: int,
               type: str, reason: str = '', description: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'reporter_id': reporter_id,
            'target_type': target_type,
            'target_id': target_id,
            'type': type,
            'reason': reason,
            'description': description,
            'images': images,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, record_id: int, status: int, admin_id: int = 0, admin_note: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'admin_id': admin_id,
            'admin_note': admin_note,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                target_type: str = None, reporter_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if target_type:
            where_clauses.append("target_type = ?")
            params.append(target_type)

        if reporter_id is not None:
            where_clauses.append("reporter_id = ?")
            params.append(reporter_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT r.*, u.nickname as reporter_name
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_jiaoyi_model_users u ON r.reporter_id = u.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY r.id DESC 
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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待处理',
            self.STATUS_PROCESSING: '处理中',
            self.STATUS_RESOLVED: '已解决',
            self.STATUS_REJECTED: '已驳回'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_SCAM: '诈骗',
            self.TYPE_FAKE: '虚假信息',
            self.TYPE_INAPPROPRIATE: '不当内容',
            self.TYPE_OTHER: '其他'
        }
        return type_map.get(type, '未知')

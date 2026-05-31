from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MessageModel:
    TABLE_NAME = 'tb_jiudian_077_model_message'

    TYPE_BOOKING_CONFIRM = 'booking_confirm'
    TYPE_BOOKING_CANCEL = 'booking_cancel'
    TYPE_CHECK_IN_REMIND = 'check_in_remind'
    TYPE_CHECK_OUT_REMIND = 'check_out_remind'
    TYPE_SYSTEM = 'system'

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
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                booking_id INTEGER,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_booking_id ON {cls.TABLE_NAME}(booking_id)"
        db.execute(index_sql)

    def create(self, user_id: int, type: str, title: str, content: str,
               booking_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': type,
            'title': title,
            'content': content,
            'booking_id': booking_id,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None, type: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if type:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                status: int = None, type: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if status is not None:
            conditions['status'] = status
        if type:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def mark_as_read(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ,
            'read_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def mark_all_as_read(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ,
            'read_at': now
        }
        return self.exec.update(data, {'user_id': user_id, 'status': self.STATUS_UNREAD})

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_UNREAD})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def send_booking_confirm(self, user_id: int, booking_id: int, booking_no: str) -> int:
        title = '预订确认通知'
        content = f'您的预订（订单号：{booking_no}）已确认，请按时入住。'
        return self.create(user_id, self.TYPE_BOOKING_CONFIRM, title, content, booking_id)

    def send_booking_cancel(self, user_id: int, booking_id: int, booking_no: str) -> int:
        title = '预订取消通知'
        content = f'您的预订（订单号：{booking_no}）已取消。'
        return self.create(user_id, self.TYPE_BOOKING_CANCEL, title, content, booking_id)

    def send_check_in_remind(self, user_id: int, booking_id: int, booking_no: str, check_in_date: str) -> int:
        title = '入住提醒'
        content = f'您的预订（订单号：{booking_no}）将于 {check_in_date} 入住，请提前做好准备。'
        return self.create(user_id, self.TYPE_CHECK_IN_REMIND, title, content, booking_id)

    def send_check_out_remind(self, user_id: int, booking_id: int, booking_no: str, check_out_date: str) -> int:
        title = '退房提醒'
        content = f'您的预订（订单号：{booking_no}）将于 {check_out_date} 退房，请按时办理。'
        return self.create(user_id, self.TYPE_CHECK_OUT_REMIND, title, content, booking_id)

    def send_system_message(self, user_id: int, title: str, content: str) -> int:
        return self.create(user_id, self.TYPE_SYSTEM, title, content)

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_BOOKING_CONFIRM: '预订确认',
            self.TYPE_BOOKING_CANCEL: '预订取消',
            self.TYPE_CHECK_IN_REMIND: '入住提醒',
            self.TYPE_CHECK_OUT_REMIND: '退房提醒',
            self.TYPE_SYSTEM: '系统消息'
        }
        return type_map.get(type, '其他')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, message: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': message.get('id'),
            'user_id': message.get('user_id'),
            'type': message.get('type'),
            'type_text': self.get_type_text(message.get('type')),
            'title': message.get('title'),
            'content': message.get('content'),
            'booking_id': message.get('booking_id'),
            'status': message.get('status'),
            'status_text': self.get_status_text(message.get('status')),
            'created_at': message.get('created_at'),
            'read_at': message.get('read_at')
        }

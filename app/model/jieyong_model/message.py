from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MessageModel:
    TABLE_NAME = 'tb_jieyong_model_message'

    TYPE_SYSTEM = 'system'
    TYPE_OVERDUE = 'overdue'
    TYPE_BORROW = 'borrow'
    TYPE_RETURN = 'return'
    TYPE_REMIND = 'remind'

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
                type TEXT DEFAULT 'system',
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                borrow_id INTEGER,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql3)

    def create(self, user_id: int, message_type: str, title: str, content: str = '',
               borrow_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': message_type,
            'title': title,
            'content': content,
            'borrow_id': borrow_id,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None, message_type: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if message_type:
            conditions['type'] = message_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                status: int = None, message_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if status is not None:
            conditions['status'] = status
        if message_type:
            conditions['type'] = message_type
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
        sql = f"UPDATE {self.TABLE_NAME} SET status = ?, read_at = ? WHERE user_id = ? AND status = ?"
        return self.exec.execute_raw(sql, (self.STATUS_READ, now, user_id, self.STATUS_UNREAD))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_UNREAD})

    def get_type_text(self, message_type: str) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统消息',
            self.TYPE_OVERDUE: '逾期提醒',
            self.TYPE_BORROW: '借用通知',
            self.TYPE_RETURN: '归还通知',
            self.TYPE_REMIND: '温馨提醒'
        }
        return type_map.get(message_type, '其他')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读'
        }
        return status_map.get(status, '未知')

    def to_dict(self, message: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': message.get('id'),
            'user_id': message.get('user_id'),
            'type': message.get('type'),
            'type_text': self.get_type_text(message.get('type')),
            'title': message.get('title'),
            'content': message.get('content'),
            'borrow_id': message.get('borrow_id'),
            'status': message.get('status'),
            'status_text': self.get_status_text(message.get('status')),
            'created_at': message.get('created_at'),
            'read_at': message.get('read_at')
        }

    def send_overdue_reminder(self, user_id: int, borrow_id: int, item_name: str,
                              expected_return_date: str) -> int:
        title = '物品逾期提醒'
        content = f'您借用的【{item_name}】已超过预计归还时间 {expected_return_date}，请尽快归还。'
        return self.create(user_id, self.TYPE_OVERDUE, title, content, borrow_id)

    def send_borrow_success(self, user_id: int, borrow_id: int, item_name: str, quantity: int) -> int:
        title = '借用成功通知'
        content = f'您已成功借用【{item_name}】，数量：{quantity}。请按时归还。'
        return self.create(user_id, self.TYPE_BORROW, title, content, borrow_id)

    def send_return_success(self, user_id: int, borrow_id: int, item_name: str) -> int:
        title = '归还成功通知'
        content = f'您已成功归还【{item_name}】，感谢您的配合。'
        return self.create(user_id, self.TYPE_RETURN, title, content, borrow_id)

    def send_return_reminder(self, user_id: int, borrow_id: int, item_name: str,
                             expected_return_date: str) -> int:
        title = '归还提醒'
        content = f'您借用的【{item_name}】将于 {expected_return_date} 到期，请记得及时归还。'
        return self.create(user_id, self.TYPE_REMIND, title, content, borrow_id)

    def send_system_message(self, user_id: int, title: str, content: str) -> int:
        return self.create(user_id, self.TYPE_SYSTEM, title, content)

    def check_and_send_overdue_reminders(self) -> List[int]:
        from app.model.jieyong_model.borrow import BorrowModel
        borrow_model = BorrowModel()
        
        overdue_ids = borrow_model.check_and_mark_overdue()
        message_ids = []
        
        for borrow_id in overdue_ids:
            borrow = borrow_model.get_by_id(borrow_id)
            if borrow:
                item_id = borrow.get('item_id')
                from app.model.jieyong_model.item import ItemModel
                item_model = ItemModel()
                item = item_model.get_by_id(item_id)
                if item:
                    msg_id = self.send_overdue_reminder(
                        user_id=borrow.get('user_id'),
                        borrow_id=borrow_id,
                        item_name=item.get('name'),
                        expected_return_date=borrow.get('expected_return_date')
                    )
                    message_ids.append(msg_id)
        
        return message_ids

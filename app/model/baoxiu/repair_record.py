from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RepairRecordModel:
    TABLE_NAME = 'tb_baoxiu_repair_record'

    ACTION_ASSIGN = 'assign'
    ACTION_START = 'start'
    ACTION_COMPLETE = 'complete'
    ACTION_CANCEL = 'cancel'
    ACTION_COMMENT = 'comment'

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
                repairman_id INTEGER DEFAULT 0,
                action TEXT NOT NULL,
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_repairman_id ON {cls.TABLE_NAME}(repairman_id)"
        db.execute(index_sql2)

    def create(self, order_id: int, action: str, repairman_id: int = 0,
               description: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'repairman_id': repairman_id,
            'action': action,
            'description': description,
            'images': images,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('order_id', order_id, order_by='id ASC')

    def get_by_repairman_id(self, repairman_id: int, page: int = 1,
                            page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page=page,
            page_size=page_size,
            conditions={'repairman_id': repairman_id},
            order_by='id DESC'
        )

    def get_all(self, page: int = 1, page_size: int = 10,
                order_id: int = None, repairman_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if order_id:
            conditions['order_id'] = order_id
        if repairman_id:
            conditions['repairman_id'] = repairman_id

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_action_text(self, action: str) -> str:
        action_map = {
            self.ACTION_ASSIGN: '分配工单',
            self.ACTION_START: '开始维修',
            self.ACTION_COMPLETE: '完成维修',
            self.ACTION_CANCEL: '取消工单',
            self.ACTION_COMMENT: '添加备注'
        }
        return action_map.get(action, action)

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskClaimModel:
    TABLE_NAME = 'tb_dd_task_claims'
    
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
                task_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                claim_time TIMESTAMP NOT NULL,
                is_cancelled INTEGER DEFAULT 0,
                cancel_time TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_receiver_id ON {cls.TABLE_NAME}(receiver_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_receiver ON {cls.TABLE_NAME}(task_id, receiver_id)"
        db.execute(index_sql)

    def create(self, task_id: int, receiver_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'receiver_id': receiver_id,
            'claim_time': now,
            'is_cancelled': 0
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_task_and_receiver(self, task_id: int, receiver_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'task_id': task_id, 'receiver_id': receiver_id})

    def get_by_task(self, task_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'task_id': task_id}, order_by='claim_time DESC')

    def get_by_receiver(self, receiver_id: int, page: int = 1, page_size: int = 10,
                        is_cancelled: int = None) -> Dict[str, Any]:
        conditions = {'receiver_id': receiver_id}
        if is_cancelled is not None:
            conditions['is_cancelled'] = is_cancelled
        return self.query.paginate(page, page_size, conditions, order_by='claim_time DESC')

    def has_claimed(self, task_id: int, receiver_id: int) -> bool:
        claim = self.get_by_task_and_receiver(task_id, receiver_id)
        return claim is not None and claim.get('is_cancelled') == 0

    def cancel_claim(self, claim_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_cancelled': 1,
            'cancel_time': now
        }
        return self.exec.update_by_id(claim_id, data)

    def cancel_by_task_and_receiver(self, task_id: int, receiver_id: int) -> int:
        claim = self.get_by_task_and_receiver(task_id, receiver_id)
        if claim and claim.get('is_cancelled') == 0:
            return self.cancel_claim(claim.get('id'))
        return 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

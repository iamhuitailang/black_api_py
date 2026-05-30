from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ClaimModel:
    TABLE_NAME = 'tb_shiwu_model_claims'

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
                post_id INTEGER NOT NULL,
                claimant_id INTEGER NOT NULL,
                post_owner_id INTEGER NOT NULL,
                description TEXT DEFAULT '',
                item_features TEXT DEFAULT '',
                contact TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                reject_reason TEXT DEFAULT '',
                reviewed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_claimant ON {cls.TABLE_NAME}(claimant_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_owner ON {cls.TABLE_NAME}(post_owner_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, post_id: int, claimant_id: int, post_owner_id: int,
               description: str = '', item_features: str = '', contact: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'claimant_id': claimant_id,
            'post_owner_id': post_owner_id,
            'description': description,
            'item_features': item_features,
            'contact': contact,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post_and_claimant(self, post_id: int, claimant_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'post_id': post_id, 'claimant_id': claimant_id})

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10, 
                    status: int = None) -> Dict[str, Any]:
        conditions = {'post_id': post_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_claimant(self, claimant_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        conditions = {'claimant_id': claimant_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_owner(self, owner_id: int, page: int = 1, page_size: int = 10,
                     status: int = None) -> Dict[str, Any]:
        conditions = {'post_owner_id': owner_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def approve(self, claim_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_APPROVED,
            'reviewed_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(claim_id, data)

    def reject(self, claim_id: int, reject_reason: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_REJECTED,
            'reject_reason': reject_reason,
            'reviewed_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(claim_id, data)

    def complete(self, claim_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COMPLETED,
            'updated_at': now
        }
        return self.exec.update_by_id(claim_id, data)

    def update(self, claim_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'description', 'item_features', 'contact'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(claim_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_dict(self, claim: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.shiwu_model.user import UserModel
        user_model = UserModel()
        
        claimant = user_model.get_by_id(claim.get('claimant_id', 0))
        owner = user_model.get_by_id(claim.get('post_owner_id', 0))
        
        return {
            'id': claim.get('id'),
            'post_id': claim.get('post_id'),
            'claimant_id': claim.get('claimant_id'),
            'claimant': user_model.to_simple_dict(claimant) if claimant else None,
            'post_owner_id': claim.get('post_owner_id'),
            'post_owner': user_model.to_simple_dict(owner) if owner else None,
            'description': claim.get('description'),
            'item_features': claim.get('item_features'),
            'contact': claim.get('contact'),
            'status': claim.get('status'),
            'status_text': self.get_status_text(claim.get('status')),
            'reject_reason': claim.get('reject_reason'),
            'reviewed_at': claim.get('reviewed_at'),
            'created_at': claim.get('created_at'),
            'updated_at': claim.get('updated_at')
        }

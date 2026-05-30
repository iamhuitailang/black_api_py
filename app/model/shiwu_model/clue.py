from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ClueModel:
    TABLE_NAME = 'tb_shiwu_model_clues'

    STATUS_UNREAD = 0
    STATUS_READ = 1
    STATUS_CONTACTED = 2

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
                provider_id INTEGER NOT NULL,
                post_owner_id INTEGER NOT NULL,
                description TEXT DEFAULT '',
                location TEXT DEFAULT '',
                location_latitude REAL,
                location_longitude REAL,
                contact TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_provider ON {cls.TABLE_NAME}(provider_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_owner ON {cls.TABLE_NAME}(post_owner_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, post_id: int, provider_id: int, post_owner_id: int,
               description: str = '', location: str = '', 
               location_latitude: float = None, location_longitude: float = None,
               contact: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'provider_id': provider_id,
            'post_owner_id': post_owner_id,
            'description': description,
            'location': location,
            'location_latitude': location_latitude,
            'location_longitude': location_longitude,
            'contact': contact,
            'images': images,
            'status': self.STATUS_UNREAD,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'post_id': post_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_provider(self, provider_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        conditions = {'provider_id': provider_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_owner(self, owner_id: int, page: int = 1, page_size: int = 10,
                     status: int = None) -> Dict[str, Any]:
        conditions = {'post_owner_id': owner_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def update_status(self, clue_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(clue_id, data)

    def mark_as_read(self, clue_id: int) -> int:
        return self.update_status(clue_id, self.STATUS_READ)

    def mark_as_contacted(self, clue_id: int) -> int:
        return self.update_status(clue_id, self.STATUS_CONTACTED)

    def update(self, clue_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'description', 'location', 'location_latitude', 'location_longitude', 
            'contact', 'images'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(clue_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读',
            self.STATUS_CONTACTED: '已联系'
        }
        return status_map.get(status, '未知')

    def to_dict(self, clue: Dict[str, Any], current_user_id: int = None) -> Dict[str, Any]:
        from app.model.shiwu_model.user import UserModel
        user_model = UserModel()
        
        provider = user_model.get_by_id(clue.get('provider_id', 0))
        
        images_str = clue.get('images', '')
        images = images_str.split(',') if images_str else []
        
        can_see_contact = (current_user_id and 
                          (current_user_id == clue.get('post_owner_id') or 
                           current_user_id == clue.get('provider_id')))
        
        return {
            'id': clue.get('id'),
            'post_id': clue.get('post_id'),
            'provider_id': clue.get('provider_id'),
            'provider': user_model.to_simple_dict(provider) if provider else None,
            'post_owner_id': clue.get('post_owner_id'),
            'description': clue.get('description'),
            'location': clue.get('location'),
            'location_latitude': clue.get('location_latitude'),
            'location_longitude': clue.get('location_longitude'),
            'contact': clue.get('contact') if can_see_contact else '',
            'images': images if can_see_contact else [],
            'status': clue.get('status'),
            'status_text': self.get_status_text(clue.get('status')),
            'created_at': clue.get('created_at'),
            'updated_at': clue.get('updated_at')
        }

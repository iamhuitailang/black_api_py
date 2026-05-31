from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CollaborationModel:
    TABLE_NAME = 'tb_siwei_077_model_collaboration'

    ROLE_OWNER = 'owner'
    ROLE_EDITOR = 'editor'
    ROLE_VIEWER = 'viewer'

    ROLES = [
        {'code': ROLE_OWNER, 'name': '所有者'},
        {'code': ROLE_EDITOR, 'name': '编辑者'},
        {'code': ROLE_VIEWER, 'name': '查看者'},
    ]

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
                map_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'viewer',
                invited_by INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_map_id ON {cls.TABLE_NAME}(map_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_map_id_user_id ON {cls.TABLE_NAME}(map_id, user_id)"
        db.execute(index_sql)

    def create(self, map_id: int, user_id: int, role: str = 'viewer', invited_by: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'map_id': map_id,
            'user_id': user_id,
            'role': role,
            'invited_by': invited_by,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_map_and_user(self, map_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'map_id': map_id, 'user_id': user_id})

    def get_collaborators(self, map_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'map_id': map_id, 'status': 1}, order_by='role ASC, id ASC')

    def get_user_maps(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'status': 1}
        return self.query.paginate(page, page_size, conditions, order_by='updated_at DESC')

    def update_role(self, collaboration_id: int, role: str) -> int:
        now = datetime.now().isoformat()
        data = {'role': role, 'updated_at': now}
        return self.exec.update_by_id(collaboration_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def remove_collaborator(self, map_id: int, user_id: int) -> int:
        return self.exec.delete({'map_id': map_id, 'user_id': user_id})

    def delete_by_map(self, map_id: int) -> int:
        return self.exec.delete({'map_id': map_id})

    def to_dict(self, collab: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': collab.get('id'),
            'map_id': collab.get('map_id'),
            'user_id': collab.get('user_id'),
            'role': collab.get('role'),
            'invited_by': collab.get('invited_by'),
            'status': collab.get('status'),
            'created_at': collab.get('created_at'),
            'updated_at': collab.get('updated_at')
        }

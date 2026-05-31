from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MatchModel:
    TABLE_NAME = 'tb_jaoyou_077_model_matches'

    STATUS_ACTIVE = 1
    STATUS_CANCELLED = 2

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
                user1_id INTEGER NOT NULL,
                user2_id INTEGER NOT NULL,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user1_id ON {cls.TABLE_NAME}(user1_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user2_id ON {cls.TABLE_NAME}(user2_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user1_id: int, user2_id: int) -> int:
        existing = self.get_by_users(user1_id, user2_id)
        if existing:
            return existing.get('id')

        now = datetime.now().isoformat()
        data = {
            'user1_id': min(user1_id, user2_id),
            'user2_id': max(user1_id, user2_id),
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_users(self, user1_id: int, user2_id: int) -> Optional[Dict[str, Any]]:
        u1 = min(user1_id, user2_id)
        u2 = max(user1_id, user2_id)
        return self.query.find_one({
            'user1_id': u1,
            'user2_id': u2
        })

    def get_user_matches(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        from app.model.jaoyou_077.user import UserModel
        user_model = UserModel()

        where_clause = "(user1_id = ? OR user2_id = ?) AND status = ?"
        params = [user_id, user_id, self.STATUS_ACTIVE]

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {where_clause} 
            ORDER BY id DESC 
        """
        all_items = self.db.fetch_all(select_sql, tuple(params))

        result_items = []
        for item in all_items:
            matched_user_id = item.get('user2_id') if item.get('user1_id') == user_id else item.get('user1_id')
            matched_user = user_model.get_by_id(matched_user_id)
            if matched_user:
                item['matched_user'] = user_model.to_public_dict(matched_user)
                result_items.append(item)

        total = len(result_items)
        offset = (page - 1) * page_size
        paginated_items = result_items[offset:offset + page_size]

        return {
            'items': paginated_items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')

        from app.model.jaoyou_077.user import UserModel
        user_model = UserModel()
        items = []
        for item in result.get('items', []):
            user1 = user_model.get_by_id(item.get('user1_id'))
            user2 = user_model.get_by_id(item.get('user2_id'))
            item['user_a_nickname'] = user1.get('nickname', '') if user1 else ''
            item['user_b_nickname'] = user2.get('nickname', '') if user2 else ''
            items.append(item)
        result['items'] = items
        return result

    def cancel_match(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '已匹配',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, match: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': match.get('id'),
            'user1_id': match.get('user1_id'),
            'user2_id': match.get('user2_id'),
            'user_a_nickname': match.get('user_a_nickname', ''),
            'user_b_nickname': match.get('user_b_nickname', ''),
            'matched_user': match.get('matched_user'),
            'status': match.get('status'),
            'status_text': self.get_status_text(match.get('status')),
            'created_at': match.get('created_at'),
            'updated_at': match.get('updated_at')
        }

    def count_matches(self, status: int = None) -> int:
        where_clause = "1=1"
        params = []
        if status is not None:
            where_clause = "status = ?"
            params.append(status)

        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"
        result = self.db.fetch_one(sql, tuple(params))
        return result.get('total', 0) if result else 0

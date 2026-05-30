from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PostModel:
    TABLE_NAME = 'tb_shiwu_model_posts'

    TYPE_LOST = 'lost'
    TYPE_FOUND = 'found'

    STATUS_ACTIVE = 0
    STATUS_CLAIMED = 1
    STATUS_EXPIRED = 2
    STATUS_CLOSED = 3

    VERIFY_PENDING = 0
    VERIFY_PASS = 1
    VERIFY_REJECT = 2

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
                post_type TEXT NOT NULL,
                category_code TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                item_name TEXT DEFAULT '',
                item_color TEXT DEFAULT '',
                item_brand TEXT DEFAULT '',
                item_features TEXT DEFAULT '',
                lost_time TIMESTAMP,
                lost_location TEXT DEFAULT '',
                lost_latitude REAL,
                lost_longitude REAL,
                contact TEXT DEFAULT '',
                reward TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                verify_status INTEGER DEFAULT 0,
                is_top INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                expire_days INTEGER DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(post_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_verify ON {cls.TABLE_NAME}(verify_status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_top ON {cls.TABLE_NAME}(is_top)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_location ON {cls.TABLE_NAME}(lost_location)"
        db.execute(index_sql)

    def create(self, user_id: int, post_type: str, category_code: str, title: str,
               description: str, item_name: str = '', item_color: str = '', 
               item_brand: str = '', item_features: str = '', lost_time: str = None,
               lost_location: str = '', lost_latitude: float = None, lost_longitude: float = None,
               contact: str = '', reward: str = '', images: str = '', 
               expire_days: int = 30) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'post_type': post_type,
            'category_code': category_code,
            'title': title,
            'description': description,
            'item_name': item_name,
            'item_color': item_color,
            'item_brand': item_brand,
            'item_features': item_features,
            'lost_time': lost_time,
            'lost_location': lost_location,
            'lost_latitude': lost_latitude,
            'lost_longitude': lost_longitude,
            'contact': contact,
            'reward': reward,
            'images': images,
            'status': self.STATUS_ACTIVE,
            'verify_status': self.VERIFY_PENDING,
            'is_top': 0,
            'view_count': 0,
            'like_count': 0,
            'comment_count': 0,
            'expire_days': expire_days,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def increment_view_count(self, post_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (post_id,))
        return cursor.rowcount

    def increment_like_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def increment_comment_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET comment_count = comment_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def update_status(self, post_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update_verify_status(self, post_id: int, verify_status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'verify_status': verify_status,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update_is_top(self, post_id: int, is_top: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_top': is_top,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update(self, post_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category_code', 'title', 'description', 'item_name', 'item_color',
            'item_brand', 'item_features', 'lost_time', 'lost_location',
            'lost_latitude', 'lost_longitude', 'contact', 'reward', 'images', 'expire_days'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(post_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    post_type: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if post_type:
            conditions['post_type'] = post_type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='is_top DESC, created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 post_type: str = None, category_code: str = None, status: int = None,
                 verify_status: int = None, keyword: str = None, location: str = None,
                 order_by: str = 'is_top DESC, created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if post_type:
            conditions['post_type'] = post_type
        if category_code:
            conditions['category_code'] = category_code
        if status is not None:
            conditions['status'] = status
        if verify_status is not None:
            conditions['verify_status'] = verify_status

        if keyword or location:
            return self.search(keyword or '', page, page_size, post_type, category_code, 
                             status, verify_status, location, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               post_type: str = None, category_code: str = None, status: int = None,
               verify_status: int = None, location: str = None,
               order_by: str = 'is_top DESC, created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if post_type:
            where_clauses.append("post_type = ?")
            params.append(post_type)

        if category_code:
            where_clauses.append("category_code = ?")
            params.append(category_code)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if verify_status is not None:
            where_clauses.append("verify_status = ?")
            params.append(verify_status)

        if keyword:
            where_clauses.append("(title LIKE ? OR description LIKE ? OR item_name LIKE ? OR item_features LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        if location:
            where_clauses.append("lost_location LIKE ?")
            params.append(f"%{location}%")

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY {order_by}
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

    def get_type_text(self, post_type: str) -> str:
        type_map = {
            self.TYPE_LOST: '寻物启事',
            self.TYPE_FOUND: '招领启事'
        }
        return type_map.get(post_type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '进行中',
            self.STATUS_CLAIMED: '已认领',
            self.STATUS_EXPIRED: '已过期',
            self.STATUS_CLOSED: '已关闭'
        }
        return status_map.get(status, '未知')

    def get_verify_text(self, verify_status: int) -> str:
        verify_map = {
            self.VERIFY_PENDING: '待审核',
            self.VERIFY_PASS: '审核通过',
            self.VERIFY_REJECT: '审核拒绝'
        }
        return verify_map.get(verify_status, '未知')

    def get_type_color(self, post_type: str) -> str:
        color_map = {
            self.TYPE_LOST: '#EF4444',
            self.TYPE_FOUND: '#10B981'
        }
        return color_map.get(post_type, '#6B7280')

    def get_type_icon(self, post_type: str) -> str:
        icon_map = {
            self.TYPE_LOST: '🔍',
            self.TYPE_FOUND: '🫴'
        }
        return icon_map.get(post_type, '📦')

    def to_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.shiwu_model.category import CategoryModel
        category_model = CategoryModel()
        category = category_model.get_by_code(post.get('category_code', ''))
        
        images_str = post.get('images', '')
        images = images_str.split(',') if images_str else []
        
        return {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'post_type': post.get('post_type'),
            'post_type_text': self.get_type_text(post.get('post_type')),
            'post_type_color': self.get_type_color(post.get('post_type')),
            'post_type_icon': self.get_type_icon(post.get('post_type')),
            'category_code': post.get('category_code'),
            'category_name': category.get('name') if category else '其他',
            'category_icon': category.get('icon') if category else '📦',
            'category_color': category.get('color') if category else '#6B7280',
            'title': post.get('title'),
            'description': post.get('description'),
            'item_name': post.get('item_name'),
            'item_color': post.get('item_color'),
            'item_brand': post.get('item_brand'),
            'item_features': post.get('item_features'),
            'lost_time': post.get('lost_time'),
            'lost_location': post.get('lost_location'),
            'lost_latitude': post.get('lost_latitude'),
            'lost_longitude': post.get('lost_longitude'),
            'contact': post.get('contact'),
            'reward': post.get('reward'),
            'images': images,
            'status': post.get('status'),
            'status_text': self.get_status_text(post.get('status')),
            'verify_status': post.get('verify_status'),
            'verify_status_text': self.get_verify_text(post.get('verify_status')),
            'is_top': post.get('is_top'),
            'view_count': post.get('view_count'),
            'like_count': post.get('like_count'),
            'comment_count': post.get('comment_count'),
            'expire_days': post.get('expire_days'),
            'created_at': post.get('created_at'),
            'updated_at': post.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        active_result = self.db.fetch_one(sql, (self.STATUS_ACTIVE,))
        active = active_result['count'] if active_result else 0

        claimed_result = self.db.fetch_one(sql, (self.STATUS_CLAIMED,))
        claimed = claimed_result['count'] if claimed_result else 0

        sql = f"SELECT post_type, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY post_type"
        type_stats = self.db.fetch_all(sql)

        sql = f"SELECT category_code, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY category_code"
        category_stats = self.db.fetch_all(sql)

        claim_rate = (claimed / total * 100) if total > 0 else 0

        return {
            'total': total,
            'active': active,
            'claimed': claimed,
            'claim_rate': round(claim_rate, 2),
            'type_stats': type_stats,
            'category_stats': category_stats
        }

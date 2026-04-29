from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PostModel:
    TABLE_NAME = 'tb_xq_posts'

    TYPE_NEED = 'need'
    TYPE_HELP = 'help'

    STATUS_PENDING = 0
    STATUS_IN_PROGRESS = 1
    STATUS_COMPLETED = 2
    STATUS_CANCELLED = 3

    CATEGORY_TOOLS = 'tools'
    CATEGORY_ERRAND = 'errand'
    CATEGORY_REPAIR = 'repair'
    CATEGORY_CARE = 'care'
    CATEGORY_STUDY = 'study'
    CATEGORY_LIFE = 'life'

    CATEGORIES = [
        {'code': CATEGORY_TOOLS, 'name': '工具借用', 'desc': '维修工具、户外装备'},
        {'code': CATEGORY_ERRAND, 'name': '跑腿帮忙', 'desc': '取快递、遛狗、浇花'},
        {'code': CATEGORY_REPAIR, 'name': '维修', 'desc': '水电、家电、手机'},
        {'code': CATEGORY_CARE, 'name': '照顾', 'desc': '看孩子、陪老人'},
        {'code': CATEGORY_STUDY, 'name': '学习', 'desc': '辅导作业、技能交换'},
        {'code': CATEGORY_LIFE, 'name': '生活', 'desc': '推荐服务、拼单'}
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
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                expect_time TIMESTAMP,
                status INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                is_checked INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_checked ON {cls.TABLE_NAME}(is_checked)"
        db.execute(index_sql)

    def create(self, user_id: int, post_type: str, category: str, title: str,
               content: str, expect_time: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': post_type,
            'category': category,
            'title': title,
            'content': content,
            'expect_time': expect_time,
            'status': self.STATUS_PENDING,
            'view_count': 0,
            'is_checked': 1,
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

    def update_status(self, post_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update_check_status(self, post_id: int, is_checked: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_checked': is_checked,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update(self, post_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category', 'title', 'content', 'expect_time'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(post_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    post_type: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if post_type:
            conditions['type'] = post_type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 post_type: str = None, category: str = None, status: int = None,
                 is_checked: int = None, keyword: str = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if post_type:
            conditions['type'] = post_type
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        if is_checked is not None:
            conditions['is_checked'] = is_checked

        if keyword:
            return self.search(keyword, page, page_size, post_type, category, status, is_checked, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               post_type: str = None, category: str = None, status: int = None,
               is_checked: int = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if post_type:
            where_clauses.append("type = ?")
            params.append(post_type)

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if is_checked is not None:
            where_clauses.append("is_checked = ?")
            params.append(is_checked)

        where_clauses.append("(title LIKE ? OR content LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '进行中',
            self.STATUS_IN_PROGRESS: '已接单',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, post_type: str) -> str:
        type_map = {
            self.TYPE_NEED: '求助',
            self.TYPE_HELP: '提供帮助'
        }
        return type_map.get(post_type, '未知')

    def get_category_name(self, category: str) -> str:
        for cat in self.CATEGORIES:
            if cat['code'] == category:
                return cat['name']
        return '其他'

    def to_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'type': post.get('type'),
            'type_text': self.get_type_text(post.get('type')),
            'category': post.get('category'),
            'category_name': self.get_category_name(post.get('category')),
            'title': post.get('title'),
            'content': post.get('content'),
            'expect_time': post.get('expect_time'),
            'status': post.get('status'),
            'status_text': self.get_status_text(post.get('status')),
            'view_count': post.get('view_count'),
            'is_checked': post.get('is_checked'),
            'created_at': post.get('created_at'),
            'updated_at': post.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        completed_result = self.db.fetch_one(sql, (self.STATUS_COMPLETED,))
        completed = completed_result['count'] if completed_result else 0

        complete_rate = (completed / total * 100) if total > 0 else 0

        sql = f"SELECT type, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY type"
        type_stats = self.db.fetch_all(sql)

        sql = f"SELECT category, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY category"
        category_stats = self.db.fetch_all(sql)

        return {
            'total': total,
            'pending': pending,
            'completed': completed,
            'complete_rate': round(complete_rate, 2),
            'type_stats': type_stats,
            'category_stats': category_stats
        }

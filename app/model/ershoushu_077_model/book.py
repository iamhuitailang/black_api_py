from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ErshoushuBookModel:
    TABLE_NAME = 'tb_ershoushu_077_model_book'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    STATUS_ONSALE = 3
    STATUS_SOLD = 4

    CONDITION_NEW = 'new'
    CONDITION_LIKE_NEW = 'like_new'
    CONDITION_GOOD = 'good'
    CONDITION_FAIR = 'fair'
    CONDITION_POOR = 'poor'

    CONDITIONS = [
        {'code': CONDITION_NEW, 'name': '全新'},
        {'code': CONDITION_LIKE_NEW, 'name': '几乎全新'},
        {'code': CONDITION_GOOD, 'name': '良好'},
        {'code': CONDITION_FAIR, 'name': '一般'},
        {'code': CONDITION_POOR, 'name': '较差'}
    ]

    CATEGORIES = [
        {'code': 'literature', 'name': '文学小说'},
        {'code': 'textbook', 'name': '教材教辅'},
        {'code': 'technology', 'name': '科技计算机'},
        {'code': 'history', 'name': '历史哲学'},
        {'code': 'art', 'name': '艺术摄影'},
        {'code': 'children', 'name': '少儿读物'},
        {'code': 'life', 'name': '生活休闲'},
        {'code': 'economy', 'name': '经济管理'},
        {'code': 'other', 'name': '其他'}
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
                title TEXT NOT NULL,
                author TEXT DEFAULT '',
                isbn TEXT DEFAULT '',
                publisher TEXT DEFAULT '',
                category TEXT DEFAULT 'other',
                original_price REAL DEFAULT 0,
                price REAL NOT NULL,
                condition_level TEXT DEFAULT 'good',
                description TEXT DEFAULT '',
                cover_image TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                is_checked INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_checked ON {cls.TABLE_NAME}(is_checked)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, author: str, isbn: str,
               publisher: str, category: str, original_price: float, price: float,
               condition_level: str, description: str, cover_image: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'author': author,
            'isbn': isbn,
            'publisher': publisher,
            'category': category,
            'original_price': original_price,
            'price': price,
            'condition_level': condition_level,
            'description': description,
            'cover_image': cover_image,
            'status': self.STATUS_APPROVED,
            'is_checked': 1,
            'view_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def increment_view_count(self, book_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (book_id,))
        return cursor.rowcount

    def update_status(self, book_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(book_id, data)

    def update_check_status(self, book_id: int, is_checked: int) -> int:
        now = datetime.now().isoformat()
        status = self.STATUS_APPROVED if is_checked == 1 else self.STATUS_REJECTED
        data = {
            'is_checked': is_checked,
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(book_id, data)

    def update(self, book_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'author', 'isbn', 'publisher', 'category',
            'original_price', 'price', 'condition_level', 'description', 'cover_image'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(book_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 category: str = None, status: int = None,
                 is_checked: int = None, keyword: str = None,
                 condition_level: str = None, min_price: float = None,
                 max_price: float = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        if is_checked is not None:
            conditions['is_checked'] = is_checked
        if condition_level:
            conditions['condition_level'] = condition_level

        if keyword or min_price is not None or max_price is not None:
            return self.search(keyword, page, page_size, category, status,
                               is_checked, condition_level, min_price, max_price, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str = None, page: int = 1, page_size: int = 10,
               category: str = None, status: int = None, is_checked: int = None,
               condition_level: str = None, min_price: float = None,
               max_price: float = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if is_checked is not None:
            where_clauses.append("is_checked = ?")
            params.append(is_checked)

        if condition_level:
            where_clauses.append("condition_level = ?")
            params.append(condition_level)

        if min_price is not None:
            where_clauses.append("price >= ?")
            params.append(min_price)

        if max_price is not None:
            where_clauses.append("price <= ?")
            params.append(max_price)

        if keyword:
            where_clauses.append("(title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

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
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_ONSALE: '在售',
            self.STATUS_SOLD: '已售出'
        }
        return status_map.get(status, '未知')

    def get_condition_name(self, condition_level: str) -> str:
        for cond in self.CONDITIONS:
            if cond['code'] == condition_level:
                return cond['name']
        return '其他'

    def get_category_name(self, category: str) -> str:
        for cat in self.CATEGORIES:
            if cat['code'] == category:
                return cat['name']
        return '其他'

    def to_dict(self, book: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': book.get('id'),
            'user_id': book.get('user_id'),
            'title': book.get('title'),
            'author': book.get('author'),
            'isbn': book.get('isbn'),
            'publisher': book.get('publisher'),
            'category': book.get('category'),
            'category_name': self.get_category_name(book.get('category')),
            'original_price': book.get('original_price'),
            'price': book.get('price'),
            'condition_level': book.get('condition_level'),
            'condition_name': self.get_condition_name(book.get('condition_level')),
            'description': book.get('description'),
            'cover_image': book.get('cover_image'),
            'status': book.get('status'),
            'status_text': self.get_status_text(book.get('status')),
            'is_checked': book.get('is_checked'),
            'view_count': book.get('view_count'),
            'created_at': book.get('created_at'),
            'updated_at': book.get('updated_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        onsale_result = self.db.fetch_one(sql, (self.STATUS_APPROVED,))
        onsale = onsale_result['count'] if onsale_result else 0

        sold_result = self.db.fetch_one(sql, (self.STATUS_SOLD,))
        sold = sold_result['count'] if sold_result else 0

        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        sql = f"SELECT category, COUNT(*) as count FROM {self.TABLE_NAME} GROUP BY category"
        category_stats = self.db.fetch_all(sql)

        sql = f"SELECT AVG(price) as avg_price FROM {self.TABLE_NAME} WHERE status = ?"
        avg_result = self.db.fetch_one(sql, (self.STATUS_APPROVED,))
        avg_price = avg_result['avg_price'] if avg_result and avg_result['avg_price'] else 0

        return {
            'total': total,
            'onsale': onsale,
            'sold': sold,
            'pending': pending,
            'avg_price': round(avg_price, 2),
            'category_stats': category_stats
        }

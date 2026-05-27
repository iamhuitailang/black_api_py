from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_jiaoyi_model_categories'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                name TEXT NOT NULL,
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        default_categories = [
            {'name': '计算机科学', 'icon': '💻', 'sort_order': 1},
            {'name': '数学', 'icon': '📐', 'sort_order': 2},
            {'name': '英语', 'icon': '📚', 'sort_order': 3},
            {'name': '物理', 'icon': '⚛️', 'sort_order': 4},
            {'name': '化学', 'icon': '🧪', 'sort_order': 5},
            {'name': '生物', 'icon': '🧬', 'sort_order': 6},
            {'name': '历史', 'icon': '📜', 'sort_order': 7},
            {'name': '政治', 'icon': '📋', 'sort_order': 8},
            {'name': '地理', 'icon': '🌍', 'sort_order': 9},
            {'name': '文学', 'icon': '📖', 'sort_order': 10}
        ]
        
        for cat in default_categories:
            existing = model.get_by_name(cat['name'])
            if not existing:
                model.create(cat['name'], cat['icon'], cat['sort_order'])

    def create(self, name: str, icon: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'icon': icon,
            'sort_order': sort_order,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['name', 'icon', 'sort_order', 'status']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='sort_order ASC, id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')


class BookModel:
    TABLE_NAME = 'tb_jiaoyi_model_books'

    STATUS_PENDING = 0
    STATUS_ON_SALE = 1
    STATUS_OFF_SHELF = 2
    STATUS_SOLD = 3
    STATUS_REJECTED = 4

    CONDITION_NEW = 'new'
    CONDITION_LIKE_NEW = 'like_new'
    CONDITION_GOOD = 'good'
    CONDITION_FAIR = 'fair'

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
                seller_id INTEGER NOT NULL,
                category_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                author TEXT DEFAULT '',
                publisher TEXT DEFAULT '',
                publish_date TEXT DEFAULT '',
                isbn TEXT DEFAULT '',
                edition TEXT DEFAULT '',
                price REAL DEFAULT 0,
                original_price REAL DEFAULT 0,
                condition TEXT DEFAULT 'good',
                description TEXT DEFAULT '',
                images TEXT DEFAULT '',
                school TEXT DEFAULT '',
                major TEXT DEFAULT '',
                course TEXT DEFAULT '',
                view_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                reject_reason TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_seller_id ON {cls.TABLE_NAME}(seller_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_school ON {cls.TABLE_NAME}(school)"
        db.execute(index_sql)

    @classmethod
    def init_default_books(cls):
        model = cls()
        default_books = [
            {
                'seller_id': 2,
                'category_id': 1,
                'title': 'Python编程：从入门到实践',
                'author': 'Eric Matthes',
                'publisher': '人民邮电出版社',
                'publish_date': '2020-01',
                'isbn': '9787115428028',
                'edition': '第2版',
                'price': 45.0,
                'original_price': 89.0,
                'condition': cls.CONDITION_GOOD,
                'description': '本书是一本针对所有层次的Python读者而作的Python入门书。',
                'images': '',
                'school': '北京大学',
                'major': '软件工程',
                'course': 'Python程序设计',
                'status': cls.STATUS_ON_SALE
            },
            {
                'seller_id': 1,
                'category_id': 1,
                'title': '深入理解计算机系统',
                'author': 'Randal E.Bryant',
                'publisher': '机械工业出版社',
                'publish_date': '2019-08',
                'isbn': '9787111544937',
                'edition': '第3版',
                'price': 60.0,
                'original_price': 139.0,
                'condition': cls.CONDITION_LIKE_NEW,
                'description': '经典的计算机系统基础教材，几乎全新。',
                'images': '',
                'school': '清华大学',
                'major': '计算机科学',
                'course': '计算机系统基础',
                'status': cls.STATUS_ON_SALE
            },
            {
                'seller_id': 2,
                'category_id': 2,
                'title': '高等数学（上册）',
                'author': '同济大学数学系',
                'publisher': '高等教育出版社',
                'publish_date': '2019-07',
                'isbn': '9787040509842',
                'edition': '第7版',
                'price': 20.0,
                'original_price': 45.0,
                'condition': cls.CONDITION_FAIR,
                'description': '有笔记和标注，内容完整。',
                'images': '',
                'school': '北京大学',
                'major': '软件工程',
                'course': '高等数学',
                'status': cls.STATUS_ON_SALE
            },
            {
                'seller_id': 1,
                'category_id': 3,
                'title': '大学英语精读3',
                'author': '董亚芬',
                'publisher': '上海外语教育出版社',
                'publish_date': '2020-04',
                'isbn': '9787544661874',
                'edition': '第3版',
                'price': 15.0,
                'original_price': 38.0,
                'condition': cls.CONDITION_GOOD,
                'description': '教材保存完好，附带光盘。',
                'images': '',
                'school': '清华大学',
                'major': '计算机科学',
                'course': '大学英语',
                'status': cls.STATUS_ON_SALE
            }
        ]
        
        for book_data in default_books:
            existing = model.query.find_one({'title': book_data['title'], 'seller_id': book_data['seller_id']})
            if not existing:
                model.create(**book_data)

    def create(self, seller_id: int, category_id: int, title: str, author: str = '',
               publisher: str = '', publish_date: str = '', isbn: str = '', edition: str = '',
               price: float = 0, original_price: float = 0, condition: str = CONDITION_GOOD,
               description: str = '', images: str = '', school: str = '', major: str = '',
               course: str = '', status: int = STATUS_PENDING) -> int:
        now = datetime.now().isoformat()
        data = {
            'seller_id': seller_id,
            'category_id': category_id,
            'title': title,
            'author': author,
            'publisher': publisher,
            'publish_date': publish_date,
            'isbn': isbn,
            'edition': edition,
            'price': price,
            'original_price': original_price,
            'condition': condition,
            'description': description,
            'images': images,
            'school': school,
            'major': major,
            'course': course,
            'view_count': 0,
            'favorite_count': 0,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT b.*, u.nickname as seller_name, u.school as seller_school, 
                   u.avatar as seller_avatar, c.name as category_name
            FROM {self.TABLE_NAME} b
            LEFT JOIN tb_jiaoyi_model_users u ON b.seller_id = u.id
            LEFT JOIN tb_jiaoyi_model_categories c ON b.category_id = c.id
            WHERE b.id = ?
        """
        return self.db.fetch_one(sql, (record_id,))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_fields = ['category_id', 'title', 'author', 'publisher', 'publish_date',
                         'isbn', 'edition', 'price', 'original_price', 'condition',
                         'description', 'images', 'school', 'major', 'course', 'status', 'reject_reason']
        update_data = {k: v for k, v in data.items() if k in update_fields}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update_view_count(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (record_id,))
        return cursor.rowcount

    def update_favorite_count(self, record_id: int, delta: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET favorite_count = MAX(0, favorite_count + ?) WHERE id = ?"
        cursor = self.db.execute(sql, (delta, record_id))
        return cursor.rowcount

    def get_all(self, page: int = 1, page_size: int = 10, seller_id: int = None,
                category_id: int = None, status: int = None, school: str = None,
                keyword: str = None, min_price: float = None, max_price: float = None,
                condition: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if seller_id is not None:
            where_clauses.append("b.seller_id = ?")
            params.append(seller_id)

        if category_id is not None and category_id > 0:
            where_clauses.append("b.category_id = ?")
            params.append(category_id)

        if status is not None:
            where_clauses.append("b.status = ?")
            params.append(status)

        if school:
            where_clauses.append("b.school LIKE ?")
            params.append(f"%{school}%")

        if min_price is not None:
            where_clauses.append("b.price >= ?")
            params.append(min_price)

        if max_price is not None:
            where_clauses.append("b.price <= ?")
            params.append(max_price)

        if condition:
            where_clauses.append("b.condition = ?")
            params.append(condition)

        if keyword:
            where_clauses.append("(b.title LIKE ? OR b.author LIKE ? OR b.publisher LIKE ? OR b.description LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT b.*, u.nickname as seller_name, u.school as seller_school, 
                   u.avatar as seller_avatar, c.name as category_name, c.icon as category_icon
            FROM {self.TABLE_NAME} b
            LEFT JOIN tb_jiaoyi_model_users u ON b.seller_id = u.id
            LEFT JOIN tb_jiaoyi_model_categories c ON b.category_id = c.id
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY b.id DESC 
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
            self.STATUS_ON_SALE: '在售',
            self.STATUS_OFF_SHELF: '已下架',
            self.STATUS_SOLD: '已售出',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

    def get_condition_text(self, condition: str) -> str:
        condition_map = {
            self.CONDITION_NEW: '全新',
            self.CONDITION_LIKE_NEW: '几乎全新',
            self.CONDITION_GOOD: '良好',
            self.CONDITION_FAIR: '一般'
        }
        return condition_map.get(condition, '未知')


class FavoriteModel:
    TABLE_NAME = 'tb_jiaoyi_model_favorites'

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
                book_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_book_id ON {cls.TABLE_NAME}(book_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_book ON {cls.TABLE_NAME}(user_id, book_id)"
        db.execute(index_sql)

    def create(self, user_id: int, book_id: int) -> int:
        existing = self.get_by_user_and_book(user_id, book_id)
        if existing:
            return 0
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'book_id': book_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_book(self, user_id: int, book_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'book_id': book_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_and_book(self, user_id: int, book_id: int) -> int:
        return self.exec.delete_by_condition({'user_id': user_id, 'book_id': book_id})

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT f.*, b.title, b.author, b.price, b.images, b.status as book_status,
                   u.nickname as seller_name
            FROM {self.TABLE_NAME} f
            JOIN tb_jiaoyi_model_books b ON f.book_id = b.id
            LEFT JOIN tb_jiaoyi_model_users u ON b.seller_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }


class ReviewModel:
    TABLE_NAME = 'tb_jiaoyi_model_reviews'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2

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
                book_id INTEGER NOT NULL,
                order_id INTEGER DEFAULT 0,
                rating INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                images TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_book_id ON {cls.TABLE_NAME}(book_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, book_id: int, order_id: int = 0,
               rating: int = 5, content: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'book_id': book_id,
            'order_id': order_id,
            'rating': rating,
            'content': content,
            'images': images,
            'status': self.STATUS_APPROVED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_jiaoyi_model_users u ON r.user_id = u.id
            WHERE r.id = ?
        """
        return self.db.fetch_one(sql, (record_id,))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['rating', 'content', 'images', 'status']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_book(self, book_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["r.book_id = ?"]
        params = [book_id]

        if status is not None:
            where_clauses.append("r.status = ?")
            params.append(status)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} r WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT r.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_jiaoyi_model_users u ON r.user_id = u.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY r.id DESC
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

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT r.*, b.title, b.images as book_image
            FROM {self.TABLE_NAME} r
            JOIN tb_jiaoyi_model_books b ON r.book_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_average_rating(self, book_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE book_id = ? AND status = 1"
        result = self.db.fetch_one(sql, (book_id,))
        return result.get('avg_rating', 0) or 0 if result else 0

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

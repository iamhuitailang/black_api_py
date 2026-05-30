from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class EmojiModel:
    TABLE_NAME = 'tb_biaoqing_model_emojis'

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
                title TEXT DEFAULT '',
                description TEXT DEFAULT '',
                url TEXT NOT NULL,
                thumb_url TEXT DEFAULT '',
                category_id INTEGER DEFAULT 0,
                user_id INTEGER DEFAULT 0,
                width INTEGER DEFAULT 0,
                height INTEGER DEFAULT 0,
                file_size INTEGER DEFAULT 0,
                file_type TEXT DEFAULT '',
                view_count INTEGER DEFAULT 0,
                download_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                share_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                is_hot INTEGER DEFAULT 0,
                is_recommend INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hot ON {cls.TABLE_NAME}(is_hot, view_count DESC)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recommend ON {cls.TABLE_NAME}(is_recommend, created_at DESC)"
        db.execute(index_sql)

    def create(self, url: str, category_id: int = 0, user_id: int = 0, title: str = '',
                 description: str = '', thumb_url: str = '', width: int = 0, height: int = 0,
                 file_size: int = 0, file_type: str = '', status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'url': url,
            'thumb_url': thumb_url,
            'category_id': category_id,
            'user_id': user_id,
            'width': width,
            'height': height,
            'file_size': file_size,
            'file_type': file_type,
            'view_count': 0,
            'download_count': 0,
            'favorite_count': 0,
            'like_count': 0,
            'share_count': 0,
            'status': status,
            'is_hot': 0,
            'is_recommend': 0,
            'created_at': now,
            'updated_at': now
        }
        emoji_id = self.exec.insert(data)
        if emoji_id > 0 and category_id > 0 and status == self.STATUS_APPROVED:
            from app.model.biaoqing_model.category import CategoryModel
            CategoryModel().update_emoji_count(category_id, 1)
        return emoji_id

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'url', 'thumb_url', 'category_id',
            'width', 'height', 'file_size', 'file_type', 'status',
            'is_hot', 'is_recommend'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        old = self.get_by_id(record_id)
        result = self.update(record_id, {'status': status})
        if result > 0 and old and old.get('category_id', 0) > 0:
            from app.model.biaoqing_model.category import CategoryModel
            if old.get('status') == self.STATUS_APPROVED and status != self.STATUS_APPROVED:
                CategoryModel().update_emoji_count(old['category_id'], -1)
            elif old.get('status') != self.STATUS_APPROVED and status == self.STATUS_APPROVED:
                CategoryModel().update_emoji_count(old['category_id'], 1)
        return result

    def increment_view(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def increment_download(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET download_count = download_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def increment_favorite(self, record_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET favorite_count = favorite_count + ? WHERE id = ?"
        return self.exec.execute_raw(sql, (delta, record_id))

    def increment_like(self, record_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        return self.exec.execute_raw(sql, (delta, record_id))

    def increment_share(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET share_count = share_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def delete(self, record_id: int) -> int:
        emoji = self.get_by_id(record_id)
        result = self.exec.delete_by_id(record_id)
        if result > 0 and emoji and emoji.get('category_id', 0) > 0 and emoji.get('status') == self.STATUS_APPROVED:
            from app.model.biaoqing_model.category import CategoryModel
            CategoryModel().update_emoji_count(emoji['category_id'], -1)
        return result

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None,
               category_id: int = None, user_id: int = None,
               order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if category_id and category_id > 0:
            conditions['category_id'] = category_id
        if user_id and user_id > 0:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 20,
               status: int = None, category_id: int = None, sort_by: str = 'latest') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if category_id and category_id > 0:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        if sort_by == 'hot':
            order_clause = 'view_count DESC, like_count DESC, id DESC'
        elif sort_by == 'latest':
            order_clause = 'id DESC'
        else:
            order_clause = 'view_count DESC, id DESC'

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY {order_clause}
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

    def get_hot_list(self, page: int = 1, page_size: int = 20, category_id: int = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_APPROVED, 'is_hot': 1}
        if category_id and category_id > 0:
            conditions['category_id'] = category_id
        return self.query.paginate(page, page_size, conditions, order_by='view_count DESC, id DESC')

    def get_recommend_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_APPROVED, 'is_recommend': 1}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_latest_list(self, page: int = 1, page_size: int = 20, category_id: int = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_APPROVED}
        if category_id and category_id > 0:
            conditions['category_id'] = category_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_random_list(self, limit: int = 10, category_id: int = None) -> List[Dict[str, Any]]:
        where_clause = "status = ?"
        params = [self.STATUS_APPROVED]
        if category_id and category_id > 0:
            where_clause += " AND category_id = ?"
            params.append(category_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"
        count_result = self.db.fetch_one(count_sql, tuple(params))
        total = count_result['total'] if count_result else 0

        if total == 0:
            return []

        max_offset = max(0, total - limit)
        offset = random.randint(0, max_offset) if max_offset > 0 else 0

        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {where_clause}
            ORDER BY id DESC
            LIMIT {limit} OFFSET {offset}
        """
        return self.db.fetch_all(sql, tuple(params))

    def get_ids_by_tags(self, tag_ids: List[int], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not tag_ids:
            return {'items': [], 'total': 0, 'page': page, 'page_size': page_size, 'total_pages': 0}

        placeholders = ', '.join(['?' for _ in tag_ids])
        offset = (page - 1) * page_size

        from app.model.biaoqing_model.emoji_tag import EmojiTagModel
        emoji_tag_table = EmojiTagModel.TABLE_NAME

        count_sql = f"""
            SELECT COUNT(DISTINCT et.emoji_id) as total
            FROM {emoji_tag_table} et
            INNER JOIN {self.TABLE_NAME} e ON et.emoji_id = e.id
            WHERE et.tag_id IN ({placeholders}) AND e.status = ?
        """
        params = tag_ids + [self.STATUS_APPROVED]
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT DISTINCT e.*
            FROM {emoji_tag_table} et
            INNER JOIN {self.TABLE_NAME} e ON et.emoji_id = e.id
            WHERE et.tag_id IN ({placeholders}) AND e.status = ?
            ORDER BY e.view_count DESC, e.id DESC
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
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

    def get_tags(self, emoji_id: int) -> List[Dict[str, Any]]:
        from app.model.biaoqing_model.emoji_tag import EmojiTagModel
        from app.model.biaoqing_model.tag import TagModel
        emoji_tag_model = EmojiTagModel()
        tag_model = TagModel()
        tag_ids = emoji_tag_model.get_tag_ids_by_emoji_id(emoji_id)
        tags = []
        for tag_id in tag_ids:
            tag = tag_model.get_by_id(tag_id)
            if tag:
                tags.append(tag_model.to_dict(tag))
        return tags

    def set_tags(self, emoji_id: int, tag_names: List[str]) -> None:
        from app.model.biaoqing_model.emoji_tag import EmojiTagModel
        from app.model.biaoqing_model.tag import TagModel
        emoji_tag_model = EmojiTagModel()
        tag_model = TagModel()

        emoji_tag_model.delete_by_emoji_id(emoji_id)

        for tag_name in tag_names:
            tag_name = tag_name.strip()
            if tag_name:
                tag_id = tag_model.get_or_create(tag_name)
                emoji_tag_model.create(emoji_id, tag_id)

    def to_dict(self, emoji: Dict[str, Any], include_tags: bool = False) -> Dict[str, Any]:
        result = {
            'id': emoji.get('id'),
            'title': emoji.get('title'),
            'description': emoji.get('description'),
            'url': emoji.get('url'),
            'thumb_url': emoji.get('thumb_url') or emoji.get('url'),
            'category_id': emoji.get('category_id'),
            'user_id': emoji.get('user_id'),
            'width': emoji.get('width'),
            'height': emoji.get('height'),
            'file_size': emoji.get('file_size'),
            'file_type': emoji.get('file_type'),
            'view_count': emoji.get('view_count'),
            'download_count': emoji.get('download_count'),
            'favorite_count': emoji.get('favorite_count'),
            'like_count': emoji.get('like_count'),
            'share_count': emoji.get('share_count'),
            'status': emoji.get('status'),
            'status_text': self.get_status_text(emoji.get('status')),
            'is_hot': emoji.get('is_hot'),
            'is_recommend': emoji.get('is_recommend'),
            'created_at': emoji.get('created_at')
        }
        if include_tags:
            result['tags'] = self.get_tags(emoji.get('id'))
        return result

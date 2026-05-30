from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AdModel:
    TABLE_NAME = 'tb_biaoqing_model_ads'

    POSITION_HOME_BANNER = 1
    POSITION_HOME_SIDEBAR = 2
    POSITION_DETAIL_TOP = 3
    POSITION_DETAIL_BOTTOM = 4
    POSITION_SEARCH_TOP = 5

    STATUS_DISABLED = 0
    STATUS_ACTIVE = 1

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
                image_url TEXT DEFAULT '',
                link_url TEXT DEFAULT '',
                position INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0,
                click_count INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_position ON {cls.TABLE_NAME}(position)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, title: str = '', description: str = '', image_url: str = '',
               link_url: str = '', position: int = 1, sort_order: int = 0,
               start_time: str = '', end_time: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'image_url': image_url,
            'link_url': link_url,
            'position': position,
            'sort_order': sort_order,
            'click_count': 0,
            'view_count': 0,
            'start_time': start_time,
            'end_time': end_time,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'image_url', 'link_url',
            'position', 'sort_order', 'start_time', 'end_time', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def increment_click(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET click_count = click_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def increment_view(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None,
                position: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if position is not None:
            conditions['position'] = position
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def get_active_by_position(self, position: int, limit: int = 10) -> List[Dict[str, Any]]:
        now = datetime.now().isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE position = ? AND status = ?
            AND (start_time IS NULL OR start_time <= ?)
            AND (end_time IS NULL OR end_time >= ?)
            ORDER BY sort_order ASC, id DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (position, self.STATUS_ACTIVE, now, now, limit))

    def get_position_text(self, position: int) -> str:
        position_map = {
            self.POSITION_HOME_BANNER: '首页Banner',
            self.POSITION_HOME_SIDEBAR: '首页侧边栏',
            self.POSITION_DETAIL_TOP: '详情页顶部',
            self.POSITION_DETAIL_BOTTOM: '详情页底部',
            self.POSITION_SEARCH_TOP: '搜索页顶部'
        }
        return position_map.get(position, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DISABLED: '禁用',
            self.STATUS_ACTIVE: '启用'
        }
        return status_map.get(status, '未知')

    def to_dict(self, ad: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': ad.get('id'),
            'title': ad.get('title'),
            'description': ad.get('description'),
            'image_url': ad.get('image_url'),
            'link_url': ad.get('link_url'),
            'position': ad.get('position'),
            'position_text': self.get_position_text(ad.get('position')),
            'sort_order': ad.get('sort_order'),
            'click_count': ad.get('click_count'),
            'view_count': ad.get('view_count'),
            'start_time': ad.get('start_time'),
            'end_time': ad.get('end_time'),
            'status': ad.get('status'),
            'status_text': self.get_status_text(ad.get('status')),
            'created_at': ad.get('created_at')
        }

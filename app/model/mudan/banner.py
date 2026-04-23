from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BannerModel:
    TABLE_NAME = 'tb_mudan_banner'
    
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
                image_url TEXT NOT NULL,
                jump_url TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def migrate_remove_aspect_ratio(cls):
        db = get_db()
        
        old_columns = db.fetch_one(f"PRAGMA table_info({cls.TABLE_NAME})")
        has_aspect_ratio = False
        columns_info = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        
        for col in columns_info:
            if col.get('name') == 'aspect_ratio':
                has_aspect_ratio = True
                break
        
        if not has_aspect_ratio:
            return False
        
        temp_table = f"{cls.TABLE_NAME}_temp"
        
        db.execute(f"DROP TABLE IF EXISTS {temp_table}")
        
        create_temp_sql = f"""
            CREATE TABLE {temp_table} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_url TEXT NOT NULL,
                jump_url TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(create_temp_sql)
        
        copy_sql = f"""
            INSERT INTO {temp_table} (id, image_url, jump_url, sort_order, created_at, updated_at)
            SELECT id, image_url, jump_url, sort_order, created_at, updated_at
            FROM {cls.TABLE_NAME}
        """
        db.execute(copy_sql)
        
        db.execute(f"DROP TABLE {cls.TABLE_NAME}")
        
        db.execute(f"ALTER TABLE {temp_table} RENAME TO {cls.TABLE_NAME}")
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)
        
        return True

    def create(self, image_url: str, jump_url: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'image_url': image_url,
            'jump_url': jump_url,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, image_url: str = None, jump_url: str = None, 
               sort_order: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if image_url is not None:
            data['image_url'] = image_url
        if jump_url is not None:
            data['jump_url'] = jump_url
        if sort_order is not None:
            data['sort_order'] = sort_order
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def count(self) -> int:
        return self.query.count()

    def create_many(self, banners: List[Dict[str, Any]]) -> int:
        if not banners:
            return 0
        
        now = datetime.now().isoformat()
        data_list = []
        for banner in banners:
            data_list.append({
                'image_url': banner.get('image_url', ''),
                'jump_url': banner.get('jump_url', ''),
                'sort_order': banner.get('sort_order', 0),
                'created_at': now,
                'updated_at': now
            })
        
        return self.exec.insert_many(data_list)

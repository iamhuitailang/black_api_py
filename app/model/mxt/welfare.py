from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WelfareModel:
    TABLE_NAME = 'tb_mxt_welfare'
    
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
                icon TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def seed_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count['total'] > 0:
            return
        
        default_welfares = [
            ('🍕', '包吃', '每天和动物一起吃（可能是生肉）', 1),
            ('🏕️', '包住', '住帐篷，和马戏团一起巡演', 2),
            ('🎪', '免费看表演', '休息日随便看，但座位是最后一排', 3),
            ('🐘', '和动物做朋友', '但不保证它们也想和你做朋友', 4),
            ('💰', '工资', '我们给的不是钱，是梦想（实际为虚拟货币"马戏团金币"）', 5),
        ]
        
        now = datetime.now().isoformat()
        for welfare in default_welfares:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (icon, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (welfare[0], welfare[1], welfare[2], welfare[3], now, now)
            )

    def create(self, icon: str, title: str, description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'icon': icon,
            'title': title,
            'description': description,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, icon: str = None, title: str = None,
               description: str = None, sort_order: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if icon is not None:
            data['icon'] = icon
        if title is not None:
            data['title'] = title
        if description is not None:
            data['description'] = description
        if sort_order is not None:
            data['sort_order'] = sort_order
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiAIConfigModel:
    TABLE_NAME = 'tb_xiangqi077_model_ai_config'

    STATUS_ENABLED = 0
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
                level INTEGER NOT NULL,
                description TEXT DEFAULT '',
                search_depth INTEGER DEFAULT 2,
                think_time INTEGER DEFAULT 1000,
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)

    @classmethod
    def init_default_configs(cls):
        model = cls()
        existing = model.query.count({})
        if existing > 0:
            return
        defaults = [
            {'name': '新手', 'level': 1, 'description': '入门级AI，适合新手练习', 'search_depth': 1, 'think_time': 500, 'sort_order': 1},
            {'name': '初级', 'level': 2, 'description': '初级AI，有一定棋力', 'search_depth': 2, 'think_time': 800, 'sort_order': 2},
            {'name': '中级', 'level': 3, 'description': '中级AI，需要一定水平才能战胜', 'search_depth': 3, 'think_time': 1200, 'sort_order': 3},
            {'name': '高级', 'level': 4, 'description': '高级AI，棋力较强', 'search_depth': 4, 'think_time': 2000, 'sort_order': 4},
            {'name': '大师', 'level': 5, 'description': '大师级AI，极具挑战性', 'search_depth': 5, 'think_time': 3000, 'sort_order': 5},
        ]
        now = datetime.now().isoformat()
        for d in defaults:
            data = {**d, 'status': model.STATUS_ENABLED, 'created_at': now, 'updated_at': now}
            model.exec.insert(data)

    def create(self, name: str, level: int, description: str = '',
               search_depth: int = 2, think_time: int = 1000, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'level': level,
            'description': description,
            'search_depth': search_depth,
            'think_time': think_time,
            'status': self.STATUS_ENABLED,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_level(self, level: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'level': level})

    def get_enabled_configs(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_ENABLED},
            order_by='sort_order ASC'
        )

    def update(self, config_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'level', 'description', 'search_depth', 'think_time', 'status', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(config_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='sort_order ASC')

    def to_dict(self, config: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': config.get('id'),
            'name': config.get('name'),
            'level': config.get('level'),
            'description': config.get('description'),
            'search_depth': config.get('search_depth'),
            'think_time': config.get('think_time'),
            'status': config.get('status'),
            'sort_order': config.get('sort_order'),
            'created_at': config.get('created_at')
        }

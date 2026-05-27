from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskModel:
    TABLE_NAME = 'tb_daka_tasks'

    TYPE_DAILY = 1
    TYPE_WEEKLY = 2
    TYPE_HABIT = 3
    TYPE_CUSTOM = 4

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1
    STATUS_DELETED = 2

    DEFAULT_TASKS = [
        {'name': '早起打卡', 'type': 1, 'icon': '🌅', 'target_value': 1, 'unit': '次', 'remind_time': '07:00', 'is_system': 1},
        {'name': '喝水', 'type': 1, 'icon': '💧', 'target_value': 8, 'unit': '杯', 'remind_time': '09:00,11:00,13:00,15:00,17:00', 'is_system': 1},
        {'name': '阅读', 'type': 1, 'icon': '📖', 'target_value': 30, 'unit': '分钟', 'remind_time': '21:00', 'is_system': 1},
        {'name': '运动', 'type': 2, 'icon': '🏋️', 'target_value': 3, 'unit': '次', 'remind_time': '18:00', 'is_system': 1},
        {'name': '冥想', 'type': 1, 'icon': '🧘', 'target_value': 10, 'unit': '分钟', 'remind_time': '07:30', 'is_system': 1},
        {'name': '背单词', 'type': 1, 'icon': '📚', 'target_value': 20, 'unit': '个', 'remind_time': '20:00', 'is_system': 1},
        {'name': '写日记', 'type': 1, 'icon': '✍️', 'target_value': 1, 'unit': '篇', 'remind_time': '22:00', 'is_system': 1},
        {'name': '早睡', 'type': 1, 'icon': '🌙', 'target_value': 1, 'unit': '次', 'remind_time': '23:00', 'is_system': 1},
        {'name': '健康饮食', 'type': 1, 'icon': '🥗', 'target_value': 3, 'unit': '餐', 'remind_time': '12:00', 'is_system': 1},
        {'name': '步行', 'type': 1, 'icon': '👟', 'target_value': 8000, 'unit': '步', 'remind_time': '20:00', 'is_system': 1},
        {'name': '学习', 'type': 1, 'icon': '💻', 'target_value': 2, 'unit': '小时', 'remind_time': '19:00', 'is_system': 1},
        {'name': '练琴', 'type': 1, 'icon': '🎹', 'target_value': 30, 'unit': '分钟', 'remind_time': '17:00', 'is_system': 1},
        {'name': '戒糖', 'type': 3, 'icon': '🍬', 'target_value': 21, 'unit': '天', 'remind_time': '', 'is_system': 1},
        {'name': '存钱', 'type': 1, 'icon': '💰', 'target_value': 10, 'unit': '元', 'remind_time': '21:00', 'is_system': 1},
        {'name': '感恩日记', 'type': 1, 'icon': '🙏', 'target_value': 3, 'unit': '件', 'remind_time': '22:30', 'is_system': 1},
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
                user_id INTEGER DEFAULT 0,
                name TEXT NOT NULL,
                type INTEGER DEFAULT 1,
                icon TEXT DEFAULT '',
                target_value INTEGER DEFAULT 1,
                unit TEXT DEFAULT '次',
                remind_time TEXT DEFAULT '',
                description TEXT DEFAULT '',
                is_system INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_system ON {cls.TABLE_NAME}(is_system)"
        db.execute(index_sql)

    @classmethod
    def init_default_tasks(cls):
        db = get_db()
        task_model = cls()
        for task in cls.DEFAULT_TASKS:
            existing = db.fetch_one(
                f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ? AND is_system = 1",
                (task['name'],)
            )
            if not existing:
                task_model.create(**task)

    def create(self, user_id: int = 0, name: str = '', type: int = 1, icon: str = '',
               target_value: int = 1, unit: str = '次', remind_time: str = '',
               description: str = '', is_system: int = 0, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'type': type,
            'icon': icon,
            'target_value': target_value,
            'unit': unit,
            'remind_time': remind_time,
            'description': description,
            'is_system': is_system,
            'sort_order': sort_order,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_system_tasks(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_system': 1, 'status': self.STATUS_ACTIVE}, order_by='sort_order ASC, id ASC')

    def get_user_tasks(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND (is_system = 1 OR user_id = ?)
            ORDER BY sort_order ASC, id ASC
        """
        return self.db.fetch_all(sql, (self.STATUS_ACTIVE, user_id))

    def get_user_custom_tasks(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'is_system': 0, 'status': self.STATUS_ACTIVE},
            order_by='sort_order ASC, id ASC'
        )

    def get_tasks_by_type(self, user_id: int, task_type: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND type = ? AND (is_system = 1 OR user_id = ?)
            ORDER BY sort_order ASC, id ASC
        """
        return self.db.fetch_all(sql, (self.STATUS_ACTIVE, task_type, user_id))

    def update(self, task_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'icon', 'target_value', 'unit', 'remind_time',
            'description', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(task_id, update_data)

    def update_status(self, task_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(task_id, data)

    def delete(self, task_id: int) -> int:
        return self.update_status(task_id, self.STATUS_DELETED)

    def get_type_text(self, task_type: int) -> str:
        type_map = {
            self.TYPE_DAILY: '每日必做',
            self.TYPE_WEEKLY: '每周目标',
            self.TYPE_HABIT: '习惯养成',
            self.TYPE_CUSTOM: '自定义',
        }
        return type_map.get(task_type, '未知')

    def to_dict(self, task: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': task.get('id'),
            'user_id': task.get('user_id'),
            'name': task.get('name'),
            'type': task.get('type'),
            'type_text': self.get_type_text(task.get('type')),
            'icon': task.get('icon'),
            'target_value': task.get('target_value'),
            'unit': task.get('unit'),
            'remind_time': task.get('remind_time'),
            'description': task.get('description'),
            'is_system': task.get('is_system'),
            'sort_order': task.get('sort_order'),
            'status': task.get('status'),
            'created_at': task.get('created_at')
        }

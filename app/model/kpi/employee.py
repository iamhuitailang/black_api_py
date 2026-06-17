from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EmployeeModel:
    TABLE_NAME = 'tb_kpi_employee'

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
                user_id INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                position TEXT,
                supervisor_id INTEGER,
                role TEXT DEFAULT 'employee',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_department ON {cls.TABLE_NAME}(department)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_supervisor ON {cls.TABLE_NAME}(supervisor_id)"
        db.execute(index_sql2)

        cls._init_default_data()

    @classmethod
    def _init_default_data(cls):
        db = get_db()
        existing = db.fetch_one(f"SELECT COUNT(*) as cnt FROM {cls.TABLE_NAME}")
        if existing and existing.get('cnt', 0) > 0:
            return

        now = datetime.now().isoformat()
        default_employees = [
            (1, '张三', '研发部', '技术总监', None, 'admin', 1, now, now),
            (2, '李四', '研发部', '前端组长', 1, 'manager', 1, now, now),
            (3, '王五', '研发部', '后端组长', 1, 'manager', 1, now, now),
            (4, '赵六', '研发部', '前端工程师', 2, 'employee', 1, now, now),
            (5, '钱七', '研发部', '前端工程师', 2, 'employee', 1, now, now),
            (6, '孙八', '研发部', '后端工程师', 3, 'employee', 1, now, now),
            (7, '周九', '研发部', '后端工程师', 3, 'employee', 1, now, now),
            (8, '吴十', '产品部', '产品总监', None, 'admin', 1, now, now),
            (9, '郑十一', '产品部', '产品经理', 8, 'employee', 1, now, now),
            (10, '冯十二', '产品部', '产品经理', 8, 'employee', 1, now, now),
        ]
        for emp in default_employees:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (user_id, name, department, position, supervisor_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                emp
            )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'department': department}, order_by='id ASC')

    def get_subordinates(self, supervisor_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'supervisor_id': supervisor_id}, order_by='id ASC')

    def get_all_departments(self) -> List[str]:
        sql = f"SELECT DISTINCT department FROM {self.TABLE_NAME} WHERE status = 1 ORDER BY department"
        rows = self.db.fetch_all(sql)
        return [row['department'] for row in rows]

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='department ASC, id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

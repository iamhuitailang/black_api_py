from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DepartmentModel:
    TABLE_NAME = 'tb_tousu_model_departments'

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
                code TEXT NOT NULL UNIQUE,
                description TEXT DEFAULT '',
                head_user_id INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_head_user_id ON {cls.TABLE_NAME}(head_user_id)"
        db.execute(index_sql)

    def create(self, name: str, code: str, description: str = '', 
               head_user_id: int = 0, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'code': code,
            'description': description,
            'head_user_id': head_user_id,
            'sort_order': sort_order,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def update(self, department_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'code', 'description', 'head_user_id', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(department_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, status: int = None, keyword: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        items = self.query.find_all(conditions, order_by='sort_order ASC, id ASC')
        if keyword:
            items = [item for item in items if keyword in item.get('name', '') or keyword in item.get('code', '')]
        return items

    def to_dict(self, department: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': department.get('id'),
            'name': department.get('name'),
            'code': department.get('code'),
            'description': department.get('description'),
            'head_user_id': department.get('head_user_id'),
            'sort_order': department.get('sort_order'),
            'status': department.get('status'),
            'created_at': department.get('created_at'),
            'updated_at': department.get('updated_at')
        }

    @classmethod
    def init_default_departments(cls):
        department_model = cls()
        defaults = [
            ('教务处', 'jiaowu', '负责教学管理相关事务'),
            ('后勤处', 'houqin', '负责后勤服务相关事务'),
            ('保卫处', 'baowei', '负责校园安全相关事务'),
            ('网络中心', 'wangluo', '负责网络服务相关事务'),
            ('图书馆', 'tushu', '负责图书资源相关事务'),
            ('体育部', 'tiyu', '负责体育设施相关事务'),
            ('学生处', 'xuesheng', '负责学生事务管理'),
            ('总务处', 'zongwu', '负责综合事务管理'),
            ('校医院', 'xiaoyi', '负责医疗服务相关事务'),
            ('系统管理', 'system', '系统管理员部门')
        ]
        for name, code, desc in defaults:
            existing = department_model.get_by_code(code)
            if not existing:
                department_model.create(name, code, desc)
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseModel:
    TABLE_NAME = 'tb_course_courses'

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
                teacher TEXT NOT NULL,
                semester TEXT NOT NULL,
                department TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_semester ON {cls.TABLE_NAME}(semester)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_teacher ON {cls.TABLE_NAME}(teacher)"
        db.execute(index_sql2)

    @classmethod
    def seed_initial_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count.get('total', 0) > 0:
            return False

        now = datetime.now().isoformat()
        courses = [
            ('高等数学', '张教授', '2025-2026-1', '数学学院'),
            ('线性代数', '李教授', '2025-2026-1', '数学学院'),
            ('概率论与数理统计', '王教授', '2025-2026-1', '数学学院'),
            ('数据结构', '陈教授', '2025-2026-1', '计算机学院'),
            ('操作系统', '刘教授', '2025-2026-1', '计算机学院'),
            ('计算机网络', '赵教授', '2025-2026-1', '计算机学院'),
            ('软件工程', '孙教授', '2025-2026-1', '计算机学院'),
            ('大学物理', '周教授', '2025-2026-1', '物理学院'),
            ('大学英语', '吴教授', '2025-2026-1', '外语学院'),
            ('思想政治', '郑教授', '2025-2026-1', '马克思主义学院'),
            ('高等数学', '钱教授', '2025-2026-2', '数学学院'),
            ('线性代数', '冯教授', '2025-2026-2', '数学学院'),
            ('离散数学', '褚教授', '2025-2026-2', '数学学院'),
            ('算法设计与分析', '卫教授', '2025-2026-2', '计算机学院'),
            ('数据库原理', '蒋教授', '2025-2026-2', '计算机学院'),
            ('编译原理', '沈教授', '2025-2026-2', '计算机学院'),
            ('人工智能导论', '韩教授', '2025-2026-2', '计算机学院'),
            ('大学物理', '杨教授', '2025-2026-2', '物理学院'),
            ('大学英语', '朱教授', '2025-2026-2', '外语学院'),
            ('毛泽东思想概论', '秦教授', '2025-2026-2', '马克思主义学院'),
        ]
        sql = f"INSERT INTO {cls.TABLE_NAME} (name, teacher, semester, department, created_at) VALUES (?, ?, ?, ?, ?)"
        params = [(c[0], c[1], c[2], c[3], now) for c in courses]
        db.execute_many(sql, params)
        return True

    def create(self, name: str, teacher: str, semester: str, department: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'teacher': teacher,
            'semester': semester,
            'department': department,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='semester DESC, department ASC, name ASC')

    def get_by_semester(self, semester: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'semester': semester}, order_by='department ASC, name ASC')

    def get_semesters(self) -> List[str]:
        sql = f"SELECT DISTINCT semester FROM {self.TABLE_NAME} ORDER BY semester DESC"
        rows = self.db.fetch_all(sql)
        return [row['semester'] for row in rows]

    def get_teachers(self, semester: str = None) -> List[str]:
        if semester:
            sql = f"SELECT DISTINCT teacher FROM {self.TABLE_NAME} WHERE semester = ? ORDER BY teacher ASC"
            rows = self.db.fetch_all(sql, (semester,))
        else:
            sql = f"SELECT DISTINCT teacher FROM {self.TABLE_NAME} ORDER BY teacher ASC"
            rows = self.db.fetch_all(sql)
        return [row['teacher'] for row in rows]

    def get_names(self, semester: str = None, teacher: str = None) -> List[str]:
        conditions = {}
        if semester:
            conditions['semester'] = semester
        if teacher:
            conditions['teacher'] = teacher
        sql = f"SELECT DISTINCT name FROM {self.TABLE_NAME}"
        params = []
        if conditions:
            clauses = []
            for k, v in conditions.items():
                clauses.append(f"{k} = ?")
                params.append(v)
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY name ASC"
        rows = self.db.fetch_all(sql, tuple(params) if params else None)
        return [row['name'] for row in rows]

    def find_course(self, name: str, teacher: str, semester: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name, 'teacher': teacher, 'semester': semester})

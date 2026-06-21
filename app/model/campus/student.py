from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StudentModel:
    TABLE_NAME = 'tb_campus_student'

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
                student_no TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                gender TEXT,
                department TEXT,
                major TEXT,
                grade TEXT,
                phone TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sqls = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_no ON {cls.TABLE_NAME}(student_no)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dept ON {cls.TABLE_NAME}(department)"
        ]
        for idx_sql in index_sqls:
            db.execute(idx_sql)

        cls._seed_initial_data()

    @classmethod
    def _seed_initial_data(cls):
        model = cls()
        if model.query.count() > 0:
            return

        departments = ['计算机学院', '数学学院', '物理学院', '外国语学院', '经济管理学院', '文学院']
        majors_map = {
            '计算机学院': ['软件工程', '计算机科学', '人工智能'],
            '数学学院': ['数学与应用数学', '统计学'],
            '物理学院': ['物理学', '应用物理'],
            '外国语学院': ['英语', '日语'],
            '经济管理学院': ['工商管理', '金融学'],
            '文学院': ['汉语言文学', '新闻学']
        }
        surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴']
        givens = ['明', '华', '伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '丽', '涛', '超', '燕', '平']

        now = datetime.now().isoformat()
        students = []
        for i in range(50):
            dept = departments[i % len(departments)]
            majors = majors_map[dept]
            name = surnames[i % len(surnames)] + givens[i % len(givens)]
            students.append({
                'student_no': f'2024{i:04d}',
                'name': name,
                'gender': '男' if i % 2 == 0 else '女',
                'department': dept,
                'major': majors[i % len(majors)],
                'grade': f'{2022 + (i % 3)}级',
                'phone': f'138{i:08d}',
                'status': 1,
                'created_at': now,
                'updated_at': now
            })
        model.exec.insert_many(students)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_student_no(self, student_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'student_no': student_no})

    def get_all(self, department: str = None, keyword: str = None) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE status = 1"
        params = []
        if department:
            sql += " AND department = ?"
            params.append(department)
        if keyword:
            sql += " AND (name LIKE ? OR student_no LIKE ?)"
            params.extend([f'%{keyword}%', f'%{keyword}%'])
        sql += " ORDER BY id ASC LIMIT 200"
        return self.query.query_raw(sql, tuple(params) if params else None)

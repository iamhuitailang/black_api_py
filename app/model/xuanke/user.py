from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_xuanke_users'

    ROLE_STUDENT = 'student'
    ROLE_TEACHER = 'teacher'
    ROLE_ADMIN = 'admin'

    STATUS_ACTIVE = 0
    STATUS_MUTED = 1
    STATUS_BANNED = 2

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
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                real_name TEXT DEFAULT '',
                role TEXT NOT NULL DEFAULT 'student',
                student_no TEXT UNIQUE,
                teacher_no TEXT UNIQUE,
                department TEXT DEFAULT '',
                major TEXT DEFAULT '',
                class_name TEXT DEFAULT '',
                grade TEXT DEFAULT '',
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student_no ON {cls.TABLE_NAME}(student_no)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        model = cls()
        existing = model.get_by_username('admin')
        if not existing:
            model.create(
                username='admin',
                password='admin123',
                real_name='系统管理员',
                role=cls.ROLE_ADMIN
            )
            print("  - Created default admin user: admin/admin123")
        
        existing_student = model.get_by_username('student')
        if not existing_student:
            model.create(
                username='student',
                password='123456',
                real_name='张三',
                role=cls.ROLE_STUDENT,
                student_no='2023001',
                department='计算机学院',
                major='软件工程',
                class_name='计科2301',
                grade='2023',
                email='student@test.com'
            )
            print("  - Created default student user: student/123456")
        
        existing_teacher = model.get_by_username('teacher')
        if not existing_teacher:
            model.create(
                username='teacher',
                password='123456',
                real_name='李教授',
                role=cls.ROLE_TEACHER,
                teacher_no='T001',
                department='计算机学院',
                email='teacher@test.com'
            )
            print("  - Created default teacher user: teacher/123456")

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, real_name: str = '',
               role: str = ROLE_STUDENT, student_no: str = None,
               teacher_no: str = None, department: str = '', major: str = '',
               class_name: str = '', grade: str = '', email: str = '',
               phone: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'real_name': real_name,
            'role': role,
            'student_no': student_no,
            'teacher_no': teacher_no,
            'department': department,
            'major': major,
            'class_name': class_name,
            'grade': grade,
            'email': email,
            'phone': phone,
            'avatar': '',
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def get_by_student_no(self, student_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'student_no': student_no})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None

        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == user.get('password_hash'):
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'real_name': user.get('real_name'),
                'role': user.get('role'),
                'student_no': user.get('student_no'),
                'teacher_no': user.get('teacher_no'),
                'department': user.get('department'),
                'major': user.get('major'),
                'class_name': user.get('class_name'),
                'grade': user.get('grade'),
                'email': user.get('email'),
                'phone': user.get('phone'),
                'avatar': user.get('avatar'),
                'status': user.get('status')
            }
        return None

    def update_password(self, user_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'salt': salt,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'real_name', 'email', 'phone', 'avatar', 'department', 'major', 'class_name', 'grade'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(user_id, update_data)

    def update_status(self, user_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, role: str = None,
                status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if role:
            conditions['role'] = role
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, role, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               role: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if role:
            where_clauses.append("role = ?")
            params.append(role)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(username LIKE ? OR real_name LIKE ? OR student_no LIKE ? OR teacher_no LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
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

    def get_role_text(self, role: str) -> str:
        role_map = {
            self.ROLE_STUDENT: '学生',
            self.ROLE_TEACHER: '教师',
            self.ROLE_ADMIN: '管理员'
        }
        return role_map.get(role, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_MUTED: '禁用',
            self.STATUS_BANNED: '封号'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'real_name': user.get('real_name'),
            'role': user.get('role'),
            'role_text': self.get_role_text(user.get('role')),
            'student_no': user.get('student_no'),
            'teacher_no': user.get('teacher_no'),
            'department': user.get('department'),
            'major': user.get('major'),
            'class_name': user.get('class_name'),
            'grade': user.get('grade'),
            'email': user.get('email'),
            'phone': user.get('phone'),
            'avatar': user.get('avatar'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }

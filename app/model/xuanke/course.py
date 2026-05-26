from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseModel:
    TABLE_NAME = 'tb_xuanke_courses'

    TYPE_REQUIRED = 'required'
    TYPE_ELECTIVE = 'elective'
    TYPE_GENERAL = 'general'

    STATUS_OPEN = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_FULL = 'full'

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
                course_code TEXT NOT NULL UNIQUE,
                course_name TEXT NOT NULL,
                teacher TEXT NOT NULL,
                credits INTEGER NOT NULL DEFAULT 0,
                hours INTEGER NOT NULL DEFAULT 0,
                max_students INTEGER NOT NULL DEFAULT 0,
                enrolled_count INTEGER NOT NULL DEFAULT 0,
                schedule TEXT NOT NULL,
                location TEXT NOT NULL,
                course_type TEXT NOT NULL DEFAULT 'elective',
                description TEXT DEFAULT '',
                syllabus TEXT DEFAULT '',
                assessment TEXT DEFAULT '',
                textbook TEXT DEFAULT '',
                prerequisites TEXT DEFAULT '',
                semester TEXT DEFAULT '',
                status TEXT DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_code ON {cls.TABLE_NAME}(course_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_type ON {cls.TABLE_NAME}(course_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_teacher ON {cls.TABLE_NAME}(teacher)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_courses(cls):
        model = cls()
        count = model.query.count()
        if count > 0:
            return

        default_courses = [
            {'course_code': 'CS101', 'course_name': '程序设计基础', 'teacher': '张教授', 'credits': 3, 'hours': 48, 'max_students': 60, 'enrolled_count': 45, 'schedule': '周一1-2节', 'location': '信息楼101', 'course_type': 'required'},
            {'course_code': 'CS201', 'course_name': '数据结构', 'teacher': '李教授', 'credits': 4, 'hours': 64, 'max_students': 50, 'enrolled_count': 38, 'schedule': '周二3-4节', 'location': '信息楼201', 'course_type': 'required'},
            {'course_code': 'CS301', 'course_name': '数据库原理', 'teacher': '王老师', 'credits': 3, 'hours': 48, 'max_students': 55, 'enrolled_count': 42, 'schedule': '周三5-6节', 'location': '信息楼301', 'course_type': 'required'},
            {'course_code': 'CS401', 'course_name': '操作系统', 'teacher': '赵教授', 'credits': 4, 'hours': 64, 'max_students': 45, 'enrolled_count': 30, 'schedule': '周四1-2节', 'location': '信息楼401', 'course_type': 'required'},
            {'course_code': 'CS501', 'course_name': '计算机网络', 'teacher': '孙老师', 'credits': 3, 'hours': 48, 'max_students': 50, 'enrolled_count': 35, 'schedule': '周五3-4节', 'location': '信息楼101', 'course_type': 'required'},
            {'course_code': 'SE101', 'course_name': '软件工程', 'teacher': '周教授', 'credits': 3, 'hours': 48, 'max_students': 55, 'enrolled_count': 28, 'schedule': '周一3-4节', 'location': '信息楼102', 'course_type': 'elective'},
            {'course_code': 'AI101', 'course_name': '人工智能导论', 'teacher': '吴教授', 'credits': 3, 'hours': 48, 'max_students': 40, 'enrolled_count': 40, 'schedule': '周二1-2节', 'location': '信息楼202', 'course_type': 'elective'},
            {'course_code': 'WEB101', 'course_name': 'Web开发技术', 'teacher': '郑老师', 'credits': 3, 'hours': 48, 'max_students': 50, 'enrolled_count': 50, 'schedule': '周三3-4节', 'location': '信息楼302', 'course_type': 'elective'},
            {'course_code': 'MT101', 'course_name': '高等数学', 'teacher': '陈教授', 'credits': 5, 'hours': 80, 'max_students': 80, 'enrolled_count': 72, 'schedule': '周一5-6节', 'location': '教学楼101', 'course_type': 'required'},
            {'course_code': 'PH101', 'course_name': '大学物理', 'teacher': '林教授', 'credits': 4, 'hours': 64, 'max_students': 70, 'enrolled_count': 55, 'schedule': '周四3-4节', 'location': '教学楼201', 'course_type': 'required'},
            {'course_code': 'ENG101', 'course_name': '大学英语', 'teacher': '刘老师', 'credits': 4, 'hours': 64, 'max_students': 60, 'enrolled_count': 48, 'schedule': '周二5-6节', 'location': '外语楼101', 'course_type': 'required'},
            {'course_code': 'PE101', 'course_name': '体育', 'teacher': '王教练', 'credits': 1, 'hours': 32, 'max_students': 30, 'enrolled_count': 28, 'schedule': '周五1-2节', 'location': '体育馆', 'course_type': 'required'},
            {'course_code': 'ART101', 'course_name': '艺术鉴赏', 'teacher': '陈老师', 'credits': 2, 'hours': 32, 'max_students': 50, 'enrolled_count': 32, 'schedule': '周四5-6节', 'location': '艺术楼101', 'course_type': 'general'},
            {'course_code': 'PSY101', 'course_name': '心理学导论', 'teacher': '张老师', 'credits': 2, 'hours': 32, 'max_students': 55, 'enrolled_count': 41, 'schedule': '周三1-2节', 'location': '教学楼302', 'course_type': 'general'},
            {'course_code': 'ECO101', 'course_name': '经济学原理', 'teacher': '李教授', 'credits': 3, 'hours': 48, 'max_students': 60, 'enrolled_count': 25, 'schedule': '周一7-8节', 'location': '经管楼101', 'course_type': 'elective'},
            {'course_code': 'LAW101', 'course_name': '法律基础', 'teacher': '王律师', 'credits': 2, 'hours': 32, 'max_students': 50, 'enrolled_count': 18, 'schedule': '周二7-8节', 'location': '法学楼201', 'course_type': 'general'},
            {'course_code': 'MUS101', 'course_name': '音乐欣赏', 'teacher': '赵老师', 'credits': 2, 'hours': 32, 'max_students': 40, 'enrolled_count': 40, 'schedule': '周五5-6节', 'location': '艺术楼203', 'course_type': 'general'},
            {'course_code': 'PHO101', 'course_name': '摄影基础', 'teacher': '孙摄影师', 'credits': 2, 'hours': 32, 'max_students': 30, 'enrolled_count': 30, 'schedule': '周三7-8节', 'location': '传媒楼102', 'course_type': 'elective'},
            {'course_code': 'SP101', 'course_name': '演讲与口才', 'teacher': '李老师', 'credits': 2, 'hours': 32, 'max_students': 35, 'enrolled_count': 22, 'schedule': '周四7-8节', 'location': '教学楼204', 'course_type': 'elective'},
            {'course_code': 'DS101', 'course_name': '数据分析', 'teacher': '刘教授', 'credits': 3, 'hours': 48, 'max_students': 45, 'enrolled_count': 38, 'schedule': '周一9-10节', 'location': '信息楼103', 'course_type': 'elective'},
            {'course_code': 'BD101', 'course_name': '大数据技术', 'teacher': '周教授', 'credits': 3, 'hours': 48, 'max_students': 40, 'enrolled_count': 35, 'schedule': '周二9-10节', 'location': '信息楼203', 'course_type': 'elective'},
            {'course_code': 'CLOUD101', 'course_name': '云计算基础', 'teacher': '郑老师', 'credits': 3, 'hours': 48, 'max_students': 40, 'enrolled_count': 28, 'schedule': '周三9-10节', 'location': '信息楼303', 'course_type': 'elective'},
            {'course_code': 'SEC101', 'course_name': '网络安全', 'teacher': '赵教授', 'credits': 3, 'hours': 48, 'max_students': 40, 'enrolled_count': 25, 'schedule': '周四9-10节', 'location': '信息楼403', 'course_type': 'elective'},
            {'course_code': 'GAME101', 'course_name': '游戏设计', 'teacher': '吴老师', 'credits': 2, 'hours': 32, 'max_students': 35, 'enrolled_count': 35, 'schedule': '周五9-10节', 'location': '信息楼104', 'course_type': 'elective'},
            {'course_code': 'FIN101', 'course_name': '理财规划', 'teacher': '陈经理', 'credits': 2, 'hours': 32, 'max_students': 50, 'enrolled_count': 15, 'schedule': '周一11-12节', 'location': '经管楼201', 'course_type': 'general'},
        ]

        now = datetime.now().isoformat()
        for course in default_courses:
            course['description'] = f"{course['course_name']}是一门{'必修' if course['course_type'] == 'required' else '选修' if course['course_type'] == 'elective' else '通识'}课程，由{course['teacher']}授课。"
            course['syllabus'] = '课程大纲：第1章 绪论，第2章 基础知识，第3章 核心内容，第4章 实践应用，第5章 总结与展望'
            course['assessment'] = '考核方式：平时成绩30% + 期中考试30% + 期末考试40%'
            course['textbook'] = '推荐教材：相关专业教材及参考资料'
            course['semester'] = '2025-2026学年第二学期'
            course['status'] = 'full' if course['enrolled_count'] >= course['max_students'] else 'open'
            course['created_at'] = now
            course['updated_at'] = now

        model.exec.insert_many(default_courses)
        print(f"  - Inserted {len(default_courses)} default courses")

    def create(self, course_code: str, course_name: str, teacher: str, credits: int,
               hours: int, max_students: int, schedule: str, location: str,
               course_type: str = TYPE_ELECTIVE, description: str = '',
               syllabus: str = '', assessment: str = '', textbook: str = '',
               prerequisites: str = '', semester: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'course_code': course_code,
            'course_name': course_name,
            'teacher': teacher,
            'credits': credits,
            'hours': hours,
            'max_students': max_students,
            'enrolled_count': 0,
            'schedule': schedule,
            'location': location,
            'course_type': course_type,
            'description': description,
            'syllabus': syllabus,
            'assessment': assessment,
            'textbook': textbook,
            'prerequisites': prerequisites,
            'semester': semester,
            'status': 'open',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_course_code(self, course_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'course_code': course_code})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'course_name', 'teacher', 'credits', 'hours', 'max_students',
            'schedule', 'location', 'course_type', 'description', 'syllabus',
            'assessment', 'textbook', 'prerequisites', 'semester', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_enrolled_count(self, course_id: int, delta: int) -> int:
        course = self.get_by_id(course_id)
        if not course:
            return 0

        new_count = max(0, course.get('enrolled_count', 0) + delta)
        status = 'full' if new_count >= course.get('max_students', 0) else 'open'

        now = datetime.now().isoformat()
        data = {
            'enrolled_count': new_count,
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(course_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, course_type: str = None,
                teacher: str = None, status: str = None, keyword: str = None,
                schedule: str = None, credits: int = None) -> Dict[str, Any]:
        conditions = {}
        if course_type:
            conditions['course_type'] = course_type
        if teacher:
            conditions['teacher'] = teacher
        if status:
            conditions['status'] = status
        if credits is not None:
            conditions['credits'] = credits

        if keyword or schedule:
            return self.search(keyword or '', page, page_size, course_type, teacher, status, schedule, credits)

        return self.query.paginate(page, page_size, conditions, order_by='course_code ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               course_type: str = None, teacher: str = None, status: str = None,
               schedule: str = None, credits: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if course_type:
            where_clauses.append("course_type = ?")
            params.append(course_type)

        if teacher:
            where_clauses.append("teacher = ?")
            params.append(teacher)

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        if credits is not None:
            where_clauses.append("credits = ?")
            params.append(credits)

        if schedule:
            where_clauses.append("schedule LIKE ?")
            params.append(f"%{schedule}%")

        if keyword:
            where_clauses.append("(course_code LIKE ? OR course_name LIKE ? OR teacher LIKE ? OR location LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY course_code ASC 
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

    def get_all_courses(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='course_code ASC')

    def get_type_text(self, course_type: str) -> str:
        type_map = {
            self.TYPE_REQUIRED: '必修',
            self.TYPE_ELECTIVE: '选修',
            self.TYPE_GENERAL: '通识'
        }
        return type_map.get(course_type, '未知')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_OPEN: '可选',
            self.STATUS_CLOSED: '关闭',
            self.STATUS_FULL: '已满'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, course: Dict[str, Any], user_enrolled: bool = False) -> Dict[str, Any]:
        enrolled_count = course.get('enrolled_count', 0)
        max_students = course.get('max_students', 0)
        available = max_students - enrolled_count

        return {
            'id': course.get('id'),
            'course_code': course.get('course_code'),
            'course_name': course.get('course_name'),
            'teacher': course.get('teacher'),
            'credits': course.get('credits'),
            'hours': course.get('hours'),
            'max_students': max_students,
            'enrolled_count': enrolled_count,
            'available': available,
            'schedule': course.get('schedule'),
            'location': course.get('location'),
            'course_type': course.get('course_type'),
            'course_type_text': self.get_type_text(course.get('course_type')),
            'description': course.get('description'),
            'syllabus': course.get('syllabus'),
            'assessment': course.get('assessment'),
            'textbook': course.get('textbook'),
            'prerequisites': course.get('prerequisites'),
            'semester': course.get('semester'),
            'status': course.get('status'),
            'status_text': self.get_status_text(course.get('status')),
            'user_enrolled': user_enrolled,
            'created_at': course.get('created_at')
        }

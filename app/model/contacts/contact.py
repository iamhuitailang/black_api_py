from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StudentModel:
    TABLE_NAME = 'students'

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
                class_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_class_name ON {cls.TABLE_NAME}(class_name)"
        db.execute(index_sql2)

    def create(self, name: str, class_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'class_name': class_name,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name_and_class(self, name: str, class_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name, 'class_name': class_name})

    def search(self, keyword: str = None, class_name: str = None,
               page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        where_clauses = []
        params = []
        if keyword:
            where_clauses.append("name LIKE ?")
            params.append(f"%{keyword}%")
        if class_name:
            where_clauses.append("class_name = ?")
            params.append(class_name)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}{where_sql}"
        total_result = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total = total_result['total'] if total_result else 0

        offset = (page - 1) * page_size
        list_sql = f"""
            SELECT s.*,
                (SELECT COUNT(*) FROM contacts c WHERE c.student_id = s.id) as contact_count
            FROM {self.TABLE_NAME} s
            {where_sql}
            ORDER BY s.class_name, s.name
            LIMIT ? OFFSET ?
        """
        list_params = params + [page_size, offset]
        items = self.db.fetch_all(list_sql, tuple(list_params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_all_classes(self) -> List[str]:
        sql = f"SELECT DISTINCT class_name FROM {self.TABLE_NAME} ORDER BY class_name"
        rows = self.db.fetch_all(sql)
        return [row['class_name'] for row in rows]

    def update(self, record_id: int, name: str = None, class_name: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if name is not None:
            data['name'] = name
        if class_name is not None:
            data['class_name'] = class_name
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)


class ContactModel:
    TABLE_NAME = 'contacts'

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
                student_id INTEGER NOT NULL,
                parent_name TEXT NOT NULL,
                relation TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT,
                is_emergency INTEGER DEFAULT 0,
                note TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student_id ON {cls.TABLE_NAME}(student_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql2)

    def create(self, student_id: int, parent_name: str, relation: str,
               phone: str, address: str = None, is_emergency: int = 0,
               note: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'student_id': student_id,
            'parent_name': parent_name,
            'relation': relation,
            'phone': phone,
            'address': address,
            'is_emergency': is_emergency,
            'note': note,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_student_id(self, student_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'student_id': student_id}, order_by='is_emergency DESC, id ASC')

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def get_by_phone_with_student(self, phone: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT c.*, s.name as student_name, s.class_name
            FROM {self.TABLE_NAME} c
            LEFT JOIN students s ON c.student_id = s.id
            WHERE c.phone = ?
            LIMIT 1
        """
        return self.db.fetch_one(sql, (phone,))

    def get_all_with_student(self, keyword: str = None, class_name: str = None) -> List[Dict[str, Any]]:
        where_clauses = []
        params = []
        if keyword:
            where_clauses.append("(s.name LIKE ? OR c.parent_name LIKE ? OR c.phone LIKE ?)")
            params.extend([f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"])
        if class_name:
            where_clauses.append("s.class_name = ?")
            params.append(class_name)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        sql = f"""
            SELECT c.*, s.name as student_name, s.class_name
            FROM {self.TABLE_NAME} c
            LEFT JOIN students s ON c.student_id = s.id
            {where_sql}
            ORDER BY s.class_name, s.name, c.is_emergency DESC
        """
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        allowed_fields = ['parent_name', 'relation', 'phone', 'address',
                          'is_emergency', 'note', 'student_id']
        for key, value in kwargs.items():
            if key in allowed_fields:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def update_by_phone(self, phone: str, **kwargs) -> int:
        contact = self.get_by_phone(phone)
        if not contact:
            return 0
        return self.update(contact['id'], **kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

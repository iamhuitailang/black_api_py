from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrganizerModel:
    TABLE_NAME = 'tb_campus_organizer'

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
                department TEXT,
                contact_person TEXT,
                contact_phone TEXT,
                banned_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        cls._seed_initial_data()

    @classmethod
    def _seed_initial_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        now = datetime.now().isoformat()
        organizers = [
            {'name': '学生会', 'department': '计算机学院', 'contact_person': '张同学', 'contact_phone': '13800138000'},
            {'name': '研究生会', 'department': '研究生院', 'contact_person': '李同学', 'contact_phone': '13800138001'},
            {'name': '社团联合会', 'department': '校团委', 'contact_person': '王同学', 'contact_phone': '13800138002'},
            {'name': '青年志愿者协会', 'department': '校团委', 'contact_person': '赵同学', 'contact_phone': '13800138003'}
        ]
        for o in organizers:
            o['created_at'] = now
            o['updated_at'] = now
        model.exec.insert_many(organizers)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def is_banned(self, organizer_id: int) -> bool:
        org = self.get_by_id(organizer_id)
        if not org or not org.get('banned_until'):
            return False
        try:
            banned_until = datetime.fromisoformat(org['banned_until'])
            return datetime.now() < banned_until
        except Exception:
            return False

    def ban_days(self, organizer_id: int, days: int = 7) -> int:
        until = (datetime.now() + timedelta(days=days)).isoformat()
        return self.exec.update_by_id(organizer_id, {
            'banned_until': until,
            'updated_at': datetime.now().isoformat()
        })

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GuestModel:
    TABLE_NAME = 'guests'

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
                group_tag TEXT DEFAULT '亲友',
                rsvp_status TEXT DEFAULT '待回复',
                meal_preference TEXT DEFAULT '',
                rsvp_updated_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_group_tag ON {cls.TABLE_NAME}(group_tag)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rsvp_status ON {cls.TABLE_NAME}(rsvp_status)"
        db.execute(index_sql2)

        sample_data = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if sample_data and sample_data['total'] == 0:
            now = datetime.now().isoformat()
            samples = [
                ('张伟', '亲友', '已确认', '清真', now),
                ('李娜', '亲友', '待回复', '', None),
                ('王强', '同事', '已拒绝', '', now),
                ('刘芳', '长辈', '已确认', '素食', now),
                ('陈明', '同事', '待回复', '', None),
            ]
            for name, group, status, meal, rsvp_at in samples:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (name, group_tag, rsvp_status, meal_preference, rsvp_updated_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (name, group, status, meal, rsvp_at, now, now)
                )

    def create(self, name: str, group_tag: str = '亲友', rsvp_status: str = '待回复',
               meal_preference: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'group_tag': group_tag,
            'rsvp_status': rsvp_status,
            'meal_preference': meal_preference,
            'rsvp_updated_at': now if rsvp_status != '待回复' else None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, group_tag: str = None, rsvp_status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if group_tag:
            conditions['group_tag'] = group_tag
        if rsvp_status:
            conditions['rsvp_status'] = rsvp_status
        return self.query.find_all(conditions=conditions if conditions else None, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def update_rsvp(self, record_id: int, rsvp_status: str, meal_preference: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'rsvp_status': rsvp_status,
            'rsvp_updated_at': now,
            'updated_at': now
        }
        if meal_preference is not None:
            data['meal_preference'] = meal_preference
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_status(self) -> Dict[str, int]:
        results = self.db.fetch_all(
            f"SELECT rsvp_status, COUNT(*) as cnt FROM {self.TABLE_NAME} GROUP BY rsvp_status"
        )
        counts = {'待回复': 0, '已确认': 0, '已拒绝': 0}
        for r in results:
            counts[r['rsvp_status']] = r['cnt']
        return counts

    def count_by_group(self) -> Dict[str, int]:
        results = self.db.fetch_all(
            f"SELECT group_tag, COUNT(*) as cnt FROM {self.TABLE_NAME} GROUP BY group_tag"
        )
        return {r['group_tag']: r['cnt'] for r in results}

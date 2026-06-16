from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VendorModel:
    TABLE_NAME = 'vendors'

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
                service TEXT NOT NULL,
                contact TEXT DEFAULT '',
                contract_deadline DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_contract_deadline ON {cls.TABLE_NAME}(contract_deadline)"
        db.execute(index_sql)

        sample_data = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if sample_data and sample_data['total'] == 0:
            now = datetime.now().isoformat()
            today = datetime.now()
            samples = [
                ('花语花艺工作室', '花艺师', '张经理 13800138001', (today + timedelta(days=2)).strftime('%Y-%m-%d')),
                ('金牌司仪阿杰', '司仪', '王主持 13900139002', (today + timedelta(days=15)).strftime('%Y-%m-%d')),
                ('美妆工作室Lily', '化妆师', 'Lily 13700137003', (today + timedelta(days=5)).strftime('%Y-%m-%d')),
                ('光影影像工作室', '摄影团队', '李摄影 13600136004', (today + timedelta(days=30)).strftime('%Y-%m-%d')),
                ('悦动音乐DJ', '音乐DJ', 'DJ Tony 13500135005', (today + timedelta(days=1)).strftime('%Y-%m-%d')),
            ]
            for name, service, contact, deadline in samples:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (name, service, contact, contract_deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (name, service, contact, deadline, now, now)
                )

    def create(self, name: str, service: str, contact: str = '',
               contract_deadline: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'service': service,
            'contact': contact,
            'contract_deadline': contract_deadline,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='contract_deadline ASC')

    def get_upcoming_deadlines(self, days: int = 3) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        deadline = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE contract_deadline IS NOT NULL
              AND contract_deadline >= ?
              AND contract_deadline <= ?
            ORDER BY contract_deadline ASC
        """
        results = self.db.fetch_all(sql, (today, deadline))
        for r in results:
            if r['contract_deadline']:
                d = datetime.strptime(r['contract_deadline'], '%Y-%m-%d').date()
                days_left = (d - datetime.now().date()).days
                r['days_left'] = days_left
                r['is_urgent'] = days_left <= 0
        return results

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

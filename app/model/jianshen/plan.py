from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class JianshenPlanModel:
    TABLE_NAME = 'tb_jianshen_plans'

    TYPE_CUSTOM = 0
    TYPE_OFFICIAL = 1

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
                description TEXT DEFAULT '',
                type INTEGER DEFAULT 0,
                schedule TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                difficulty TEXT DEFAULT 'beginner',
                created_by INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)")

    @classmethod
    def init_default_plans(cls):
        model = cls()
        existing = model.query.count({})
        if existing > 0:
            return
        default_plans = [
            {
                'name': '新手入门计划',
                'description': '适合刚开始健身的新手，以基础动作为主',
                'type': cls.TYPE_OFFICIAL,
                'schedule': json.dumps([
                    {'day': 1, 'items': ['胸部', '三头肌']},
                    {'day': 2, 'items': ['背部', '二头肌']},
                    {'day': 3, 'items': ['腿部']},
                    {'day': 4, 'items': ['有氧']},
                    {'day': 5, 'items': ['核心']},
                    {'day': 6, 'items': ['休息']},
                    {'day': 7, 'items': ['休息']}
                ], ensure_ascii=False),
                'cover': '',
                'difficulty': 'beginner',
                'created_by': 0,
                'status': 1
            },
            {
                'name': '增肌塑形计划',
                'description': '针对有一定基础的健身爱好者，侧重肌肉增长',
                'type': cls.TYPE_OFFICIAL,
                'schedule': json.dumps([
                    {'day': 1, 'items': ['胸部', '三头肌']},
                    {'day': 2, 'items': ['背部', '二头肌']},
                    {'day': 3, 'items': ['腿部']},
                    {'day': 4, 'items': ['肩部']},
                    {'day': 5, 'items': ['手臂', '核心']},
                    {'day': 6, 'items': ['有氧']},
                    {'day': 7, 'items': ['休息']}
                ], ensure_ascii=False),
                'cover': '',
                'difficulty': 'intermediate',
                'created_by': 0,
                'status': 1
            },
            {
                'name': '减脂塑形计划',
                'description': '结合力量+有氧，快速减脂塑形',
                'type': cls.TYPE_OFFICIAL,
                'schedule': json.dumps([
                    {'day': 1, 'items': ['胸部', '有氧']},
                    {'day': 2, 'items': ['背部', '核心']},
                    {'day': 3, 'items': ['腿部', '有氧']},
                    {'day': 4, 'items': ['肩部', '有氧']},
                    {'day': 5, 'items': ['手臂', '核心']},
                    {'day': 6, 'items': ['有氧']},
                    {'day': 7, 'items': ['休息']}
                ], ensure_ascii=False),
                'cover': '',
                'difficulty': 'intermediate',
                'created_by': 0,
                'status': 1
            }
        ]
        now = datetime.now().isoformat()
        for plan in default_plans:
            plan['created_at'] = now
            plan['updated_at'] = now
            model.exec.insert(plan)

    def create(self, name: str, description: str = '', plan_type: int = 0,
               schedule: str = '', cover: str = '',
               difficulty: str = 'beginner', created_by: int = 0) -> int:
        now = datetime.now().isoformat()
        return self.exec.insert({
            'name': name,
            'description': description,
            'type': plan_type,
            'schedule': schedule,
            'cover': cover,
            'difficulty': difficulty,
            'created_by': created_by,
            'status': 1,
            'created_at': now,
            'updated_at': now
        })

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items()
                      if k in ['name', 'description', 'schedule', 'cover', 'difficulty', 'status']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0, 'updated_at': datetime.now().isoformat()})

    def get_all(self, page: int = 1, page_size: int = 20, plan_type: int = None,
                keyword: str = None) -> Dict[str, Any]:
        if keyword:
            return self.search(keyword, page, page_size, plan_type)
        conditions = {'status': 1}
        if plan_type is not None:
            conditions['type'] = plan_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 20, plan_type: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["status = 1"]
        params = []
        if plan_type is not None:
            where_clauses.append("type = ?")
            params.append(plan_type)
        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like = f"%{keyword}%"
        params.extend([like, like])
        total_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total = self.db.fetch_one(total_sql, tuple(params))['total']
        select_sql = f"SELECT * FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)} ORDER BY id DESC LIMIT {page_size} OFFSET {offset}"
        items = self.db.fetch_all(select_sql, tuple(params))
        return {'items': items, 'total': total, 'page': page, 'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size}

    def get_official(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': self.TYPE_OFFICIAL, 'status': 1}, order_by='id ASC', limit=limit)

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'created_by': user_id, 'status': 1}, order_by='id DESC')

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        schedule = record.get('schedule', '')
        try:
            schedule_parsed = json.loads(schedule) if schedule else []
        except (json.JSONDecodeError, TypeError):
            schedule_parsed = schedule
        return {
            'id': record.get('id'),
            'name': record.get('name'),
            'description': record.get('description'),
            'type': record.get('type'),
            'schedule': schedule_parsed,
            'cover': record.get('cover', ''),
            'difficulty': record.get('difficulty'),
            'created_by': record.get('created_by'),
            'status': record.get('status'),
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at')
        }

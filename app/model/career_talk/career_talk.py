from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CareerTalkModel:
    TABLE_NAME = 'tb_career_talk'
    
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
                company_name TEXT NOT NULL,
                talk_time TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT DEFAULT '',
                short_code TEXT UNIQUE,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_talk_time ON {cls.TABLE_NAME}(talk_time)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_short_code ON {cls.TABLE_NAME}(short_code)"
        db.execute(index_sql2)

    def create(self, company_name: str, talk_time: str, location: str, 
               description: str = '', short_code: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'company_name': company_name,
            'talk_time': talk_time,
            'location': location,
            'description': description,
            'short_code': short_code,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_short_code(self, short_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'short_code': short_code})

    def get_all(self, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions=conditions, order_by='talk_time DESC, id DESC')

    def paginate(self, page: int = 1, page_size: int = 10, status: int = None, 
                 keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        
        if keyword:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME} 
                WHERE company_name LIKE ? 
                { 'AND status = ?' if status is not None else '' }
                ORDER BY talk_time DESC, id DESC
                LIMIT ? OFFSET ?
            """
            params = [f'%{keyword}%']
            if status is not None:
                params.append(status)
            params.extend([page_size, (page - 1) * page_size])
            items = self.db.fetch_all(sql, tuple(params))
            
            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME} 
                WHERE company_name LIKE ? 
                { 'AND status = ?' if status is not None else '' }
            """
            count_params = [f'%{keyword}%']
            if status is not None:
                count_params.append(status)
            total_result = self.db.fetch_one(count_sql, tuple(count_params))
            total = total_result['total'] if total_result else 0
            
            return {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        
        return self.query.paginate(page, page_size, conditions, order_by='talk_time DESC, id DESC')

    def update(self, record_id: int, company_name: str = None, talk_time: str = None, 
               location: str = None, description: str = None, short_code: str = None,
               status: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if company_name is not None:
            data['company_name'] = company_name
        if talk_time is not None:
            data['talk_time'] = talk_time
        if location is not None:
            data['location'] = location
        if description is not None:
            data['description'] = description
        if short_code is not None:
            data['short_code'] = short_code
        if status is not None:
            data['status'] = status
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: int = None) -> int:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)

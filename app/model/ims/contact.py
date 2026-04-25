from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ContactType(Enum):
    SUPPLIER = 'supplier'
    CUSTOMER = 'customer'


class ContactModel:
    TABLE_NAME = 'tb_ims_contact'

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
                phone TEXT DEFAULT '',
                wechat TEXT DEFAULT '',
                address TEXT DEFAULT '',
                type TEXT NOT NULL DEFAULT 'customer',
                company TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

        index_phone = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_phone)

    def create(self, name: str, phone: str = '', wechat: str = '', address: str = '',
               type: str = 'customer', company: str = '', remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'phone': phone,
            'wechat': wechat,
            'address': address,
            'type': type,
            'company': company,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, type: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if type:
            conditions['type'] = type
        return self.query.find_all(conditions=conditions, order_by='id DESC')

    def get_by_type(self, type: str) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'type': type}, order_by='id DESC')

    def update(self, record_id: int, name: str = None, phone: str = None, wechat: str = None,
               address: str = None, type: str = None, company: str = None, remark: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if name is not None:
            data['name'] = name
        if phone is not None:
            data['phone'] = phone
        if wechat is not None:
            data['wechat'] = wechat
        if address is not None:
            data['address'] = address
        if type is not None:
            data['type'] = type
        if company is not None:
            data['company'] = company
        if remark is not None:
            data['remark'] = remark

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, type: str = None) -> int:
        conditions = {}
        if type:
            conditions['type'] = type
        return self.query.count(conditions)

    def paginate(self, page: int = 1, page_size: int = 10, type: str = None,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type

        if keyword:
            sql = f"SELECT * FROM {self.TABLE_NAME} WHERE 1=1"
            params = []
            if type:
                sql += " AND type = ?"
                params.append(type)
            sql += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)"
            keyword_param = f"%{keyword}%"
            params.extend([keyword_param, keyword_param, keyword_param])
            sql += " ORDER BY id DESC"
            sql += f" LIMIT {page_size} OFFSET {(page - 1) * page_size}"

            count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE 1=1"
            count_params = []
            if type:
                count_sql += " AND type = ?"
                count_params.append(type)
            count_sql += " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)"
            count_params.extend([keyword_param, keyword_param, keyword_param])

            total = self.db.fetch_one(count_sql, tuple(count_params))
            total_count = total['total'] if total else 0
            items = self.db.fetch_all(sql, tuple(params))

            return {
                'items': items,
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

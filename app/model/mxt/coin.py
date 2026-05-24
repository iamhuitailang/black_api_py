from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CoinModel:
    TABLE_NAME = 'tb_mxt_coin'
    
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
                user_key TEXT NOT NULL UNIQUE,
                balance INTEGER DEFAULT 0,
                last_login_date TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_key ON {cls.TABLE_NAME}(user_key)"
        db.execute(index_sql)

    def create(self, user_key: str, balance: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_key': user_key,
            'balance': balance,
            'last_login_date': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_key(self, user_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_key': user_key})

    def get_or_create(self, user_key: str) -> Dict[str, Any]:
        existing = self.get_by_user_key(user_key)
        if existing:
            return existing
        self.create(user_key, 0)
        return self.get_by_user_key(user_key)

    def update_balance(self, record_id: int, balance: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'balance': balance, 'updated_at': now})

    def update_last_login(self, record_id: int, login_date: str) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'last_login_date': login_date, 'updated_at': now})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='balance DESC')

    def count(self) -> int:
        return self.query.count()


class CoinLogModel:
    TABLE_NAME = 'tb_mxt_coin_log'
    
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
                user_key TEXT NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                description TEXT DEFAULT '',
                balance_after INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_key ON {cls.TABLE_NAME}(user_key)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql2)

    def create(self, user_key: str, amount: int, log_type: str,
               description: str = '', balance_after: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_key': user_key,
            'amount': amount,
            'type': log_type,
            'description': description,
            'balance_after': balance_after,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user_key(self, user_key: str) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'user_key': user_key}, order_by='created_at DESC')

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC')

    def count(self) -> int:
        return self.query.count()

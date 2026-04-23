from typing import Dict, Any, List, Optional
from .db import get_db


class ORMExec:
    def __init__(self, table_name: str, primary_key: str = 'id'):
        self.table_name = table_name
        self.primary_key = primary_key
        self.db = get_db()

    def insert(self, data: Dict[str, Any]) -> int:
        if not data:
            raise ValueError("Data cannot be empty")
        
        fields = list(data.keys())
        placeholders = ['?' for _ in fields]
        values = list(data.values())
        
        sql = f"INSERT INTO {self.table_name} ({', '.join(fields)}) VALUES ({', '.join(placeholders)})"
        cursor = self.db.execute(sql, tuple(values))
        return cursor.lastrowid

    def insert_many(self, data_list: List[Dict[str, Any]]) -> int:
        if not data_list:
            return 0
        
        fields = list(data_list[0].keys())
        placeholders = ['?' for _ in fields]
        sql = f"INSERT INTO {self.table_name} ({', '.join(fields)}) VALUES ({', '.join(placeholders)})"
        
        values_list = [tuple(item.values()) for item in data_list]
        cursor = self.db.execute_many(sql, values_list)
        return cursor.rowcount

    def update(self, data: Dict[str, Any], conditions: Dict[str, Any] = None, 
               record_id: int = None) -> int:
        if not data:
            raise ValueError("Data cannot be empty")
        
        if record_id is not None:
            conditions = {self.primary_key: record_id}
        
        if not conditions:
            raise ValueError("Conditions or record_id must be provided for update")
        
        set_clauses = [f"{key} = ?" for key in data.keys()]
        set_values = list(data.values())
        
        where_clauses = []
        where_values = []
        for key, value in conditions.items():
            if value is None:
                where_clauses.append(f"{key} IS NULL")
            else:
                where_clauses.append(f"{key} = ?")
                where_values.append(value)
        
        sql = f"UPDATE {self.table_name} SET {', '.join(set_clauses)} WHERE {' AND '.join(where_clauses)}"
        cursor = self.db.execute(sql, tuple(set_values + where_values))
        return cursor.rowcount

    def update_by_id(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.update(data, record_id=record_id)

    def delete(self, conditions: Dict[str, Any] = None, record_id: int = None) -> int:
        if record_id is not None:
            conditions = {self.primary_key: record_id}
        
        if not conditions:
            raise ValueError("Conditions or record_id must be provided for delete")
        
        where_clauses = []
        where_values = []
        for key, value in conditions.items():
            if value is None:
                where_clauses.append(f"{key} IS NULL")
            else:
                where_clauses.append(f"{key} = ?")
                where_values.append(value)
        
        sql = f"DELETE FROM {self.table_name} WHERE {' AND '.join(where_clauses)}"
        cursor = self.db.execute(sql, tuple(where_values) if where_values else None)
        return cursor.rowcount

    def delete_by_id(self, record_id: int) -> int:
        return self.delete(record_id=record_id)

    def upsert(self, data: Dict[str, Any], conflict_fields: List[str]) -> int:
        if not data:
            raise ValueError("Data cannot be empty")
        
        fields = list(data.keys())
        placeholders = ['?' for _ in fields]
        values = list(data.values())
        
        set_clauses = [f"{key} = excluded.{key}" for key in data.keys()]
        
        sql = f"""
            INSERT INTO {self.table_name} ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)})
            ON CONFLICT ({', '.join(conflict_fields)}) 
            DO UPDATE SET {', '.join(set_clauses)}
        """
        cursor = self.db.execute(sql, tuple(values))
        return cursor.lastrowid

    def execute_raw(self, sql: str, params: tuple = None) -> int:
        cursor = self.db.execute(sql, params)
        return cursor.rowcount

    def transaction(self):
        return _TransactionContext(self.db)


class _TransactionContext:
    def __init__(self, db):
        self.db = db

    def __enter__(self):
        self.db.execute("BEGIN TRANSACTION")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.db.execute("COMMIT")
        else:
            self.db.execute("ROLLBACK")
        return False

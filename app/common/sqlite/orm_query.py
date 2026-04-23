from typing import List, Dict, Any, Optional, Tuple
from .db import get_db


class ORMQuery:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.db = get_db()

    def find_by_id(self, record_id: int, primary_key: str = 'id') -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.table_name} WHERE {primary_key} = ?"
        return self.db.fetch_one(sql, (record_id,))

    def find_one(self, conditions: Dict[str, Any] = None, fields: List[str] = None,
                  order_by: str = None) -> Optional[Dict[str, Any]]:
        select_fields = ', '.join(fields) if fields else '*'
        sql = f"SELECT {select_fields} FROM {self.table_name}"
        
        params = []
        if conditions:
            where_clauses = []
            for key, value in conditions.items():
                if value is None:
                    where_clauses.append(f"{key} IS NULL")
                else:
                    where_clauses.append(f"{key} = ?")
                    params.append(value)
            sql += " WHERE " + " AND ".join(where_clauses)
        
        if order_by:
            sql += f" ORDER BY {order_by}"
        
        sql += " LIMIT 1"
        return self.db.fetch_one(sql, tuple(params) if params else None)

    def find_all(self, conditions: Dict[str, Any] = None, fields: List[str] = None, 
                  order_by: str = None, limit: int = None, offset: int = None) -> List[Dict[str, Any]]:
        select_fields = ', '.join(fields) if fields else '*'
        sql = f"SELECT {select_fields} FROM {self.table_name}"
        
        params = []
        if conditions:
            where_clauses = []
            for key, value in conditions.items():
                if value is None:
                    where_clauses.append(f"{key} IS NULL")
                else:
                    where_clauses.append(f"{key} = ?")
                    params.append(value)
            sql += " WHERE " + " AND ".join(where_clauses)
        
        if order_by:
            sql += f" ORDER BY {order_by}"
        
        if limit:
            sql += f" LIMIT {limit}"
            if offset:
                sql += f" OFFSET {offset}"
        
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.table_name}"
        
        params = []
        if conditions:
            where_clauses = []
            for key, value in conditions.items():
                if value is None:
                    where_clauses.append(f"{key} IS NULL")
                else:
                    where_clauses.append(f"{key} = ?")
                    params.append(value)
            sql += " WHERE " + " AND ".join(where_clauses)
        
        result = self.db.fetch_one(sql, tuple(params) if params else None)
        return result['total'] if result else 0

    def exists(self, conditions: Dict[str, Any]) -> bool:
        return self.count(conditions) > 0

    def find_by_field(self, field: str, value: Any, fields: List[str] = None) -> Optional[Dict[str, Any]]:
        return self.find_one({field: value}, fields)

    def find_all_by_field(self, field: str, value: Any, fields: List[str] = None,
                          order_by: str = None) -> List[Dict[str, Any]]:
        return self.find_all({field: value}, fields, order_by)

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None,
                 fields: List[str] = None, order_by: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        total = self.count(conditions)
        items = self.find_all(conditions, fields, order_by, page_size, offset)
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def query_raw(self, sql: str, params: tuple = None) -> List[Dict[str, Any]]:
        return self.db.fetch_all(sql, params)

    def query_one_raw(self, sql: str, params: tuple = None) -> Optional[Dict[str, Any]]:
        return self.db.fetch_one(sql, params)

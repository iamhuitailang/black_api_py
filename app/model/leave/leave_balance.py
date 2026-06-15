from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaveBalanceModel:
    TABLE_NAME = 'leave_balances'

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
                employee_id INTEGER NOT NULL,
                year INTEGER NOT NULL,
                annual_remaining INTEGER DEFAULT 0,
                compensation_remaining INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, year)
            )
        """
        db.execute(sql)

    def create(self, employee_id: int, year: int, annual_remaining: int = 0,
               compensation_remaining: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'employee_id': employee_id,
            'year': year,
            'annual_remaining': annual_remaining,
            'compensation_remaining': compensation_remaining,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def upsert(self, employee_id: int, year: int, annual_remaining: int = None,
               compensation_remaining: int = None) -> int:
        existing = self.get_by_employee_year(employee_id, year)
        now = datetime.now().isoformat()
        if existing:
            data = {'updated_at': now}
            if annual_remaining is not None:
                data['annual_remaining'] = annual_remaining
            if compensation_remaining is not None:
                data['compensation_remaining'] = compensation_remaining
            return self.exec.update_by_id(existing['id'], data)
        else:
            data = {
                'employee_id': employee_id,
                'year': year,
                'annual_remaining': annual_remaining if annual_remaining is not None else 0,
                'compensation_remaining': compensation_remaining if compensation_remaining is not None else 0,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_employee_year(self, employee_id: int, year: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'employee_id': employee_id, 'year': year})

    def get_by_employee(self, employee_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('employee_id', employee_id, order_by='year DESC')

    def get_all_by_year(self, year: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT lb.*, e.name as employee_name, e.department
            FROM {self.TABLE_NAME} lb
            JOIN employees e ON lb.employee_id = e.id
            WHERE lb.year = ?
            ORDER BY e.department, e.name
        """
        return self.db.fetch_all(sql, (year,))

    def update_annual(self, record_id: int, annual_remaining: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'annual_remaining': annual_remaining,
            'updated_at': now
        })

    def update_compensation(self, record_id: int, compensation_remaining: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {
            'compensation_remaining': compensation_remaining,
            'updated_at': now
        })

    def deduct_annual(self, employee_id: int, year: int, days: int) -> bool:
        balance = self.get_by_employee_year(employee_id, year)
        if not balance:
            return False
        if balance['annual_remaining'] < days:
            return False
        self.update_annual(balance['id'], balance['annual_remaining'] - days)
        return True

    def deduct_compensation(self, employee_id: int, year: int, days: int) -> bool:
        balance = self.get_by_employee_year(employee_id, year)
        if not balance:
            return False
        if balance['compensation_remaining'] < days:
            return False
        self.update_compensation(balance['id'], balance['compensation_remaining'] - days)
        return True

    def refund_annual(self, employee_id: int, year: int, days: int):
        balance = self.get_by_employee_year(employee_id, year)
        if balance:
            self.update_annual(balance['id'], balance['annual_remaining'] + days)

    def refund_compensation(self, employee_id: int, year: int, days: int):
        balance = self.get_by_employee_year(employee_id, year)
        if balance:
            self.update_compensation(balance['id'], balance['compensation_remaining'] + days)

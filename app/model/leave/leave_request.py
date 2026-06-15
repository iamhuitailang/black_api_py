from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaveRequestModel:
    TABLE_NAME = 'leave_requests'

    STATUS_PENDING_MANAGER = 'pending_manager'
    STATUS_PENDING_HR = 'pending_hr'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    LEAVE_TYPES = ['annual', 'personal', 'sick', 'compensation', 'marriage', 'maternity']

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
                leave_type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                work_days INTEGER NOT NULL,
                reason TEXT,
                status TEXT NOT NULL DEFAULT 'pending_manager',
                approver_id INTEGER,
                approve_comment TEXT,
                manager_approved INTEGER DEFAULT 0,
                hr_approved INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee_id ON {cls.TABLE_NAME}(employee_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, employee_id: int, leave_type: str, start_date: str, end_date: str,
               work_days: int, reason: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'employee_id': employee_id,
            'leave_type': leave_type,
            'start_date': start_date,
            'end_date': end_date,
            'work_days': work_days,
            'reason': reason,
            'status': self.STATUS_PENDING_MANAGER,
            'manager_approved': 0,
            'hr_approved': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_employee(self, employee_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'employee_id': employee_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_pending_for_approver(self, approver_id: int, approver_role: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT lr.*, e.name as employee_name, e.department
            FROM {self.TABLE_NAME} lr
            JOIN employees e ON lr.employee_id = e.id
            WHERE (
                (lr.status = 'pending_manager' AND e.manager_id = ?)
                OR (lr.status = 'pending_hr' AND ? IN ('hr', 'admin'))
            )
            ORDER BY lr.created_at ASC
        """
        return self.db.fetch_all(sql, (approver_id, approver_role))

    def get_all_for_hr(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT lr.*, e.name as employee_name, e.department
            FROM {self.TABLE_NAME} lr
            JOIN employees e ON lr.employee_id = e.id
            ORDER BY lr.created_at DESC
        """
        return self.db.fetch_all(sql)

    def update_status(self, record_id: int, status: str, approver_id: int = None,
                      approve_comment: str = None, manager_approved: int = None,
                      hr_approved: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if approver_id is not None:
            data['approver_id'] = approver_id
        if approve_comment is not None:
            data['approve_comment'] = approve_comment
        if manager_approved is not None:
            data['manager_approved'] = manager_approved
        if hr_approved is not None:
            data['hr_approved'] = hr_approved
        return self.exec.update_by_id(record_id, data)

    def get_statistics_by_month(self, year: int, month: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT lr.*, e.name as employee_name, e.department
            FROM {self.TABLE_NAME} lr
            JOIN employees e ON lr.employee_id = e.id
            WHERE strftime('%Y', lr.start_date) = ? AND strftime('%m', lr.start_date) = ?
                AND lr.status IN ('approved', 'pending_hr', 'pending_manager')
            ORDER BY lr.start_date ASC
        """
        return self.db.fetch_all(sql, (str(year), f"{month:02d}"))

    def get_statistics_by_department(self, year: int = None) -> List[Dict[str, Any]]:
        year_filter = ""
        params = []
        if year:
            year_filter = "AND strftime('%Y', lr.start_date) = ?"
            params.append(str(year))
        sql = f"""
            SELECT e.department, lr.leave_type, SUM(lr.work_days) as total_days, COUNT(*) as total_count
            FROM {self.TABLE_NAME} lr
            JOIN employees e ON lr.employee_id = e.id
            WHERE lr.status IN ('approved', 'pending_hr', 'pending_manager')
            {year_filter}
            GROUP BY e.department, lr.leave_type
            ORDER BY e.department, lr.leave_type
        """
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def get_by_date_range(self, start_date: str, end_date: str, employee_id: int = None) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        sql = f"""
            SELECT lr.*, e.name as employee_name, e.department
            FROM {self.TABLE_NAME} lr
            JOIN employees e ON lr.employee_id = e.id
            WHERE lr.start_date <= ? AND lr.end_date >= ?
                AND lr.status IN ('approved', 'pending_hr', 'pending_manager')
        """
        params.extend([end_date, start_date])
        if employee_id:
            sql += " AND lr.employee_id = ?"
            params.append(employee_id)
        sql += " ORDER BY lr.start_date ASC"
        return self.db.fetch_all(sql, tuple(params))

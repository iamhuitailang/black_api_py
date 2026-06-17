from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AssessmentRecordModel:
    TABLE_NAME = 'tb_kpi_assessment_record'

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
                cycle_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                self_review_comment TEXT,
                self_reviewed_at TIMESTAMP,
                supervisor_comment TEXT,
                supervisor_reviewed_at TIMESTAMP,
                self_total_score REAL DEFAULT 0,
                supervisor_total_score REAL DEFAULT 0,
                final_score REAL DEFAULT 0,
                grade TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_cycle_employee ON {cls.TABLE_NAME}(cycle_id, employee_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee ON {cls.TABLE_NAME}(employee_id)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_cycle_and_employee(self, cycle_id: int, employee_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'cycle_id': cycle_id, 'employee_id': employee_id})

    def get_by_employee_id(self, employee_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, c.name as cycle_name, c.year, c.quarter
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_assessment_cycle c ON r.cycle_id = c.id
            WHERE r.employee_id = ?
            ORDER BY c.year DESC, c.quarter DESC
        """
        return self.db.fetch_all(sql, (employee_id,))

    def get_by_cycle_id(self, cycle_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, e.name as employee_name, e.department, e.position
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_employee e ON r.employee_id = e.id
            WHERE r.cycle_id = ?
            ORDER BY e.department, e.id
        """
        return self.db.fetch_all(sql, (cycle_id,))

    def get_by_supervisor_id(self, supervisor_id: int, cycle_id: Optional[int] = None) -> List[Dict[str, Any]]:
        params = [supervisor_id]
        sql = f"""
            SELECT r.*, e.name as employee_name, e.department, e.position,
                   c.name as cycle_name, c.year, c.quarter
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_employee e ON r.employee_id = e.id
            LEFT JOIN tb_kpi_assessment_cycle c ON r.cycle_id = c.id
            WHERE e.supervisor_id = ?
        """
        if cycle_id:
            sql += " AND r.cycle_id = ?"
            params.append(cycle_id)
        sql += " ORDER BY c.year DESC, c.quarter DESC, e.id"
        return self.db.fetch_all(sql, tuple(params))

    def get_by_department(self, department: str, cycle_id: Optional[int] = None) -> List[Dict[str, Any]]:
        params = [department]
        sql = f"""
            SELECT r.*, e.name as employee_name, e.department, e.position
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_employee e ON r.employee_id = e.id
            WHERE e.department = ?
        """
        if cycle_id:
            sql += " AND r.cycle_id = ?"
            params.append(cycle_id)
        sql += " ORDER BY e.id"
        return self.db.fetch_all(sql, tuple(params))

    def get_statistics_by_cycle_and_department(self, cycle_id: int, department: Optional[str] = None) -> Dict[str, Any]:
        params = [cycle_id]
        sql_grade = f"""
            SELECT r.grade, COUNT(*) as count
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_employee e ON r.employee_id = e.id
            WHERE r.cycle_id = ? AND r.status = 'completed'
        """
        if department:
            sql_grade += " AND e.department = ?"
            params.append(department)
        sql_grade += " GROUP BY r.grade"
        grade_stats = self.db.fetch_all(sql_grade, tuple(params))

        params2 = [cycle_id]
        sql_score = f"""
            SELECT r.final_score
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_kpi_employee e ON r.employee_id = e.id
            WHERE r.cycle_id = ? AND r.status = 'completed' AND r.final_score IS NOT NULL
        """
        if department:
            sql_score += " AND e.department = ?"
            params2.append(department)
        sql_score += " ORDER BY r.final_score"
        score_list = self.db.fetch_all(sql_score, tuple(params2))

        return {
            'grade_stats': grade_stats,
            'score_list': [s['final_score'] for s in score_list]
        }

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

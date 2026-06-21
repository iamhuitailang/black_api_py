from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.campus import ActivityModel, RegistrationModel, CheckinModel, ActivitySummaryModel
from app.common.sqlite.db import get_db


class StatsBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.checkin_model = CheckinModel()
        self.summary_model = ActivitySummaryModel()
        self.db = get_db()

    def by_type(self, semester: str = None) -> Dict[str, Any]:
        type_map = {
            'academic': '学术讲座',
            'culture': '文体比赛',
            'club': '社团活动',
            'volunteer': '志愿服务'
        }

        sql = f"""
            SELECT a.type, COUNT(DISTINCT a.id) as activity_count,
                   COUNT(DISTINCT r.student_id) as participant_count,
                   COALESCE(AVG(s.satisfaction_score), 0) as avg_satisfaction
            FROM {ActivityModel.TABLE_NAME} a
            LEFT JOIN {RegistrationModel.TABLE_NAME} r ON a.id = r.activity_id AND r.status = 0
            LEFT JOIN {ActivitySummaryModel.TABLE_NAME} s ON a.id = s.activity_id
            WHERE a.status IN (?, ?)
        """
        params = [ActivityModel.STATUS_APPROVED, ActivityModel.STATUS_COMPLETED]

        if semester:
            sql += " AND a.semester = ?"
            params.append(semester)

        sql += " GROUP BY a.type"
        rows = self.db.fetch_all(sql, tuple(params))

        result = []
        for row in rows:
            result.append({
                'type': row['type'],
                'type_name': type_map.get(row['type'], row['type']),
                'activity_count': row['activity_count'],
                'participant_count': row['participant_count'] or 0,
                'avg_satisfaction': round(row['avg_satisfaction'] or 0, 2)
            })

        return {'code': 0, 'message': 'success', 'data': result}

    def by_department(self, semester: str = None) -> Dict[str, Any]:
        sql = f"""
            SELECT a.organizer_department as department,
                   COUNT(DISTINCT a.id) as activity_count,
                   COUNT(DISTINCT r.student_id) as participant_count,
                   COALESCE(AVG(s.satisfaction_score), 0) as avg_satisfaction
            FROM {ActivityModel.TABLE_NAME} a
            LEFT JOIN {RegistrationModel.TABLE_NAME} r ON a.id = r.activity_id AND r.status = 0
            LEFT JOIN {ActivitySummaryModel.TABLE_NAME} s ON a.id = s.activity_id
            WHERE a.status IN (?, ?) AND a.organizer_department IS NOT NULL
        """
        params = [ActivityModel.STATUS_APPROVED, ActivityModel.STATUS_COMPLETED]

        if semester:
            sql += " AND a.semester = ?"
            params.append(semester)

        sql += " GROUP BY a.organizer_department ORDER BY activity_count DESC"
        rows = self.db.fetch_all(sql, tuple(params))

        result = []
        for row in rows:
            result.append({
                'department': row['department'] or '未知',
                'activity_count': row['activity_count'],
                'participant_count': row['participant_count'] or 0,
                'avg_satisfaction': round(row['avg_satisfaction'] or 0, 2)
            })

        return {'code': 0, 'message': 'success', 'data': result}

    def by_semester(self) -> Dict[str, Any]:
        sql = f"""
            SELECT a.semester,
                   COUNT(DISTINCT a.id) as activity_count,
                   COUNT(DISTINCT r.student_id) as participant_count,
                   COALESCE(AVG(s.satisfaction_score), 0) as avg_satisfaction
            FROM {ActivityModel.TABLE_NAME} a
            LEFT JOIN {RegistrationModel.TABLE_NAME} r ON a.id = r.activity_id AND r.status = 0
            LEFT JOIN {ActivitySummaryModel.TABLE_NAME} s ON a.id = s.activity_id
            WHERE a.status IN (?, ?) AND a.semester IS NOT NULL
            GROUP BY a.semester
            ORDER BY a.semester DESC
        """
        rows = self.db.fetch_all(
            sql, (ActivityModel.STATUS_APPROVED, ActivityModel.STATUS_COMPLETED)
        )

        result = []
        for row in rows:
            result.append({
                'semester': row['semester'],
                'activity_count': row['activity_count'],
                'participant_count': row['participant_count'] or 0,
                'avg_satisfaction': round(row['avg_satisfaction'] or 0, 2)
            })

        return {'code': 0, 'message': 'success', 'data': result}

    def overview(self, semester: str = None) -> Dict[str, Any]:
        sql = f"""
            SELECT COUNT(DISTINCT a.id) as total_activities,
                   COUNT(DISTINCT r.student_id) as total_participants,
                   COALESCE(AVG(s.satisfaction_score), 0) as avg_satisfaction
            FROM {ActivityModel.TABLE_NAME} a
            LEFT JOIN {RegistrationModel.TABLE_NAME} r ON a.id = r.activity_id AND r.status = 0
            LEFT JOIN {ActivitySummaryModel.TABLE_NAME} s ON a.id = s.activity_id
            WHERE a.status IN (?, ?)
        """
        params = [ActivityModel.STATUS_APPROVED, ActivityModel.STATUS_COMPLETED]
        if semester:
            sql += " AND a.semester = ?"
            params.append(semester)

        basic = self.db.fetch_one(sql, tuple(params))

        checkin_sql = f"""
            SELECT COUNT(*) as total_checkins
            FROM {CheckinModel.TABLE_NAME} c
            INNER JOIN {ActivityModel.TABLE_NAME} a ON c.activity_id = a.id
            WHERE c.status = 1
        """
        if semester:
            checkin_sql += " AND a.semester = ?"
            checkin_result = self.db.fetch_one(checkin_sql, (semester,))
        else:
            checkin_result = self.db.fetch_one(checkin_sql)

        attendance_rate = 0.0
        if basic.get('total_participants', 0) > 0:
            attendance_rate = round(
                (checkin_result.get('total_checkins', 0) / basic['total_participants']) * 100, 2
            )

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_activities': basic.get('total_activities', 0),
                'total_participants': basic.get('total_participants', 0),
                'total_checkins': checkin_result.get('total_checkins', 0),
                'avg_satisfaction': round(basic.get('avg_satisfaction', 0), 2),
                'attendance_rate': attendance_rate
            }
        }

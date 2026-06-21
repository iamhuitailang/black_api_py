from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.model.campus import ActivitySummaryModel, ActivityModel, OrganizerModel, CheckinModel


class SummaryBusiness:
    def __init__(self):
        self.model = ActivitySummaryModel()
        self.activity_model = ActivityModel()
        self.organizer_model = OrganizerModel()
        self.checkin_model = CheckinModel()

    def _is_overdue(self, activity: Dict[str, Any]) -> bool:
        try:
            end_time = datetime.fromisoformat(activity['end_time'])
            deadline = end_time + timedelta(hours=48)
            return datetime.now() > deadline
        except Exception:
            return False

    def submit(self, activity_id: int, actual_count: int, satisfaction_score: float = 0.0,
               photos: str = '', summary: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'message': '活动不存在', 'data': None}

        is_overdue = self._is_overdue(activity)

        self.model.create({
            'activity_id': activity_id,
            'actual_count': actual_count,
            'satisfaction_score': satisfaction_score,
            'photos': photos,
            'summary': summary
        })

        self.activity_model.update(activity_id, {'status': ActivityModel.STATUS_SUMMARY_SUBMITTED})

        if is_overdue:
            return {
                'code': 0,
                'message': '总结已提交，但已超出48小时期限，主办方已被限制7天内申报',
                'data': {'overdue': True}
            }

        return {'code': 0, 'message': '总结提交成功', 'data': {'overdue': False}}

    def check_overdue_and_ban(self) -> Dict[str, Any]:
        sql = f"""
            SELECT a.* FROM {ActivityModel.TABLE_NAME} a
            LEFT JOIN {ActivitySummaryModel.TABLE_NAME} s ON a.id = s.activity_id
            WHERE a.status IN (?, ?) AND s.id IS NULL
        """
        from app.common.sqlite.db import get_db
        db = get_db()
        pending_activities = db.fetch_all(
            sql, (ActivityModel.STATUS_COMPLETED, ActivityModel.STATUS_APPROVED)
        )

        banned_count = 0
        banned_organizers = set()

        for activity in pending_activities:
            try:
                end_time = datetime.fromisoformat(activity['end_time'])
                if datetime.now() > end_time + timedelta(hours=48):
                    oid = activity.get('organizer_id')
                    if oid and oid not in banned_organizers:
                        self.organizer_model.ban_days(oid, 7)
                        banned_organizers.add(oid)
                        banned_count += 1
            except Exception:
                continue

        return {
            'code': 0,
            'message': f'已处理，共限制{banned_count}个主办方7天内不可申报',
            'data': {'banned_count': banned_count}
        }

    def get_by_activity(self, activity_id: int) -> Dict[str, Any]:
        summary = self.model.get_by_activity(activity_id)
        activity = self.activity_model.get_by_id(activity_id)
        checkin_stats = None
        if activity:
            checked = self.checkin_model.count_checked(activity_id)
            checkin_stats = {'checked_count': checked}
        return {
            'code': 0,
            'message': 'success',
            'data': {'summary': summary, 'activity': activity, 'checkin_stats': checkin_stats}
        }

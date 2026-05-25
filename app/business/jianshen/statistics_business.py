from typing import Dict, Any, List
from datetime import date as date_type, timedelta, datetime
from app.model.jianshen import JianshenCheckinModel, JianshenUserModel
import json
from collections import defaultdict


class JianshenStatisticsBusiness:
    def __init__(self):
        self.checkin_model = JianshenCheckinModel()
        self.user_model = JianshenUserModel()

    def get_summary(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        total_duration = self.checkin_model.sum_duration_by_user(user_id)
        total_calories = self.checkin_model.sum_calories_by_user(user_id)
        total_count = self.checkin_model.count_by_user(user_id)
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'total_duration': total_duration,
                'total_calories': total_calories,
                'total_count': total_count,
                'total_days': user.get('total_checkins', 0),
                'consecutive_days': user.get('consecutive_days', 0)
            }
        }

    def get_trend(self, user_id: int, range_type: str = 'week') -> Dict[str, Any]:
        today = date_type.today()
        if range_type == 'week':
            start = today - timedelta(days=6)
            days = 7
        elif range_type == 'month':
            start = today.replace(day=1)
            days = (today - start).days + 1
        else:
            start = today.replace(month=1, day=1)
            days = (today - start).days + 1
        records = self.checkin_model.get_by_user_date_range(user_id, start.isoformat(), today.isoformat())
        duration_by_day = defaultdict(int)
        calories_by_day = defaultdict(int)
        count_by_day = defaultdict(int)
        for r in records:
            d = r.get('checkin_date')
            duration_by_day[d] += r.get('duration', 0)
            calories_by_day[d] += r.get('calories', 0)
            count_by_day[d] += 1
        labels = []
        durations = []
        calories = []
        counts = []
        for i in range(days):
            d = (start + timedelta(days=i)).isoformat()
            labels.append(d)
            durations.append(duration_by_day.get(d, 0))
            calories.append(calories_by_day.get(d, 0))
            counts.append(count_by_day.get(d, 0))
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'labels': labels,
                'durations': durations,
                'calories': calories,
                'counts': counts
            }
        }

    def get_project_distribution(self, user_id: int) -> Dict[str, Any]:
        records = self.checkin_model.query.find_all({'user_id': user_id})
        project_counts = defaultdict(int)
        project_duration = defaultdict(int)
        for r in records:
            try:
                projects = json.loads(r.get('projects', '[]'))
            except Exception:
                projects = []
            duration = r.get('duration', 0)
            if projects:
                per_project = duration / len(projects)
            else:
                per_project = duration
            for p in projects:
                project_counts[p] += 1
                project_duration[p] += per_project
        labels = list(project_counts.keys())
        counts = [project_counts[k] for k in labels]
        durations = [int(project_duration[k]) for k in labels]
        total = sum(counts) if sum(counts) > 0 else 1
        percentages = [int(c / total * 100) for c in counts]
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'labels': labels,
                'counts': counts,
                'durations': durations,
                'percentages': percentages
            }
        }

    def get_calendar(self, user_id: int, year: int, month: int) -> Dict[str, Any]:
        start = date_type(year, month, 1)
        if month == 12:
            end = date_type(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date_type(year, month + 1, 1) - timedelta(days=1)
        records = self.checkin_model.get_by_user_date_range(user_id, start.isoformat(), end.isoformat())
        days = {}
        for r in records:
            d = r.get('checkin_date')
            if d:
                projects = []
                try:
                    projects = json.loads(r.get('projects', '[]'))
                except Exception:
                    pass
                days[d] = {
                    'checkin_date': d,
                    'projects': projects,
                    'duration': r.get('duration', 0),
                    'calories': r.get('calories', 0),
                    'count': 1
                }
        return {'code': 0, 'msg': 'success', 'data': days}

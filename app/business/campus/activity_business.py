from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.model.campus import ActivityModel, VenueModel, OrganizerModel, RegistrationModel


class ActivityBusiness:
    def __init__(self):
        self.model = ActivityModel()
        self.venue_model = VenueModel()
        self.organizer_model = OrganizerModel()
        self.registration_model = RegistrationModel()

    def _get_semester(self, dt: datetime) -> str:
        year = dt.year
        if dt.month >= 9:
            return f"{year}-{year + 1}-1"
        elif dt.month <= 2:
            return f"{year - 1}-{year}-1"
        else:
            return f"{year - 1}-{year}-2"

    def _count_workdays(self, start: datetime, end: datetime) -> int:
        count = 0
        current = start
        while current < end:
            if current.weekday() < 5:
                count += 1
            current += timedelta(days=1)
        return count

    def _find_alternative_slots(self, venue_id: int, desired_start: datetime,
                                 desired_end: datetime, exclude_id: int = None) -> List[Dict[str, Any]]:
        duration = desired_end - desired_start
        alternatives = []
        base_day = desired_start.replace(hour=8, minute=0, second=0, microsecond=0)

        for day_offset in range(1, 8):
            candidate_day = base_day + timedelta(days=day_offset)
            if candidate_day.weekday() >= 5:
                continue

            for hour in [8, 10, 14, 16, 19]:
                cand_start = candidate_day.replace(hour=hour)
                cand_end = cand_start + duration
                if cand_end.hour > 22:
                    continue

                conflicts = self.model.find_conflicts(
                    venue_id, cand_start.isoformat(), cand_end.isoformat(), exclude_id
                )
                if not conflicts:
                    alternatives.append({
                        'start_time': cand_start.isoformat(),
                        'end_time': cand_end.isoformat(),
                        'date': cand_start.strftime('%Y-%m-%d'),
                        'time_range': f"{cand_start.strftime('%H:%M')}-{cand_end.strftime('%H:%M')}"
                    })
                    if len(alternatives) >= 5:
                        return alternatives
        return alternatives

    def check_conflict(self, venue_id: int, start_time: str, end_time: str,
                       exclude_id: int = None) -> Dict[str, Any]:
        conflicts = self.model.find_conflicts(venue_id, start_time, end_time, exclude_id)
        venue = self.venue_model.get_by_id(venue_id)

        result = {
            'has_conflict': len(conflicts) > 0,
            'conflicts': conflicts,
            'venue': venue
        }

        if conflicts:
            try:
                st = datetime.fromisoformat(start_time)
                et = datetime.fromisoformat(end_time)
                result['alternatives'] = self._find_alternative_slots(venue_id, st, et, exclude_id)
            except Exception:
                result['alternatives'] = []

        return {'code': 0, 'message': 'success', 'data': result}

    def create_activity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required = ['name', 'type', 'venue_id', 'start_time', 'end_time',
                    'expected_count', 'organizer_id', 'organizer_name',
                    'contact_person', 'contact_phone']
        for f in required:
            if not data.get(f):
                return {'code': 1, 'message': f'缺少必填字段: {f}', 'data': None}

        try:
            start_dt = datetime.fromisoformat(data['start_time'])
            end_dt = datetime.fromisoformat(data['end_time'])
        except Exception:
            return {'code': 1, 'message': '时间格式错误', 'data': None}

        if end_dt <= start_dt:
            return {'code': 1, 'message': '结束时间必须晚于开始时间', 'data': None}

        now = datetime.now()
        workdays_ahead = self._count_workdays(now, start_dt)
        if workdays_ahead < 5:
            return {
                'code': 1,
                'message': f'活动须提前5个工作日申报，当前仅提前{workdays_ahead}个工作日',
                'data': None
            }

        if self.organizer_model.is_banned(data['organizer_id']):
            org = self.organizer_model.get_by_id(data['organizer_id'])
            return {
                'code': 1,
                'message': f'主办方存在未提交的活动总结，被禁止申报至 {org.get("banned_until", "")}',
                'data': None
            }

        conflicts = self.model.find_conflicts(data['venue_id'], data['start_time'], data['end_time'])
        if conflicts:
            alternatives = self._find_alternative_slots(
                data['venue_id'], start_dt, end_dt
            )
            return {
                'code': 2,
                'message': '场地存在时间冲突',
                'data': {'conflicts': conflicts, 'alternatives': alternatives}
            }

        venue = self.venue_model.get_by_id(data['venue_id'])
        if venue:
            data['venue_name'] = venue['name']

        data['semester'] = self._get_semester(start_dt)

        type_approval = {
            'academic': '须院系学术委员会审批',
            'culture': '须团委文体部审批',
            'club': '须社团联合会审批',
            'volunteer': '须青年志愿者协会审批'
        }
        data['approval_remark'] = type_approval.get(data['type'], '')

        new_id = self.model.create(data)
        record = self.model.get_by_id(new_id)
        return {'code': 0, 'message': '申报成功，等待审批', 'data': record}

    def get_detail(self, activity_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(activity_id)
        if not record:
            return {'code': 1, 'message': '活动不存在', 'data': None}

        registered_count = self.registration_model.count_by_activity(activity_id, 0)
        record['registered_count'] = registered_count

        return {'code': 0, 'message': 'success', 'data': record}

    def get_calendar(self, start: str, end: str, activity_type: str = None,
                     department: str = None) -> Dict[str, Any]:
        activities = self.model.find_approved_in_range(start, end)
        if activity_type:
            activities = [a for a in activities if a['type'] == activity_type]
        if department:
            activities = [a for a in activities if a.get('organizer_department') == department]

        for a in activities:
            a['registered_count'] = self.registration_model.count_by_activity(a['id'], 0)

        return {'code': 0, 'message': 'success', 'data': activities}

    def get_list(self, page: int = 1, page_size: int = 10, status: int = None,
                 activity_type: str = None, department: str = None,
                 semester: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size, status, activity_type,
                                     department, semester, keyword)
        return {'code': 0, 'message': 'success', 'data': result}

    def approve(self, activity_id: int, approved: bool, reason: str = '') -> Dict[str, Any]:
        record = self.model.get_by_id(activity_id)
        if not record:
            return {'code': 1, 'message': '活动不存在', 'data': None}

        if approved:
            self.model.update(activity_id, {'status': ActivityModel.STATUS_APPROVED})
            return {'code': 0, 'message': '审批通过', 'data': None}
        else:
            self.model.update(activity_id, {
                'status': ActivityModel.STATUS_REJECTED,
                'reject_reason': reason
            })
            return {'code': 0, 'message': '已驳回', 'data': None}

    def cancel(self, activity_id: int, reason: str = '') -> Dict[str, Any]:
        record = self.model.get_by_id(activity_id)
        if not record:
            return {'code': 1, 'message': '活动不存在', 'data': None}

        self.model.update(activity_id, {
            'status': ActivityModel.STATUS_CANCELLED,
            'cancel_reason': reason
        })

        registrations = self.registration_model.find_by_activity(activity_id, 0)
        notified_students = []
        for r in registrations:
            self.registration_model.cancel(r['id'])
            notified_students.append({
                'student_id': r['student_id'],
                'student_name': r['student_name'],
                'student_no': r['student_no']
            })

        return {
            'code': 0,
            'message': '活动已取消，已通知所有报名学生并释放场地',
            'data': {'notified_count': len(notified_students), 'students': notified_students}
        }

    def mark_completed(self, activity_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(activity_id)
        if not record:
            return {'code': 1, 'message': '活动不存在', 'data': None}
        self.model.update(activity_id, {'status': ActivityModel.STATUS_COMPLETED})
        return {'code': 0, 'message': '活动已标记完成', 'data': None}

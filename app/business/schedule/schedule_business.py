from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict
import random

from app.model.schedule import ShiftModel, StaffModel, ScheduleModel, SwapRequestModel


class ScheduleBusiness:
    def __init__(self):
        self.shift_model = ShiftModel()
        self.staff_model = StaffModel()
        self.schedule_model = ScheduleModel()
        self.swap_model = SwapRequestModel()

    def login(self, name: str, password: str) -> Dict[str, Any]:
        if not name or not name.strip():
            return {'code': 1, 'message': '请输入姓名', 'data': None}
        if not password:
            return {'code': 1, 'message': '请输入密码', 'data': None}

        staff = self.staff_model.verify_password(name.strip(), password)
        if not staff:
            return {'code': 1, 'message': '姓名或密码错误', 'data': None}

        token = self.staff_model.generate_token(staff['id'], hours=24)

        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'staff': staff,
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        staff = self.staff_model.get_by_token(token)
        if staff:
            self.staff_model.clear_token(staff['id'])
        return {'code': 0, 'message': '已退出登录', 'data': None}

    def get_current_staff(self, token: str) -> Dict[str, Any]:
        staff = self.staff_model.get_by_token(token)
        if staff:
            return {'code': 0, 'message': 'success', 'data': staff}
        return {'code': 1, 'message': '未登录或登录已过期', 'data': None}

    def _verify_token(self, token: str, require_admin: bool = False) -> Optional[Dict[str, Any]]:
        staff = self.staff_model.get_by_token(token)
        if not staff:
            return None
        if require_admin and staff['role'] != 'admin':
            return None
        return staff

    def get_shifts(self) -> Dict[str, Any]:
        shifts = self.shift_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': shifts
        }

    def create_shift(self, name: str, start_time: str, end_time: str, color: str = '#cccccc') -> Dict[str, Any]:
        if not name or not name.strip():
            return {'code': 1, 'message': '班次名称不能为空', 'data': None}
        if not start_time or not end_time:
            return {'code': 1, 'message': '开始和结束时间不能为空', 'data': None}

        name = name.strip()
        shift_id = self.shift_model.create(name, start_time, end_time, color)
        shift = self.shift_model.get_by_id(shift_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': shift
        }

    def update_shift(self, shift_id: int, name: str = None, start_time: str = None,
                     end_time: str = None, color: str = None) -> Dict[str, Any]:
        existing = self.shift_model.get_by_id(shift_id)
        if not existing:
            return {'code': 1, 'message': '班次不存在', 'data': None}

        affected = self.shift_model.update(shift_id, name, start_time, end_time, color)
        if affected > 0:
            shift = self.shift_model.get_by_id(shift_id)
            return {'code': 0, 'message': '更新成功', 'data': shift}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_shift(self, shift_id: int) -> Dict[str, Any]:
        existing = self.shift_model.get_by_id(shift_id)
        if not existing:
            return {'code': 1, 'message': '班次不存在', 'data': None}

        affected = self.shift_model.delete(shift_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_staff(self) -> Dict[str, Any]:
        staff_list = self.staff_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': staff_list
        }

    def create_staff(self, name: str, role: str = 'staff') -> Dict[str, Any]:
        if not name or not name.strip():
            return {'code': 1, 'message': '员工姓名不能为空', 'data': None}

        name = name.strip()
        staff_id = self.staff_model.create(name, role)
        staff = self.staff_model.get_by_id(staff_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': staff
        }

    def update_staff(self, staff_id: int, name: str = None, role: str = None) -> Dict[str, Any]:
        existing = self.staff_model.get_by_id(staff_id)
        if not existing:
            return {'code': 1, 'message': '员工不存在', 'data': None}

        affected = self.staff_model.update(staff_id, name, role)
        if affected > 0:
            staff = self.staff_model.get_by_id(staff_id)
            return {'code': 0, 'message': '更新成功', 'data': staff}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_staff(self, staff_id: int) -> Dict[str, Any]:
        existing = self.staff_model.get_by_id(staff_id)
        if not existing:
            return {'code': 1, 'message': '员工不存在', 'data': None}

        affected = self.staff_model.delete(staff_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_personal_schedule(self, staff_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        schedules = self.schedule_model.get_by_staff_and_date_range(staff_id, start_date, end_date)
        shifts = {s['id']: s for s in self.shift_model.get_all()}

        result = []
        for s in schedules:
            shift = shifts.get(s['shift_id'], {})
            result.append({
                'id': s['id'],
                'staff_id': s['staff_id'],
                'date': s['date'],
                'shift_id': s['shift_id'],
                'shift_name': shift.get('name', ''),
                'start_time': shift.get('start_time', ''),
                'end_time': shift.get('end_time', ''),
                'color': shift.get('color', '#cccccc')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_department_schedule(self, start_date: str, end_date: str) -> Dict[str, Any]:
        schedules = self.schedule_model.get_by_date_range(start_date, end_date)
        staff_list = self.staff_model.get_all()
        shifts = {s['id']: s for s in self.shift_model.get_all()}

        staff_map = {s['id']: s for s in staff_list}

        schedule_map = {}
        for s in schedules:
            key = f"{s['staff_id']}_{s['date']}"
            shift = shifts.get(s['shift_id'], {})
            schedule_map[key] = {
                'id': s['id'],
                'staff_id': s['staff_id'],
                'date': s['date'],
                'shift_id': s['shift_id'],
                'shift_name': shift.get('name', ''),
                'start_time': shift.get('start_time', ''),
                'end_time': shift.get('end_time', ''),
                'color': shift.get('color', '#cccccc')
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'staff_list': staff_list,
                'schedule_map': schedule_map,
                'shifts': list(shifts.values())
            }
        }

    def update_schedule(self, staff_id: int, date_str: str, shift_id: int) -> Dict[str, Any]:
        existing_staff = self.staff_model.get_by_id(staff_id)
        if not existing_staff:
            return {'code': 1, 'message': '员工不存在', 'data': None}

        existing_shift = self.shift_model.get_by_id(shift_id)
        if not existing_shift:
            return {'code': 1, 'message': '班次不存在', 'data': None}

        existing = self.schedule_model.get_by_staff_and_date(staff_id, date_str)
        if existing:
            self.schedule_model.update_by_staff_date(staff_id, date_str, shift_id)
        else:
            self.schedule_model.create(staff_id, date_str, shift_id)

        schedule = self.schedule_model.get_by_staff_and_date(staff_id, date_str)
        shift = self.shift_model.get_by_id(shift_id)

        return {
            'code': 0,
            'message': '更新成功',
            'data': {
                'id': schedule['id'],
                'staff_id': schedule['staff_id'],
                'date': schedule['date'],
                'shift_id': schedule['shift_id'],
                'shift_name': shift['name'],
                'start_time': shift['start_time'],
                'end_time': shift['end_time'],
                'color': shift['color']
            }
        }

    def generate_schedule(self, start_date: str, weeks: int = 4,
                          max_night_per_week: int = 2,
                          min_rest_days: int = 1) -> Dict[str, Any]:
        staff_list = self.staff_model.get_all()
        shifts = self.shift_model.get_all()

        if len(staff_list) < 2:
            return {'code': 1, 'message': '员工数量不足，至少需要2人', 'data': None}
        if len(shifts) < 2:
            return {'code': 1, 'message': '班次数量不足，至少需要2个班次', 'data': None}

        night_shift = None
        rest_shift = None
        work_shifts = []

        for s in shifts:
            if s['name'] == '休息':
                rest_shift = s
            elif s['name'] == '夜班' or '0' in s['start_time'] or s['start_time'].startswith('0') or s['start_time'].startswith('24'):
                night_shift = s
                work_shifts.append(s)
            else:
                work_shifts.append(s)

        if not rest_shift:
            for s in shifts:
                if '休息' in s['name'] or '休' in s['name']:
                    rest_shift = s
                    break

        if not rest_shift:
            return {'code': 1, 'message': '请先创建"休息"班次', 'data': None}

        if not night_shift:
            for s in work_shifts:
                start_hour = int(s['start_time'].split(':')[0])
                if start_hour < 6 or start_hour >= 22:
                    night_shift = s
                    break

        start = datetime.strptime(start_date, '%Y-%m-%d')
        total_days = weeks * 7

        schedules = []
        staff_stats = defaultdict(lambda: {
            'night_this_week': 0,
            'consecutive_work': 0,
            'consecutive_rest': 0,
            'last_shift': None,
            'total_night': 0
        })

        night_workers = [s for s in staff_list]
        random.shuffle(night_workers)

        for day_idx in range(total_days):
            current_date = start + timedelta(days=day_idx)
            date_str = current_date.strftime('%Y-%m-%d')
            week_idx = day_idx // 7

            if day_idx % 7 == 0:
                for staff_id in staff_stats:
                    staff_stats[staff_id]['night_this_week'] = 0

            available_for_night = []
            for staff in staff_list:
                sid = staff['id']
                stats = staff_stats[sid]
                if stats['night_this_week'] < max_night_per_week:
                    if stats['last_shift'] != night_shift['id'] or day_idx == 0:
                        available_for_night.append(staff)

            if not available_for_night:
                available_for_night = staff_list.copy()

            night_staff_count = max(1, len(staff_list) // 4)
            night_staff = random.sample(available_for_night,
                                        min(night_staff_count, len(available_for_night)))

            night_staff_ids = set(s['id'] for s in night_staff)
            for ns in night_staff:
                staff_stats[ns['id']]['night_this_week'] += 1
                staff_stats[ns['id']]['total_night'] += 1

            rest_candidates = []
            for staff in staff_list:
                sid = staff['id']
                stats = staff_stats[sid]
                if sid not in night_staff_ids:
                    if stats['consecutive_work'] >= 5 and stats['consecutive_rest'] < min_rest_days:
                        rest_candidates.append(staff)

            if not rest_candidates:
                for staff in staff_list:
                    sid = staff['id']
                    if sid not in night_staff_ids:
                        if staff_stats[sid]['consecutive_rest'] < min_rest_days or day_idx % 7 == 6:
                            rest_candidates.append(staff)

            rest_count = max(1, min(len(rest_candidates), len(staff_list) // 4))
            if rest_candidates:
                rest_staff = random.sample(rest_candidates, min(rest_count, len(rest_candidates)))
            else:
                rest_staff = []

            rest_staff_ids = set(s['id'] for s in rest_staff)

            other_workers = []
            for staff in staff_list:
                sid = staff['id']
                if sid not in night_staff_ids and sid not in rest_staff_ids:
                    other_workers.append(staff)

            other_shifts = [s for s in work_shifts if s['id'] != night_shift['id']]
            if not other_shifts:
                other_shifts = work_shifts.copy()

            for i, staff in enumerate(other_workers):
                shift_idx = i % len(other_shifts)
                shift = other_shifts[shift_idx]
                schedules.append({
                    'staff_id': staff['id'],
                    'date': date_str,
                    'shift_id': shift['id']
                })
                stats = staff_stats[staff['id']]
                stats['consecutive_work'] += 1
                stats['consecutive_rest'] = 0
                stats['last_shift'] = shift['id']

            for staff in night_staff:
                schedules.append({
                    'staff_id': staff['id'],
                    'date': date_str,
                    'shift_id': night_shift['id']
                })
                stats = staff_stats[staff['id']]
                stats['consecutive_work'] += 1
                stats['consecutive_rest'] = 0
                stats['last_shift'] = night_shift['id']

            for staff in rest_staff:
                schedules.append({
                    'staff_id': staff['id'],
                    'date': date_str,
                    'shift_id': rest_shift['id']
                })
                stats = staff_stats[staff['id']]
                stats['consecutive_work'] = 0
                stats['consecutive_rest'] += 1
                stats['last_shift'] = rest_shift['id']

        end_date_str = (start + timedelta(days=total_days - 1)).strftime('%Y-%m-%d')
        self.schedule_model.delete_by_date_range(start_date, end_date_str)

        batch_data = []
        for s in schedules:
            batch_data.append({
                'staff_id': s['staff_id'],
                'date': s['date'],
                'shift_id': s['shift_id']
            })

        self.schedule_model.batch_create(batch_data)

        return {
            'code': 0,
            'message': f'成功生成{weeks}周排班，共{len(schedules)}条记录',
            'data': {
                'start_date': start_date,
                'end_date': end_date_str,
                'weeks': weeks,
                'total': len(schedules)
            }
        }

    def create_swap_request(self, requester_id: int, target_id: int,
                            date: str, target_date: str) -> Dict[str, Any]:
        if requester_id == target_id:
            return {'code': 1, 'message': '不能和自己换班', 'data': None}

        requester = self.staff_model.get_by_id(requester_id)
        if not requester:
            return {'code': 1, 'message': '申请人不存在', 'data': None}

        target = self.staff_model.get_by_id(target_id)
        if not target:
            return {'code': 1, 'message': '目标人不存在', 'data': None}

        req_schedule = self.schedule_model.get_by_staff_and_date(requester_id, date)
        if not req_schedule:
            return {'code': 1, 'message': '申请人该日期没有排班', 'data': None}

        target_schedule = self.schedule_model.get_by_staff_and_date(target_id, target_date)
        if not target_schedule:
            return {'code': 1, 'message': '目标人该日期没有排班', 'data': None}

        request_id = self.swap_model.create(requester_id, target_id, date, target_date)
        request = self.swap_model.get_by_id(request_id)

        return {
            'code': 0,
            'message': '换班请求已提交',
            'data': request
        }

    def get_swap_requests(self, staff_id: int = None, status: str = None,
                          role: str = None) -> Dict[str, Any]:
        if role == 'admin':
            requests = self.swap_model.get_all(status)
        elif staff_id is not None:
            req_requests = self.swap_model.get_by_requester(staff_id, status)
            target_requests = self.swap_model.get_by_target(staff_id, status)
            seen = set()
            requests = []
            for r in req_requests + target_requests:
                if r['id'] not in seen:
                    seen.add(r['id'])
                    requests.append(r)
            requests.sort(key=lambda x: x['id'], reverse=True)
        else:
            requests = []

        staff_map = {s['id']: s for s in self.staff_model.get_all()}
        shift_map = {}

        result = []
        for req in requests:
            req_schedule = self.schedule_model.get_by_staff_and_date(
                req['requester_id'], req['date'])
            target_schedule = self.schedule_model.get_by_staff_and_date(
                req['target_id'], req['target_date'])

            req_shift = None
            target_shift = None

            if req_schedule:
                req_shift = self.shift_model.get_by_id(req_schedule['shift_id'])
            if target_schedule:
                target_shift = self.shift_model.get_by_id(target_schedule['shift_id'])

            result.append({
                'id': req['id'],
                'requester_id': req['requester_id'],
                'requester_name': staff_map.get(req['requester_id'], {}).get('name', ''),
                'target_id': req['target_id'],
                'target_name': staff_map.get(req['target_id'], {}).get('name', ''),
                'date': req['date'],
                'target_date': req['target_date'],
                'requester_shift': req_shift,
                'target_shift': target_shift,
                'status': req['status'],
                'created_at': req['created_at']
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def approve_swap_request(self, request_id: int, staff_id: int) -> Dict[str, Any]:
        request = self.swap_model.get_by_id(request_id)
        if not request:
            return {'code': 1, 'message': '换班请求不存在', 'data': None}

        if request['status'] != 'pending':
            return {'code': 1, 'message': '该请求已处理', 'data': None}

        if request['target_id'] != staff_id:
            return {'code': 1, 'message': '无权处理此请求', 'data': None}

        success = self.schedule_model.swap_shifts(
            request['requester_id'], request['date'],
            request['target_id'], request['target_date']
        )

        if success:
            self.swap_model.update_status(request_id, 'approved')
            return {'code': 0, 'message': '换班成功', 'data': None}
        else:
            return {'code': 1, 'message': '换班失败', 'data': None}

    def reject_swap_request(self, request_id: int, staff_id: int) -> Dict[str, Any]:
        request = self.swap_model.get_by_id(request_id)
        if not request:
            return {'code': 1, 'message': '换班请求不存在', 'data': None}

        if request['status'] != 'pending':
            return {'code': 1, 'message': '该请求已处理', 'data': None}

        if request['target_id'] != staff_id:
            return {'code': 1, 'message': '无权处理此请求', 'data': None}

        self.swap_model.update_status(request_id, 'rejected')
        return {'code': 0, 'message': '已拒绝', 'data': None}

    def cancel_swap_request(self, request_id: int, staff_id: int) -> Dict[str, Any]:
        request = self.swap_model.get_by_id(request_id)
        if not request:
            return {'code': 1, 'message': '换班请求不存在', 'data': None}

        if request['status'] != 'pending':
            return {'code': 1, 'message': '该请求已处理', 'data': None}

        if request['requester_id'] != staff_id:
            return {'code': 1, 'message': '无权取消此请求', 'data': None}

        self.swap_model.update_status(request_id, 'cancelled')
        return {'code': 0, 'message': '已取消', 'data': None}

    def get_statistics(self, year: int, month: int) -> Dict[str, Any]:
        staff_list = self.staff_model.get_all()
        shifts = self.shift_model.get_all()

        shift_map = {s['id']: s for s in shifts}

        import calendar
        last_day = calendar.monthrange(year, month)[1]
        start_date = f'{year}-{month:02d}-01'
        end_date = f'{year}-{month:02d}-{last_day}'

        schedules = self.schedule_model.get_by_date_range(start_date, end_date)

        stats = []
        for staff in staff_list:
            staff_stats = {
                'staff_id': staff['id'],
                'staff_name': staff['name'],
                'shift_counts': {},
                'total_work_days': 0,
                'night_count': 0,
                'consecutive_days': 0,
                'max_consecutive_days': 0,
                'rest_days': 0,
                'violations': []
            }
            for shift in shifts:
                staff_stats['shift_counts'][shift['id']] = {
                    'name': shift['name'],
                    'count': 0,
                    'color': shift['color']
                }
            stats.append(staff_stats)

        staff_stats_map = {s['staff_id']: s for s in stats}

        staff_schedules = defaultdict(list)
        for sched in schedules:
            staff_schedules[sched['staff_id']].append(sched)

        night_shift_ids = []
        rest_shift_ids = []
        for s in shifts:
            if s['name'] == '休息' or '休' in s['name']:
                rest_shift_ids.append(s['id'])
            start_hour = int(s['start_time'].split(':')[0])
            if start_hour < 6 or start_hour >= 22:
                night_shift_ids.append(s['id'])

        for staff_id, scheds in staff_schedules.items():
            scheds.sort(key=lambda x: x['date'])
            if staff_id not in staff_stats_map:
                continue

            s = staff_stats_map[staff_id]

            current_streak = 0
            max_streak = 0
            last_date = None
            last_was_work = False

            week_night_count = defaultdict(int)

            for sched in scheds:
                shift_id = sched['shift_id']
                shift = shift_map.get(shift_id, {})

                if shift_id in s['shift_counts']:
                    s['shift_counts'][shift_id]['count'] += 1

                is_rest = shift_id in rest_shift_ids
                is_night = shift_id in night_shift_ids

                if is_rest:
                    s['rest_days'] += 1
                    if last_was_work:
                        current_streak = 0
                    last_was_work = False
                else:
                    s['total_work_days'] += 1
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                    last_was_work = True

                if is_night:
                    s['night_count'] += 1
                    date_obj = datetime.strptime(sched['date'], '%Y-%m-%d')
                    week_num = date_obj.isocalendar()[1]
                    week_night_count[week_num] += 1

            s['consecutive_days'] = max_streak
            s['max_consecutive_days'] = max_streak

            for week, count in week_night_count.items():
                if count > 2:
                    s['violations'].append({
                        'type': 'night_exceed',
                        'message': f'第{week}周夜班{count}次，超过2次',
                        'level': 'warning'
                    })

        sorted_stats = sorted(stats, key=lambda x: x['staff_id'])

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'year': year,
                'month': month,
                'stats': sorted_stats
            }
        }

from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.model.leave import EmployeeModel, LeaveRequestModel, LeaveBalanceModel


def calculate_work_days(start_date_str: str, end_date_str: str) -> int:
    start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    if end < start:
        return 0
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5:
            count += 1
        current += timedelta(days=1)
    return count


class LeaveBusiness:
    def __init__(self):
        self.employee_model = EmployeeModel()
        self.leave_request_model = LeaveRequestModel()
        self.leave_balance_model = LeaveBalanceModel()

    def get_employees(self) -> Dict[str, Any]:
        employees = self.employee_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': employees
        }

    def get_employee(self, employee_id: int) -> Dict[str, Any]:
        emp = self.employee_model.get_by_id(employee_id)
        if not emp:
            return {'code': 1, 'message': 'Employee not found', 'data': None}
        return {'code': 0, 'message': 'success', 'data': emp}

    def get_departments(self) -> Dict[str, Any]:
        depts = self.employee_model.get_departments()
        return {'code': 0, 'message': 'success', 'data': depts}

    def get_leave_balance(self, employee_id: int, year: int = None) -> Dict[str, Any]:
        if year is None:
            year = datetime.now().year
        balance = self.leave_balance_model.get_by_employee_year(employee_id, year)
        if not balance:
            emp = self.employee_model.get_by_id(employee_id)
            if not emp:
                return {'code': 1, 'message': 'Employee not found', 'data': None}
            annual_total = emp.get('annual_leave_total', 10)
            self.leave_balance_model.create(employee_id, year, annual_total, 0)
            balance = self.leave_balance_model.get_by_employee_year(employee_id, year)
        return {'code': 0, 'message': 'success', 'data': balance}

    def calc_work_days(self, start_date: str, end_date: str) -> Dict[str, Any]:
        try:
            days = calculate_work_days(start_date, end_date)
            return {'code': 0, 'message': 'success', 'data': {'work_days': days}}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def submit_leave(self, employee_id: int, leave_type: str, start_date: str,
                     end_date: str, reason: str = None) -> Dict[str, Any]:
        if leave_type not in LeaveRequestModel.LEAVE_TYPES:
            return {'code': 1, 'message': 'Invalid leave type', 'data': None}
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return {'code': 1, 'message': 'Invalid date format, use YYYY-MM-DD', 'data': None}
        if end < start:
            return {'code': 1, 'message': 'End date must be after start date', 'data': None}

        work_days = calculate_work_days(start_date, end_date)
        if work_days <= 0:
            return {'code': 1, 'message': 'No work days in selected range', 'data': None}

        emp = self.employee_model.get_by_id(employee_id)
        if not emp:
            return {'code': 1, 'message': 'Employee not found', 'data': None}

        if leave_type in ['annual', 'compensation']:
            year = start.year
            balance = self.leave_balance_model.get_by_employee_year(employee_id, year)
            if not balance:
                annual_total = emp.get('annual_leave_total', 10)
                self.leave_balance_model.create(employee_id, year, annual_total, 0)
                balance = self.leave_balance_model.get_by_employee_year(employee_id, year)
            if leave_type == 'annual' and balance['annual_remaining'] < work_days:
                return {
                    'code': 1,
                    'message': f'Insufficient annual leave balance: {balance["annual_remaining"]} days remaining',
                    'data': None
                }
            if leave_type == 'compensation' and balance['compensation_remaining'] < work_days:
                return {
                    'code': 1,
                    'message': f'Insufficient compensation leave balance: {balance["compensation_remaining"]} days remaining',
                    'data': None
                }

        new_id = self.leave_request_model.create(
            employee_id=employee_id,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            work_days=work_days,
            reason=reason
        )
        record = self.leave_request_model.get_by_id(new_id)
        return {'code': 0, 'message': 'Leave request submitted successfully', 'data': record}

    def get_my_leaves(self, employee_id: int, status: str = None) -> Dict[str, Any]:
        records = self.leave_request_model.get_by_employee(employee_id, status)
        result = []
        for r in records:
            item = dict(r)
            leave_map = {
                'annual': '年假', 'personal': '事假', 'sick': '病假',
                'compensation': '调休', 'marriage': '婚假', 'maternity': '产假'
            }
            status_map = {
                'pending_manager': '待直属上级审批',
                'pending_hr': '待部门经理审批',
                'approved': '已批准',
                'rejected': '已驳回'
            }
            item['leave_type_name'] = leave_map.get(r['leave_type'], r['leave_type'])
            item['status_name'] = status_map.get(r['status'], r['status'])
            result.append(item)
        return {'code': 0, 'message': 'success', 'data': result}

    def get_pending_approvals(self, approver_id: int, approver_role: str = 'manager') -> Dict[str, Any]:
        records = self.leave_request_model.get_pending_for_approver(approver_id, approver_role)
        result = []
        for r in records:
            item = dict(r)
            leave_map = {
                'annual': '年假', 'personal': '事假', 'sick': '病假',
                'compensation': '调休', 'marriage': '婚假', 'maternity': '产假'
            }
            status_map = {
                'pending_manager': '待直属上级审批',
                'pending_hr': '待部门经理审批'
            }
            item['leave_type_name'] = leave_map.get(r['leave_type'], r['leave_type'])
            item['status_name'] = status_map.get(r['status'], r['status'])
            result.append(item)
        return {'code': 0, 'message': 'success', 'data': result}

    def approve_leave(self, request_id: int, approver_id: int, approver_role: str,
                      comment: str = None) -> Dict[str, Any]:
        record = self.leave_request_model.get_by_id(request_id)
        if not record:
            return {'code': 1, 'message': 'Leave request not found', 'data': None}

        emp = self.employee_model.get_by_id(record['employee_id'])
        if not emp:
            return {'code': 1, 'message': 'Employee not found', 'data': None}

        if record['status'] == LeaveRequestModel.STATUS_PENDING_MANAGER:
            if approver_role not in ['manager', 'hr', 'admin'] and emp.get('manager_id') != approver_id:
                return {'code': 1, 'message': 'You are not authorized to approve this request', 'data': None}

            work_days = record['work_days']
            if work_days > 3:
                self.leave_request_model.update_status(
                    request_id,
                    LeaveRequestModel.STATUS_PENDING_HR,
                    approver_id=approver_id,
                    approve_comment=comment,
                    manager_approved=1
                )
            else:
                leave_type = record['leave_type']
                if leave_type in ['annual', 'compensation']:
                    year = datetime.strptime(record['start_date'], '%Y-%m-%d').year
                    if leave_type == 'annual':
                        self.leave_balance_model.deduct_annual(record['employee_id'], year, work_days)
                    else:
                        self.leave_balance_model.deduct_compensation(record['employee_id'], year, work_days)
                self.leave_request_model.update_status(
                    request_id,
                    LeaveRequestModel.STATUS_APPROVED,
                    approver_id=approver_id,
                    approve_comment=comment,
                    manager_approved=1,
                    hr_approved=1
                )
        elif record['status'] == LeaveRequestModel.STATUS_PENDING_HR:
            if approver_role not in ['hr', 'admin']:
                return {'code': 1, 'message': 'Only HR/Admin can approve at this stage', 'data': None}
            leave_type = record['leave_type']
            if leave_type in ['annual', 'compensation']:
                year = datetime.strptime(record['start_date'], '%Y-%m-%d').year
                if leave_type == 'annual':
                    self.leave_balance_model.deduct_annual(record['employee_id'], year, record['work_days'])
                else:
                    self.leave_balance_model.deduct_compensation(record['employee_id'], year, record['work_days'])
            self.leave_request_model.update_status(
                request_id,
                LeaveRequestModel.STATUS_APPROVED,
                approver_id=approver_id,
                approve_comment=comment,
                hr_approved=1
            )
        else:
            return {'code': 1, 'message': f'Cannot approve request with status: {record["status"]}', 'data': None}

        updated = self.leave_request_model.get_by_id(request_id)
        return {'code': 0, 'message': 'Leave request approved', 'data': updated}

    def reject_leave(self, request_id: int, approver_id: int, approver_role: str,
                     comment: str = None) -> Dict[str, Any]:
        record = self.leave_request_model.get_by_id(request_id)
        if not record:
            return {'code': 1, 'message': 'Leave request not found', 'data': None}
        if record['status'] not in [LeaveRequestModel.STATUS_PENDING_MANAGER, LeaveRequestModel.STATUS_PENDING_HR]:
            return {'code': 1, 'message': f'Cannot reject request with status: {record["status"]}', 'data': None}

        emp = self.employee_model.get_by_id(record['employee_id'])
        if record['status'] == LeaveRequestModel.STATUS_PENDING_MANAGER:
            if approver_role not in ['manager', 'hr', 'admin'] and emp.get('manager_id') != approver_id:
                return {'code': 1, 'message': 'You are not authorized to reject this request', 'data': None}

        self.leave_request_model.update_status(
            request_id,
            LeaveRequestModel.STATUS_REJECTED,
            approver_id=approver_id,
            approve_comment=comment
        )
        updated = self.leave_request_model.get_by_id(request_id)
        return {'code': 0, 'message': 'Leave request rejected', 'data': updated}

    def get_leave_calendar(self, employee_id: int, year: int, month: int) -> Dict[str, Any]:
        start_d = date(year, month, 1)
        if month == 12:
            end_d = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_d = date(year, month + 1, 1) - timedelta(days=1)
        records = self.leave_request_model.get_by_date_range(
            start_d.isoformat(), end_d.isoformat(), employee_id
        )
        leave_days = {}
        leave_map = {
            'annual': '年假', 'personal': '事假', 'sick': '病假',
            'compensation': '调休', 'marriage': '婚假', 'maternity': '产假'
        }
        status_map = {
            'pending_manager': '待审批',
            'pending_hr': '待审批',
            'approved': '已批准',
            'rejected': '已驳回'
        }
        for r in records:
            start = datetime.strptime(r['start_date'], '%Y-%m-%d').date()
            end = datetime.strptime(r['end_date'], '%Y-%m-%d').date()
            current = start
            while current <= end:
                if current.year == year and current.month == month:
                    key = current.isoformat()
                    if key not in leave_days:
                        leave_days[key] = []
                    leave_days[key].append({
                        'type': r['leave_type'],
                        'type_name': leave_map.get(r['leave_type'], r['leave_type']),
                        'status': r['status'],
                        'status_name': status_map.get(r['status'], r['status']),
                        'employee_id': r['employee_id'],
                        'employee_name': r.get('employee_name', ''),
                        'reason': r.get('reason', '')
                    })
                current += timedelta(days=1)
        return {'code': 0, 'message': 'success', 'data': leave_days}

    def get_hr_statistics(self, year: int = None, month: int = None,
                          department: str = None) -> Dict[str, Any]:
        if year is None:
            year = datetime.now().year

        all_records = []
        if month:
            all_records = self.leave_request_model.get_statistics_by_month(year, month)
        else:
            dept_stats = self.leave_request_model.get_statistics_by_department(year)
            return {'code': 0, 'message': 'success', 'data': {
                'department_stats': dept_stats,
                'year': year
            }}

        filtered = []
        for r in all_records:
            if department and r.get('department') != department:
                continue
            filtered.append(r)

        leave_map = {
            'annual': '年假', 'personal': '事假', 'sick': '病假',
            'compensation': '调休', 'marriage': '婚假', 'maternity': '产假'
        }
        status_map = {
            'pending_manager': '待直属上级审批',
            'pending_hr': '待部门经理审批',
            'approved': '已批准',
            'rejected': '已驳回'
        }

        by_type = {}
        by_department = {}
        by_employee = {}
        for r in filtered:
            lt = r['leave_type']
            by_type[lt] = by_type.get(lt, 0) + r['work_days']
            dept = r.get('department', '未知')
            if dept not in by_department:
                by_department[dept] = {}
            by_department[dept][lt] = by_department[dept].get(lt, 0) + r['work_days']
            emp_name = r.get('employee_name', f"员工{r['employee_id']}")
            if emp_name not in by_employee:
                by_employee[emp_name] = {'total': 0, 'department': dept, 'details': {}}
            by_employee[emp_name]['total'] += r['work_days']
            by_employee[emp_name]['details'][lt] = by_employee[emp_name]['details'].get(lt, 0) + r['work_days']

        abnormal = []
        for name, info in by_employee.items():
            if info['total'] > 5:
                abnormal.append({
                    'employee': name,
                    'department': info['department'],
                    'total_days': info['total'],
                    'details': info['details']
                })

        result_list = []
        for r in filtered:
            item = dict(r)
            item['leave_type_name'] = leave_map.get(r['leave_type'], r['leave_type'])
            item['status_name'] = status_map.get(r['status'], r['status'])
            result_list.append(item)

        by_type_named = {}
        for k, v in by_type.items():
            by_type_named[leave_map.get(k, k)] = v

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'records': result_list,
                'by_type': by_type_named,
                'by_type_raw': by_type,
                'by_department': by_department,
                'by_employee': by_employee,
                'abnormal': abnormal,
                'year': year,
                'month': month
            }
        }

    def export_monthly_csv(self, year: int, month: int) -> str:
        records = self.leave_request_model.get_statistics_by_month(year, month)
        leave_map = {
            'annual': '年假', 'personal': '事假', 'sick': '病假',
            'compensation': '调休', 'marriage': '婚假', 'maternity': '产假'
        }
        status_map = {
            'pending_manager': '待直属上级审批',
            'pending_hr': '待部门经理审批',
            'approved': '已批准',
            'rejected': '已驳回'
        }
        lines = ['员工姓名,部门,请假类型,开始日期,结束日期,工作日天数,事由,状态,审批备注']
        for r in records:
            line = ','.join([
                str(r.get('employee_name', '')),
                str(r.get('department', '')),
                leave_map.get(r['leave_type'], r['leave_type']),
                r['start_date'],
                r['end_date'],
                str(r['work_days']),
                '"' + str(r.get('reason', '')).replace('"', '""') + '"',
                status_map.get(r['status'], r['status']),
                '"' + str(r.get('approve_comment', '')).replace('"', '""') + '"'
            ])
            lines.append(line)
        return '\n'.join(lines)

    def init_seed_data(self) -> Dict[str, Any]:
        employees = self.employee_model.get_all()
        if employees:
            return {'code': 0, 'message': 'Seed data already exists', 'data': None}

        hr_id = self.employee_model.create('HR管理员', '行政部', None, 15, 'hr')
        mgr1_id = self.employee_model.create('张经理', '技术部', hr_id, 15, 'manager')
        mgr2_id = self.employee_model.create('李经理', '市场部', hr_id, 15, 'manager')

        emp_ids = [
            ('张三', '技术部', mgr1_id, 10),
            ('李四', '技术部', mgr1_id, 10),
            ('王五', '技术部', mgr1_id, 10),
            ('赵六', '市场部', mgr2_id, 10),
            ('钱七', '市场部', mgr2_id, 10),
            ('孙八', '行政部', hr_id, 10),
        ]
        created_ids = []
        for name, dept, mid, annual in emp_ids:
            eid = self.employee_model.create(name, dept, mid, annual, 'employee')
            created_ids.append(eid)

        current_year = datetime.now().year
        all_ids = [hr_id, mgr1_id, mgr2_id] + created_ids
        for eid in all_ids:
            emp = self.employee_model.get_by_id(eid)
            self.leave_balance_model.create(eid, current_year, emp['annual_leave_total'], 3)

        return {'code': 0, 'message': 'Seed data initialized', 'data': {'count': len(all_ids)}}

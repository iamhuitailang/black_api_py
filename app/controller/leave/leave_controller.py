from typing import Optional
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import StringIO
from datetime import datetime
from app.business.leave import LeaveBusiness


class LeaveSubmitRequest(BaseModel):
    employee_id: int
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None


class LeaveApproveRequest(BaseModel):
    request_id: int
    approver_id: int
    approver_role: str = 'manager'
    comment: Optional[str] = None


class LeaveRejectRequest(BaseModel):
    request_id: int
    approver_id: int
    approver_role: str = 'manager'
    comment: Optional[str] = None


class LeaveController:
    def __init__(self):
        self.business = LeaveBusiness()

    def ActionLeaveEmployeeGetlist(self, request: Request):
        """
        获取所有员工列表
        GET /api/leave/employee/getlist
        """
        return self.business.get_employees()

    def ActionLeaveEmployeeGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取单个员工信息
        GET /api/leave/employee/get
        参数: id - 员工ID
        """
        return self.business.get_employee(id)

    def ActionLeaveDepartmentGetlist(self, request: Request):
        """
        获取所有部门列表
        GET /api/leave/department/getlist
        """
        return self.business.get_departments()

    def ActionLeaveBalanceGet(self, request: Request, employee_id: int = Query(..., ge=1),
                                year: Optional[int] = Query(None)):
        """
        获取员工假期余额
        GET /api/leave/balance/get
        参数: employee_id - 员工ID, year - 年份(可选，默认当前年)
        """
        return self.business.get_leave_balance(employee_id, year)

    def ActionLeaveCalcWorkdaysGet(self, request: Request, start_date: str = Query(...),
                                     end_date: str = Query(...)):
        """
        计算两个日期之间的工作日天数
        GET /api/leave/calc/workdays/get
        参数: start_date, end_date (YYYY-MM-DD)
        """
        return self.business.calc_work_days(start_date, end_date)

    def ActionLeaveSubmitPost(self, request: Request, body: LeaveSubmitRequest):
        """
        提交请假申请
        POST /api/leave/submit
        """
        return self.business.submit_leave(
            body.employee_id,
            body.leave_type,
            body.start_date,
            body.end_date,
            body.reason
        )

    def ActionLeaveMyleavesGetlist(self, request: Request, employee_id: int = Query(..., ge=1),
                                     status: Optional[str] = Query(None)):
        """
        获取我的请假记录
        GET /api/leave/myleaves/getlist
        参数: employee_id, status (可选: pending_manager/pending_hr/approved/rejected)
        """
        return self.business.get_my_leaves(employee_id, status)

    def ActionLeavePendingGetlist(self, request: Request, approver_id: int = Query(..., ge=1),
                                    approver_role: str = Query('manager')):
        """
        获取待审批列表
        GET /api/leave/pending/getlist
        参数: approver_id, approver_role (manager/hr/admin)
        """
        return self.business.get_pending_approvals(approver_id, approver_role)

    def ActionLeaveApprovePost(self, request: Request, body: LeaveApproveRequest):
        """
        批准请假申请
        POST /api/leave/approve
        """
        return self.business.approve_leave(
            body.request_id,
            body.approver_id,
            body.approver_role,
            body.comment
        )

    def ActionLeaveRejectPost(self, request: Request, body: LeaveRejectRequest):
        """
        驳回请假申请
        POST /api/leave/reject
        """
        return self.business.reject_leave(
            body.request_id,
            body.approver_id,
            body.approver_role,
            body.comment
        )

    def ActionLeaveCalendarGet(self, request: Request, employee_id: int = Query(..., ge=1),
                                 year: int = Query(...), month: int = Query(..., ge=1, le=12)):
        """
        获取请假日历数据
        GET /api/leave/calendar/get
        参数: employee_id, year, month
        """
        return self.business.get_leave_calendar(employee_id, year, month)

    def ActionLeaveStatisticsGet(self, request: Request, year: Optional[int] = Query(None),
                                   month: Optional[int] = Query(None, ge=1, le=12),
                                   department: Optional[str] = Query(None)):
        """
        获取HR统计数据
        GET /api/leave/statistics/get
        参数: year, month, department (均可选)
        """
        return self.business.get_hr_statistics(year, month, department)

    def ActionLeaveExportGet(self, request: Request, year: int = Query(...),
                               month: int = Query(..., ge=1, le=12)):
        """
        导出月度考勤报表CSV
        GET /api/leave/export/get
        参数: year, month
        """
        csv_content = self.business.export_monthly_csv(year, month)
        filename = f"leave_report_{year}_{month:02d}.csv"
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv; charset=utf-8-sig",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    def ActionLeaveSeedPost(self, request: Request):
        """
        初始化种子数据
        POST /api/leave/seed
        """
        return self.business.init_seed_data()

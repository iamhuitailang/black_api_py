from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.schedule import ScheduleBusiness


class ShiftCreateRequest(BaseModel):
    name: str
    start_time: str
    end_time: str
    color: Optional[str] = '#cccccc'


class ShiftUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    color: Optional[str] = None


class StaffCreateRequest(BaseModel):
    name: str
    role: Optional[str] = 'staff'


class StaffUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    role: Optional[str] = None


class ScheduleUpdateRequest(BaseModel):
    staff_id: int
    date: str
    shift_id: int


class ScheduleGenerateRequest(BaseModel):
    start_date: str
    weeks: Optional[int] = 4
    max_night_per_week: Optional[int] = 2
    min_rest_days: Optional[int] = 1


class SwapCreateRequest(BaseModel):
    requester_id: int
    target_id: int
    date: str
    target_date: str


class SwapProcessRequest(BaseModel):
    request_id: int
    staff_id: int


class ScheduleController:
    def __init__(self):
        self.business = ScheduleBusiness()

    def ActionShiftGetlist(self, request: Request):
        """
        获取所有班次
        GET /api/shift/getlist
        """
        return self.business.get_shifts()

    def ActionShiftSet(self, request: Request, body: ShiftCreateRequest):
        """
        创建班次
        POST /api/shift/set
        """
        return self.business.create_shift(body.name, body.start_time, body.end_time, body.color)

    def ActionShiftUpdatePost(self, request: Request, body: ShiftUpdateRequest):
        """
        更新班次
        POST /api/shift/update
        """
        return self.business.update_shift(body.id, body.name, body.start_time, body.end_time, body.color)

    def ActionShiftDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除班次
        DELETE /api/shift/delete
        """
        return self.business.delete_shift(id)

    def ActionStaffGetlist(self, request: Request):
        """
        获取所有员工
        GET /api/staff/getlist
        """
        return self.business.get_staff()

    def ActionStaffSet(self, request: Request, body: StaffCreateRequest):
        """
        创建员工
        POST /api/staff/set
        """
        return self.business.create_staff(body.name, body.role)

    def ActionStaffUpdatePost(self, request: Request, body: StaffUpdateRequest):
        """
        更新员工
        POST /api/staff/update
        """
        return self.business.update_staff(body.id, body.name, body.role)

    def ActionStaffDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除员工
        DELETE /api/staff/delete
        """
        return self.business.delete_staff(id)

    def ActionScheduleGetpersonal(self, request: Request, staff_id: int = Query(..., ge=1),
                                   start_date: str = Query(...), end_date: str = Query(...)):
        """
        获取个人排班
        GET /api/schedule/getpersonal
        """
        return self.business.get_personal_schedule(staff_id, start_date, end_date)

    def ActionScheduleGetdepartment(self, request: Request, start_date: str = Query(...),
                                     end_date: str = Query(...)):
        """
        获取科室排班
        GET /api/schedule/getdepartment
        """
        return self.business.get_department_schedule(start_date, end_date)

    def ActionScheduleUpdatePost(self, request: Request, body: ScheduleUpdateRequest):
        """
        手动调整排班
        POST /api/schedule/update
        """
        return self.business.update_schedule(body.staff_id, body.date, body.shift_id)

    def ActionScheduleGeneratePost(self, request: Request, body: ScheduleGenerateRequest):
        """
        自动生成排班
        POST /api/schedule/generate
        """
        return self.business.generate_schedule(
            body.start_date,
            body.weeks,
            body.max_night_per_week,
            body.min_rest_days
        )

    def ActionSwapGetlist(self, request: Request, staff_id: Optional[int] = Query(None),
                           status: Optional[str] = Query(None), role: Optional[str] = Query(None)):
        """
        获取换班请求列表
        GET /api/swap/getlist
        """
        return self.business.get_swap_requests(staff_id, status, role)

    def ActionSwapSet(self, request: Request, body: SwapCreateRequest):
        """
        发起换班请求
        POST /api/swap/set
        """
        return self.business.create_swap_request(
            body.requester_id, body.target_id, body.date, body.target_date
        )

    def ActionSwapApprovePost(self, request: Request, body: SwapProcessRequest):
        """
        同意换班
        POST /api/swap/approve
        """
        return self.business.approve_swap_request(body.request_id, body.staff_id)

    def ActionSwapRejectPost(self, request: Request, body: SwapProcessRequest):
        """
        拒绝换班
        POST /api/swap/reject
        """
        return self.business.reject_swap_request(body.request_id, body.staff_id)

    def ActionSwapCancelPost(self, request: Request, body: SwapProcessRequest):
        """
        取消换班请求
        POST /api/swap/cancel
        """
        return self.business.cancel_swap_request(body.request_id, body.staff_id)

    def ActionStatisticsGet(self, request: Request, year: int = Query(...),
                             month: int = Query(..., ge=1, le=12)):
        """
        获取统计数据
        GET /api/statistics/get
        """
        return self.business.get_statistics(year, month)

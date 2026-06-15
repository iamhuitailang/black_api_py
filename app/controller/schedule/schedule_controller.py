from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel
from app.business.schedule import ScheduleBusiness


class LoginRequest(BaseModel):
    name: str
    password: str


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
    password: Optional[str] = '123456'


class StaffUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


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

    def _get_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def ActionScheduleLoginPost(self, request: Request, body: LoginRequest):
        """
        登录接口
        POST /api/schedule/login
        """
        return self.business.login(body.name, body.password)

    def ActionScheduleLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        登出接口
        POST /api/schedule/logout
        """
        token = self._get_token(request, authorization)
        return self.business.logout(token)

    def ActionScheduleCurrentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前登录用户
        GET /api/schedule/current/user/get
        """
        token = self._get_token(request, authorization)
        return self.business.get_current_staff(token)

    def ActionShiftGetlist(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有班次
        GET /api/shift/getlist
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.get_shifts()

    def ActionShiftSet(self, request: Request, body: ShiftCreateRequest, authorization: Optional[str] = Header(None)):
        """
        创建班次（管理员）
        POST /api/shift/set
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.create_shift(body.name, body.start_time, body.end_time, body.color)

    def ActionShiftUpdatePost(self, request: Request, body: ShiftUpdateRequest, authorization: Optional[str] = Header(None)):
        """
        更新班次（管理员）
        POST /api/shift/update
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.update_shift(body.id, body.name, body.start_time, body.end_time, body.color)

    def ActionShiftDelete(self, request: Request, id: int = Query(..., ge=1), authorization: Optional[str] = Header(None)):
        """
        删除班次（管理员）
        DELETE /api/shift/delete
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.delete_shift(id)

    def ActionStaffGetlist(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有员工
        GET /api/staff/getlist
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.get_staff()

    def ActionStaffSet(self, request: Request, body: StaffCreateRequest, authorization: Optional[str] = Header(None)):
        """
        创建员工（管理员）
        POST /api/staff/set
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.create_staff(body.name, body.role, body.password)

    def ActionStaffUpdatePost(self, request: Request, body: StaffUpdateRequest, authorization: Optional[str] = Header(None)):
        """
        更新员工（管理员）
        POST /api/staff/update
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.update_staff(body.id, body.name, body.role, body.password)

    def ActionStaffDelete(self, request: Request, id: int = Query(..., ge=1), authorization: Optional[str] = Header(None)):
        """
        删除员工（管理员）
        DELETE /api/staff/delete
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.delete_staff(id)

    def ActionScheduleGetpersonal(self, request: Request, staff_id: int = Query(..., ge=1),
                                   start_date: str = Query(...), end_date: str = Query(...),
                                   authorization: Optional[str] = Header(None)):
        """
        获取个人排班
        GET /api/schedule/getpersonal
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.get_personal_schedule(staff_id, start_date, end_date)

    def ActionScheduleGetdepartment(self, request: Request, start_date: str = Query(...),
                                     end_date: str = Query(...),
                                     authorization: Optional[str] = Header(None)):
        """
        获取科室排班
        GET /api/schedule/getdepartment
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.get_department_schedule(start_date, end_date)

    def ActionScheduleUpdatePost(self, request: Request, body: ScheduleUpdateRequest, authorization: Optional[str] = Header(None)):
        """
        手动调整排班（管理员）
        POST /api/schedule/update
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.update_schedule(body.staff_id, body.date, body.shift_id)

    def ActionScheduleGeneratePost(self, request: Request, body: ScheduleGenerateRequest, authorization: Optional[str] = Header(None)):
        """
        自动生成排班（管理员）
        POST /api/schedule/generate
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token, require_admin=True):
            return {'code': 1, 'message': '无权限操作', 'data': None}
        return self.business.generate_schedule(
            body.start_date,
            body.weeks,
            body.max_night_per_week,
            body.min_rest_days
        )

    def ActionSwapGetlist(self, request: Request, staff_id: Optional[int] = Query(None),
                           status: Optional[str] = Query(None), role: Optional[str] = Query(None),
                           authorization: Optional[str] = Header(None)):
        """
        获取换班请求列表
        GET /api/swap/getlist
        """
        token = self._get_token(request, authorization)
        current_user = self.business._verify_token(token)
        if not current_user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        if current_user['role'] == 'admin':
            role = 'admin'
        return self.business.get_swap_requests(staff_id, status, role)

    def ActionSwapSet(self, request: Request, body: SwapCreateRequest, authorization: Optional[str] = Header(None)):
        """
        发起换班请求
        POST /api/swap/set
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.create_swap_request(
            body.requester_id, body.target_id, body.date, body.target_date
        )

    def ActionSwapApprovePost(self, request: Request, body: SwapProcessRequest, authorization: Optional[str] = Header(None)):
        """
        同意换班
        POST /api/swap/approve
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.approve_swap_request(body.request_id, body.staff_id)

    def ActionSwapRejectPost(self, request: Request, body: SwapProcessRequest, authorization: Optional[str] = Header(None)):
        """
        拒绝换班
        POST /api/swap/reject
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.reject_swap_request(body.request_id, body.staff_id)

    def ActionSwapCancelPost(self, request: Request, body: SwapProcessRequest, authorization: Optional[str] = Header(None)):
        """
        取消换班请求
        POST /api/swap/cancel
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.cancel_swap_request(body.request_id, body.staff_id)

    def ActionStatisticsGet(self, request: Request, year: int = Query(...),
                             month: int = Query(..., ge=1, le=12),
                             authorization: Optional[str] = Header(None)):
        """
        获取统计数据
        GET /api/statistics/get
        """
        token = self._get_token(request, authorization)
        if not self.business._verify_token(token):
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.business.get_statistics(year, month)

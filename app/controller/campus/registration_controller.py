from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.campus import RegistrationBusiness, CheckinBusiness


class RegisterRequest(BaseModel):
    activity_id: int
    student_id: int


class CheckinRequest(BaseModel):
    activity_id: int
    student_id: Optional[int] = None
    student_no: Optional[str] = None
    method: Optional[str] = 'qrcode'


class RegistrationController:
    def __init__(self):
        self.reg_biz = RegistrationBusiness()
        self.checkin_biz = CheckinBusiness()

    def ActionCampusRegistrationSet(self, request: Request, body: RegisterRequest):
        """
        活动报名
        POST /api/campus/registration/set
        """
        return self.reg_biz.register(body.activity_id, body.student_id)

    def ActionCampusRegistrationCancel(self, request: Request, id: int = Query(..., ge=1)):
        """
        取消报名
        GET /api/campus/registration/cancel
        """
        return self.reg_biz.cancel(id)

    def ActionCampusRegistrationGetlist(self, request: Request,
                                        activity_id: Optional[int] = Query(None),
                                        student_id: Optional[int] = Query(None)):
        """
        获取报名列表
        GET /api/campus/registration/getlist
        """
        if activity_id:
            return self.reg_biz.list_by_activity(activity_id)
        if student_id:
            return self.reg_biz.list_by_student(student_id)
        return {'code': 1, 'message': '请提供activity_id或student_id', 'data': None}

    def ActionCampusRegistrationCount(self, request: Request, activity_id: int = Query(..., ge=1)):
        """
        获取活动报名统计
        GET /api/campus/registration/count
        """
        return self.reg_biz.count(activity_id)

    def ActionCampusCheckinSet(self, request: Request, body: CheckinRequest):
        """
        活动签到
        POST /api/campus/checkin/set
        """
        return self.checkin_biz.do_checkin(body.activity_id, body.student_id, body.student_no, body.method)

    def ActionCampusCheckinGetlist(self, request: Request, activity_id: int = Query(..., ge=1)):
        """
        获取签到列表
        GET /api/campus/checkin/getlist
        """
        return self.checkin_biz.list_by_activity(activity_id)

    def ActionCampusCheckinGetstats(self, request: Request, activity_id: int = Query(..., ge=1)):
        """
        获取签到统计
        GET /api/campus/checkin/getstats
        """
        return self.checkin_biz.get_stats(activity_id)

    def ActionCampusCheckinMarkabsent(self, request: Request, activity_id: int = Query(..., ge=1)):
        """
        批量标记未出席
        GET /api/campus/checkin/markabsent
        """
        return self.checkin_biz.mark_absent_batch(activity_id)

from typing import Optional
from fastapi import APIRouter, Query, Request, File, UploadFile, Form
from pydantic import BaseModel
from app.business.campus import ActivityBusiness


class ActivityCreateRequest(BaseModel):
    name: str
    type: str
    description: Optional[str] = ''
    venue_id: int
    start_time: str
    end_time: str
    expected_count: int = 50
    organizer_id: Optional[int] = None
    organizer_name: Optional[str] = ''
    organizer_department: Optional[str] = ''
    contact_person: str
    contact_phone: str
    plan_file: Optional[str] = ''


class ActivityApproveRequest(BaseModel):
    id: int
    approved: bool
    reason: Optional[str] = ''


class ActivityCancelRequest(BaseModel):
    id: int
    reason: Optional[str] = ''


class CampusController:
    def __init__(self):
        self.activity_biz = ActivityBusiness()

    def ActionCampusActivityGet(self, request: Request, id: Optional[int] = Query(None)):
        """
        获取活动详情
        GET /api/campus/activity/get
        """
        if id:
            return self.activity_biz.get_detail(id)
        return {'code': 1, 'message': 'id不能为空', 'data': None}

    def ActionCampusActivityGetlist(self, request: Request,
                                    page: int = Query(1, ge=1),
                                    page_size: int = Query(10, ge=1, le=100),
                                    status: Optional[int] = Query(None),
                                    type: Optional[str] = Query(None),
                                    department: Optional[str] = Query(None),
                                    semester: Optional[str] = Query(None),
                                    keyword: Optional[str] = Query(None)):
        """
        获取活动列表（分页）
        GET /api/campus/activity/getlist
        """
        return self.activity_biz.get_list(page, page_size, status, type, department, semester, keyword)

    def ActionCampusCalendarGet(self, request: Request,
                                start: str = Query(...),
                                end: str = Query(...),
                                type: Optional[str] = Query(None),
                                department: Optional[str] = Query(None)):
        """
        获取日历活动
        GET /api/campus/calendar/get
        """
        return self.activity_biz.get_calendar(start, end, type, department)

    def ActionCampusConflictCheck(self, request: Request,
                                  venue_id: int = Query(...),
                                  start_time: str = Query(...),
                                  end_time: str = Query(...),
                                  exclude_id: Optional[int] = Query(None)):
        """
        检查场地冲突
        GET /api/campus/conflict/check
        """
        return self.activity_biz.check_conflict(venue_id, start_time, end_time, exclude_id)

    def ActionCampusActivitySet(self, request: Request, body: ActivityCreateRequest):
        """
        申报活动
        POST /api/campus/activity/set
        """
        data = body.dict()
        return self.activity_biz.create_activity(data)

    def ActionCampusActivityApprove(self, request: Request, body: ActivityApproveRequest):
        """
        审批活动
        POST /api/campus/activity/approve
        """
        return self.activity_biz.approve(body.id, body.approved, body.reason)

    def ActionCampusActivityCancel(self, request: Request, body: ActivityCancelRequest):
        """
        取消活动
        POST /api/campus/activity/cancel
        """
        return self.activity_biz.cancel(body.id, body.reason)

    def ActionCampusActivityComplete(self, request: Request, id: int = Query(..., ge=1)):
        """
        标记活动完成
        GET /api/campus/activity/complete
        """
        return self.activity_biz.mark_completed(id)

from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.campus import VenueBusiness, StudentBusiness, OrganizerBusiness


class VenueController:
    def __init__(self):
        self.venue_biz = VenueBusiness()
        self.student_biz = StudentBusiness()
        self.organizer_biz = OrganizerBusiness()

    def ActionCampusVenueGetlist(self, request: Request):
        """
        获取场地列表
        GET /api/campus/venue/getlist
        """
        return self.venue_biz.get_list()

    def ActionCampusVenueGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取场地详情
        GET /api/campus/venue/get
        """
        return self.venue_biz.get_detail(id)

    def ActionCampusStudentGetlist(self, request: Request,
                                   department: Optional[str] = Query(None),
                                   keyword: Optional[str] = Query(None)):
        """
        获取学生列表
        GET /api/campus/student/getlist
        """
        return self.student_biz.get_list(department, keyword)

    def ActionCampusStudentGet(self, request: Request, student_no: str = Query(...)):
        """
        根据学号获取学生
        GET /api/campus/student/get
        """
        return self.student_biz.get_by_no(student_no)

    def ActionCampusOrganizerGetlist(self, request: Request):
        """
        获取主办方列表
        GET /api/campus/organizer/getlist
        """
        return self.organizer_biz.get_list()

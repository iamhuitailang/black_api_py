from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.career_talk import CareerTalkBusiness, RegistrationBusiness, CheckinBusiness, FeedbackBusiness


class TalkCreateRequest(BaseModel):
    company_name: str = Field(..., description="公司名称")
    talk_time: str = Field(..., description="宣讲时间")
    location: str = Field(..., description="宣讲地点")
    description: Optional[str] = Field(default='', description="宣讲简介")
    short_code: Optional[str] = Field(default=None, description="短码")


class TalkUpdateRequest(BaseModel):
    id: int = Field(..., description="宣讲会ID")
    company_name: Optional[str] = Field(default=None, description="公司名称")
    talk_time: Optional[str] = Field(default=None, description="宣讲时间")
    location: Optional[str] = Field(default=None, description="宣讲地点")
    description: Optional[str] = Field(default=None, description="宣讲简介")
    short_code: Optional[str] = Field(default=None, description="短码")
    status: Optional[int] = Field(default=None, description="状态 1=启用 0=禁用")


class RegisterRequest(BaseModel):
    talk_id: int = Field(..., description="宣讲会ID")
    student_id: str = Field(..., description="学号")
    student_name: str = Field(..., description="姓名")
    phone: Optional[str] = Field(default='', description="手机号")
    major: Optional[str] = Field(default='', description="专业")


class CheckinByStudentIdRequest(BaseModel):
    talk_id: int = Field(..., description="宣讲会ID")
    student_id: str = Field(..., description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")


class CheckinByShortCodeRequest(BaseModel):
    short_code: str = Field(..., description="宣讲会短码")
    student_id: str = Field(..., description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")


class FeedbackSubmitRequest(BaseModel):
    talk_id: int = Field(..., description="宣讲会ID")
    student_id: str = Field(..., description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")
    rating: int = Field(..., ge=1, le=5, description="评分 1-5")
    content: Optional[str] = Field(default='', description="反馈内容")


class CareerTalkController:
    def __init__(self):
        self.talk_business = CareerTalkBusiness()
        self.registration_business = RegistrationBusiness()
        self.checkin_business = CheckinBusiness()
        self.feedback_business = FeedbackBusiness()

    def ActionCareerTalkListGet(self, request: Request, 
                                page: int = Query(default=1, ge=1, description="页码"),
                                page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                keyword: str = Query(default=None, description="搜索关键词"),
                                status: int = Query(default=None, description="状态 1=启用 0=禁用")):
        """
        获取宣讲会列表
        GET /api/career_talk/list/get
        """
        return self.talk_business.get_talk_list(
            page=page, page_size=page_size, keyword=keyword, status=status
        )

    def ActionCareerTalkDetailGet(self, request: Request, 
                                  id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取宣讲会详情
        GET /api/career_talk/detail/get
        """
        return self.talk_business.get_talk_detail(id)

    def ActionCareerTalkDetailByCodeGet(self, request: Request, 
                                        short_code: str = Query(..., description="短码")):
        """
        通过短码获取宣讲会详情
        GET /api/career_talk/detail_by_code/get
        """
        return self.talk_business.get_talk_by_short_code(short_code)

    def ActionCareerTalkCreatePost(self, request: Request, body: TalkCreateRequest):
        """
        创建宣讲会
        POST /api/career_talk/create
        """
        return self.talk_business.create_talk(
            company_name=body.company_name,
            talk_time=body.talk_time,
            location=body.location,
            description=body.description,
            short_code=body.short_code
        )

    def ActionCareerTalkUpdatePost(self, request: Request, body: TalkUpdateRequest):
        """
        更新宣讲会
        POST /api/career_talk/update
        """
        return self.talk_business.update_talk(
            talk_id=body.id,
            company_name=body.company_name,
            talk_time=body.talk_time,
            location=body.location,
            description=body.description,
            short_code=body.short_code,
            status=body.status
        )

    def ActionCareerTalkDelete(self, request: Request, 
                               id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        删除宣讲会
        DELETE /api/career_talk/delete
        """
        return self.talk_business.delete_talk(id)

    def ActionCareerTalkRegistrationListGet(self, request: Request,
                                            talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                            page: int = Query(default=1, ge=1, description="页码"),
                                            page_size: int = Query(default=10, ge=1, le=100, description="每页数量")):
        """
        获取报名列表
        GET /api/career_talk/registration/list/get
        """
        return self.registration_business.get_registration_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkMyRegistrationsGet(self, request: Request,
                                           student_id: str = Query(..., description="学号")):
        """
        获取我的报名列表
        GET /api/career_talk/my_registrations/get
        """
        return self.registration_business.get_student_registrations(student_id)

    def ActionCareerTalkRegisterPost(self, request: Request, body: RegisterRequest):
        """
        报名宣讲会
        POST /api/career_talk/register
        """
        return self.registration_business.register(
            talk_id=body.talk_id,
            student_id=body.student_id,
            student_name=body.student_name,
            phone=body.phone,
            major=body.major
        )

    def ActionCareerTalkCancelRegisterPost(self, request: Request, body: dict):
        """
        取消报名
        POST /api/career_talk/cancel_register
        """
        pass

    def ActionCareerTalkRegistrationStatusGet(self, request: Request,
                                              talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                              student_id: str = Query(..., description="学号")):
        """
        查询报名状态
        GET /api/career_talk/registration/status/get
        """
        return self.registration_business.check_registration_status(talk_id, student_id)

    def ActionCareerTalkCheckinListGet(self, request: Request,
                                       talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                       page: int = Query(default=1, ge=1, description="页码"),
                                       page_size: int = Query(default=10, ge=1, le=100, description="每页数量")):
        """
        获取签到列表
        GET /api/career_talk/checkin/list/get
        """
        return self.checkin_business.get_checkin_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkMyCheckinsGet(self, request: Request,
                                      student_id: str = Query(..., description="学号")):
        """
        获取我的签到记录
        GET /api/career_talk/my_checkins/get
        """
        return self.checkin_business.get_student_checkins(student_id)

    def ActionCareerTalkCheckinByStudentIdPost(self, request: Request, body: CheckinByStudentIdRequest):
        """
        学号签到
        POST /api/career_talk/checkin_by_student_id
        """
        return self.checkin_business.checkin_by_student_id(
            talk_id=body.talk_id,
            student_id=body.student_id,
            student_name=body.student_name
        )

    def ActionCareerTalkCheckinByCodePost(self, request: Request, body: CheckinByShortCodeRequest):
        """
        短码签到
        POST /api/career_talk/checkin_by_code
        """
        return self.checkin_business.checkin_by_short_code(
            short_code=body.short_code,
            student_id=body.student_id,
            student_name=body.student_name
        )

    def ActionCareerTalkCheckinStatsGet(self, request: Request,
                                        talk_id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取签到统计
        GET /api/career_talk/checkin/stats/get
        """
        return self.checkin_business.get_checkin_stats(talk_id)

    def ActionCareerTalkFeedbackListGet(self, request: Request,
                                        talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                        page: int = Query(default=1, ge=1, description="页码"),
                                        page_size: int = Query(default=10, ge=1, le=100, description="每页数量")):
        """
        获取反馈列表
        GET /api/career_talk/feedback/list/get
        """
        return self.feedback_business.get_feedback_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkFeedbackStatsGet(self, request: Request,
                                         talk_id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取反馈统计
        GET /api/career_talk/feedback/stats/get
        """
        return self.feedback_business.get_feedback_stats(talk_id)

    def ActionCareerTalkFeedbackSubmitPost(self, request: Request, body: FeedbackSubmitRequest):
        """
        提交反馈
        POST /api/career_talk/feedback/submit
        """
        return self.feedback_business.submit_feedback(
            talk_id=body.talk_id,
            student_id=body.student_id,
            student_name=body.student_name,
            rating=body.rating,
            content=body.content
        )

    def ActionCareerTalkMyFeedbacksGet(self, request: Request,
                                       student_id: str = Query(..., description="学号")):
        """
        获取我的反馈
        GET /api/career_talk/my_feedbacks/get
        """
        return self.feedback_business.get_student_feedback(student_id)

    def ActionCareerTalkFeedbackStatusGet(self, request: Request,
                                          talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                          student_id: str = Query(..., description="学号")):
        """
        查询反馈状态
        GET /api/career_talk/feedback/status/get
        """
        return self.feedback_business.check_feedback_status(talk_id, student_id)

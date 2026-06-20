from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.career_talk import CareerTalkBusiness, RegistrationBusiness, CheckinBusiness, FeedbackBusiness
from app.business.auth import AuthBusiness


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
    student_id: Optional[str] = Field(default=None, description="学号")
    student_name: Optional[str] = Field(default=None, description="姓名")
    phone: Optional[str] = Field(default='', description="手机号")
    major: Optional[str] = Field(default='', description="专业")


class CheckinByStudentIdRequest(BaseModel):
    talk_id: int = Field(..., description="宣讲会ID")
    student_id: Optional[str] = Field(default=None, description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")


class CheckinByShortCodeRequest(BaseModel):
    short_code: str = Field(..., description="宣讲会短码")
    student_id: Optional[str] = Field(default=None, description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")


class FeedbackSubmitRequest(BaseModel):
    talk_id: int = Field(..., description="宣讲会ID")
    student_id: Optional[str] = Field(default=None, description="学号")
    student_name: Optional[str] = Field(default='', description="姓名")
    rating: int = Field(..., ge=1, le=5, description="评分 1-5")
    content: Optional[str] = Field(default='', description="反馈内容")


class CareerTalkController:
    def __init__(self):
        self.talk_business = CareerTalkBusiness()
        self.registration_business = RegistrationBusiness()
        self.checkin_business = CheckinBusiness()
        self.feedback_business = FeedbackBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _require_admin(self, request: Request, authorization: Optional[str]):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 401,
                'message': '请先登录',
                'data': None
            }
        if user.get('role') != 'admin':
            return {
                'code': 403,
                'message': '权限不足，仅管理员可操作',
                'data': None
            }
        return None

    def _require_login(self, request: Request, authorization: Optional[str]):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {
                'code': 401,
                'message': '请先登录',
                'data': None
            }
        return user

    def ActionCareerTalkListGet(self, request: Request, 
                                page: int = Query(default=1, ge=1, description="页码"),
                                page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                keyword: str = Query(default=None, description="搜索关键词"),
                                status: int = Query(default=None, description="状态 1=启用 0=禁用")):
        """
        获取宣讲会列表
        GET /api/career/talk/list/get
        """
        return self.talk_business.get_talk_list(
            page=page, page_size=page_size, keyword=keyword, status=status
        )

    def ActionCareerTalkDetailGet(self, request: Request, 
                                  id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取宣讲会详情
        GET /api/career/talk/detail/get
        """
        return self.talk_business.get_talk_detail(id)

    def ActionCareerTalkDetailByCodeGet(self, request: Request, 
                                        short_code: str = Query(..., description="短码")):
        """
        通过短码获取宣讲会详情
        GET /api/career/talk/detail/by/code/get
        """
        return self.talk_business.get_talk_by_short_code(short_code)

    def ActionCareerTalkCreatePost(self, request: Request, body: TalkCreateRequest, authorization: Optional[str] = Header(None)):
        """
        创建宣讲会
        POST /api/career/talk/create
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
        return self.talk_business.create_talk(
            company_name=body.company_name,
            talk_time=body.talk_time,
            location=body.location,
            description=body.description,
            short_code=body.short_code
        )

    def ActionCareerTalkUpdatePost(self, request: Request, body: TalkUpdateRequest, authorization: Optional[str] = Header(None)):
        """
        更新宣讲会
        POST /api/career/talk/update
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
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
                               id: int = Query(..., ge=1, description="宣讲会ID"),
                               authorization: Optional[str] = Header(None)):
        """
        删除宣讲会
        DELETE /api/career/talk/delete
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
        return self.talk_business.delete_talk(id)

    def ActionCareerTalkRegistrationListGet(self, request: Request,
                                            talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                            page: int = Query(default=1, ge=1, description="页码"),
                                            page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取报名列表
        GET /api/career/talk/registration/list/get
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
        return self.registration_business.get_registration_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkMyRegistrationsGet(self, request: Request,
                                           student_id: str = Query(default=None, description="学号"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取我的报名列表
        GET /api/career/talk/my/registrations/get
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = student_id or user.get('student_id') or user.get('username')
        return self.registration_business.get_student_registrations(actual_student_id)

    def ActionCareerTalkRegisterPost(self, request: Request, body: RegisterRequest, authorization: Optional[str] = Header(None)):
        """
        报名宣讲会
        POST /api/career/talk/register
        需要登录，自动使用登录用户信息
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = body.student_id or user.get('student_id') or user.get('username')
        actual_student_name = body.student_name or user.get('real_name') or user.get('username')
        actual_phone = body.phone or user.get('phone', '')
        actual_major = body.major or user.get('major', '')
        return self.registration_business.register(
            talk_id=body.talk_id,
            student_id=actual_student_id,
            student_name=actual_student_name,
            phone=actual_phone,
            major=actual_major
        )

    def ActionCareerTalkRegistrationStatusGet(self, request: Request,
                                              talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                              student_id: str = Query(default=None, description="学号"),
                                              authorization: Optional[str] = Header(None)):
        """
        查询报名状态
        GET /api/career/talk/registration/status/get
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = student_id or user.get('student_id') or user.get('username')
        return self.registration_business.check_registration_status(talk_id, actual_student_id)

    def ActionCareerTalkCheckinListGet(self, request: Request,
                                       talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                       page: int = Query(default=1, ge=1, description="页码"),
                                       page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取签到列表
        GET /api/career/talk/checkin/list/get
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
        return self.checkin_business.get_checkin_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkMyCheckinsGet(self, request: Request,
                                      student_id: str = Query(default=None, description="学号"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的签到记录
        GET /api/career/talk/my/checkins/get
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = student_id or user.get('student_id') or user.get('username')
        return self.checkin_business.get_student_checkins(actual_student_id)

    def ActionCareerTalkCheckinByStudentIdPost(self, request: Request, body: CheckinByStudentIdRequest, authorization: Optional[str] = Header(None)):
        """
        学号签到
        POST /api/career/talk/checkin/by/student/id
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = body.student_id or user.get('student_id') or user.get('username')
        actual_student_name = body.student_name or user.get('real_name') or user.get('username')
        return self.checkin_business.checkin_by_student_id(
            talk_id=body.talk_id,
            student_id=actual_student_id,
            student_name=actual_student_name
        )

    def ActionCareerTalkCheckinByCodePost(self, request: Request, body: CheckinByShortCodeRequest, authorization: Optional[str] = Header(None)):
        """
        短码签到
        POST /api/career/talk/checkin/by/code
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = body.student_id or user.get('student_id') or user.get('username')
        actual_student_name = body.student_name or user.get('real_name') or user.get('username')
        return self.checkin_business.checkin_by_short_code(
            short_code=body.short_code,
            student_id=actual_student_id,
            student_name=actual_student_name
        )

    def ActionCareerTalkCheckinStatsGet(self, request: Request,
                                        talk_id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取签到统计
        GET /api/career/talk/checkin/stats/get
        """
        return self.checkin_business.get_checkin_stats(talk_id)

    def ActionCareerTalkFeedbackListGet(self, request: Request,
                                        talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                        page: int = Query(default=1, ge=1, description="页码"),
                                        page_size: int = Query(default=10, ge=1, le=100, description="每页数量"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取反馈列表
        GET /api/career/talk/feedback/list/get
        仅管理员可操作
        """
        err = self._require_admin(request, authorization)
        if err:
            return err
        return self.feedback_business.get_feedback_list(
            talk_id=talk_id, page=page, page_size=page_size
        )

    def ActionCareerTalkFeedbackStatsGet(self, request: Request,
                                         talk_id: int = Query(..., ge=1, description="宣讲会ID")):
        """
        获取反馈统计
        GET /api/career/talk/feedback/stats/get
        """
        return self.feedback_business.get_feedback_stats(talk_id)

    def ActionCareerTalkFeedbackSubmitPost(self, request: Request, body: FeedbackSubmitRequest, authorization: Optional[str] = Header(None)):
        """
        提交反馈
        POST /api/career/talk/feedback/submit
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = body.student_id or user.get('student_id') or user.get('username')
        actual_student_name = body.student_name or user.get('real_name') or user.get('username')
        return self.feedback_business.submit_feedback(
            talk_id=body.talk_id,
            student_id=actual_student_id,
            student_name=actual_student_name,
            rating=body.rating,
            content=body.content
        )

    def ActionCareerTalkMyFeedbacksGet(self, request: Request,
                                       student_id: str = Query(default=None, description="学号"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取我的反馈
        GET /api/career/talk/my/feedbacks/get
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = student_id or user.get('student_id') or user.get('username')
        return self.feedback_business.get_student_feedback(actual_student_id)

    def ActionCareerTalkFeedbackStatusGet(self, request: Request,
                                          talk_id: int = Query(..., ge=1, description="宣讲会ID"),
                                          student_id: str = Query(default=None, description="学号"),
                                          authorization: Optional[str] = Header(None)):
        """
        查询反馈状态
        GET /api/career/talk/feedback/status/get
        需要登录
        """
        user = self._require_login(request, authorization)
        if isinstance(user, dict) and user.get('code'):
            return user
        actual_student_id = student_id or user.get('student_id') or user.get('username')
        return self.feedback_business.check_feedback_status(talk_id, actual_student_id)

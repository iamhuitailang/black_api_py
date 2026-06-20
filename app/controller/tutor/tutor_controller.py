from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from app.business.auth import AuthBusiness
from app.business.tutor import TutorBusiness
from app.model.tutor import TutorUserProfileModel


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    role: str = Field(..., description="角色: parent 或 teacher")
    real_name: Optional[str] = Field("", description="真实姓名")
    phone: Optional[str] = Field("", description="手机号")
    grade: Optional[str] = Field("", description="年级（家长填孩子年级，教师填可教授年级）")
    subjects: Optional[str] = Field("", description="擅长/需要科目，逗号分隔")
    available_times: Optional[str] = Field("", description="空闲时段，逗号分隔")
    introduction: Optional[str] = Field("", description="个人简介")
    location: Optional[str] = Field("", description="位置")
    budget_min: Optional[int] = Field(0, description="最低预算/时薪")
    budget_max: Optional[int] = Field(0, description="最高预算/时薪")


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)
    grade: Optional[str] = Field(None)
    subjects: Optional[str] = Field(None)
    available_times: Optional[str] = Field(None)
    introduction: Optional[str] = Field(None)
    location: Optional[str] = Field(None)
    budget_min: Optional[int] = Field(None)
    budget_max: Optional[int] = Field(None)


class CreateDemandRequest(BaseModel):
    subject: str = Field(..., description="科目")
    grade: str = Field(..., description="年级")
    frequency: Optional[str] = Field("", description="上课频率")
    budget_min: Optional[int] = Field(0, description="最低预算/时薪")
    budget_max: Optional[int] = Field(0, description="最高预算/时薪")
    preferred_times: Optional[str] = Field("", description="期望时段，逗号分隔")
    description: Optional[str] = Field("", description="备注")


class UpdateDemandRequest(BaseModel):
    subject: Optional[str] = Field(None)
    grade: Optional[str] = Field(None)
    frequency: Optional[str] = Field(None)
    budget_min: Optional[int] = Field(None)
    budget_max: Optional[int] = Field(None)
    preferred_times: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    status: Optional[str] = Field(None)


class CreateCourseRequest(BaseModel):
    parent_id: int = Field(..., description="家长ID")
    teacher_id: int = Field(..., description="教师ID")
    subject: str = Field(..., description="科目")
    grade: Optional[str] = Field("", description="年级")
    demand_id: Optional[int] = Field(None, description="关联需求ID")
    course_date: str = Field(..., description="上课日期 YYYY-MM-DD")
    start_time: str = Field(..., description="开始时间 HH:MM")
    end_time: str = Field(..., description="结束时间 HH:MM")
    location: Optional[str] = Field("", description="上课地点")
    price: Optional[int] = Field(0, description="课时费")
    notes: Optional[str] = Field("", description="备注")


class TutorController:
    def __init__(self):
        self.auth_business = AuthBusiness()
        self.tutor_business = TutorBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, request: Request, authorization: Optional[str]):
        token = self._get_token(request, authorization)
        if not token:
            return None
        return self.auth_business.verify_token(token)

    def _get_user_profile(self, user_id: int):
        return self.tutor_business.profile_model.get_by_user_id(user_id)

    def ActionTutorRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册
        POST /api/tutor/register
        """
        return self.tutor_business.register(
            username=body.username,
            password=body.password,
            role=body.role,
            real_name=body.real_name,
            phone=body.phone,
            grade=body.grade,
            subjects=body.subjects,
            available_times=body.available_times,
            introduction=body.introduction,
            location=body.location,
            budget_min=body.budget_min,
            budget_max=body.budget_max
        )

    def ActionTutorLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录
        POST /api/tutor/login
        """
        return self.tutor_business.login(body.username, body.password)

    def ActionTutorProfileGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前用户信息
        GET /api/tutor/profile/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.tutor_business.get_profile(user.get('id'))

    def ActionTutorProfileUpdatePost(self, request: Request, body: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
        """
        更新个人资料
        POST /api/tutor/profile/update
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        kwargs = {}
        for key in ['real_name', 'phone', 'grade', 'subjects', 'available_times',
                    'introduction', 'location', 'budget_min', 'budget_max']:
            val = getattr(body, key, None)
            if val is not None:
                kwargs[key] = val
        return self.tutor_business.update_profile(user.get('id'), **kwargs)

    def ActionTutorDemandCreatePost(self, request: Request, body: CreateDemandRequest, authorization: Optional[str] = Header(None)):
        """
        家长发布需求
        POST /api/tutor/demand/create
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.tutor_business.create_demand(
            parent_id=user.get('id'),
            subject=body.subject,
            grade=body.grade,
            frequency=body.frequency,
            budget_min=body.budget_min,
            budget_max=body.budget_max,
            preferred_times=body.preferred_times,
            description=body.description
        )

    def ActionTutorDemandMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我发布的需求列表
        GET /api/tutor/demand/my/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.tutor_business.list_my_demands(user.get('id'))

    def ActionTutorDemandListGet(self, request: Request):
        """
        获取所有活跃需求列表
        GET /api/tutor/demand/list/get
        """
        return self.tutor_business.list_active_demands()

    def ActionTutorDemandUpdatePost(self, request: Request, body: UpdateDemandRequest, authorization: Optional[str] = Header(None)):
        """
        更新需求信息
        POST /api/tutor/demand/update
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}

        demand_id = request.query_params.get('id') or body.dict().get('id')
        if not demand_id:
            return {'code': 1, 'message': '缺少需求ID', 'data': None}

        kwargs = {}
        for key in ['subject', 'grade', 'frequency', 'budget_min', 'budget_max',
                    'preferred_times', 'description', 'status']:
            val = getattr(body, key, None)
            if val is not None:
                kwargs[key] = val
        return self.tutor_business.update_demand(int(demand_id), user.get('id'), **kwargs)

    def ActionTutorDemandDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        删除需求
        POST /api/tutor/demand/delete
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        demand_id = request.query_params.get('id')
        if not demand_id:
            return {'code': 1, 'message': '缺少需求ID', 'data': None}
        return self.tutor_business.delete_demand(int(demand_id), user.get('id'))

    def ActionTutorTeacherListGet(self, request: Request):
        """
        获取所有教师列表
        GET /api/tutor/teacher/list/get
        """
        return self.tutor_business.list_teachers()

    def ActionTutorTeacherDetailGet(self, request: Request):
        """
        获取教师详情
        GET /api/tutor/teacher/detail/get
        """
        teacher_id = request.query_params.get('id')
        if not teacher_id:
            return {'code': 1, 'message': '缺少教师ID', 'data': None}
        return self.tutor_business.get_teacher_detail(int(teacher_id))

    def ActionTutorMatchTeachersGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        为需求匹配教师（家长使用）
        GET /api/tutor/match/teachers/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        demand_id = request.query_params.get('demand_id')
        if not demand_id:
            return {'code': 1, 'message': '缺少需求ID', 'data': None}
        return self.tutor_business.match_teachers_for_demand(int(demand_id))

    def ActionTutorMatchDemandsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        为教师匹配合适的需求
        GET /api/tutor/match/demands/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.tutor_business.match_demands_for_teacher(user.get('id'))

    def ActionTutorCourseCreatePost(self, request: Request, body: CreateCourseRequest, authorization: Optional[str] = Header(None)):
        """
        创建课程安排
        POST /api/tutor/course/create
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.tutor_business.create_course(
            current_user_id=user.get('id'),
            parent_id=body.parent_id,
            teacher_id=body.teacher_id,
            subject=body.subject,
            grade=body.grade,
            demand_id=body.demand_id,
            course_date=body.course_date,
            start_time=body.start_time,
            end_time=body.end_time,
            location=body.location,
            price=body.price,
            notes=body.notes
        )

    def ActionTutorCourseMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的课程列表
        GET /api/tutor/course/my/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        profile = self._get_user_profile(user.get('id'))
        role = profile.get('role') if profile else 'parent'
        return self.tutor_business.list_my_courses(user.get('id'), role)

    def ActionTutorCourseWeekGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取周视图课程列表
        GET /api/tutor/course/week/get
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        profile = self._get_user_profile(user.get('id'))
        role = profile.get('role') if profile else 'parent'
        week_start = request.query_params.get('week_start')
        week_end = request.query_params.get('week_end')
        if not week_start or not week_end:
            return {'code': 1, 'message': '缺少周起止日期', 'data': None}
        return self.tutor_business.list_courses_by_week(user.get('id'), role, week_start, week_end)

    def ActionTutorCourseConfirmPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        确认课程
        POST /api/tutor/course/confirm
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        course_id = request.query_params.get('id')
        if not course_id:
            return {'code': 1, 'message': '缺少课程ID', 'data': None}
        return self.tutor_business.confirm_course(int(course_id), user.get('id'))

    def ActionTutorCourseCancelPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        取消课程
        POST /api/tutor/course/cancel
        """
        user = self._get_current_user(request, authorization)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        course_id = request.query_params.get('id')
        if not course_id:
            return {'code': 1, 'message': '缺少课程ID', 'data': None}
        return self.tutor_business.cancel_course(int(course_id), user.get('id'))

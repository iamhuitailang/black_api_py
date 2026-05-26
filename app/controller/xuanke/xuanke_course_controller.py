from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCourseRequest(BaseModel):
    course_code: str = Field(..., description="课程代码")
    course_name: str = Field(..., description="课程名称")
    teacher: str = Field(..., description="授课教师")
    credits: int = Field(..., description="学分")
    hours: int = Field(..., description="学时")
    max_students: int = Field(..., description="人数上限")
    schedule: str = Field(..., description="上课时间")
    location: str = Field(..., description="上课地点")
    course_type: str = Field('elective', description="课程类型")
    description: Optional[str] = Field(None, description="课程描述")
    syllabus: Optional[str] = Field(None, description="课程大纲")
    assessment: Optional[str] = Field(None, description="考核方式")
    textbook: Optional[str] = Field(None, description="教材")
    prerequisites: Optional[str] = Field(None, description="先修课程")
    semester: Optional[str] = Field(None, description="学期")


class UpdateCourseRequest(BaseModel):
    course_name: Optional[str] = Field(None, description="课程名称")
    teacher: Optional[str] = Field(None, description="授课教师")
    credits: Optional[int] = Field(None, description="学分")
    hours: Optional[int] = Field(None, description="学时")
    max_students: Optional[int] = Field(None, description="人数上限")
    schedule: Optional[str] = Field(None, description="上课时间")
    location: Optional[str] = Field(None, description="上课地点")
    course_type: Optional[str] = Field(None, description="课程类型")
    description: Optional[str] = Field(None, description="课程描述")
    syllabus: Optional[str] = Field(None, description="课程大纲")
    assessment: Optional[str] = Field(None, description="考核方式")
    textbook: Optional[str] = Field(None, description="教材")
    prerequisites: Optional[str] = Field(None, description="先修课程")
    status: Optional[str] = Field(None, description="状态")


class XuankeCourseController:
    def __init__(self):
        from app.business.xuanke.course_business import XuankeCourseBusiness
        self.course_business = XuankeCourseBusiness()
        from app.business.xuanke.user_business import XuankeUserBusiness
        self.user_business = XuankeUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXuankeCourseListGet(self, request: Request, page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量"),
                             course_type: Optional[str] = Query(None, description="课程类型"),
                             teacher: Optional[str] = Query(None, description="授课教师"),
                             status: Optional[str] = Query(None, description="状态"),
                             keyword: Optional[str] = Query(None, description="关键词"),
                             schedule: Optional[str] = Query(None, description="上课时间"),
                             credits: Optional[int] = Query(None, description="学分"),
                             authorization: Optional[str] = Header(None)):
        """
        获取课程列表接口
        GET /api/xuanke/course/list/get
        分页获取课程列表，支持筛选
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.course_business.get_course_list(
            page=page,
            page_size=page_size,
            course_type=course_type,
            teacher=teacher,
            status=status,
            keyword=keyword,
            schedule=schedule,
            credits=credits,
            user_id=user_id
        )

    def ActionXuankeCourseAllGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有课程接口
        GET /api/xuanke/course/all/get
        获取所有课程，不分页
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.course_business.get_all_courses(user_id)

    def ActionXuankeCourseDetailGet(self, request: Request, course_id: int = Query(..., description="课程ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取课程详情接口
        GET /api/xuanke/course/detail/get
        根据课程ID获取课程详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.course_business.get_course_detail(course_id, user_id)

    def ActionXuankeCourseCreatePost(self, request: Request, body: CreateCourseRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建课程接口
        POST /api/xuanke/course/create
        管理员创建新课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = body.model_dump()
        return self.course_business.create_course(data)

    def ActionXuankeCourseUpdatePost(self, request: Request, body: UpdateCourseRequest,
                                 course_id: int = Query(..., description="课程ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新课程接口
        POST /api/xuanke/course/update
        管理员更新课程信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.course_business.update_course(course_id, data)

    def ActionXuankeCourseDeletePost(self, request: Request, course_id: int = Query(..., description="课程ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除课程接口
        POST /api/xuanke/course/delete
        管理员删除课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.course_business.delete_course(course_id)

    def ActionXuankeCourseTeachersGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有教师接口
        GET /api/xuanke/course/teachers/get
        获取所有授课教师列表
        """
        return self.course_business.get_teachers()

    def ActionXuankeCourseStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取课程统计接口
        GET /api/xuanke/course/statistics/get
        获取课程统计信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.course_business.get_statistics()

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCourseRequest(BaseModel):
    title: str = Field(..., description="课程名称")
    description: Optional[str] = Field('', description="课程描述")
    coach: Optional[str] = Field('', description="教练")
    category: Optional[str] = Field('', description="分类")
    start_time: str = Field(..., description="开始时间")
    end_time: str = Field(..., description="结束时间")
    max_capacity: Optional[int] = Field(20, description="最大容量")
    location: Optional[str] = Field('', description="上课地点")
    image: Optional[str] = Field('', description="封面图片")
    status: Optional[int] = Field(1, description="状态")


class UpdateCourseRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")
    title: Optional[str] = Field(None, description="课程名称")
    description: Optional[str] = Field(None, description="课程描述")
    coach: Optional[str] = Field(None, description="教练")
    category: Optional[str] = Field(None, description="分类")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    max_capacity: Optional[int] = Field(None, description="最大容量")
    location: Optional[str] = Field(None, description="上课地点")
    image: Optional[str] = Field(None, description="封面图片")
    status: Optional[int] = Field(None, description="状态")


class DeleteCourseRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")


class UpdateCourseStatusRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")
    status: int = Field(..., description="状态")


class JianshenCourseController:
    def __init__(self):
        from app.business.jianshen_077.course_business import CourseBusiness
        self.course_business = CourseBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        return JianshenAuthBusiness().verify_token(token)

    def ActionJianshenCourseListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     category: Optional[str] = Query(None, description="分类"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     keyword: Optional[str] = Query(None, description="搜索关键词"),
                                     coach: Optional[str] = Query(None, description="教练"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取课程列表接口
        GET /api/jianshen/course/list/get
        获取课程列表，支持筛选和搜索
        """
        return self.course_business.get_course_list(
            page=page,
            page_size=page_size,
            category=category,
            status=status,
            keyword=keyword,
            coach=coach
        )

    def ActionJianshenCourseDetailGet(self, request: Request,
                                       course_id: int = Query(..., description="课程ID")):
        """
        获取课程详情接口
        GET /api/jianshen/course/detail/get
        根据课程ID获取课程详情
        """
        return self.course_business.get_course_detail(course_id)

    def ActionJianshenCourseCreatePost(self, request: Request, body: CreateCourseRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        创建课程接口
        POST /api/jianshen/course/create
        管理员创建新课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.course_business.create_course(
            title=body.title,
            description=body.description or '',
            coach=body.coach or '',
            category=body.category or '',
            start_time=body.start_time,
            end_time=body.end_time,
            max_capacity=body.max_capacity or 20,
            location=body.location or '',
            image=body.image or '',
            status=body.status if body.status is not None else 1
        )

    def ActionJianshenCourseUpdatePost(self, request: Request, body: UpdateCourseRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新课程接口
        POST /api/jianshen/course/update
        管理员更新课程信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.coach is not None:
            data['coach'] = body.coach
        if body.category is not None:
            data['category'] = body.category
        if body.start_time is not None:
            data['start_time'] = body.start_time
        if body.end_time is not None:
            data['end_time'] = body.end_time
        if body.max_capacity is not None:
            data['max_capacity'] = body.max_capacity
        if body.location is not None:
            data['location'] = body.location
        if body.image is not None:
            data['image'] = body.image
        if body.status is not None:
            data['status'] = body.status

        return self.course_business.update_course(body.course_id, data)

    def ActionJianshenCourseDeletePost(self, request: Request, body: DeleteCourseRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        删除课程接口
        POST /api/jianshen/course/delete
        管理员删除课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.course_business.delete_course(body.course_id)

    def ActionJianshenCourseStatusUpdatePost(self, request: Request, body: UpdateCourseStatusRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        更新课程状态接口
        POST /api/jianshen/course/status/update
        管理员更新课程状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.course_business.update_course_status(body.course_id, body.status)

    def ActionJianshenCourseCategoriesGet(self, request: Request):
        """
        获取课程分类接口
        GET /api/jianshen/course/categories/get
        获取所有课程分类
        """
        return self.course_business.get_categories()

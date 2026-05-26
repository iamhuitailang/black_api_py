from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class EnrollRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")


class DropRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")


class XuankeEnrollmentController:
    def __init__(self):
        from app.business.xuanke.enrollment_business import XuankeEnrollmentBusiness
        self.enrollment_business = XuankeEnrollmentBusiness()
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

    def ActionXuankeEnrollmentEnrollPost(self, request: Request, body: EnrollRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        选课接口
        POST /api/xuanke/enrollment/enroll
        学生选择课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.enrollment_business.enroll_course(
            user_id=user.get('id'),
            course_id=body.course_id
        )

    def ActionXuankeEnrollmentDropPost(self, request: Request, body: DropRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        退课接口
        POST /api/xuanke/enrollment/drop
        学生退选课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.enrollment_business.drop_course(
            user_id=user.get('id'),
            course_id=body.course_id
        )

    def ActionXuankeEnrollmentMyCoursesGet(self, request: Request,
                                         status: Optional[str] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取我的课程接口
        GET /api/xuanke/enrollment/mycourses/get
        获取当前用户已选课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.enrollment_business.get_my_courses(
            user_id=user.get('id'),
            status=status
        )

    def ActionXuankeEnrollmentScheduleGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的课表接口
        GET /api/xuanke/enrollment/schedule/get
        获取当前用户的课表视图
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.enrollment_business.get_schedule(user_id=user.get('id'))

    def ActionXuankeEnrollmentCourseStudentsGet(self, request: Request,
                                             course_id: int = Query(..., description="课程ID"),
                                             page: int = Query(1, description="页码"),
                                             page_size: int = Query(10, description="每页数量"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取课程选课学生接口
        GET /api/xuanke/enrollment/course/students/get
        获取某门课程的选课学生列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') not in ['admin', 'teacher']:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.enrollment_business.get_course_enrollments(course_id, page, page_size)

    def ActionXuankeEnrollmentPhaseGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前选课阶段接口
        GET /api/xuanke/enrollment/phase/get
        获取当前选课阶段信息
        """
        return self.enrollment_business.get_selection_phase()

    def ActionXuankeEnrollmentBatchRequiredPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        一键选择必修课接口
        POST /api/xuanke/enrollment/batch/required
        一键选择所有必修课
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.enrollment_business.batch_enroll_required(user_id=user.get('id'))

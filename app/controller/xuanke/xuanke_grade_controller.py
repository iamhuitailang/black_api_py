from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class InputGradeRequest(BaseModel):
    user_id: int = Field(..., description="学生ID")
    course_id: int = Field(..., description="课程ID")
    score: float = Field(..., description="分数")
    semester: Optional[str] = Field(None, description="学期")
    comments: Optional[str] = Field(None, description="评语")


class BatchGradeItem(BaseModel):
    user_id: int = Field(..., description="学生ID")
    course_id: int = Field(..., description="课程ID")
    score: float = Field(..., description="分数")
    semester: Optional[str] = Field(None, description="学期")
    comments: Optional[str] = Field(None, description="评语")


class BatchInputGradeRequest(BaseModel):
    grades: List[BatchGradeItem] = Field(..., description="成绩列表")


class UpdateGradeRequest(BaseModel):
    score: float = Field(..., description="分数")
    comments: Optional[str] = Field(None, description="评语")


class XuankeGradeController:
    def __init__(self):
        from app.business.xuanke.grade_business import XuankeGradeBusiness
        self.grade_business = XuankeGradeBusiness()
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

    def ActionXuankeGradeMyGradesGet(self, request: Request,
                                    semester: Optional[str] = Query(None, description="学期"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我的成绩接口
        GET /api/xuanke/grade/mygrades/get
        获取当前用户的成绩列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.grade_business.get_my_grades(
            user_id=user.get('id'),
            semester=semester
        )

    def ActionXuankeGradeCourseGradesGet(self, request: Request,
                                       course_id: int = Query(..., description="课程ID"),
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取课程成绩接口
        GET /api/xuanke/grade/course/grades/get
        获取某门课程的成绩列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') not in ['admin', 'teacher']:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.grade_business.get_course_grades(course_id, page, page_size)

    def ActionXuankeGradeInputPost(self, request: Request, body: InputGradeRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        录入成绩接口
        POST /api/xuanke/grade/input
        教师或管理员录入学生成绩
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') not in ['admin', 'teacher']:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.grade_business.input_grade(
            user_id=body.user_id,
            course_id=body.course_id,
            score=body.score,
            semester=body.semester or '',
            comments=body.comments or ''
        )

    def ActionXuankeGradeBatchInputPost(self, request: Request, body: BatchInputGradeRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        批量录入成绩接口
        POST /api/xuanke/grade/batch/input
        批量录入学生成绩
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') not in ['admin', 'teacher']:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        grades_data = [g.model_dump() for g in body.grades]
        return self.grade_business.batch_input_grades(grades_data)

    def ActionXuankeGradeUpdatePost(self, request: Request, body: UpdateGradeRequest,
                                  grade_id: int = Query(..., description="成绩记录ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新成绩接口
        POST /api/xuanke/grade/update
        更新学生成绩
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') not in ['admin', 'teacher']:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.grade_business.update_grade(
            grade_id=grade_id,
            score=body.score,
            comments=body.comments or ''
        )

    def ActionXuankeGradeDeletePost(self, request: Request, grade_id: int = Query(..., description="成绩记录ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除成绩接口
        POST /api/xuanke/grade/delete
        删除成绩记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.grade_business.delete_grade(grade_id)

    def ActionXuankeGradeGpaRankingGet(self, request: Request,
                                     semester: Optional[str] = Query(None, description="学期"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取GPA排名接口
        GET /api/xuanke/grade/gpa/ranking/get
        获取GPA排名信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.grade_business.get_gpa_ranking(
            user_id=user.get('id'),
            semester=semester
        )

    def ActionXuankeGradePointTableGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取绩点对照表接口
        GET /api/xuanke/grade/point/table/get
        获取分数-等级-绩点对照表
        """
        return self.grade_business.get_grade_point_table()

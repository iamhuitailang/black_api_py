from typing import Optional, List
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.course import CourseBusiness, ReviewBusiness, RankingBusiness, AdminBusiness
from app.business.auth import AuthBusiness


class SubmitReviewRequest(BaseModel):
    semester: str = Field(..., description="学期")
    course_name: str = Field(..., description="课程名称")
    teacher: str = Field(..., description="教师名称")
    content_quality: int = Field(..., ge=1, le=5, description="内容质量 1-5星")
    clarity: int = Field(..., ge=1, le=5, description="讲课清晰度 1-5星")
    homework: int = Field(..., ge=1, le=5, description="作业合理度 1-5星")
    grading: int = Field(..., ge=1, le=5, description="给分友好度 1-5星")
    comment: str = Field(default='', max_length=300, description="文字评论，限300字")
    tags: List[str] = Field(default=[], description="标签，多选：干货多、PPT念稿、作业多、给分好、点名频繁")


class UpvoteRequest(BaseModel):
    review_id: int = Field(..., ge=1, description="评价ID")


class HideReviewRequest(BaseModel):
    review_id: int = Field(..., ge=1, description="评价ID")
    reason: str = Field(..., min_length=1, description="隐藏理由")


class RestoreReviewRequest(BaseModel):
    review_id: int = Field(..., ge=1, description="评价ID")


class CourseController:
    def __init__(self):
        self.course_business = CourseBusiness()
        self.review_business = ReviewBusiness()
        self.ranking_business = RankingBusiness()
        self.admin_business = AdminBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str]) -> str:
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
                'message': '请先登录管理员账号',
                'data': None
            }
        return None

    def ActionCourseFilterOptionsGet(self, request: Request):
        """
        获取筛选选项（学期列表）
        GET /api/course/filter/options/get
        """
        return self.course_business.get_filter_options()

    def ActionCourseTeachersGet(self, request: Request, semester: str = Query(..., description="学期")):
        """
        根据学期获取教师列表
        GET /api/course/teachers/get
        """
        return self.course_business.get_teachers(semester)

    def ActionCourseNamesGet(self, request: Request, semester: str = Query(..., description="学期"),
                             teacher: Optional[str] = Query(default=None, description="教师名称，可选")):
        """
        根据学期和教师获取课程名称列表
        GET /api/course/names/get
        """
        return self.course_business.get_course_names(semester, teacher)

    def ActionCourseListGet(self, request: Request,
                            semester: Optional[str] = Query(default=None, description="学期筛选，可选"),
                            keyword: Optional[str] = Query(default=None, description="搜索关键词，可选")):
        """
        获取课程列表
        GET /api/course/list/get
        """
        return self.course_business.get_course_list(semester, keyword)

    def ActionCourseDetailGet(self, request: Request, id: int = Query(..., ge=1, description="课程ID")):
        """
        获取课程详情（含评分、标签、评价列表）
        GET /api/course/detail/get
        """
        return self.course_business.get_course_detail(id)

    def ActionReviewSubmitPost(self, request: Request, body: SubmitReviewRequest,
                               x_client_id: Optional[str] = Header(default=None),
                               authorization: Optional[str] = Header(None)):
        """
        提交课程评价
        POST /api/review/submit
        """
        user_id = 0
        token = self._get_token_from_header(request, authorization)
        if token:
            user = self.auth_business.verify_token(token)
            if user:
                user_id = user.get('id', 0)

        return self.review_business.submit_review(
            semester=body.semester,
            course_name=body.course_name,
            teacher=body.teacher,
            content_quality=body.content_quality,
            clarity=body.clarity,
            homework=body.homework,
            grading=body.grading,
            comment=body.comment,
            tags=body.tags,
            client_id=x_client_id or '',
            user_id=user_id
        )

    def ActionReviewUpvotePost(self, request: Request, body: UpvoteRequest,
                               x_client_id: Optional[str] = Header(default=None)):
        """
        给评价点赞/点有用
        POST /api/review/upvote
        """
        return self.review_business.upvote_review(body.review_id, x_client_id or '')

    def ActionRankingListGet(self, request: Request,
                             semester: Optional[str] = Query(default=None, description="学期，可选"),
                             min_reviews: int = Query(default=5, ge=1, description="上榜最少评价数"),
                             limit: int = Query(default=10, ge=1, le=50, description="榜单数量")):
        """
        获取排行榜（好评榜和避雷榜）
        GET /api/ranking/list/get
        """
        return self.ranking_business.get_rankings(semester, min_reviews, limit)

    def ActionAdminReviewListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员获取所有评价列表（含隐藏的）
        GET /api/admin/review/list/get
        """
        auth_err = self._require_admin(request, authorization)
        if auth_err:
            return auth_err
        return self.admin_business.get_all_reviews()

    def ActionAdminReviewHidePost(self, request: Request, body: HideReviewRequest, authorization: Optional[str] = Header(None)):
        """
        管理员隐藏违规评价
        POST /api/admin/review/hide
        """
        auth_err = self._require_admin(request, authorization)
        if auth_err:
            return auth_err
        return self.admin_business.hide_review(body.review_id, body.reason)

    def ActionAdminReviewRestorePost(self, request: Request, body: RestoreReviewRequest, authorization: Optional[str] = Header(None)):
        """
        管理员恢复被隐藏的评价
        POST /api/admin/review/restore
        """
        auth_err = self._require_admin(request, authorization)
        if auth_err:
            return auth_err
        return self.admin_business.restore_review(body.review_id)

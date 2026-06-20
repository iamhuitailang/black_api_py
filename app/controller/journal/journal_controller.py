from typing import Optional, List
from fastapi import Request, Query, UploadFile, File, Form, Header
from pydantic import BaseModel, Field
from app.business.journal import (
    UserProfileBusiness, SectionBusiness, ManuscriptBusiness,
    ReviewBusiness, EditorialBusiness
)
from app.business.auth import AuthBusiness


class SectionSetRequest(BaseModel):
    section_id: Optional[int] = Field(default=None, description="栏目ID，不填则为新增")
    name: str = Field(..., description="栏目名称")
    description: Optional[str] = Field(default='', description="栏目描述")
    sort_order: Optional[int] = Field(default=0, description="排序顺序")


class ManuscriptSetRequest(BaseModel):
    manuscript_id: Optional[int] = Field(default=None, description="稿件ID，不填则为新增，填则为修改")
    title: str = Field(..., description="论文标题")
    abstract: Optional[str] = Field(default='', description="论文摘要")
    file_path: Optional[str] = Field(default='', description="正文文件路径")
    file_name: Optional[str] = Field(default='', description="正文文件名")
    keywords: Optional[str] = Field(default='', description="关键词，逗号分隔")
    section_id: int = Field(..., description="栏目ID")
    author_name: Optional[str] = Field(default='', description="作者姓名")
    author_email: Optional[str] = Field(default='', description="作者邮箱")
    author_phone: Optional[str] = Field(default='', description="作者电话")
    author_affiliation: Optional[str] = Field(default='', description="作者单位")


class ManuscriptSubmitRequest(BaseModel):
    manuscript_id: int = Field(..., ge=1, description="稿件ID")


class ManuscriptDeleteRequest(BaseModel):
    manuscript_id: int = Field(..., ge=1, description="稿件ID")


class ReviewAssignRequest(BaseModel):
    manuscript_id: int = Field(..., ge=1, description="稿件ID")
    reviewer_user_id: int = Field(..., ge=1, description="审稿人用户ID")


class AssignmentActionRequest(BaseModel):
    assignment_id: int = Field(..., ge=1, description="分配ID")


class ReviewSubmitRequest(BaseModel):
    assignment_id: int = Field(..., ge=1, description="分配ID")
    recommendation: str = Field(..., description="审稿建议: accept/minor_revision/major_revision/reject")
    originality_score: int = Field(..., ge=1, le=10, description="原创性评分1-10")
    scientific_score: int = Field(..., ge=1, le=10, description="科学性评分1-10")
    language_score: int = Field(..., ge=1, le=10, description="语言质量评分1-10")
    overall_score: int = Field(..., ge=1, le=10, description="综合评分1-10")
    comment_to_author: str = Field(..., description="给作者的审稿意见")
    comment_to_editor: Optional[str] = Field(default='', description="给编辑的私密意见")


class EditorDecisionRequest(BaseModel):
    manuscript_id: int = Field(..., ge=1, description="稿件ID")
    decision: str = Field(..., description="编辑决定: accepted/revision_required/rejected")
    comment: Optional[str] = Field(default='', description="编辑意见")


class UserProfileUpdateRequest(BaseModel):
    real_name: Optional[str] = Field(default=None, description="真实姓名")
    email: Optional[str] = Field(default=None, description="邮箱")
    phone: Optional[str] = Field(default=None, description="电话")
    affiliation: Optional[str] = Field(default=None, description="单位")
    research_fields: Optional[str] = Field(default=None, description="研究方向")


class JournalController:
    def __init__(self):
        self.auth_business = AuthBusiness()
        self.user_profile_business = UserProfileBusiness()
        self.section_business = SectionBusiness()
        self.manuscript_business = ManuscriptBusiness()
        self.review_business = ReviewBusiness()
        self.editorial_business = EditorialBusiness()

    def _get_current_user(self, request: Request) -> Optional[dict]:
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header
        if not token:
            token = request.headers.get('token', '')
        if not token:
            return None
        return self.auth_business.verify_token(token)

    def _require_login(self, request: Request):
        user = self._get_current_user(request)
        if not user:
            return None, {
                'code': 401,
                'message': '请先登录',
                'data': None
            }
        return user, None

    def ActionJournalProfileGet(self, request: Request):
        """获取当前用户档案信息
        GET /api/journal/profile/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        self.user_profile_business.ensure_profile(user.get('id'), user.get('username', ''))
        return self.user_profile_business.get_profile(user.get('id'))

    def ActionJournalProfileSet(self, request: Request, body: UserProfileUpdateRequest):
        """更新用户档案
        POST /api/journal/profile/set
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.user_profile_business.update_profile(
            user_id=user.get('id'),
            real_name=body.real_name,
            email=body.email,
            phone=body.phone,
            affiliation=body.affiliation,
            research_fields=body.research_fields
        )

    def ActionJournalRoleGet(self, request: Request):
        """获取用户角色信息
        GET /api/journal/role/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        self.user_profile_business.ensure_profile(user.get('id'), user.get('username', ''))
        return self.user_profile_business.get_role_info(user.get('id'))

    def ActionJournalReviewerListGet(self, request: Request):
        """获取审稿人列表
        GET /api/journal/reviewer/list/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.user_profile_business.get_reviewer_list()

    def ActionJournalSectionListGet(self, request: Request):
        """获取栏目列表
        GET /api/journal/section/list/get
        """
        return self.section_business.get_all_sections()

    def ActionJournalSectionSet(self, request: Request, body: SectionSetRequest):
        """新增或更新栏目
        POST /api/journal/section/list/set
        """
        user, err = self._require_login(request)
        if err:
            return err
        if body.section_id:
            return self.section_business.update_section(
                body.section_id, body.name, body.description, body.sort_order
            )
        return self.section_business.add_section(body.name, body.description, body.sort_order)

    def ActionJournalSectionDelete(self, request: Request, section_id: int = Query(..., ge=1)):
        """删除栏目
        DELETE /api/journal/section/delete
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.section_business.delete_section(section_id)

    async def ActionJournalManuscriptUploadPost(self, request: Request, file: UploadFile = File(...)):
        """上传稿件正文文件
        POST /api/journal/manuscript/upload
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.manuscript_business.save_file(file, user.get('id'))

    def ActionJournalManuscriptSet(self, request: Request, body: ManuscriptSetRequest):
        """创建或修改稿件
        POST /api/journal/manuscript/set
        """
        user, err = self._require_login(request)
        if err:
            return err
        if body.manuscript_id:
            return self.manuscript_business.update_manuscript(
                manuscript_id=body.manuscript_id,
                user_id=user.get('id'),
                title=body.title,
                abstract=body.abstract,
                file_path=body.file_path,
                file_name=body.file_name,
                keywords=body.keywords,
                section_id=body.section_id,
                author_name=body.author_name,
                author_email=body.author_email,
                author_phone=body.author_phone,
                author_affiliation=body.author_affiliation
            )
        return self.manuscript_business.create_manuscript(
            title=body.title,
            abstract=body.abstract,
            file_path=body.file_path,
            file_name=body.file_name,
            keywords=body.keywords,
            section_id=body.section_id,
            user_id=user.get('id'),
            author_name=body.author_name,
            author_email=body.author_email,
            author_phone=body.author_phone,
            author_affiliation=body.author_affiliation
        )

    def ActionJournalManuscriptSubmitPost(self, request: Request, body: ManuscriptSubmitRequest):
        """提交稿件进入审稿流程
        POST /api/journal/manuscript/submit
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.manuscript_business.submit_manuscript(body.manuscript_id, user.get('id'))

    def ActionJournalManuscriptListGet(self, request: Request, page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100)):
        """获取作者的投稿列表
        GET /api/journal/manuscript/list/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.manuscript_business.get_author_submissions(user.get('id'), page, page_size)

    def ActionJournalManuscriptDetailGet(self, request: Request, manuscript_id: int = Query(..., ge=1)):
        """获取稿件详情（含进度、审稿意见等）
        GET /api/journal/manuscript/detail/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.manuscript_business.get_manuscript_detail(manuscript_id, user.get('id'))

    def ActionJournalManuscriptDeletePost(self, request: Request, body: ManuscriptDeleteRequest):
        """删除草稿稿件
        POST /api/journal/manuscript/delete
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.manuscript_business.delete_manuscript(body.manuscript_id, user.get('id'))

    def ActionJournalReviewAssignPost(self, request: Request, body: ReviewAssignRequest):
        """编辑分配审稿人
        POST /api/journal/review/assign
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.assign_reviewer(
            body.manuscript_id, body.reviewer_user_id, user.get('id')
        )

    def ActionJournalReviewAssignDeletePost(self, request: Request, body: AssignmentActionRequest):
        """编辑撤销审稿分配
        POST /api/journal/review/assign/delete
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.remove_assignment(body.assignment_id, user.get('id'))

    def ActionJournalReviewAssignmentAcceptPost(self, request: Request, body: AssignmentActionRequest):
        """审稿人接受审稿任务
        POST /api/journal/review/assignment/accept
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.accept_assignment(body.assignment_id, user.get('id'))

    def ActionJournalReviewAssignmentDeclinePost(self, request: Request, body: AssignmentActionRequest):
        """审稿人拒绝审稿任务
        POST /api/journal/review/assignment/decline
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.decline_assignment(body.assignment_id, user.get('id'))

    def ActionJournalReviewSubmitPost(self, request: Request, body: ReviewSubmitRequest):
        """提交审稿意见
        POST /api/journal/review/submit
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.submit_review(
            assignment_id=body.assignment_id,
            reviewer_user_id=user.get('id'),
            recommendation=body.recommendation,
            originality_score=body.originality_score,
            scientific_score=body.scientific_score,
            language_score=body.language_score,
            overall_score=body.overall_score,
            comment_to_author=body.comment_to_author,
            comment_to_editor=body.comment_to_editor
        )

    def ActionJournalReviewTaskListGet(self, request: Request, status: Optional[str] = Query(default=None),
                                       page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
        """获取审稿人的待审任务列表
        GET /api/journal/review/task/list/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.get_reviewer_tasks(user.get('id'), status, page, page_size)

    def ActionJournalReviewTaskStatsGet(self, request: Request):
        """获取审稿人任务统计
        GET /api/journal/review/task/stats/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.get_reviewer_task_stats(user.get('id'))

    def ActionJournalManuscriptAssignmentsGet(self, request: Request, manuscript_id: int = Query(..., ge=1)):
        """编辑获取稿件的审稿分配情况
        GET /api/journal/manuscript/assignments/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.get_manuscript_assignments(manuscript_id, user.get('id'))

    def ActionJournalReviewDetailGet(self, request: Request, review_id: int = Query(..., ge=1)):
        """获取审稿意见详情
        GET /api/journal/review/detail/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.review_business.get_review_detail(review_id, user.get('id'))

    def ActionJournalEditorAllListGet(self, request: Request, status: Optional[str] = Query(default=None),
                                      page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
        """编辑获取所有稿件列表
        GET /api/journal/editor/all/list/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.editorial_business.get_all_manuscripts(user.get('id'), status, page, page_size)

    def ActionJournalEditorDecisionPost(self, request: Request, body: EditorDecisionRequest):
        """编辑做最终决定
        POST /api/journal/editor/decision
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.editorial_business.make_editor_decision(
            body.manuscript_id, user.get('id'), body.decision, body.comment
        )

    def ActionJournalEditorPublishedPost(self, request: Request, body: ManuscriptSubmitRequest):
        """编辑标记稿件为已发表
        POST /api/journal/editor/published
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.editorial_business.mark_as_published(body.manuscript_id, user.get('id'))

    def ActionJournalEditorRevisionBackPost(self, request: Request, body: ManuscriptSubmitRequest):
        """编辑将需修改稿件退回给作者修改
        POST /api/journal/editor/revision/back
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.editorial_business.request_revision(body.manuscript_id, user.get('id'))

    def ActionJournalEditorDashboardGet(self, request: Request):
        """编辑工作台统计数据
        GET /api/journal/editor/dashboard/get
        """
        user, err = self._require_login(request)
        if err:
            return err
        return self.editorial_business.get_dashboard_stats(user.get('id'))

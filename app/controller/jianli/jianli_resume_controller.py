from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateResumeRequest(BaseModel):
    title: str = Field(..., description="简历标题")
    template_id: Optional[int] = Field(0, description="模板ID")


class UpdateResumeRequest(BaseModel):
    title: Optional[str] = Field(None, description="简历标题")
    template_id: Optional[int] = Field(None, description="模板ID")
    name: Optional[str] = Field(None, description="姓名")
    gender: Optional[str] = Field(None, description="性别")
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    birthday: Optional[str] = Field(None, description="生日")
    address: Optional[str] = Field(None, description="地址")
    avatar: Optional[str] = Field(None, description="头像")
    job_intention: Optional[str] = Field(None, description="求职意向")
    expected_salary: Optional[str] = Field(None, description="期望薪资")
    self_evaluation: Optional[str] = Field(None, description="自我评价")
    status: Optional[int] = Field(None, description="状态")


class EducationRequest(BaseModel):
    school_name: Optional[str] = Field(None, description="学校名称")
    school: Optional[str] = Field(None, description="学校名称（兼容前端）")
    major: Optional[str] = Field(None, description="专业")
    degree: Optional[str] = Field(None, description="学历")
    start_date: Optional[str] = Field(None, description="开始时间")
    start_time: Optional[str] = Field(None, description="开始时间（兼容前端）")
    end_date: Optional[str] = Field(None, description="结束时间")
    end_time: Optional[str] = Field(None, description="结束时间（兼容前端）")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(0, description="排序")

    def get_school_name(self) -> str:
        return self.school_name or self.school or ''

    def get_start_date(self) -> str:
        return self.start_date or self.start_time or ''

    def get_end_date(self) -> str:
        return self.end_date or self.end_time or ''


class WorkRequest(BaseModel):
    company_name: Optional[str] = Field(None, description="公司名称")
    company: Optional[str] = Field(None, description="公司名称（兼容前端）")
    position: Optional[str] = Field(None, description="职位")
    start_date: Optional[str] = Field(None, description="开始时间")
    start_time: Optional[str] = Field(None, description="开始时间（兼容前端）")
    end_date: Optional[str] = Field(None, description="结束时间")
    end_time: Optional[str] = Field(None, description="结束时间（兼容前端）")
    description: Optional[str] = Field(None, description="工作描述")
    achievements: Optional[str] = Field(None, description="工作成就")
    sort_order: Optional[int] = Field(0, description="排序")

    def get_company_name(self) -> str:
        return self.company_name or self.company or ''

    def get_start_date(self) -> str:
        return self.start_date or self.start_time or ''

    def get_end_date(self) -> str:
        return self.end_date or self.end_time or ''


class ProjectRequest(BaseModel):
    project_name: Optional[str] = Field(None, description="项目名称")
    name: Optional[str] = Field(None, description="项目名称（兼容前端）")
    role: Optional[str] = Field(None, description="担任角色")
    start_date: Optional[str] = Field(None, description="开始时间")
    start_time: Optional[str] = Field(None, description="开始时间（兼容前端）")
    end_date: Optional[str] = Field(None, description="结束时间")
    end_time: Optional[str] = Field(None, description="结束时间（兼容前端）")
    description: Optional[str] = Field(None, description="项目描述")
    responsibilities: Optional[str] = Field(None, description="主要职责")
    technologies: Optional[str] = Field(None, description="技术栈（兼容前端）")
    achievements: Optional[str] = Field(None, description="项目成果")
    sort_order: Optional[int] = Field(0, description="排序")

    def get_project_name(self) -> str:
        return self.project_name or self.name or ''

    def get_start_date(self) -> str:
        return self.start_date or self.start_time or ''

    def get_end_date(self) -> str:
        return self.end_date or self.end_time or ''

    def get_responsibilities(self) -> str:
        return self.responsibilities or self.technologies or ''


class SkillRequest(BaseModel):
    skill_name: Optional[str] = Field(None, description="技能名称")
    name: Optional[str] = Field(None, description="技能名称（兼容前端）")
    skill_level: Optional[int] = Field(None, description="技能等级")
    level: Optional[int] = Field(None, description="技能等级（兼容前端）")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(0, description="排序")

    def get_skill_name(self) -> str:
        return self.skill_name or self.name or ''

    def get_skill_level(self) -> int:
        return self.skill_level or self.level or 0


class JianliResumeController:
    def __init__(self):
        from app.business.jianli.resume_business import ResumeBusiness
        from app.business.jianli.admin_business import AdminBusiness
        from app.business.jianli.user_business import UserBusiness
        self.resume_business = ResumeBusiness()
        self.admin_business = AdminBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJianliResumeListGet(self, request: Request,
                                   page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的简历列表接口
        GET /api/jianli/resume/list/get
        获取当前用户的简历列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.get_list(user.get('id'), page, page_size)

    def ActionJianliResumeAllListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      user_id: Optional[int] = Query(None, description="用户ID"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取所有简历列表接口（管理员）
        GET /api/jianli/resume/all/list/get
        分页获取所有简历列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.resume_business.get_all_list(page, page_size, user_id, status, keyword)

    def ActionJianliResumeDetailGet(self, request: Request,
                                    resume_id: int = Query(..., description="简历ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取简历详情接口
        GET /api/jianli/resume/detail/get
        获取简历完整详情，包括教育经历、工作经历等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        admin = self._get_current_admin(token)

        if not user and not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin:
            resume = self.resume_business.resume_model.get_by_id(resume_id)
            if not resume:
                return {
                    'code': 1,
                    'msg': '简历不存在',
                    'data': None
                }
            return self.resume_business.get_detail(resume.get('user_id'), resume_id)

        return self.resume_business.get_detail(user.get('id'), resume_id)

    def ActionJianliResumeCreatePost(self, request: Request, body: CreateResumeRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建简历接口
        POST /api/jianli/resume/create
        创建新简历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.create(
            user_id=user.get('id'),
            title=body.title,
            template_id=body.template_id or 0
        )

    def ActionJianliResumeUpdatePost(self, request: Request, body: UpdateResumeRequest,
                                      resume_id: int = Query(..., description="简历ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        更新简历接口
        POST /api/jianli/resume/update
        更新简历基本信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        for field in ['title', 'template_id', 'name', 'gender', 'phone', 'email',
                      'birthday', 'address', 'avatar', 'job_intention',
                      'expected_salary', 'self_evaluation', 'status']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.resume_business.update(
            user_id=user.get('id'),
            resume_id=resume_id,
            data=data
        )

    def ActionJianliResumeBasicUpdatePost(self, request: Request, body: UpdateResumeRequest,
                                           resume_id: int = Query(..., description="简历ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        更新简历基础信息接口
        POST /api/jianli/resume/basic/update
        更新简历基本信息（与update接口功能相同，兼容前端调用）
        """
        return self.ActionJianliResumeUpdatePost(request, body, resume_id, authorization)

    def ActionJianliResumeDeletePost(self, request: Request,
                                      resume_id: int = Query(..., description="简历ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除简历接口
        POST /api/jianli/resume/delete
        删除指定简历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        admin = self._get_current_admin(token)

        if not user and not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if admin:
            return self.resume_business.delete_by_admin(resume_id)

        return self.resume_business.delete(user.get('id'), resume_id)

    def ActionJianliResumeDownloadPost(self, request: Request,
                                        resume_id: int = Query(..., description="简历ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        简历下载计数接口
        POST /api/jianli/resume/download
        记录简历下载次数
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.increment_download_count(user.get('id'), resume_id)

    def ActionJianliResumeDownloadIncrementPost(self, request: Request,
                                                 resume_id: int = Query(..., description="简历ID"),
                                                 authorization: Optional[str] = Header(None)):
        """
        简历下载计数接口（兼容前端调用）
        POST /api/jianli/resume/download/increment
        记录简历下载次数
        """
        return self.ActionJianliResumeDownloadPost(request, resume_id, authorization)

    def ActionJianliResumeEducationAddPost(self, request: Request, body: EducationRequest,
                                            resume_id: int = Query(..., description="简历ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        添加教育经历接口
        POST /api/jianli/resume/education/add
        为简历添加教育经历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.add_education(
            user_id=user.get('id'),
            resume_id=resume_id,
            school_name=body.get_school_name(),
            major=body.major or '',
            degree=body.degree or '',
            start_date=body.get_start_date(),
            end_date=body.get_end_date(),
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliResumeEducationUpdatePost(self, request: Request, body: EducationRequest,
                                               record_id: Optional[int] = Query(None, description="记录ID"),
                                               education_id: Optional[int] = Query(None, description="教育经历ID"),
                                               authorization: Optional[str] = Header(None)):
        """
        更新教育经历接口
        POST /api/jianli/resume/education/update
        更新教育经历信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or education_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        data = {}
        for field in ['school_name', 'major', 'degree', 'start_date',
                      'end_date', 'description', 'sort_order']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.resume_business.update_education(
            user_id=user.get('id'),
            record_id=actual_id,
            data=data
        )

    def ActionJianliResumeEducationDeletePost(self, request: Request,
                                               record_id: Optional[int] = Query(None, description="记录ID"),
                                               education_id: Optional[int] = Query(None, description="教育经历ID"),
                                               authorization: Optional[str] = Header(None)):
        """
        删除教育经历接口
        POST /api/jianli/resume/education/delete
        删除指定教育经历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or education_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        return self.resume_business.delete_education(user.get('id'), actual_id)

    def ActionJianliResumeWorkAddPost(self, request: Request, body: WorkRequest,
                                       resume_id: int = Query(..., description="简历ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        添加工作经历接口
        POST /api/jianli/resume/work/add
        为简历添加工作经历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.add_work(
            user_id=user.get('id'),
            resume_id=resume_id,
            company_name=body.get_company_name(),
            position=body.position or '',
            start_date=body.get_start_date(),
            end_date=body.get_end_date(),
            description=body.description or '',
            achievements=body.achievements or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliResumeWorkUpdatePost(self, request: Request, body: WorkRequest,
                                          record_id: Optional[int] = Query(None, description="记录ID"),
                                          work_id: Optional[int] = Query(None, description="工作经历ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新工作经历接口
        POST /api/jianli/resume/work/update
        更新工作经历信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or work_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        data = {}
        for field in ['company_name', 'position', 'start_date', 'end_date',
                      'description', 'achievements', 'sort_order']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.resume_business.update_work(
            user_id=user.get('id'),
            record_id=actual_id,
            data=data
        )

    def ActionJianliResumeWorkDeletePost(self, request: Request,
                                          record_id: Optional[int] = Query(None, description="记录ID"),
                                          work_id: Optional[int] = Query(None, description="工作经历ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除工作经历接口
        POST /api/jianli/resume/work/delete
        删除指定工作经历
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or work_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        return self.resume_business.delete_work(user.get('id'), actual_id)

    def ActionJianliResumeProjectAddPost(self, request: Request, body: ProjectRequest,
                                          resume_id: int = Query(..., description="简历ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        添加项目经验接口
        POST /api/jianli/resume/project/add
        为简历添加项目经验
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.add_project(
            user_id=user.get('id'),
            resume_id=resume_id,
            project_name=body.get_project_name(),
            role=body.role or '',
            start_date=body.get_start_date(),
            end_date=body.get_end_date(),
            description=body.description or '',
            responsibilities=body.get_responsibilities(),
            achievements=body.achievements or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliResumeProjectUpdatePost(self, request: Request, body: ProjectRequest,
                                             record_id: Optional[int] = Query(None, description="记录ID"),
                                             project_id: Optional[int] = Query(None, description="项目经验ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        更新项目经验接口
        POST /api/jianli/resume/project/update
        更新项目经验信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or project_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        data = {}
        for field in ['project_name', 'role', 'start_date', 'end_date',
                      'description', 'responsibilities', 'achievements', 'sort_order']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.resume_business.update_project(
            user_id=user.get('id'),
            record_id=actual_id,
            data=data
        )

    def ActionJianliResumeProjectDeletePost(self, request: Request,
                                             record_id: Optional[int] = Query(None, description="记录ID"),
                                             project_id: Optional[int] = Query(None, description="项目经验ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        删除项目经验接口
        POST /api/jianli/resume/project/delete
        删除指定项目经验
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or project_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        return self.resume_business.delete_project(user.get('id'), actual_id)

    def ActionJianliResumeSkillAddPost(self, request: Request, body: SkillRequest,
                                        resume_id: int = Query(..., description="简历ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        添加技能特长接口
        POST /api/jianli/resume/skill/add
        为简历添加技能特长
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resume_business.add_skill(
            user_id=user.get('id'),
            resume_id=resume_id,
            skill_name=body.get_skill_name(),
            skill_level=body.get_skill_level(),
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionJianliResumeSkillUpdatePost(self, request: Request, body: SkillRequest,
                                           record_id: Optional[int] = Query(None, description="记录ID"),
                                           skill_id: Optional[int] = Query(None, description="技能特长ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        更新技能特长接口
        POST /api/jianli/resume/skill/update
        更新技能特长信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or skill_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        data = {}
        for field in ['skill_name', 'skill_level', 'description', 'sort_order']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.resume_business.update_skill(
            user_id=user.get('id'),
            record_id=actual_id,
            data=data
        )

    def ActionJianliResumeSkillDeletePost(self, request: Request,
                                           record_id: Optional[int] = Query(None, description="记录ID"),
                                           skill_id: Optional[int] = Query(None, description="技能特长ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除技能特长接口
        POST /api/jianli/resume/skill/delete
        删除指定技能特长
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        actual_id = record_id or skill_id
        if not actual_id:
            return {
                'code': 1,
                'msg': '缺少记录ID参数',
                'data': None
            }

        return self.resume_business.delete_skill(user.get('id'), actual_id)

from typing import Any, Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateRuleRequest(BaseModel):
    id: Optional[int] = Field(None, description="规则ID")
    rule_key: Optional[str] = Field(None, description="规则键")
    rule_value: Any = Field(..., description="规则值")


class CreateRuleRequest(BaseModel):
    rule_key: str = Field(..., description="规则键")
    rule_value: Any = Field(..., description="规则值")
    rule_name: str = Field(..., description="规则名称")
    description: Optional[str] = Field(None, description="描述")


class SetPhaseRequest(BaseModel):
    phase: str = Field(..., description="选课阶段")


class CreateUserRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")
    role: Optional[str] = Field('student', description="角色")
    student_no: Optional[str] = Field(None, description="学号")
    teacher_no: Optional[str] = Field(None, description="教师号")
    department: Optional[str] = Field(None, description="院系")
    major: Optional[str] = Field(None, description="专业")
    class_name: Optional[str] = Field(None, description="班级")
    grade: Optional[str] = Field(None, description="年级")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="电话")


class UpdateUserRequest(BaseModel):
    real_name: Optional[str] = Field(None, description="真实姓名")
    role: Optional[str] = Field(None, description="角色")
    student_no: Optional[str] = Field(None, description="学号")
    teacher_no: Optional[str] = Field(None, description="教师号")
    department: Optional[str] = Field(None, description="院系")
    major: Optional[str] = Field(None, description="专业")
    class_name: Optional[str] = Field(None, description="班级")
    grade: Optional[str] = Field(None, description="年级")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="电话")
    password: Optional[str] = Field(None, description="密码")
    status: Optional[int] = Field(None, description="状态")


class XuankeAdminController:
    def __init__(self):
        from app.business.xuanke.admin_business import XuankeAdminBusiness
        self.admin_business = XuankeAdminBusiness()
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

    def ActionXuankeAdminRulesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有选课规则接口
        GET /api/xuanke/admin/rules/get
        管理员获取所有选课规则
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.get_all_rules()

    def ActionXuankeAdminRuleUpdatePost(self, request: Request, body: UpdateRuleRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        更新选课规则接口
        POST /api/xuanke/admin/rule/update
        管理员更新选课规则
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        rule_identifier = body.id if body.id is not None else body.rule_key
        if rule_identifier is None:
            return {
                'code': 1,
                'msg': '请提供规则ID或规则键',
                'data': None
            }

        return self.admin_business.update_rule(rule_identifier, body.rule_value)

    def ActionXuankeAdminRuleCreatePost(self, request: Request, body: CreateRuleRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建选课规则接口
        POST /api/xuanke/admin/rule/create
        管理员创建新的选课规则
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.create_rule(
            rule_key=body.rule_key,
            rule_value=body.rule_value,
            rule_name=body.rule_name,
            description=body.description or ''
        )

    def ActionXuankeAdminRuleDeletePost(self, request: Request, rule_id: int = Query(..., description="规则ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除选课规则接口
        POST /api/xuanke/admin/rule/delete
        管理员删除选课规则
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.delete_rule(rule_id)

    def ActionXuankeAdminPhaseSetPost(self, request: Request, body: SetPhaseRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        设置选课阶段接口
        POST /api/xuanke/admin/phase/set
        管理员设置当前选课阶段
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.set_selection_phase(body.phase)

    def ActionXuankeAdminLotteryRunPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        执行抽签接口
        POST /api/xuanke/admin/lottery/run
        管理员执行抽签，处理预选阶段超额申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.run_lottery()

    def ActionXuankeAdminStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取系统统计接口
        GET /api/xuanke/admin/statistics/get
        管理员获取系统统计信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.get_statistics()

    def ActionXuankeAdminExportEnrollmentsGet(self, request: Request,
                                             course_id: Optional[int] = Query(None, description="课程ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        导出选课数据接口
        GET /api/xuanke/admin/export/enrollments/get
        管理员导出选课数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.admin_business.export_enrollments(course_id)

    def ActionXuankeAdminUserCreatePost(self, request: Request, body: CreateUserRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建用户接口
        POST /api/xuanke/admin/user/create
        管理员创建用户
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.user_business.create_user(body.model_dump())

    def ActionXuankeAdminUserUpdatePost(self, request: Request, body: UpdateUserRequest,
                                       user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        更新用户接口
        POST /api/xuanke/admin/user/update
        管理员更新用户信息
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
        return self.user_business.update_user(user_id, data)

    def ActionXuankeAdminUserDeletePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/xuanke/admin/user/delete
        管理员删除用户
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.user_business.delete_user(user_id)

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    team_id: int = Field(..., description="小组ID")
    title: str = Field(..., description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    priority: Optional[str] = Field('medium', description="优先级")
    assignee_id: Optional[int] = Field(None, description="负责人ID")
    estimated_hours: Optional[float] = Field(0, description="预计工时")
    start_date: Optional[str] = Field(None, description="开始日期")
    due_date: Optional[str] = Field(None, description="截止日期")


class UpdateTaskRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    title: Optional[str] = Field(None, description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    priority: Optional[str] = Field(None, description="优先级")
    status: Optional[str] = Field(None, description="状态")
    assignee_id: Optional[int] = Field(None, description="负责人ID")
    estimated_hours: Optional[float] = Field(None, description="预计工时")
    start_date: Optional[str] = Field(None, description="开始日期")
    due_date: Optional[str] = Field(None, description="截止日期")


class UpdateTaskStatusRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    status: str = Field(..., description="状态")


class AddCommentRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    content: str = Field(..., description="评论内容")


class XzTaskController:
    def __init__(self):
        from app.business.xiaozu.task_business import XzTaskBusiness
        self.task_business = XzTaskBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.xiaozu.auth_business import XzAuthBusiness
        auth = XzAuthBusiness()
        return auth.verify_token(token)

    def ActionXzTaskCreatePost(self, request: Request, body: CreateTaskRequest,
                                authorization: Optional[str] = Header(None)):
        """创建任务"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.create_task(
            user['id'], body.team_id, body.title, body.description,
            body.priority, body.assignee_id, body.estimated_hours,
            body.start_date, body.due_date
        )

    def ActionXzTaskDetailGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                               authorization: Optional[str] = Header(None)):
        """获取任务详情"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_task(task_id, user['id'])

    def ActionXzTaskUpdatePost(self, request: Request, body: UpdateTaskRequest,
                                authorization: Optional[str] = Header(None)):
        """更新任务"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        kwargs = {k: v for k, v in body.__dict__.items() if k != 'task_id' and v is not None}
        return self.task_business.update_task(body.task_id, user['id'], **kwargs)

    def ActionXzTaskStatusUpdatePost(self, request: Request, body: UpdateTaskStatusRequest,
                                      authorization: Optional[str] = Header(None)):
        """更新任务状态"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.update_task_status(body.task_id, user['id'], body.status)

    def ActionXzTaskDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """删除任务"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        task_id = int(request.query_params.get('task_id', 0))
        return self.task_business.delete_task(task_id, user['id'])

    def ActionXzTaskListGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                             page: int = Query(1, description="页码"),
                             page_size: int = Query(10, description="每页数量"),
                             status: Optional[str] = Query(None, description="状态"),
                             priority: Optional[str] = Query(None, description="优先级"),
                             assignee_id: Optional[int] = Query(None, description="负责人ID"),
                             keyword: Optional[str] = Query(None, description="关键词"),
                             authorization: Optional[str] = Header(None)):
        """获取任务列表"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_team_tasks(
            team_id, user['id'], page, page_size, status, priority, assignee_id, keyword
        )

    def ActionXzTaskKanbanGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                               authorization: Optional[str] = Header(None)):
        """获取看板数据"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_kanban(team_id, user['id'])

    def ActionXzTaskMyGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                           status: Optional[str] = Query(None, description="状态"),
                           authorization: Optional[str] = Header(None)):
        """获取我的任务"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_my_tasks(team_id, user['id'], status)

    def ActionXzTaskCommentAddPost(self, request: Request, body: AddCommentRequest,
                                    authorization: Optional[str] = Header(None)):
        """添加评论"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.add_comment(body.task_id, user['id'], body.content)

    def ActionXzTaskCommentListGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                    authorization: Optional[str] = Header(None)):
        """获取评论列表"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_comments(task_id, user['id'])

    def ActionXzTaskLogListGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                authorization: Optional[str] = Header(None)):
        """获取任务日志"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.task_business.get_task_logs(task_id, user['id'])

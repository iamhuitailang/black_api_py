from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    title: str = Field(..., description="任务标题")
    description: Optional[str] = Field('', description="任务描述")
    project_id: Optional[int] = Field(0, description="所属项目ID")
    status: Optional[int] = Field(0, description="任务状态")
    priority: Optional[int] = Field(1, description="优先级")
    tags: Optional[str] = Field('', description="标签，逗号分隔")
    due_date: Optional[str] = Field(None, description="截止日期")
    estimated_time: Optional[int] = Field(0, description="预估时间(分钟)")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = Field(None, description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    project_id: Optional[int] = Field(None, description="所属项目ID")
    status: Optional[int] = Field(None, description="任务状态")
    priority: Optional[int] = Field(None, description="优先级")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    due_date: Optional[str] = Field(None, description="截止日期")
    estimated_time: Optional[int] = Field(None, description="预估时间(分钟)")
    actual_time: Optional[int] = Field(None, description="实际时间(分钟)")
    sort_order: Optional[int] = Field(None, description="排序")


class BatchTaskRequest(BaseModel):
    task_ids: List[int] = Field(..., description="任务ID列表")


class TodoTaskController:
    def __init__(self):
        from app.business.todo.todo_task_business import TodoTaskBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.task_business = TodoTaskBusiness()
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoTaskCreatePost(self, request: Request, body: CreateTaskRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建任务接口
        POST /api/todo/task/create
        创建新的任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.create(
            user_id=user.get('id'),
            title=body.title,
            description=body.description or '',
            project_id=body.project_id or 0,
            status=body.status or 0,
            priority=body.priority or 1,
            tags=body.tags or '',
            due_date=body.due_date,
            estimated_time=body.estimated_time or 0,
            sort_order=body.sort_order or 0
        )

    def ActionTodoTaskUpdatePost(self, request: Request, body: UpdateTaskRequest,
                                  task_id: int = Query(..., description="任务ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新任务接口
        POST /api/todo/task/update
        更新任务信息
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
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.project_id is not None:
            data['project_id'] = body.project_id
        if body.status is not None:
            data['status'] = body.status
        if body.priority is not None:
            data['priority'] = body.priority
        if body.tags is not None:
            data['tags'] = body.tags
        if body.due_date is not None:
            data['due_date'] = body.due_date
        if body.estimated_time is not None:
            data['estimated_time'] = body.estimated_time
        if body.actual_time is not None:
            data['actual_time'] = body.actual_time
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order

        return self.task_business.update(task_id, user.get('id'), data)

    def ActionTodoTaskDeletePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除任务接口
        POST /api/todo/task/delete
        删除任务及其提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.delete(task_id, user.get('id'))

    def ActionTodoTaskBatchDeletePost(self, request: Request, body: BatchTaskRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        批量删除任务接口
        POST /api/todo/task/batch/delete
        批量删除任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.batch_delete(body.task_ids, user.get('id'))

    def ActionTodoTaskDetailGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取任务详情接口
        GET /api/todo/task/detail/get
        根据ID获取任务详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_by_id(task_id, user.get('id'))

    def ActionTodoTaskListGet(self, request: Request,
                               page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               status: Optional[int] = Query(None, description="状态"),
                               priority: Optional[int] = Query(None, description="优先级"),
                               project_id: Optional[int] = Query(None, description="项目ID"),
                               keyword: Optional[str] = Query(None, description="搜索关键词"),
                               start_date: Optional[str] = Query(None, description="开始日期"),
                               end_date: Optional[str] = Query(None, description="结束日期"),
                               order_by: Optional[str] = Query('priority DESC, due_date ASC, id DESC', description="排序方式"),
                               authorization: Optional[str] = Header(None)):
        """
        获取任务列表接口
        GET /api/todo/task/list/get
        分页获取任务列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_list(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            project_id=project_id,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
            order_by=order_by
        )

    def ActionTodoTaskTodayGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取今日任务接口
        GET /api/todo/task/today/get
        获取今日需要完成的任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_today_tasks(user.get('id'))

    def ActionTodoTaskOverdueGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取逾期任务接口
        GET /api/todo/task/overdue/get
        获取已逾期的任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_overdue_tasks(user.get('id'))

    def ActionTodoTaskCompletePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        完成任务接口
        POST /api/todo/task/complete
        标记任务为已完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.complete(task_id, user.get('id'))

    def ActionTodoTaskStartPost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        开始任务接口
        POST /api/todo/task/start
        标记任务为进行中
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.start(task_id, user.get('id'))

    def ActionTodoTaskPausePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        暂停任务接口
        POST /api/todo/task/pause
        标记任务为待处理
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.pause(task_id, user.get('id'))

    def ActionTodoTaskCancelPost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        取消任务接口
        POST /api/todo/task/cancel
        标记任务为已取消
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.cancel(task_id, user.get('id'))

    def ActionTodoTaskMovePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                project_id: int = Query(..., description="目标项目ID"),
                                authorization: Optional[str] = Header(None)):
        """
        移动任务到项目接口
        POST /api/todo/task/move
        将任务移动到指定项目
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.move_to_project(task_id, user.get('id'), project_id)

    def ActionTodoTaskBatchStatusPost(self, request: Request, body: BatchTaskRequest,
                                       status: int = Query(..., description="目标状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        批量更新任务状态接口
        POST /api/todo/task/batch/status
        批量更新任务状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.batch_update_status(body.task_ids, user.get('id'), status)

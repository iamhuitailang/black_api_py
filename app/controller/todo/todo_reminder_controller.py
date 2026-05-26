from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReminderRequest(BaseModel):
    task_id: int = Field(..., description="任务ID")
    reminder_time: str = Field(..., description="提醒时间")
    reminder_type: Optional[str] = Field('system', description="提醒类型")
    message: Optional[str] = Field('', description="提醒消息")


class TodoReminderController:
    def __init__(self):
        from app.business.todo.todo_reminder_business import TodoReminderBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.reminder_business = TodoReminderBusiness()
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

    def ActionTodoReminderCreatePost(self, request: Request, body: CreateReminderRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建提醒接口
        POST /api/todo/reminder/create
        为任务创建提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.create(
            user_id=user.get('id'),
            task_id=body.task_id,
            reminder_time=body.reminder_time,
            reminder_type=body.reminder_type or 'system',
            message=body.message or ''
        )

    def ActionTodoReminderDeletePost(self, request: Request, reminder_id: int = Query(..., description="提醒ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除提醒接口
        POST /api/todo/reminder/delete
        删除任务提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.delete(reminder_id, user.get('id'))

    def ActionTodoReminderCancelPost(self, request: Request, reminder_id: int = Query(..., description="提醒ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        取消提醒接口
        POST /api/todo/reminder/cancel
        取消任务提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.cancel(reminder_id, user.get('id'))

    def ActionTodoReminderTaskGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取任务提醒接口
        GET /api/todo/reminder/task/get
        获取某个任务的所有提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.get_by_task_id(task_id, user.get('id'))

    def ActionTodoReminderListGet(self, request: Request,
                                   status: Optional[int] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户提醒列表接口
        GET /api/todo/reminder/list/get
        获取当前用户的所有提醒
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.get_by_user_id(user.get('id'), status)

from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.meeting import ActionItemBusiness


class ActionItemCreateRequest(BaseModel):
    meeting_id: int
    content: str
    assignee: Optional[str] = ''
    due_date: Optional[str] = ''
    completed: Optional[bool] = False


class ActionItemUpdateRequest(BaseModel):
    id: int
    content: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ActionItemStatusRequest(BaseModel):
    id: int
    completed: bool


class ActionItemReminderRequest(BaseModel):
    id: int
    reminder_time: Optional[str] = ''
    reminder_email: Optional[str] = ''


class ActionItemController:
    def __init__(self):
        self.business = ActionItemBusiness()

    def ActionActionList(self, request: Request,
                         completed: Optional[bool] = Query(None),
                         overdue: Optional[bool] = Query(None),
                         project_id: Optional[int] = Query(None)):
        """
        获取待办事项列表
        GET /api/action/list
        参数: 
          - completed: 是否完成 (true/false)
          - overdue: 是否过期 (true/false)
          - project_id: 项目ID
        """
        result = self.business.get_list(
            completed=completed,
            overdue=overdue,
            project_id=project_id
        )
        return result

    def ActionActionStatusPost(self, request: Request, body: ActionItemStatusRequest):
        """
        更新待办状态（完成/未完成）
        POST /api/action/status
        """
        result = self.business.update_status(body.id, body.completed)
        return result

    def ActionActionReminderPost(self, request: Request, body: ActionItemReminderRequest):
        """
        设置待办提醒时间和邮件
        POST /api/action/reminder
        参数:
          - id: 待办ID
          - reminder_time: 提醒时间 (YYYY-MM-DD HH:MM:SS)
          - reminder_email: 接收提醒的邮箱
        """
        result = self.business.set_reminder(
            action_id=body.id,
            reminder_time=body.reminder_time or '',
            reminder_email=body.reminder_email or ''
        )
        return result

    def ActionActionReminderCheck(self, request: Request):
        """
        手动触发检查并发送待办提醒邮件
        GET /api/action/reminder/check
        """
        result = self.business.check_and_send_reminders()
        return result

    def ActionActionCreatePost(self, request: Request, body: ActionItemCreateRequest):
        """
        创建待办事项
        POST /api/action/create
        """
        result = self.business.create(
            meeting_id=body.meeting_id,
            content=body.content,
            assignee=body.assignee or '',
            due_date=body.due_date or '',
            completed=body.completed or False
        )
        return result

    def ActionActionUpdatePost(self, request: Request, body: ActionItemUpdateRequest):
        """
        更新待办事项
        POST /api/action/update
        """
        result = self.business.update(
            action_id=body.id,
            content=body.content,
            assignee=body.assignee,
            due_date=body.due_date
        )
        return result

    def ActionActionDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除待办事项
        DELETE /api/action/delete
        参数: id - 待办ID
        """
        result = self.business.delete(id)
        return result

from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReminderRequest(BaseModel):
    task_id: Optional[int] = Field(0, description="关联任务ID，0表示不关联")
    title: Optional[str] = Field('', description="提醒标题")
    content: Optional[str] = Field('', description="提醒内容")
    remind_time: str = Field(..., description="提醒时间，格式HH:MM")
    repeat_type: Optional[str] = Field('daily', description="重复类型：daily-每天，weekly-每周，monthly-每月，once-仅一次")


class UpdateReminderRequest(BaseModel):
    title: Optional[str] = Field(None, description="提醒标题")
    content: Optional[str] = Field(None, description="提醒内容")
    remind_time: Optional[str] = Field(None, description="提醒时间")
    repeat_type: Optional[str] = Field(None, description="重复类型")
    is_enabled: Optional[int] = Field(None, description="是否启用：0-启用，1-禁用")


class DakaReminderController:
    def __init__(self):
        from app.business.daka.reminder_business import DakaReminderBusiness
        from app.business.daka.user_business import DakaUserBusiness
        self.reminder_business = DakaReminderBusiness()
        self.user_business = DakaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDakaReminderListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户提醒列表
        GET /api/daka/reminder/list/get
        获取当前用户的所有提醒设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.get_user_reminders(user.get('id'))

    def ActionDakaReminderDetailGet(self, request: Request, reminder_id: int = Query(..., description="提醒ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取提醒详情
        GET /api/daka/reminder/detail/get
        根据提醒ID获取提醒详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.get_reminder_detail(reminder_id, user.get('id'))

    def ActionDakaReminderCreatePost(self, request: Request, body: CreateReminderRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建提醒
        POST /api/daka/reminder/create
        创建新的提醒设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.create_reminder(
            user_id=user.get('id'),
            task_id=body.task_id,
            title=body.title,
            content=body.content,
            remind_time=body.remind_time,
            repeat_type=body.repeat_type
        )

    def ActionDakaReminderUpdatePost(self, request: Request, body: UpdateReminderRequest,
                                      reminder_id: int = Query(..., description="提醒ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        更新提醒
        POST /api/daka/reminder/update
        更新提醒设置
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
        if body.content is not None:
            data['content'] = body.content
        if body.remind_time is not None:
            data['remind_time'] = body.remind_time
        if body.repeat_type is not None:
            data['repeat_type'] = body.repeat_type
        if body.is_enabled is not None:
            data['is_enabled'] = body.is_enabled

        return self.reminder_business.update_reminder(reminder_id, user.get('id'), data)

    def ActionDakaReminderTogglePost(self, request: Request, reminder_id: int = Query(..., description="提醒ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        切换提醒状态
        POST /api/daka/reminder/toggle
        切换提醒的启用/禁用状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.toggle_reminder_status(reminder_id, user.get('id'))

    def ActionDakaReminderDeletePost(self, request: Request, reminder_id: int = Query(..., description="提醒ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除提醒
        POST /api/daka/reminder/delete
        删除指定的提醒设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.reminder_business.delete_reminder(reminder_id, user.get('id'))

    def ActionDakaReminderRepeatTypesGet(self, request: Request):
        """
        获取重复类型列表
        GET /api/daka/reminder/repeat/types/get
        获取所有提醒重复类型
        """
        return self.reminder_business.get_repeat_types()

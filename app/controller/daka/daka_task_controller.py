from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    name: str = Field(..., description="任务名称")
    type: Optional[int] = Field(4, description="任务类型：1-每日必做，2-每周目标，3-习惯养成，4-自定义")
    icon: Optional[str] = Field('', description="任务图标")
    target_value: Optional[int] = Field(1, description="目标值")
    unit: Optional[str] = Field('次', description="单位")
    remind_time: Optional[str] = Field('', description="提醒时间")
    description: Optional[str] = Field('', description="任务描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateTaskRequest(BaseModel):
    name: Optional[str] = Field(None, description="任务名称")
    type: Optional[int] = Field(None, description="任务类型")
    icon: Optional[str] = Field(None, description="任务图标")
    target_value: Optional[int] = Field(None, description="目标值")
    unit: Optional[str] = Field(None, description="单位")
    remind_time: Optional[str] = Field(None, description="提醒时间")
    description: Optional[str] = Field(None, description="任务描述")
    sort_order: Optional[int] = Field(None, description="排序")


class DakaTaskController:
    def __init__(self):
        from app.business.daka.task_business import DakaTaskBusiness
        from app.business.daka.user_business import DakaUserBusiness
        self.task_business = DakaTaskBusiness()
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

    def ActionDakaTaskListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户任务列表
        GET /api/daka/task/list/get
        获取当前用户的所有任务列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_user_tasks(user.get('id'))

    def ActionDakaTaskTypeListGet(self, request: Request, task_type: int = Query(..., description="任务类型"),
                                   authorization: Optional[str] = Header(None)):
        """
        按类型获取任务列表
        GET /api/daka/task/type/list/get
        根据任务类型获取用户任务列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_user_tasks_by_type(user.get('id'), task_type)

    def ActionDakaTaskDetailGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取任务详情
        GET /api/daka/task/detail/get
        根据任务ID获取任务详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.get_task_detail(task_id, user.get('id'))

    def ActionDakaTaskCreatePost(self, request: Request, body: CreateTaskRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建自定义任务
        POST /api/daka/task/create
        创建用户自定义任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.create_custom_task(
            user_id=user.get('id'),
            name=body.name,
            task_type=body.type,
            icon=body.icon,
            target_value=body.target_value,
            unit=body.unit,
            remind_time=body.remind_time,
            description=body.description,
            sort_order=body.sort_order
        )

    def ActionDakaTaskUpdatePost(self, request: Request, body: UpdateTaskRequest,
                                  task_id: int = Query(..., description="任务ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        更新任务
        POST /api/daka/task/update
        更新用户自定义任务信息
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
        if body.name is not None:
            data['name'] = body.name
        if body.type is not None:
            data['type'] = body.type
        if body.icon is not None:
            data['icon'] = body.icon
        if body.target_value is not None:
            data['target_value'] = body.target_value
        if body.unit is not None:
            data['unit'] = body.unit
        if body.remind_time is not None:
            data['remind_time'] = body.remind_time
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order

        return self.task_business.update_task(task_id, user.get('id'), data)

    def ActionDakaTaskDeletePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除任务
        POST /api/daka/task/delete
        删除用户自定义任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.task_business.delete_task(task_id, user.get('id'))

    def ActionDakaTaskTypesGet(self, request: Request):
        """
        获取任务类型列表
        GET /api/daka/task/types/get
        获取所有任务类型及其说明
        """
        return self.task_business.get_task_types()

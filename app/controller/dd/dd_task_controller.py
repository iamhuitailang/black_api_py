from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PublishTaskRequest(BaseModel):
    title: str = Field(..., description="任务标题")
    category: str = Field(..., description="任务分类：跑腿/搬家/家政/维修/其他")
    description: Optional[str] = Field('', description="详细描述")
    budget: float = Field(0.0, description="预算金额")
    address: Optional[str] = Field('', description="任务地址")
    scheduled_hours: Optional[int] = Field(6, description="约定时间（小时后）")


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = Field(None, description="任务标题")
    category: Optional[str] = Field(None, description="任务分类")
    description: Optional[str] = Field(None, description="详细描述")
    budget: Optional[float] = Field(None, description="预算金额")
    address: Optional[str] = Field(None, description="任务地址")


class DdTaskController:
    def __init__(self):
        from app.business.dd.task_business import DdTaskBusiness
        from app.business.dd.user_business import DdUserBusiness
        self.task_business = DdTaskBusiness()
        self.user_business = DdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDdTaskPublishPost(self, request: Request, body: PublishTaskRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        发布任务接口
        POST /api/dd/task/publish
        发布新任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.task_business.publish_task(
            publisher_id=user.get('id'),
            title=body.title,
            category=body.category,
            description=body.description,
            budget=body.budget,
            address=body.address,
            scheduled_hours=body.scheduled_hours
        )

    def ActionDdTaskDetailGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取任务详情接口
        GET /api/dd/task/detail/get
        根据任务ID获取任务详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None
        
        return self.task_business.get_task_detail(task_id, user_id)

    def ActionDdTaskListGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                             page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                             category: Optional[str] = Query(None, description="任务分类"),
                             keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取任务列表接口
        GET /api/dd/task/list/get
        获取待接单的任务列表，支持分类筛选和关键词搜索
        """
        return self.task_business.get_pending_tasks(page, page_size, category, keyword)

    def ActionDdTaskMyPublishedGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    status: Optional[int] = Query(None, description="任务状态"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我发布的任务接口
        GET /api/dd/task/my/published/get
        获取当前用户发布的任务列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.task_business.get_my_published_tasks(user.get('id'), page, page_size, status)

    def ActionDdTaskMyReceivedGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[int] = Query(None, description="任务状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我接单的任务接口
        GET /api/dd/task/my/received/get
        获取当前用户接单的任务列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.task_business.get_my_received_tasks(user.get('id'), page, page_size, status)

    def ActionDdTaskUpdatePost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                body: UpdateTaskRequest = None,
                                authorization: Optional[str] = Header(None)):
        """
        更新任务接口
        POST /api/dd/task/update
        更新待接单状态的任务信息
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
        if body.category is not None:
            data['category'] = body.category
        if body.description is not None:
            data['description'] = body.description
        if body.budget is not None:
            data['budget'] = body.budget
        if body.address is not None:
            data['address'] = body.address
        
        return self.task_business.update_task(user.get('id'), task_id, data)

    def ActionDdTaskCancelPost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                authorization: Optional[str] = Header(None)):
        """
        取消任务接口
        POST /api/dd/task/cancel
        取消自己发布的任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.task_business.cancel_task(user.get('id'), task_id)

    def ActionDdTaskCategoriesGet(self, request: Request):
        """
        获取任务分类接口
        GET /api/dd/task/categories/get
        获取所有任务分类
        """
        return self.task_business.get_categories()

    def ActionDdTaskStatusesGet(self, request: Request):
        """
        获取任务状态列表接口
        GET /api/dd/task/statuses/get
        获取所有任务状态及说明
        """
        return self.task_business.get_statuses()

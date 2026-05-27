from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateComplaintRequest(BaseModel):
    type: str = Field(..., description="类型：complaint/suggestion")
    category_id: int = Field(..., description="分类ID")
    department_id: int = Field(..., description="部门ID")
    title: str = Field(..., description="标题")
    content: str = Field(..., description="内容")
    priority: Optional[int] = Field(1, description="优先级：1-4")
    is_anonymous: Optional[int] = Field(0, description="是否匿名：0否1是")
    expected_time: Optional[str] = Field(None, description="期望处理时间")


class UpdateComplaintRequest(BaseModel):
    category_id: Optional[int] = Field(None, description="分类ID")
    department_id: Optional[int] = Field(None, description="部门ID")
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="内容")
    priority: Optional[int] = Field(None, description="优先级")
    is_anonymous: Optional[int] = Field(None, description="是否匿名")
    expected_time: Optional[str] = Field(None, description="期望处理时间")


class HandleResultRequest(BaseModel):
    handle_result: str = Field(..., description="处理结果")


class RejectRequest(BaseModel):
    reason: str = Field(..., description="驳回原因")


class FeedbackRequest(BaseModel):
    content: str = Field(..., description="反馈内容")


class EvaluationRequest(BaseModel):
    rating: int = Field(..., description="评分：1-5")
    content: Optional[str] = Field(None, description="评价内容")


class TousuComplaintController:
    def __init__(self):
        from app.business.tousu.complaint_business import TousuComplaintBusiness
        self.complaint_business = TousuComplaintBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tousu.user_business import TousuUserBusiness
        user_business = TousuUserBusiness()
        return user_business.verify_token(token)

    def ActionTousuComplaintCreatePost(self, request: Request, body: CreateComplaintRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        提交投诉建议接口
        POST /api/tousu/complaint/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.create_complaint(
            user_id=user.get('id'),
            complaint_type=body.type,
            category_id=body.category_id,
            department_id=body.department_id,
            title=body.title,
            content=body.content,
            priority=body.priority or 1,
            is_anonymous=body.is_anonymous or 0,
            expected_time=body.expected_time
        )

    def ActionTousuComplaintDetailGet(self, request: Request,
                                      complaint_id: int = Query(..., description="投诉建议ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取投诉建议详情接口
        GET /api/tousu/complaint/detail/get
        """
        return self.complaint_business.get_complaint_detail(complaint_id)

    def ActionTousuComplaintMyListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      type: Optional[str] = Query(None, description="类型"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的投诉建议列表接口
        GET /api/tousu/complaint/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_user_complaints(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            complaint_type=type,
            status=status
        )

    def ActionTousuComplaintUpdatePost(self, request: Request, body: UpdateComplaintRequest,
                                       complaint_id: int = Query(..., description="投诉建议ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        修改投诉建议接口
        POST /api/tousu/complaint/update
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
        if body.category_id is not None:
            data['category_id'] = body.category_id
        if body.department_id is not None:
            data['department_id'] = body.department_id
        if body.title is not None:
            data['title'] = body.title
        if body.content is not None:
            data['content'] = body.content
        if body.priority is not None:
            data['priority'] = body.priority
        if body.is_anonymous is not None:
            data['is_anonymous'] = body.is_anonymous
        if body.expected_time is not None:
            data['expected_time'] = body.expected_time

        return self.complaint_business.update_complaint(complaint_id, data)

    def ActionTousuComplaintCancelPost(self, request: Request,
                                       complaint_id: int = Query(..., description="投诉建议ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        撤回投诉建议接口
        POST /api/tousu/complaint/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.cancel_complaint(complaint_id, user.get('id'))

    def ActionTousuComplaintAcceptPost(self, request: Request,
                                       complaint_id: int = Query(..., description="投诉建议ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        受理投诉建议接口
        POST /api/tousu/complaint/accept
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.accept_complaint(complaint_id, user.get('id'))

    def ActionTousuComplaintProcessPost(self, request: Request,
                                        complaint_id: int = Query(..., description="投诉建议ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        标记处理中接口
        POST /api/tousu/complaint/process
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.process_complaint(complaint_id, user.get('id'))

    def ActionTousuComplaintCompletePost(self, request: Request, body: HandleResultRequest,
                                         complaint_id: int = Query(..., description="投诉建议ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        完成处理接口
        POST /api/tousu/complaint/complete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.complete_complaint(
            complaint_id, user.get('id'), body.handle_result
        )

    def ActionTousuComplaintRejectPost(self, request: Request, body: RejectRequest,
                                       complaint_id: int = Query(..., description="投诉建议ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        驳回投诉建议接口
        POST /api/tousu/complaint/reject
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.reject_complaint(
            complaint_id, user.get('id'), body.reason
        )

    def ActionTousuComplaintFeedbackAddPost(self, request: Request, body: FeedbackRequest,
                                            complaint_id: int = Query(..., description="投诉建议ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        添加处理反馈接口
        POST /api/tousu/complaint/feedback/add
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.add_feedback(
            complaint_id, user.get('id'), body.content
        )

    def ActionTousuComplaintEvaluationPost(self, request: Request, body: EvaluationRequest,
                                           complaint_id: int = Query(..., description="投诉建议ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        提交评价接口
        POST /api/tousu/complaint/evaluation
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.create_evaluation(
            complaint_id, user.get('id'), body.rating, body.content or ''
        )

    def ActionTousuComplaintListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    type: Optional[str] = Query(None, description="类型"),
                                    category_id: Optional[int] = Query(None, description="分类ID"),
                                    department_id: Optional[int] = Query(None, description="部门ID"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    priority: Optional[int] = Query(None, description="优先级"),
                                    keyword: Optional[str] = Query(None, description="关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取投诉建议列表接口
        GET /api/tousu/complaint/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_all_complaints(
            page, page_size, type, category_id, department_id, status, priority, keyword
        )

    def ActionTousuComplaintDepartmentListGet(self, request: Request,
                                              department_id: int = Query(..., description="部门ID"),
                                              page: int = Query(1, description="页码"),
                                              page_size: int = Query(10, description="每页数量"),
                                              status: Optional[int] = Query(None, description="状态"),
                                              type: Optional[str] = Query(None, description="类型"),
                                              authorization: Optional[str] = Header(None)):
        """
        获取部门投诉建议列表接口
        GET /api/tousu/complaint/department/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_department_complaints(
            department_id, page, page_size, status, type
        )

    def ActionTousuComplaintHandlerListGet(self, request: Request,
                                           page: int = Query(1, description="页码"),
                                           page_size: int = Query(10, description="每页数量"),
                                           status: Optional[int] = Query(None, description="状态"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取我处理的投诉建议列表接口
        GET /api/tousu/complaint/handler/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_handler_complaints(
            user.get('id'), page, page_size, status
        )

    def ActionTousuComplaintStatisticsGet(self, request: Request,
                                          department_id: Optional[int] = Query(None, description="部门ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取统计数据接口
        GET /api/tousu/complaint/statistics/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_statistics(department_id)

    def ActionTousuComplaintExportGet(self, request: Request,
                                      department_id: Optional[int] = Query(None, description="部门ID"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        导出投诉建议数据接口
        GET /api/tousu/complaint/export/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.export_complaints(department_id, status)
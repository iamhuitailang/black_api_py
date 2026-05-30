from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReportRequest(BaseModel):
    type: int = Field(..., description="举报类型")
    target_id: int = Field(..., description="目标ID")
    reason: str = Field(..., description="举报原因")
    description: Optional[str] = Field('', description="详细描述")
    images: Optional[str] = Field('', description="图片")


class HandleReportRequest(BaseModel):
    report_id: int = Field(..., description="举报ID")
    status: int = Field(..., description="处理状态")
    handle_result: Optional[str] = Field('', description="处理结果")


class BqReportController:
    def __init__(self):
        from app.business.biaoqing_model.report_business import BqReportBusiness
        self.report_business = BqReportBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.biaoqing_model.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqReportCreatePost(self, request: Request, body: CreateReportRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建举报接口
        POST /api/bq/report/create
        用户提交举报
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.create(
            user_id=user.get('id'),
            type=body.type,
            target_id=body.target_id,
            reason=body.reason,
            description=body.description or '',
            images=body.images or ''
        )

    def ActionBqReportDetailGet(self, request: Request, report_id: int = Query(..., description="举报ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取举报详情接口
        GET /api/bq/report/detail/get
        根据ID获取举报详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.get_by_id(report_id)

    def ActionBqReportMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的举报列表接口
        GET /api/bq/report/my/list/get
        获取当前用户的举报记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.get_user_reports(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionBqReportListGet(self, request: Request, page: int = Query(1, description="页码"),
                               page_size: int = Query(20, description="每页数量"),
                               status: Optional[int] = Query(None, description="状态"),
                               type: Optional[int] = Query(None, description="举报类型"),
                               authorization: Optional[str] = Header(None)):
        """
        获取举报列表接口（管理员）
        GET /api/bq/report/list/get
        分页获取所有举报记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.report_business.get_list(
            page=page,
            page_size=page_size,
            status=status,
            type=type
        )

    def ActionBqReportHandlePost(self, request: Request, body: HandleReportRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        处理举报接口（管理员）
        POST /api/bq/report/handle
        处理用户举报
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.report_business.handle(
            report_id=body.report_id,
            status=body.status,
            handle_result=body.handle_result or '',
            handled_by=user.get('id', 0)
        )

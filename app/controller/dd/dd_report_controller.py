from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SubmitReportRequest(BaseModel):
    reported_id: int = Field(..., description="被举报人ID")
    task_id: Optional[int] = Field(None, description="关联任务ID")
    reason: str = Field(..., description="举报原因")


class HandleReportRequest(BaseModel):
    report_id: int = Field(..., description="举报ID")
    result: str = Field(..., description="处理结果")
    credit_adjust: Optional[int] = Field(0, description="信用分调整，正数加分，负数扣分")


class DdReportController:
    def __init__(self):
        from app.business.dd.report_business import DdReportBusiness
        from app.business.dd.user_business import DdUserBusiness
        self.report_business = DdReportBusiness()
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

    def ActionDdReportSubmitPost(self, request: Request, body: SubmitReportRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        提交举报接口
        POST /api/dd/report/submit
        举报用户
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.report_business.submit_report(
            reporter_id=user.get('id'),
            reported_id=body.reported_id,
            reason=body.reason,
            task_id=body.task_id
        )

    def ActionDdReportMyListGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的举报列表接口
        GET /api/dd/report/my/list/get
        获取当前用户提交的举报列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.report_business.get_my_reports(user.get('id'), page, page_size)

    def ActionDdReportDetailGet(self, request: Request, report_id: int = Query(..., description="举报ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取举报详情接口
        GET /api/dd/report/detail/get
        获取举报记录详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.report_business.get_report_detail(user.get('id'), report_id)

    def ActionDdReportPendingListGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取待处理举报列表接口
        GET /api/dd/report/pending/list/get
        获取所有待处理的举报列表（管理员接口）
        """
        return self.report_business.get_pending_reports(page, page_size)

    def ActionDdReportHandlePost(self, request: Request, body: HandleReportRequest):
        """
        处理举报接口
        POST /api/dd/report/handle
        处理举报（管理员接口）
        """
        return self.report_business.handle_report(
            report_id=body.report_id,
            result=body.result,
            credit_adjust=body.credit_adjust
        )

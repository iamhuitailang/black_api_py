from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReportRequest(BaseModel):
    report_type: int = Field(..., description="举报类型(1:物品,2:用户,3:交换)")
    target_id: int = Field(..., description="目标ID")
    reason: str = Field(..., description="举报原因")
    description: str = Field(default='', description="详细描述")


class ProcessReportRequest(BaseModel):
    report_id: int = Field(..., description="举报ID")
    status: int = Field(..., description="处理状态")
    handle_note: str = Field(default='', description="处理备注")


class ExAdminController:
    def __init__(self):
        from app.business.exchange import ExAdminBusiness, ExUserBusiness, ExItemBusiness, ExExchangeBusiness
        self.admin_business = ExAdminBusiness()
        self.user_business = ExUserBusiness()
        self.item_business = ExItemBusiness()
        self.exchange_business = ExExchangeBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionExAdminDashboardGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        获取管理后台统计数据接口
        GET /api/ex/admin/dashboard/get
        获取平台统计数据
        """
        return self.admin_business.get_statistics()

    def ActionExAdminUserListGet(self, request: Request,
                                   status: int = Query(None, description="用户状态"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/ex/admin/user/list/get
        管理后台获取用户列表
        """
        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExAdminUserBanPost(self, request: Request,
                                   user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        封禁用户接口
        POST /api/ex/admin/user/ban
        管理后台封禁用户
        """
        return self.admin_business.ban_user(user_id=user_id)

    def ActionExAdminUserUnbanPost(self, request: Request,
                                     user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/ex/admin/user/unban
        管理后台解封用户
        """
        return self.admin_business.unban_user(user_id=user_id)

    def ActionExAdminItemListGet(self, request: Request,
                                  status: int = Query(None, description="物品状态"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取物品列表接口
        GET /api/ex/admin/item/list/get
        管理后台获取物品列表
        """
        return self.item_business.get_all_items(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExAdminItemOffShelfPost(self, request: Request,
                                        item_id: int = Query(..., description="物品ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        下架物品接口
        POST /api/ex/admin/item/off/shelf
        管理后台下架违规物品
        """
        return self.admin_business.take_item_off_shelf(item_id=item_id)

    def ActionExAdminReportListGet(self, request: Request,
                                     status: int = Query(None, description="举报状态"),
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取举报列表接口
        GET /api/ex/admin/report/list/get
        管理后台获取举报列表
        """
        return self.admin_business.get_report_list(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExAdminReportProcessPost(self, request: Request, body: ProcessReportRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        处理举报接口
        POST /api/ex/admin/report/process
        管理后台处理举报
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        handler_id = user.get('id') if user else 0
        
        return self.admin_business.process_report(
            report_id=body.report_id,
            handler_id=handler_id,
            status=body.status,
            handle_note=body.handle_note
        )

    def ActionExAdminExchangeListGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取交换列表接口
        GET /api/ex/admin/exchange/list/get
        管理后台获取交换记录列表
        """
        return self.exchange_business.get_all_exchanges(
            page=page,
            page_size=page_size
        )

    def ActionExReportCreatePost(self, request: Request, body: CreateReportRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        用户提交举报接口
        POST /api/ex/report/create
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
        
        return self.admin_business.create_report(
            reporter_id=user.get('id'),
            report_type=body.report_type,
            target_id=body.target_id,
            reason=body.reason,
            description=body.description
        )

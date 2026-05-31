from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateComplaintRequest(BaseModel):
    target_user_id: Optional[int] = Field(0, description="被投诉用户ID")
    trade_id: Optional[int] = Field(0, description="关联交易ID")
    reason: str = Field(..., description="投诉原因")
    description: Optional[str] = Field('', description="详细描述")


class HandleComplaintRequest(BaseModel):
    status: Optional[int] = Field(None, description="处理状态")
    admin_reply: Optional[str] = Field(None, description="管理员回复")


class ErshoushuComplaintController:
    def __init__(self):
        from app.business.ershoushu_077_model.complaint_business import ErshoushuComplaintBusiness
        from app.business.ershoushu_077_model.user_business import ErshoushuUserBusiness
        self.complaint_business = ErshoushuComplaintBusiness()
        self.user_business = ErshoushuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionErshoushuComplaintCreatePost(self, request: Request, body: CreateComplaintRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        提交投诉接口
        POST /api/ershoushu/complaint/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.complaint_business.create_complaint(
            user_id=user.get('id'),
            target_user_id=body.target_user_id or 0,
            trade_id=body.trade_id or 0,
            reason=body.reason,
            description=body.description or ''
        )

    def ActionErshoushuComplaintMyListGet(self, request: Request,
                                           page: int = Query(1, ge=1, description="页码"),
                                           page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取我的投诉列表接口
        GET /api/ershoushu/complaint/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.complaint_business.get_my_complaints(user.get('id'), page, page_size)

    def ActionErshoushuComplaintAdminListGet(self, request: Request,
                                              page: int = Query(1, ge=1, description="页码"),
                                              page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                              status: Optional[int] = Query(None, description="状态"),
                                              authorization: Optional[str] = Header(None)):
        """
        管理端获取投诉列表接口
        GET /api/ershoushu/complaint/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.complaint_business.get_all_complaints(page, page_size, status)

    def ActionErshoushuComplaintHandlePost(self, request: Request, complaint_id: int = Query(..., description="投诉ID"),
                                            body: HandleComplaintRequest = None,
                                            authorization: Optional[str] = Header(None)):
        """
        处理投诉接口
        POST /api/ershoushu/complaint/handle
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.complaint_business.handle_complaint(
            complaint_id=complaint_id,
            status=body.status if body else None,
            admin_reply=body.admin_reply if body else ''
        )

    def ActionErshoushuComplaintStatisticsGet(self, request: Request):
        """
        获取投诉统计接口
        GET /api/ershoushu/complaint/statistics/get
        """
        return self.complaint_business.get_statistics()

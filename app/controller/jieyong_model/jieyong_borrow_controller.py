from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BorrowItemRequest(BaseModel):
    item_id: int = Field(..., description="物品ID")
    quantity: int = Field(1, description="借用数量")
    expected_return_date: str = Field(..., description="预计归还时间")
    remark: Optional[str] = Field('', description="备注")


class ReturnItemRequest(BaseModel):
    borrow_id: int = Field(..., description="借用记录ID")
    fine_amount: Optional[float] = Field(0, description="罚款金额")


class ApproveBorrowRequest(BaseModel):
    borrow_id: int = Field(..., description="借用记录ID")


class RejectBorrowRequest(BaseModel):
    borrow_id: int = Field(..., description="借用记录ID")
    reject_reason: str = Field(..., description="拒绝原因")


class JieyongBorrowController:
    def __init__(self):
        from app.business.jieyong_model.borrow_business import JieyongBorrowBusiness
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.borrow_business = JieyongBorrowBusiness()
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongBorrowCreatePost(self, request: Request, body: BorrowItemRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        借用物品接口
        POST /api/jieyong_model/borrow/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.borrow_business.borrow_item(
            user_id=user.get('id'),
            item_id=body.item_id,
            quantity=body.quantity,
            expected_return_date=body.expected_return_date,
            remark=body.remark or ''
        )

    def ActionJieyongBorrowReturnPost(self, request: Request, body: ReturnItemRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        归还物品接口
        POST /api/jieyong_model/borrow/return
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        admin_id = None
        if self.auth_business.is_admin(user.get('id')):
            admin_id = user.get('id')

        return self.borrow_business.return_item(
            borrow_id=body.borrow_id,
            user_id=user.get('id'),
            fine_amount=body.fine_amount or 0,
            admin_id=admin_id
        )

    def ActionJieyongBorrowApprovePost(self, request: Request, body: ApproveBorrowRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        审核通过借用申请接口（管理员）
        POST /api/jieyong_model/borrow/approve
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.borrow_business.approve_borrow(
            borrow_id=body.borrow_id,
            admin_id=admin.get('id')
        )

    def ActionJieyongBorrowRejectPost(self, request: Request, body: RejectBorrowRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        拒绝借用申请接口（管理员）
        POST /api/jieyong_model/borrow/reject
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.borrow_business.reject_borrow(
            borrow_id=body.borrow_id,
            reject_reason=body.reject_reason,
            admin_id=admin.get('id')
        )

    def ActionJieyongBorrowDetailGet(self, request: Request, borrow_id: int = Query(..., description="借用记录ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取借用记录详情接口
        GET /api/jieyong_model/borrow/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        result = self.borrow_business.get_by_id(borrow_id)
        if result.get('code') == 0 and result.get('data'):
            borrow_data = result.get('data')
            if not self.auth_business.is_admin(user.get('id')) and borrow_data.get('user_id') != user.get('id'):
                return {'code': 1, 'msg': '无权查看此记录', 'data': None}

        return result

    def ActionJieyongBorrowMyGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的借用记录接口
        GET /api/jieyong_model/borrow/my/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.borrow_business.get_my_borrows(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJieyongBorrowListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    user_id: Optional[int] = Query(None, description="用户ID"),
                                    item_id: Optional[int] = Query(None, description="物品ID"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="关键词"),
                                    start_date: Optional[str] = Query(None, description="开始日期"),
                                    end_date: Optional[str] = Query(None, description="结束日期"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取借用记录列表接口（管理员）
        GET /api/jieyong_model/borrow/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.borrow_business.get_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            item_id=item_id,
            status=status,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date
        )

    def ActionJieyongBorrowOverdueGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取逾期记录列表接口（管理员）
        GET /api/jieyong_model/borrow/overdue/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.borrow_business.get_overdue_list(page, page_size)

    def ActionJieyongBorrowCheckOverduePost(self, request: Request,
                                             authorization: Optional[str] = Header(None)):
        """
        检查并标记逾期接口（管理员）
        POST /api/jieyong_model/borrow/check/overdue
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.borrow_business.check_and_mark_overdue()

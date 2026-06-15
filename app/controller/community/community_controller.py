from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from app.business.community import CommunityBusiness
from app.business.auth import AuthBusiness


class PublishItemRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")
    name: str = Field(..., description="物品名称")
    category: str = Field(..., description="类别：tool/outdoor/kitchen/electronic/sport/other")
    description: str = Field(..., description="物品描述")
    condition: str = Field(..., description="状态：new/like_new/usable")
    borrow_rule: str = Field(..., description="借用规则")
    available_times: list = Field(..., description="可借出时间段")
    image_url: Optional[str] = Field(None, description="物品图片URL")


class UpdateItemRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")
    name: Optional[str] = Field(None)
    category: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    condition: Optional[str] = Field(None)
    borrow_rule: Optional[str] = Field(None)
    available_times: Optional[list] = Field(None)
    image_url: Optional[str] = Field(None)
    status: Optional[str] = Field(None)


class BorrowRequestRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")
    item_id: int = Field(..., description="物品ID")
    date_range: dict = Field(..., description="借用日期范围 {start, end}")
    message: Optional[str] = Field(None, description="留言")


class ApproveRequestRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")


class RejectRequestRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")
    reason: Optional[str] = Field(None, description="拒绝原因")


class ReviewRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="用户ID（用于无token测试）")
    record_id: int = Field(..., description="借用记录ID")
    rating: int = Field(..., description="评分1-5")
    comment: Optional[str] = Field(None, description="评价文字")


class CommunityController:
    def __init__(self):
        self.community_business = CommunityBusiness()
        self.auth_business = AuthBusiness()

    def _get_user_id(self, request: Request, authorization: Optional[str], body_user_id: Optional[int] = None) -> Optional[int]:
        if body_user_id:
            return body_user_id
        token = ''
        if authorization and authorization.startswith('Bearer '):
            token = authorization[7:]
        if not token:
            token = request.query_params.get('token', '')
        if token:
            user = self.auth_business.verify_token(token)
            if user:
                return user.get('id')
        return None

    def ActionCommunityItemPublishPost(self, request: Request, body: PublishItemRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        发布物品
        POST /api/community/item/publish
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.publish_item(
            owner_id=user_id,
            name=body.name,
            category=body.category,
            description=body.description,
            condition=body.condition,
            borrow_rule=body.borrow_rule,
            available_times=body.available_times,
            image_url=body.image_url
        )

    def ActionCommunityItemListGet(self, request: Request,
                                    category: Optional[str] = Query(None),
                                    condition: Optional[str] = Query(None),
                                    status: Optional[str] = Query(None),
                                    owner_id: Optional[int] = Query(None),
                                    keyword: Optional[str] = Query(None),
                                    page: int = Query(1),
                                    page_size: int = Query(20),
                                    authorization: Optional[str] = Header(None)):
        """
        查询物品列表
        GET /api/community/item/list/get
        """
        return self.community_business.get_item_list(
            category=category,
            condition=condition,
            status=status,
            owner_id=owner_id,
            keyword=keyword,
            page=page,
            page_size=page_size
        )

    def ActionCommunityItemDetailGet(self, request: Request,
                                      item_id: int = Query(...),
                                      authorization: Optional[str] = Header(None)):
        """
        查询物品详情
        GET /api/community/item/detail/get
        """
        return self.community_business.get_item_detail(item_id)

    def ActionCommunityItemUpdatePut(self, request: Request, body: UpdateItemRequest,
                                      item_id: int = Query(...),
                                      authorization: Optional[str] = Header(None)):
        """
        更新物品信息
        PUT /api/community/item/update
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        kwargs = {}
        for field in ['name', 'category', 'description', 'condition', 'borrow_rule',
                      'available_times', 'image_url', 'status']:
            val = getattr(body, field, None)
            if val is not None:
                kwargs[field] = val
        return self.community_business.update_item(user_id, item_id, **kwargs)

    def ActionCommunityItemDelete(self, request: Request,
                                   user_id: Optional[int] = Query(None),
                                   item_id: int = Query(...),
                                   authorization: Optional[str] = Header(None)):
        """
        删除物品
        DELETE /api/community/item/delete
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.delete_item(uid, item_id)

    def ActionCommunityBorrowRequestSubmitPost(self, request: Request, body: BorrowRequestRequest,
                                                authorization: Optional[str] = Header(None)):
        """
        提交借用申请
        POST /api/community/borrow/request/submit
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.create_borrow_request(
            borrower_id=user_id,
            item_id=body.item_id,
            date_range=body.date_range,
            message=body.message
        )

    def ActionCommunityBorrowRequestMyGet(self, request: Request,
                                           status: Optional[str] = Query(None),
                                           user_id: Optional[int] = Query(None),
                                           authorization: Optional[str] = Header(None)):
        """
        查询我的借用申请（借入方）
        GET /api/community/borrow/request/my/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_borrow_requests_by_borrower(uid, status)

    def ActionCommunityBorrowRequestReceivedGet(self, request: Request,
                                                  status: Optional[str] = Query(None),
                                                  user_id: Optional[int] = Query(None),
                                                  authorization: Optional[str] = Header(None)):
        """
        查询收到的借用申请（借出方）
        GET /api/community/borrow/request/received/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_borrow_requests_by_owner(uid, status)

    def ActionCommunityBorrowRequestApprovePost(self, request: Request, body: ApproveRequestRequest,
                                                 request_id: int = Query(...),
                                                 authorization: Optional[str] = Header(None)):
        """
        同意借用申请
        POST /api/community/borrow/request/approve
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.approve_borrow_request(user_id, request_id)

    def ActionCommunityBorrowRequestRejectPost(self, request: Request, body: RejectRequestRequest,
                                                request_id: int = Query(...),
                                                authorization: Optional[str] = Header(None)):
        """
        拒绝借用申请
        POST /api/community/borrow/request/reject
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.reject_borrow_request(user_id, request_id, body.reason)

    def ActionCommunityBorrowRequestCancelPost(self, request: Request, body: ApproveRequestRequest,
                                                request_id: int = Query(...),
                                                authorization: Optional[str] = Header(None)):
        """
        取消借用申请
        POST /api/community/borrow/request/cancel
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.cancel_borrow_request(user_id, request_id)

    def ActionCommunityBorrowRecordMarkBorrowedPost(self, request: Request, body: ApproveRequestRequest,
                                                     record_id: int = Query(...),
                                                     authorization: Optional[str] = Header(None)):
        """
        标记已借出
        POST /api/community/borrow/record/mark/borrowed
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.mark_item_borrowed(user_id, record_id)

    def ActionCommunityBorrowRecordMarkReturnedPost(self, request: Request, body: ApproveRequestRequest,
                                                     record_id: int = Query(...),
                                                     authorization: Optional[str] = Header(None)):
        """
        标记已归还
        POST /api/community/borrow/record/mark/returned
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.mark_item_returned(user_id, record_id)

    def ActionCommunityBorrowRecordMyGet(self, request: Request,
                                          status: Optional[str] = Query(None),
                                          user_id: Optional[int] = Query(None),
                                          authorization: Optional[str] = Header(None)):
        """
        查询我的借用记录（借入方）
        GET /api/community/borrow/record/my/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_borrow_records_by_borrower(uid, status)

    def ActionCommunityBorrowRecordLentGet(self, request: Request,
                                            status: Optional[str] = Query(None),
                                            user_id: Optional[int] = Query(None),
                                            authorization: Optional[str] = Header(None)):
        """
        查询我的借出记录（借出方）
        GET /api/community/borrow/record/lent/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_borrow_records_by_owner(uid, status)

    def ActionCommunityReviewSubmitPost(self, request: Request, body: ReviewRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        提交评价
        POST /api/community/review/submit
        """
        user_id = self._get_user_id(request, authorization, body.user_id)
        if not user_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.create_review(
            reviewer_id=user_id,
            record_id=body.record_id,
            rating=body.rating,
            comment=body.comment
        )

    def ActionCommunityUserCreditGet(self, request: Request,
                                      user_id: int = Query(...),
                                      authorization: Optional[str] = Header(None)):
        """
        查询用户信誉
        GET /api/community/user/credit/get
        """
        return self.community_business.get_user_credit(user_id)

    def ActionCommunityOverdueCheckGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        检查超时提醒（系统触发）
        GET /api/community/overdue/check/get
        """
        return self.community_business.check_overdue_reminders()

    def ActionCommunityOverdueMyGet(self, request: Request,
                                     user_id: Optional[int] = Query(None),
                                     authorization: Optional[str] = Header(None)):
        """
        查询我的超时提醒
        GET /api/community/overdue/my/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_user_overdue_reminders(uid)

    def ActionCommunityContactGet(self, request: Request,
                                   record_id: int = Query(...),
                                   user_id: Optional[int] = Query(None),
                                   authorization: Optional[str] = Header(None)):
        """
        获取对方联系方式（审批通过后）
        GET /api/community/contact/get
        """
        uid = self._get_user_id(request, authorization, user_id)
        if not uid:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.community_business.get_contact_info(uid, record_id)

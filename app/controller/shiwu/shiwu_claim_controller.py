from typing import Optional, Union
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateClaimRequest(BaseModel):
    post_id: int = Field(..., description="招领信息ID")
    description: Optional[str] = Field(None, description="认领说明")
    item_features: Optional[str] = Field(None, description="物品特征描述")
    contact: Optional[str] = Field(None, description="联系方式")


class RejectClaimRequest(BaseModel):
    reject_reason: Optional[str] = Field(None, description="拒绝原因")


class CreateReviewRequest(BaseModel):
    claim_id: int = Field(..., description="认领申请ID")
    rating: int = Field(5, description="评分 1-5")
    content: Optional[str] = Field(None, description="评价内容")


class ShiwuClaimController:
    def __init__(self):
        from app.business.shiwu.claim_business import ClaimBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.claim_business = ClaimBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShiwuClaimCreatePost(self, request: Request, body: CreateClaimRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        提交认领申请接口
        POST /api/shiwu/claim/create
        用户对招领启事提交认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.create_claim(
            claimant_id=user.get('id'),
            post_id=body.post_id,
            description=body.description or '',
            item_features=body.item_features or '',
            contact=body.contact or ''
        )

    def ActionShiwuClaimDetailGet(self, request: Request,
                                   claim_id: int = Query(..., description="申请ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取认领申请详情接口
        GET /api/shiwu/claim/detail/get
        根据申请ID获取详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        current_user_id = user.get('id') if user else None

        return self.claim_business.get_claim_by_id(
            claim_id=claim_id,
            current_user_id=current_user_id
        )

    def ActionShiwuClaimByPostGet(self, request: Request,
                                   post_id: int = Query(..., description="信息ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取某信息收到的认领申请接口
        GET /api/shiwu/claim/by/post/get
        信息发布者查看收到的认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.get_claims_by_post(
            post_id=post_id,
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionShiwuClaimMyListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   status: Optional[Union[str, int]] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我提交的认领申请接口
        GET /api/shiwu/claim/my/list/get
        获取当前用户提交的认领申请列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        status_raw = request.query_params.get('status')
        from app.model.shiwu_model.claim import ClaimModel
        status_map = {
            'pending': ClaimModel.STATUS_PENDING,
            'approved': ClaimModel.STATUS_APPROVED,
            'rejected': ClaimModel.STATUS_REJECTED,
            'completed': ClaimModel.STATUS_COMPLETED
        }
        status_int = None
        if status_raw and status_raw != 'all':
            status_int = status_map.get(status_raw)
            if status_int is None:
                try:
                    status_int = int(status_raw)
                except (ValueError, TypeError):
                    status_int = None

        return self.claim_business.get_my_claims(
            claimant_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status_int
        )

    def ActionShiwuClaimReceivedGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     status: Optional[Union[str, int]] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取我收到的认领申请接口
        GET /api/shiwu/claim/received/get
        获取当前用户发布的信息收到的认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        status_raw = request.query_params.get('status')
        from app.model.shiwu_model.claim import ClaimModel
        status_map = {
            'pending': ClaimModel.STATUS_PENDING,
            'approved': ClaimModel.STATUS_APPROVED,
            'rejected': ClaimModel.STATUS_REJECTED,
            'completed': ClaimModel.STATUS_COMPLETED
        }
        status_int = None
        if status_raw and status_raw != 'all':
            status_int = status_map.get(status_raw)
            if status_int is None:
                try:
                    status_int = int(status_raw)
                except (ValueError, TypeError):
                    status_int = None

        return self.claim_business.get_received_claims(
            owner_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status_int
        )

    def ActionShiwuClaimApprovePost(self, request: Request,
                                     claim_id: int = Query(..., description="申请ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        通过认领申请接口
        POST /api/shiwu/claim/approve
        信息发布者通过认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.approve_claim(
            owner_id=user.get('id'),
            claim_id=claim_id
        )

    def ActionShiwuClaimRejectPost(self, request: Request,
                                    claim_id: int = Query(..., description="申请ID"),
                                    body: RejectClaimRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        拒绝认领申请接口
        POST /api/shiwu/claim/reject
        信息发布者拒绝认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.reject_claim(
            owner_id=user.get('id'),
            claim_id=claim_id,
            reject_reason=body.reject_reason or ''
        )

    def ActionShiwuClaimCompletePost(self, request: Request,
                                      claim_id: int = Query(..., description="申请ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        完成认领接口
        POST /api/shiwu/claim/complete
        双方确认物品交接完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.complete_claim(
            user_id=user.get('id'),
            claim_id=claim_id
        )

    def ActionShiwuClaimCancelPost(self, request: Request,
                                    claim_id: int = Query(..., description="申请ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        取消认领申请接口
        POST /api/shiwu/claim/cancel
        申请人取消待审核的认领申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.cancel_claim(
            claimant_id=user.get('id'),
            claim_id=claim_id
        )

    def ActionShiwuClaimReviewPost(self, request: Request,
                                    body: CreateReviewRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        评价接口
        POST /api/shiwu/claim/review
        认领完成后双方互评
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.create_review(
            reviewer_id=user.get('id'),
            claim_id=body.claim_id,
            rating=body.rating,
            content=body.content or ''
        )

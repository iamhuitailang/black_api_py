from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateClaimRequest(BaseModel):
    post_id: int = Field(..., description="帖子ID")
    comment: Optional[str] = Field(None, description="留言内容")


class XqClaimController:
    def __init__(self):
        from app.business.xq.claim_business import XqClaimBusiness
        from app.business.xq.user_business import XqUserBusiness
        self.claim_business = XqClaimBusiness()
        self.user_business = XqUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXqClaimCreatePost(self, request: Request, body: CreateClaimRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        接单/留言接口
        POST /api/xq/claim/create
        用户对帖子表示"我能帮"
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
            user_id=user.get('id'),
            post_id=body.post_id,
            comment=body.comment or ''
        )

    def ActionXqClaimAcceptPost(self, request: Request, claim_id: int = Query(..., description="申请ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        确认接单接口
        POST /api/xq/claim/accept
        发布者确认某个人的申请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.accept_claim(
            user_id=user.get('id'),
            claim_id=claim_id
        )

    def ActionXqClaimRejectPost(self, request: Request, claim_id: int = Query(..., description="申请ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        拒绝申请接口
        POST /api/xq/claim/reject
        发布者拒绝某个人的申请
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
            user_id=user.get('id'),
            claim_id=claim_id
        )

    def ActionXqClaimCompletePost(self, request: Request, claim_id: int = Query(..., description="申请ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        完成订单接口
        POST /api/xq/claim/complete
        标记订单为已完成
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

    def ActionXqClaimMyListGet(self, request: Request,
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                status: Optional[int] = Query(None, description="状态"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的接单列表接口
        GET /api/xq/claim/my/list/get
        获取当前用户的接单记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.claim_business.get_my_claims(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionXqClaimPostListGet(self, request: Request,
                                  post_id: int = Query(..., description="帖子ID"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取帖子的接单列表接口
        GET /api/xq/claim/post/list/get
        获取某个帖子的所有申请记录
        """
        return self.claim_business.get_post_claims(
            post_id=post_id,
            page=page,
            page_size=page_size
        )

    def ActionXqClaimDetailGet(self, request: Request, claim_id: int = Query(..., description="申请ID")):
        """
        获取申请详情接口
        GET /api/xq/claim/detail/get
        根据申请ID获取详细信息
        """
        return self.claim_business.get_claim_detail(claim_id=claim_id)

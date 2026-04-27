from typing import Optional
from fastapi import Request, Header, Query


class DdClaimController:
    def __init__(self):
        from app.business.dd.claim_business import DdClaimBusiness
        from app.business.dd.user_business import DdUserBusiness
        self.claim_business = DdClaimBusiness()
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

    def ActionDdClaimPost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                           authorization: Optional[str] = Header(None)):
        """
        抢单接口
        POST /api/dd/claim
        抢待接单状态的任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.claim_business.claim_task(user.get('id'), task_id)

    def ActionDdClaimCancelPost(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        取消抢单接口
        POST /api/dd/claim/cancel
        取消已抢的订单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.claim_business.cancel_claim(user.get('id'), task_id)

    def ActionDdClaimMyListGet(self, request: Request, page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                is_cancelled: Optional[int] = Query(None, description="是否取消：0否/1是"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的抢单记录接口
        GET /api/dd/claim/my/list/get
        获取当前用户的抢单记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.claim_business.get_my_claims(user.get('id'), page, page_size, is_cancelled)

    def ActionDdClaimStatusGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                authorization: Optional[str] = Header(None)):
        """
        检查抢单状态接口
        GET /api/dd/claim/status/get
        检查当前用户对某个任务的抢单状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.claim_business.check_claim_status(user.get('id'), task_id)

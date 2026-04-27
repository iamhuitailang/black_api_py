from typing import Optional
from fastapi import Request, Header, Query


class DdContactController:
    def __init__(self):
        from app.business.dd.contact_business import DdContactBusiness
        from app.business.dd.user_business import DdUserBusiness
        self.contact_business = DdContactBusiness()
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

    def ActionDdContactGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                            authorization: Optional[str] = Header(None)):
        """
        获取联系方式接口
        GET /api/dd/contact/get
        抢单成功后获取对方联系方式
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.contact_business.get_contact_info(user.get('id'), task_id)

    def ActionDdContactParticipantsGet(self, request: Request, task_id: int = Query(..., description="任务ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取任务参与者接口
        GET /api/dd/contact/participants/get
        获取任务的发布者和接单者信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.contact_business.get_task_participants(user.get('id'), task_id)

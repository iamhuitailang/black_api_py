from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CheckinRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    location_text: Optional[str] = Field('', description="位置文字")
    remark: Optional[str] = Field('', description="备注")


class HuodongCheckinController:
    def __init__(self):
        from app.business.huodong.checkin_business import CheckinBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.checkin_business = CheckinBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongCheckinDoPost(self, request: Request, body: CheckinRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        活动签到
        POST /api/huodong/checkin/do
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.checkin(
            user_id=user.get('id'),
            activity_id=body.activity_id,
            location_text=body.location_text or '',
            remark=body.remark or ''
        )

    def ActionHuodongCheckinListGet(self, request: Request,
                                     activity_id: int = Query(..., description="活动ID"),
                                     page: int = Query(1, ge=1),
                                     page_size: int = Query(20, ge=1, le=100)):
        """
        获取活动签到列表
        GET /api/huodong/checkin/list/get
        """
        return self.checkin_business.get_checkins_by_activity(activity_id, page, page_size)

    def ActionHuodongCheckinMyListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       authorization: Optional[str] = Header(None)):
        """
        获取我的签到记录
        GET /api/huodong/checkin/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_my_checkins(user.get('id'), page, page_size)

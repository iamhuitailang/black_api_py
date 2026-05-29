from typing import Optional
from fastapi import Request, Header, Query


class HuodongPointsController:
    def __init__(self):
        from app.business.huodong.points_business import PointsBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.points_business = PointsBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongPointsMyListGet(self, request: Request,
                                      page: int = Query(1, ge=1),
                                      page_size: int = Query(20, ge=1, le=100),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的积分记录
        GET /api/huodong/points/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.points_business.get_my_points(user.get('id'), page, page_size)

    def ActionHuodongPointsSummaryGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        """
        获取积分汇总
        GET /api/huodong/points/summary/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.points_business.get_points_summary(user.get('id'))

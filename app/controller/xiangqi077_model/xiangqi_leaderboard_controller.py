from typing import Optional
from fastapi import Request, Header, Query


class XiangqiLeaderboardController:
    def __init__(self):
        from app.business.xiangqi077_model.leaderboard_business import XiangqiLeaderboardBusiness
        self.leaderboard_business = XiangqiLeaderboardBusiness()

    def ActionXiangqiLeaderboardListGet(self, request: Request,
                                         period: int = Query(3, ge=0, le=3),
                                         limit: int = Query(50, ge=1, le=200)):
        """获取排行榜"""
        return self.leaderboard_business.get_leaderboard(period=period, limit=limit)

    def ActionXiangqiLeaderboardUserRankGet(self, request: Request,
                                             period: int = Query(3, ge=0, le=3),
                                             authorization: Optional[str] = Header(None)):
        """获取我的排名"""
        token = request.query_params.get('token', '')
        if not token:
            auth = request.headers.get('authorization', '')
            if auth.startswith('Bearer '):
                token = auth[7:]
        if not token:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        from app.business.xiangqi077_model.user_business import XiangqiUserBusiness
        user = XiangqiUserBusiness().verify_token(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.leaderboard_business.get_user_rank(user_id=user.get('id'), period=period)

    def ActionXiangqiLeaderboardAllGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100),
                                        period: Optional[int] = Query(None),
                                        authorization: Optional[str] = Header(None)):
        """管理员获取排行榜数据"""
        token = request.query_params.get('token', '')
        if not token:
            auth = request.headers.get('authorization', '') if not authorization else authorization
            if auth and auth.startswith('Bearer '):
                token = auth[7:]
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        admin = XiangqiAdminBusiness().verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.leaderboard_business.get_all_leaderboards(
            page=page, page_size=page_size, period=period
        )

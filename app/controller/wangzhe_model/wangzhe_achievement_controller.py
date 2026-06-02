from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ClaimAchievementRequest(BaseModel):
    achievement_id: int = Field(..., description="成就ID")


class WangzheAchievementController:
    def __init__(self):
        from app.business.wangzhe_model.achievement_business import WangzheAchievementBusiness
        self.achievement_business = WangzheAchievementBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        user_business = WangzheUserBusiness()
        return user_business.verify_token(token)

    def ActionWangzheAchievementListGet(self, request: Request, page: int = Query(1, description="页码"),
                                         page_size: int = Query(50, description="每页数量"),
                                         type: Optional[str] = Query(None, description="类型")):
        """
        获取成就列表接口
        GET /api/wangzhe/achievement/list/get
        获取所有成就列表
        """
        return self.achievement_business.get_achievement_list(page, page_size, type)

    def ActionWangzheAchievementMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的成就接口
        GET /api/wangzhe/achievement/my/get
        获取当前用户的成就进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_user_achievement_list(user.get('id'))

    def ActionWangzheAchievementClaimPost(self, request: Request, body: ClaimAchievementRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        领取成就奖励接口
        POST /api/wangzhe/achievement/claim
        领取已完成成就的奖励
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.claim_achievement(user.get('id'), body.achievement_id)

    def ActionWangzheAchievementUnclaimedGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取未领取成就数量接口
        GET /api/wangzhe/achievement/unclaimed/get
        获取当前用户未领取的成就数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.achievement_business.get_unclaimed_count(user.get('id'))

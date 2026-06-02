from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PurchaseHeroRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")


class WangzheHeroController:
    def __init__(self):
        from app.business.wangzhe_model.hero_business import WangzheHeroBusiness
        self.hero_business = WangzheHeroBusiness()

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

    def ActionWangzheHeroListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(20, description="每页数量"),
                                  position: Optional[str] = Query(None, description="位置"),
                                  difficulty: Optional[str] = Query(None, description="难度"),
                                  keyword: Optional[str] = Query(None, description="关键词")):
        """
        获取英雄列表接口
        GET /api/wangzhe/hero/list/get
        分页获取所有英雄信息
        """
        return self.hero_business.get_hero_list(page, page_size, position, difficulty, keyword)

    def ActionWangzheHeroDetailGet(self, request: Request, hero_id: int = Query(..., description="英雄ID")):
        """
        获取英雄详情接口
        GET /api/wangzhe/hero/detail/get
        根据英雄ID获取详情
        """
        return self.hero_business.get_hero_detail(hero_id)

    def ActionWangzheHeroMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的英雄列表接口
        GET /api/wangzhe/hero/my/get
        获取当前用户拥有的英雄列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.get_user_hero_list(user.get('id'))

    def ActionWangzheHeroPurchasePost(self, request: Request, body: PurchaseHeroRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        购买英雄接口
        POST /api/wangzhe/hero/purchase
        花费金币购买英雄
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.purchase_hero(user.get('id'), body.hero_id)

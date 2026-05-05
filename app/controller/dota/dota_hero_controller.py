from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SelectHeroRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")


class BuyHeroRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")


class UpgradeSkillRequest(BaseModel):
    hero_id: int = Field(..., description="英雄ID")
    skill_id: int = Field(..., description="技能ID")


class DotaHeroController:
    def __init__(self):
        from app.business.dota.hero_business import DotaHeroBusiness
        from app.business.dota.user_business import DotaUserBusiness
        self.hero_business = DotaHeroBusiness()
        self.user_business = DotaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDotaHeroAllGet(self, request: Request):
        """
        获取所有英雄列表接口
        GET /api/dota/hero/all/get
        获取所有基础英雄信息
        """
        return self.hero_business.get_all_heroes()

    def ActionDotaHeroListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户英雄列表接口
        GET /api/dota/hero/list/get
        获取用户拥有的英雄列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.get_heroes_for_user(user.get('id'))

    def ActionDotaHeroOwnedGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户已拥有英雄接口
        GET /api/dota/hero/owned/get
        获取用户已拥有的英雄详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.get_user_heroes(user.get('id'))

    def ActionDotaHeroDetailGet(self, request: Request, hero_id: int = Query(..., description="英雄ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取英雄详情接口
        GET /api/dota/hero/detail/get
        获取英雄详细信息，包括技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        user_id = user.get('id') if user else None

        return self.hero_business.get_hero_detail(hero_id, user_id)

    def ActionDotaHeroBuyPost(self, request: Request, body: BuyHeroRequest,
                               authorization: Optional[str] = Header(None)):
        """
        购买英雄接口
        POST /api/dota/hero/buy
        使用金币购买新英雄
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.buy_hero(user.get('id'), body.hero_id)

    def ActionDotaHeroSelectPost(self, request: Request, body: SelectHeroRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        选择英雄接口
        POST /api/dota/hero/select
        选择当前使用的英雄
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.select_hero(user.get('id'), body.hero_id)

    def ActionDotaHeroStatsGet(self, request: Request, hero_id: int = Query(..., description="英雄ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取英雄战斗属性接口
        GET /api/dota/hero/stats/get
        获取英雄的实时战斗属性，包括装备加成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.get_hero_battle_stats(user.get('id'), hero_id)

    def ActionDotaHeroHealPost(self, request: Request, body: SelectHeroRequest,
                                authorization: Optional[str] = Header(None)):
        """
        恢复英雄生命接口
        POST /api/dota/hero/heal
        恢复英雄至满血状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.heal_hero(user.get('id'), body.hero_id)

    def ActionDotaHeroSkillUpgradePost(self, request: Request, body: UpgradeSkillRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        升级英雄技能接口
        POST /api/dota/hero/skill/upgrade
        使用技能点升级英雄技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.upgrade_skill(
            user.get('id'),
            body.hero_id,
            body.skill_id
        )

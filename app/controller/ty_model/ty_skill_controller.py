from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class EquipSkillRequest(BaseModel):
    skill_id: int = Field(..., description="技能ID")
    equip: bool = Field(True, description="是否装备")


class TySkillController:
    def __init__(self):
        from app.business.ty_model.skill_business import TySkillBusiness
        self.skill_business = TySkillBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ty_model.auth_business import TyAuthBusiness
        auth_business = TyAuthBusiness()
        return auth_business.verify_token(token)

    def ActionTySkillListGet(self, request: Request, page: int = Query(1, description="页码"),
                              page_size: int = Query(20, description="每页数量"),
                              category: Optional[str] = Query(None, description="技能分类"),
                              authorization: Optional[str] = Header(None)):
        """
        获取技能列表接口
        GET /api/ty/skill/list
        分页获取所有可解锁的技能列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_level = user.get('level') if user else None

        return self.skill_business.get_all_skills(page, page_size, category, user_level)

    def ActionTySkillMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的技能列表接口
        GET /api/ty/skill/my/list
        分页获取当前用户已解锁的技能列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skills(user.get('id'), page, page_size)

    def ActionTySkillEquippedListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取已装备的技能列表接口
        GET /api/ty/skill/equipped/list
        获取当前用户已装备的技能列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_equipped_skills(user.get('id'))

    def ActionTySkillUnlockPost(self, request: Request, skill_id: int = Query(..., description="技能ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        解锁技能接口
        POST /api/ty/skill/unlock
        消耗金币和经验解锁新技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.unlock_skill(user.get('id'), skill_id)

    def ActionTySkillUpgradePost(self, request: Request, skill_id: int = Query(..., description="技能ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        升级技能接口
        POST /api/ty/skill/upgrade
        消耗金币升级技能等级
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.upgrade_skill(user.get('id'), skill_id)

    def ActionTySkillEquipPost(self, request: Request, body: EquipSkillRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        装备/卸下技能接口
        POST /api/ty/skill/equip
        装备或卸下指定技能（最多装备4个）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.equip_skill(
            user_id=user.get('id'),
            skill_id=body.skill_id,
            equip=body.equip
        )

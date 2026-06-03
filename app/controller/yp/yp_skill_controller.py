from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpgradeSkillRequest(BaseModel):
    skill_id: int = Field(..., description="技能ID")


class CreateSkillRequest(BaseModel):
    name: str = Field(..., description="技能名称")
    description: Optional[str] = Field(None, description="技能描述")
    icon: Optional[str] = Field(None, description="图标标识")
    skill_type: Optional[int] = Field(1, description="技能类型：1被动，2主动")
    tree_position: Optional[str] = Field(None, description="技能树位置")
    max_level: Optional[int] = Field(5, description="最大等级")
    base_price: Optional[int] = Field(100, description="基础价格")
    effect_type: Optional[str] = Field(None, description="效果类型")
    effect_value: Optional[float] = Field(0, description="效果值")


class YpSkillController:
    def __init__(self):
        from app.business.yp.skill_business import YpSkillBusiness
        self.skill_business = YpSkillBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yp.user_business import YpUserBusiness
        user_business = YpUserBusiness()
        return user_business.verify_token(token)

    def ActionYpSkillListGet(self, request: Request):
        """
        获取所有技能列表
        GET /api/yp/skill/list/get
        获取所有可用技能列表
        """
        return self.skill_business.get_all_skills()

    def ActionYpSkillMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的技能
        GET /api/yp/skill/my/get
        获取当前用户已解锁的技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skills(user.get('id'))

    def ActionYpSkillTreeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取技能树
        GET /api/yp/skill/tree/get
        获取完整的技能树，包含解锁状态和升级价格
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_skill_tree(user.get('id'))

    def ActionYpSkillUpgradePost(self, request: Request, body: UpgradeSkillRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        升级技能
        POST /api/yp/skill/upgrade
        升级指定技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.upgrade_skill(user.get('id'), body.skill_id)

    def ActionYpSkillEffectsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取技能效果
        GET /api/yp/skill/effects/get
        获取当前用户的所有技能效果加成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skill_effects(user.get('id'))

    def ActionYpSkillCreatePost(self, request: Request, body: CreateSkillRequest):
        """
        创建技能（管理员）
        POST /api/yp/skill/create
        创建新技能
        """
        data = {
            'name': body.name,
            'description': body.description or '',
            'icon': body.icon or '',
            'skill_type': body.skill_type or 1,
            'tree_position': body.tree_position or '',
            'max_level': body.max_level or 5,
            'base_price': body.base_price or 100,
            'effect_type': body.effect_type or '',
            'effect_value': body.effect_value or 0
        }
        return self.skill_business.create_skill(data)

    def ActionYpSkillDeletePost(self, request: Request, skill_id: int = Query(..., description="技能ID")):
        """
        删除技能（管理员）
        POST /api/yp/skill/delete
        删除指定技能
        """
        return self.skill_business.delete_skill(skill_id)

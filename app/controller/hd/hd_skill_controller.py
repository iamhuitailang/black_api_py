from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class LearnSkillRequest(BaseModel):
    skill_id: int = Field(..., description="技能ID")


class UpgradeSkillRequest(BaseModel):
    user_skill_id: int = Field(..., description="用户技能ID")


class ToggleSkillRequest(BaseModel):
    user_skill_id: int = Field(..., description="用户技能ID")


class CreateSkillRequest(BaseModel):
    name: str = Field(..., description="技能名称")
    description: Optional[str] = Field('', description="技能描述")
    type: int = Field(..., description="技能类型")
    level: int = Field(1, description="技能等级")
    damage: int = Field(0, description="伤害值")
    chakra_cost: int = Field(0, description="查克拉消耗")
    cooldown: int = Field(0, description="冷却时间")
    unlock_exp: int = Field(0, description="解锁所需经验")
    icon: Optional[str] = Field('', description="技能图标")


class UpdateSkillRequest(BaseModel):
    skill_id: int = Field(..., description="技能ID")
    name: Optional[str] = Field(None, description="技能名称")
    description: Optional[str] = Field(None, description="技能描述")
    type: Optional[int] = Field(None, description="技能类型")
    level: Optional[int] = Field(None, description="技能等级")
    damage: Optional[int] = Field(None, description="伤害值")
    chakra_cost: Optional[int] = Field(None, description="查克拉消耗")
    cooldown: Optional[int] = Field(None, description="冷却时间")
    unlock_exp: Optional[int] = Field(None, description="解锁所需经验")
    icon: Optional[str] = Field(None, description="技能图标")


class DeleteSkillRequest(BaseModel):
    skill_id: int = Field(..., description="技能ID")


class HdSkillController:
    def __init__(self):
        from app.business.hd.skill_business import HdSkillBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.skill_business = HdSkillBusiness()
        self.user_business = HdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.token_model.get_user_by_token(token)

    def ActionHdSkillListGet(self, request: Request):
        """
        获取所有技能列表接口
        GET /api/hd/skill/list/get
        获取系统所有技能列表
        """
        return self.skill_business.get_all_skills()

    def ActionHdSkillUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户已学技能接口
        GET /api/hd/skill/user/get
        获取当前用户已学习的技能列表
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

    def ActionHdSkillLearnPost(self, request: Request, body: LearnSkillRequest,
                                authorization: Optional[str] = Header(None)):
        """
        学习技能接口
        POST /api/hd/skill/learn
        学习指定技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.learn_skill(
            user_id=user.get('id'),
            skill_id=body.skill_id
        )

    def ActionHdSkillUpgradePost(self, request: Request, body: UpgradeSkillRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        升级技能接口
        POST /api/hd/skill/upgrade
        升级已学习的技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.upgrade_skill(
            user_id=user.get('id'),
            user_skill_id=body.user_skill_id
        )

    def ActionHdSkillTogglePost(self, request: Request, body: ToggleSkillRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        切换技能激活状态接口
        POST /api/hd/skill/toggle
        切换技能的激活/禁用状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.toggle_skill_active(
            user_id=user.get('id'),
            user_skill_id=body.user_skill_id
        )

    def ActionHdSkillDetailGet(self, request: Request, skill_id: int = Query(..., description="技能ID")):
        """
        获取技能详情接口
        GET /api/hd/skill/detail/get
        根据技能ID获取技能详细信息
        """
        return self.skill_business.get_skill_detail(skill_id)

    def ActionHdSkillCreatePost(self, request: Request, body: CreateSkillRequest):
        """
        管理员创建技能接口
        POST /api/hd/skill/create
        创建新技能
        """
        data = {
            'name': body.name,
            'description': body.description,
            'type': body.type,
            'level': body.level,
            'damage': body.damage,
            'chakra_cost': body.chakra_cost,
            'cooldown': body.cooldown,
            'unlock_exp': body.unlock_exp,
            'icon': body.icon
        }
        return self.skill_business.create_skill(data)

    def ActionHdSkillUpdatePost(self, request: Request, body: UpdateSkillRequest):
        """
        管理员更新技能接口
        POST /api/hd/skill/update
        更新技能信息
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['type'] = body.type
        if body.level is not None:
            data['level'] = body.level
        if body.damage is not None:
            data['damage'] = body.damage
        if body.chakra_cost is not None:
            data['chakra_cost'] = body.chakra_cost
        if body.cooldown is not None:
            data['cooldown'] = body.cooldown
        if body.unlock_exp is not None:
            data['unlock_exp'] = body.unlock_exp
        if body.icon is not None:
            data['icon'] = body.icon

        return self.skill_business.update_skill(
            skill_id=body.skill_id,
            data=data
        )

    def ActionHdSkillDeletePost(self, request: Request, body: DeleteSkillRequest):
        """
        管理员删除技能接口
        POST /api/hd/skill/delete
        删除指定技能
        """
        return self.skill_business.delete_skill(body.skill_id)

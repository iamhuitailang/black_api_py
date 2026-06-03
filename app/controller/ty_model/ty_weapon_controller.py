from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateWeaponRequest(BaseModel):
    name: str = Field(..., description="武器名称")
    doodle_data: str = Field(..., description="涂鸦数据(JSON格式)")
    weapon_type: Optional[str] = Field('custom', description="武器类型")
    attack: Optional[int] = Field(10, description="攻击力")
    defense: Optional[int] = Field(5, description="防御力")
    speed: Optional[int] = Field(5, description="速度")
    doodle_style: Optional[str] = Field('normal', description="涂鸦风格")
    color_palette: Optional[str] = Field('', description="配色方案")
    description: Optional[str] = Field('', description="武器描述")


class UpdateWeaponRequest(BaseModel):
    name: Optional[str] = Field(None, description="武器名称")
    attack: Optional[int] = Field(None, description="攻击力")
    defense: Optional[int] = Field(None, description="防御力")
    speed: Optional[int] = Field(None, description="速度")
    description: Optional[str] = Field(None, description="武器描述")
    is_shared: Optional[int] = Field(None, description="是否分享")


class TyWeaponController:
    def __init__(self):
        from app.business.ty_model.weapon_business import TyWeaponBusiness
        self.weapon_business = TyWeaponBusiness()

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

    def ActionTyWeaponCreatePost(self, request: Request, body: CreateWeaponRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建武器接口
        POST /api/ty/weapon/create
        消耗颜料和画布创建新武器
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.weapon_business.create_weapon(
            user_id=user.get('id'),
            name=body.name,
            doodle_data=body.doodle_data,
            weapon_type=body.weapon_type,
            attack=body.attack,
            defense=body.defense,
            speed=body.speed,
            doodle_style=body.doodle_style,
            color_palette=body.color_palette,
            description=body.description
        )

    def ActionTyWeaponDetailGet(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取武器详情接口
        GET /api/ty/weapon/detail
        根据武器ID获取武器详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.weapon_business.get_weapon_by_id(weapon_id, user_id)

    def ActionTyWeaponListGet(self, request: Request, page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               authorization: Optional[str] = Header(None)):
        """
        获取我的武器列表接口
        GET /api/ty/weapon/list
        分页获取当前用户的武器列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.weapon_business.get_user_weapons(user.get('id'), page, page_size)

    def ActionTyWeaponSharedListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     rarity: Optional[int] = Query(None, description="稀有度"),
                                     weapon_type: Optional[str] = Query(None, description="武器类型"),
                                     keyword: Optional[str] = Query(None, description="关键词")):
        """
        获取分享的武器列表接口
        GET /api/ty/weapon/shared/list
        分页获取公开分享的武器列表
        """
        return self.weapon_business.get_shared_weapons(page, page_size, rarity, weapon_type, keyword)

    def ActionTyWeaponUpdatePost(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                  body: UpdateWeaponRequest = None,
                                  authorization: Optional[str] = Header(None)):
        """
        更新武器信息接口
        POST /api/ty/weapon/update
        更新武器的名称、属性等信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.attack is not None:
            data['attack'] = body.attack
        if body.defense is not None:
            data['defense'] = body.defense
        if body.speed is not None:
            data['speed'] = body.speed
        if body.description is not None:
            data['description'] = body.description
        if body.is_shared is not None:
            data['is_shared'] = body.is_shared

        return self.weapon_business.update_weapon(weapon_id, user.get('id'), data)

    def ActionTyWeaponSharePost(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                 is_shared: int = Query(1, description="是否分享"),
                                 authorization: Optional[str] = Header(None)):
        """
        分享/取消分享武器接口
        POST /api/ty/weapon/share
        将武器分享到创意工坊或取消分享
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.weapon_business.share_weapon(weapon_id, user.get('id'), is_shared == 1)

    def ActionTyWeaponRepairPost(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        维修武器接口
        POST /api/ty/weapon/repair
        消耗金币维修武器，恢复耐久度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.weapon_business.repair_weapon(weapon_id, user.get('id'))

    def ActionTyWeaponDeletePost(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除武器接口
        POST /api/ty/weapon/delete
        删除指定武器
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.weapon_business.delete_weapon(weapon_id, user.get('id'))

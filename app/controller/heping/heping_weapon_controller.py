from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateWeaponRequest(BaseModel):
    name: str = Field(..., description="武器名称")
    type: str = Field(..., description="武器类型")
    damage: float = Field(..., description="伤害值")
    fire_rate: float = Field(..., description="射速")
    range: float = Field(..., description="射程")
    accuracy: float = Field(..., description="精准度")
    ammo_capacity: int = Field(..., description="弹夹容量")
    rarity: str = Field(..., description="稀有度")
    description: Optional[str] = Field(None, description="武器描述")
    icon: Optional[str] = Field(None, description="武器图标")


class UpdateWeaponRequest(BaseModel):
    weapon_id: int = Field(..., description="武器ID")
    name: Optional[str] = Field(None, description="武器名称")
    type: Optional[str] = Field(None, description="武器类型")
    damage: Optional[float] = Field(None, description="伤害值")
    fire_rate: Optional[float] = Field(None, description="射速")
    range: Optional[float] = Field(None, description="射程")
    accuracy: Optional[float] = Field(None, description="精准度")
    ammo_capacity: Optional[int] = Field(None, description="弹夹容量")
    rarity: Optional[str] = Field(None, description="稀有度")
    description: Optional[str] = Field(None, description="武器描述")
    icon: Optional[str] = Field(None, description="武器图标")
    status: Optional[int] = Field(None, description="状态")


class DeleteWeaponRequest(BaseModel):
    weapon_id: int = Field(..., description="武器ID")


class HepingWeaponController:
    def __init__(self):
        from app.business.heping.weapon_business import WeaponBusiness
        from app.business.heping.admin_business import HepingAdminBusiness
        self.weapon_business = WeaponBusiness()
        self.admin_business = HepingAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionHepingWeaponCreatePost(self, request: Request, body: CreateWeaponRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        data = {
            'name': body.name,
            'type': body.type,
            'damage': body.damage,
            'fire_rate': body.fire_rate,
            'range': body.range,
            'accuracy': body.accuracy,
            'ammo_capacity': body.ammo_capacity,
            'rarity': body.rarity,
            'description': body.description or '',
            'icon': body.icon or ''
        }
        return self.weapon_business.create_weapon(**data)

    def ActionHepingWeaponDetailGet(self, request: Request, weapon_id: int = Query(..., description="武器ID"),
                                     authorization: Optional[str] = Header(None)):
        return self.weapon_business.get_weapon(weapon_id=weapon_id)

    def ActionHepingWeaponListGet(self, request: Request,
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                   type: Optional[str] = Query(None, description="武器类型"),
                                   rarity: Optional[str] = Query(None, description="稀有度"),
                                   authorization: Optional[str] = Header(None)):
        return self.weapon_business.get_weapon_list(
            page=page,
            page_size=page_size,
            type=type,
            rarity=rarity
        )

    def ActionHepingWeaponUpdatePost(self, request: Request, body: UpdateWeaponRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        data = {'weapon_id': body.weapon_id}
        if body.name is not None:
            data['name'] = body.name
        if body.type is not None:
            data['type'] = body.type
        if body.damage is not None:
            data['damage'] = body.damage
        if body.fire_rate is not None:
            data['fire_rate'] = body.fire_rate
        if body.range is not None:
            data['range'] = body.range
        if body.accuracy is not None:
            data['accuracy'] = body.accuracy
        if body.ammo_capacity is not None:
            data['ammo_capacity'] = body.ammo_capacity
        if body.rarity is not None:
            data['rarity'] = body.rarity
        if body.description is not None:
            data['description'] = body.description
        if body.icon is not None:
            data['icon'] = body.icon
        if body.status is not None:
            data['status'] = body.status
        return self.weapon_business.update_weapon(**data)

    def ActionHepingWeaponDeletePost(self, request: Request, body: DeleteWeaponRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }
        return self.weapon_business.delete_weapon(weapon_id=body.weapon_id)

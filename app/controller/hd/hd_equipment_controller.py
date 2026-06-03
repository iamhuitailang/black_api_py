from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class EquipmentBuyRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")


class EquipmentEquipRequest(BaseModel):
    user_equipment_id: int = Field(..., description="用户装备ID")


class EquipmentUnequipRequest(BaseModel):
    user_equipment_id: int = Field(..., description="用户装备ID")


class EquipmentUpgradeRequest(BaseModel):
    user_equipment_id: int = Field(..., description="用户装备ID")


class EquipmentCreateRequest(BaseModel):
    name: str = Field(..., description="装备名称")
    description: Optional[str] = Field(None, description="装备描述")
    type: int = Field(..., description="装备类型")
    level: Optional[int] = Field(1, description="装备等级")
    attack: Optional[int] = Field(0, description="攻击力")
    defense: Optional[int] = Field(0, description="防御力")
    hp: Optional[int] = Field(0, description="生命值")
    chakra: Optional[int] = Field(0, description="查克拉")
    price: Optional[int] = Field(0, description="价格")
    icon: Optional[str] = Field(None, description="图标URL")


class EquipmentUpdateRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")
    name: Optional[str] = Field(None, description="装备名称")
    description: Optional[str] = Field(None, description="装备描述")
    type: Optional[int] = Field(None, description="装备类型")
    level: Optional[int] = Field(None, description="装备等级")
    attack: Optional[int] = Field(None, description="攻击力")
    defense: Optional[int] = Field(None, description="防御力")
    hp: Optional[int] = Field(None, description="生命值")
    chakra: Optional[int] = Field(None, description="查克拉")
    price: Optional[int] = Field(None, description="价格")
    icon: Optional[str] = Field(None, description="图标URL")


class EquipmentDeleteRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")


class HdEquipmentController:
    def __init__(self):
        from app.business.hd.equipment_business import HdEquipmentBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.equipment_business = HdEquipmentBusiness()
        self.user_business = HdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.get_current_user(token).get('data')

    def ActionHdEquipmentListGet(self, request: Request, type: Optional[int] = Query(None, description="装备类型"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取所有装备列表接口
        GET /hd/equipment/list/get
        获取所有装备列表，支持按类型筛选和分页
        """
        return self.equipment_business.get_all_equipments(
            type=type,
            page=page,
            page_size=page_size
        )

    def ActionHdEquipmentUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户所有装备接口
        GET /hd/equipment/user/get
        获取当前用户的所有装备，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.get_user_equipments(
            user_id=user.get('id')
        )

    def ActionHdEquipmentBuyPost(self, request: Request, body: EquipmentBuyRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        购买装备接口
        POST /hd/equipment/buy
        购买装备，消耗金币，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.buy_equipment(
            user_id=user.get('id'),
            equipment_id=body.equipment_id
        )

    def ActionHdEquipmentEquipPost(self, request: Request, body: EquipmentEquipRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        装备物品接口
        POST /hd/equipment/equip
        装备用户已拥有的装备，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.equip_item(
            user_id=user.get('id'),
            user_equipment_id=body.user_equipment_id
        )

    def ActionHdEquipmentUnequipPost(self, request: Request, body: EquipmentUnequipRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        卸下装备接口
        POST /hd/equipment/unequip
        卸下已装备的物品，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.unequip_item(
            user_id=user.get('id'),
            user_equipment_id=body.user_equipment_id
        )

    def ActionHdEquipmentUpgradePost(self, request: Request, body: EquipmentUpgradeRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        升级装备接口
        POST /hd/equipment/upgrade
        升级用户装备，消耗金币，需要token
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.upgrade_equipment(
            user_id=user.get('id'),
            user_equipment_id=body.user_equipment_id
        )

    def ActionHdEquipmentDetailGet(self, request: Request, equipment_id: int = Query(..., description="装备ID")):
        """
        获取装备详情接口
        GET /hd/equipment/detail/get
        根据装备ID获取装备详情
        """
        return self.equipment_business.get_equipment_detail(
            equipment_id=equipment_id
        )

    def ActionHdEquipmentCreatePost(self, request: Request, body: EquipmentCreateRequest):
        """
        管理员创建装备接口
        POST /hd/equipment/create
        管理员创建新装备
        """
        data = {
            'name': body.name,
            'description': body.description or '',
            'type': body.type,
            'level': body.level,
            'attack': body.attack,
            'defense': body.defense,
            'hp': body.hp,
            'chakra': body.chakra,
            'price': body.price,
            'icon': body.icon or ''
        }
        return self.equipment_business.create_equipment(data)

    def ActionHdEquipmentUpdatePost(self, request: Request, body: EquipmentUpdateRequest):
        """
        管理员更新装备接口
        POST /hd/equipment/update
        管理员更新装备信息
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
        if body.attack is not None:
            data['attack'] = body.attack
        if body.defense is not None:
            data['defense'] = body.defense
        if body.hp is not None:
            data['hp'] = body.hp
        if body.chakra is not None:
            data['chakra'] = body.chakra
        if body.price is not None:
            data['price'] = body.price
        if body.icon is not None:
            data['icon'] = body.icon

        return self.equipment_business.update_equipment(
            equipment_id=body.equipment_id,
            data=data
        )

    def ActionHdEquipmentDeletePost(self, request: Request, body: EquipmentDeleteRequest):
        """
        管理员删除装备接口
        POST /hd/equipment/delete
        管理员删除装备
        """
        return self.equipment_business.delete_equipment(
            equipment_id=body.equipment_id
        )

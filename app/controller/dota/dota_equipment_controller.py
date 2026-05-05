from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BuyEquipmentRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")
    quantity: Optional[int] = Field(1, description="购买数量")


class EquipItemRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")


class UnequipItemRequest(BaseModel):
    equipment_id: int = Field(..., description="装备ID")


class DotaEquipmentController:
    def __init__(self):
        from app.business.dota.equipment_business import DotaEquipmentBusiness
        from app.business.dota.user_business import DotaUserBusiness
        self.equipment_business = DotaEquipmentBusiness()
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

    def ActionDotaEquipmentAllGet(self, request: Request):
        """
        获取所有装备列表接口
        GET /api/dota/equipment/all/get
        获取所有基础装备信息
        """
        return self.equipment_business.get_all_equipment()

    def ActionDotaEquipmentShopGet(self, request: Request, hero_type: Optional[str] = Query(None, description="英雄类型"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取商店装备列表接口
        GET /api/dota/equipment/shop/get
        获取商店中的装备列表，支持按英雄类型筛选
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        user_id = user.get('id') if user else None

        return self.equipment_business.get_shop_items(user_id, hero_type)

    def ActionDotaEquipmentInventoryGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户背包接口
        GET /api/dota/equipment/inventory/get
        获取用户拥有的所有装备
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.get_user_inventory(user.get('id'))

    def ActionDotaEquipmentEquippedGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取已装备物品接口
        GET /api/dota/equipment/equipped/get
        获取用户当前已装备的物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.get_equipped_items(user.get('id'))

    def ActionDotaEquipmentBuyPost(self, request: Request, body: BuyEquipmentRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        购买装备接口
        POST /api/dota/equipment/buy
        使用金币购买装备
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
            user.get('id'),
            body.equipment_id,
            body.quantity or 1
        )

    def ActionDotaEquipmentEquipPost(self, request: Request, body: EquipItemRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        装备物品接口
        POST /api/dota/equipment/equip
        装备背包中的物品
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
            user.get('id'),
            body.equipment_id
        )

    def ActionDotaEquipmentUnequipPost(self, request: Request, body: UnequipItemRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        卸下物品接口
        POST /api/dota/equipment/unequip
        卸下已装备的物品
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
            user.get('id'),
            body.equipment_id
        )

    def ActionDotaEquipmentBonusesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取装备加成接口
        GET /api/dota/equipment/bonuses/get
        获取当前装备提供的所有属性加成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.equipment_business.get_total_bonuses(user.get('id'))

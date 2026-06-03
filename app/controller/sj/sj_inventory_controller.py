from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddItemRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")
    item_id: str = Field(..., description="物品ID")
    item_name: str = Field(..., description="物品名")
    item_type: str = Field(..., description="物品类型")
    rarity: Optional[int] = Field(0, description="稀有度")
    attack_bonus: Optional[int] = Field(0, description="攻击加成")
    defense_bonus: Optional[int] = Field(0, description="防御加成")
    hp_bonus: Optional[int] = Field(0, description="生命加成")
    mp_bonus: Optional[int] = Field(0, description="魔力加成")
    speed_bonus: Optional[int] = Field(0, description="速度加成")
    special_effect: Optional[str] = Field('', description="特殊效果")
    quantity: Optional[int] = Field(1, description="数量")


class SjInventoryController:
    def __init__(self):
        from app.business.sj.inventory_business import SjInventoryBusiness
        self.inventory_business = SjInventoryBusiness()
        from app.business.sj.user_business import SjUserBusiness
        self.user_business = SjUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSjInventoryListGet(self, request: Request, character_id: int = Query(..., description="角色ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取背包列表
        GET /api/sj/inventory/list/get
        """
        return self.inventory_business.get_inventory(character_id)

    def ActionSjInventoryEquippedGet(self, request: Request, character_id: int = Query(..., description="角色ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取已装备物品
        GET /api/sj/inventory/equipped/get
        """
        return self.inventory_business.get_equipped(character_id)

    def ActionSjInventoryAddPost(self, request: Request, body: AddItemRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        添加物品到背包
        POST /api/sj/inventory/add
        """
        item_data = {
            'item_id': body.item_id,
            'item_name': body.item_name,
            'item_type': body.item_type,
            'rarity': body.rarity,
            'attack_bonus': body.attack_bonus,
            'defense_bonus': body.defense_bonus,
            'hp_bonus': body.hp_bonus,
            'mp_bonus': body.mp_bonus,
            'speed_bonus': body.speed_bonus,
            'special_effect': body.special_effect,
            'quantity': body.quantity
        }
        return self.inventory_business.add_item(body.character_id, item_data)

    def ActionSjInventoryEquipPost(self, request: Request, inventory_id: int = Query(..., description="物品ID"),
                                    character_id: int = Query(..., description="角色ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        装备物品
        POST /api/sj/inventory/equip
        """
        return self.inventory_business.equip_item(inventory_id, character_id)

    def ActionSjInventoryUnequipPost(self, request: Request, inventory_id: int = Query(..., description="物品ID"),
                                      character_id: int = Query(..., description="角色ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        卸下装备
        POST /api/sj/inventory/unequip
        """
        return self.inventory_business.unequip_item(inventory_id, character_id)

    def ActionSjInventoryUsePost(self, request: Request, inventory_id: int = Query(..., description="物品ID"),
                                  character_id: int = Query(..., description="角色ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        使用消耗品
        POST /api/sj/inventory/use
        """
        return self.inventory_business.use_consumable(inventory_id, character_id)

    def ActionSjInventoryRemovePost(self, request: Request, inventory_id: int = Query(..., description="物品ID"),
                                     character_id: int = Query(..., description="角色ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除物品
        POST /api/sj/inventory/remove
        """
        return self.inventory_business.remove_item(inventory_id, character_id)

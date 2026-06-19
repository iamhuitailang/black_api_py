from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.game import GameBusiness, CombatBusiness, MissionBusiness, ShopBusiness


class NewGameRequest(BaseModel):
    player_name: str = Field(default='漂泊者', description='玩家名称')


class TravelRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    planet_id: int = Field(..., ge=1, description='目标星球ID')


class EquipRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    inventory_id: int = Field(..., ge=1, description='背包物品ID')


class CombatInitRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    enemy_ids: Optional[List[int]] = Field(default=None, description='敌人ID列表')
    difficulty: Optional[int] = Field(default=None, ge=1, le=5, description='难度等级')
    mission_id: Optional[int] = Field(default=None, description='任务ID')


class CombatActionRequest(BaseModel):
    state: Dict[str, Any] = Field(..., description='当前战斗状态')
    action: str = Field(..., description='操作: attack/defend/skill/item')
    target_index: int = Field(default=0, description='目标索引')
    skill_id: Optional[int] = Field(default=None, description='技能ID')
    item_inventory_id: Optional[int] = Field(default=None, description='道具背包ID')


class BuyEquipmentRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    equipment_id: int = Field(..., ge=1, description='装备ID')


class BuyItemRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    item_id: int = Field(..., ge=1, description='道具ID')
    quantity: int = Field(default=1, ge=1, description='数量')


class SellItemRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    inventory_id: int = Field(..., ge=1, description='背包物品ID')
    quantity: int = Field(default=1, ge=1, description='数量')


class AcceptMissionRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    template_id: int = Field(..., ge=1, description='任务模板ID')


class AdvanceMissionRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    defeated: int = Field(default=1, ge=1, description='击败敌人数')


class MissionIdRequest(BaseModel):
    save_id: int = Field(..., ge=1, description='存档ID')
    mission_id: Optional[int] = Field(default=None, description='任务ID')


class GameController:
    def __init__(self):
        self.game_biz = GameBusiness()
        self.combat_biz = CombatBusiness()
        self.mission_biz = MissionBusiness()
        self.shop_biz = ShopBusiness()

    def ActionGameNewgamePost(self, request: Request, body: NewGameRequest):
        """
        创建新游戏存档
        POST /api/game/newgame
        输入玩家名称，创建一个新存档并初始化飞船和背包
        """
        return self.game_biz.init_new_game(player_name=body.player_name)

    def ActionGameStateGet(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        获取完整游戏状态
        GET /api/game/state/get
        返回存档、飞船、当前星球、装备、背包、任务等全部信息
        """
        return self.game_biz.get_full_game_state(save_id)

    def ActionGameSaveListGet(self, request: Request):
        """
        获取所有存档列表
        GET /api/game/save/list/get
        返回所有存档的基础信息
        """
        return self.game_biz.get_all_saves()

    def ActionGameSaveDelete(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        删除存档
        DELETE /api/game/save/delete
        永久删除指定存档
        """
        return self.game_biz.delete_save(save_id)

    def ActionGamePlanetListGet(self, request: Request):
        """
        获取星图星球列表
        GET /api/game/planet/list/get
        返回所有星球的位置和信息，用于渲染星图
        """
        return self.game_biz.get_planet_list()

    def ActionGameTravelPost(self, request: Request, body: TravelRequest):
        """
        跃迁到目标星球
        POST /api/game/travel
        消耗星币进行星际跃迁，有概率在危险区域受损
        """
        return self.game_biz.travel_to_planet(body.save_id, body.planet_id)

    def ActionGameRepairPost(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        在空间站维修飞船
        POST /api/game/repair
        在有维修设施的星球修复护盾和船体
        """
        return self.game_biz.repair_ship(save_id)

    def ActionGameEquipPost(self, request: Request, body: EquipRequest):
        """
        装备物品
        POST /api/game/equip
        将指定背包中的装备装备到飞船对应槽位
        """
        return self.game_biz.equip_item(body.save_id, body.inventory_id)

    def ActionGameUnequipPost(self, request: Request, body: EquipRequest):
        """
        卸下装备
        POST /api/game/unequip
        将装备卸下放回背包
        """
        return self.game_biz.unequip_item(body.save_id, body.inventory_id)

    def ActionGameSkillListGet(self, request: Request):
        """
        获取所有技能列表
        GET /api/game/skill/list/get
        返回所有可用的飞船技能
        """
        return self.game_biz.get_skill_list()

    def ActionGameReputationGet(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        获取声望记录
        GET /api/game/reputation/get
        返回各阵营声望摘要和变化历史
        """
        return self.game_biz.get_reputation_log(save_id)

    def ActionCombatInitPost(self, request: Request, body: CombatInitRequest):
        """
        初始化战斗
        POST /api/combat/init
        创建一次回合制战斗，返回初始战斗状态
        """
        return self.combat_biz.init_combat(
            save_id=body.save_id,
            enemy_ids=body.enemy_ids,
            difficulty=body.difficulty,
            mission_id=body.mission_id,
        )

    def ActionCombatActionPost(self, request: Request, body: CombatActionRequest):
        """
        执行玩家战斗行动
        POST /api/combat/action
        输入当前战斗状态和玩家操作，返回新的战斗状态（包含敌方回合）
        """
        return self.combat_biz.player_action(
            state=body.state,
            action=body.action,
            target_index=body.target_index,
            skill_id=body.skill_id,
            item_inventory_id=body.item_inventory_id,
        )

    def ActionShopInventoryGet(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        获取商店库存
        GET /api/shop/inventory/get
        返回当前空间站的装备和道具列表
        """
        return self.shop_biz.get_shop_inventory(save_id)

    def ActionShopEquipmentBuyPost(self, request: Request, body: BuyEquipmentRequest):
        """
        购买装备
        POST /api/shop/equipment/buy
        从当前空间站购买装备放入背包
        """
        return self.shop_biz.buy_equipment(body.save_id, body.equipment_id)

    def ActionShopItemBuyPost(self, request: Request, body: BuyItemRequest):
        """
        购买道具
        POST /api/shop/item/buy
        从当前空间站购买道具放入背包
        """
        return self.shop_biz.buy_item(body.save_id, body.item_id, body.quantity)

    def ActionShopItemSellPost(self, request: Request, body: SellItemRequest):
        """
        出售物品
        POST /api/shop/item/sell
        以半价将背包中的物品卖给商店
        """
        return self.shop_biz.sell_item(body.save_id, body.inventory_id, body.quantity)

    def ActionMissionAvailableGet(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        获取可用任务列表
        GET /api/mission/available/get
        返回当前空间站任务发布板上的可接任务
        """
        return self.mission_biz.get_available_missions(save_id)

    def ActionMissionAcceptPost(self, request: Request, body: AcceptMissionRequest):
        """
        接受任务
        POST /api/mission/accept
        接取指定任务
        """
        return self.mission_biz.accept_mission(body.save_id, body.template_id)

    def ActionMissionEnemiesGet(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        获取任务下一波敌人
        GET /api/mission/enemies/get
        返回进行中任务的当前敌人批次
        """
        return self.mission_biz.get_mission_enemies(save_id)

    def ActionMissionAdvancePost(self, request: Request, body: AdvanceMissionRequest):
        """
        推进任务进度
        POST /api/mission/advance
        击败敌人后调用，推进任务到下一波或完成
        """
        return self.mission_biz.advance_mission_enemy(body.save_id, body.defeated)

    def ActionMissionCompletePost(self, request: Request, body: MissionIdRequest):
        """
        完成任务
        POST /api/mission/complete
        任务全流程完成后调用，领取奖励
        """
        return self.mission_biz.complete_mission(body.save_id, body.mission_id)

    def ActionMissionAbandonPost(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        放弃任务
        POST /api/mission/abandon
        放弃当前进行中的任务（会扣除声望）
        """
        return self.mission_biz.abandon_mission(save_id)

    def ActionMissionFailPost(self, request: Request, save_id: int = Query(..., ge=1, description='存档ID')):
        """
        任务战斗失败
        POST /api/mission/fail
        战斗失败后调用，任务标记失败
        """
        return self.mission_biz.fail_mission_combat(save_id)

from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.vault import VaultBusiness


class AssignRequest(BaseModel):
    save_id: int
    resident_id: int
    assignment: str


class UpgradeRequest(BaseModel):
    save_id: int
    facility_type: str


class WandererRequest(BaseModel):
    save_id: int
    wanderer_name: str
    hunger: int = 50
    health: int = 50
    mood: int = 50
    accept: bool


class NewGameRequest(BaseModel):
    name: str = 'Vault 101'


class VaultController:
    def __init__(self):
        self.business = VaultBusiness()

    def ActionVaultNewgamePost(self, request: Request, body: NewGameRequest):
        """
        创建新游戏
        POST /api/vault/newgame
        """
        return self.business.create_new_game(body.name)

    def ActionVaultGetsaves(self, request: Request):
        """
        获取所有存档列表
        GET /api/vault/getsaves
        """
        return self.business.list_saves()

    def ActionVaultGetstate(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        获取游戏状态
        GET /api/vault/getstate
        """
        return self.business.get_game_state(save_id)

    def ActionVaultAssignPost(self, request: Request, body: AssignRequest):
        """
        分配居民工作
        POST /api/vault/assign
        """
        return self.business.assign_resident(body.save_id, body.resident_id, body.assignment)

    def ActionVaultUpgradePost(self, request: Request, body: UpgradeRequest):
        """
        升级设施
        POST /api/vault/upgrade
        """
        return self.business.upgrade_facility(body.save_id, body.facility_type)

    def ActionVaultAdvanceday(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        推进一天
        GET /api/vault/advanceday
        """
        return self.business.advance_day(save_id)

    def ActionVaultWandererPost(self, request: Request, body: WandererRequest):
        """
        处理流浪者请求
        POST /api/vault/wanderer
        """
        if body.accept:
            return self.business.accept_wanderer(body.save_id, body.wanderer_name, body.hunger, body.health, body.mood)
        else:
            return self.business.reject_wanderer(body.save_id, body.wanderer_name)

    def ActionVaultDeletesave(self, request: Request, save_id: int = Query(..., ge=1)):
        """
        删除存档
        GET /api/vault/deletesave
        """
        return self.business.delete_save(save_id)

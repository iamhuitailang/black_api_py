from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.game import LevelBusiness, UpgradeBusiness, ProgressBusiness


class GameProgressSetRequest(BaseModel):
    bio_samples: int = Field(default=0, description="生物样本数量")
    completed_levels: List[int] = Field(default=[], description="已完成关卡ID列表")
    tower_upgrades: dict = Field(default={}, description="炮塔升级配置")


class GameController:
    def __init__(self):
        self.level_business = LevelBusiness()
        self.upgrade_business = UpgradeBusiness()
        self.progress_business = ProgressBusiness()

    def ActionGameLevelListGet(self, request: Request):
        return self.level_business.get_levels()

    def ActionGameLevelGet(self, request: Request, level_id: int = Query(..., ge=1, description="关卡ID")):
        return self.level_business.get_level_detail(level_id)

    def ActionGameUpgradeListGet(self, request: Request, tower_type: Optional[str] = Query(default=None, description="炮塔类型")):
        if tower_type:
            return self.upgrade_business.get_upgrades_by_type(tower_type)
        return self.upgrade_business.get_upgrades()

    def ActionGameProgressGet(self, request: Request):
        return self.progress_business.get_progress()

    def ActionGameProgressSet(self, request: Request, body: GameProgressSetRequest):
        return self.progress_business.save_progress(
            bio_samples=body.bio_samples,
            completed_levels=body.completed_levels,
            tower_upgrades=body.tower_upgrades
        )

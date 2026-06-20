from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.shooting import ShootingBusiness


class WaveEnemyItem(BaseModel):
    type: str = Field(..., description="敌人类型：rush/defense/suicide")
    count: int = Field(default=1, description="该类型敌人数量")


class WaveConfigItem(BaseModel):
    wave_num: int = Field(..., description="波次编号")
    enemies: List[WaveEnemyItem] = Field(..., description="该波敌人配置")


class LevelConfigSetRequest(BaseModel):
    level_num: int = Field(..., description="关卡编号", ge=1)
    level_name: Optional[str] = Field(default=None, description="关卡名称")
    wave_count: Optional[int] = Field(default=None, description="总波数", ge=1)
    supply_interval: Optional[int] = Field(default=None, description="波间补给时间（秒）", ge=1)
    wave_config: Optional[List[WaveConfigItem]] = Field(default=None, description="波次配置")


class ScoreSubmitRequest(BaseModel):
    level_num: int = Field(..., description="关卡编号", ge=1)
    player_name: str = Field(..., description="玩家名称", min_length=1, max_length=20)
    score: int = Field(..., description="得分", ge=0)
    kills: int = Field(default=0, description="击杀数", ge=0)
    remaining_health: int = Field(default=0, description="剩余生命值", ge=0)
    duration: int = Field(default=0, description="通关时长（秒）", ge=0)


class ShootingController:
    def __init__(self):
        self.business = ShootingBusiness()

    def ActionShootingLevelListGet(self, request: Request):
        """
        获取关卡列表
        GET /api/shooting/level/list/get
        返回所有关卡的基本信息列表
        """
        return self.business.get_level_list()

    def ActionShootingLevelConfigGet(self, request: Request, level_num: int = Query(..., ge=1, description="关卡编号")):
        """
        获取关卡详细配置
        GET /api/shooting/level/config/get
        返回指定关卡的完整配置，包括波次配置、敌人属性、子弹属性、玩家属性等
        """
        return self.business.get_level_config(level_num)

    def ActionShootingLevelConfigSet(self, request: Request, body: LevelConfigSetRequest):
        """
        设置关卡配置（新增或更新）
        POST /api/shooting/level/config/set
        不存对应的level_num则新增，存在则更新
        """
        wave_config_data = None
        if body.wave_config is not None:
            wave_config_data = []
            for w in body.wave_config:
                wave_config_data.append({
                    'wave_num': w.wave_num,
                    'enemies': [{'type': e.type, 'count': e.count} for e in w.enemies]
                })

        return self.business.set_level_config(
            level_num=body.level_num,
            level_name=body.level_name,
            wave_count=body.wave_count,
            supply_interval=body.supply_interval,
            wave_config=wave_config_data
        )

    def ActionShootingLevelDelete(self, request: Request, level_num: int = Query(..., ge=1, description="要删除的关卡编号")):
        """
        删除关卡
        DELETE /api/shooting/level/delete
        """
        return self.business.delete_level(level_num)

    def ActionShootingRankingGet(self, request: Request,
                                 level_num: Optional[int] = Query(default=None, ge=1, description="关卡编号，不填则查全部"),
                                 limit: int = Query(default=10, ge=1, le=100, description="返回数量限制")):
        """
        获取得分排行榜
        GET /api/shooting/ranking/get
        按关卡编号查询排行榜，不填关卡编号则返回全部分数
        """
        return self.business.get_score_ranking(level_num, limit)

    def ActionShootingScoreSubmitPost(self, request: Request, body: ScoreSubmitRequest):
        """
        提交游戏得分
        POST /api/shooting/score/submit
        玩家通关后提交分数，写入排行榜
        """
        return self.business.submit_score(
            level_num=body.level_num,
            player_name=body.player_name,
            score=body.score,
            kills=body.kills,
            remaining_health=body.remaining_health,
            duration=body.duration
        )

    def ActionShootingInitDataGet(self, request: Request):
        """
        初始化默认数据
        GET /api/shooting/init/data/get
        初始化默认关卡配置（如果数据库为空）
        """
        return self.business.init_default_data()

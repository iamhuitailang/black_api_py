from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.rainforest import GameBusiness
from app.model.rainforest import (
    LAYER_LEAF, LAYER_SEMI_DECAYED, LAYER_HUMUS, LAYER_MINERAL,
    MORPH_FUNGI, MORPH_BACTERIA, MORPH_NEMATODE
)


class CreateGameRequest(BaseModel):
    initial_fungi: int = Field(default=5, ge=0, description="初始真菌数量")
    initial_bacteria: int = Field(default=8, ge=0, description="初始细菌数量")
    initial_nematode: int = Field(default=2, ge=0, description="初始线虫数量")


class MorphTransformRequest(BaseModel):
    game_id: int = Field(..., ge=1, description="游戏ID")
    population_id: int = Field(..., ge=1, description="种群ID")
    target_morph: int = Field(..., description="目标形态: 0=真菌, 1=细菌, 2=线虫")


class MigrateRequest(BaseModel):
    game_id: int = Field(..., ge=1, description="游戏ID")
    population_id: int = Field(..., ge=1, description="种群ID")
    target_layer_type: int = Field(..., description="目标层: 0=落叶层, 1=半腐层, 2=腐殖层, 3=矿质层")
    count: int = Field(..., ge=1, description="迁移数量")


class AddPopulationRequest(BaseModel):
    game_id: int = Field(..., ge=1, description="游戏ID")
    layer_type: int = Field(..., description="层类型: 0=落叶层, 1=半腐层, 2=腐殖层, 3=矿质层")
    morph_type: int = Field(..., description="形态: 0=真菌, 1=细菌, 2=线虫")
    count: int = Field(..., ge=1, description="数量")


class NematodeDevourRequest(BaseModel):
    game_id: int = Field(..., ge=1, description="游戏ID")
    nematode_pop_id: int = Field(..., ge=1, description="线虫种群ID")
    target_pop_id: int = Field(..., ge=1, description="被吞噬目标种群ID")


class RainforestController:
    def __init__(self):
        self.business = GameBusiness()

    def ActionRainforestGameCreatePost(self, request: Request, body: CreateGameRequest):
        """
        创建新游戏
        POST /api/rainforest/game/create
        初始化4层腐殖层，在落叶层放置初始种群
        """
        return self.business.create_game(
            initial_fungi=body.initial_fungi,
            initial_bacteria=body.initial_bacteria,
            initial_nematode=body.initial_nematode
        )

    def ActionRainforestGameGet(self, request: Request,
                                 game_id: int = Query(..., ge=1, description="游戏ID")):
        """
        获取游戏状态
        GET /api/rainforest/game/get
        返回完整的游戏状态，包括各层腐殖层和种群信息
        """
        return self.business.get_game_state(game_id)

    def ActionRainforestGameSummaryGet(self, request: Request,
                                        game_id: int = Query(..., ge=1, description="游戏ID")):
        """
        获取游戏概要
        GET /api/rainforest/game/summary/get
        返回游戏关键指标概要
        """
        return self.business.get_game_summary(game_id)

    def ActionRainforestGameTurnAdvancePost(self, request: Request,
                                             game_id: int = Query(..., ge=1, description="游戏ID")):
        """
        推进一个回合
        POST /api/rainforest/game/turn/advance
        处理消耗、暴雨事件、淋溶效应、资源枯竭检测
        """
        return self.business.advance_turn(game_id)

    def ActionRainforestMorphTransformPost(self, request: Request, body: MorphTransformRequest):
        """
        手动形态转换
        POST /api/rainforest/morph/transform
        玩家手动触发形态转换，不可自动切换
        """
        return self.business.morph_transform(
            game_id=body.game_id,
            population_id=body.population_id,
            target_morph=body.target_morph
        )

    def ActionRainforestMigratePost(self, request: Request, body: MigrateRequest):
        """
        跨层迁移种群
        POST /api/rainforest/migrate
        资源枯竭期间不允许迁移，跨层会触发适应机制
        """
        return self.business.migrate_population(
            game_id=body.game_id,
            population_id=body.population_id,
            target_layer_type=body.target_layer_type,
            count=body.count
        )

    def ActionRainforestPopulationAddPost(self, request: Request, body: AddPopulationRequest):
        """
        向指定层添加种群
        POST /api/rainforest/population/add
        """
        return self.business.add_population(
            game_id=body.game_id,
            layer_type=body.layer_type,
            morph_type=body.morph_type,
            count=body.count
        )

    def ActionRainforestNematodeDevourPost(self, request: Request, body: NematodeDevourRequest):
        """
        线虫吞噬小型分解者
        POST /api/rainforest/nematode/devour
        线虫吞噬时不消耗有机质，跨层时吞噬能力×0.6
        """
        return self.business.nematode_devour(
            game_id=body.game_id,
            nematode_pop_id=body.nematode_pop_id,
            target_pop_id=body.target_pop_id
        )

    def ActionRainforestGameDelete(self, request: Request,
                                    game_id: int = Query(..., ge=1, description="游戏ID")):
        """
        删除游戏
        DELETE /api/rainforest/game/delete
        """
        return self.business.delete_game(game_id)

    def ActionRainforestLayerConfigGet(self, request: Request):
        """
        获取腐殖层配置信息
        GET /api/rainforest/layer/config/get
        返回各层初始参数和常量
        """
        from app.model.rainforest import (
            LAYER_NAMES, LAYER_INITIAL_ORGANIC, LAYER_INITIAL_DIFFICULTY, LAYER_DEFAULT_AREA,
            MORPH_NAMES
        )
        from app.business.rainforest.game_business import (
            FUNGI_CONSUMPTION_MULTIPLIER, BACTERIA_CONSUMPTION_MULTIPLIER,
            NEMATODE_CONSUMPTION_MULTIPLIER, DENSITY_LIMIT_FACTOR,
            FUNGI_CROSS_LAYER_EFFICIENCY, BACTERIA_CROSS_LAYER_EFFICIENCY,
            NEMATODE_CROSS_LAYER_DEVOUR_EFFICIENCY,
            RAINSTORM_INTERVAL, RAINSTORM_LEAF_ORGANIC_BOOST,
            RAINSTORM_MINERAL_DIFFICULTY_MULTIPLIER,
            RAINSTORM_NEMATODE_CONSUMPTION_MULTIPLIER,
            LEACHING_SEMI_DECAYED_ORGANIC_BOOST, LEACHING_DURATION,
            DEPLETION_ORGANIC_DECAY_RATE, DEPLETION_CONSUMPTION_PENALTY
        )

        layers_config = []
        for lt in [0, 1, 2, 3]:
            layers_config.append({
                'layer_type': lt,
                'layer_name': LAYER_NAMES[lt],
                'initial_organic_matter': LAYER_INITIAL_ORGANIC[lt],
                'base_difficulty': LAYER_INITIAL_DIFFICULTY[lt],
                'default_area': LAYER_DEFAULT_AREA
            })

        morphs_config = []
        for mt in [0, 1, 2]:
            morphs_config.append({
                'morph_type': mt,
                'morph_name': MORPH_NAMES[mt],
                'consumption_multiplier': {
                    0: FUNGI_CONSUMPTION_MULTIPLIER,
                    1: BACTERIA_CONSUMPTION_MULTIPLIER,
                    2: NEMATODE_CONSUMPTION_MULTIPLIER
                }[mt]
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'layers': layers_config,
                'morphs': morphs_config,
                'rules': {
                    'density_limit_factor': DENSITY_LIMIT_FACTOR,
                    'depletion_organic_decay_rate': DEPLETION_ORGANIC_DECAY_RATE,
                    'depletion_consumption_penalty': DEPLETION_CONSUMPTION_PENALTY,
                    'fungi_cross_layer_efficiency': FUNGI_CROSS_LAYER_EFFICIENCY,
                    'bacteria_cross_layer_efficiency': BACTERIA_CROSS_LAYER_EFFICIENCY,
                    'nematode_cross_layer_devour_efficiency': NEMATODE_CROSS_LAYER_DEVOUR_EFFICIENCY,
                    'rainstorm_interval': RAINSTORM_INTERVAL,
                    'rainstorm_leaf_organic_boost': RAINSTORM_LEAF_ORGANIC_BOOST,
                    'rainstorm_mineral_difficulty_multiplier': RAINSTORM_MINERAL_DIFFICULTY_MULTIPLIER,
                    'rainstorm_nematode_consumption_multiplier': RAINSTORM_NEMATODE_CONSUMPTION_MULTIPLIER,
                    'leaching_semi_decayed_organic_boost': LEACHING_SEMI_DECAYED_ORGANIC_BOOST,
                    'leaching_duration': LEACHING_DURATION
                }
            }
        }

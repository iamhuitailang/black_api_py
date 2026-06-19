TECH_TREE = {
    'stone_tools': {
        'id': 'stone_tools', 'name': '石器制造', 'era': 'stone', 'cost': 0,
        'description': '学会制作石器，开启文明之路',
        'prerequisites': [], 'mutually_exclusive_with': [],
        'effects': {'gathering_bonus': 0.1, 'hunting_bonus': 0.1},
        'unlocks_buildings': ['stone_quarry'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 0, 'branch': 'root'}
    },
    'hunting': {
        'id': 'hunting', 'name': '狩猎术', 'era': 'stone', 'cost': 5,
        'description': '更高效的狩猎技术，增加食物获取',
        'prerequisites': ['stone_tools'], 'mutually_exclusive_with': [],
        'effects': {'hunting_bonus': 0.2, 'food_production': 3},
        'unlocks_buildings': [], 'unlocks_units': ['hunter'],
        'position': {'x': -2, 'y': 1, 'branch': 'military'}
    },
    'gathering': {
        'id': 'gathering', 'name': '采集术', 'era': 'stone', 'cost': 5,
        'description': '系统化的采集方法，稳定食物来源',
        'prerequisites': ['stone_tools'], 'mutually_exclusive_with': [],
        'effects': {'gathering_bonus': 0.2, 'food_production': 2},
        'unlocks_buildings': ['herb_garden'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 1, 'branch': 'economy'}
    },
    'shelter': {
        'id': 'shelter', 'name': '庇护所', 'era': 'stone', 'cost': 5,
        'description': '建造遮风避雨的住所，增加人口上限',
        'prerequisites': ['stone_tools'], 'mutually_exclusive_with': [],
        'effects': {'max_population_bonus': 5, 'morale_bonus': 5},
        'unlocks_buildings': ['hut'], 'unlocks_units': [],
        'position': {'x': 2, 'y': 1, 'branch': 'civic'}
    },
    'primitive_agriculture': {
        'id': 'primitive_agriculture', 'name': '原始农耕', 'era': 'stone', 'cost': 10,
        'description': '种下第一颗种子，开创农业文明。与游牧畜牧互斥',
        'prerequisites': ['gathering'], 'mutually_exclusive_with': ['nomadic_herding'],
        'effects': {'food_production': 5, 'gathering_bonus': 0.15},
        'unlocks_buildings': ['farm'], 'unlocks_units': [],
        'position': {'x': -1, 'y': 2, 'branch': 'economy'}
    },
    'nomadic_herding': {
        'id': 'nomadic_herding', 'name': '游牧畜牧', 'era': 'stone', 'cost': 10,
        'description': '逐水草而居，发展畜牧。与原始农耕互斥',
        'prerequisites': ['hunting'], 'mutually_exclusive_with': ['primitive_agriculture'],
        'effects': {'food_production': 4, 'hunting_bonus': 0.2, 'military_bonus': 0.1},
        'unlocks_buildings': ['pasture'], 'unlocks_units': ['rider'],
        'position': {'x': -3, 'y': 2, 'branch': 'military'}
    },
    'palisade': {
        'id': 'palisade', 'name': '木栅防御', 'era': 'stone', 'cost': 8,
        'description': '围绕营地的防御工事',
        'prerequisites': ['shelter'], 'mutually_exclusive_with': [],
        'effects': {'defense_bonus': 0.2, 'morale_bonus': 5},
        'unlocks_buildings': ['palisade'], 'unlocks_units': [],
        'position': {'x': 3, 'y': 2, 'branch': 'civic'}
    },
    'smelting': {
        'id': 'smelting', 'name': '冶炼术', 'era': 'copper', 'cost': 20,
        'description': '学会从矿石中提炼金属，迈入铜器时代',
        'prerequisites': ['stone_tools'],
        'mutually_exclusive_with': [],
        'effects': {'metal_production': 2, 'building_speed': 0.15},
        'unlocks_buildings': ['smelter'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 3, 'branch': 'root'}
    },
    'bronze_weapons': {
        'id': 'bronze_weapons', 'name': '青铜武器', 'era': 'copper', 'cost': 15,
        'description': '铸造青铜剑矛，军事力量大增',
        'prerequisites': ['smelting', 'hunting'], 'mutually_exclusive_with': [],
        'effects': {'military_bonus': 0.3},
        'unlocks_buildings': ['armory'], 'unlocks_units': ['spearman'],
        'position': {'x': -2, 'y': 4, 'branch': 'military'}
    },
    'copper_mining': {
        'id': 'copper_mining', 'name': '铜矿开采', 'era': 'copper', 'cost': 15,
        'description': '深入地底开采铜矿，金属供应稳定',
        'prerequisites': ['smelting'], 'mutually_exclusive_with': [],
        'effects': {'metal_production': 3, 'stone_production': 1},
        'unlocks_buildings': ['mine'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 4, 'branch': 'economy'}
    },
    'pottery': {
        'id': 'pottery', 'name': '制陶术', 'era': 'copper', 'cost': 12,
        'description': '陶器改善食物储存，减少冬季损耗',
        'prerequisites': ['smelting'], 'mutually_exclusive_with': [],
        'effects': {'food_preservation': 0.2, 'morale_bonus': 5},
        'unlocks_buildings': ['kiln'], 'unlocks_units': [],
        'position': {'x': 2, 'y': 4, 'branch': 'civic'}
    },
    'military_tradition': {
        'id': 'military_tradition', 'name': '军事传统', 'era': 'copper', 'cost': 25,
        'description': '建立职业军事体系。与贸易路线互斥',
        'prerequisites': ['bronze_weapons'], 'mutually_exclusive_with': ['trade_routes'],
        'effects': {'military_bonus': 0.3, 'morale_bonus': 10},
        'unlocks_buildings': ['barracks'], 'unlocks_units': ['warrior'],
        'position': {'x': -3, 'y': 5, 'branch': 'military'}
    },
    'trade_routes': {
        'id': 'trade_routes', 'name': '贸易路线', 'era': 'copper', 'cost': 25,
        'description': '开辟商路，以物易物。与军事传统互斥',
        'prerequisites': ['copper_mining', 'pottery'], 'mutually_exclusive_with': ['military_tradition'],
        'effects': {'trade_bonus': 0.4, 'knowledge_production': 1},
        'unlocks_buildings': ['market'], 'unlocks_units': ['trader'],
        'position': {'x': 1, 'y': 5, 'branch': 'economy'}
    },
    'writing': {
        'id': 'writing', 'name': '文字发明', 'era': 'copper', 'cost': 18,
        'description': '记录知识，加速研究进程',
        'prerequisites': ['pottery'], 'mutually_exclusive_with': [],
        'effects': {'research_bonus': 0.3, 'knowledge_production': 2},
        'unlocks_buildings': ['scribe_office'], 'unlocks_units': [],
        'position': {'x': 3, 'y': 5, 'branch': 'civic'}
    },
    'iron_forging': {
        'id': 'iron_forging', 'name': '铁器锻造', 'era': 'iron', 'cost': 40,
        'description': '掌握铁器冶炼，迈入铁器时代',
        'prerequisites': ['smelting', 'copper_mining'], 'mutually_exclusive_with': [],
        'effects': {'metal_production': 3, 'building_speed': 0.2, 'military_bonus': 0.15},
        'unlocks_buildings': ['forge'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 6, 'branch': 'root'}
    },
    'iron_weapons': {
        'id': 'iron_weapons', 'name': '铁制兵器', 'era': 'iron', 'cost': 30,
        'description': '铁剑铁盾，碾压铜器对手',
        'prerequisites': ['iron_forging', 'bronze_weapons'], 'mutually_exclusive_with': [],
        'effects': {'military_bonus': 0.4},
        'unlocks_buildings': [], 'unlocks_units': ['iron_guard'],
        'position': {'x': -2, 'y': 7, 'branch': 'military'}
    },
    'architecture': {
        'id': 'architecture', 'name': '建筑学', 'era': 'iron', 'cost': 25,
        'description': '石墙高塔，城邦崛起',
        'prerequisites': ['iron_forging', 'shelter'], 'mutually_exclusive_with': [],
        'effects': {'max_population_bonus': 10, 'defense_bonus': 0.3, 'building_speed': 0.2},
        'unlocks_buildings': ['stone_wall', 'watchtower'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 7, 'branch': 'economy'}
    },
    'philosophy': {
        'id': 'philosophy', 'name': '哲学思辨', 'era': 'iron', 'cost': 25,
        'description': '思考天地万物，启蒙民智',
        'prerequisites': ['writing'], 'mutually_exclusive_with': [],
        'effects': {'research_bonus': 0.3, 'morale_bonus': 10},
        'unlocks_buildings': ['academy'], 'unlocks_units': [],
        'position': {'x': 2, 'y': 7, 'branch': 'civic'}
    },
    'cavalry_warfare': {
        'id': 'cavalry_warfare', 'name': '骑兵战术', 'era': 'iron', 'cost': 50,
        'description': '铁骑纵横天下。与文官制度互斥',
        'prerequisites': ['iron_weapons', 'nomadic_herding'], 'mutually_exclusive_with': ['administration'],
        'effects': {'military_bonus': 0.5, 'hunting_bonus': 0.2},
        'unlocks_buildings': ['stable'], 'unlocks_units': ['cavalry'],
        'position': {'x': -3, 'y': 8, 'branch': 'military'}
    },
    'administration': {
        'id': 'administration', 'name': '文官制度', 'era': 'iron', 'cost': 50,
        'description': '以法治国，以制理邦。与骑兵战术互斥',
        'prerequisites': ['philosophy', 'writing'], 'mutually_exclusive_with': ['cavalry_warfare'],
        'effects': {'max_population_bonus': 15, 'research_bonus': 0.2, 'morale_bonus': 15},
        'unlocks_buildings': ['courthouse'], 'unlocks_units': [],
        'position': {'x': 3, 'y': 8, 'branch': 'civic'}
    },
    'engineering': {
        'id': 'engineering', 'name': '工程学', 'era': 'iron', 'cost': 35,
        'description': '精密的机械与建筑技艺',
        'prerequisites': ['architecture', 'iron_forging'], 'mutually_exclusive_with': [],
        'effects': {'building_speed': 0.3, 'stone_production': 2, 'metal_production': 2},
        'unlocks_buildings': ['workshop'], 'unlocks_units': [],
        'position': {'x': 1, 'y': 8, 'branch': 'economy'}
    },
    'gunpowder': {
        'id': 'gunpowder', 'name': '火药发明', 'era': 'firearm', 'cost': 80,
        'description': '炼丹炉中的意外发现，改变战争形态',
        'prerequisites': ['iron_forging', 'philosophy'], 'mutually_exclusive_with': [],
        'effects': {'military_bonus': 0.3},
        'unlocks_buildings': ['powder_mill'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 9, 'branch': 'root'}
    },
    'firearms': {
        'id': 'firearms', 'name': '火器制造', 'era': 'firearm', 'cost': 60,
        'description': '打造第一把火枪，战争进入热兵器时代',
        'prerequisites': ['gunpowder', 'iron_weapons'], 'mutually_exclusive_with': [],
        'effects': {'military_bonus': 0.6},
        'unlocks_buildings': ['armory_ii'], 'unlocks_units': ['musketeer'],
        'position': {'x': -2, 'y': 10, 'branch': 'military'}
    },
    'printing': {
        'id': 'printing', 'name': '印刷术', 'era': 'firearm', 'cost': 45,
        'description': '知识传播的革命',
        'prerequisites': ['gunpowder', 'writing'], 'mutually_exclusive_with': [],
        'effects': {'research_bonus': 0.5, 'knowledge_production': 3},
        'unlocks_buildings': ['printing_house'], 'unlocks_units': [],
        'position': {'x': 0, 'y': 10, 'branch': 'economy'}
    },
    'navigation': {
        'id': 'navigation', 'name': '航海术', 'era': 'firearm', 'cost': 45,
        'description': '扬帆远航，探索未知世界',
        'prerequisites': ['gunpowder', 'trade_routes'], 'mutually_exclusive_with': [],
        'effects': {'trade_bonus': 0.5, 'food_production': 3},
        'unlocks_buildings': ['harbor'], 'unlocks_units': ['marine'],
        'position': {'x': 2, 'y': 10, 'branch': 'civic'}
    },
    'artillery': {
        'id': 'artillery', 'name': '火炮铸造', 'era': 'firearm', 'cost': 70,
        'description': '攻城拔寨，无坚不摧',
        'prerequisites': ['firearms'], 'mutually_exclusive_with': [],
        'effects': {'military_bonus': 0.4, 'defense_bonus': 0.2},
        'unlocks_buildings': ['cannon_foundry'], 'unlocks_units': ['artillery_unit'],
        'position': {'x': -3, 'y': 11, 'branch': 'military'}
    },
    'total_war': {
        'id': 'total_war', 'name': '总体战', 'era': 'firearm', 'cost': 100,
        'description': '全民皆兵，战无不胜。与启蒙运动互斥',
        'prerequisites': ['artillery', 'cavalry_warfare'], 'mutually_exclusive_with': ['enlightenment'],
        'effects': {'military_bonus': 0.8, 'morale_bonus': 20},
        'unlocks_buildings': ['war_college'], 'unlocks_units': ['elite_guard'],
        'position': {'x': -3, 'y': 12, 'branch': 'military'}
    },
    'enlightenment': {
        'id': 'enlightenment', 'name': '启蒙运动', 'era': 'firearm', 'cost': 100,
        'description': '理性之光照耀文明。与总体战互斥',
        'prerequisites': ['printing', 'administration'], 'mutually_exclusive_with': ['total_war'],
        'effects': {'research_bonus': 0.8, 'knowledge_production': 5, 'morale_bonus': 15},
        'unlocks_buildings': ['university'], 'unlocks_units': [],
        'position': {'x': 3, 'y': 12, 'branch': 'civic'}
    },
    'colonization': {
        'id': 'colonization', 'name': '殖民扩张', 'era': 'firearm', 'cost': 75,
        'description': '海外殖民，开辟新天地',
        'prerequisites': ['navigation'], 'mutually_exclusive_with': [],
        'effects': {'max_population_bonus': 30, 'food_production': 5, 'trade_bonus': 0.3},
        'unlocks_buildings': ['colony'], 'unlocks_units': [],
        'position': {'x': 2, 'y': 11, 'branch': 'civic'}
    },
}

TECH_ERA_ORDER = {'stone': 0, 'copper': 1, 'iron': 2, 'firearm': 3}

MUTUALLY_EXCLUSIVE_PAIRS = [
    ('primitive_agriculture', 'nomadic_herding'),
    ('military_tradition', 'trade_routes'),
    ('cavalry_warfare', 'administration'),
    ('total_war', 'enlightenment'),
]

BUILDING_DEFINITIONS = {
    'hut': {
        'name': '草棚', 'era': 'stone', 'max_level': 3,
        'cost': {'wood': 10, 'stone': 0, 'metal': 0},
        'effects': {'max_population_bonus': 3},
        'description': '简陋的草棚，勉强遮风挡雨',
        'style': 'straw_hut'
    },
    'farm': {
        'name': '农田', 'era': 'stone', 'max_level': 5,
        'cost': {'wood': 5, 'stone': 5, 'metal': 0},
        'effects': {'food_production': 5},
        'description': '原始农田，春种秋收',
        'style': 'farm_plot'
    },
    'pasture': {
        'name': '牧场', 'era': 'stone', 'max_level': 5,
        'cost': {'wood': 8, 'stone': 3, 'metal': 0},
        'effects': {'food_production': 4},
        'description': '放牧牛羊的牧场',
        'style': 'animal_pen'
    },
    'stone_quarry': {
        'name': '采石场', 'era': 'stone', 'max_level': 3,
        'cost': {'wood': 5, 'stone': 0, 'metal': 0},
        'effects': {'stone_production': 3},
        'description': '开采石料的场地',
        'style': 'quarry'
    },
    'herb_garden': {
        'name': '药草园', 'era': 'stone', 'max_level': 3,
        'cost': {'wood': 5, 'stone': 2, 'metal': 0},
        'effects': {'morale_bonus': 3, 'food_production': 1},
        'description': '种植药草，治疗伤病',
        'style': 'garden'
    },
    'palisade': {
        'name': '木栅栏', 'era': 'stone', 'max_level': 2,
        'cost': {'wood': 15, 'stone': 0, 'metal': 0},
        'effects': {'defense_bonus': 0.1},
        'description': '环绕营地的木栅',
        'style': 'wooden_fence'
    },
    'smelter': {
        'name': '冶炼炉', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 20, 'metal': 0},
        'effects': {'metal_production': 3},
        'description': '炼铜的炉火日夜不息',
        'style': 'furnace'
    },
    'armory': {
        'name': '兵器坊', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 10, 'stone': 10, 'metal': 10},
        'effects': {'military_bonus': 0.1},
        'description': '锻造青铜兵器',
        'style': 'weapon_shop'
    },
    'mine': {
        'name': '矿场', 'era': 'copper', 'max_level': 5,
        'cost': {'wood': 10, 'stone': 15, 'metal': 5},
        'effects': {'metal_production': 2, 'stone_production': 2},
        'description': '深入地底的矿场',
        'style': 'mine_shaft'
    },
    'kiln': {
        'name': '窑场', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 8, 'stone': 12, 'metal': 0},
        'effects': {'food_preservation': 0.1},
        'description': '烧制陶器，储存食物',
        'style': 'clay_kiln'
    },
    'barracks': {
        'name': '兵营', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 20, 'metal': 10},
        'effects': {'military_bonus': 0.15},
        'description': '训练士兵的营地',
        'style': 'military_camp'
    },
    'market': {
        'name': '集市', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 12, 'stone': 8, 'metal': 5},
        'effects': {'trade_bonus': 0.2},
        'description': '物物交换的集市',
        'style': 'market_stall'
    },
    'scribe_office': {
        'name': '书吏馆', 'era': 'copper', 'max_level': 3,
        'cost': {'wood': 8, 'stone': 10, 'metal': 2},
        'effects': {'research_bonus': 0.1, 'knowledge_production': 1},
        'description': '记录知识的场所',
        'style': 'scroll_room'
    },
    'forge': {
        'name': '铁匠铺', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 25, 'metal': 20},
        'effects': {'metal_production': 4, 'military_bonus': 0.1},
        'description': '叮当锤声，铁器出炉',
        'style': 'blacksmith'
    },
    'stone_wall': {
        'name': '石墙', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 5, 'stone': 40, 'metal': 10},
        'effects': {'defense_bonus': 0.3, 'max_population_bonus': 5},
        'description': '坚实的石墙围护城邦',
        'style': 'stone_wall'
    },
    'watchtower': {
        'name': '瞭望塔', 'era': 'iron', 'max_level': 2,
        'cost': {'wood': 10, 'stone': 20, 'metal': 5},
        'effects': {'defense_bonus': 0.1},
        'description': '高塔守望四方',
        'style': 'tower'
    },
    'academy': {
        'name': '学宫', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 10, 'stone': 20, 'metal': 5},
        'effects': {'research_bonus': 0.2, 'knowledge_production': 2},
        'description': '哲人论道之所',
        'style': 'scholar_hall'
    },
    'courthouse': {
        'name': '衙署', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 30, 'metal': 10},
        'effects': {'morale_bonus': 10, 'max_population_bonus': 10},
        'description': '治理邦国的官署',
        'style': 'government_building'
    },
    'stable': {
        'name': '马厩', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 20, 'stone': 15, 'metal': 10},
        'effects': {'military_bonus': 0.15},
        'description': '训练战马的马厩',
        'style': 'horse_stable'
    },
    'workshop': {
        'name': '工坊', 'era': 'iron', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 20, 'metal': 15},
        'effects': {'building_speed': 0.2, 'stone_production': 2},
        'description': '精密制造的工坊',
        'style': 'workshop_building'
    },
    'powder_mill': {
        'name': '火药坊', 'era': 'firearm', 'max_level': 3,
        'cost': {'wood': 10, 'stone': 15, 'metal': 20},
        'effects': {'military_bonus': 0.15},
        'description': '研磨火药的作坊',
        'style': 'powder_workshop'
    },
    'armory_ii': {
        'name': '军械所', 'era': 'firearm', 'max_level': 3,
        'cost': {'wood': 15, 'stone': 20, 'metal': 30},
        'effects': {'military_bonus': 0.2},
        'description': '打造火器的军械所',
        'style': 'gun_factory'
    },
    'printing_house': {
        'name': '印书馆', 'era': 'firearm', 'max_level': 3,
        'cost': {'wood': 20, 'stone': 15, 'metal': 10},
        'effects': {'research_bonus': 0.3, 'knowledge_production': 3},
        'description': '印刷传播知识',
        'style': 'print_shop'
    },
    'harbor': {
        'name': '港口', 'era': 'firearm', 'max_level': 3,
        'cost': {'wood': 30, 'stone': 25, 'metal': 15},
        'effects': {'trade_bonus': 0.3, 'food_production': 3},
        'description': '远洋贸易的港口',
        'style': 'docking_port'
    },
    'cannon_foundry': {
        'name': '铸炮厂', 'era': 'firearm', 'max_level': 2,
        'cost': {'wood': 10, 'stone': 30, 'metal': 40},
        'effects': {'military_bonus': 0.25, 'defense_bonus': 0.15},
        'description': '铸造火炮的工场',
        'style': 'cannon_factory'
    },
    'war_college': {
        'name': '军事学院', 'era': 'firearm', 'max_level': 2,
        'cost': {'wood': 20, 'stone': 30, 'metal': 25},
        'effects': {'military_bonus': 0.3, 'morale_bonus': 15},
        'description': '培养将领的军事学府',
        'style': 'military_academy'
    },
    'university': {
        'name': '大学', 'era': 'firearm', 'max_level': 3,
        'cost': {'wood': 20, 'stone': 35, 'metal': 15},
        'effects': {'research_bonus': 0.5, 'knowledge_production': 5},
        'description': '学术自由的高等学府',
        'style': 'university_building'
    },
    'colony': {
        'name': '殖民地', 'era': 'firearm', 'max_level': 2,
        'cost': {'wood': 25, 'stone': 20, 'metal': 15},
        'effects': {'max_population_bonus': 15, 'food_production': 3},
        'description': '海外殖民据点',
        'style': 'colony_outpost'
    },
}

MILITARY_UNITS = {
    'hunter': {'name': '猎人', 'era': 'stone', 'strength': 3, 'cost': {'food': 5}},
    'rider': {'name': '骑手', 'era': 'stone', 'strength': 5, 'cost': {'food': 8, 'wood': 3}},
    'spearman': {'name': '矛兵', 'era': 'copper', 'strength': 8, 'cost': {'food': 10, 'metal': 3}},
    'warrior': {'name': '武士', 'era': 'copper', 'strength': 12, 'cost': {'food': 15, 'metal': 5}},
    'trader': {'name': '商人', 'era': 'copper', 'strength': 1, 'cost': {'food': 5, 'wood': 5}},
    'iron_guard': {'name': '铁卫', 'era': 'iron', 'strength': 18, 'cost': {'food': 20, 'metal': 10}},
    'cavalry': {'name': '骑兵', 'era': 'iron', 'strength': 22, 'cost': {'food': 25, 'metal': 12}},
    'musketeer': {'name': '火枪手', 'era': 'firearm', 'strength': 30, 'cost': {'food': 25, 'metal': 15}},
    'artillery_unit': {'name': '炮兵', 'era': 'firearm', 'strength': 40, 'cost': {'food': 30, 'metal': 25}},
    'marine': {'name': '水兵', 'era': 'firearm', 'strength': 25, 'cost': {'food': 20, 'metal': 12}},
    'elite_guard': {'name': '禁卫军', 'era': 'firearm', 'strength': 50, 'cost': {'food': 40, 'metal': 30}},
}

SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter']
SEASON_NAMES = {'spring': '春', 'summer': '夏', 'autumn': '秋', 'winter': '冬'}

SEASON_EFFECTS = {
    'spring': {
        'food_modifier': 1.0, 'wood_modifier': 1.0, 'stone_modifier': 1.0,
        'metal_modifier': 1.0, 'research_modifier': 1.0,
        'food_consumption': 1, 'description': '万物复苏，正常的产出季节'
    },
    'summer': {
        'food_modifier': 1.3, 'wood_modifier': 1.2, 'stone_modifier': 1.0,
        'metal_modifier': 1.0, 'research_modifier': 0.9,
        'food_consumption': 1.1, 'description': '炎热夏季，食物和木材产出增加'
    },
    'autumn': {
        'food_modifier': 1.5, 'wood_modifier': 1.0, 'stone_modifier': 1.0,
        'metal_modifier': 1.0, 'research_modifier': 1.0,
        'food_consumption': 1.0, 'description': '丰收季节，食物产出大增，适宜贸易'
    },
    'winter': {
        'food_modifier': 0.3, 'wood_modifier': 0.5, 'stone_modifier': 0.7,
        'metal_modifier': 0.8, 'research_modifier': 1.2,
        'food_consumption': 1.5, 'description': '严冬来临，产出锐减，消耗储备'
    },
}

ERA_NAMES = {'stone': '石器时代', 'copper': '铜器时代', 'iron': '铁器时代', 'firearm': '火器时代'}

ERA_ADVANCE_REQUIREMENTS = {
    'copper': {'min_techs': 3, 'required_tech': 'smelting'},
    'iron': {'min_techs': 6, 'required_tech': 'iron_forging'},
    'firearm': {'min_techs': 9, 'required_tech': 'gunpowder'},
}

JOB_NAMES = {
    'idle': '待命', 'gatherer': '采集者', 'hunter': '猎人',
    'builder': '建造者', 'researcher': '研究者', 'soldier': '士兵',
    'trader': '商人', 'farmer': '农夫', 'miner': '矿工'
}

JOB_RESOURCE_MAPPING = {
    'gatherer': {'food': 2, 'wood': 1},
    'hunter': {'food': 3},
    'builder': {'wood': 1, 'stone': 1},
    'researcher': {'knowledge': 1},
    'soldier': {},
    'trader': {'knowledge': 0.5},
    'farmer': {'food': 4},
    'miner': {'stone': 2, 'metal': 1},
}

FOREIGN_TRIBE_TEMPLATES = [
    {'name': '鹿角部落', 'era': 'stone', 'strength': 8, 'attitude': 'neutral',
     'specialty_resource': 'food', 'trade_available': 1},
    {'name': '铁鹰部落', 'era': 'stone', 'strength': 15, 'attitude': 'hostile',
     'specialty_resource': 'metal', 'trade_available': 0},
    {'name': '碧水部落', 'era': 'stone', 'strength': 10, 'attitude': 'friendly',
     'specialty_resource': 'wood', 'trade_available': 1},
    {'name': '红石部落', 'era': 'copper', 'strength': 20, 'attitude': 'neutral',
     'specialty_resource': 'stone', 'trade_available': 1},
    {'name': '金风部落', 'era': 'copper', 'strength': 25, 'attitude': 'neutral',
     'specialty_resource': 'knowledge', 'trade_available': 1},
]

TRADE_RATES = {
    'food': 1.0, 'wood': 1.5, 'stone': 2.0, 'metal': 3.0, 'knowledge': 4.0
}

TRIBESPERSON_NAMES = [
    '阿石', '阿木', '阿水', '阿火', '阿土',
    '小风', '小雨', '小雷', '小云', '小霜',
    '石生', '木生', '水生', '火生', '土生',
    '春花', '夏叶', '秋实', '冬梅', '青松',
    '白鹿', '黑熊', '红狐', '灰狼', '金雕',
    '铁锤', '铜铃', '银针', '玉珠', '琉璃',
]

BUILDING_STYLES_BY_ERA = {
    'stone': {
        'hut': {'fill': '#8B7355', 'stroke': '#6B4226', 'roof': '#90EE90', 'label': '草棚'},
        'farm': {'fill': '#8FBC8F', 'stroke': '#556B2F', 'roof': None, 'label': '田地'},
        'pasture': {'fill': '#DEB887', 'stroke': '#8B7355', 'roof': None, 'label': '牧场'},
        'stone_quarry': {'fill': '#A9A9A9', 'stroke': '#696969', 'roof': None, 'label': '采石场'},
    },
    'copper': {
        'hut': {'fill': '#CD853F', 'stroke': '#8B4513', 'roof': '#D2691E', 'label': '木屋'},
        'farm': {'fill': '#9ACD32', 'stroke': '#6B8E23', 'roof': None, 'label': '良田'},
        'smelter': {'fill': '#B87333', 'stroke': '#8B4513', 'roof': '#FF6347', 'label': '冶炼炉'},
        'market': {'fill': '#DAA520', 'stroke': '#B8860B', 'roof': '#FFD700', 'label': '集市'},
    },
    'iron': {
        'hut': {'fill': '#A0522D', 'stroke': '#4A4A4A', 'roof': '#696969', 'label': '石屋'},
        'farm': {'fill': '#32CD32', 'stroke': '#228B22', 'roof': None, 'label': '庄园'},
        'forge': {'fill': '#4A4A4A', 'stroke': '#2F2F2F', 'roof': '#FF4500', 'label': '铁匠铺'},
        'stone_wall': {'fill': '#808080', 'stroke': '#4A4A4A', 'roof': None, 'label': '石墙'},
    },
    'firearm': {
        'hut': {'fill': '#8B0000', 'stroke': '#4A4A4A', 'roof': '#2F4F4F', 'label': '官邸'},
        'farm': {'fill': '#228B22', 'stroke': '#006400', 'roof': None, 'label': '大庄园'},
        'armory_ii': {'fill': '#2F4F4F', 'stroke': '#1C1C1C', 'roof': '#696969', 'label': '军械所'},
        'harbor': {'fill': '#4682B4', 'stroke': '#2F4F4F', 'roof': '#5F9EA0', 'label': '港口'},
    },
}

PERSON_ICON = {
    'idle': '🧍', 'gatherer': '🧺', 'hunter': '🏹',
    'builder': '🔨', 'researcher': '📖', 'soldier': '⚔️',
    'trader': '💰', 'farmer': '🌾', 'miner': '⛏️'
}

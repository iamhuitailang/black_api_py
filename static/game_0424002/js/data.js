/**
 * 《文字修仙》全局数据和公用方法
 * 所有游戏数据、配置、公用函数都放在这里
 * 实现本地存档，数据在各页面间互通
 */

// ============================================================================
// 一、游戏配置数据（这些是固定的配置，可以根据需要修改）
// ============================================================================

const GAME_CONFIG = {
    // 游戏名称
    gameName: "文字修仙",
    
    // 本地存储的键名
    storageKey: "wen_zi_xiuxian_save",
    
    // 等级经验配置：level -> 需要的经验值
    // 格式：等级: 需要的总经验
    levelExp: {
        1: 0,       // 1级需要0经验
        2: 100,     // 2级需要100经验
        3: 300,     // 3级需要300经验
        4: 600,     // 4级需要600经验
        5: 1000,    // 5级需要1000经验
        6: 1500,    // 6级需要1500经验
        7: 2100,    // 7级需要2100经验
        8: 2800,    // 8级需要2800经验
        9: 3600,    // 9级需要3600经验
        10: 4500,   // 10级需要4500经验
        11: 5500,
        12: 6600,
        13: 7800,
        14: 9100,
        15: 10500,
        16: 12000,
        17: 13600,
        18: 15300,
        19: 17100,
        20: 19000
    },
    
    // 境界名称配置（对应等级）
    realms: {
        1: "凡人",
        2: "炼气初期",
        3: "炼气中期",
        4: "炼气后期",
        5: "筑基初期",
        6: "筑基中期",
        7: "筑基后期",
        8: "金丹初期",
        9: "金丹中期",
        10: "金丹后期",
        11: "元婴初期",
        12: "元婴中期",
        13: "元婴后期",
        14: "化神初期",
        15: "化神中期",
        16: "化神后期",
        17: "合体初期",
        18: "合体中期",
        19: "合体后期",
        20: "大乘期"
    },
    
    // 怪物配置：按等级区间分布
    monsters: [
        { id: 1, name: "野兔", hp: 30, attack: 5, exp: 10, gold: 5, minLevel: 1, maxLevel: 2 },
        { id: 2, name: "野狼", hp: 50, attack: 8, exp: 20, gold: 10, minLevel: 2, maxLevel: 3 },
        { id: 3, name: "山贼", hp: 80, attack: 12, exp: 35, gold: 20, minLevel: 3, maxLevel: 4 },
        { id: 4, name: "土匪头目", hp: 120, attack: 18, exp: 50, gold: 35, minLevel: 4, maxLevel: 5 },
        { id: 5, name: "妖兽·青蛇", hp: 150, attack: 25, exp: 70, gold: 50, minLevel: 5, maxLevel: 6 },
        { id: 6, name: "妖兽·赤狐", hp: 200, attack: 35, exp: 100, gold: 70, minLevel: 6, maxLevel: 7 },
        { id: 7, name: "邪修弟子", hp: 250, attack: 45, exp: 130, gold: 90, minLevel: 7, maxLevel: 8 },
        { id: 8, name: "邪修长老", hp: 350, attack: 60, exp: 180, gold: 130, minLevel: 8, maxLevel: 9 },
        { id: 9, name: "鬼将", hp: 450, attack: 80, exp: 250, gold: 180, minLevel: 9, maxLevel: 10 },
        { id: 10, name: "鬼王", hp: 600, attack: 100, exp: 350, gold: 250, minLevel: 10, maxLevel: 12 },
        { id: 11, name: "天魔", hp: 800, attack: 130, exp: 500, gold: 350, minLevel: 12, maxLevel: 14 },
        { id: 12, name: "魔尊", hp: 1200, attack: 180, exp: 800, gold: 500, minLevel: 14, maxLevel: 16 },
        { id: 13, name: "远古妖圣", hp: 2000, attack: 250, exp: 1200, gold: 800, minLevel: 16, maxLevel: 18 },
        { id: 14, name: "天道守护者", hp: 3500, attack: 350, exp: 2000, gold: 1200, minLevel: 18, maxLevel: 20 }
    ],
    
    // 商店物品配置
    shopItems: [
        { 
            id: 1, 
            name: "下品灵石", 
            type: "consumable",
            description: "使用后立即恢复50生命值",
            price: 20,
            effect: { type: "heal", value: 50 }
        },
        { 
            id: 2, 
            name: "中品灵石", 
            type: "consumable",
            description: "使用后立即恢复150生命值",
            price: 60,
            effect: { type: "heal", value: 150 }
        },
        { 
            id: 3, 
            name: "上品灵石", 
            type: "consumable",
            description: "使用后立即恢复全部生命值",
            price: 150,
            effect: { type: "fullHeal" }
        },
        { 
            id: 4, 
            name: "铁剑", 
            type: "equipment",
            description: "攻击力 +10",
            price: 100,
            effect: { type: "attack", value: 10 }
        },
        { 
            id: 5, 
            name: "精钢剑", 
            type: "equipment",
            description: "攻击力 +30",
            price: 300,
            effect: { type: "attack", value: 30 }
        },
        { 
            id: 6, 
            name: "灵剑", 
            type: "equipment",
            description: "攻击力 +80",
            price: 800,
            effect: { type: "attack", value: 80 }
        },
        { 
            id: 7, 
            name: "布衣", 
            type: "equipment",
            description: "最大生命值 +50",
            price: 80,
            effect: { type: "maxHp", value: 50 }
        },
        { 
            id: 8, 
            name: "铁甲", 
            type: "equipment",
            description: "最大生命值 +150",
            price: 250,
            effect: { type: "maxHp", value: 150 }
        },
        { 
            id: 9, 
            name: "法袍", 
            type: "equipment",
            description: "最大生命值 +400",
            price: 700,
            effect: { type: "maxHp", value: 400 }
        },
        { 
            id: 10, 
            name: "力量丹", 
            type: "permanent",
            description: "永久增加攻击力 +5",
            price: 500,
            effect: { type: "attackPermanent", value: 5 }
        },
        { 
            id: 11, 
            name: "体魄丹", 
            type: "permanent",
            description: "永久增加最大生命值 +30",
            price: 300,
            effect: { type: "maxHpPermanent", value: 30 }
        }
    ],
    
    // 修炼配置
    cultivation: {
        baseExpPerSecond: 2,      // 基础每秒获得的经验
        baseGoldPerSecond: 1,      // 基础每秒获得的金币
        efficiency: {              // 不同效率倍数
            1: { name: "普通修炼", multiplier: 1, description: "基础效率" },
            2: { name: "聚气修炼", multiplier: 2, description: "双倍效率" },
            5: { name: "闭关修炼", multiplier: 5, description: "五倍效率" }
        }
    },
    
    // 战斗配置
    battle: {
        autoBattleInterval: 1000,  // 自动战斗间隔（毫秒）
        criticalChance: 0.1,       // 暴击概率 10%
        criticalMultiplier: 2      // 暴击伤害倍数
    }
};

// ============================================================================
// 二、游戏状态数据（这些是会变化的玩家数据）
// ============================================================================

// 默认初始数据（新游戏时使用）
const DEFAULT_GAME_DATA = {
    // 玩家基础信息
    player: {
        name: "修仙者",
        level: 1,
        exp: 0,
        gold: 50,
        
        // 战斗属性
        baseAttack: 10,          // 基础攻击力
        baseMaxHp: 100,          // 基础最大生命值
        currentHp: 100,          // 当前生命值
        
        // 装备加成
        equipmentAttack: 0,      // 装备提供的攻击力
        equipmentMaxHp: 0,       // 装备提供的最大生命值
        
        // 永久属性加成（丹药等）
        permanentAttack: 0,      // 永久增加的攻击力
        permanentMaxHp: 0,       // 永久增加的最大生命值
        
        // 统计数据
        monstersKilled: 0,       // 击杀怪物数
        totalGoldEarned: 0,      // 累计获得金币
        totalExpEarned: 0,       // 累计获得经验
        playTime: 0,             // 游戏时长（秒）
        battlesWon: 0,           // 胜利战斗次数
        
        // 已购买的装备列表（ID数组）
        ownedEquipment: [],
        
        // 背包：消耗品数量
        inventory: {
            1: 3,   // 下品灵石 x3
            2: 0,   // 中品灵石 x0
            3: 0    // 上品灵石 x0
        }
    },
    
    // 战斗相关临时数据
    battle: {
        isFighting: false,        // 是否正在战斗
        currentMonster: null,     // 当前战斗的怪物
        battleLog: [],            // 战斗日志
        autoBattleEnabled: true,  // 是否开启自动战斗
        lastBattleTime: 0         // 上次战斗时间
    },
    
    // 修炼相关数据
    cultivation: {
        isCultivating: false,     // 是否正在修炼
        efficiency: 1,            // 修炼效率倍数
        startTime: 0              // 修炼开始时间
    },
    
    // 游戏设置
    settings: {
        soundEnabled: true,       // 是否开启音效
        autoSaveEnabled: true,    // 是否自动保存
        lastSaveTime: Date.now(), // 上次保存时间
        creationTime: Date.now()  // 游戏创建时间
    }
};

// 当前游戏数据（运行时使用，从本地存储读取或使用默认值）
let gameData = null;

// ============================================================================
// 三、数据管理函数（存档、读档、重置）
// ============================================================================

/**
 * 初始化游戏数据
 * 优先从本地存储读取，如果没有则创建新存档
 */
function initGameData() {
    const savedData = localStorage.getItem(GAME_CONFIG.storageKey);
    
    if (savedData) {
        try {
            // 解析保存的数据
            const parsedData = JSON.parse(savedData);
            // 与默认数据合并，确保新增的字段也有默认值
            gameData = deepMerge(DEFAULT_GAME_DATA, parsedData);
            console.log("✅ 存档加载成功！");
        } catch (error) {
            console.error("❌ 存档解析失败，使用新存档：", error);
            gameData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
        }
    } else {
        // 没有存档，创建新游戏
        console.log("📝 创建新存档...");
        gameData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
        saveGameData();
    }
    
    return gameData;
}

/**
 * 保存游戏数据到本地存储
 */
function saveGameData() {
    if (!gameData) return;
    
    try {
        // 更新保存时间
        gameData.settings.lastSaveTime = Date.now();
        // 序列化并保存
        const jsonString = JSON.stringify(gameData);
        localStorage.setItem(GAME_CONFIG.storageKey, jsonString);
        console.log("💾 游戏已保存");
    } catch (error) {
        console.error("❌ 保存失败：", error);
    }
}

/**
 * 重置游戏数据（重新开始）
 */
function resetGameData() {
    localStorage.removeItem(GAME_CONFIG.storageKey);
    gameData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
    saveGameData();
    console.log("🔄 游戏已重置");
    return gameData;
}

/**
 * 深度合并两个对象（用于合并默认数据和存档数据）
 * @param {Object} target - 目标对象（默认数据）
 * @param {Object} source - 源对象（存档数据）
 * @returns {Object} 合并后的对象
 */
function deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                // 如果是对象，递归合并
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                // 其他类型直接覆盖
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

// ============================================================================
// 四、游戏核心计算函数
// ============================================================================

/**
 * 计算玩家总攻击力
 * @returns {number} 总攻击力
 */
function getPlayerTotalAttack() {
    if (!gameData) return 0;
    const p = gameData.player;
    // 基础攻击力 + 等级加成 + 装备加成 + 永久加成
    return p.baseAttack + (p.level - 1) * 2 + p.equipmentAttack + p.permanentAttack;
}

/**
 * 计算玩家最大生命值
 * @returns {number} 最大生命值
 */
function getPlayerMaxHp() {
    if (!gameData) return 0;
    const p = gameData.player;
    // 基础生命值 + 等级加成 + 装备加成 + 永久加成
    return p.baseMaxHp + (p.level - 1) * 15 + p.equipmentMaxHp + p.permanentMaxHp;
}

/**
 * 获取玩家当前境界名称
 * @returns {string} 境界名称
 */
function getPlayerRealm() {
    if (!gameData) return "凡人";
    const level = gameData.player.level;
    // 找到不超过当前等级的最高境界
    let realm = "凡人";
    for (const lvl in GAME_CONFIG.realms) {
        if (parseInt(lvl) <= level) {
            realm = GAME_CONFIG.realms[lvl];
        }
    }
    return realm;
}

/**
 * 获取升级到下一级所需的经验
 * @returns {number} 所需经验，如果已达最高级返回0
 */
function getExpToNextLevel() {
    if (!gameData) return 0;
    const level = gameData.player.level;
    const exp = gameData.player.exp;
    
    // 获取当前等级需要的总经验和下一级需要的总经验
    const currentLevelExp = GAME_CONFIG.levelExp[level] || 0;
    const nextLevel = level + 1;
    const nextLevelExp = GAME_CONFIG.levelExp[nextLevel];
    
    // 如果没有下一级（已达最高级）
    if (!nextLevelExp) return 0;
    
    // 计算还需要多少经验
    const needed = nextLevelExp - exp;
    return needed > 0 ? needed : 0;
}

/**
 * 获取当前等级进度百分比
 * @returns {number} 0-100的百分比
 */
function getLevelProgress() {
    if (!gameData) return 0;
    const level = gameData.player.level;
    const exp = gameData.player.exp;
    
    const currentLevelExp = GAME_CONFIG.levelExp[level] || 0;
    const nextLevel = level + 1;
    const nextLevelExp = GAME_CONFIG.levelExp[nextLevel];
    
    // 已达最高级
    if (!nextLevelExp) return 100;
    
    const totalExpNeeded = nextLevelExp - currentLevelExp;
    const currentProgress = exp - currentLevelExp;
    
    if (totalExpNeeded <= 0) return 0;
    
    return Math.min(100, (currentProgress / totalExpNeeded) * 100);
}

/**
 * 检查是否可以升级
 * @returns {boolean} 是否可以升级
 */
function canLevelUp() {
    if (!gameData) return false;
    const level = gameData.player.level;
    const exp = gameData.player.exp;
    
    const nextLevel = level + 1;
    const nextLevelExp = GAME_CONFIG.levelExp[nextLevel];
    
    return nextLevelExp !== undefined && exp >= nextLevelExp;
}

/**
 * 执行升级
 * @returns {Object} 升级结果 { success: boolean, newLevel: number, message: string }
 */
function performLevelUp() {
    if (!gameData || !canLevelUp()) {
        return { success: false, newLevel: gameData ? gameData.player.level : 1, message: "经验不足，无法升级" };
    }
    
    const oldLevel = gameData.player.level;
    gameData.player.level += 1;
    const newLevel = gameData.player.level;
    const newRealm = getPlayerRealm();
    
    // 升级时恢复部分生命值
    const maxHp = getPlayerMaxHp();
    gameData.player.currentHp = Math.min(maxHp, gameData.player.currentHp + Math.floor(maxHp * 0.3));
    
    saveGameData();
    
    return {
        success: true,
        oldLevel: oldLevel,
        newLevel: newLevel,
        newRealm: newRealm,
        message: `恭喜！等级提升至 ${newLevel} 级，境界：${newRealm}！`
    };
}

/**
 * 根据玩家等级获取适合的怪物列表
 * @returns {Array} 适合的怪物列表
 */
function getAvailableMonsters() {
    if (!gameData) return [];
    const level = gameData.player.level;
    
    return GAME_CONFIG.monsters.filter(monster => {
        return level >= monster.minLevel && level <= monster.maxLevel;
    });
}

/**
 * 随机选择一个适合当前等级的怪物
 * @returns {Object|null} 怪物对象或null
 */
function selectRandomMonster() {
    const availableMonsters = getAvailableMonsters();
    
    if (availableMonsters.length === 0) {
        // 如果没有适合的怪物，选择最高级的
        return GAME_CONFIG.monsters[GAME_CONFIG.monsters.length - 1];
    }
    
    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * availableMonsters.length);
    return JSON.parse(JSON.stringify(availableMonsters[randomIndex]));
}

/**
 * 开始新的战斗
 * @returns {Object} 战斗初始化结果
 */
function startBattle() {
    if (!gameData) return { success: false, message: "游戏数据未初始化" };
    
    // 选择怪物
    const monster = selectRandomMonster();
    if (!monster) {
        return { success: false, message: "没有可战斗的怪物" };
    }
    
    // 检查玩家生命值
    if (gameData.player.currentHp <= 0) {
        return { success: false, message: "生命值为0，请先恢复" };
    }
    
    // 初始化战斗状态
    gameData.battle.isFighting = true;
    gameData.battle.currentMonster = {
        ...monster,
        currentHp: monster.hp,  // 当前生命值
        maxHp: monster.hp       // 最大生命值
    };
    gameData.battle.battleLog = [];
    gameData.battle.lastBattleTime = Date.now();
    
    // 添加战斗开始日志
    addBattleLog(`⚔️ 遭遇了 ${monster.name}！`);
    addBattleLog(`📊 怪物属性：生命 ${monster.hp}，攻击 ${monster.attack}`);
    
    saveGameData();
    
    return {
        success: true,
        monster: gameData.battle.currentMonster,
        message: `开始与 ${monster.name} 战斗！`
    };
}

/**
 * 执行一次攻击回合
 * @returns {Object} 战斗结果
 */
function performBattleRound() {
    if (!gameData || !gameData.battle.isFighting || !gameData.battle.currentMonster) {
        return { 
            success: false, 
            battleEnded: true, 
            message: "没有进行中的战斗" 
        };
    }
    
    const player = gameData.player;
    const monster = gameData.battle.currentMonster;
    const battleConfig = GAME_CONFIG.battle;
    
    // 1. 玩家攻击怪物
    const playerAttack = getPlayerTotalAttack();
    let playerDamage = playerAttack;
    let isPlayerCritical = false;
    
    // 判断是否暴击
    if (Math.random() < battleConfig.criticalChance) {
        playerDamage = Math.floor(playerDamage * battleConfig.criticalMultiplier);
        isPlayerCritical = true;
    }
    
    // 造成伤害
    monster.currentHp -= playerDamage;
    
    if (isPlayerCritical) {
        addBattleLog(`💥 暴击！你对 ${monster.name} 造成了 ${playerDamage} 点伤害！`);
    } else {
        addBattleLog(`⚔️ 你对 ${monster.name} 造成了 ${playerDamage} 点伤害`);
    }
    
    // 检查怪物是否死亡
    if (monster.currentHp <= 0) {
        return endBattle(true);
    }
    
    // 2. 怪物攻击玩家
    let monsterDamage = monster.attack;
    let isMonsterCritical = false;
    
    // 怪物也有小概率暴击
    if (Math.random() < battleConfig.criticalChance * 0.5) {
        monsterDamage = Math.floor(monsterDamage * battleConfig.criticalMultiplier);
        isMonsterCritical = true;
    }
    
    player.currentHp -= monsterDamage;
    
    if (isMonsterCritical) {
        addBattleLog(`💥 ${monster.name} 暴击！对你造成了 ${monsterDamage} 点伤害！`);
    } else {
        addBattleLog(`👊 ${monster.name} 对你造成了 ${monsterDamage} 点伤害`);
    }
    
    // 检查玩家是否死亡
    if (player.currentHp <= 0) {
        player.currentHp = 0;  // 生命值不能为负
        return endBattle(false);
    }
    
    saveGameData();
    
    return {
        success: true,
        battleEnded: false,
        playerHp: player.currentHp,
        playerMaxHp: getPlayerMaxHp(),
        monsterHp: monster.currentHp,
        monsterMaxHp: monster.maxHp,
        playerDamage: playerDamage,
        monsterDamage: monsterDamage,
        isPlayerCritical: isPlayerCritical,
        isMonsterCritical: isMonsterCritical
    };
}

/**
 * 结束战斗
 * @param {boolean} playerWon - 玩家是否获胜
 * @returns {Object} 战斗结果
 */
function endBattle(playerWon) {
    if (!gameData) return { success: false };
    
    const monster = gameData.battle.currentMonster;
    
    gameData.battle.isFighting = false;
    
    if (playerWon) {
        // 玩家获胜，获得奖励
        const expReward = monster.exp;
        const goldReward = monster.gold;
        
        gameData.player.exp += expReward;
        gameData.player.gold += goldReward;
        gameData.player.monstersKilled += 1;
        gameData.player.totalExpEarned += expReward;
        gameData.player.totalGoldEarned += goldReward;
        gameData.player.battlesWon += 1;
        
        addBattleLog(`🎉 胜利！击败了 ${monster.name}！`);
        addBattleLog(`💰 获得经验：+${expReward}，金币：+${goldReward}`);
        
        // 检查是否可以升级
        if (canLevelUp()) {
            const levelUpResult = performLevelUp();
            addBattleLog(`🌟 ${levelUpResult.message}`);
        }
        
        saveGameData();
        
        return {
            success: true,
            battleEnded: true,
            playerWon: true,
            expReward: expReward,
            goldReward: goldReward,
            monster: monster
        };
    } else {
        // 玩家失败
        addBattleLog(`💀 战败！你被 ${monster.name} 击败了...`);
        addBattleLog(`💡 提示：使用灵石恢复生命值，或去商店强化装备`);
        
        saveGameData();
        
        return {
            success: true,
            battleEnded: true,
            playerWon: false,
            monster: monster
        };
    }
}

/**
 * 添加战斗日志
 * @param {string} message - 日志内容
 */
function addBattleLog(message) {
    if (!gameData) return;
    
    const timestamp = new Date().toLocaleTimeString();
    gameData.battle.battleLog.push(`[${timestamp}] ${message}`);
    
    // 限制日志数量，最多保留50条
    if (gameData.battle.battleLog.length > 50) {
        gameData.battle.battleLog = gameData.battle.battleLog.slice(-50);
    }
}

/**
 * 恢复生命值
 * @param {number} amount - 恢复的生命值数量，如果为0则恢复全部
 */
function healPlayer(amount = 0) {
    if (!gameData) return { success: false, message: "游戏数据未初始化" };
    
    const maxHp = getPlayerMaxHp();
    
    if (amount <= 0 || amount >= maxHp) {
        // 恢复全部
        const healed = maxHp - gameData.player.currentHp;
        gameData.player.currentHp = maxHp;
        saveGameData();
        return { success: true, healed: healed, message: `生命值已完全恢复！` };
    } else {
        // 恢复指定数量
        const actualHeal = Math.min(amount, maxHp - gameData.player.currentHp);
        gameData.player.currentHp += actualHeal;
        saveGameData();
        return { 
            success: true, 
            healed: actualHeal, 
            message: `恢复了 ${actualHeal} 点生命值` 
        };
    }
}

/**
 * 购买商店物品
 * @param {number} itemId - 物品ID
 * @returns {Object} 购买结果
 */
function buyShopItem(itemId) {
    if (!gameData) return { success: false, message: "游戏数据未初始化" };
    
    const item = GAME_CONFIG.shopItems.find(i => i.id === itemId);
    if (!item) {
        return { success: false, message: "物品不存在" };
    }
    
    // 检查金币是否足够
    if (gameData.player.gold < item.price) {
        return { success: false, message: `金币不足！需要 ${item.price} 金币` };
    }
    
    // 扣除金币
    gameData.player.gold -= item.price;
    
    // 根据物品类型处理
    switch (item.type) {
        case 'consumable':
            // 消耗品：添加到背包
            if (!gameData.player.inventory[itemId]) {
                gameData.player.inventory[itemId] = 0;
            }
            gameData.player.inventory[itemId] += 1;
            saveGameData();
            return { 
                success: true, 
                message: `购买成功！获得 ${item.name} x1` 
            };
            
        case 'equipment':
            // 装备：检查是否已拥有
            if (gameData.player.ownedEquipment.includes(itemId)) {
                // 退还金币
                gameData.player.gold += item.price;
                return { success: false, message: "你已经拥有这件装备了" };
            }
            
            // 添加到已拥有列表并应用效果
            gameData.player.ownedEquipment.push(itemId);
            
            if (item.effect.type === 'attack') {
                gameData.player.equipmentAttack += item.effect.value;
            } else if (item.effect.type === 'maxHp') {
                gameData.player.equipmentMaxHp += item.effect.value;
                // 增加最大生命值时，同时恢复等量生命值
                gameData.player.currentHp += item.effect.value;
            }
            
            saveGameData();
            return { 
                success: true, 
                message: `购买成功！装备了 ${item.name}，${item.description}` 
            };
            
        case 'permanent':
            // 永久属性：直接应用效果
            if (item.effect.type === 'attackPermanent') {
                gameData.player.permanentAttack += item.effect.value;
            } else if (item.effect.type === 'maxHpPermanent') {
                gameData.player.permanentMaxHp += item.effect.value;
                gameData.player.currentHp += item.effect.value;
            }
            
            saveGameData();
            return { 
                success: true, 
                message: `使用成功！${item.description}` 
            };
            
        default:
            gameData.player.gold += item.price;  // 退还
            return { success: false, message: "未知物品类型" };
    }
}

/**
 * 使用消耗品
 * @param {number} itemId - 物品ID
 * @returns {Object} 使用结果
 */
function useConsumable(itemId) {
    if (!gameData) return { success: false, message: "游戏数据未初始化" };
    
    // 检查背包中是否有该物品
    if (!gameData.player.inventory[itemId] || gameData.player.inventory[itemId] <= 0) {
        return { success: false, message: "背包中没有该物品" };
    }
    
    const item = GAME_CONFIG.shopItems.find(i => i.id === itemId);
    if (!item || item.type !== 'consumable') {
        return { success: false, message: "该物品不可使用" };
    }
    
    // 消耗物品
    gameData.player.inventory[itemId] -= 1;
    
    // 应用效果
    let result;
    if (item.effect.type === 'heal') {
        result = healPlayer(item.effect.value);
    } else if (item.effect.type === 'fullHeal') {
        result = healPlayer(0);
    } else {
        // 未知效果，退还物品
        gameData.player.inventory[itemId] += 1;
        return { success: false, message: "未知效果类型" };
    }
    
    saveGameData();
    return {
        ...result,
        itemName: item.name
    };
}

/**
 * 开始修炼
 * @param {number} efficiency - 修炼效率倍数 (1, 2, 5)
 * @returns {Object} 结果
 */
function startCultivation(efficiency = 1) {
    if (!gameData) return { success: false, message: "游戏数据未初始化" };
    
    const efficiencyConfig = GAME_CONFIG.cultivation.efficiency[efficiency];
    if (!efficiencyConfig) {
        return { success: false, message: "无效的修炼效率" };
    }
    
    gameData.cultivation.isCultivating = true;
    gameData.cultivation.efficiency = efficiency;
    gameData.cultivation.startTime = Date.now();
    
    saveGameData();
    
    return {
        success: true,
        message: `开始${efficiencyConfig.name}！效率：${efficiency}倍`
    };
}

/**
 * 停止修炼并结算收益
 * @returns {Object} 结算结果
 */
function stopCultivation() {
    if (!gameData || !gameData.cultivation.isCultivating) {
        return { success: false, message: "当前没有在修炼" };
    }
    
    // 计算修炼时长
    const now = Date.now();
    const durationMs = now - gameData.cultivation.startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    if (durationSeconds < 1) {
        gameData.cultivation.isCultivating = false;
        saveGameData();
        return { success: true, duration: 0, expGained: 0, goldGained: 0, message: "修炼时间太短，没有获得收益" };
    }
    
    // 计算收益
    const efficiency = gameData.cultivation.efficiency;
    const baseExp = GAME_CONFIG.cultivation.baseExpPerSecond;
    const baseGold = GAME_CONFIG.cultivation.baseGoldPerSecond;
    
    const expGained = Math.floor(durationSeconds * baseExp * efficiency);
    const goldGained = Math.floor(durationSeconds * baseGold * efficiency);
    
    // 应用收益
    gameData.player.exp += expGained;
    gameData.player.gold += goldGained;
    gameData.player.totalExpEarned += expGained;
    gameData.player.totalGoldEarned += goldGained;
    gameData.player.playTime += durationSeconds;
    
    // 结束修炼
    gameData.cultivation.isCultivating = false;
    
    // 检查升级
    let levelUpMessage = "";
    while (canLevelUp()) {
        const levelUpResult = performLevelUp();
        levelUpMessage += levelUpResult.message + " ";
    }
    
    saveGameData();
    
    return {
        success: true,
        duration: durationSeconds,
        expGained: expGained,
        goldGained: goldGained,
        efficiency: efficiency,
        levelUpMessage: levelUpMessage,
        message: `修炼结束！时长：${formatDuration(durationSeconds)}，获得经验：+${expGained}，金币：+${goldGained}`
    };
}

/**
 * 格式化时长为易读的字符串
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的字符串
 */
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}时${minutes}分${secs}秒`;
}

/**
 * 获取当前修炼的实时收益（不停止修炼）
 * @returns {Object} 当前收益信息
 */
function getCurrentCultivationProgress() {
    if (!gameData || !gameData.cultivation.isCultivating) {
        return null;
    }
    
    const now = Date.now();
    const durationMs = now - gameData.cultivation.startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    const efficiency = gameData.cultivation.efficiency;
    const baseExp = GAME_CONFIG.cultivation.baseExpPerSecond;
    const baseGold = GAME_CONFIG.cultivation.baseGoldPerSecond;
    
    return {
        duration: durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        efficiency: efficiency,
        efficiencyName: GAME_CONFIG.cultivation.efficiency[efficiency]?.name || "普通修炼",
        currentExp: Math.floor(durationSeconds * baseExp * efficiency),
        currentGold: Math.floor(durationSeconds * baseGold * efficiency),
        expPerSecond: baseExp * efficiency,
        goldPerSecond: baseGold * efficiency
    };
}

// ============================================================================
// 五、页面导航相关函数
// ============================================================================

/**
 * 导航栏配置
 */
const NAV_ITEMS = [
    { id: 'battle', name: '战斗', page: 'index.html', icon: '⚔️' },
    { id: 'character', name: '角色', page: 'character.html', icon: '👤' },
    { id: 'cultivation', name: '修炼', page: 'cultivation.html', icon: '🧘' },
    { id: 'shop', name: '商店', page: 'shop.html', icon: '🏪' }
];

/**
 * 生成导航栏 HTML
 * @param {string} activePageId - 当前活动页面的ID
 * @returns {string} HTML字符串
 */
function generateNavigation(activePageId) {
    let html = `
<nav class="nav-bar">
    <div class="nav-container">
        <div class="nav-logo">
            <span class="logo-icon">☯️</span>
            <span class="logo-text">${GAME_CONFIG.gameName}</span>
        </div>
        <ul class="nav-links">
`;
    
    for (const item of NAV_ITEMS) {
        const isActive = item.id === activePageId;
        const activeClass = isActive ? ' class="active"' : '';
        html += `            <li${activeClass}><a href="${item.page}">${item.icon} ${item.name}</a></li>\n`;
    }
    
    html += `
        </ul>
        <div class="nav-status">
            <span id="nav-gold">💰 ${gameData ? gameData.player.gold : 0}</span>
            <span id="nav-level">Lv.${gameData ? gameData.player.level : 1}</span>
        </div>
    </div>
</nav>
`;
    
    return html;
}

/**
 * 更新导航栏显示的状态
 */
function updateNavigationStatus() {
    if (!gameData) return;
    
    const goldElement = document.getElementById('nav-gold');
    const levelElement = document.getElementById('nav-level');
    
    if (goldElement) {
        goldElement.textContent = `💰 ${gameData.player.gold}`;
    }
    if (levelElement) {
        levelElement.textContent = `Lv.${gameData.player.level}`;
    }
}

// ============================================================================
// 六、页面加载时自动执行的初始化
// ============================================================================

// 页面加载时初始化游戏数据
window.addEventListener('DOMContentLoaded', function() {
    // 初始化数据
    initGameData();
    
    // 自动保存定时器（每30秒自动保存一次）
    setInterval(function() {
        if (gameData && gameData.settings.autoSaveEnabled) {
            saveGameData();
        }
    }, 30000);
    
    console.log(`🎮 ${GAME_CONFIG.gameName} 已初始化`);
});

// 页面关闭前保存
window.addEventListener('beforeunload', function() {
    if (gameData) {
        // 如果正在修炼，先结算
        if (gameData.cultivation.isCultivating) {
            stopCultivation();
        }
        saveGameData();
    }
});

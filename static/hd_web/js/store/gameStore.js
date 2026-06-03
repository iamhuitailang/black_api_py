(function() {
const { reactive, computed } = Vue;

const defaultGameState = {
    user: null,
    level: 1,
    exp: 0,
    gold: 100,
    chakra: 100,
    maxChakra: 100,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    skills: [],
    activeSkills: [],
    equipment: [],
    equipped: {
        weapon: null,
        armor: null,
        accessory: null
    },
    tools: [],
    levels: [],
    missions: [],
    recentBattles: []
};

const state = reactive({
    user: null,
    level: 1,
    exp: 0,
    gold: 100,
    chakra: 100,
    maxChakra: 100,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    skills: [],
    activeSkills: [],
    equipment: [],
    equipped: {
        weapon: null,
        armor: null,
        accessory: null
    },
    tools: [],
    levels: [],
    missions: [],
    recentBattles: []
});

const getters = {
    level: computed(() => state.level),
    exp: computed(() => state.exp),
    expToNextLevel: computed(() => state.level * 100),
    expProgress: computed(() => state.level > 0 ? (state.exp / (state.level * 100)) * 100 : 0),
    gold: computed(() => state.gold),
    coins: computed(() => state.gold),
    chakra: computed(() => state.chakra),
    maxChakra: computed(() => state.maxChakra),
    hp: computed(() => state.hp),
    maxHp: computed(() => state.maxHp),
    attack: computed(() => state.attack),
    defense: computed(() => state.defense),
    learnedSkillCount: computed(() => state.skills.length),
    totalSkillCount: computed(() => actions.getAllSkills().length),
    completedLevels: computed(() => state.levels.filter(l => l.completed).length),
    totalLevels: computed(() => actions.getAllLevels().length),
    dailyMissions: computed(() => {
        const missions = state.missions || [];
        return missions.filter(m => m.type === 'daily');
    }),
    completedDailyMissions: computed(() => {
        const dailyMissions = getters.dailyMissions.value;
        return dailyMissions.filter(m => m.status === 'completed' || m.claimed).length;
    }),
    recentBattles: computed(() => state.recentBattles || [])
};

const actions = {
    init() {
        const savedState = HdStorage.getGameState();
        if (savedState) {
            Object.assign(state, savedState);
        }
        const user = HdStorage.getUser();
        if (user) {
            state.user = user;
        }
    },

    save() {
        const stateToSave = { ...state };
        delete stateToSave.user;
        HdStorage.setGameState(stateToSave);
    },

    reset() {
        Object.assign(state, defaultGameState);
        HdStorage.removeGameState();
    },

    async loadAllData() {
        await Promise.all([
            this.loadUser(),
            this.loadUserSkills(),
            this.loadUserEquipment(),
            this.loadUserTools(),
            this.loadUserLevels(),
            this.loadUserMissions(),
            this.loadRecentBattles()
        ]);
        this.save();
    },

    async loadUser() {
        try {
            const result = await AuthService.getCurrentUserInfo();
            if (result.code === 0 && result.data) {
                state.user = result.data;
                if (result.data.level !== undefined) state.level = result.data.level;
                if (result.data.exp !== undefined) state.exp = result.data.exp;
                if (result.data.gold !== undefined) state.gold = result.data.gold;
                if (result.data.chakra !== undefined) state.chakra = result.data.chakra;
                if (result.data.hp !== undefined) state.hp = result.data.hp;
                if (result.data.attack !== undefined) state.attack = result.data.attack;
                if (result.data.defense !== undefined) state.defense = result.data.defense;
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    },

    async loadUserSkills() {
        try {
            const result = await ApiService.get('/user/skills');
            if (result.code === 0 && result.data) {
                state.skills = result.data.skills || [];
                state.activeSkills = result.data.activeSkills || [];
            }
        } catch (error) {
            console.error('加载用户技能失败:', error);
        }
    },

    async loadUserEquipment() {
        try {
            const result = await ApiService.get('/user/equipment');
            if (result.code === 0 && result.data) {
                state.equipment = result.data.equipment || [];
                state.equipped = result.data.equipped || { weapon: null, armor: null, accessory: null };
            }
        } catch (error) {
            console.error('加载用户装备失败:', error);
        }
    },

    async loadUserTools() {
        try {
            const result = await ApiService.get('/user/tools');
            if (result.code === 0 && result.data) {
                state.tools = result.data.tools || [];
            }
        } catch (error) {
            console.error('加载用户忍具失败:', error);
        }
    },

    async loadUserLevels() {
        try {
            const result = await ApiService.get('/user/levels');
            if (result.code === 0 && result.data) {
                state.levels = result.data.levels || [];
            }
        } catch (error) {
            console.error('加载用户关卡失败:', error);
        }
    },

    async loadUserMissions() {
        try {
            const result = await ApiService.get('/user/missions');
            if (result.code === 0 && result.data) {
                state.missions = result.data.missions || [];
            }
        } catch (error) {
            console.error('加载用户任务失败:', error);
        }
    },

    async loadRecentBattles() {
        try {
            const result = await ApiService.get('/user/battles/recent');
            if (result.code === 0 && result.data) {
                state.recentBattles = result.data.battles || [];
            }
        } catch (error) {
            console.error('加载最近对战失败:', error);
        }
    },

    getExp() {
        return state.exp;
    },

    addExp(amount) {
        state.exp += amount;
        const expNeeded = state.level * 100;
        if (state.exp >= expNeeded) {
            state.exp -= expNeeded;
            state.level++;
            Toast.success(`恭喜升级！当前等级：${state.level}`);
        }
        this.save();
    },

    getGold() {
        return state.gold;
    },

    addGold(amount) {
        state.gold += amount;
        this.save();
    },

    spendGold(amount) {
        if (state.gold >= amount) {
            state.gold -= amount;
            this.save();
            return true;
        }
        return false;
    },

    getLevel() {
        return state.level;
    },

    getAllSkills() {
        return [
            { id: 1, name: '豪火球之术', type: 'fire', icon: '🔥', level: 0, maxLevel: 5, damage: 50, chakra: 30, cooldown: 5, expCost: 100, description: '喷出巨大火球攻击敌人' },
            { id: 2, name: '火龙炎弹', type: 'fire', icon: '🐉', level: 0, maxLevel: 5, damage: 80, chakra: 50, cooldown: 8, expCost: 200, description: '召唤火龙进行范围攻击' },
            { id: 3, name: '水遁·水龙弹', type: 'water', icon: '💧', level: 0, maxLevel: 5, damage: 60, chakra: 35, cooldown: 6, expCost: 120, description: '召唤水龙冲击敌人' },
            { id: 4, name: '水遁·大瀑布之术', type: 'water', icon: '🌊', level: 0, maxLevel: 5, damage: 90, chakra: 60, cooldown: 10, expCost: 250, description: '召唤大瀑布冲击敌人' },
            { id: 5, name: '风遁·螺旋丸', type: 'wind', icon: '🌀', level: 0, maxLevel: 5, damage: 70, chakra: 40, cooldown: 7, expCost: 150, description: '压缩风属性查克拉形成旋转球体' },
            { id: 6, name: '风遁·大突破', type: 'wind', icon: '💨', level: 0, maxLevel: 5, damage: 55, chakra: 30, cooldown: 5, expCost: 110, description: '释放强风击退敌人' },
            { id: 7, name: '雷遁·千鸟', type: 'thunder', icon: '⚡', level: 0, maxLevel: 5, damage: 85, chakra: 55, cooldown: 8, expCost: 220, description: '释放千鸟贯穿敌人' },
            { id: 8, name: '雷遁·麒麟', type: 'thunder', icon: '🦄', level: 0, maxLevel: 5, damage: 120, chakra: 80, cooldown: 15, expCost: 400, description: '召唤雷电麒麟进行毁灭攻击' },
            { id: 9, name: '土遁·土流壁', type: 'earth', icon: '🪨', level: 0, maxLevel: 5, damage: 40, chakra: 25, cooldown: 4, expCost: 90, description: '召唤土墙防御并造成伤害' },
            { id: 10, name: '土遁·岩宿崩', type: 'earth', icon: '⛰️', level: 0, maxLevel: 5, damage: 100, chakra: 70, cooldown: 12, expCost: 300, description: '召唤巨大岩石崩塌攻击' },
            { id: 11, name: '影分身之术', type: 'body', icon: '👥', level: 0, maxLevel: 5, damage: 45, chakra: 35, cooldown: 6, expCost: 130, description: '创造分身协助战斗' },
            { id: 12, name: '八门遁甲', type: 'body', icon: '💪', level: 0, maxLevel: 5, damage: 150, chakra: 100, cooldown: 20, expCost: 500, description: '开启八门释放极限力量' },
            { id: 13, name: '写轮眼', type: 'illusion', icon: '👁️', level: 0, maxLevel: 5, damage: 65, chakra: 45, cooldown: 7, expCost: 180, description: '使用写轮眼施展幻术' },
            { id: 14, name: '月读', type: 'illusion', icon: '🌙', level: 0, maxLevel: 5, damage: 110, chakra: 75, cooldown: 14, expCost: 350, description: '将敌人拉入月读世界' }
        ];
    },

    getSkillTypes() {
        return [
            { code: 'fire', name: '火遁', icon: '🔥', color: '#ff6b6b' },
            { code: 'water', name: '水遁', icon: '💧', color: '#4ecdc4' },
            { code: 'wind', name: '风遁', icon: '🌀', color: '#a8e6cf' },
            { code: 'thunder', name: '雷遁', icon: '⚡', color: '#ffeaa7' },
            { code: 'earth', name: '土遁', icon: '🪨', color: '#dfe6e9' },
            { code: 'body', name: '体术', icon: '💪', color: '#fd79a8' },
            { code: 'illusion', name: '幻术', icon: '🌙', color: '#a29bfe' }
        ];
    },

    getLearnedSkills() {
        return state.skills;
    },

    learnSkill(skillId) {
        const skill = this.getAllSkills().find(s => s.id === skillId);
        if (!skill) return false;

        const learned = state.skills.find(s => s.id === skillId);
        if (learned) return false;

        if (state.exp < skill.expCost) {
            Toast.error('经验值不足！');
            return false;
        }

        state.exp -= skill.expCost;
        state.skills.push({ ...skill, level: 1 });
        this.save();
        Toast.success(`成功学习技能：${skill.name}`);
        return true;
    },

    upgradeSkill(skillId) {
        const learned = state.skills.find(s => s.id === skillId);
        if (!learned) return false;

        const skill = this.getAllSkills().find(s => s.id === skillId);
        if (learned.level >= skill.maxLevel) {
            Toast.error('技能已达最高等级！');
            return false;
        }

        const upgradeCost = skill.expCost * (learned.level + 1);
        if (state.exp < upgradeCost) {
            Toast.error('经验值不足！');
            return false;
        }

        state.exp -= upgradeCost;
        learned.level++;
        learned.damage = Math.floor(skill.damage * (1 + learned.level * 0.2));
        this.save();
        Toast.success(`${skill.name} 升级到 Lv.${learned.level}`);
        return true;
    },

    getActiveSkills() {
        return state.activeSkills;
    },

    toggleSkillActive(skillId) {
        const index = state.activeSkills.indexOf(skillId);
        if (index > -1) {
            state.activeSkills.splice(index, 1);
        } else {
            if (state.activeSkills.length >= 4) {
                Toast.error('最多只能激活4个技能！');
                return false;
            }
            state.activeSkills.push(skillId);
        }
        this.save();
        return true;
    },

    getAllEquipment() {
        return [
            { id: 1, name: '苦无', type: 'weapon', icon: '🗡️', attack: 10, defense: 0, hp: 0, chakra: 0, price: 200, description: '忍者基础武器' },
            { id: 2, name: '忍者刀', type: 'weapon', icon: '⚔️', attack: 25, defense: 0, hp: 0, chakra: 0, price: 500, description: '锋利的忍者专用刀' },
            { id: 3, name: '雷神剑', type: 'weapon', icon: '🌩️', attack: 50, defense: 0, hp: 0, chakra: 20, price: 1500, description: '蕴含雷电之力的神剑' },
            { id: 4, name: '火影披风', type: 'armor', icon: '🧥', attack: 0, defense: 15, hp: 50, chakra: 0, price: 600, description: '火影专属披风' },
            { id: 5, name: '忍者护甲', type: 'armor', icon: '🛡️', attack: 0, defense: 30, hp: 100, chakra: 0, price: 1000, description: '坚固的忍者护甲' },
            { id: 6, name: '须佐能乎铠甲', type: 'armor', icon: '👹', attack: 10, defense: 60, hp: 200, chakra: 30, price: 3000, description: '须佐能乎形态的铠甲' },
            { id: 7, name: '木叶护额', type: 'accessory', icon: '🎀', attack: 5, defense: 5, hp: 20, chakra: 10, price: 300, description: '木叶忍者的标志' },
            { id: 8, name: '宇智波团扇', type: 'accessory', icon: '🌂', attack: 20, defense: 20, hp: 50, chakra: 50, price: 2000, description: '宇智波一族的神器' },
            { id: 9, name: '九尾项链', type: 'accessory', icon: '📿', attack: 30, defense: 30, hp: 150, chakra: 100, price: 5000, description: '蕴含九尾力量的项链' }
        ];
    },

    getEquipmentTypes() {
        return [
            { code: 'weapon', name: '武器', icon: '⚔️' },
            { code: 'armor', name: '防具', icon: '🛡️' },
            { code: 'accessory', name: '饰品', icon: '💍' }
        ];
    },

    getMyEquipment() {
        return state.equipment;
    },

    buyEquipment(equipmentId) {
        const equipment = this.getAllEquipment().find(e => e.id === equipmentId);
        if (!equipment) return false;

        const owned = state.equipment.find(e => e.id === equipmentId);
        if (owned) {
            Toast.error('你已经拥有这件装备了！');
            return false;
        }

        if (!this.spendGold(equipment.price)) {
            Toast.error('金币不足！');
            return false;
        }

        state.equipment.push({ ...equipment, level: 1 });
        this.save();
        Toast.success(`成功购买：${equipment.name}`);
        return true;
    },

    upgradeEquipment(equipmentId) {
        const owned = state.equipment.find(e => e.id === equipmentId);
        if (!owned) return false;

        const maxLevel = 10;
        if (owned.level >= maxLevel) {
            Toast.error('装备已达最高等级！');
            return false;
        }

        const upgradeCost = owned.price * owned.level;
        if (!this.spendGold(upgradeCost)) {
            Toast.error('金币不足！');
            return false;
        }

        owned.level++;
        owned.attack = Math.floor(owned.attack * 1.15);
        owned.defense = Math.floor(owned.defense * 1.15);
        owned.hp = Math.floor(owned.hp * 1.15);
        owned.chakra = Math.floor(owned.chakra * 1.15);
        this.save();
        Toast.success(`${owned.name} 升级到 Lv.${owned.level}`);
        return true;
    },

    getEquipped() {
        return state.equipped;
    },

    equipItem(equipmentId) {
        const owned = state.equipment.find(e => e.id === equipmentId);
        if (!owned) return false;

        const equipment = this.getAllEquipment().find(e => e.id === equipmentId);
        state.equipped[equipment.type] = equipmentId;
        this.save();
        Toast.success(`已装备：${owned.name}`);
        return true;
    },

    unequipItem(type) {
        if (state.equipped[type]) {
            state.equipped[type] = null;
            this.save();
            Toast.success('已卸下装备');
            return true;
        }
        return false;
    },

    getAllTools() {
        return [
            { id: 1, name: '起爆符', type: 'attack', icon: '💣', damage: 80, heal: 0, duration: 0, price: 50, description: '爆炸造成范围伤害' },
            { id: 2, name: '手里剑', type: 'attack', icon: '✦', damage: 40, heal: 0, duration: 0, price: 20, description: '远程投掷武器' },
            { id: 3, name: '毒雾弹', type: 'attack', icon: '☠️', damage: 30, heal: 0, duration: 5, price: 80, description: '释放毒雾持续伤害' },
            { id: 4, name: '烟雾弹', type: 'support', icon: '💨', damage: 0, heal: 0, duration: 3, price: 30, description: '释放烟雾掩护撤离' },
            { id: 5, name: '闪光弹', type: 'support', icon: '💡', damage: 0, heal: 0, duration: 2, price: 40, description: '致盲敌人' },
            { id: 6, name: '兵粮丸', type: 'support', icon: '🍡', damage: 0, heal: 0, duration: 0, price: 60, description: '恢复50点查克拉' },
            { id: 7, name: '医疗包', type: 'heal', icon: '💊', damage: 0, heal: 100, duration: 0, price: 100, description: '恢复100点生命值' },
            { id: 8, name: '高级医疗包', type: 'heal', icon: '❤️‍🩹', damage: 0, heal: 300, duration: 0, price: 250, description: '恢复300点生命值' },
            { id: 9, name: '查克拉药剂', type: 'heal', icon: '🧪', damage: 0, heal: 0, duration: 0, price: 120, description: '恢复200点查克拉' },
            { id: 10, name: '陷阱符', type: 'trap', icon: '🕳️', damage: 60, heal: 0, duration: 0, price: 70, description: '布置陷阱造成伤害' },
            { id: 11, name: '束缚符', type: 'trap', icon: '🔗', damage: 20, heal: 0, duration: 4, price: 90, description: '束缚敌人4秒' },
            { id: 12, name: '引爆符', type: 'trap', icon: '🎆', damage: 120, heal: 0, duration: 0, price: 150, description: '强力爆炸陷阱' }
        ];
    },

    getToolTypes() {
        return [
            { code: 'attack', name: '攻击', icon: '⚔️' },
            { code: 'support', name: '辅助', icon: '🛠️' },
            { code: 'heal', name: '恢复', icon: '💚' },
            { code: 'trap', name: '陷阱', icon: '🪤' }
        ];
    },

    getMyTools() {
        return state.tools;
    },

    buyTools(toolId, quantity = 1) {
        const tool = this.getAllTools().find(t => t.id === toolId);
        if (!tool) return false;

        const totalCost = tool.price * quantity;
        if (!this.spendGold(totalCost)) {
            Toast.error('金币不足！');
            return false;
        }

        const owned = state.tools.find(t => t.id === toolId);
        if (owned) {
            owned.quantity += quantity;
        } else {
            state.tools.push({ ...tool, quantity });
        }

        this.save();
        Toast.success(`成功购买 ${quantity} 个 ${tool.name}`);
        return true;
    },

    useTool(toolId) {
        const owned = state.tools.find(t => t.id === toolId);
        if (!owned || owned.quantity <= 0) {
            Toast.error('忍具数量不足！');
            return false;
        }

        const tool = this.getAllTools().find(t => t.id === toolId);
        owned.quantity--;
        if (owned.quantity <= 0) {
            const index = state.tools.findIndex(t => t.id === toolId);
            state.tools.splice(index, 1);
        }

        this.save();
        Toast.success(`使用了 ${tool.name}`);
        return true;
    },

    getAllLevels() {
        return [
            { id: 1, name: '木叶森林跑酷', type: 1, difficulty: 1, unlockLevel: 1, reward: { exp: 50, gold: 100 }, stars: 0, description: '在木叶森林中奔跑，躲避障碍物', timeLimit: 60 },
            { id: 2, name: '屋顶追逐', type: 1, difficulty: 2, unlockLevel: 3, reward: { exp: 100, gold: 200 }, stars: 0, description: '在屋顶之间跳跃追逐', timeLimit: 90 },
            { id: 3, name: '死亡森林竞速', type: 1, difficulty: 3, unlockLevel: 5, reward: { exp: 200, gold: 400 }, stars: 0, description: '穿越危险的死亡森林', timeLimit: 120 },
            { id: 4, name: '对战训练师', type: 2, difficulty: 1, unlockLevel: 1, reward: { exp: 80, gold: 150 }, stars: 0, description: '与训练师进行基础对战', enemyLevel: 1 },
            { id: 5, name: '中忍考试', type: 2, difficulty: 2, unlockLevel: 4, reward: { exp: 150, gold: 300 }, stars: 0, description: '参加中忍考试对战', enemyLevel: 3 },
            { id: 6, name: '对战晓组织', type: 2, difficulty: 4, unlockLevel: 8, reward: { exp: 400, gold: 800 }, stars: 0, description: '与晓组织成员战斗', enemyLevel: 8 },
            { id: 7, name: '潜入木叶', type: 3, difficulty: 2, unlockLevel: 2, reward: { exp: 120, gold: 250 }, stars: 0, description: '潜入木叶村不被发现', detectionLimit: 3 },
            { id: 8, name: '潜入砂隐村', type: 3, difficulty: 3, unlockLevel: 6, reward: { exp: 250, gold: 500 }, stars: 0, description: '潜入砂隐村窃取情报', detectionLimit: 2 },
            { id: 9, name: '潜入音隐村', type: 3, difficulty: 4, unlockLevel: 10, reward: { exp: 500, gold: 1000 }, stars: 0, description: '潜入音隐村核心区域', detectionLimit: 1 },
            { id: 10, name: '暗杀叛忍', type: 4, difficulty: 2, unlockLevel: 3, reward: { exp: 150, gold: 300 }, stars: 0, description: '暗杀叛忍首领', targetHp: 200 },
            { id: 11, name: '暗杀武士', type: 4, difficulty: 3, unlockLevel: 7, reward: { exp: 300, gold: 600 }, stars: 0, description: '暗杀武士大将', targetHp: 500 },
            { id: 12, name: '暗杀影级', type: 4, difficulty: 5, unlockLevel: 12, reward: { exp: 800, gold: 2000 }, stars: 0, description: '暗杀影级忍者', targetHp: 1000 }
        ];
    },

    getLevelTypes() {
        return [
            { code: 1, name: '跑酷', icon: '🏃' },
            { code: 2, name: '战斗', icon: '⚔️' },
            { code: 3, name: '潜入', icon: '🥷' },
            { code: 4, name: '暗杀', icon: '🗡️' }
        ];
    },

    getLevelStars(levelId) {
        const levelData = state.levels.find(l => l.id === levelId);
        return levelData ? levelData.stars : 0;
    },

    setLevelStars(levelId, stars) {
        const existing = state.levels.find(l => l.id === levelId);
        if (existing) {
            if (stars > existing.stars) {
                existing.stars = stars;
            }
        } else {
            state.levels.push({ id: levelId, stars, completed: true });
        }
        this.save();
    },

    isLevelUnlocked(level) {
        return state.level >= level.unlockLevel;
    },

    completeLevel(levelId, stars) {
        const level = this.getAllLevels().find(l => l.id === levelId);
        if (!level) return false;

        const oldStars = this.getLevelStars(levelId);
        this.setLevelStars(levelId, stars);

        if (stars > oldStars) {
            this.addExp(level.reward.exp);
            this.addGold(level.reward.gold);
            Toast.success(`关卡完成！获得 ${level.reward.exp} 经验，${level.reward.gold} 金币`);
        }

        return true;
    },

    getAllMissions() {
        const daily = [
            { id: 1, name: '每日登录', type: 'daily', description: '登录游戏', progress: 0, target: 1, reward: { exp: 20, gold: 50 }, claimed: false },
            { id: 2, name: '完成3次关卡', type: 'daily', description: '完成任意3次关卡', progress: 0, target: 3, reward: { exp: 100, gold: 200 }, claimed: false },
            { id: 3, name: '使用10个忍具', type: 'daily', description: '使用10个忍具', progress: 0, target: 10, reward: { exp: 50, gold: 100 }, claimed: false },
            { id: 4, name: '升级技能', type: 'daily', description: '升级任意技能1次', progress: 0, target: 1, reward: { exp: 80, gold: 150 }, claimed: false }
        ];

        const main = [
            { id: 101, name: '成为下忍', type: 'main', description: '达到等级5', progress: 0, target: 5, reward: { exp: 500, gold: 1000 }, claimed: false },
            { id: 102, name: '学习5个技能', type: 'main', description: '学习5个不同的忍术', progress: 0, target: 5, reward: { exp: 300, gold: 800 }, claimed: false },
            { id: 103, name: '收集装备', type: 'main', description: '拥有5件装备', progress: 0, target: 5, reward: { exp: 400, gold: 1000 }, claimed: false },
            { id: 104, name: '通关10个关卡', type: 'main', description: '通关10个不同的关卡', progress: 0, target: 10, reward: { exp: 600, gold: 1500 }, claimed: false },
            { id: 105, name: '成为中忍', type: 'main', description: '达到等级10', progress: 0, target: 10, reward: { exp: 1000, gold: 2000 }, claimed: false }
        ];

        const achievement = [
            { id: 201, name: '初出茅庐', type: 'achievement', description: '完成第一个关卡', progress: 0, target: 1, reward: { exp: 100, gold: 200 }, claimed: false },
            { id: 202, name: '技能大师', type: 'achievement', description: '将一个技能升到满级', progress: 0, target: 1, reward: { exp: 500, gold: 1000 }, claimed: false },
            { id: 203, name: '装备收藏家', type: 'achievement', description: '拥有所有类型的装备', progress: 0, target: 3, reward: { exp: 300, gold: 600 }, claimed: false },
            { id: 204, name: '全关卡通关', type: 'achievement', description: '通关所有关卡', progress: 0, target: 12, reward: { exp: 2000, gold: 5000 }, claimed: false },
            { id: 205, name: '忍者之王', type: 'achievement', description: '达到等级20', progress: 0, target: 20, reward: { exp: 5000, gold: 10000 }, claimed: false }
        ];

        return [...daily, ...main, ...achievement];
    },

    getMissionTypes() {
        return [
            { code: 'daily', name: '日常', icon: '📅' },
            { code: 'main', name: '主线', icon: '📜' },
            { code: 'achievement', name: '成就', icon: '🏆' }
        ];
    },

    getMissions() {
        const saved = state.missions || [];
        const all = this.getAllMissions();

        return all.map(mission => {
            const savedMission = saved.find(m => m.id === mission.id);
            if (savedMission) {
                return { ...mission, ...savedMission };
            }
            return mission;
        });
    },

    updateMissionProgress(missionId, progress) {
        const missions = this.getMissions();
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return;

        if (mission.progress < mission.target) {
            mission.progress = Math.min(mission.progress + progress, mission.target);
            this.saveMissions(missions);
        }
    },

    saveMissions(missions) {
        state.missions = missions.map(m => ({
            id: m.id,
            progress: m.progress,
            claimed: m.claimed,
            lastRefresh: m.lastRefresh
        }));
        this.save();
    },

    claimReward(missionId) {
        const missions = this.getMissions();
        const mission = missions.find(m => m.id === missionId);
        if (!mission || mission.claimed) return false;
        if (mission.progress < mission.target) {
            Toast.error('任务未完成！');
            return false;
        }

        mission.claimed = true;
        this.addExp(mission.reward.exp);
        this.addGold(mission.reward.gold);
        this.saveMissions(missions);
        Toast.success(`领取奖励：${mission.reward.exp} 经验，${mission.reward.gold} 金币`);
        return true;
    },

    refreshDailyMissions() {
        const missions = this.getMissions();
        const today = new Date().toDateString();

        missions.forEach(mission => {
            if (mission.type === 'daily') {
                const lastRefresh = mission.lastRefresh;
                if (lastRefresh !== today) {
                    mission.progress = 0;
                    mission.claimed = false;
                    mission.lastRefresh = today;
                }
            }
        });

        this.saveMissions(missions);
        Toast.success('每日任务已刷新！');
    }
};

const GameStore = {
    state,
    getters,
    actions,
    ...actions
};

window.GameStore = GameStore;
})();

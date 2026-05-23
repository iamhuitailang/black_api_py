const GameState = {
    state: null,

    defaultState: {
        player: {
            name: '驯兽师',
            level: 1,
            exp: 0,
            expToNext: 100,
            coins: 500,
            team: [],
            collection: [],
            items: {
                poke_ball: 10,
                great_ball: 0,
                ultra_ball: 0,
                master_ball: 0,
                potion: 5,
                super_potion: 0,
                hyper_potion: 0,
                max_potion: 0,
                elixir: 0,
                rare_candy: 0
            }
        },
        progress: {
            currentArea: 'meadow',
            currentStage: 0,
            areas: {
                meadow: { unlocked: true, completed: false, currentStage: 0 },
                forest: { unlocked: false, completed: false, currentStage: 0 },
                lake: { unlocked: false, completed: false, currentStage: 0 },
                volcano: { unlocked: false, completed: false, currentStage: 0 },
                thunder_peak: { unlocked: false, completed: false, currentStage: 0 },
                legendary_island: { unlocked: false, completed: false, currentStage: 0 }
            }
        },
        battle: {
            active: false,
            type: null,
            wildMonster: null,
            enemies: [],
            currentTurn: 0,
            turnOrder: [],
            battleLog: [],
            selectedSkill: null,
            isPlayerTurn: true,
            animationPhase: null
        },
        ui: {
            currentScreen: 'menu',
            selectedMonster: null,
            selectedItem: null,
            notification: null,
            popup: null
        },
        settings: {
            soundEnabled: true,
            musicEnabled: true,
            autoSave: true
        }
    },

    init() {
        const savedState = Storage.loadGameState();
        if (savedState) {
            this.state = savedState;
            this.validateState();
        } else {
            this.reset();
        }
        return this.state;
    },

    reset() {
        this.state = JSON.parse(JSON.stringify(this.defaultState));
        this.addStarterMonster();
        this.save();
    },

    validateState() {
        if (!this.state.player) this.state.player = this.defaultState.player;
        if (!this.state.progress) this.state.progress = this.defaultState.progress;
        if (!this.state.battle) this.state.battle = this.defaultState.battle;
        if (!this.state.ui) this.state.ui = this.defaultState.ui;
        if (!this.state.settings) this.state.settings = this.defaultState.settings;
        
        if (!this.state.player.items) this.state.player.items = this.defaultState.player.items;
        if (!this.state.progress.areas) this.state.progress.areas = this.defaultState.progress.areas;
    },

    save() {
        if (this.state.settings.autoSave) {
            Storage.saveGameState(this.state);
        }
    },

    addStarterMonster() {
        const starters = ['fire_fox', 'grass_bunny', 'water_turtle', 'thunder_mouse'];
        const starterId = starters[Math.floor(Math.random() * starters.length)];
        const monster = MonsterData.createMonsterInstance(starterId, 5);
        
        this.state.player.team.push(monster.instanceId);
        this.state.player.collection.push(monster);
    },

    getTeamMonsters() {
        return this.state.player.team.map(id => 
            this.state.player.collection.find(m => m.instanceId === id)
        ).filter(Boolean);
    },

    getAliveTeamMonsters() {
        return this.getTeamMonsters().filter(m => m.currentHp > 0);
    },

    addMonsterToCollection(monster) {
        this.state.player.collection.push(monster);
        this.save();
    },

    addMonsterToTeam(monster) {
        if (this.state.player.team.length >= 6) {
            this.showNotification('队伍已满!');
            return false;
        }
        if (!this.state.player.collection.find(m => m.instanceId === monster.instanceId)) {
            this.state.player.collection.push(monster);
        }
        if (!this.state.player.team.includes(monster.instanceId)) {
            this.state.player.team.push(monster.instanceId);
        }
        this.save();
        return true;
    },

    removeMonsterFromTeam(monster) {
        const index = this.state.player.team.indexOf(monster.instanceId);
        if (index > -1) {
            this.state.player.team.splice(index, 1);
            this.save();
        }
    },

    useItem(itemId, target = null) {
        if (!this.state.player.items[itemId] || this.state.player.items[itemId] <= 0) {
            this.showNotification('道具不足!');
            return false;
        }

        const item = LevelData.getItemById(itemId);
        if (!item) return false;

        if (item.type === 'ball') {
            return item;
        }

        if (item.type === 'heal' && target) {
            const healAmount = Math.min(item.healAmount, target.maxHp - target.currentHp);
            target.currentHp += healAmount;
            this.state.player.items[itemId]--;
            this.showNotification(`${target.name} 恢复了 ${healAmount} 点生命!`);
            this.save();
            return true;
        }

        if (item.type === 'full_heal') {
            this.getTeamMonsters().forEach(m => {
                m.currentHp = m.maxHp;
                m.statusEffects = [];
            });
            this.state.player.items[itemId]--;
            this.showNotification('所有异兽已完全恢复!');
            this.save();
            return true;
        }

        if (item.type === 'level_up' && target) {
            target.level++;
            const template = MonsterData.getMonsterById(target.monsterId);
            const rarity = MonsterData.rarities[target.rarity.toUpperCase()];
            const multiplier = rarity.multiplier;
            
            target.maxHp = Math.floor(template.baseStats.hp * multiplier * (1 + (target.level - 1) * 0.1));
            target.currentHp = target.maxHp;
            target.atk = Math.floor(template.baseStats.atk * multiplier * (1 + (target.level - 1) * 0.08));
            target.def = Math.floor(template.baseStats.def * multiplier * (1 + (target.level - 1) * 0.06));
            target.spd = Math.floor(template.baseStats.spd * multiplier * (1 + (target.level - 1) * 0.05));
            
            this.state.player.items[itemId]--;
            this.showNotification(`${target.name} 升到了 Lv.${target.level}!`);
            this.save();
            return true;
        }

        return false;
    },

    addItem(itemId, count = 1) {
        if (!this.state.player.items[itemId]) {
            this.state.player.items[itemId] = 0;
        }
        this.state.player.items[itemId] += count;
        this.save();
    },

    addCoins(amount) {
        this.state.player.coins += amount;
        this.save();
    },

    spendCoins(amount) {
        if (this.state.player.coins >= amount) {
            this.state.player.coins -= amount;
            this.save();
            return true;
        }
        this.showNotification('金币不足!');
        return false;
    },

    addExp(amount) {
        this.state.player.exp += amount;
        while (this.state.player.exp >= this.state.player.expToNext) {
            this.state.player.exp -= this.state.player.expToNext;
            this.state.player.level++;
            this.state.player.expToNext = this.state.player.level * 100;
            this.showNotification(`恭喜! 你升到了 Lv.${this.state.player.level}!`);
        }
        this.save();
    },

    completeStage(areaId, stageIndex) {
        const area = this.state.progress.areas[areaId];
        if (area) {
            area.currentStage = Math.max(area.currentStage, stageIndex + 1);
            this.save();
        }
    },

    completeArea(areaId) {
        const area = this.state.progress.areas[areaId];
        if (area) {
            area.completed = true;
            const areaIndex = LevelData.areas.findIndex(a => a.id === areaId);
            if (areaIndex < LevelData.areas.length - 1) {
                const nextArea = LevelData.areas[areaIndex + 1];
                this.state.progress.areas[nextArea.id].unlocked = true;
                this.showNotification(`新区域解锁: ${nextArea.name}!`);
            }
            this.save();
        }
    },

    setCurrentScreen(screen) {
        this.state.ui.currentScreen = screen;
        this.save();
    },

    showNotification(message) {
        this.state.ui.notification = {
            message,
            timestamp: Date.now()
        };
    },

    clearNotification() {
        if (this.state.ui.notification && Date.now() - this.state.ui.notification.timestamp > 3000) {
            this.state.ui.notification = null;
        }
    },

    setBattleState(battleState) {
        Object.assign(this.state.battle, battleState);
        this.save();
    },

    resetBattleState() {
        this.state.battle = {
            active: false,
            type: null,
            wildMonster: null,
            enemies: [],
            playerMonsters: [],
            currentMonsterIndex: 0,
            currentEnemyIndex: 0,
            currentTurn: 0,
            turnOrder: [],
            battleLog: [],
            selectedSkill: null,
            isPlayerTurn: true,
            phase: null,
            canCatch: false,
            canFlee: false,
            animationPhase: null
        };
        this.save();
    },

    getMonsterInCollection(instanceId) {
        return this.state.player.collection.find(m => m.instanceId === instanceId);
    }
};

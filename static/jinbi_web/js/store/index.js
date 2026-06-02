const { reactive } = Vue;

const GameStore = {
    state: null,
    watcher: null,
    saveTimeout: null,

    init() {
        const savedState = Storage.getGameState();
        const user = AuthService.getCurrentUser();
        
        const defaultState = {
            user: user,
            coins: 100,
            totalCoins: 0,
            pushedCoins: 0,
            level: 1,
            exp: 0,
            expToNextLevel: 100,
            currentScene: 'forest',
            items: {
                'double_coin': 5,
                'big_push': 3,
                'magnet': 2,
                'shield': 1
            },
            activeEffects: [],
            fallingRewards: [],
            platformCoins: [],
            statistics: {
                totalPushes: 0,
                totalRewards: 0,
                maxCombo: 0,
                currentCombo: 0,
                playTime: 0
            },
            achievements: this.loadAchievements(),
            leaderboard: this.getMockLeaderboard()
        };

        let finalState;
        if (savedState && Object.keys(savedState).length > 0) {
            finalState = {
                ...defaultState,
                ...savedState,
                user: user,
                achievements: savedState.achievements || this.loadAchievements(),
                leaderboard: savedState.leaderboard || this.getMockLeaderboard()
            };
            if (finalState.fallingRewards) {
                finalState.fallingRewards = [];
            }
            if (finalState.activeEffects) {
                finalState.activeEffects = [];
            }
        } else {
            finalState = defaultState;
        }

        this.state = reactive(finalState);
        
        if ((!savedState || Object.keys(savedState).length === 0) && user) {
            this.saveState();
        }

        this.startAutoSave();
        this.setupPageUnloadSave();

        return this.state;
    },

    startAutoSave() {
        if (this.saveTimeout) {
            clearInterval(this.saveTimeout);
        }
        this.saveTimeout = setInterval(() => {
            this.saveState();
            this.saveAchievements();
        }, 1000);
    },

    setupPageUnloadSave() {
        if (this.unloadHandler) {
            window.removeEventListener('beforeunload', this.unloadHandler);
        }
        this.unloadHandler = () => {
            this.saveState();
            this.saveAchievements();
        };
        window.addEventListener('beforeunload', this.unloadHandler);
    },

    saveState() {
        if (this.state) {
            const stateToSave = {
                coins: this.state.coins,
                totalCoins: this.state.totalCoins,
                pushedCoins: this.state.pushedCoins,
                level: this.state.level,
                exp: this.state.exp,
                expToNextLevel: this.state.expToNextLevel,
                currentScene: this.state.currentScene,
                items: { ...this.state.items },
                platformCoins: JSON.parse(JSON.stringify(this.state.platformCoins)),
                statistics: { ...this.state.statistics },
                achievements: JSON.parse(JSON.stringify(this.state.achievements)),
                leaderboard: JSON.parse(JSON.stringify(this.state.leaderboard))
            };
            Storage.setGameState(stateToSave);
        }
    },

    loadAchievements() {
        const saved = Storage.getAchievements();
        if (saved) return saved;
        
        return [
            { id: 'first_push', name: '初次尝试', desc: '完成第一次推金币', icon: '🎯', unlocked: false, progress: 0, target: 1 },
            { id: 'push_100', name: '推币新手', desc: '累计推送100次', icon: '💪', unlocked: false, progress: 0, target: 100 },
            { id: 'push_1000', name: '推币达人', desc: '累计推送1000次', icon: '🏆', unlocked: false, progress: 0, target: 1000 },
            { id: 'coins_1000', name: '小富翁', desc: '累计获得1000金币', icon: '💰', unlocked: false, progress: 0, target: 1000 },
            { id: 'coins_10000', name: '大富翁', desc: '累计获得10000金币', icon: '💎', unlocked: false, progress: 0, target: 10000 },
            { id: 'combo_5', name: '连击新手', desc: '达成5连击', icon: '⚡', unlocked: false, progress: 0, target: 5 },
            { id: 'combo_10', name: '连击达人', desc: '达成10连击', icon: '🔥', unlocked: false, progress: 0, target: 10 },
            { id: 'level_5', name: '成长之路', desc: '达到5级', icon: '⭐', unlocked: false, progress: 0, target: 5 },
            { id: 'level_10', name: '高级玩家', desc: '达到10级', icon: '🌟', unlocked: false, progress: 0, target: 10 },
            { id: 'reward_50', name: '奖励猎人', desc: '累计收集50个奖励', icon: '🎁', unlocked: false, progress: 0, target: 50 }
        ];
    },

    saveAchievements() {
        if (this.state && this.state.achievements) {
            Storage.setAchievements(JSON.parse(JSON.stringify(this.state.achievements)));
        }
    },

    getMockLeaderboard() {
        return [
            { rank: 1, nickname: '金币王者', avatar: '👑', coins: 99999, level: 20 },
            { rank: 2, nickname: '推币大师', avatar: '🥇', coins: 88888, level: 18 },
            { rank: 3, nickname: '幸运玩家', avatar: '🥈', coins: 66666, level: 15 },
            { rank: 4, nickname: '金币猎人', avatar: '🥉', coins: 55555, level: 14 },
            { rank: 5, nickname: '快乐推币', avatar: '😊', coins: 44444, level: 12 },
            { rank: 6, nickname: '新手玩家', avatar: '🎮', coins: 33333, level: 10 },
            { rank: 7, nickname: '休闲达人', avatar: '☕', coins: 22222, level: 8 },
            { rank: 8, nickname: '佛系玩家', avatar: '🧘', coins: 11111, level: 6 },
            { rank: 9, nickname: '萌新小白', avatar: '🐣', coins: 5555, level: 4 },
            { rank: 10, nickname: '路人甲', avatar: '👤', coins: 2222, level: 2 }
        ];
    },

    updateLeaderboard() {
        const user = this.state.user;
        if (!user) return;

        const existingIndex = this.state.leaderboard.findIndex(item => item.nickname === user.nickname);
        
        const userEntry = {
            rank: 0,
            nickname: user.nickname,
            avatar: user.avatar || '😊',
            coins: this.state.totalCoins,
            level: this.state.level
        };

        if (existingIndex >= 0) {
            this.state.leaderboard[existingIndex] = userEntry;
        } else {
            this.state.leaderboard.push(userEntry);
        }

        this.state.leaderboard.sort((a, b) => b.coins - a.coins);
        this.state.leaderboard.forEach((item, index) => {
            item.rank = index + 1;
        });
    },

    pushCoin() {
        if (this.state.coins <= 0) {
            Toast.warning('金币不足！');
            return false;
        }

        this.state.coins--;
        this.state.pushedCoins++;
        this.state.statistics.totalPushes++;
        this.state.statistics.currentCombo++;
        
        if (this.state.statistics.currentCombo > this.state.statistics.maxCombo) {
            this.state.statistics.maxCombo = this.state.statistics.currentCombo;
        }

        this.addExp(1);
        this.checkAchievement('first_push', 1);
        this.checkAchievement('push_100', this.state.statistics.totalPushes);
        this.checkAchievement('push_1000', this.state.statistics.totalPushes);
        this.checkAchievement('combo_5', this.state.statistics.currentCombo);
        this.checkAchievement('combo_10', this.state.statistics.currentCombo);

        this.saveState();

        return true;
    },

    addCoins(amount) {
        let finalAmount = amount;
        
        const doubleEffect = this.state.activeEffects.find(e => e.type === 'double_coin' && e.duration > 0);
        if (doubleEffect) {
            finalAmount *= 2;
        }

        this.state.coins += finalAmount;
        this.state.totalCoins += finalAmount;

        this.checkAchievement('coins_1000', this.state.totalCoins);
        this.checkAchievement('coins_10000', this.state.totalCoins);

        this.updateLeaderboard();
        
        return finalAmount;
    },

    addExp(amount) {
        this.state.exp += amount;
        while (this.state.exp >= this.state.expToNextLevel) {
            this.state.exp -= this.state.expToNextLevel;
            this.state.level++;
            this.state.expToNextLevel = Math.floor(this.state.expToNextLevel * 1.5);
            this.state.coins += 3;
            Toast.success(`🎉 升级到 ${this.state.level} 级！获得 3 金币奖励！`);
            this.checkAchievement('level_5', this.state.level);
            this.checkAchievement('level_10', this.state.level);
        }
    },

    useItem(itemId) {
        if (!this.state.items[itemId] || this.state.items[itemId] <= 0) {
            Toast.warning('道具数量不足！');
            return false;
        }

        this.state.items[itemId]--;

        switch (itemId) {
            case 'double_coin':
                this.addEffect('double_coin', '双倍金币', 30, '✨');
                Toast.success('双倍金币效果已激活！');
                break;
            case 'big_push':
                this.bigPush();
                break;
            case 'magnet':
                this.addEffect('magnet', '磁铁吸引', 15, '🧲');
                Toast.success('磁铁效果已激活！自动收集奖励！');
                break;
            case 'shield':
                this.addEffect('shield', '护盾保护', 60, '🛡️');
                Toast.success('护盾效果已激活！');
                break;
        }

        this.saveState();
        return true;
    },

    addEffect(type, name, duration, icon) {
        const existing = this.state.activeEffects.find(e => e.type === type);
        if (existing) {
            existing.duration += duration;
        } else {
            this.state.activeEffects.push({ type, name, duration, icon, startTime: Date.now() });
        }
    },

    updateEffects(deltaTime) {
        this.state.activeEffects = this.state.activeEffects.filter(effect => {
            effect.duration -= deltaTime;
            return effect.duration > 0;
        });
    },

    bigPush() {
        const pushed = Math.min(10, this.state.coins);
        if (pushed <= 0) {
            Toast.warning('金币不足！');
            this.state.items['big_push']++;
            return;
        }

        this.state.coins -= pushed;
        this.state.pushedCoins += pushed;
        this.state.statistics.totalPushes += pushed;
        
        for (let i = 0; i < pushed; i++) {
            setTimeout(() => {
                if (this.state && this.state.fallingRewards.length < 20) {
                    const reward = this.generateReward();
                    if (reward) {
                        this.state.fallingRewards.push(reward);
                    }
                }
            }, i * 100);
        }
        
        for (let i = 0; i < pushed; i++) {
            setTimeout(() => {
                if (this.state) {
                    const newCoin = {
                        id: Date.now() + Math.random() + i,
                        x: 50 + (Math.random() - 0.5) * 20,
                        y: 25 + Math.random() * 10,
                        rotation: Math.random() * 360
                    };
                    this.addPlatformCoin(newCoin);
                }
            }, i * 50);
        }

        Toast.success(`🚀 大力推送！一次推送 ${pushed} 枚金币！`);
        this.saveState();
    },

    generateReward() {
        const hasMagnet = this.state.activeEffects.some(e => e.type === 'magnet' && e.duration > 0);
        const rand = Math.random();
        
        let reward = null;

        if (rand < 0.15) {
            reward = { id: Date.now() + Math.random(), type: 'coin', value: 1, icon: '💰', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.22) {
            reward = { id: Date.now() + Math.random(), type: 'coin', value: 1, icon: '🪙', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.25) {
            reward = { id: Date.now() + Math.random(), type: 'gem', value: 2, icon: '💎', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.26) {
            reward = { id: Date.now() + Math.random(), type: 'gem', value: 3, icon: '💎', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.27) {
            reward = { id: Date.now() + Math.random(), type: 'item_double', value: 1, icon: '✨', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.28) {
            reward = { id: Date.now() + Math.random(), type: 'item_push', value: 1, icon: '🚀', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.285) {
            reward = { id: Date.now() + Math.random(), type: 'item_magnet', value: 1, icon: '🧲', collected: false, autoCollect: hasMagnet };
        } else if (rand < 0.29) {
            reward = { id: Date.now() + Math.random(), type: 'item_shield', value: 1, icon: '🛡️', collected: false, autoCollect: hasMagnet };
        }

        return reward;
    },

    collectReward(rewardId) {
        const index = this.state.fallingRewards.findIndex(r => r.id === rewardId);
        if (index === -1) return;

        const reward = this.state.fallingRewards[index];
        if (reward.collected) return;

        reward.collected = true;
        this.state.statistics.totalRewards++;
        this.checkAchievement('reward_50', this.state.statistics.totalRewards);

        switch (reward.type) {
            case 'coin':
            case 'gem':
                const added = this.addCoins(reward.value);
                Toast.success(`+${added} 金币！`);
                break;
            case 'item_double':
                this.state.items['double_coin']++;
                Toast.success('获得 双倍金币 道具 x1！');
                break;
            case 'item_push':
                this.state.items['big_push']++;
                Toast.success('获得 大力推送 道具 x1！');
                break;
            case 'item_magnet':
                this.state.items['magnet']++;
                Toast.success('获得 磁铁 道具 x1！');
                break;
            case 'item_shield':
                this.state.items['shield']++;
                Toast.success('获得 护盾 道具 x1！');
                break;
        }

        this.saveState();

        setTimeout(() => {
            this.state.fallingRewards = this.state.fallingRewards.filter(r => r.id !== rewardId);
        }, 300);
    },

    collectAllRewards() {
        const rewardsToCollect = this.state.fallingRewards.filter(r => !r.collected);
        rewardsToCollect.forEach(r => this.collectReward(r.id));
    },

    checkAchievement(id, progress) {
        const achievement = this.state.achievements.find(a => a.id === id);
        if (!achievement || achievement.unlocked) return;

        achievement.progress = Math.min(progress, achievement.target);
        
        if (achievement.progress >= achievement.target) {
            achievement.unlocked = true;
            Toast.success(`🏆 成就解锁：${achievement.name}！`, 3000);
            this.state.coins += 5;
            this.saveAchievements();
        }
    },

    changeScene(sceneId) {
        this.state.currentScene = sceneId;
        Toast.success(`已切换到 ${this.getSceneName(sceneId)}`);
        this.saveState();
    },

    getSceneName(sceneId) {
        const scenes = {
            forest: '神秘森林',
            ocean: '深海世界',
            volcano: '火山地带',
            castle: '古老城堡',
            space: '太空漫游'
        };
        return scenes[sceneId] || '未知场景';
    },

    getSceneConfig(sceneId) {
        const scenes = {
            forest: { name: '神秘森林', bgClass: 'scene-forest', coinColor: '#4CAF50', unlockLevel: 1 },
            ocean: { name: '深海世界', bgClass: 'scene-ocean', coinColor: '#2196F3', unlockLevel: 3 },
            volcano: { name: '火山地带', bgClass: 'scene-volcano', coinColor: '#FF5722', unlockLevel: 5 },
            castle: { name: '古老城堡', bgClass: 'scene-castle', coinColor: '#9C27B0', unlockLevel: 8 },
            space: { name: '太空漫游', bgClass: 'scene-space', coinColor: '#FFC107', unlockLevel: 10 }
        };
        return scenes[sceneId] || scenes.forest;
    },

    resetCombo() {
        this.state.statistics.currentCombo = 0;
    },

    claimFreeCoins() {
        if (this.state.coins > 0) {
            Toast.warning('金币大于0时无法领取补给！');
            return false;
        }
        this.state.coins = 20;
        this.saveState();
        Toast.success('🎁 领取补给！获得 20 金币！');
        return true;
    },

    canClaimFreeCoins() {
        return this.state.coins <= 0;
    },

    clearGameState() {
        Storage.removeGameState();
        Storage.removeAchievements();
        this.init();
    },

    ensureState() {
        if (!this.state) {
            this.init();
        }
        return this.state;
    },

    initPlatformCoins() {
        if (!this.state.platformCoins || this.state.platformCoins.length === 0) {
            this.state.platformCoins = [];
            for (let i = 0; i < 15; i++) {
                this.state.platformCoins.push({
                    id: i,
                    x: Math.random() * 60 + 20,
                    y: Math.random() * 40 + 30,
                    rotation: Math.random() * 360
                });
            }
        }
        return this.state.platformCoins;
    },

    updatePlatformCoins(coins) {
        this.state.platformCoins = coins;
        this.saveState();
    },

    addPlatformCoin(coin) {
        this.state.platformCoins.push(coin);
        if (this.state.platformCoins.length > 30) {
            this.state.platformCoins.shift();
        }
        this.saveState();
    }
};

window.GameStore = GameStore;

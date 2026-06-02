const GamePage = {
    template: `
        <div class="game-page" :class="sceneConfig.bgClass">
            <nav class="game-nav">
                <div class="nav-left">
                    <span class="user-avatar">{{ gameState.user?.avatar || '😊' }}</span>
                    <span class="user-name">{{ gameState.user?.nickname || '玩家' }}</span>
                </div>
                <div class="nav-center">
                    <div class="level-info">
                        <span class="level-badge">Lv.{{ gameState.level }}</span>
                        <div class="exp-bar">
                            <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
                        </div>
                    </div>
                </div>
                <div class="nav-right">
                    <span class="coin-display">💰 {{ gameState.coins }}</span>
                </div>
            </nav>

            <div class="effects-bar">
                <div 
                    v-for="effect in gameState.activeEffects" 
                    :key="effect.type" 
                    class="effect-item"
                >
                    <span class="effect-icon">{{ effect.icon }}</span>
                    <span class="effect-name">{{ effect.name }}</span>
                    <span class="effect-time">{{ Math.ceil(effect.duration) }}s</span>
                </div>
            </div>

            <div class="game-stats">
                <div class="stat-item">
                    <span class="stat-label">总推送</span>
                    <span class="stat-value">{{ gameState.statistics.totalPushes }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">连击</span>
                    <span class="stat-value combo" :class="{ 'combo-high': gameState.statistics.currentCombo >= 5 }">
                        {{ gameState.statistics.currentCombo }}
                    </span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">最高连击</span>
                    <span class="stat-value">{{ gameState.statistics.maxCombo }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">总奖励</span>
                    <span class="stat-value">{{ gameState.statistics.totalRewards }}</span>
                </div>
            </div>

            <div class="game-area">
                <div class="coin-machine">
                    <div class="machine-top">
                        <div class="coin-slot">
                            <span class="slot-icon">🪙</span>
                            <span class="slot-text">投入金币</span>
                        </div>
                    </div>
                    
                    <div class="machine-middle">
                        <div class="pusher-area">
                            <div 
                                class="pusher" 
                                :class="{ 'pusher-push': isPushing }"
                                @click="handlePush"
                            >
                                <div class="pusher-plate"></div>
                                <div class="pusher-arm"></div>
                            </div>
                            
                            <div class="coins-platform">
                                <div 
                                    v-for="coin in platformCoins" 
                                    :key="coin.id"
                                    class="platform-coin"
                                    :style="{ 
                                        left: coin.x + '%', 
                                        top: coin.y + '%',
                                        transform: 'rotate(' + coin.rotation + 'deg)',
                                        backgroundColor: sceneConfig.coinColor
                                    }"
                                >
                                    🪙
                                </div>
                            </div>
                        </div>
                        
                        <div class="rewards-area">
                            <div 
                                v-for="reward in gameState.fallingRewards" 
                                :key="reward.id"
                                class="falling-reward"
                                :class="{ 
                                    'collected': reward.collected,
                                    'auto-collect': reward.autoCollect
                                }"
                                :style="{ 
                                    left: reward.x + 'px',
                                    animationDelay: reward.delay + 's'
                                }"
                                @click="collectReward(reward.id)"
                            >
                                <span class="reward-icon">{{ reward.icon }}</span>
                                <span v-if="reward.value > 1" class="reward-value">x{{ reward.value }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="machine-bottom">
                        <div class="collection-tray">
                            <span class="tray-icon">📥</span>
                            <span class="tray-text">点击奖励收集</span>
                        </div>
                    </div>
                </div>

                <button 
                    class="push-button" 
                    :class="{ 'pushing': isPushing }"
                    @click="handlePush"
                    :disabled="gameState.coins <= 0"
                >
                    <span class="push-icon">👆</span>
                    <span class="push-text">{{ gameState.coins > 0 ? '推送金币' : '金币不足' }}</span>
                </button>

                <button 
                    v-if="gameState.coins <= 0"
                    class="free-coins-btn"
                    @click="claimFreeCoins"
                >
                    🎁 领取补给（+20金币）
                </button>
            </div>

            <div class="items-panel">
                <h3 class="panel-title">🎒 道具背包</h3>
                <div class="items-grid">
                    <div 
                        class="item-card" 
                        :class="{ 'disabled': gameState.items.double_coin <= 0 }"
                        @click="useItem('double_coin')"
                    >
                        <div class="item-icon">✨</div>
                        <div class="item-name">双倍金币</div>
                        <div class="item-count">x{{ gameState.items.double_coin }}</div>
                    </div>
                    <div 
                        class="item-card" 
                        :class="{ 'disabled': gameState.items.big_push <= 0 }"
                        @click="useItem('big_push')"
                    >
                        <div class="item-icon">🚀</div>
                        <div class="item-name">大力推送</div>
                        <div class="item-count">x{{ gameState.items.big_push }}</div>
                    </div>
                    <div 
                        class="item-card" 
                        :class="{ 'disabled': gameState.items.magnet <= 0 }"
                        @click="useItem('magnet')"
                    >
                        <div class="item-icon">🧲</div>
                        <div class="item-name">磁铁吸引</div>
                        <div class="item-count">x{{ gameState.items.magnet }}</div>
                    </div>
                    <div 
                        class="item-card" 
                        :class="{ 'disabled': gameState.items.shield <= 0 }"
                        @click="useItem('shield')"
                    >
                        <div class="item-icon">🛡️</div>
                        <div class="item-name">护盾保护</div>
                        <div class="item-count">x{{ gameState.items.shield }}</div>
                    </div>
                </div>
            </div>

            <div class="scenes-panel">
                <h3 class="panel-title">🎨 游戏场景</h3>
                <div class="scenes-grid">
                    <div 
                        v-for="scene in scenes" 
                        :key="scene.id"
                        class="scene-card"
                        :class="{ 
                            'active': gameState.currentScene === scene.id,
                            'locked': gameState.level < scene.unlockLevel
                        }"
                        @click="changeScene(scene.id)"
                    >
                        <div class="scene-preview" :class="scene.bgClass">
                            <span class="scene-icon">{{ scene.icon }}</span>
                        </div>
                        <div class="scene-name">{{ scene.name }}</div>
                        <div v-if="gameState.level < scene.unlockLevel" class="scene-lock">
                            🔒 Lv.{{ scene.unlockLevel }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="bottom-nav">
                <div class="nav-item" :class="{ active: currentRoute === 'game' }" @click="navigateTo('game')">
                    <span class="nav-icon">🎮</span>
                    <span class="nav-text">游戏</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'leaderboard' }" @click="navigateTo('leaderboard')">
                    <span class="nav-icon">🏆</span>
                    <span class="nav-text">排行</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'achievements' }" @click="navigateTo('achievements')">
                    <span class="nav-icon">🎖️</span>
                    <span class="nav-text">成就</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'profile' }" @click="navigateTo('profile')">
                    <span class="nav-icon">👤</span>
                    <span class="nav-text">我的</span>
                </div>
            </div>

            <button 
                v-if="gameState.fallingRewards.filter(r => !r.collected).length > 0"
                class="collect-all-btn"
                @click="collectAll"
            >
                🧲 一键收集
            </button>
        </div>
    `,
    data() {
        return {
            isPushing: false,
            pushInterval: null,
            effectInterval: null,
            comboTimer: null,
            currentRoute: 'game'
        };
    },
    computed: {
        gameState() {
            if (!GameStore.state) {
                GameStore.ensureState();
            }
            return GameStore.state || {};
        },
        platformCoins() {
            if (!this.gameState.platformCoins || this.gameState.platformCoins.length === 0) {
                return [];
            }
            return this.gameState.platformCoins;
        },
        sceneConfig() {
            return GameStore.getSceneConfig(this.gameState.currentScene || 'forest');
        },
        expPercent() {
            if (!this.gameState.expToNextLevel) return 0;
            return (this.gameState.exp / this.gameState.expToNextLevel) * 100;
        },
        scenes() {
            return [
                { id: 'forest', name: '神秘森林', icon: '🌲', bgClass: 'scene-forest', unlockLevel: 1 },
                { id: 'ocean', name: '深海世界', icon: '🌊', bgClass: 'scene-ocean', unlockLevel: 3 },
                { id: 'volcano', name: '火山地带', icon: '🌋', bgClass: 'scene-volcano', unlockLevel: 5 },
                { id: 'castle', name: '古老城堡', icon: '🏰', bgClass: 'scene-castle', unlockLevel: 8 },
                { id: 'space', name: '太空漫游', icon: '🚀', bgClass: 'scene-space', unlockLevel: 10 }
            ];
        }
    },
    mounted() {
        this.currentRoute = Router.getCurrentRoute();
        GameStore.initPlatformCoins();
        this.startEffectTimer();
        this.startAutoCollect();
    },
    beforeUnmount() {
        if (this.pushInterval) clearInterval(this.pushInterval);
        if (this.effectInterval) clearInterval(this.effectInterval);
        if (this.comboTimer) clearTimeout(this.comboTimer);
    },
    methods: {
        initPlatformCoins() {
            GameStore.initPlatformCoins();
        },

        handlePush() {
            if (!GameStore.state) {
                GameStore.ensureState();
                return;
            }
            if (this.isPushing) return;
            
            const success = GameStore.pushCoin();
            if (!success) return;

            this.isPushing = true;
            
            const newCoin = {
                id: Date.now() + Math.random(),
                x: 50,
                y: 25,
                rotation: Math.random() * 360
            };
            GameStore.addPlatformCoin(newCoin);
            
            this.animateCoins();
            
            if (this.comboTimer) clearTimeout(this.comboTimer);
            this.comboTimer = setTimeout(() => {
                GameStore.resetCombo();
            }, 2000);

            setTimeout(() => {
                this.isPushing = false;
                this.generateRewards();
            }, 400);
        },

        animateCoins() {
            if (!GameStore.state || !GameStore.state.platformCoins) return;
            
            const updatedCoins = GameStore.state.platformCoins.map(coin => {
                const newCoin = { ...coin };
                newCoin.x += (Math.random() - 0.5) * 10;
                newCoin.y += Math.random() * 5;
                newCoin.rotation += Math.random() * 45 - 22.5;
                
                if (newCoin.x < 10) newCoin.x = 10;
                if (newCoin.x > 90) newCoin.x = 90;
                if (newCoin.y > 85) {
                    newCoin.y = Math.random() * 20 + 30;
                    newCoin.x = Math.random() * 60 + 20;
                }
                return newCoin;
            });
            
            GameStore.updatePlatformCoins(updatedCoins);
        },

        generateRewards() {
            if (!GameStore.state) return;
            
            if (GameStore.state.fallingRewards.length >= 20) {
                return;
            }
            
            const reward = GameStore.generateReward();
            if (reward) {
                reward.x = Math.random() * 200 + 50;
                reward.delay = 0;
                GameStore.state.fallingRewards.push(reward);

                if (reward.autoCollect) {
                    setTimeout(() => {
                        if (GameStore.state) {
                            GameStore.collectReward(reward.id);
                        }
                    }, 500);
                }
            }
        },

        collectReward(rewardId) {
            GameStore.collectReward(rewardId);
        },

        collectAll() {
            GameStore.collectAllRewards();
        },

        claimFreeCoins() {
            GameStore.claimFreeCoins();
        },

        useItem(itemId) {
            GameStore.useItem(itemId);
        },

        changeScene(sceneId) {
            const scene = this.scenes.find(s => s.id === sceneId);
            if (scene && this.gameState.level < scene.unlockLevel) {
                Toast.warning(`需要达到 ${scene.unlockLevel} 级才能解锁此场景！`);
                return;
            }
            GameStore.changeScene(sceneId);
        },

        startEffectTimer() {
            this.effectInterval = setInterval(() => {
                GameStore.updateEffects(0.1);
            }, 100);
        },

        startAutoCollect() {
            setInterval(() => {
                const autoRewards = this.gameState.fallingRewards?.filter(r => r.autoCollect && !r.collected) || [];
                autoRewards.forEach(r => {
                    setTimeout(() => GameStore.collectReward(r.id), 100);
                });
            }, 1000);
        },

        navigateTo(route) {
            Router.navigate(route);
        }
    }
};

window.GamePage = GamePage;

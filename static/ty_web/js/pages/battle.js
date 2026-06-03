const BattlePage = {
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">⚔️ 对战中心</h1>
                <button class="btn btn-secondary" @click="goBack">返回</button>
            </div>

            <div v-if="phase === 'select'" class="card">
                <h2 class="text-lg font-bold mb-4">选择你的武器</h2>
                
                <div v-if="loading" class="loading">
                    <div class="loading-spinner"></div>
                </div>

                <div v-else-if="weapons.length === 0" class="empty-state">
                    <div class="empty-state-icon">🗡️</div>
                    <div class="empty-state-text">暂无武器，请先制作或购买武器</div>
                    <button class="btn btn-primary mt-4" @click="navigateTo('doodle')">去制作</button>
                </div>

                <div v-else class="grid grid-2 grid-3">
                    <div 
                        v-for="weapon in weapons" 
                        :key="weapon.id"
                        class="item-card" 
                        :class="'rarity-' + getRarityClass(weapon.rarity)"
                        @click="selectWeapon(weapon)"
                    >
                        <div class="weapon-preview">
                            <img v-if="weapon.image" :src="weapon.image" :alt="weapon.name">
                            <span v-else style="font-size: 48px;">🗡️</span>
                        </div>
                        <div class="font-bold text-lg mb-2">{{ weapon.name }}</div>
                        <span class="rarity-badge" :class="getRarityClass(weapon.rarity)">{{ getRarityText(weapon.rarity) }}</span>
                        <div class="stats-grid mt-4">
                            <div class="stat-box">
                                <div class="stat-box-label">攻击力</div>
                                <div class="stat-box-value">{{ weapon.attack || 0 }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">防御力</div>
                                <div class="stat-box-value">{{ weapon.defense || 0 }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">耐久度</div>
                                <div class="stat-box-value">{{ weapon.durability || 0 }}/{{ weapon.max_durability || 0 }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">等级</div>
                                <div class="stat-box-value">Lv.{{ weapon.level || 1 }}</div>
                            </div>
                        </div>
                        <div 
                            v-if="selectedWeapon && selectedWeapon.id === weapon.id"
                            class="btn btn-success w-full mt-2"
                        >
                            ✓ 已选择
                        </div>
                    </div>
                </div>

                <div v-if="selectedWeapon" class="mt-4 text-center">
                    <button class="btn btn-primary btn-lg" @click="startBattle" :disabled="loading">
                        {{ loading ? '匹配中...' : '开始战斗' }}
                    </button>
                </div>
            </div>

            <div v-if="phase === 'battle'">
                <div class="battle-arena">
                    <div class="battle-ground">
                        <div class="battle-character" :class="{ attacking: playerAnimating, damaged: playerAnimating && enemyAnimating }">
                            <div class="character-sprite">{{ player.emoji }}</div>
                            <div class="character-name">{{ player.name }}</div>
                            <div class="hp-bar-container">
                                <div class="hp-bar" :class="playerHpBarClass" :style="{ width: playerHpPercent + '%' }">
                                    {{ player.hp }}/{{ player.maxHp }}
                                </div>
                            </div>
                            <div 
                                v-for="popup in damagePopups.filter(p => p.target === 'player')" 
                                :key="popup.id"
                                class="damage-popup"
                                :class="{ crit: popup.isCrit, heal: popup.isHeal }"
                            >
                                {{ popup.isHeal ? '+' : '-' }}{{ popup.damage }}
                            </div>
                        </div>

                        <div style="font-size: 48px; font-weight: 900; color: white; text-shadow: 4px 4px 0 #1f2937;">
                            VS
                        </div>

                        <div class="battle-character enemy" :class="{ attacking: enemyAnimating && !playerAnimating, damaged: enemyAnimating && playerAnimating }">
                            <div class="character-sprite">{{ enemy.emoji }}</div>
                            <div class="character-name">{{ enemy.name }}</div>
                            <div class="hp-bar-container">
                                <div class="hp-bar" :class="enemyHpBarClass" :style="{ width: enemyHpPercent + '%' }">
                                    {{ enemy.hp }}/{{ enemy.maxHp }}
                                </div>
                            </div>
                            <div 
                                v-for="popup in damagePopups.filter(p => p.target === 'enemy')" 
                                :key="popup.id"
                                class="damage-popup"
                                :class="{ crit: popup.isCrit, heal: popup.isHeal }"
                            >
                                {{ popup.isHeal ? '+' : '-' }}{{ popup.damage }}
                            </div>
                        </div>
                    </div>

                    <div class="battle-log">
                        <p v-for="log in battleLogs" :key="log.id" :class="log.type">
                            [回合{{ Math.ceil((battleLogs.indexOf(log) + 1) / 2) }}] {{ log.message }}
                        </p>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-lg font-bold">第 {{ round }} 回合</div>
                        <button class="btn btn-secondary" @click="backToSelect">放弃战斗</button>
                    </div>
                    <div class="flex gap-4 justify-center">
                        <button class="btn btn-primary" @click="playerAttack" :disabled="isProcessing">
                            ⚔️ 攻击
                        </button>
                        <button class="btn btn-warning" @click="useSkill" :disabled="isProcessing">
                            ✨ 技能
                        </button>
                        <button class="btn btn-secondary" @click="defend" :disabled="isProcessing">
                            🛡️ 防御
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showResult" class="battle-result-overlay">
                <div class="battle-result-card" :class="battleResult">
                    <h2>{{ battleResult === 'victory' ? '🎉 胜利！' : '💀 失败...' }}</h2>
                    
                    <div v-if="rewards" class="rewards">
                        <div v-if="rewards.gold" class="reward-item">
                            <div class="reward-icon">💰</div>
                            <div class="reward-amount">+{{ rewards.gold }}</div>
                            <div class="text-sm text-gray-500">金币</div>
                        </div>
                        <div v-if="rewards.exp" class="reward-item">
                            <div class="reward-icon">⭐</div>
                            <div class="reward-amount">+{{ rewards.exp }}</div>
                            <div class="text-sm text-gray-500">经验</div>
                        </div>
                    </div>

                    <button class="btn btn-primary" @click="closeResult">
                        {{ battleResult === 'victory' ? '继续战斗' : '重新挑战' }}
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            phase: 'select',
            selectedWeapon: null,
            weapons: [],
            loading: true,
            battleId: null,
            player: {
                name: '玩家',
                hp: 100,
                maxHp: 100,
                attack: 10,
                defense: 5,
                emoji: '⚔️'
            },
            enemy: {
                name: '敌人',
                hp: 100,
                maxHp: 100,
                attack: 8,
                defense: 3,
                emoji: '👹'
            },
            playerAnimating: false,
            enemyAnimating: false,
            damagePopups: [],
            battleLogs: [],
            round: 0,
            isProcessing: false,
            showResult: false,
            battleResult: null,
            rewards: null
        };
    },
    computed: {
        playerHpPercent() {
            return Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        },
        enemyHpPercent() {
            return Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100);
        },
        playerHpBarClass() {
            if (this.playerHpPercent <= 20) return 'low';
            if (this.playerHpPercent <= 50) return 'medium';
            return '';
        },
        enemyHpBarClass() {
            if (this.enemyHpPercent <= 20) return 'low';
            if (this.enemyHpPercent <= 50) return 'medium';
            return '';
        }
    },
    mounted() {
        AuthService.requireAuth();
        this.loadWeapons();
    },
    methods: {
        async loadWeapons() {
            try {
                this.loading = true;
                const result = await API.weapon.getMyList({ page: 1, page_size: 50 });
                if (result.code === 0) {
                    this.weapons = result.data.items || [];
                }
            } catch (error) {
                console.error('加载武器失败:', error);
                Toast.error('加载武器失败');
            } finally {
                this.loading = false;
            }
        },
        selectWeapon(weapon) {
            this.selectedWeapon = weapon;
        },
        getRarityClass(rarity) {
            const map = {
                1: 'common',
                2: 'rare',
                3: 'epic',
                4: 'legendary',
                'common': 'common',
                'rare': 'rare',
                'epic': 'epic',
                'legendary': 'legendary'
            };
            return map[rarity] || 'common';
        },
        getRarityText(rarity) {
            const map = {
                1: '普通',
                2: '稀有',
                3: '史诗',
                4: '传说',
                'common': '普通',
                'rare': '稀有',
                'epic': '史诗',
                'legendary': '传说'
            };
            return map[rarity] || '普通';
        },
        async startBattle() {
            if (!this.selectedWeapon) {
                Toast.warning('请先选择武器');
                return;
            }

            try {
                this.loading = true;
                const result = await API.battle.createPVE(this.selectedWeapon.id);

                if (result.code === 0) {
                    const data = result.data;
                    this.battleId = data.battle_id;
                    this.player = {
                        ...this.player,
                        hp: data.player_hp,
                        maxHp: data.player_max_hp,
                        attack: data.player_attack,
                        defense: data.player_defense,
                        name: data.player_name || '玩家'
                    };
                    this.enemy = {
                        name: data.enemy_name || '怪物',
                        hp: data.enemy_hp,
                        maxHp: data.enemy_max_hp,
                        attack: data.enemy_attack,
                        defense: data.enemy_defense,
                        emoji: data.enemy_emoji || '👹'
                    };
                    this.round = 0;
                    this.battleLogs = [];
                    this.damagePopups = [];
                    this.phase = 'battle';
                    this.addLog(`战斗开始！${this.player.name} VS ${this.enemy.name}`, 'info');
                }
            } catch (error) {
                console.error('创建战斗失败:', error);
            } finally {
                this.loading = false;
            }
        },
        addLog(message, type = 'info') {
            this.battleLogs.unshift({ message, type, id: Date.now() });
            if (this.battleLogs.length > 50) {
                this.battleLogs.pop();
            }
        },
        showDamagePopup(target, damage, isCrit = false, isHeal = false) {
            const popup = {
                id: Date.now() + Math.random(),
                target,
                damage,
                isCrit,
                isHeal
            };
            this.damagePopups.push(popup);
            setTimeout(() => {
                const index = this.damagePopups.findIndex(p => p.id === popup.id);
                if (index > -1) {
                    this.damagePopups.splice(index, 1);
                }
            }, 1000);
        },
        async playerAttack() {
            if (this.isProcessing) return;
            this.isProcessing = true;
            this.round++;

            try {
                this.playerAnimating = true;
                setTimeout(() => {
                    this.playerAnimating = false;
                }, 300);

                const result = await API.battle.executeRound(this.battleId);

                if (result.code === 0) {
                    const data = result.data;

                    setTimeout(() => {
                        this.enemyAnimating = true;
                        this.enemy.hp = data.enemy_hp;
                        this.showDamagePopup('enemy', data.player_damage, data.is_crit);
                        
                        if (data.is_crit) {
                            this.addLog(`💥 暴击！${this.player.name} 造成 ${data.player_damage} 点伤害！`, 'crit');
                        } else {
                            this.addLog(`⚔️ ${this.player.name} 攻击，造成 ${data.player_damage} 点伤害`, 'damage');
                        }

                        setTimeout(() => {
                            this.enemyAnimating = false;
                        }, 300);
                    }, 200);

                    if (data.enemy_hp <= 0) {
                        setTimeout(() => {
                            this.endBattle(true, data.rewards);
                        }, 800);
                        return;
                    }

                    setTimeout(async () => {
                        this.enemyAnimating = true;
                        setTimeout(() => {
                            this.enemyAnimating = false;
                        }, 300);

                        setTimeout(() => {
                            this.playerAnimating = true;
                            this.player.hp = data.player_hp;
                            this.showDamagePopup('player', data.enemy_damage, data.enemy_is_crit);
                            
                            if (data.enemy_is_crit) {
                                this.addLog(`💥 ${this.enemy.name} 暴击！造成 ${data.enemy_damage} 点伤害！`, 'crit');
                            } else {
                                this.addLog(`👊 ${this.enemy.name} 攻击，造成 ${data.enemy_damage} 点伤害`, 'damage');
                            }

                            setTimeout(() => {
                                this.playerAnimating = false;
                                this.isProcessing = false;

                                if (data.player_hp <= 0) {
                                    this.endBattle(false, data.rewards);
                                }
                            }, 300);
                        }, 200);
                    }, 800);
                }
            } catch (error) {
                console.error('执行回合失败:', error);
                this.isProcessing = false;
            }
        },
        useSkill() {
            if (this.isProcessing) return;
            Toast.info('技能功能开发中...');
        },
        defend() {
            if (this.isProcessing) return;
            Toast.info('防御功能开发中...');
        },
        endBattle(isVictory, rewards) {
            this.showResult = true;
            this.battleResult = isVictory ? 'victory' : 'defeat';
            this.rewards = rewards || null;

            if (isVictory) {
                this.addLog('🎉 战斗胜利！', 'heal');
            } else {
                this.addLog('💀 战斗失败...', 'damage');
            }
        },
        closeResult() {
            this.showResult = false;
            this.phase = 'select';
            this.selectedWeapon = null;
            this.battleId = null;
            this.loadWeapons();
        },
        backToSelect() {
            this.phase = 'select';
            this.selectedWeapon = null;
            this.battleId = null;
        },
        goBack() {
            Router.navigate('home');
        },
        navigateTo(page) {
            Router.navigate(page);
        }
    }
};

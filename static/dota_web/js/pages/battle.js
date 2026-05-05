const BattlePage = {
    currentStage: null,
    currentHero: null,
    heroStats: null,
    enemies: [],
    battleLog: [],
    selectedEnemyIndex: 0,
    isBattleInProgress: false,
    battleData: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">关卡选择</h1>
                </header>

                <div class="section-title">选择关卡</div>

                <div class="card" id="stageSelectCard">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div class="section-title">第一章</div>

                <div class="stage-grid" id="stageGrid">
                    <div class="empty-state" style="grid-column: span 5; width: 100%;">
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('battle')}
            </div>
        `;

        await this.loadStageData();
    },

    async loadStageData() {
        try {
            const stageResult = await DotaApi.getCurrentStage();
            if (stageResult.code === 0) {
                this.currentStage = stageResult.data;
            }

            const chapterResult = await DotaApi.getChapterStages(1);
            if (chapterResult.code === 0) {
                this.renderStageGrid(chapterResult.data);
            }

            this.renderStageCard();
        } catch (e) {
            console.error('Load stage data error:', e);
        }
    },

    renderStageCard() {
        const card = document.getElementById('stageSelectCard');
        if (!card || !this.currentStage) return;

        const stage = this.currentStage;
        const canPlay = stage.is_unlocked;

        card.innerHTML = `
            <div class="card-body" style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">${stage.stage_type_icon}</div>
                <div style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">
                    ${stage.name}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    ${stage.stage_type_name} · ${stage.description}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
                    敌人: ${stage.enemy_count}个 (Lv.${stage.enemy_level}) |
                    奖励: 💰${stage.gold_reward} 📊${stage.exp_reward}
                </div>
                <button class="btn btn-primary btn-lg" ${!canPlay ? 'disabled' : ''} 
                    onclick="BattlePage.handleStartBattle()">
                    ${canPlay ? '⚔️ 开始战斗' : '🔒 关卡未解锁'}
                </button>
            </div>
        `;
    },

    renderStageGrid(stages) {
        const grid = document.getElementById('stageGrid');
        if (!grid) return;

        grid.innerHTML = stages.map((stage, index) => {
            const isUnlocked = stage.is_unlocked;
            const isCleared = stage.is_cleared;
            const isCurrent = this.currentStage && stage.id === this.currentStage.id;

            return `
                <div class="stage-grid-item ${isCurrent ? 'current' : ''} ${isCleared ? 'cleared' : ''} ${!isUnlocked ? 'locked' : ''}"
                    onclick="${isUnlocked ? `BattlePage.handleSelectStage(${stage.id})` : ''}">
                    <div class="stage-number">${stage.name}</div>
                    <div class="stage-icon">${stage.stage_type_icon}</div>
                </div>
            `;
        }).join('');
    },

    async handleSelectStage(stageId) {
        try {
            const result = await DotaApi.getStageInfo(stageId);
            if (result.code === 0) {
                this.currentStage = result.data;
                this.renderStageCard();
                this.highlightCurrentStage(stageId);
            }
        } catch (e) {
            console.error('Select stage error:', e);
        }
    },

    highlightCurrentStage(stageId) {
        document.querySelectorAll('.stage-grid-item').forEach(item => {
            item.classList.remove('current');
        });
    },

    async handleStartBattle() {
        if (!this.currentStage || !this.currentStage.is_unlocked) {
            Toast.warning('请先选择一个可挑战的关卡');
            return;
        }

        let user = AuthService.getUser();
        let heroId = user?.current_hero_id;

        if (!heroId || heroId === 0) {
            const refreshed = await AuthService.refreshUserInfo();
            if (refreshed) {
                user = AuthService.getUser();
                heroId = user?.current_hero_id;
            }
            
            if (!heroId || heroId === 0) {
                Toast.warning('请先选择一个英雄');
                Router.navigate('hero');
                return;
            }
        }

        Utils.showLoading();

        try {
            const statsResult = await DotaApi.getHeroStats(heroId);
            if (statsResult.code === 0) {
                this.heroStats = statsResult.data;

                if (this.heroStats.current_hp <= 0) {
                    Utils.hideLoading();
                    Toast.warning('英雄生命值为0，请先恢复');
                    Router.navigate('hero', { hero_id: heroId, action: 'detail' });
                    return;
                }

                this.renderBattleScene();
            } else {
                Toast.error(statsResult.msg || '获取英雄信息失败');
            }
        } catch (e) {
            Toast.error('开始战斗失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    },

    renderBattleScene() {
        const stage = this.currentStage;
        const hero = this.heroStats;

        this.enemies = [];
        for (let i = 0; i < stage.enemy_count; i++) {
            this.enemies.push({
                id: i,
                name: stage.stage_type === 'boss' ? '肉山' : 
                      stage.stage_type === 'elite' ? '巨魔精英' : '小兵',
                icon: stage.stage_type_icon,
                level: stage.enemy_level,
                max_hp: 100 + stage.enemy_level * 30,
                current_hp: 100 + stage.enemy_level * 30,
                attack: 10 + stage.enemy_level * 3,
                defense: 2 + stage.enemy_level,
                is_dead: false
            });
        }

        this.battleLog = [];
        this.selectedEnemyIndex = 0;
        this.isBattleInProgress = true;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <button class="header-back" onclick="BattlePage.handleExitBattle()">‹</button>
                    <h1 class="header-title">${stage.name} - 战斗中</h1>
                </header>

                <div class="battle-area">
                    <div class="battle-section">
                        <div class="battle-section-title">我方</div>
                        <div class="battle-hero" id="heroBattleUnit">
                            <div class="battle-hero-icon">${hero.hero_icon}</div>
                            <div class="battle-hero-info">
                                <div class="battle-hero-name">
                                    ${hero.hero_name}
                                    <span class="battle-enemy-level">Lv.${hero.level}</span>
                                </div>
                                <div class="battle-hero-hp">
                                    <span class="battle-hero-hp-text">${hero.current_hp}/${hero.max_hp}</span>
                                    <div class="battle-hero-hp-bar">
                                        <div class="battle-hero-hp-fill" style="width: ${(hero.current_hp / hero.max_hp) * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; padding: 12px; font-size: 24px; color: var(--text-secondary);">
                        ⚔️ VS ⚔️
                    </div>

                    <div class="battle-section">
                        <div class="battle-section-title">敌方</div>
                        <div class="battle-enemies" id="enemyBattleUnits">
                            ${this.renderEnemyUnits()}
                        </div>
                    </div>
                </div>

                <div class="battle-log" id="battleLogContainer">
                    <div class="battle-log-item">战斗开始！</div>
                </div>

                <div class="fixed-bottom">
                    <div class="battle-actions">
                        <button class="battle-action-btn btn btn-primary" id="attackBtn" onclick="BattlePage.handleAttack()">
                            ⚔️ 普攻
                        </button>
                        <button class="battle-action-btn btn btn-warning" id="autoBtn" onclick="BattlePage.handleAutoBattle()">
                            🤖 自动
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.bindBattleEvents();
    },

    renderEnemyUnits() {
        return this.enemies.map((enemy, index) => {
            const isSelected = index === this.selectedEnemyIndex;
            const hpPercent = (enemy.current_hp / enemy.max_hp) * 100;

            return `
                <div class="battle-enemy ${isSelected ? 'selected' : ''} ${enemy.is_dead ? 'dead' : ''}"
                    data-index="${index}"
                    onclick="BattlePage.handleSelectEnemy(${index})">
                    <div class="battle-enemy-icon">${enemy.icon}</div>
                    <div class="battle-enemy-info">
                        <div class="battle-enemy-name">
                            ${enemy.name}
                            <span class="battle-enemy-level">Lv.${enemy.level}</span>
                        </div>
                        <div class="battle-hero-hp">
                            <span class="battle-hero-hp-text">${enemy.current_hp}/${enemy.max_hp}</span>
                            <div class="battle-hero-hp-bar">
                                <div class="battle-hero-hp-fill" style="width: ${Math.max(0, hpPercent)}%; background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    bindBattleEvents() {
    },

    handleSelectEnemy(index) {
        if (this.enemies[index].is_dead) return;
        this.selectedEnemyIndex = index;
        this.updateEnemyDisplay();
    },

    updateEnemyDisplay() {
        const container = document.getElementById('enemyBattleUnits');
        if (container) {
            container.innerHTML = this.renderEnemyUnits();
        }
    },

    updateHeroDisplay() {
        const hero = this.heroStats;
        const container = document.getElementById('heroBattleUnit');
        if (!container) return;

        const hpPercent = (hero.current_hp / hero.max_hp) * 100;
        container.innerHTML = `
            <div class="battle-hero-icon">${hero.hero_icon}</div>
            <div class="battle-hero-info">
                <div class="battle-hero-name">
                    ${hero.hero_name}
                    <span class="battle-enemy-level">Lv.${hero.level}</span>
                </div>
                <div class="battle-hero-hp">
                    <span class="battle-hero-hp-text">${hero.current_hp}/${hero.max_hp}</span>
                    <div class="battle-hero-hp-bar">
                        <div class="battle-hero-hp-fill" style="width: ${Math.max(0, hpPercent)}%"></div>
                    </div>
                </div>
            </div>
        `;
    },

    addLog(message, type = 'normal') {
        const container = document.getElementById('battleLogContainer');
        if (!container) return;

        const logItem = document.createElement('div');
        logItem.className = `battle-log-item ${type}`;
        logItem.textContent = message;
        container.appendChild(logItem);
        container.scrollTop = container.scrollHeight;

        this.battleLog.push({ message, type });
    },

    async handleAttack() {
        if (!this.isBattleInProgress) return;

        const aliveEnemy = this.enemies.find(e => !e.is_dead && e.current_hp > 0);
        if (!aliveEnemy) {
            await this.handleBattleEnd(true);
            return;
        }

        if (this.enemies[this.selectedEnemyIndex].is_dead || this.enemies[this.selectedEnemyIndex].current_hp <= 0) {
            const firstAlive = this.enemies.findIndex(e => !e.is_dead && e.current_hp > 0);
            if (firstAlive >= 0) {
                this.selectedEnemyIndex = firstAlive;
            }
        }

        const targetEnemy = this.enemies[this.selectedEnemyIndex];
        if (!targetEnemy || targetEnemy.is_dead) return;

        const damage = Math.max(1, this.heroStats.attack - targetEnemy.defense + Utils.randomInt(-3, 3));
        targetEnemy.current_hp -= damage;

        this.addLog(`${this.heroStats.hero_icon} ${this.heroStats.hero_name} 攻击 ${targetEnemy.name}，造成 ${damage} 点伤害！`, 'damage');

        if (targetEnemy.current_hp <= 0) {
            targetEnemy.is_dead = true;
            this.addLog(`${targetEnemy.icon} ${targetEnemy.name} 被击败！`, 'victory');
        }

        const allDead = this.enemies.every(e => e.is_dead || e.current_hp <= 0);
        if (allDead) {
            await this.handleBattleEnd(true);
            return;
        }

        this.updateEnemyDisplay();
        await Utils.sleep(500);
        await this.handleEnemyTurn();
    },

    async handleEnemyTurn() {
        const aliveEnemies = this.enemies.filter(e => !e.is_dead && e.current_hp > 0);

        for (const enemy of aliveEnemies) {
            const damage = Math.max(1, enemy.attack - this.heroStats.defense + Utils.randomInt(-2, 2));
            this.heroStats.current_hp -= damage;

            this.addLog(`${enemy.icon} ${enemy.name} 攻击 ${this.heroStats.hero_name}，造成 ${damage} 点伤害！`, 'damage');

            if (this.heroStats.current_hp <= 0) {
                this.heroStats.current_hp = 0;
                this.updateHeroDisplay();
                await this.handleBattleEnd(false);
                return;
            }
        }

        this.updateHeroDisplay();
    },

    async handleAutoBattle() {
        if (!this.isBattleInProgress) return;

        const attackBtn = document.getElementById('attackBtn');
        const autoBtn = document.getElementById('autoBtn');

        if (attackBtn) attackBtn.disabled = true;
        if (autoBtn) autoBtn.disabled = true;

        while (this.isBattleInProgress) {
            const aliveEnemy = this.enemies.find(e => !e.is_dead && e.current_hp > 0);
            if (!aliveEnemy) break;

            if (this.heroStats.current_hp <= 0) break;

            const firstAliveIndex = this.enemies.findIndex(e => !e.is_dead && e.current_hp > 0);
            if (firstAliveIndex >= 0) {
                this.selectedEnemyIndex = firstAliveIndex;
            }

            await this.handleAttack();
            await Utils.sleep(600);
        }

        if (attackBtn) attackBtn.disabled = false;
        if (autoBtn) autoBtn.disabled = false;
    },

    async handleBattleEnd(isVictory) {
        this.isBattleInProgress = false;

        const user = AuthService.getUser();
        const heroId = this.heroStats.hero_id;

        if (isVictory) {
            this.addLog('🎉 战斗胜利！', 'victory');

            try {
                const result = await DotaApi.autoBattle(heroId, this.currentStage.id);
                if (result.code === 0) {
                    this.addLog(`获得 ${result.data.gold_earned} 金币，${result.data.exp_earned} 经验！`, 'victory');
                    this.addLog(`当前金币: ${result.data.user_gold}`, 'victory');

                    if (user) {
                        user.gold = result.data.user_gold;
                        AuthService.updateUser(user);
                    }
                }
            } catch (e) {
                console.error('Auto battle error:', e);
            }
        } else {
            this.addLog('💀 战斗失败...', 'defeat');
        }

        await Utils.sleep(1000);

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <h1 class="header-title">战斗结束</h1>
                </header>

                <div class="battle-result">
                    <div class="battle-result-icon">${isVictory ? '🏆' : '💀'}</div>
                    <div class="battle-result-title ${isVictory ? 'victory' : 'defeat'}">
                        ${isVictory ? '战斗胜利！' : '战斗失败'}
                    </div>
                    
                    ${isVictory ? `
                        <div class="battle-result-rewards">
                            <div class="battle-reward-item">
                                <div class="battle-reward-icon">💰</div>
                                <div class="battle-reward-value" style="color: var(--gold-color);">+${this.currentStage.gold_reward}</div>
                                <div class="battle-reward-label">金币</div>
                            </div>
                            <div class="battle-reward-item">
                                <div class="battle-reward-icon">📊</div>
                                <div class="battle-reward-value" style="color: var(--exp-color);">+${this.currentStage.exp_reward}</div>
                                <div class="battle-reward-label">经验</div>
                            </div>
                        </div>
                    ` : `
                        <div style="color: var(--text-secondary); margin-bottom: 24px;">
                            英雄已倒下，请先恢复生命
                        </div>
                    `}

                    <div style="display: flex; gap: 12px; justify-content: center; padding: 0 20px;">
                        <button class="btn btn-outline" onclick="Router.navigate('battle')">
                            返回关卡
                        </button>
                        ${!isVictory ? `
                            <button class="btn btn-primary" onclick="Router.navigate('hero', { hero_id: ${heroId}, action: 'detail' })">
                                恢复英雄
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="BattlePage.handleNextBattle()">
                                继续挑战
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    async handleNextBattle() {
        Router.navigate('battle');
    },

    async handleExitBattle() {
        if (this.isBattleInProgress) {
            const hero = this.heroStats;
            if (hero && hero.hero_id) {
                try {
                    await DotaApi.healHero(hero.hero_id);
                } catch (e) {
                    console.error('Heal error:', e);
                }
            }
        }
        Router.navigate('battle');
    }
};

const App = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    animationId: null,
    isRunning: false,

    init() {
        CanvasUtils.init('game-canvas');
        
        this.canvas = CanvasUtils.canvas;
        this.ctx = CanvasUtils.ctx;

        GameState.init();
        
        ExplorationSystem.init();
        ScreenManager.init();

        this.setupEventListeners();

        this.showLoadingScreen();
    },

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        let progress = 0;
        const loadingSteps = [
            { progress: 20, text: '正在加载异兽数据...' },
            { progress: 40, text: '正在加载技能系统...' },
            { progress: 60, text: '正在加载关卡数据...' },
            { progress: 80, text: '正在初始化游戏...' },
            { progress: 100, text: '加载完成!' }
        ];

        let currentStep = 0;
        const loadInterval = setInterval(() => {
            progress = Math.min(progress + 5, loadingSteps[currentStep].progress);
            loadingBar.style.width = `${progress}%`;
            
            if (progress >= loadingSteps[currentStep].progress) {
                loadingText.textContent = loadingSteps[currentStep].text;
                currentStep++;
                
                if (currentStep >= loadingSteps.length) {
                    clearInterval(loadInterval);
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                        this.start();
                    }, 500);
                }
            }
        }, 100);
    },

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const pos = CanvasUtils.getMousePos(e);
            ScreenManager.handleClick(pos.x, pos.y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pos = CanvasUtils.getMousePos(e);
            ScreenManager.handleMouseMove(pos.x, pos.y);
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        window.addEventListener('beforeunload', () => {
            GameState.save();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                GameState.save();
            }
        });
    },

    handleKeyPress(e) {
        const screen = GameState.state.ui.currentScreen;
        const battle = GameState.state.battle;

        if (e.key === 'Escape') {
            if (screen === 'battle') {
                if (battle.phase !== 'select_action') {
                    battle.phase = 'select_action';
                    battle.selectedSkill = null;
                }
            } else if (screen !== 'menu') {
                GameState.setCurrentScreen('menu');
            }
        }

        if (screen === 'battle' && battle.active) {
            if (e.key >= '1' && e.key <= '4') {
                const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
                const skillIndex = parseInt(e.key) - 1;
                
                if (playerMonster && playerMonster.skills[skillIndex]) {
                    const skillId = playerMonster.skills[skillIndex];
                    const skill = SkillData.getSkillById(skillId);
                    
                    if (skill) {
                        BattleSystem.selectSkill(skillId);
                        BattleSystem.executePlayerAction();
                        BattleSystem.nextTurn();
                    }
                }
            }

            if (e.key === ' ' || e.key === 'Enter') {
                if (battle.phase === 'select_action') {
                    const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];
                    if (playerMonster && playerMonster.skills[0]) {
                        BattleSystem.selectSkill(playerMonster.skills[0]);
                        BattleSystem.executePlayerAction();
                        BattleSystem.nextTurn();
                    }
                }
            }
        }

        if (e.key === 's' && screen === 'menu') {
            GameState.reset();
            GameState.showNotification('游戏已重置!');
        }
    },

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    },

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    },

    update(deltaTime) {
        const battle = GameState.state.battle;
        
        if (battle.active && battle.phase && battle.phase.includes('enemy')) {
            this.updateBattle(deltaTime);
        }
    },

    updateBattle(deltaTime) {
        const battle = GameState.state.battle;

        if (!this.enemyActionTimer) {
            this.enemyActionTimer = 0;
        }

        this.enemyActionTimer += deltaTime;

        if (this.enemyActionTimer > 1200) {
            this.enemyActionTimer = 0;

            if (battle.phase === 'enemy_turn') {
                const enemy = battle.enemies[battle.currentEnemyIndex];
                const playerMonster = battle.playerMonsters[battle.currentMonsterIndex];

                if (!enemy || !playerMonster) return;

                const enemySkip = BattleSystem.processStartOfTurn(enemy);
                
                if (enemy.currentHp <= 0) {
                    if (!BattleSystem.switchToNextAliveEnemy()) {
                        BattleSystem.checkBattleEnd();
                        return;
                    }
                }

                if (enemySkip) {
                    battle.battleLog.push(`${enemy.name} 无法行动!`);
                } else {
                    BattleSystem.executeEnemyAction();
                }

                if (BattleSystem.checkBattleEnd()) return;

                const playerSkip = BattleSystem.processStartOfTurn(playerMonster);
                
                if (playerMonster.currentHp <= 0) {
                    if (!BattleSystem.switchToNextAliveMonster()) {
                        BattleSystem.checkBattleEnd();
                        return;
                    }
                }

                if (playerSkip) {
                    battle.battleLog.push(`${playerMonster.name} 无法行动!`);
                }

                BattleSystem.nextTurn();
            }
        }
    },

    render() {
        ScreenManager.render();
    }
};

window.addEventListener('load', () => {
    App.init();
});

const Game = {
    state: 'menu',
    selectedCharacter: 'wusheng',
    enemyCharacter: 'hualian',
    round: 1,
    playerWins: 0,
    enemyWins: 0,
    timer: GameConfig.ROUND_TIME,
    
    player: null,
    enemy: null,
    
    lastTime: 0,
    deltaTime: 0,
    animationId: null,
    
    saveInterval: null,
    roundEnding: false,
    
    particleSystem: ParticleSystem,
    combatManager: CombatManager,
    
    init() {
        try {
            console.log('=== 游戏初始化开始 ===');
            
            Input.init();
            console.log('✓ 输入系统初始化完成');
            
            UIManager.init();
            console.log('✓ UI系统初始化完成');
            
            Renderer.init(document.getElementById('gameCanvas'));
            console.log('✓ 渲染器初始化完成');
            
            this.particleSystem.init();
            console.log('✓ 粒子系统初始化完成');
            
            this.combatManager.init();
            console.log('✓ 战斗系统初始化完成');
            
            UIManager.setupCharacterSelect();
            console.log('✓ 角色选择设置完成');
            
            this.setupEventListeners();
            console.log('✓ 事件监听器设置完成');
            
            this.state = 'menu';
            UIManager.showStartMenu();
            console.log('✓ 开始菜单显示完成');
            
            console.log('=== 游戏初始化完成 ===');
            
        } catch (e) {
            console.error('❌ 游戏初始化错误:', e);
            alert('游戏初始化失败: ' + e.message);
            this.state = 'menu';
        }
        
        this.gameLoop(0);
    },
    
    setupEventListeners() {
        const addListener = (element, event, handler) => {
            if (element && element.addEventListener) {
                element.addEventListener(event, handler);
            } else {
                console.warn('Element not found for event listener:', event);
            }
        };
        
        addListener(UIManager.elements.startBtn, 'click', () => this.startGame());
        addListener(UIManager.elements.pauseBtn, 'click', () => this.togglePause());
        addListener(UIManager.elements.resumeBtn, 'click', () => this.resumeGame());
        addListener(UIManager.elements.restartBtn, 'click', () => this.restartGame());
        addListener(UIManager.elements.quitBtn, 'click', () => this.quitToMenu());
        addListener(UIManager.elements.playAgainBtn, 'click', () => this.restartGame());
        addListener(UIManager.elements.backMenuBtn, 'click', () => this.quitToMenu());
    },
    
    startGame() {
        try {
            console.log('Starting new game...');
            
            this.selectedCharacter = UIManager.getSelectedCharacter();
            this.round = 1;
            this.playerWins = 0;
            this.enemyWins = 0;
            
            const allTypes = ['wusheng', 'hualian', 'danjiao'];
            const availableTypes = allTypes.filter(t => t !== this.selectedCharacter);
            this.enemyCharacter = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            console.log('Player:', this.selectedCharacter, 'vs Enemy:', this.enemyCharacter);
            
            this.startRound();
            
            UIManager.hideAllMenus();
            UIManager.updateCharacterNames(this.selectedCharacter, this.enemyCharacter);
            this.state = 'playing';
            
            Input.reset();
            this.startAutoSave();
            
            console.log('Game started successfully!');
        } catch (e) {
            console.error('Error starting game:', e);
            alert('游戏启动失败: ' + e.message);
        }
    },
    
    startRound() {
        this.roundEnding = false;
        this.player = new Character(this.selectedCharacter, 150, GameConfig.GROUND_Y - 100, 1);
        this.enemy = new Character(this.enemyCharacter, 750, GameConfig.GROUND_Y - 100, -1);
        
        this.timer = GameConfig.ROUND_TIME;
        this.combatManager.reset();
        this.particleSystem.reset();
        Input.reset();
        
        UIManager.updateRound(this.round);
    },
    
    togglePause() {
        if (this.state === 'playing') {
            this.pauseGame();
        } else if (this.state === 'paused') {
            this.resumeGame();
        }
    },
    
    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        UIManager.showPauseMenu();
        this.saveGame();
    },
    
    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        UIManager.hidePauseMenu();
        Input.clearPressed();
    },
    
    restartGame() {
        this.stopAutoSave();
        Storage.clear();
        this.round = 1;
        this.playerWins = 0;
        this.enemyWins = 0;
        this.startRound();
        UIManager.hideAllMenus();
        this.state = 'playing';
        this.startAutoSave();
    },
    
    quitToMenu() {
        this.stopAutoSave();
        this.state = 'menu';
        this.player = null;
        this.enemy = null;
        UIManager.showStartMenu();
        this.particleSystem.reset();
        this.combatManager.reset();
    },
    
    handleInput() {
        if (!this.player || this.state !== 'playing') return;
        
        if (Input.wasPressed(GameConfig.KEYS.PAUSE)) {
            this.togglePause();
            return;
        }
        
        if (this.player.isDead || this.enemy.isDead) return;
        
        if (Input.isDown(GameConfig.KEYS.LEFT)) {
            this.player.move(-1);
        } else if (Input.isDown(GameConfig.KEYS.RIGHT)) {
            this.player.move(1);
        } else {
            this.player.stop();
        }
        
        if (Input.wasPressed(GameConfig.KEYS.UP)) {
            this.player.jump();
        }
        
        this.player.crouch(Input.isDown(GameConfig.KEYS.DOWN));
        
        if (Input.wasPressed(GameConfig.KEYS.LIGHT_PALM)) {
            this.player.attack('LIGHT_PALM');
        }
        if (Input.wasPressed(GameConfig.KEYS.HEAVY_PALM)) {
            this.player.attack('HEAVY_PALM');
        }
        if (Input.wasPressed(GameConfig.KEYS.LIGHT_KICK)) {
            this.player.attack('LIGHT_KICK');
        }
        if (Input.wasPressed(GameConfig.KEYS.HEAVY_KICK)) {
            this.player.attack('HEAVY_KICK');
        }
        
        if (Input.wasPressed(GameConfig.KEYS.SWITCH_FACE)) {
            const oldColor = this.player.getCurrentFaceColor();
            this.player.switchFace();
            const newColor = this.player.getCurrentFaceColor();
            this.particleSystem.createFaceSwitchEffect(
                this.player.x + this.player.width / 2,
                this.player.y + 20,
                oldColor,
                newColor
            );
        }
        
        if (Input.wasPressed(GameConfig.KEYS.SPECIAL) && this.player.energy >= this.player.maxEnergy) {
            const ultimates = ['RED_FACE_ROAR', 'CHAIN_PALM', 'BLACK_FACE_SHOCK'];
            const ultimate = ultimates[this.player.currentFace % ultimates.length];
            if (this.player.ultimate(ultimate)) {
                this.combatManager.createProjectile(this.player, this.particleSystem);
                this.particleSystem.createExplosion(
                    this.player.x + this.player.width / 2 + this.player.facing * 50,
                    this.player.y + this.player.height / 2,
                    this.player.getCurrentFaceColor()
                );
            }
        }
    },
    
    updateFacing() {
        if (!this.player || !this.enemy) return;
        
        this.player.facing = this.enemy.x > this.player.x ? 1 : -1;
        this.enemy.facing = this.player.x > this.enemy.x ? 1 : -1;
    },
    
    updateTimer(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.timer -= deltaTime / 1000;
        UIManager.updateTimer(this.timer);
        
        if (this.timer <= 0) {
            this.endRound();
        }
    },
    
    checkRoundEnd() {
        if (!this.player || !this.enemy || this.roundEnding) return;
        
        if (this.player.isDead || this.enemy.isDead) {
            this.roundEnding = true;
            setTimeout(() => this.endRound(), 1500);
        }
    },
    
    endRound() {
        if (this.player && this.enemy) {
            if (this.player.isDead && this.enemy.isDead) {
            } else if (this.player.isDead) {
                this.enemyWins++;
            } else if (this.enemy.isDead) {
                this.playerWins++;
            } else {
                if (this.player.health > this.enemy.health) {
                    this.playerWins++;
                } else {
                    this.enemyWins++;
                }
            }
        }
        
        if (this.playerWins >= 2 || this.enemyWins >= 2) {
            this.endGame();
        } else {
            this.round++;
            setTimeout(() => this.startRound(), 2000);
        }
    },
    
    endGame() {
        this.state = 'gameOver';
        const playerWon = this.playerWins >= 2;
        UIManager.showGameOver(playerWon);
        this.stopAutoSave();
        Storage.clear();
    },
    
    update(deltaTime) {
        if (this.state === 'playing') {
            this.handleInput();
            this.updateFacing();
            this.updateTimer(deltaTime);
            
            if (this.player) {
                this.player.update(deltaTime);
            }
            
            if (this.enemy) {
                AIManager.update(this.enemy, this.player, deltaTime);
                this.enemy.update(deltaTime);
            }
            
            this.combatManager.update(deltaTime, this.player, this.enemy, this.particleSystem);
            this.particleSystem.update(deltaTime);
            
            UIManager.updateHealthBars(this.player, this.enemy);
            UIManager.updateEnergyBars(this.player, this.enemy);
            UIManager.updateFaceIndicators(this.player, this.enemy);
            
            this.checkRoundEnd();
        }
        
        Input.endFrame();
    },
    
    render() {
        Renderer.render(this);
    },
    
    gameLoop(currentTime) {
        try {
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            if (this.deltaTime > 100) this.deltaTime = 16;
            
            this.update(this.deltaTime);
            this.render();
            this.updateDebugInfo();
        } catch (e) {
            console.error('Game loop error:', e);
            const debugState = document.getElementById('debug-state');
            if (debugState) debugState.textContent = '错误: ' + e.message;
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    updateDebugInfo() {
        try {
            const stateEl = document.getElementById('debug-state');
            const keysEl = document.getElementById('debug-keys');
            const playerEl = document.getElementById('debug-player');
            const queueEl = document.getElementById('debug-queue');
            
            if (stateEl) stateEl.textContent = this.state;
            
            if (keysEl) {
                const pressedKeys = [];
                const keyMap = {
                    [GameConfig.KEYS.LEFT]: '←',
                    [GameConfig.KEYS.RIGHT]: '→',
                    [GameConfig.KEYS.UP]: '↑',
                    [GameConfig.KEYS.DOWN]: '↓',
                    [GameConfig.KEYS.LIGHT_PALM]: 'J',
                    [GameConfig.KEYS.HEAVY_PALM]: 'K',
                    [GameConfig.KEYS.LIGHT_KICK]: 'U',
                    [GameConfig.KEYS.HEAVY_KICK]: 'I',
                    [GameConfig.KEYS.SWITCH_FACE]: 'L',
                    [GameConfig.KEYS.SPECIAL]: 'O',
                    [GameConfig.KEYS.PAUSE]: 'ESC'
                };
                
                for (const [key, label] of Object.entries(keyMap)) {
                    if (Input.isDown(key)) pressedKeys.push(label);
                }
                
                keysEl.textContent = pressedKeys.length > 0 ? pressedKeys.join(' ') : '无';
            }
            
            if (queueEl && Input.keyDownQueue) {
                const keyLabels = Input.keyDownQueue.map(k => {
                    const map = {
                        [GameConfig.KEYS.LIGHT_PALM]: 'J',
                        [GameConfig.KEYS.HEAVY_PALM]: 'K',
                        [GameConfig.KEYS.LIGHT_KICK]: 'U',
                        [GameConfig.KEYS.HEAVY_KICK]: 'I',
                        [GameConfig.KEYS.UP]: '↑',
                        [GameConfig.KEYS.DOWN]: '↓',
                        [GameConfig.KEYS.LEFT]: '←',
                        [GameConfig.KEYS.RIGHT]: '→'
                    };
                    return map[k] || k;
                });
                queueEl.textContent = keyLabels.join(', ') || '空';
            }
            
            if (playerEl && this.player) {
                playerEl.textContent = `HP:${Math.round(this.player.health)} 能量:${Math.round(this.player.energy)} 攻击:${this.player.isAttacking ? '是' : '否'}`;
            }
        } catch (e) {
        }
    },
    
    saveGame() {
        try {
            if (!this.player || !this.enemy) {
                console.log('Cannot save: player or enemy is null');
                return false;
            }
            const success = Storage.saveGameState(this);
            if (success) {
                console.log('Game saved successfully at', new Date().toLocaleTimeString());
            } else {
                console.error('Failed to save game');
            }
            return success;
        } catch (e) {
            console.error('Save game error:', e);
            return false;
        }
    },
    
    loadSavedGame() {
        try {
            const saved = Storage.loadGameState();
            if (!saved) {
                console.log('No saved game found');
                return;
            }
            
            console.log('Loading saved game:', saved);
            
            const validStates = ['playing', 'paused'];
            if (!validStates.includes(saved.gameState)) {
                console.log('Invalid game state, clearing save');
                Storage.clear();
                return;
            }
            
            const validTypes = ['wusheng', 'hualian', 'danjiao'];
            if (!validTypes.includes(saved.selectedCharacter)) {
                saved.selectedCharacter = 'wusheng';
            }
            
            this.selectedCharacter = saved.selectedCharacter || 'wusheng';
            this.round = Math.min(Math.max(1, saved.round || 1), 3);
            this.playerWins = Math.min(Math.max(0, saved.playerWins || 0), 2);
            this.enemyWins = Math.min(Math.max(0, saved.enemyWins || 0), 2);
            this.timer = Math.min(Math.max(0, saved.timer || GameConfig.ROUND_TIME), GameConfig.ROUND_TIME);
            
            if (saved.enemy && saved.enemy.type && validTypes.includes(saved.enemy.type)) {
                this.enemyCharacter = saved.enemy.type;
            } else {
                const allTypes = ['wusheng', 'hualian', 'danjiao'];
                const availableTypes = allTypes.filter(t => t !== this.selectedCharacter);
                this.enemyCharacter = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }
            
            if (saved.player && typeof saved.player.health === 'number' && saved.player.health > 0) {
                this.player = Character.deserialize(saved.player);
            } else {
                this.player = new Character(this.selectedCharacter, 150, GameConfig.GROUND_Y - 100, 1);
            }
            
            if (saved.enemy && typeof saved.enemy.health === 'number' && saved.enemy.health > 0) {
                this.enemy = Character.deserialize(saved.enemy);
            } else {
                this.enemy = new Character(this.enemyCharacter, 750, GameConfig.GROUND_Y - 100, -1);
            }
            
            UIManager.updateCharacterNames(this.selectedCharacter, this.enemyCharacter);
            UIManager.updateRound(this.round);
            UIManager.updateHealthBars(this.player, this.enemy);
            UIManager.updateEnergyBars(this.player, this.enemy);
            UIManager.updateFaceIndicators(this.player, this.enemy);
            UIManager.updateTimer(this.timer);
            UIManager.hideAllMenus();
            this.state = saved.gameState || 'playing';
            
            if (this.state === 'paused') {
                UIManager.showPauseMenu();
            }
            
            Input.reset();
            this.startAutoSave();
            
            console.log('Game loaded successfully');
        } catch (e) {
            console.error('Load saved game error:', e);
            Storage.clear();
            this.player = null;
            this.enemy = null;
            this.state = 'menu';
            try {
                UIManager.showStartMenu();
            } catch (uiErr) {
                console.error('Error showing start menu:', uiErr);
            }
        }
    },
    
    startAutoSave() {
        this.stopAutoSave();
        this.saveInterval = setInterval(() => {
            if (this.state === 'playing' || this.state === 'paused') {
                this.saveGame();
            }
        }, 3000);
    },
    
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
};

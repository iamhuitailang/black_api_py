const Game = {
    player: null,
    enemy: null,
    gameState: 'menu',
    timer: CONFIG.GAME_TIME,
    frameCount: 0,
    selectedCharacter: 'soldier',
    lastAttackFrame: { player: 0, enemy: 0 },
    saveInterval: null,

    init() {
        console.log('Game.init() called');
        Input.init();
        this.bindEvents();
        this.checkSavedGame();
        
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('click', () => {
                console.log('Canvas clicked - focusing');
                canvas.focus();
            });
            canvas.tabIndex = 1;
        }
    },

    checkSavedGame() {
        try {
            console.log('Checking for saved game...');
            const continueBtn = document.getElementById('continue-btn');
            if (!continueBtn) {
                console.error('Continue button not found!');
                return;
            }
            
            const savedState = Storage.loadGameState();
            if (savedState) {
                continueBtn.style.display = 'inline-block';
                console.log('Saved game FOUND, showing continue button');
            } else {
                continueBtn.style.display = 'none';
                console.log('No saved game, hiding continue button');
            }
        } catch (e) {
            console.error('Error checking saved game:', e);
            const btn = document.getElementById('continue-btn');
            if (btn) btn.style.display = 'none';
        }
    },

    bindEvents() {
        console.log('Binding events...');
        
        document.getElementById('start-btn').addEventListener('click', () => {
            console.log('Start button clicked');
            this.startGame(false);
        });

        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                console.log('Continue button clicked');
                this.startGame(true);
            });
            console.log('Continue button bound');
        }

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.character;
            });
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.quitGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            } else if (e.key === 'Escape' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
    },

    startGame(loadSave = false) {
        if (loadSave) {
            const savedState = Storage.loadGameState();
            if (savedState) {
                this.loadGameState(savedState);
            } else {
                loadSave = false;
            }
        }
        
        if (!loadSave) {
            this.player = new Character(this.selectedCharacter, 150, true);
            const enemyTypes = ['soldier', 'girl', 'warrior'];
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            this.enemy = new Character(enemyType, 900, false);
            this.timer = CONFIG.GAME_TIME;
        }

        AI.reset();
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        setTimeout(() => {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.focus();
                console.log('Canvas auto-focused');
            }
        }, 100);
        
        this.saveCurrentState();
        this.startAutoSave();
        this.gameLoop();
    },

    pauseGame() {
        if (this.gameState !== 'playing') return;
        this.saveCurrentState();
        this.gameState = 'paused';
        this.showScreen('pause-screen', true);
    },

    resumeGame() {
        if (this.gameState !== 'paused') return;
        this.gameState = 'playing';
        this.hideOverlay();
        
        setTimeout(() => {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.focus();
            }
        }, 100);
        this.gameLoop();
    },

    restartGame() {
        this.stopAutoSave();
        Storage.clear();
        
        this.player = new Character(this.selectedCharacter, 150, true);
        const enemyTypes = ['soldier', 'girl', 'warrior'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.enemy = new Character(enemyType, 900, false);
        this.timer = CONFIG.GAME_TIME;
        
        AI.reset();
        this.gameState = 'playing';
        this.showScreen('game-screen');
        
        this.saveCurrentState();
        this.startAutoSave();
        this.gameLoop();
    },

    quitGame() {
        this.saveCurrentState();
        this.stopAutoSave();
        this.gameState = 'menu';
        this.showScreen('start-screen');
        this.checkSavedGame();
    },

    endGame(winner) {
        this.stopAutoSave();
        Storage.clear();
        this.gameState = 'ended';
        
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        if (winner === 'player') {
            resultTitle.textContent = '🎉 胜利！';
            resultMessage.textContent = '恭喜你击败了对手！今晚吃平底锅烤肉！';
        } else {
            resultTitle.textContent = '💀 失败';
            resultMessage.textContent = '你被击败了...下次再努力！';
        }
        
        this.showScreen('result-screen', true);
    },

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.update();
        this.render();
        this.updateUI();

        this.frameCount++;
        if (this.frameCount === 1) {
            console.log('Game loop started!');
        }
        requestAnimationFrame(() => this.gameLoop());
    },

    update() {
        Input.update();
        
        if (this.frameCount % 60 === 0) {
            console.log('Update called. Pressed keys:', Array.from(Input.pressedKeys));
        }
        
        Input.handlePlayerInput(this.player);
        AI.update(this.enemy, this.player);

        this.player.update(this.enemy);
        this.enemy.update(this.player);

        this.checkAttacks();
        Renderer.updateEffects();

        if (this.frameCount % 60 === 0) {
            this.timer--;
            if (this.timer <= 0) {
                this.checkWinnerByHealth();
            }
        }

        this.checkOutOfBounds();

        if (this.frameCount % 300 === 0) {
            this.saveCurrentState();
        }
    },

    checkAttacks() {
        if (this.player.state === 'attack' || this.player.specialActive) {
            const attackFrame = this.player.attackFrame || (this.player.specialActive ? 30 : 0);
            if (attackFrame > 5 && attackFrame < 25 && attackFrame !== this.lastAttackFrame.player) {
                if (Physics.checkAttackHit(this.player, this.enemy)) {
                    const attackType = this.player.specialActive ? 'special' : 
                                      (this.player.attackFrame > 20 ? 'heavy' : 'light');
                    let damage;
                    if (this.player.specialActive) {
                        damage = this.enemy.takeDamage({
                            damage: this.player.specialDamage,
                            knockback: CONFIG.KNOCKBACK_FORCE * 2,
                            type: 'special'
                        }, this.player.x);
                    } else {
                        damage = this.enemy.takeDamage({
                            damage: this.player.attack,
                            knockback: CONFIG.KNOCKBACK_FORCE,
                            type: attackType
                        }, this.player.x);
                    }
                    this.player.gainSpecial();
                    Renderer.addHitEffect(
                        this.enemy.x + this.enemy.width / 2,
                        this.enemy.y + this.enemy.height / 2,
                        attackType
                    );
                }
                this.lastAttackFrame.player = attackFrame;
            }
        }

        if (this.enemy.state === 'attack' || this.enemy.specialActive) {
            const attackFrame = this.enemy.attackFrame || (this.enemy.specialActive ? 30 : 0);
            if (attackFrame > 5 && attackFrame < 25 && attackFrame !== this.lastAttackFrame.enemy) {
                if (Physics.checkAttackHit(this.enemy, this.player)) {
                    const attackType = this.enemy.specialActive ? 'special' : 
                                      (this.enemy.attackFrame > 20 ? 'heavy' : 'light');
                    let damage;
                    if (this.enemy.specialActive) {
                        damage = this.player.takeDamage({
                            damage: this.enemy.specialDamage,
                            knockback: CONFIG.KNOCKBACK_FORCE * 2,
                            type: 'special'
                        }, this.enemy.x);
                    } else {
                        damage = this.player.takeDamage({
                            damage: this.enemy.attack,
                            knockback: CONFIG.KNOCKBACK_FORCE,
                            type: attackType
                        }, this.enemy.x);
                    }
                    this.enemy.gainSpecial();
                    Renderer.addHitEffect(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height / 2,
                        attackType
                    );
                }
                this.lastAttackFrame.enemy = attackFrame;
            }
        }
    },

    checkOutOfBounds() {
        if (this.player.isOutOfBounds()) {
            this.endGame('enemy');
        } else if (this.enemy.isOutOfBounds()) {
            this.endGame('player');
        }

        if (this.player.health <= 0) {
            this.endGame('enemy');
        } else if (this.enemy.health <= 0) {
            this.endGame('player');
        }
    },

    checkWinnerByHealth() {
        if (this.player.health > this.enemy.health) {
            this.endGame('player');
        } else if (this.enemy.health > this.player.health) {
            this.endGame('enemy');
        } else {
            this.timer = 30;
        }
    },

    render() {
        Renderer.renderGame(this.player, this.enemy);
    },

    updateUI() {
        document.getElementById('timer').textContent = this.timer;

        const playerHealthBar = document.getElementById('player-health');
        const enemyHealthBar = document.getElementById('enemy-health');
        const playerSpecialBar = document.getElementById('player-special');
        const enemySpecialBar = document.getElementById('enemy-special');

        playerHealthBar.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        enemyHealthBar.style.width = `${(this.enemy.health / this.enemy.maxHealth) * 100}%`;
        playerSpecialBar.style.width = `${(this.player.special / this.player.maxSpecial) * 100}%`;
        enemySpecialBar.style.width = `${(this.enemy.special / this.enemy.maxSpecial) * 100}%`;
    },

    showScreen(screenId, isOverlay = false) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        if (isOverlay) {
            document.getElementById('game-screen').classList.add('active');
        }
        document.getElementById(screenId).classList.add('active');
    },

    hideOverlay() {
        document.querySelectorAll('.screen.overlay').forEach(screen => {
            screen.classList.remove('active');
        });
    },

    saveCurrentState() {
        try {
            const state = {
                playerCharacter: this.player.type,
                enemyCharacter: this.enemy.type,
                playerState: this.player.getState(),
                enemyState: this.enemy.getState(),
                timer: this.timer,
                selectedCharacter: this.selectedCharacter
            };
            Storage.saveGameState(state);
            console.log('Game saved, timer:', state.timer, 'player health:', this.player.health);
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    },

    loadGameState(state) {
        try {
            console.log('Loading game state...');
            this.player = new Character(state.playerCharacter, 0, true);
            this.enemy = new Character(state.enemyCharacter, 0, false);
            
            this.player.loadState(state.playerState);
            this.enemy.loadState(state.enemyState);
            
            this.timer = state.timer;
            this.selectedCharacter = state.selectedCharacter;
            console.log('Game loaded. Player at x:', this.player.x, 'health:', this.player.health);
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    },

    startAutoSave() {
        this.saveInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.saveCurrentState();
            }
        }, 5000);
    },

    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
};
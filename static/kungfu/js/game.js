const Game = {
    state: 'menu',
    player: null,
    opponent: null,
    timeLeft: 0,
    round: 1,
    lastTime: 0,
    animationId: null,
    saveInterval: null,

    init() {
        try {
            Renderer.init('game-canvas');
            Input.init();
            UI.init();

            UI.onStartGame = (charId) => this.startNewGame(charId);
            UI.onContinueGame = () => this.continueGame();
            UI.onResume = () => this.resume();
            UI.onRestart = () => this.restart();
            UI.onQuit = () => this.quit();
            UI.onPlayAgain = () => this.restart();
            UI.onBackToMenu = () => this.backToMenu();

            UI.selectCharacter('monk');
            this.renderMenu();

            const canvas = document.getElementById('game-canvas');
            canvas.addEventListener('click', () => {
                canvas.focus();
                window.focus();
            });
            canvas.tabIndex = 0;

            window.addEventListener('keydown', (e) => {
                if (this.state === 'playing' && this.player) {
                    const key = e.key.toLowerCase();
                    if (key === 'j' || key === 'k' || key === 'u' || key === 'i' || key === 'l') {
                        console.log('全局按键检测:', key, '当前状态:', this.player.state, '可行动:', this.player.canAct());
                        
                        if (!e.repeat) {
                            const attackMap = {
                                'j': 'lightPunch',
                                'k': 'heavyPunch',
                                'u': 'lightKick',
                                'i': 'heavyKick',
                                'l': 'ultimate'
                            };
                            if (attackMap[key]) {
                                const result = this.player.attack(attackMap[key]);
                                console.log('直接攻击结果:', result);
                                e.preventDefault();
                            }
                        }
                    }
                }
            });

            console.log('功夫街头游戏初始化完成');
        } catch (e) {
            console.error('游戏初始化失败:', e);
            alert('游戏初始化失败，请刷新页面重试');
        }
    },

    startNewGame(charId) {
        try {
            const playerConfig = GameData.characters[charId];
            
            const opponentIds = ['monk', 'boxer', 'swallow'].filter(id => id !== charId);
            const opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)];
            const opponentConfig = GameData.characters[opponentId];

            this.player = new Character(playerConfig, true);
            this.opponent = new Character(opponentConfig, false);

            this.timeLeft = GameData.gameConfig.roundTime;
            this.round = 1;

            UI.hideMainMenu();
            this.state = 'playing';
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            this.lastTime = performance.now();
            this.startGameLoop();
            this.startAutoSave();

            window.focus();
            document.body.focus();
            const canvas = document.getElementById('game-canvas');
            canvas.focus();
        } catch (e) {
            console.error('开始游戏失败:', e);
            alert('游戏启动失败，请刷新页面重试');
        }
    },

    continueGame() {
        try {
            const savedState = Storage.load();
            if (savedState) {
                const playerConfig = GameData.characters[savedState.playerId];
                const opponentConfig = GameData.characters[savedState.opponentId];

                this.player = new Character(playerConfig, true);
                this.opponent = new Character(opponentConfig, false);

                this.player.deserialize(savedState.player);
                this.opponent.deserialize(savedState.opponent);

                this.timeLeft = savedState.timeLeft;
                this.round = savedState.round;

                UI.hideMainMenu();
                this.state = 'playing';
                
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                }
                this.lastTime = performance.now();
                this.startGameLoop();
                this.startAutoSave();
                
                window.focus();
                document.body.focus();
            }
        } catch (e) {
            console.error('继续游戏失败:', e);
            alert('继续游戏失败，将开始新游戏');
            this.startNewGame('monk');
        }
    },

    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    },

    gameLoop(currentTime = performance.now()) {
        if (this.state !== 'playing') return;

        try {
            const deltaTime = Math.min(currentTime - this.lastTime, 50);
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();
        } catch (e) {
            console.error('游戏循环错误:', e);
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(deltaTime) {
        const inputDebug = Input.getDebugInfo();
        const input = Input.getPlayerInput();
        
        this.lastInputDebug = {
            ...inputDebug,
            inputResult: {
                lightPunch: input.lightPunch,
                heavyPunch: input.heavyPunch,
                lightKick: input.lightKick,
                heavyKick: input.heavyKick,
                ultimate: input.ultimate
            }
        };

        if (input.pause) {
            this.pause();
            return;
        }

        this.handlePlayerInput(input);

        Combat.updateAI(this.opponent, this.player, deltaTime, this.state);

        this.player.update(deltaTime, this.opponent);
        this.opponent.update(deltaTime, this.player);

        Combat.resolveAttacks(this.player, this.opponent);
        Combat.resolveAttacks(this.opponent, this.player);

        this.timeLeft -= deltaTime / 1000;

        this.checkGameOver();
        
        Input.update();
    },

    handlePlayerInput(input) {
        let attacked = false;

        if (input.lightPunch) {
            attacked = this.player.attack('lightPunch');
            if (!attacked) {
                console.log('轻拳攻击失败，状态:', this.player.state, '能量:', this.player.energy);
            }
        } else if (input.heavyPunch) {
            attacked = this.player.attack('heavyPunch');
            if (!attacked) {
                console.log('重拳攻击失败，状态:', this.player.state, '能量:', this.player.energy);
            }
        } else if (input.lightKick) {
            attacked = this.player.attack('lightKick');
            if (!attacked) {
                console.log('轻脚攻击失败，状态:', this.player.state, '能量:', this.player.energy);
            }
        } else if (input.heavyKick) {
            attacked = this.player.attack('heavyKick');
            if (!attacked) {
                console.log('重脚攻击失败，状态:', this.player.state, '能量:', this.player.energy);
            }
        } else if (input.ultimate) {
            attacked = this.player.attack('ultimate');
            if (!attacked) {
                console.log('绝学攻击失败，状态:', this.player.state, '能量:', this.player.energy);
            }
        }

        if (!attacked) {
            if (input.left) {
                this.player.move(-1);
            } else if (input.right) {
                this.player.move(1);
            } else {
                this.player.stopMove();
            }

            if (input.up) {
                this.player.jump();
            }

            this.player.block(input.down);
        }
    },

    checkGameOver() {
        if (this.player.health <= 0 || this.opponent.health <= 0 || this.timeLeft <= 0) {
            this.endGame();
            return true;
        }
        return false;
    },

    endGame() {
        this.state = 'gameover';
        cancelAnimationFrame(this.animationId);
        this.stopAutoSave();

        const playerWon = this.player.health > this.opponent.health;
        UI.showGameOver(playerWon, this.player.health, this.opponent.health);

        Storage.clear();
    },

    render() {
        Renderer.clear();
        Renderer.drawBackground();
        Renderer.drawCharacter(this.player);
        Renderer.drawCharacter(this.opponent);
        
        let debugInfo = null;
        if (this.lastInputDebug) {
            debugInfo = {
                keys: this.lastInputDebug.keys,
                justPressed: this.lastInputDebug.justPressed,
                inputResult: this.lastInputDebug.inputResult,
                playerState: this.player.state,
                playerEnergy: this.player.energy,
                canAct: this.player.canAct()
            };
        }
        
        Renderer.drawUI(this.player, this.opponent, this.timeLeft, debugInfo);
    },

    renderMenu() {
        Renderer.clear();
        Renderer.drawBackground();
    },

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            cancelAnimationFrame(this.animationId);
            UI.showPauseMenu();
            this.saveGame();
        }
    },

    resume() {
        if (this.state === 'paused') {
            UI.hidePauseMenu();
            this.state = 'playing';
            this.lastTime = performance.now();
            this.startGameLoop();
        }
    },

    restart() {
        UI.hidePauseMenu();
        UI.hideGameOver();
        this.stopAutoSave();
        cancelAnimationFrame(this.animationId);

        const playerId = this.player.id;
        const opponentId = this.opponent.id;

        const playerConfig = GameData.characters[playerId];
        const opponentConfig = GameData.characters[opponentId];

        this.player = new Character(playerConfig, true);
        this.opponent = new Character(opponentConfig, false);

        this.timeLeft = GameData.gameConfig.roundTime;
        this.round = 1;

        this.state = 'playing';
        this.lastTime = performance.now();
        this.startGameLoop();
        this.startAutoSave();
    },

    quit() {
        this.state = 'menu';
        cancelAnimationFrame(this.animationId);
        this.stopAutoSave();
        this.saveGame();
        UI.hidePauseMenu();
        UI.showMainMenu();
        this.renderMenu();
    },

    backToMenu() {
        this.state = 'menu';
        cancelAnimationFrame(this.animationId);
        this.stopAutoSave();
        UI.hideGameOver();
        UI.showMainMenu();
        this.renderMenu();
    },

    saveGame() {
        if (this.state === 'playing' || this.state === 'paused') {
            const gameState = {
                playerId: this.player.id,
                opponentId: this.opponent.id,
                player: this.player.serialize(),
                opponent: this.opponent.serialize(),
                timeLeft: this.timeLeft,
                round: this.round,
                state: this.state
            };
            Storage.save(gameState);
        }
    },

    startAutoSave() {
        this.saveInterval = setInterval(() => {
            this.saveGame();
        }, 5000);
    },

    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
};

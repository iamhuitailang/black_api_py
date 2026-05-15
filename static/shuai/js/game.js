class Game {
    constructor() {
        this.state = GAME_STATE.MENU;
        this.selectedCharacter = 'tiger';
        
        this.player = null;
        this.enemy = null;
        
        this.timeRemaining = CONFIG.GAME_DURATION;
        this.lastTime = 0;
        
        this.playerPinCount = 0;
        this.enemyPinCount = 0;
        
        this.isPinned = false;
        this.pinningPlayer = null;
        this.pinTimer = 0;
        
        this.attackPressed = {
            light: false,
            heavy: false,
            throw: false,
            pin: false
        };
    }
    
    init() {
        const settings = Storage.loadSettings();
        this.selectedCharacter = settings.selectedCharacter || 'tiger';
        
        this.updateContinueButton();
        this.updateCharacterSelection();
    }
    
    updateContinueButton() {
        const data = Storage.loadGame();
        const hasGameSave = data && data.type === 'game_state';
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.style.display = hasGameSave ? 'block' : 'none';
        }
    }
    
    updateCharacterSelection() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.char === this.selectedCharacter) {
                card.classList.add('selected');
            }
        });
    }
    
    selectCharacter(charId) {
        this.selectedCharacter = charId;
        this.updateCharacterSelection();
        Storage.saveSettings({ selectedCharacter: charId });
    }
    
    startGame(loadSave = false) {
        let savedData = null;
        if (loadSave) {
            savedData = Storage.loadGame();
        }
        
        const enemyChars = ['tiger', 'leopard', 'rock'].filter(c => c !== this.selectedCharacter);
        const enemyChar = enemyChars[Math.floor(Math.random() * enemyChars.length)];
        
        this.player = new Character(this.selectedCharacter, 200, true);
        this.enemy = new Character(enemyChar, 900, false);
        
        if (savedData && loadSave && savedData.type === 'game_state') {
            this.player.health = savedData.playerHealth !== undefined ? savedData.playerHealth : this.player.maxHealth;
            this.enemy.health = savedData.enemyHealth !== undefined ? savedData.enemyHealth : this.enemy.maxHealth;
            this.playerPinCount = savedData.playerPinCount !== undefined ? savedData.playerPinCount : 0;
            this.enemyPinCount = savedData.enemyPinCount !== undefined ? savedData.enemyPinCount : 0;
            this.timeRemaining = savedData.timeRemaining !== undefined ? savedData.timeRemaining : CONFIG.GAME_DURATION;
            if (savedData.playerX !== undefined) this.player.x = savedData.playerX;
            if (savedData.enemyX !== undefined) this.enemy.x = savedData.enemyX;
            if (savedData.playerState !== undefined) this.player.state = savedData.playerState;
            if (savedData.enemyState !== undefined) this.enemy.state = savedData.enemyState;
            this.isPinned = savedData.isPinned || false;
            this.pinTimer = savedData.pinTimer || 0;
        } else {
            this.timeRemaining = CONFIG.GAME_DURATION;
            this.playerPinCount = 0;
            this.enemyPinCount = 0;
            this.isPinned = false;
            this.pinningPlayer = null;
            this.pinTimer = 0;
        }
        
        AI.reset();
        
        this.state = GAME_STATE.PLAYING;
        this.showScreen('game-screen');
        
        document.getElementById('pause-btn').style.display = 'block';
        
        this.updateHUD();
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    continueGame() {
        this.startGame(true);
    }
    
    gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.timeRemaining -= deltaTime / 1000;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }
        
        this.handleInput();
        this.player.update(deltaTime, this.enemy);
        AI.update(deltaTime, this.enemy, this.player);
        this.enemy.update(deltaTime, this.player);
        
        this.updatePinState(deltaTime);
        
        this.checkWinCondition();
        
        this.updateHUD();
        
        Storage.saveGameState(this);
    }
    
    handleInput() {
        if (this.player.state === PLAYER_STATE.PINNED) {
            if (Input.isEscape()) {
                this.player.escape();
                if (this.player.state !== PLAYER_STATE.PINNED) {
                    this.isPinned = false;
                    this.pinningPlayer = null;
                    this.pinTimer = 0;
                }
            }
            return;
        }
        
        const movement = Input.getMovement();
        this.player.move(movement);
        
        if (Input.isJump() && !this.jumpPressed) {
            this.player.jump();
            this.jumpPressed = true;
        } else if (!Input.isJump()) {
            this.jumpPressed = false;
        }
        
        this.player.crouch(Input.isCrouch());
        
        if (Input.isLightAttack() && !this.attackPressed.light) {
            this.player.attack('LIGHT', this.enemy);
            this.attackPressed.light = true;
        } else if (!Input.isLightAttack()) {
            this.attackPressed.light = false;
        }
        
        if (Input.isHeavyAttack() && !this.attackPressed.heavy) {
            this.player.attack('HEAVY', this.enemy);
            this.attackPressed.heavy = true;
        } else if (!Input.isHeavyAttack()) {
            this.attackPressed.heavy = false;
        }
        
        if (Input.isThrow() && !this.attackPressed.throw) {
            this.player.attack('THROW', this.enemy);
            this.attackPressed.throw = true;
        } else if (!Input.isThrow()) {
            this.attackPressed.throw = false;
        }
        
        if (Input.isPin() && !this.attackPressed.pin) {
            if (this.player.pin(this.enemy)) {
                this.isPinned = true;
                this.pinningPlayer = this.player;
                this.pinTimer = 0;
                this.playerPinCount++;
            }
            this.attackPressed.pin = true;
        } else if (!Input.isPin()) {
            this.attackPressed.pin = false;
        }
    }
    
    updatePinState(deltaTime) {
        if (this.player.state === PLAYER_STATE.PINNING || this.enemy.state === PLAYER_STATE.PINNING) {
            if (!this.isPinned) {
                this.isPinned = true;
                this.pinningPlayer = this.player.state === PLAYER_STATE.PINNING ? this.player : this.enemy;
                this.pinTimer = 0;
            }
            
            this.pinTimer += deltaTime / 1000;
            
            const requiredTime = this.pinningPlayer.pinTime;
            if (this.pinTimer >= requiredTime) {
                this.endGame(this.pinningPlayer === this.player ? 'pin' : 'pinned');
            }
        } else {
            this.isPinned = false;
            this.pinningPlayer = null;
            this.pinTimer = 0;
        }
    }
    
    checkWinCondition() {
        if (this.enemy.health <= 0) {
            this.endGame('ko');
        } else if (this.player.health <= 0) {
            this.endGame('ko_lose');
        }
    }
    
    endGame(reason = 'time') {
        this.state = GAME_STATE.GAME_OVER;
        
        let playerWins = false;
        let message = '';
        
        switch (reason) {
            case 'ko':
                playerWins = true;
                message = 'KO! 你赢得了比赛！';
                break;
            case 'ko_lose':
                playerWins = false;
                message = '被KO! 你输了比赛...';
                break;
            case 'pin':
                playerWins = true;
                message = '压制成功！你赢得了比赛！';
                break;
            case 'pinned':
                playerWins = false;
                message = '被压制！你输了比赛...';
                break;
            case 'time':
                if (this.player.health > this.enemy.health) {
                    playerWins = true;
                    message = '时间到！你以血量优势获胜！';
                } else if (this.player.health < this.enemy.health) {
                    playerWins = false;
                    message = '时间到！对手以血量优势获胜...';
                } else {
                    if (this.playerPinCount > this.enemyPinCount) {
                        playerWins = true;
                        message = '时间到！你以压制次数优势获胜！';
                    } else {
                        playerWins = false;
                        message = '时间到！平局...';
                    }
                }
                break;
        }
        
        Storage.clearGame();
        this.showGameOver(playerWins, message);
    }
    
    updateHUD() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        document.getElementById('game-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('player-name').textContent = this.player.name;
        document.getElementById('enemy-name').textContent = this.enemy.name;
        
        const playerHealthPercent = (this.player.health / this.player.maxHealth) * 100;
        const enemyHealthPercent = (this.enemy.health / this.enemy.maxHealth) * 100;
        
        document.getElementById('player-health').style.width = `${playerHealthPercent}%`;
        document.getElementById('enemy-health').style.width = `${enemyHealthPercent}%`;
        
        document.getElementById('player-pins').textContent = this.playerPinCount;
        document.getElementById('enemy-pins').textContent = this.enemyPinCount;
        
        const pinTimerEl = document.getElementById('pin-timer');
        if (this.isPinned) {
            pinTimerEl.style.display = 'block';
            pinTimerEl.textContent = `压制: ${this.pinTimer.toFixed(1)}s`;
        } else {
            pinTimerEl.style.display = 'none';
        }
    }
    
    render() {
        Renderer.render(this);
    }
    
    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            document.getElementById('pause-menu').classList.add('active');
            Storage.saveGameState(this);
        }
    }
    
    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            document.getElementById('pause-menu').classList.remove('active');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    restart() {
        document.getElementById('pause-menu').classList.remove('active');
        document.getElementById('game-over').classList.remove('active');
        this.startGame();
    }
    
    quitToMenu() {
        this.state = GAME_STATE.MENU;
        document.getElementById('pause-menu').classList.remove('active');
        document.getElementById('game-over').classList.remove('active');
        document.getElementById('pause-btn').style.display = 'none';
        this.showScreen('main-menu');
        this.updateContinueButton();
    }
    
    showGameOver(playerWins, message) {
        document.getElementById('result-title').textContent = playerWins ? '🏆 胜利！' : '💀 失败...';
        document.getElementById('result-message').textContent = message;
        document.getElementById('final-player-health').textContent = Math.ceil(this.player.health);
        document.getElementById('final-enemy-health').textContent = Math.ceil(this.enemy.health);
        document.getElementById('final-player-pins').textContent = this.playerPinCount;
        document.getElementById('final-enemy-pins').textContent = this.enemyPinCount;
        document.getElementById('game-over').classList.add('active');
        document.getElementById('pause-btn').style.display = 'none';
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

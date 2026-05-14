class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager();
        this.storageManager = new StorageManager();
        
        this.state = GameData.gameStates.MENU;
        this.previousState = null;
        
        this.player1 = null;
        this.player2 = null;
        this.aiController = null;
        
        this.timer = 99;
        this.timerInterval = null;
        
        this.lastTime = 0;
        this.animationFrameId = null;
        
        this.selectedCharacter = 'ryu';
        this.groundY = 600;
        
        this.autoSaveInterval = null;
        this.minCharacterDistance = 80;
    }

    preventOverlap() {
        if (!this.player1 || !this.player2) return;

        const distance = this.player2.x - this.player1.x;
        const absDistance = Math.abs(distance);

        if (absDistance < this.minCharacterDistance) {
            const overlap = this.minCharacterDistance - absDistance;
            const direction = distance > 0 ? 1 : -1;
            
            this.player1.x -= overlap * 0.5 * direction;
            this.player2.x += overlap * 0.5 * direction;

            this.player1.x = Math.max(0, Math.min(1280 - this.player1.width, this.player1.x));
            this.player2.x = Math.max(0, Math.min(1280 - this.player2.width, this.player2.x));
        }
    }

    init() {
        this.setupEventListeners();
        this.setupUnloadHandler();
        this.loadSavedGame();
        this.gameLoop();
    }

    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.state === GameData.gameStates.PLAYING) {
                this.saveGameState();
                console.log('Game saved before unload');
            }
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => 
                    c.classList.remove('selected')
                );
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.character;
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
    }

    startGame() {
        this.player1 = new Character(this.selectedCharacter, true, 200);
        
        const aiCharacters = ['ryu', 'ken', 'chunli'].filter(c => c !== this.selectedCharacter);
        const aiCharacter = aiCharacters[Math.floor(Math.random() * aiCharacters.length)];
        this.player2 = new Character(aiCharacter, false, 1000);
        
        this.aiController = new AIController(this.player2);
        this.timer = 99;
        this.state = GameData.gameStates.PLAYING;
        
        this.showScreen(null);
        document.getElementById('pause-btn').style.display = 'block';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('controls-hint').style.display = 'flex';
        
        this.updateUI();
        this.startTimer();
        this.startAutoSave();
        this.saveGameState();
        console.log('Game started and saved!');
    }

    pauseGame() {
        if (this.state === GameData.gameStates.PLAYING) {
            this.previousState = this.state;
            this.state = GameData.gameStates.PAUSED;
            this.stopTimer();
            this.showScreen('pause-screen');
            this.saveGameState();
        }
    }

    resumeGame() {
        if (this.state === GameData.gameStates.PAUSED) {
            this.state = GameData.gameStates.PLAYING;
            this.showScreen(null);
            this.startTimer();
        }
    }

    restartGame() {
        this.clearGameState();
        this.startGame();
    }

    quitToMenu() {
        this.state = GameData.gameStates.MENU;
        this.stopTimer();
        this.stopAutoSave();
        this.clearGameState();
        this.showScreen('start-screen');
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('controls-hint').style.display = 'none';
    }

    gameOver(playerWon) {
        this.state = GameData.gameStates.GAME_OVER;
        this.stopTimer();
        this.stopAutoSave();
        
        const resultText = document.getElementById('result-text');
        resultText.textContent = playerWon ? '胜利!' : '失败!';
        
        this.showScreen('game-over-screen');
        this.clearGameState();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        if (screenId) {
            document.getElementById(screenId).classList.add('active');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.state === GameData.gameStates.PLAYING) {
                this.timer--;
                if (this.timer <= 0) {
                    const playerWon = this.player1.health > this.player2.health;
                    this.gameOver(playerWon);
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.state === GameData.gameStates.PLAYING) {
                this.saveGameState();
            }
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    saveGameState() {
        const gameState = {
            state: this.state,
            player1: this.player1 ? this.player1.getState() : null,
            player2: this.player2 ? this.player2.getState() : null,
            timer: this.timer,
            selectedCharacter: this.selectedCharacter
        };
        console.log('Saving game state:', gameState);
        this.storageManager.saveGameState(gameState);
    }

    loadSavedGame() {
        const savedState = this.storageManager.loadGameState();
        console.log('Loading saved state:', savedState);
        
        if (savedState && savedState.state === GameData.gameStates.PLAYING && savedState.player1 && savedState.player2) {
            console.log('Restoring game from localStorage...');
            
            this.selectedCharacter = savedState.selectedCharacter;
            this.player1 = new Character(savedState.player1.id, true, savedState.player1.x);
            this.player1.loadState(savedState.player1);
            
            this.player2 = new Character(savedState.player2.id, false, savedState.player2.x);
            this.player2.loadState(savedState.player2);
            
            this.aiController = new AIController(this.player2);
            this.timer = savedState.timer;
            this.state = GameData.gameStates.PLAYING;
            
            this.showScreen(null);
            document.getElementById('pause-btn').style.display = 'block';
            document.getElementById('hud').style.display = 'flex';
            document.getElementById('controls-hint').style.display = 'flex';
            
            this.updateUI();
            this.startTimer();
            this.startAutoSave();
            
            const card = document.querySelector(`[data-character="${this.selectedCharacter}"]`);
            if (card) {
                document.querySelectorAll('.character-card').forEach(c => 
                    c.classList.remove('selected')
                );
                card.classList.add('selected');
            }
            
            console.log('Game restored successfully!');
        } else {
            console.log('No valid saved game found.');
        }
    }

    updateUI() {
        if (this.player1 && this.player2) {
            const healthBar1 = document.querySelector('.player1 .health-bar');
            const healthBar2 = document.querySelector('.player2 .health-bar');
            const timerEl = document.querySelector('.timer');
            
            const health1Percent = (this.player1.health / this.player1.maxHealth) * 100;
            const health2Percent = (this.player2.health / this.player2.maxHealth) * 100;
            
            healthBar1.style.width = health1Percent + '%';
            healthBar2.style.width = health2Percent + '%';
            
            if (health1Percent > 50) {
                healthBar1.style.background = 'linear-gradient(180deg, #00FF00, #00CC00)';
            } else if (health1Percent > 25) {
                healthBar1.style.background = 'linear-gradient(180deg, #FFFF00, #CCAA00)';
            } else {
                healthBar1.style.background = 'linear-gradient(180deg, #FF0000, #CC0000)';
            }
            
            if (health2Percent > 50) {
                healthBar2.style.background = 'linear-gradient(180deg, #00FF00, #00CC00)';
            } else if (health2Percent > 25) {
                healthBar2.style.background = 'linear-gradient(180deg, #FFFF00, #CCAA00)';
            } else {
                healthBar2.style.background = 'linear-gradient(180deg, #FF0000, #CC0000)';
            }
            
            timerEl.textContent = this.timer;
        }
    }

    clearGameState() {
        this.storageManager.clearGameState();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === GameData.gameStates.PLAYING) {
            this.handleInput();
            this.update(deltaTime);
            this.updateUI();
        }

        this.render();

        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    handleInput() {
        const direction = this.inputManager.getDirection();
        
        this.player1.stopMoving();
        
        if (direction === 'left') {
            this.player1.moveLeft();
        } else if (direction === 'right') {
            this.player1.moveRight();
        } else if (direction === 'down') {
            this.player1.crouch();
        }

        if (this.inputManager.consumeKeyPress('KeyA')) {
            this.player1.attack('lightPunch');
        }
        if (this.inputManager.consumeKeyPress('KeyS')) {
            this.player1.attack('heavyPunch');
        }
        if (this.inputManager.consumeKeyPress('KeyD')) {
            this.player1.attack('lightKick');
        }
        if (this.inputManager.consumeKeyPress('KeyF')) {
            this.player1.attack('heavyKick');
        }

        if (this.inputManager.consumeKeyPress('KeyG') && this.player1.moves[0]) {
            this.player1.specialMove(this.player1.moves[0]);
        }
        if (this.inputManager.consumeKeyPress('KeyH') && this.player1.moves[1]) {
            this.player1.specialMove(this.player1.moves[1]);
        }
        if (this.inputManager.consumeKeyPress('KeyJ') && this.player1.moves[2]) {
            this.player1.specialMove(this.player1.moves[2]);
        }
    }

    update(deltaTime) {
        this.aiController.update(deltaTime, this.player1, this.inputManager);

        this.player1.update(deltaTime, this.player2, this.groundY);
        this.player2.update(deltaTime, this.player1, this.groundY);

        this.player1.applyPosition();
        this.player2.applyPosition();

        this.preventOverlap();

        if (this.player1.x < this.player2.x) {
            this.player1.facingRight = true;
            this.player2.facingRight = false;
        } else {
            this.player1.facingRight = false;
            this.player2.facingRight = true;
        }

        if (this.player1.health <= 0) {
            this.gameOver(false);
        } else if (this.player2.health <= 0) {
            this.gameOver(true);
        }
    }

    updateUI() {
        if (this.player1 && this.player2) {
            const healthBar1 = document.querySelector('.player1 .health-bar');
            const healthBar2 = document.querySelector('.player2 .health-bar');
            const timerEl = document.querySelector('.timer');
            
            const health1Percent = (this.player1.health / this.player1.maxHealth) * 100;
            const health2Percent = (this.player2.health / this.player2.maxHealth) * 100;
            
            healthBar1.style.width = health1Percent + '%';
            healthBar2.style.width = health2Percent + '%';
            
            if (health1Percent > 50) {
                healthBar1.style.background = 'linear-gradient(180deg, #00FF00, #00CC00)';
            } else if (health1Percent > 25) {
                healthBar1.style.background = 'linear-gradient(180deg, #FFFF00, #CCAA00)';
            } else {
                healthBar1.style.background = 'linear-gradient(180deg, #FF0000, #CC0000)';
            }
            
            if (health2Percent > 50) {
                healthBar2.style.background = 'linear-gradient(180deg, #00FF00, #00CC00)';
            } else if (health2Percent > 25) {
                healthBar2.style.background = 'linear-gradient(180deg, #FFFF00, #CCAA00)';
            } else {
                healthBar2.style.background = 'linear-gradient(180deg, #FF0000, #CC0000)';
            }
            
            timerEl.textContent = this.timer;
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();

        if (this.player1 && this.player2) {
            this.renderer.drawCharacter(this.player1);
            this.renderer.drawCharacter(this.player2);
            this.updateUI();
        }
    }
}
const Game = {
    state: GameConfig.GAME_STATES.MENU,
    round: 1,
    winStreak: 0,
    player: null,
    opponent: null,
    lastTime: 0,
    animationId: null,
    saveInterval: null,
    
    init() {
        Input.init();
        Renderer.init();
        UI.init(this);
        
        Input.onKeyDown('escape', () => {
            if (this.state === GameConfig.GAME_STATES.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameConfig.GAME_STATES.PAUSED) {
                this.resumeGame();
            }
        });
        
        this.showMainMenu();
        this.startSaveLoop();
    },
    
    showMainMenu() {
        this.state = GameConfig.GAME_STATES.MENU;
        UI.checkSavedGame();
        UI.showScreen('start');
        this.render();
    },
    
    startNewGame() {
        this.round = 1;
        this.winStreak = 0;
        Storage.clearGameState();
        
        this.createPlayer();
        this.createOpponent();
        
        this.startRound();
    },
    
    continueGame() {
        const savedState = Storage.loadGameState();
        if (!savedState) {
            this.startNewGame();
            return;
        }
        
        this.round = savedState.round || 1;
        this.winStreak = savedState.winStreak || 0;
        this.state = savedState.gameState || GameConfig.GAME_STATES.PLAYING;
        
        if (savedState.player) {
            this.player = Character.deserialize(savedState.player);
            this.player.groundY = GameConfig.GROUND_Y - this.player.height;
        } else {
            this.createPlayer();
        }
        
        if (savedState.opponent) {
            this.opponent = Opponent.deserialize(savedState.opponent);
            this.opponent.groundY = GameConfig.GROUND_Y - this.opponent.height;
        } else {
            this.createOpponent();
        }
        
        UI.hideAllScreens();
        this.state = GameConfig.GAME_STATES.PLAYING;
        this.startGameLoop();
    },
    
    createPlayer() {
        const config = GameConfig.PLAYER_CONFIG;
        const x = 150;
        const y = GameConfig.GROUND_Y - config.height;
        this.player = new Character(config, x, y, true);
    },
    
    createOpponent() {
        const opponentIndex = Math.min(this.round - 1, GameConfig.OPPONENTS.length - 1);
        const opponentConfig = GameConfig.OPPONENTS[opponentIndex];
        this.opponent = Opponent.createFromConfig(opponentConfig, this.round);
    },
    
    startRound() {
        UI.showRoundTransition(this.round, this.opponent.name);
        
        this.player.health = this.player.maxHealth;
        this.player.energy = 0;
        this.player.x = 150;
        this.player.y = this.player.groundY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.state = GameConfig.CHARACTER_STATES.IDLE;
        this.player.resetCombo();
        
        this.opponent.x = GameConfig.CANVAS_WIDTH - 150;
        this.opponent.y = this.opponent.groundY;
        this.opponent.vx = 0;
        this.opponent.vy = 0;
        this.opponent.state = GameConfig.CHARACTER_STATES.IDLE;
        this.opponent.resetCombo();
        
        setTimeout(() => {
            this.state = GameConfig.GAME_STATES.PLAYING;
            this.startGameLoop();
        }, 2000);
    },
    
    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    gameLoop(currentTime = performance.now()) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state === GameConfig.GAME_STATES.PLAYING) {
            this.update(deltaTime);
        }
        
        this.render();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    },
    
    update(deltaTime) {
        if (this.state !== GameConfig.GAME_STATES.PLAYING) return;
        
        Combat.handlePlayerInput(this.player, this.opponent);
        
        this.player.update(deltaTime, this.opponent);
        this.opponent.update(deltaTime, this.player);
        
        Combat.updateCombat(this.player, this.opponent, deltaTime);
        
        Input.clearPressed();
        
        this.checkRoundEnd();
    },
    
    render() {
        Renderer.clear();
        Renderer.renderBackground();
        
        if (this.player && this.opponent) {
            Renderer.renderCharacter(this.player);
            Renderer.renderCharacter(this.opponent);
            Renderer.renderUI(this.player, this.opponent, this.round, this.winStreak);
        }
        
        if (this.state === GameConfig.GAME_STATES.PAUSED) {
            Renderer.renderPauseOverlay();
        }
    },
    
    checkRoundEnd() {
        if (this.player.state === GameConfig.CHARACTER_STATES.DEAD) {
            this.endRound(false);
        } else if (this.opponent.state === GameConfig.CHARACTER_STATES.DEAD) {
            this.endRound(true);
        }
    },
    
    endRound(playerWon) {
        this.state = GameConfig.GAME_STATES.ROUND_TRANSITION;
        
        if (playerWon) {
            this.winStreak++;
            Storage.setHighScore(this.winStreak);
            
            if (this.round >= GameConfig.OPPONENTS.length) {
                setTimeout(() => {
                    this.state = GameConfig.GAME_STATES.VICTORY;
                    UI.showVictory(this.round, this.winStreak);
                    Storage.clearGameState();
                }, 1500);
            } else {
                this.round++;
                this.createOpponent();
                
                setTimeout(() => {
                    this.startRound();
                }, 1500);
            }
        } else {
            setTimeout(() => {
                this.state = GameConfig.GAME_STATES.GAME_OVER;
                UI.showGameOver(this.winStreak, false);
                Storage.clearGameState();
            }, 1500);
        }
    },
    
    pauseGame() {
        if (this.state !== GameConfig.GAME_STATES.PLAYING) return;
        this.state = GameConfig.GAME_STATES.PAUSED;
        UI.showPauseScreen();
        this.saveGameState();
    },
    
    resumeGame() {
        if (this.state !== GameConfig.GAME_STATES.PAUSED) return;
        this.state = GameConfig.GAME_STATES.PLAYING;
        UI.hideAllScreens();
        this.lastTime = performance.now();
    },
    
    restartGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        Storage.clearGameState();
        this.startNewGame();
    },
    
    quitGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.saveGameState();
        this.showMainMenu();
    },
    
    saveGameState() {
        if (this.state === GameConfig.GAME_STATES.PLAYING || 
            this.state === GameConfig.GAME_STATES.PAUSED) {
            Storage.saveGameState({
                round: this.round,
                winStreak: this.winStreak,
                player: this.player,
                opponent: this.opponent,
                gameState: this.state
            });
        }
    },
    
    startSaveLoop() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        this.saveInterval = setInterval(() => {
            this.saveGameState();
        }, 5000);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.addEventListener('beforeunload', () => {
    Game.saveGameState();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}

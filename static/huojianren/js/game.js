class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = GAME_STATES.MENU;
        
        this.player = null;
        this.enemy = null;
        this.enemyAI = null;
        this.arrowManager = new ArrowManager();
        this.effectManager = new EffectManager();
        this.ui = new UIManager(this);
        
        this.keys = {};
        this.prevKeys = {};
        this.gameTime = 0;
        this.round = 1;
        this.stats = {
            hits: 0,
            dodges: 0,
            startTime: 0
        };
        
        this.backgroundElements = [];
        this.initBackground();
        
        this.initInputListeners();
        this.gameLoop();
        
        this.loadSavedGame();
    }

    initBackground() {
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'tree',
                x: 100 + i * 140,
                y: GAME_CONFIG.GROUND_Y,
                height: 80 + Math.random() * 60,
                width: 40 + Math.random() * 20
            });
        }
        
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'cloud',
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: 50 + Math.random() * 150,
                size: 30 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3
            });
        }
        
        for (let i = 0; i < 20; i++) {
            this.backgroundElements.push({
                type: 'grass',
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: GAME_CONFIG.GROUND_Y,
                height: 10 + Math.random() * 15
            });
        }
    }

    initInputListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'KeyL') {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });

        setInterval(() => {
            if (this.gameState === GAME_STATES.PLAYING) {
                this.saveGame();
            }
        }, 5000);
    }

    startGame(characterId) {
        const charType = Object.values(CHARACTER_TYPES).find(c => c.id === characterId);
        this.player = new Player(charType, false);
        
        const enemyChars = Object.values(CHARACTER_TYPES).filter(c => c.id !== characterId);
        const enemyChar = enemyChars[Math.floor(Math.random() * enemyChars.length)];
        this.enemy = new Player(enemyChar, true);
        
        this.enemyAI = new EnemyAI(this.player);
        
        this.arrowManager.clear();
        this.effectManager.clear();
        
        this.gameTime = 0;
        this.stats = {
            hits: 0,
            dodges: 0,
            startTime: Date.now()
        };
        
        this.keys = {};
        this.prevKeys = {};
        
        this.gameState = GAME_STATES.PLAYING;
        this.ui.showScreen(null);
        this.ui.showHUD(true);
        this.ui.updateRound(this.round);
        
        this.saveGame();
    }

    pauseGame() {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.PAUSED;
            this.ui.showScreen('pause-screen');
        }
    }

    resumeGame() {
        if (this.gameState === GAME_STATES.PAUSED) {
            this.gameState = GAME_STATES.PLAYING;
            this.ui.showScreen(null);
        }
    }

    restartGame() {
        this.round++;
        if (this.player) {
            this.startGame(this.player.character.id);
        } else {
            this.startGame('balanced');
        }
    }

    quitGame() {
        this.gameState = GAME_STATES.MENU;
        this.player = null;
        this.enemy = null;
        this.enemyAI = null;
        this.arrowManager.clear();
        this.effectManager.clear();
        Storage.clear();
        this.ui.showScreen('start-screen');
        this.ui.showHUD(false);
    }

    backToMenu() {
        this.quitGame();
    }

    loadSavedGame() {
        const savedData = Storage.load();
        if (savedData && savedData.gameState === GAME_STATES.PLAYING) {
            try {
                this.player = Player.deserialize(savedData.player);
                this.enemy = Player.deserialize(savedData.enemy);
                this.enemyAI = EnemyAI.deserialize(savedData.enemyAI, this.player);
                this.gameTime = savedData.gameTime;
                this.round = savedData.round;
                this.stats = savedData.stats;
                
                this.gameState = GAME_STATES.PLAYING;
                this.ui.showScreen(null);
                this.ui.showHUD(true);
                this.ui.updateRound(this.round);
            } catch (e) {
                console.error('加载存档失败:', e);
                Storage.clear();
            }
        }
    }

    saveGame() {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        
        const saveData = {
            gameState: this.gameState,
            player: this.player.serialize(),
            enemy: this.enemy.serialize(),
            enemyAI: this.enemyAI.serialize(),
            gameTime: this.gameTime,
            round: this.round,
            stats: this.stats
        };
        
        Storage.save(saveData);
    }

    update() {
        if (this.gameState !== GAME_STATES.PLAYING) return;

        this.gameTime++;
        
        const playerShot = this.player.update(this.keys, this.prevKeys, this.enemy.x, this.enemy.y);
        if (playerShot) {
            this.arrowManager.fire(playerShot.x, playerShot.y, playerShot.angle, playerShot.arrowType, 'player');
        }

        const enemyDummyKeys = {};
        this.enemy.update(enemyDummyKeys, enemyDummyKeys, this.player.x, this.player.y);
        
        const enemyShot = this.enemyAI.update(this.player.x, this.player.y, this.enemy);
        if (enemyShot) {
            this.arrowManager.fire(enemyShot.x, enemyShot.y, enemyShot.angle, enemyShot.arrowType, 'enemy');
        }

        this.arrowManager.update(this.player, this.enemy);
        
        const hits = this.arrowManager.checkCollisions(this.player, this.enemy, this.effectManager);
        if (hits.enemy) {
            this.stats.hits++;
        }
        if (hits.player && this.player.isCrouching && Math.random() < 0.3) {
            this.stats.dodges++;
        }

        this.effectManager.update();

        this.ui.updateHealthBars(this.player, this.enemy);
        this.ui.updateSkillBar(this.player);
        this.ui.updateTimer(Math.floor(this.gameTime / 60));

        if (this.player.isDead() || this.enemy.isDead()) {
            this.endGame();
        }

        this.updateBackground();
        
        this.prevKeys = { ...this.keys };
    }

    updateBackground() {
        this.backgroundElements.forEach(elem => {
            if (elem.type === 'cloud') {
                elem.x += elem.speed;
                if (elem.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
                    elem.x = -50;
                }
            }
        });
    }

    endGame() {
        this.gameState = GAME_STATES.RESULT;
        Storage.clear();
        
        const isWin = this.enemy.isDead();
        const elapsedSeconds = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        this.ui.showResult(isWin, {
            time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            hits: this.stats.hits,
            dodges: this.stats.dodges
        });
        this.ui.showHUD(false);
    }

    draw() {
        this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        this.drawBackground();
        
        if (this.gameState === GAME_STATES.PLAYING || this.gameState === GAME_STATES.PAUSED) {
            this.arrowManager.draw(this.ctx);
            
            if (this.enemy) {
                this.enemy.draw(this.ctx);
            }
            if (this.player) {
                this.player.draw(this.ctx);
            }
            
            this.effectManager.draw(this.ctx);
        }
    }

    drawBackground() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
        skyGradient.addColorStop(0, '#ff7b00');
        skyGradient.addColorStop(0.3, '#ff5e00');
        skyGradient.addColorStop(0.6, '#cc3300');
        skyGradient.addColorStop(1, '#8b2500');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#ffcc00';
        this.ctx.beginPath();
        this.ctx.arc(1000, 100, 60, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(1000, 100, 90, 0, Math.PI * 2);
        this.ctx.fill();

        this.backgroundElements.forEach(elem => {
            if (elem.type === 'cloud') {
                this.ctx.fillStyle = 'rgba(255, 200, 150, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(elem.x, elem.y, elem.size, 0, Math.PI * 2);
                this.ctx.arc(elem.x + elem.size * 0.6, elem.y, elem.size * 0.8, 0, Math.PI * 2);
                this.ctx.arc(elem.x - elem.size * 0.6, elem.y, elem.size * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.fillStyle = '#3d2817';
        this.ctx.fillRect(0, GAME_CONFIG.GROUND_Y, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y);

        this.ctx.strokeStyle = '#5c3d2e';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < GAME_CONFIG.CANVAS_WIDTH; i += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, GAME_CONFIG.GROUND_Y);
            this.ctx.lineTo(i + 15, GAME_CONFIG.GROUND_Y + 10);
            this.ctx.stroke();
        }

        this.backgroundElements.forEach(elem => {
            if (elem.type === 'tree') {
                this.ctx.fillStyle = '#4a3728';
                this.ctx.fillRect(elem.x - elem.width / 4, elem.y - elem.height, elem.width / 2, elem.height);
                
                this.ctx.fillStyle = '#2d5016';
                this.ctx.beginPath();
                this.ctx.arc(elem.x, elem.y - elem.height - elem.width / 2, elem.width, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(45, 80, 22, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(elem.x - 10, elem.y - elem.height - elem.width / 3, elem.width * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.backgroundElements.forEach(elem => {
            if (elem.type === 'grass') {
                this.ctx.strokeStyle = '#4a7c23';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(elem.x, elem.y);
                this.ctx.lineTo(elem.x - 3, elem.y - elem.height);
                this.ctx.moveTo(elem.x, elem.y);
                this.ctx.lineTo(elem.x, elem.y - elem.height * 0.8);
                this.ctx.moveTo(elem.x, elem.y);
                this.ctx.lineTo(elem.x + 3, elem.y - elem.height * 0.9);
                this.ctx.stroke();
            }
        });
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new Game();
});

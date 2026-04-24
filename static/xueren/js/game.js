class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'menu';
        this.isPaused = false;
        
        this.level = 1;
        this.room = 1;
        this.lives = 3;
        this.score = 0;
        
        this.player = null;
        this.currentLevel = null;
        this.projectiles = [];
        this.enemies = [];
        this.snowballs = [];
        this.platforms = [];
        
        this.particleSystem = new ParticleSystem();
        this.powerupManager = new PowerupManager();
        
        this.keys = {};
        this.keysJustPressed = {};
        
        this.levelClearTimer = 0;
        this.isBossRoom = false;
        
        this.autoSaveTimer = 0;
        this.AUTO_SAVE_INTERVAL = 60;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkSavedGame();
        this.gameLoop();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP' && this.state === 'playing') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-gameover-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-victory-restart').addEventListener('click', () => this.restartGame());
    }
    
    checkSavedGame() {
        const hasSave = Storage.hasSave();
        const btnContinue = document.getElementById('btn-continue');
        
        if (hasSave) {
            btnContinue.style.display = 'inline-block';
        } else {
            btnContinue.style.display = 'none';
        }
    }
    
    startNewGame() {
        const gameState = Storage.createNewGame();
        this.loadGameState(gameState);
        this.startRoom();
        this.hideScreen('start-screen');
        this.state = 'playing';
        
        Storage.clear();
    }
    
    continueGame() {
        Storage.loadFullState(this, this.platforms);
        this.hideScreen('start-screen');
        this.state = 'playing';
    }
    
    loadGameState(gameState) {
        this.level = gameState.level;
        this.room = gameState.room;
        this.lives = gameState.lives;
        this.score = gameState.score;
        this.updateUI();
    }
    
    startRoom() {
        this.isBossRoom = this.room % CONFIG.LEVEL.BOSS_EVERY === 0;
        
        this.currentLevel = new Level(this.level, this.room);
        this.platforms = this.currentLevel.platforms;
        
        const startPos = this.currentLevel.getPlayerStartPosition();
        this.player = new Player(startPos.x, startPos.y);
        
        this.enemies = [...this.currentLevel.enemies];
        this.projectiles = [];
        this.snowballs = [];
        this.particleSystem.clear();
        this.powerupManager.clear();
        
        this.updateUI();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showScreen('pause-screen');
            this.state = 'paused';
        } else {
            this.hideScreen('pause-screen');
            this.state = 'playing';
        }
    }
    
    restartGame() {
        this.hideScreen('pause-screen');
        this.hideScreen('gameover-screen');
        this.hideScreen('victory-screen');
        this.isPaused = false;
        
        const gameState = Storage.createNewGame();
        this.loadGameState(gameState);
        this.startRoom();
        this.hideScreen('start-screen');
        this.state = 'playing';
        
        Storage.clear();
    }
    
    gameOver() {
        this.state = 'gameover';
        document.getElementById('final-score').textContent = this.score;
        this.showScreen('gameover-screen');
        Storage.clear();
    }
    
    victory() {
        this.state = 'victory';
        document.getElementById('victory-score').textContent = this.score;
        this.showScreen('victory-screen');
        Storage.clear();
    }
    
    nextRoom() {
        this.room++;
        
        if (this.room > CONFIG.LEVEL.ROOMS_PER_LEVEL * CONFIG.LEVEL.TOTAL_LEVELS) {
            this.victory();
            return;
        }
        
        if ((this.room - 1) % CONFIG.LEVEL.ROOMS_PER_LEVEL === 0 && this.room > 1) {
            this.level++;
        }
        
        this.startRoom();
        
        if (!this.isBossRoom) {
            this.saveGame();
        }
        
        document.getElementById('level-clear').style.display = 'block';
        setTimeout(() => {
            document.getElementById('level-clear').style.display = 'none';
        }, 2000);
    }
    
    saveGame() {
        Storage.saveFullState(this);
    }
    
    showScreen(screenId) {
        document.getElementById(screenId).style.display = 'flex';
    }
    
    hideScreen(screenId) {
        document.getElementById(screenId).style.display = 'none';
    }
    
    updateUI() {
        document.getElementById('level-display').textContent = this.level;
        document.getElementById('room-display').textContent = this.room;
        document.getElementById('score-display').textContent = this.score;
        
        let hearts = '';
        for (let i = 0; i < this.lives; i++) {
            hearts += '❤️';
        }
        document.getElementById('hearts-display').textContent = hearts || '💔';
        
        this.updatePowerupStatus();
    }
    
    updatePowerupStatus() {
        const statusDiv = document.getElementById('powerup-status');
        const activeEffects = this.powerupManager.getActiveEffects();
        
        let html = '';
        activeEffects.forEach(effect => {
            const remaining = Math.ceil(this.powerupManager.getRemainingTime(effect) / 1000);
            let icon = '';
            let color = '';
            
            switch (effect) {
                case 'bigShot':
                    icon = '💧';
                    color = CONFIG.POWERUP.BLUE_POTION.color;
                    break;
                case 'speed':
                    icon = '⚡';
                    color = CONFIG.POWERUP.YELLOW_POTION.color;
                    break;
                case 'invincible':
                    icon = '⭐';
                    color = CONFIG.POWERUP.STAR.color;
                    break;
            }
            
            html += `<div class="powerup-icon" style="background: ${color}; color: white;">${icon}${remaining}s</div>`;
        });
        
        statusDiv.innerHTML = html;
    }
    
    handleInput() {
        if (this.keysJustPressed['KeyJ'] && this.player.canShoot()) {
            const projectile = this.player.shoot();
            if (projectile) {
                this.projectiles.push(projectile);
            }
        }
        
        this.keysJustPressed = {};
    }
    
    update() {
        if (this.state !== 'playing' || this.isPaused) return;
        
        this.handleInput();
        
        this.currentLevel.update();
        
        this.player.update(this.keys, this.platforms, this.snowballs, this);
        
        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(p => p.active);
        
        this.enemies.forEach(enemy => enemy.update(this.platforms));
        
        this.snowballs.forEach(snowball => {
            snowball.update(this.platforms, this.enemies, this.snowballs);
            
            if (!snowball.active) {
                if (snowball.checkRestore()) {
                    const restoredEnemy = new Enemy(snowball.x, snowball.y, snowball.enemy.type);
                    restoredEnemy.hp = snowball.enemy.maxHp;
                    this.enemies.push(restoredEnemy);
                }
            }
        });
        this.snowballs = this.snowballs.filter(s => s.active);
        
        this.powerupManager.update(this.platforms, this.player, this);
        
        this.particleSystem.update();
        
        this.checkCollisions();
        
        const activeEnemies = this.enemies.filter(e => e.active && !e.isSnowball).length;
        const activeSnowballs = this.snowballs.filter(s => s.active).length;
        
        if (activeEnemies === 0 && activeSnowballs === 0 && this.enemies.length > 0) {
            this.levelClearTimer++;
            if (this.levelClearTimer > 60) {
                this.levelClearTimer = 0;
                this.nextRoom();
            }
        }
        
        this.autoSaveTimer++;
        if (this.autoSaveTimer >= this.AUTO_SAVE_INTERVAL) {
            this.autoSaveTimer = 0;
            if (!this.isBossRoom) {
                this.saveGame();
            }
        }
        
        this.updateUI();
    }
    
    checkCollisions() {
        let needsSave = false;
        
        this.projectiles.forEach(projectile => {
            if (!projectile.active) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.active || enemy.isSnowball) return;
                
                if (Utils.rectCollision(
                    projectile.getCollisionRect(),
                    enemy.getCollisionRect()
                )) {
                    projectile.active = false;
                    
                    this.particleSystem.createSnowBurst(projectile.x, projectile.y);
                    
                    if (enemy.hit()) {
                        enemy.isSnowball = true;
                        enemy.active = false;
                        
                        const snowball = new Snowball(enemy);
                        this.snowballs.push(snowball);
                        needsSave = true;
                    }
                }
            });
        });
        
        this.snowballs.forEach(snowball => {
            if (!snowball.active || !snowball.isRolling) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                if (enemy.config.canPassSnowball) return;
                
                if (Utils.rectCollision(
                    snowball.getCollisionRect(),
                    enemy.getCollisionRect()
                )) {
                    enemy.active = false;
                    snowball.destroyedEnemies++;
                    
                    const chainMultiplier = Math.pow(2, snowball.destroyedEnemies - 1);
                    const earnedScore = enemy.score * chainMultiplier;
                    this.score += earnedScore;
                    
                    this.particleSystem.createEnemyDeath(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        enemy.config.color
                    );
                    this.particleSystem.createScorePopup(
                        enemy.x + enemy.width / 2,
                        enemy.y,
                        earnedScore
                    );
                    
                    this.powerupManager.spawn(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2
                    );
                    
                    needsSave = true;
                }
            });
            
            this.snowballs.forEach(otherSnowball => {
                if (snowball === otherSnowball || !otherSnowball.active) return;
                
                if (!otherSnowball.isRolling && Utils.rectCollision(
                    snowball.getCollisionRect(),
                    otherSnowball.getCollisionRect()
                )) {
                    otherSnowball.startRolling(snowball.velocityX > 0 ? 1 : -1);
                    this.score += CONFIG.SNOWBALL.DESTROY_SCORE;
                    needsSave = true;
                }
            });
        });
        
        this.enemies.forEach(enemy => {
            if (!enemy.active || enemy.isSnowball) return;
            
            if (Utils.rectCollision(
                this.player.getCollisionRect(),
                enemy.getCollisionRect()
            )) {
                this.player.takeDamage(this);
                needsSave = true;
            }
        });
        
        if (needsSave && !this.isBossRoom) {
            this.saveGame();
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        if (this.currentLevel) {
            this.currentLevel.draw(this.ctx);
        }
        
        this.powerupManager.draw(this.ctx);
        
        this.snowballs.forEach(snowball => snowball.draw(this.ctx));
        
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));
        
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        this.particleSystem.draw(this.ctx);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

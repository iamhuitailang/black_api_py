const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEVEL_UP: 'level_up',
    WAVE_NOTIFICATION: 'wave_notification'
};

const GameManager = {
    state: GameState.MENU,
    canvas: null,
    ctx: null,
    
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    effects: [],
    
    score: 0,
    kills: 0,
    wave: 1,
    enemiesRemaining: 0,
    enemiesSpawned: 0,
    enemiesInWave: 0,
    
    tankLevel: 1,
    tankExp: 0,
    tankExpToNext: 100,
    tankStats: null,
    
    lastTime: 0,
    animationId: null,
    spawnTimer: 0,
    spawnDelay: 1500,
    
    waveNotificationTimer: 0,
    waveNotificationDuration: 2000,
    levelUpTimer: 0,
    levelUpDuration: 3000,
    pendingLevelUp: false,
    newSkinUnlocked: null,
    
    onScoreUpdate: null,
    onWaveUpdate: null,
    onKillsUpdate: null,
    onGameOver: null,
    onPause: null,
    onResume: null,
    onLevelUp: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        Renderer.init(canvas);
        Input.init();
        
        this.setupControls();
    },

    setupControls() {
        Input.onKeyDown('KeyP', () => {
            if (this.state === GameState.PLAYING) {
                this.pause();
            } else if (this.state === GameState.PAUSED) {
                this.resume();
            }
        });
    },

    loadTankData() {
        const savedTank = Storage.getTankData();
        if (savedTank) {
            this.tankLevel = savedTank.level || 1;
            this.tankExp = savedTank.exp || 0;
            this.tankExpToNext = this.getExpForLevel(this.tankLevel + 1);
        }
        this.updateTankStats();
    },

    saveTankData() {
        Storage.setTankData({
            level: this.tankLevel,
            exp: this.tankExp
        });
    },

    getExpForLevel(level) {
        return 100 * level;
    },

    updateTankStats() {
        this.tankStats = GameConfig.calculateStatsByLevel(this.tankLevel);
    },

    async startGame() {
        this.loadTankData();
        this.resetGame();
        
        this.state = GameState.WAVE_NOTIFICATION;
        this.waveNotificationTimer = this.waveNotificationDuration;
        this.showWaveNotification();
        
        this.startWave();
        
        this.lastTime = performance.now();
        this.gameLoop();
        
        if (Auth.isLoggedIn()) {
            await this.syncTankWithServer();
        }
    },

    resetGame() {
        this.score = 0;
        this.kills = 0;
        this.wave = 1;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.effects = [];
        this.enemiesRemaining = 0;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.pendingLevelUp = false;
        this.newSkinUnlocked = null;
        
        this.createPlayer();
        this.updateHUD();
    },

    createPlayer() {
        const x = (GameConfig.CANVAS_WIDTH - GameConfig.PLAYER.WIDTH) / 2;
        const y = GameConfig.CANVAS_HEIGHT - GameConfig.PLAYER.HEIGHT - 20;
        
        const skinId = GameConfig.getSkinIdByLevel(this.tankLevel);
        
        this.player = new PlayerTank(x, y, {
            level: this.tankLevel,
            hp: this.tankStats.hp,
            maxHp: this.tankStats.hp,
            attack: this.tankStats.attack,
            fireRate: this.tankStats.fireRate,
            speed: this.tankStats.speed,
            bulletCount: this.tankStats.bulletCount,
            skinId: skinId
        });
    },

    startWave() {
        const waveConfig = GameConfig.getWaveConfig(this.wave);
        this.enemiesInWave = GameConfig.getTotalEnemiesForWave(this.wave);
        this.enemiesRemaining = this.enemiesInWave;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        
        const isBoss = this.wave % 5 === 0;
        this.spawnDelay = isBoss ? 2000 : 1500;
    },

    spawnEnemy(type) {
        const config = GameConfig.ENEMIES[type];
        const x = Utils.random(20, GameConfig.CANVAS_WIDTH - config.width - 20);
        const y = -config.height - Utils.random(0, 50);
        
        const enemy = new EnemyTank(x, y, type);
        
        if (type === 'suicide') {
            enemy.directionX = Utils.randomFloat(-1, 1) > 0 ? 1 : -1;
        }
        
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    },

    gameLoop() {
        if (this.state !== GameState.PLAYING && 
            this.state !== GameState.PAUSED &&
            this.state !== GameState.WAVE_NOTIFICATION &&
            this.state !== GameState.LEVEL_UP) {
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state === GameState.WAVE_NOTIFICATION) {
            this.updateWaveNotification(deltaTime);
            Renderer.clear();
            Renderer.drawBackground();
            Renderer.drawWaveNotification(this.wave, this.wave % 5 === 0);
            return;
        }
        
        if (this.state === GameState.LEVEL_UP) {
            this.updateLevelUp(deltaTime);
            Renderer.clear();
            Renderer.drawBackground();
            Renderer.drawLevelUp(this.tankLevel, this.newSkinUnlocked);
            return;
        }
        
        if (this.state === GameState.PAUSED) {
            Renderer.clear();
            Renderer.draw(this.player, this.enemies, this.bullets, this.particles, this.effects);
            Renderer.drawPauseOverlay();
            return;
        }
        
        this.update(deltaTime, currentTime);
        this.render();
    },

    updateWaveNotification(deltaTime) {
        this.waveNotificationTimer -= deltaTime;
        
        if (this.waveNotificationTimer <= 0) {
            this.state = GameState.PLAYING;
        }
    },

    updateLevelUp(deltaTime) {
        this.levelUpTimer -= deltaTime;
        
        if (this.levelUpTimer <= 0) {
            this.newSkinUnlocked = null;
            if (this.pendingLevelUp) {
                this.pendingLevelUp = false;
                this.triggerLevelUp();
            } else {
                this.state = GameState.PLAYING;
            }
        }
    },

    update(deltaTime, currentTime) {
        this.handleInput();
        
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnDelay && this.enemiesSpawned < this.enemiesInWave) {
            this.spawnNextEnemy();
            this.spawnTimer = 0;
        }
        
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBullets(deltaTime);
        this.updateParticles(deltaTime);
        this.updateEffects(deltaTime);
        this.handlePlayerFiring(currentTime);
        this.handleEnemyFiring(currentTime);
        this.checkCollisions();
        this.checkWaveComplete();
        this.cleanup();
    },

    handleInput() {
        this.player.direction.left = Input.isLeftPressed();
        this.player.direction.right = Input.isRightPressed();
        this.player.firing = Input.isFirePressed();
    },

    spawnNextEnemy() {
        const waveConfig = GameConfig.getWaveConfig(this.wave);
        let countSoFar = 0;
        
        for (const enemyGroup of waveConfig.enemies) {
            const startIdx = countSoFar;
            const endIdx = countSoFar + enemyGroup.count;
            
            if (this.enemiesSpawned >= startIdx && this.enemiesSpawned < endIdx) {
                this.spawnEnemy(enemyGroup.type);
                break;
            }
            countSoFar += enemyGroup.count;
        }
    },

    updatePlayer(deltaTime) {
        this.player.update(deltaTime, GameConfig.CANVAS_WIDTH);
    },

    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
            }
        }
    },

    updateBullets(deltaTime) {
        for (const bullet of this.bullets) {
            if (bullet.active) {
                bullet.update(deltaTime);
            }
        }
    },

    updateParticles(deltaTime) {
        for (const particle of this.particles) {
            if (particle.active) {
                particle.update(deltaTime);
            }
        }
    },

    updateEffects(deltaTime) {
        for (const effect of this.effects) {
            if (effect.active) {
                effect.update(deltaTime);
            }
        }
    },

    handlePlayerFiring(currentTime) {
        if (this.player.firing && this.player.canFire(currentTime)) {
            const bullets = this.player.fire(currentTime);
            if (bullets) {
                this.bullets.push(...bullets);
                
                const center = this.player.getCenter();
                const flash = Collision.createMuzzleFlash(center.x, this.player.y, true);
                this.effects.push(flash);
            }
        }
    },

    handleEnemyFiring(currentTime) {
        for (const enemy of this.enemies) {
            if (!enemy.active || !enemy.config.isSuicide) {
                if (enemy.active && enemy.y > 0 && enemy.canFire(currentTime)) {
                    const bullets = enemy.fire(currentTime);
                    if (bullets) {
                        this.bullets.push(...bullets);
                    }
                }
            }
        }
    },

    checkCollisions() {
        const bulletEnemyCollisions = Collision.checkAllBulletsEnemies(this.bullets, this.enemies);
        for (const collision of bulletEnemyCollisions) {
            this.handleBulletEnemyCollision(collision.bullet, collision.enemy);
        }
        
        const bulletPlayerCollisions = Collision.checkAllBulletsPlayer(this.bullets, this.player);
        for (const collision of bulletPlayerCollisions) {
            this.handleBulletPlayerCollision(collision.bullet, collision.player);
        }
        
        const suicideCollisions = Collision.checkSuicideCollision(this.player, this.enemies);
        for (const collision of suicideCollisions) {
            this.handleSuicideCollision(collision.enemy, collision.player);
        }
    },

    handleBulletEnemyCollision(bullet, enemy) {
        bullet.active = false;
        
        const isDead = enemy.takeDamage(bullet.damage);
        
        if (isDead) {
            enemy.active = false;
            this.enemiesRemaining--;
            
            this.score += enemy.score;
            this.kills++;
            this.addExp(enemy.exp);
            
            const explosionParticles = Collision.createExplosionParticles(
                enemy.getCenter().x,
                enemy.getCenter().y,
                enemy.color,
                enemy.config.isBoss ? 30 : 15
            );
            this.particles.push(...explosionParticles);
            
            this.updateHUD();
        }
    },

    handleBulletPlayerCollision(bullet, player) {
        bullet.active = false;
        
        const isDead = player.takeDamage(bullet.damage);
        
        const hitParticles = Collision.createExplosionParticles(
            player.getCenter().x,
            player.getCenter().y,
            '#ff4444',
            10
        );
        this.particles.push(...hitParticles);
        
        this.updateHUD();
        
        if (isDead) {
            this.gameOver(false);
        }
    },

    handleSuicideCollision(enemy, player) {
        enemy.active = false;
        this.enemiesRemaining--;
        
        const explosionParticles = Collision.createExplosionParticles(
            enemy.getCenter().x,
            enemy.getCenter().y,
            '#fbbf24',
            20
        );
        this.particles.push(...explosionParticles);
        
        const isDead = player.takeDamage(2);
        this.updateHUD();
        
        if (isDead) {
            this.gameOver(false);
        }
    },

    addExp(exp) {
        this.tankExp += exp;
        
        while (this.tankExp >= this.tankExpToNext) {
            this.tankExp -= this.tankExpToNext;
            this.tankLevel++;
            this.tankExpToNext = this.getExpForLevel(this.tankLevel + 1);
            this.updateTankStats();
            
            const oldSkinId = GameConfig.getSkinIdByLevel(this.tankLevel - 1);
            const newSkinId = GameConfig.getSkinIdByLevel(this.tankLevel);
            
            if (newSkinId > oldSkinId) {
                this.newSkinUnlocked = GameConfig.PLAYER.SKIN_NAMES[newSkinId];
            }
            
            if (this.state === GameState.PLAYING) {
                this.triggerLevelUp();
            } else {
                this.pendingLevelUp = true;
            }
        }
        
        this.saveTankData();
    },

    triggerLevelUp() {
        this.state = GameState.LEVEL_UP;
        this.levelUpTimer = this.levelUpDuration;
        
        this.player.level = this.tankLevel;
        this.player.hp = Math.min(this.player.hp + 1, this.tankStats.hp);
        this.player.maxHp = this.tankStats.hp;
        this.player.attack = this.tankStats.attack;
        this.player.fireRate = this.tankStats.fireRate;
        this.player.speed = this.tankStats.speed;
        this.player.bulletCount = this.tankStats.bulletCount;
        this.player.skinId = GameConfig.getSkinIdByLevel(this.tankLevel);
        
        this.updateHUD();
    },

    checkWaveComplete() {
        if (this.enemiesSpawned >= this.enemiesInWave && this.enemiesRemaining <= 0) {
            const waveBonus = GameConfig.calculateWaveBonus(this.wave);
            this.score += waveBonus;
            this.addExp(waveBonus / 2);
            
            this.wave++;
            this.updateHUD();
            
            this.state = GameState.WAVE_NOTIFICATION;
            this.waveNotificationTimer = this.waveNotificationDuration;
            this.showWaveNotification();
            
            this.startWave();
        }
    },

    showWaveNotification() {
    },

    cleanup() {
        this.enemies = this.enemies.filter(e => e.active);
        this.bullets = this.bullets.filter(b => b.active);
        this.particles = this.particles.filter(p => p.active);
        this.effects = this.effects.filter(e => e.active);
    },

    render() {
        Renderer.clear();
        Renderer.draw(this.player, this.enemies, this.bullets, this.particles, this.effects);
    },

    updateHUD() {
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
        if (this.onWaveUpdate) {
            this.onWaveUpdate(this.wave);
        }
        if (this.onKillsUpdate) {
            this.onKillsUpdate(this.kills);
        }
        
        Utils.updateElement('hud-wave', this.wave);
        Utils.updateElement('hud-score', this.score);
        Utils.updateElement('hud-kills', this.kills);
        Utils.updateElement('tank-level', `Lv.${this.tankLevel}`);
        Utils.updateElement('hp-text', `${this.player.hp}/${this.player.maxHp}`);
        
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const hpFill = document.getElementById('hp-fill');
        if (hpFill) {
            hpFill.style.width = `${hpPercent}%`;
        }
    },

    pause() {
        if (this.state !== GameState.PLAYING) return;
        
        this.state = GameState.PAUSED;
        if (this.onPause) {
            this.onPause();
        }
    },

    resume() {
        if (this.state !== GameState.PAUSED) return;
        
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        Input.clearPauseState();
        
        if (this.onResume) {
            this.onResume();
        }
    },

    async gameOver(victory) {
        this.state = GameState.GAME_OVER;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (Auth.isLoggedIn()) {
            try {
                await TankeApi.saveGameResult(this.wave, this.score, this.kills);
                
                await this.syncTankWithServer();
            } catch (e) {
                console.error('Failed to save game:', e);
            }
        }
        
        if (this.onGameOver) {
            this.onGameOver({
                victory: victory,
                wave: this.wave,
                score: this.score,
                kills: this.kills
            });
        }
    },

    quitGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.state = GameState.MENU;
        Input.reset();
    },

    async syncTankWithServer() {
        if (!Auth.isLoggedIn()) return;
        
        try {
            const response = await TankeApi.getTankInfo();
            if (response && response.data) {
                const serverTank = response.data;
                if (serverTank.level >= this.tankLevel) {
                    this.tankLevel = serverTank.level;
                    this.tankExp = serverTank.exp;
                    this.tankExpToNext = this.getExpForLevel(this.tankLevel + 1);
                    this.updateTankStats();
                    this.saveTankData();
                } else {
                    await TankeApi.addExp(
                        this.tankExp + (this.tankLevel - serverTank.level) * this.getExpForLevel(serverTank.level + 1)
                    );
                }
            }
        } catch (e) {
            console.error('Failed to sync tank:', e);
        }
    }
};

window.GameState = GameState;
window.GameManager = GameManager;

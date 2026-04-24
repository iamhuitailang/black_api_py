class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 1;
        
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.powerups = null;
        this.particles = null;
        
        this.keys = {};
        this.mousePos = { x: this.width / 2, y: this.height - 100 };
        this.mouseActive = false;
        
        this.stars = [];
        this.saveInterval = 0;
        
        this.init();
    }
    
    init() {
        this.createStars();
        this.setupEventListeners();
        this.checkSavedGame();
        this.gameLoop();
    }
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 1 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isPlaying && !this.gameOver && !this.victory) {
                    this.togglePause();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            
            this.mousePos.x = (e.clientX - rect.left) * scaleX;
            this.mousePos.y = (e.clientY - rect.top) * scaleY;
            this.mouseActive = true;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseActive = false;
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('restartFromPauseBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('victoryRestartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
    }
    
    checkSavedGame() {
        const savedState = Storage.load();
        if (savedState) {
            document.getElementById('startBtn').textContent = '继续游戏';
        }
    }
    
    startGame() {
        const savedState = Storage.load();
        
        if (savedState) {
            this.loadFromState(savedState);
        } else {
            this.resetGame();
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;
        
        this.hideAllOverlays();
        this.updateUI();
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.wave = 1;
        
        this.player = new Player(this.width / 2, this.height - 100);
        this.enemies = new EnemyManager();
        this.bullets = new BulletManager();
        this.powerups = new PowerupManager();
        this.particles = new ParticleSystem();
        
        Storage.clear();
    }
    
    loadFromState(state) {
        this.score = state.score;
        this.lives = state.lives;
        this.level = state.level;
        this.wave = state.wave;
        
        const playerX = state.playerX || this.width / 2;
        const playerY = state.playerY || this.height - 100;
        this.player = new Player(playerX, playerY);
        
        if (state.hasShield) {
            this.player.hasShield = true;
            this.player.shieldTimer = state.shieldTimer || 3;
        }
        if (state.hasDoubleBullet) {
            this.player.hasDoubleBullet = true;
            this.player.doubleBulletTimer = state.doubleBulletTimer || 15;
        }
        
        this.enemies = new EnemyManager();
        this.bullets = new BulletManager();
        this.powerups = new PowerupManager();
        this.particles = new ParticleSystem();
        
        if (state.enemies && state.enemies.length > 0) {
            state.enemies.forEach(e => {
                const enemy = new Enemy(e.x, e.y, e.type, e.isBoss);
                enemy.health = e.health;
                enemy.maxHealth = e.maxHealth;
                enemy.angle = e.angle || 0;
                this.enemies.enemies.push(enemy);
            });
        }
    }
    
    togglePause() {
        if (!this.isPlaying || this.gameOver || this.victory) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    restartGame() {
        this.hideAllOverlays();
        this.resetGame();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;
        
        this.updateUI();
    }
    
    nextLevel() {
        this.level++;
        this.wave = 1;
        
        if (this.level > 3) {
            this.showVictory();
            return;
        }
        
        this.enemies.clear();
        this.bullets.clear();
        this.powerups.clear();
        this.particles.clear();
        
        this.player.x = this.width / 2;
        this.player.y = this.height - 100;
        
        this.isPaused = false;
        this.hideAllOverlays();
        this.updateUI();
    }
    
    hideAllOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
    }
    
    showGameOver() {
        this.gameOver = true;
        this.isPlaying = false;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('finalLevel').textContent = this.level;
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        Storage.clear();
    }
    
    showLevelComplete() {
        this.isPaused = true;
        document.getElementById('completedLevel').textContent = this.level;
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
    }
    
    showVictory() {
        this.victory = true;
        this.isPlaying = false;
        
        document.getElementById('victoryScore').textContent = this.score;
        document.getElementById('victoryScreen').classList.remove('hidden');
        
        Storage.clear();
    }
    
    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        
        let livesText = '';
        for (let i = 0; i < this.lives; i++) {
            livesText += '❤️';
        }
        document.getElementById('livesDisplay').textContent = livesText || '💀';
        
        document.getElementById('waveDisplay').textContent = this.wave;
        document.getElementById('levelDisplay').textContent = this.level;
        
        const shieldStatus = document.getElementById('shieldStatus');
        const doubleBulletStatus = document.getElementById('doubleBulletStatus');
        
        if (this.player && this.player.hasShield) {
            shieldStatus.classList.add('active');
            document.getElementById('shieldTime').textContent = Utils.formatTime(this.player.shieldTimer);
        } else {
            shieldStatus.classList.remove('active');
        }
        
        if (this.player && this.player.hasDoubleBullet) {
            doubleBulletStatus.classList.add('active');
            document.getElementById('doubleBulletTime').textContent = Utils.formatTime(this.player.doubleBulletTimer);
        } else {
            doubleBulletStatus.classList.remove('active');
        }
    }
    
    update() {
        if (!this.isPlaying || this.isPaused || this.gameOver || this.victory) return;
        
        this.updateStars();
        
        this.player.update(this.width, this.height, this.keys, this.mousePos, this.mouseActive);
        
        this.bullets.shootPlayer(this.player, this.player.hasDoubleBullet);
        
        this.bullets.update(this.width, this.height);
        
        const isWaveComplete = this.enemies.update(
            this.width, 
            this.height, 
            this.level, 
            this.wave, 
            this.player,
            this.bullets
        );
        
        if (isWaveComplete) {
            this.nextWave();
        }
        
        this.powerups.update(this.height);
        
        this.particles.update();
        
        this.checkCollisions();
        
        this.saveInterval++;
        if (this.saveInterval >= 60) {
            this.saveInterval = 0;
            Storage.save(this);
        }
        
        this.updateUI();
    }
    
    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            star.twinkle += 0.05;
            
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
    }
    
    nextWave() {
        const config = LevelConfig[this.level];
        
        this.wave++;
        
        if (this.wave > config.waves) {
            if (this.level >= 3) {
                this.showVictory();
            } else {
                this.showLevelComplete();
            }
            return;
        }
        
        this.enemies.startNewWave();
    }
    
    checkCollisions() {
        let gameShouldEnd = false;
        
        for (let bIndex = this.bullets.playerBullets.length - 1; bIndex >= 0; bIndex--) {
            const bullet = this.bullets.playerBullets[bIndex];
            let bulletHit = false;
            
            for (let eIndex = this.enemies.enemies.length - 1; eIndex >= 0; eIndex--) {
                const enemy = this.enemies.enemies[eIndex];
                if (this.checkCollision(bullet.getBounds(), enemy.getBounds())) {
                    bulletHit = true;
                    const isDead = enemy.takeDamage();
                    
                    if (isDead) {
                        this.score += enemy.score;
                        this.particles.createExplosion(enemy.x, enemy.y, enemy.isBoss ? 30 : 15);
                        this.powerups.spawn(enemy.x, enemy.y);
                        this.enemies.enemies.splice(eIndex, 1);
                    } else {
                        this.particles.createHitEffect(bullet.x, bullet.y);
                    }
                }
            }
            
            if (bulletHit) {
                this.bullets.playerBullets.splice(bIndex, 1);
            }
        }
        
        if (!this.player.hasShield && !this.player.invincible) {
            for (let index = this.bullets.enemyBullets.length - 1; index >= 0; index--) {
                const bullet = this.bullets.enemyBullets[index];
                if (this.checkCollision(bullet.getBounds(), this.player.getBounds())) {
                    this.bullets.enemyBullets.splice(index, 1);
                    
                    if (this.player.takeDamage()) {
                        this.lives--;
                        if (this.lives <= 0) {
                            gameShouldEnd = true;
                        }
                    }
                }
            }
        }
        
        if (!this.player.hasShield && !this.player.invincible && !gameShouldEnd) {
            for (let index = this.enemies.enemies.length - 1; index >= 0; index--) {
                const enemy = this.enemies.enemies[index];
                if (this.checkCollision(enemy.getBounds(), this.player.getBounds())) {
                    if (this.player.takeDamage()) {
                        this.lives--;
                        if (this.lives <= 0) {
                            gameShouldEnd = true;
                            break;
                        }
                    }
                }
            }
        }
        
        if (!gameShouldEnd) {
            for (let index = this.powerups.powerups.length - 1; index >= 0; index--) {
                const powerup = this.powerups.powerups[index];
                if (this.checkCollision(powerup.getBounds(), this.player.getBounds())) {
                    this.particles.createPowerupEffect(powerup.x, powerup.y, powerup.type);
                    
                    switch(powerup.type) {
                        case 'shield':
                            this.player.activateShield();
                            break;
                        case 'doubleBullet':
                            this.player.activateDoubleBullet();
                            break;
                        case 'bomb':
                            this.useBomb();
                            break;
                    }
                    
                    this.powerups.powerups.splice(index, 1);
                }
            }
        }
        
        if (gameShouldEnd) {
            this.showGameOver();
        }
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    useBomb() {
        this.enemies.enemies.forEach(enemy => {
            this.score += enemy.score;
            this.particles.createExplosion(enemy.x, enemy.y, 20);
        });
        
        this.enemies.clear();
        this.bullets.clearEnemyBullets();
        
        this.enemies.startNewWave();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        this.drawStars();
        
        if (this.isPlaying && !this.gameOver && !this.victory) {
            this.particles.draw(this.ctx);
            this.powerups.draw(this.ctx);
            this.enemies.draw(this.ctx);
            this.bullets.draw(this.ctx);
            this.player.draw(this.ctx);
        }
    }
    
    drawBackground() {
        const config = LevelConfig[this.level] || LevelConfig[1];
        const colors = config.background;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawStars() {
        this.stars.forEach(star => {
            const alpha = 0.5 + Math.sin(star.twinkle) * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();

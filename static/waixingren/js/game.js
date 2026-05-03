class SpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.gameState = 'start'; // start, playing, paused, gameOver, victory
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.enemiesKilled = 0;
        this.lastLifeBonusScore = 0;
        
        this.player = null;
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.explosions = [];
        this.stars = [];
        this.ufo = null;
        this.powerUps = [];
        
        this.keys = {};
        this.lastShotTime = 0;
        this.shootCooldown = 300;
        this.baseShootCooldown = 300;
        
        this.hasShield = false;
        this.shieldTime = 0;
        this.hasDoubleShot = false;
        this.doubleShotTime = 0;
        this.hasRapidFire = false;
        this.rapidFireTime = 0;
        
        this.enemyDirection = 1;
        this.enemyMoveDown = false;
        this.enemySpeed = 1;
        this.baseEnemySpeed = 1;
        
        this.levelConfig = [
            { enemies: 32, speed: 0.8, shootRate: 0.002 },
            { enemies: 32, speed: 1.2, shootRate: 0.003 },
            { enemies: 32, speed: 1.6, shootRate: 0.004 },
            { enemies: 32, speed: 2.0, shootRate: 0.005 },
            { enemies: 32, speed: 2.5, shootRate: 0.006 }
        ];
        
        this.init();
    }
    
    init() {
        this.createStars();
        this.bindEvents();
        this.gameLoop();
    }
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.enemiesKilled = 0;
        this.lastLifeBonusScore = 0;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.explosions = [];
        this.ufo = null;
        this.powerUps = [];
        
        this.hasShield = false;
        this.shieldTime = 0;
        this.hasDoubleShot = false;
        this.doubleShotTime = 0;
        this.hasRapidFire = false;
        this.rapidFireTime = 0;
        this.shootCooldown = this.baseShootCooldown;
        
        this.createPlayer();
        this.createEnemies();
        this.updateUI();
        
        this.hideOverlay('gameOverlay');
        this.hideOverlay('pauseOverlay');
        this.hideOverlay('gameOverOverlay');
    }
    
    createPlayer() {
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 60,
            width: 40,
            height: 40,
            speed: 5
        };
    }
    
    createEnemies() {
        this.enemies = [];
        const config = this.levelConfig[Math.min(this.level - 1, this.levelConfig.length - 1)];
        this.baseEnemySpeed = config.speed;
        this.enemySpeed = config.speed;
        this.enemyDirection = 1;
        
        const rows = 4;
        const cols = 8;
        const enemyWidth = 40;
        const enemyHeight = 30;
        const padding = 15;
        const startX = (this.width - (cols * (enemyWidth + padding))) / 2;
        const startY = 50;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isAdvanced = row === 0;
                this.enemies.push({
                    x: startX + col * (enemyWidth + padding),
                    y: startY + row * (enemyHeight + padding),
                    width: enemyWidth,
                    height: enemyHeight,
                    type: isAdvanced ? 'advanced' : 'normal',
                    points: isAdvanced ? 20 : 10,
                    frame: 0
                });
            }
        }
    }
    
    nextLevel() {
        this.level++;
        const levelBonus = 500 * this.level;
        this.score += levelBonus;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.explosions = [];
        this.ufo = null;
        
        this.createPlayer();
        this.createEnemies();
        this.updateUI();
        
        this.showMessage(`第 ${this.level} 关！奖励 ${levelBonus} 分`, 3000);
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            } else if (e.code === 'KeyP' && this.gameState === 'paused') {
                this.resumeGame();
            }
            
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtnPause').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtnGameOver').addEventListener('click', () => this.startGame());
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('pauseOverlay');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideOverlay('pauseOverlay');
        }
    }
    
    gameOver(victory = false) {
        this.gameState = 'gameOver';
        
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const finalScore = document.getElementById('finalScore');
        const finalLevel = document.getElementById('finalLevel');
        
        if (victory) {
            title.textContent = '恭喜通关！';
            message.textContent = '你成功保卫了地球！';
        } else {
            title.textContent = '游戏结束';
            message.textContent = '地球被外星入侵者占领了...';
        }
        
        finalScore.textContent = this.score;
        finalLevel.textContent = this.level;
        
        this.showOverlay('gameOverOverlay');
    }
    
    showOverlay(id) {
        document.getElementById(id).classList.remove('hidden');
    }
    
    hideOverlay(id) {
        document.getElementById(id).classList.add('hidden');
    }
    
    showMessage(text, duration = 2000) {
        this.message = {
            text: text,
            startTime: Date.now(),
            duration: duration
        };
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateUFO();
        this.updateExplosions();
        this.updatePowerUps();
        this.updatePowerUpEffects();
        this.checkCollisions();
        this.checkGameState();
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            powerUp.frame = (powerUp.frame + 0.1) % 2;
            return powerUp.y < this.height;
        });
    }
    
    updatePowerUpEffects() {
        const now = Date.now();
        
        if (this.hasShield && now > this.shieldTime) {
            this.hasShield = false;
            this.showMessage('护盾消失', 1500);
        }
        
        if (this.hasDoubleShot && now > this.doubleShotTime) {
            this.hasDoubleShot = false;
            this.showMessage('双发射击消失', 1500);
        }
        
        if (this.hasRapidFire && now > this.rapidFireTime) {
            this.hasRapidFire = false;
            this.shootCooldown = this.baseShootCooldown;
            this.showMessage('快速射击消失', 1500);
        }
    }
    
    spawnPowerUp(x, y) {
        const types = ['shield', 'health', 'doubleShot', 'rapidFire'];
        const weights = [15, 35, 25, 25];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        let type = types[0];
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                type = types[i];
                break;
            }
        }
        
        const powerUp = {
            x: x - 15,
            y: y,
            width: 30,
            height: 30,
            speed: 2,
            type: type,
            frame: 0
        };
        
        this.powerUps.push(powerUp);
    }
    
    collectPowerUp(powerUp) {
        const now = Date.now();
        
        switch (powerUp.type) {
            case 'shield':
                this.hasShield = true;
                this.shieldTime = now + 3000;
                this.showMessage('获得护盾！免疫伤害 3秒', 2000);
                break;
                
            case 'health':
                this.lives++;
                this.updateUI();
                this.showMessage('生命值 +1！', 2000);
                break;
                
            case 'doubleShot':
                this.hasDoubleShot = true;
                this.doubleShotTime = now + 5000;
                this.showMessage('获得双发射击！ 5秒', 2000);
                break;
                
            case 'rapidFire':
                this.hasRapidFire = true;
                this.rapidFireTime = now + 5000;
                this.shootCooldown = this.baseShootCooldown / 2;
                this.showMessage('获得快速射击！ 5秒', 2000);
                break;
        }
        
        this.createExplosion(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            '#ffd700'
        );
    }
    
    updatePlayer() {
        if (!this.player) return;
        
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        
        if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        if ((this.keys['Space'] || this.keys['ArrowUp']) && Date.now() - this.lastShotTime > this.shootCooldown) {
            this.playerShoot();
            this.lastShotTime = Date.now();
        }
    }
    
    playerShoot() {
        if (this.hasDoubleShot) {
            this.playerBullets.push({
                x: this.player.x + this.player.width / 2 - 10,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 8
            });
            this.playerBullets.push({
                x: this.player.x + this.player.width / 2 + 6,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 8
            });
        } else {
            this.playerBullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 8
            });
        }
    }
    
    updateBullets() {
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            return bullet.y < this.height;
        });
    }
    
    updateEnemies() {
        if (this.enemies.length === 0) return;
        
        let moveDown = false;
        const config = this.levelConfig[Math.min(this.level - 1, this.levelConfig.length - 1)];
        
        for (const enemy of this.enemies) {
            enemy.x += this.enemyDirection * this.enemySpeed;
            enemy.frame = (enemy.frame + 0.1) % 2;
            
            if ((enemy.x <= 0 && this.enemyDirection === -1) || 
                (enemy.x + enemy.width >= this.width && this.enemyDirection === 1)) {
                moveDown = true;
            }
            
            if (Math.random() < config.shootRate) {
                this.enemyShoot(enemy);
            }
        }
        
        if (moveDown) {
            this.enemyDirection *= -1;
            for (const enemy of this.enemies) {
                enemy.y += 20;
            }
        }
    }
    
    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 15,
            speed: 4
        });
    }
    
    updateUFO() {
        if (!this.ufo && Math.random() < 0.001) {
            this.ufo = {
                x: Math.random() < 0.5 ? -50 : this.width + 50,
                y: 30,
                width: 50,
                height: 25,
                speed: Math.random() < 0.5 ? 2 : -2,
                points: Math.random() < 0.5 ? 50 : 100,
                trail: []
            };
        }
        
        if (this.ufo) {
            this.ufo.trail.unshift({ x: this.ufo.x, y: this.ufo.y });
            if (this.ufo.trail.length > 10) {
                this.ufo.trail.pop();
            }
            
            this.ufo.x += this.ufo.speed;
            
            if (this.ufo.x < -100 || this.ufo.x > this.width + 100) {
                this.ufo = null;
            }
        }
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.life--;
            explosion.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.alpha = explosion.life / explosion.maxLife;
            });
            return explosion.life > 0;
        });
    }
    
    createExplosion(x, y, color = '#ff6b6b') {
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1
            });
        }
        
        this.explosions.push({
            x: x,
            y: y,
            particles: particles,
            life: 30,
            maxLife: 30
        });
    }
    
    checkCollisions() {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    this.score += enemy.points;
                    this.enemiesKilled++;
                    
                    if (Math.random() < 0.15) {
                        this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    }
                    
                    this.enemies.splice(j, 1);
                    this.playerBullets.splice(i, 1);
                    
                    if (this.enemiesKilled % 5 === 0) {
                        this.enemySpeed = this.baseEnemySpeed * (1 + (this.enemiesKilled / 5) * 0.05);
                    }
                    
                    this.checkLifeBonus();
                    this.updateUI();
                    break;
                }
            }
        }
        
        if (this.ufo) {
            for (let i = this.playerBullets.length - 1; i >= 0; i--) {
                const bullet = this.playerBullets[i];
                
                if (this.isColliding(bullet, this.ufo)) {
                    this.createExplosion(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, '#ffd700');
                    this.score += this.ufo.points;
                    this.showMessage(`UFO 击毁！+${this.ufo.points} 分`, 1500);
                    
                    if (Math.random() < 0.5) {
                        this.spawnPowerUp(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2);
                    }
                    
                    this.ufo = null;
                    this.playerBullets.splice(i, 1);
                    this.checkLifeBonus();
                    this.updateUI();
                    break;
                }
            }
        }
        
        if (this.player) {
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                
                if (this.isColliding(powerUp, this.player)) {
                    this.collectPowerUp(powerUp);
                    this.powerUps.splice(i, 1);
                }
            }
            
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                
                if (this.isColliding(bullet, this.player)) {
                    if (this.hasShield) {
                        this.createExplosion(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, '#00bfff');
                        this.enemyBullets.splice(i, 1);
                        this.showMessage('护盾抵挡了攻击！', 1000);
                    } else {
                        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#00ff88');
                        this.lives--;
                        this.enemyBullets.splice(i, 1);
                        this.updateUI();
                        
                        if (this.lives <= 0) {
                            this.gameOver(false);
                        }
                    }
                    break;
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkLifeBonus() {
        const nextLifeBonus = Math.floor(this.score / 5000) * 5000;
        if (nextLifeBonus > this.lastLifeBonusScore && nextLifeBonus > 0) {
            this.lives++;
            this.lastLifeBonusScore = nextLifeBonus;
            this.showMessage('额外生命 +1！', 1500);
        }
    }
    
    checkGameState() {
        if (this.enemies.length === 0) {
            if (this.level >= 5) {
                this.gameOver(true);
            } else {
                this.nextLevel();
            }
        }
        
        if (this.player) {
            for (const enemy of this.enemies) {
                if (enemy.y + enemy.height >= this.player.y) {
                    this.gameOver(false);
                    break;
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = '❤️'.repeat(this.lives);
    }
    
    render() {
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.renderStars();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.renderUFO();
            this.renderEnemies();
            this.renderPowerUps();
            this.renderPlayer();
            this.renderBullets();
            this.renderExplosions();
            this.renderPowerUpStatus();
            this.renderMessage();
        }
    }
    
    renderPowerUps() {
        for (const powerUp of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            
            const wobble = Math.sin(powerUp.frame * Math.PI) * 2;
            const scale = 1 + Math.sin(powerUp.frame * Math.PI * 2) * 0.1;
            this.ctx.scale(scale, scale);
            this.ctx.translate(0, wobble);
            
            this.ctx.shadowBlur = 15;
            
            switch (powerUp.type) {
                case 'shield':
                    this.ctx.shadowColor = '#00bfff';
                    this.ctx.fillStyle = '#00bfff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = '#0099cc';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, Math.PI, Math.PI * 2);
                    this.ctx.lineTo(0, 8);
                    this.ctx.closePath();
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('🛡', 0, 0);
                    break;
                    
                case 'health':
                    this.ctx.shadowColor = '#00ff88';
                    this.ctx.fillStyle = '#00ff88';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(-6, -2, 12, 4);
                    this.ctx.fillRect(-2, -6, 4, 12);
                    break;
                    
                case 'doubleShot':
                    this.ctx.shadowColor = '#ffd700';
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#0a0e27';
                    this.ctx.fillRect(-8, -6, 4, 12);
                    this.ctx.fillRect(4, -6, 4, 12);
                    break;
                    
                case 'rapidFire':
                    this.ctx.shadowColor = '#ff6b6b';
                    this.ctx.fillStyle = '#ff6b6b';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -8);
                    this.ctx.lineTo(-3, 0);
                    this.ctx.lineTo(0, -2);
                    this.ctx.lineTo(-3, 8);
                    this.ctx.lineTo(3, 0);
                    this.ctx.lineTo(0, 2);
                    this.ctx.closePath();
                    this.ctx.stroke();
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    renderPowerUpStatus() {
        let y = 20;
        const x = 10;
        
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        if (this.hasShield) {
            const remaining = Math.ceil((this.shieldTime - Date.now()) / 1000);
            this.ctx.fillStyle = '#00bfff';
            this.ctx.fillText(`🛡 护盾: ${remaining}秒`, x, y);
            y += 20;
        }
        
        if (this.hasDoubleShot) {
            const remaining = Math.ceil((this.doubleShotTime - Date.now()) / 1000);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`🔫 双发射击: ${remaining}秒`, x, y);
            y += 20;
        }
        
        if (this.hasRapidFire) {
            const remaining = Math.ceil((this.rapidFireTime - Date.now()) / 1000);
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillText(`⚡ 快速射击: ${remaining}秒`, x, y);
        }
    }
    
    renderStars() {
        for (const star of this.stars) {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0) {
                star.twinkleSpeed *= -1;
            }
            
            const alpha = 0.3 + star.brightness * 0.7;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderPlayer() {
        if (!this.player) return;
        
        const p = this.player;
        
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        
        if (this.hasShield) {
            const shieldPulse = Math.sin(Date.now() / 100) * 0.1 + 1;
            this.ctx.shadowColor = '#00bfff';
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = `rgba(0, 191, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, (p.width / 2 + 10) * shieldPulse, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.fillStyle = `rgba(0, 191, 255, 0.1)`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, (p.width / 2 + 10) * shieldPulse, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.height / 2);
        this.ctx.lineTo(-p.width / 2, p.height / 2);
        this.ctx.lineTo(p.width / 2, p.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#00cc66';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.height / 4);
        this.ctx.lineTo(-p.width / 4, p.height / 4);
        this.ctx.lineTo(p.width / 4, p.height / 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(0, p.height / 2 - 5, 5 + Math.random() * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderEnemies() {
        for (const enemy of this.enemies) {
            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            
            if (enemy.type === 'advanced') {
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 2.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(-6, -3, 5, 0, Math.PI * 2);
                this.ctx.arc(6, -3, 5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(-6, -3, 2, 0, Math.PI * 2);
                this.ctx.arc(6, -3, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#ff6b6b';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(-8, -enemy.height / 2);
                this.ctx.lineTo(-5, -enemy.height / 2 - 8);
                this.ctx.moveTo(8, -enemy.height / 2);
                this.ctx.lineTo(5, -enemy.height / 2 - 8);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = '#6b6bff';
                
                const wobble = Math.sin(enemy.frame * Math.PI) * 2;
                this.ctx.beginPath();
                this.ctx.roundRect(-enemy.width / 2.5 + wobble, -enemy.height / 2.5, enemy.width / 1.25, enemy.height / 1.5, 5);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(-6, -2, 6, 0, Math.PI * 2);
                this.ctx.arc(6, -2, 6, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(-6, -2, 3, 0, Math.PI * 2);
                this.ctx.arc(6, -2, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#6b6bff';
                this.ctx.fillRect(-enemy.width / 2.5 + wobble + 5, enemy.height / 3, 6, 10);
                this.ctx.fillRect(enemy.width / 2.5 - wobble - 11, enemy.height / 3, 6, 10);
            }
            
            this.ctx.restore();
        }
    }
    
    renderUFO() {
        if (!this.ufo) return;
        
        for (let i = 0; i < this.ufo.trail.length; i++) {
            const t = this.ufo.trail[i];
            const alpha = 1 - (i / this.ufo.trail.length);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(t.x + this.ufo.width / 2, t.y + this.ufo.height / 2, this.ufo.width / 2 - i, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.save();
        this.ctx.translate(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2);
        
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20;
        
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, this.ufo.width / 2, this.ufo.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(0, -2, this.ufo.width / 4, Math.PI, 0);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const x = Math.cos(angle) * (this.ufo.width / 3);
            const y = Math.sin(angle) * (this.ufo.height / 4) + 5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderBullets() {
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        for (const bullet of this.playerBullets) {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            this.ctx.fillRect(bullet.x - 2, bullet.y, bullet.width + 4, bullet.height + 5);
        }
        this.ctx.shadowBlur = 0;
        
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 10;
        for (const bullet of this.enemyBullets) {
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
            this.ctx.fillRect(bullet.x - 2, bullet.y, bullet.width + 4, bullet.height + 5);
        }
        this.ctx.shadowBlur = 0;
    }
    
    renderExplosions() {
        for (const explosion of this.explosions) {
            for (const p of explosion.particles) {
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    renderMessage() {
        if (this.message && Date.now() - this.message.startTime < this.message.duration) {
            const alpha = 1 - (Date.now() - this.message.startTime) / this.message.duration;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = 'bold 24px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(this.message.text, this.width / 2, this.height / 2);
            this.ctx.restore();
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new SpaceInvaders();
});
const EnemyTypes = {
    bat: {
        name: '小蝙蝠',
        width: 35,
        height: 35,
        health: 1,
        speed: 2.5,
        score: 10,
        color: '#8866ff',
        level: 1
    },
    helicopter: {
        name: '螺旋机',
        width: 40,
        height: 40,
        health: 2,
        speed: 1.5,
        score: 20,
        color: '#66ffaa',
        level: 2
    },
    ufo: {
        name: '大UFO',
        width: 50,
        height: 50,
        health: 5,
        speed: 0.8,
        score: 50,
        color: '#ffaa66',
        level: 3,
        shoots: true,
        shootInterval: 120
    },
    boss: {
        name: '超级大UFO',
        width: 100,
        height: 80,
        health: 30,
        speed: 0.5,
        score: 500,
        color: '#ff6666',
        isBoss: true,
        shoots: true,
        shootInterval: 60
    }
};

const LevelConfig = {
    1: {
        name: '天空',
        waves: 3,
        enemyType: 'bat',
        enemiesPerWave: 5,
        background: ['#0a0a1a', '#1a1a3a', '#2a2a5a']
    },
    2: {
        name: '星空',
        waves: 6,
        enemyType: 'helicopter',
        enemiesPerWave: 7,
        background: ['#0a0a2a', '#1a1a4a', '#2a1a5a']
    },
    3: {
        name: '宇宙',
        waves: 9,
        enemyType: 'ufo',
        enemiesPerWave: 8,
        background: ['#0a001a', '#1a003a', '#2a005a']
    }
};

class Enemy {
    constructor(x, y, type, isBoss = false) {
        this.x = x;
        this.y = y;
        this.type = isBoss ? 'boss' : type;
        this.isBoss = isBoss;
        
        const config = EnemyTypes[this.type];
        this.width = config.width;
        this.height = config.height;
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.score = config.score;
        this.color = config.color;
        this.shoots = config.shoots || false;
        this.shootInterval = config.shootInterval || 120;
        this.shootTimer = 0;
        
        this.angle = 0;
        this.movePhase = Math.random() * Math.PI * 2;
        this.moveAmplitude = 1.5;
        this.moveSpeed = 0.05;
        this.targetY = isBoss ? 150 : 800;
        this.inPosition = false;
        this.bossMoveDir = 1;
    }
    
    update(canvasWidth, player) {
        if (this.isBoss) {
            if (!this.inPosition) {
                this.y += this.speed;
                if (this.y >= this.targetY) {
                    this.inPosition = true;
                }
            } else {
                this.x += this.bossMoveDir * 1.5;
                if (this.x <= this.width / 2 || this.x >= canvasWidth - this.width / 2) {
                    this.bossMoveDir *= -1;
                }
            }
        } else if (this.type === 'helicopter') {
            this.y += this.speed;
            this.movePhase += this.moveSpeed;
            this.x += Math.sin(this.movePhase) * this.moveAmplitude;
        } else {
            this.y += this.speed;
        }
        
        if (this.shoots) {
            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                return true;
            }
        }
        
        return false;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        switch(this.type) {
            case 'bat':
                this.drawBat(ctx);
                break;
            case 'helicopter':
                this.drawHelicopter(ctx);
                break;
            case 'ufo':
                this.drawUFO(ctx);
                break;
            case 'boss':
                this.drawBoss(ctx);
                break;
        }
        
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    drawBat(ctx) {
        ctx.shadowColor = '#8866ff';
        ctx.shadowBlur = 10;
        
        const wingAngle = Math.sin(Date.now() / 100) * 0.3;
        
        ctx.beginPath();
        ctx.ellipse(-20, 0, 15, 10, wingAngle, 0, Math.PI * 2);
        ctx.fillStyle = '#6644cc';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(20, 0, 15, 10, -wingAngle, 0, Math.PI * 2);
        ctx.fillStyle = '#6644cc';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8866ff';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-4, -5, 4, 0, Math.PI * 2);
        ctx.arc(4, -5, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-4, -5, 2, 0, Math.PI * 2);
        ctx.arc(4, -5, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    
    drawHelicopter(ctx) {
        ctx.shadowColor = '#66ffaa';
        ctx.shadowBlur = 10;
        
        const rotorAngle = (Date.now() / 50) % (Math.PI * 2);
        
        ctx.beginPath();
        ctx.ellipse(0, 5, 18, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#44cc88';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, 5, 14, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#66ffaa';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-5, 2, 4, 0, Math.PI * 2);
        ctx.arc(5, 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#aaffdd';
        ctx.fill();
        
        ctx.save();
        ctx.rotate(rotorAngle);
        ctx.beginPath();
        ctx.moveTo(-25, -8);
        ctx.lineTo(25, -8);
        ctx.lineTo(25, -4);
        ctx.lineTo(-25, -4);
        ctx.closePath();
        ctx.fillStyle = '#88ddbb';
        ctx.fill();
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(0, -6, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#aaffdd';
        ctx.fill();
    }
    
    drawUFO(ctx) {
        ctx.shadowColor = '#ffaa66';
        ctx.shadowBlur = 15;
        
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.05;
        ctx.scale(pulse, pulse);
        
        ctx.beginPath();
        ctx.ellipse(0, 10, 25, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#cc8844';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa66';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, -5, 12, 15, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = 'rgba(136, 204, 255, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const lightPhase = Date.now() / 300;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + lightPhase;
            const lx = Math.cos(angle) * 15;
            const ly = Math.sin(angle) * 5 + 8;
            
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fillStyle = Math.sin(angle) > 0 ? '#ffff00' : '#ffaa00';
            ctx.fill();
        }
    }
    
    drawBoss(ctx) {
        ctx.shadowColor = '#ff6666';
        ctx.shadowBlur = 25;
        
        const pulse = 1 + Math.sin(Date.now() / 300) * 0.03;
        ctx.scale(pulse, pulse);
        
        ctx.beginPath();
        ctx.ellipse(0, 15, 50, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#993333';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, 10, 40, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#cc4444';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(0, -5, 25, 30, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#ff8888';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(-15, -10, 8, 0, Math.PI * 2);
        ctx.arc(15, -10, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-15, -10, 4, 0, Math.PI * 2);
        ctx.arc(15, -10, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        const lightPhase = Date.now() / 200;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + lightPhase;
            const lx = Math.cos(angle) * 35;
            const ly = Math.sin(angle) * 12 + 12;
            
            ctx.beginPath();
            ctx.arc(lx, ly, 5, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ffff00';
            ctx.fill();
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 6;
        const barY = -this.height / 2 - 15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }
    
    takeDamage(amount = 1) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    isOutOfBounds(canvasHeight) {
        return this.y > canvasHeight + this.height;
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 60;
        this.waveEnemiesSpawned = 0;
        this.bossSpawned = false;
    }
    
    spawn(canvasWidth, level, isBoss = false) {
        let type;
        let x;
        let y;
        
        if (isBoss) {
            type = 'boss';
            x = canvasWidth / 2;
            y = -100;
        } else {
            type = LevelConfig[level].enemyType;
            x = Utils.random(50, canvasWidth - 50);
            y = -50;
        }
        
        const enemy = new Enemy(x, y, type, isBoss);
        this.enemies.push(enemy);
        return enemy;
    }
    
    update(canvasWidth, canvasHeight, level, wave, player, bulletManager) {
        const config = LevelConfig[level];
        const isBossWave = wave % 3 === 0;
        
        if (isBossWave && !this.bossSpawned && this.waveEnemiesSpawned >= config.enemiesPerWave) {
            this.spawn(canvasWidth, level, true);
            this.bossSpawned = true;
        }
        
        if (!isBossWave || this.waveEnemiesSpawned < config.enemiesPerWave) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawn(canvasWidth, level);
                this.waveEnemiesSpawned++;
            }
        }
        
        const enemiesToRemove = [];
        
        this.enemies.forEach((enemy, index) => {
            const shouldShoot = enemy.update(canvasWidth, player);
            
            if (shouldShoot && enemy.inPosition) {
                bulletManager.shootEnemy(enemy, player);
            }
            
            if (enemy.isOutOfBounds(canvasHeight)) {
                enemiesToRemove.push(index);
            }
        });
        
        for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
            this.enemies.splice(enemiesToRemove[i], 1);
        }
        
        const isWaveComplete = this.waveEnemiesSpawned >= config.enemiesPerWave && 
                               this.enemies.length === 0 && 
                               (!isBossWave || this.bossSpawned);
        
        return isWaveComplete;
    }
    
    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }
    
    clear() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.waveEnemiesSpawned = 0;
        this.bossSpawned = false;
    }
    
    remove(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }
    
    startNewWave() {
        this.waveEnemiesSpawned = 0;
        this.bossSpawned = false;
        this.spawnTimer = 0;
    }
    
    getActiveCount() {
        return this.enemies.length;
    }
}

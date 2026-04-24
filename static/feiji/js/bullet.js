class Bullet {
    constructor(x, y, vx, vy, isEnemy = false, isTracking = false, target = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.isTracking = isTracking;
        this.target = target;
        this.width = isEnemy ? 8 : 6;
        this.height = isEnemy ? 8 : 15;
        this.speed = isEnemy ? 3 : 8;
        this.angle = 0;
        this.rotationSpeed = isEnemy ? 0.1 : 0;
    }
    
    update() {
        if (this.isTracking && this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.angle;
                
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                this.angle += angleDiff * 0.05;
                
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isEnemy) {
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4488';
            ctx.shadowColor = '#ff4488';
            ctx.shadowBlur = 10;
            ctx.fill();
        } else {
            const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#00cc66');
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, -this.height / 2 - 3, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    isOutOfBounds(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 ||
               this.y < -50 || this.y > canvasHeight + 50;
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

class BulletManager {
    constructor() {
        this.playerBullets = [];
        this.enemyBullets = [];
        this.lastShootTime = 0;
        this.shootInterval = 1000 / 8;
    }
    
    shootPlayer(player, hasDoubleBullet = false) {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootInterval) {
            return false;
        }
        
        this.lastShootTime = now;
        
        if (hasDoubleBullet) {
            this.playerBullets.push(new Bullet(player.x - 15, player.y - 20, 0, -8));
            this.playerBullets.push(new Bullet(player.x + 15, player.y - 20, 0, -8));
        } else {
            this.playerBullets.push(new Bullet(player.x, player.y - 25, 0, -8));
        }
        
        return true;
    }
    
    shootEnemy(enemy, target = null) {
        if (enemy.type === 'ufo' && target) {
            const bullet = new Bullet(enemy.x, enemy.y + enemy.height / 2, 0, 3, true, true, target);
            bullet.angle = Math.PI / 2;
            this.enemyBullets.push(bullet);
        } else {
            this.enemyBullets.push(new Bullet(enemy.x, enemy.y + enemy.height / 2, 0, 3, true));
        }
    }
    
    update(canvasWidth, canvasHeight) {
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.update();
            return !bullet.isOutOfBounds(canvasWidth, canvasHeight);
        });
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update();
            return !bullet.isOutOfBounds(canvasWidth, canvasHeight);
        });
    }
    
    draw(ctx) {
        this.playerBullets.forEach(bullet => bullet.draw(ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(ctx));
    }
    
    clear() {
        this.playerBullets = [];
        this.enemyBullets = [];
    }
    
    clearEnemyBullets() {
        this.enemyBullets = [];
    }
}

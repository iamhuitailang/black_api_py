class BulletManager {
    constructor() {
        this.bullets = [];
        this.maxBullets = CONFIG.PLAYER.MAX_BULLETS;
    }

    addBullet(x, y, speed, color, isPlayer = true) {
        if (isPlayer && this.bullets.length >= this.maxBullets) {
            return false;
        }
        
        this.bullets.push({
            x: x,
            y: y,
            width: 4,
            height: isPlayer ? 15 : 10,
            speed: speed,
            color: color,
            isPlayer: isPlayer
        });
        return true;
    }

    update(canvas) {
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.isPlayer) {
                bullet.y -= bullet.speed;
                return bullet.y > -bullet.height;
            } else {
                bullet.y += bullet.speed;
                return bullet.y < canvas.height;
            }
        });
    }

    draw(ctx) {
        this.bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            
            ctx.beginPath();
            if (bullet.isPlayer) {
                ctx.moveTo(bullet.x + bullet.width / 2, bullet.y);
                ctx.lineTo(bullet.x, bullet.y + bullet.height);
                ctx.lineTo(bullet.x + bullet.width, bullet.y + bullet.height);
            } else {
                ctx.moveTo(bullet.x + bullet.width / 2, bullet.y + bullet.height);
                ctx.lineTo(bullet.x, bullet.y);
                ctx.lineTo(bullet.x + bullet.width, bullet.y);
            }
            ctx.closePath();
            ctx.fill();
        });
    }

    checkCollision(rect) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (Utils.checkCollision(bullet, rect)) {
                this.bullets.splice(i, 1);
                return bullet;
            }
        }
        return null;
    }

    removeBullet(index) {
        this.bullets.splice(index, 1);
    }

    clear() {
        this.bullets = [];
    }

    getCount() {
        return this.bullets.length;
    }
}
class Bullet {
    constructor(x, y, angle, speed, damage) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.size = 4;
        this.color = '#ffcc00';
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.fillStyle = `rgba(255, 204, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.size * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isOutOfBounds(canvas) {
        return this.x < -50 || this.x > canvas.width + 50 ||
               this.y < -50 || this.y > canvas.height + 50;
    }
}

class Weapon {
    constructor(configKey) {
        this.config = CONFIG.WEAPONS[configKey];
        this.name = this.config.name;
        this.damage = this.config.damage;
        this.fireRate = this.config.fireRate;
        this.magazineSize = this.config.magazineSize;
        this.reloadTime = this.config.reloadTime;
        this.bulletSpeed = this.config.bulletSpeed;
        this.spread = this.config.spread;
        this.bulletsPerShot = this.config.bulletsPerShot;
        
        this.ammo = this.magazineSize;
        this.isReloading = false;
        this.lastShotTime = 0;
        this.reloadStartTime = 0;
    }

    canShoot() {
        const now = Date.now();
        return !this.isReloading && this.ammo > 0 && now - this.lastShotTime >= this.fireRate;
    }

    shoot(x, y, angle, bullets, particleSystem) {
        if (!this.canShoot()) return false;
        
        this.lastShotTime = Date.now();
        this.ammo--;
        
        for (let i = 0; i < this.bulletsPerShot; i++) {
            const spreadAngle = angle + Utils.random(-this.spread, this.spread);
            bullets.push(new Bullet(x, y, spreadAngle, this.bulletSpeed, this.damage));
        }
        
        particleSystem.emitMuzzleFlash(x, y, angle);
        
        if (this.ammo === 0) {
            this.startReload();
        }
        
        return true;
    }

    startReload() {
        if (this.isReloading || this.ammo === this.magazineSize) return;
        this.isReloading = true;
        this.reloadStartTime = Date.now();
    }

    updateReload() {
        if (this.isReloading) {
            const now = Date.now();
            if (now - this.reloadStartTime >= this.reloadTime) {
                this.ammo = this.magazineSize;
                this.isReloading = false;
            }
        }
    }

    getReloadProgress() {
        if (!this.isReloading) return 1;
        const elapsed = Date.now() - this.reloadStartTime;
        return Math.min(1, elapsed / this.reloadTime);
    }
}

class WeaponManager {
    constructor() {
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.unlockedWeapons = ['PISTOL'];
    }

    addWeapon(configKey) {
        if (!this.unlockedWeapons.includes(configKey)) {
            this.unlockedWeapons.push(configKey);
            this.weapons.push(new Weapon(configKey));
        }
    }

    getCurrentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            return true;
        }
        return false;
    }

    nextWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    }

    previousWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    }

    update() {
        this.weapons.forEach(w => w.updateReload());
    }

    checkUnlocks(score) {
        Object.entries(CONFIG.WEAPONS).forEach(([key, config]) => {
            if (score >= config.unlockScore && !this.unlockedWeapons.includes(key)) {
                this.addWeapon(key);
            }
        });
    }

    init() {
        this.weapons = this.unlockedWeapons.map(key => new Weapon(key));
        this.currentWeaponIndex = 0;
    }
}

class Weapon {
    constructor(type, owner) {
        const config = Config.WEAPONS[type];
        this.type = type;
        this.owner = owner;
        this.name = config.name;
        this.icon = config.icon;
        this.damage = config.damage;
        this.fireRate = config.fireRate;
        this.magazineSize = config.magazineSize;
        this.reloadTime = config.reloadTime;
        this.bulletSpeed = config.bulletSpeed;
        this.bulletSpread = config.bulletSpread;
        this.range = config.range;
        this.bulletsPerShot = config.bulletsPerShot;
        this.color = config.color;

        this.ammo = this.magazineSize;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.reloadProgress = 0;
    }

    update(currentTime) {
        if (this.isReloading) {
            const classConfig = Config.CHARACTER_CLASSES[this.owner.classType];
            const adjustedReloadTime = this.reloadTime / classConfig.reloadSpeedMultiplier;
            const elapsed = currentTime - this.reloadStartTime;
            this.reloadProgress = Math.min(1, elapsed / adjustedReloadTime);
            
            if (elapsed >= adjustedReloadTime) {
                this.finishReload();
            }
        }
    }

    canFire(currentTime) {
        return !this.isReloading && 
               this.ammo > 0 && 
               (currentTime - this.lastFireTime) >= this.fireRate;
    }

    fire(currentTime, startX, startY, angle, bullets) {
        if (!this.canFire(currentTime)) return false;

        this.lastFireTime = currentTime;
        this.ammo--;

        for (let i = 0; i < this.bulletsPerShot; i++) {
            const spread = (Math.random() - 0.5) * this.bulletSpread * 2;
            const bulletAngle = angle + spread;
            
            bullets.push(new Bullet({
                x: startX,
                y: startY,
                angle: bulletAngle,
                speed: this.bulletSpeed,
                damage: this.damage,
                range: this.range,
                color: this.color,
                owner: 'player',
                weaponType: this.type
            }));
        }

        return true;
    }

    startReload(currentTime) {
        if (this.isReloading || this.ammo === this.magazineSize) return false;
        this.isReloading = true;
        this.reloadStartTime = currentTime;
        this.reloadProgress = 0;
        return true;
    }

    finishReload() {
        this.isReloading = false;
        this.ammo = this.magazineSize;
        this.reloadProgress = 0;
    }

    cancelReload() {
        this.isReloading = false;
        this.reloadProgress = 0;
    }

    getReloadProgress() {
        return this.reloadProgress;
    }

    serialize() {
        return {
            type: this.type,
            ammo: this.ammo,
            isReloading: this.isReloading,
            reloadStartTime: this.reloadStartTime,
            reloadProgress: this.reloadProgress,
            lastFireTime: this.lastFireTime
        };
    }

    static deserialize(data, owner) {
        const weapon = new Weapon(data.type, owner);
        weapon.ammo = data.ammo;
        weapon.isReloading = data.isReloading;
        weapon.reloadStartTime = data.reloadStartTime;
        weapon.reloadProgress = data.reloadProgress;
        weapon.lastFireTime = data.lastFireTime;
        return weapon;
    }
}

class Bullet {
    constructor(options) {
        this.id = Utils.uuid();
        this.x = options.x;
        this.y = options.y;
        this.angle = options.angle;
        this.speed = options.speed;
        this.damage = options.damage;
        this.range = options.range;
        this.color = options.color || '#ffcc00';
        this.owner = options.owner;
        this.weaponType = options.weaponType || null;
        
        this.startX = options.x;
        this.startY = options.y;
        this.active = true;
        this.radius = 4;
    }

    update(dt, map) {
        const vx = Math.cos(this.angle) * this.speed * dt;
        const vy = Math.sin(this.angle) * this.speed * dt;
        
        this.x += vx;
        this.y += vy;

        const traveled = Utils.distance(this.startX, this.startY, this.x, this.y);
        if (traveled >= this.range) {
            this.active = false;
            return;
        }

        if (this.x < 0 || this.x > Config.MAP_WIDTH || 
            this.y < 0 || this.y > Config.MAP_HEIGHT) {
            this.active = false;
            return;
        }

        if (map && map.checkCollision(this.x, this.y, this.radius)) {
            this.active = false;
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        const gradient = ctx.createLinearGradient(-15, 0, 8, 0);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0)');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#ffffff');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            angle: this.angle,
            speed: this.speed,
            damage: this.damage,
            range: this.range,
            color: this.color,
            owner: this.owner,
            weaponType: this.weaponType,
            startX: this.startX,
            startY: this.startY,
            active: this.active
        };
    }

    static deserialize(data) {
        const bullet = new Bullet({
            x: data.x,
            y: data.y,
            angle: data.angle,
            speed: data.speed,
            damage: data.damage,
            range: data.range,
            color: data.color,
            owner: data.owner,
            weaponType: data.weaponType
        });
        bullet.id = data.id;
        bullet.startX = data.startX;
        bullet.startY = data.startY;
        bullet.active = data.active;
        return bullet;
    }
}

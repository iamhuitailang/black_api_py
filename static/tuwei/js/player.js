class Player {
    constructor(classType, x, y) {
        this.id = Utils.uuid();
        this.classType = classType;
        const config = Config.CHARACTER_CLASSES[classType];
        
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.moveSpeed = config.moveSpeed;
        this.damageMultiplier = config.damageMultiplier;
        this.critChance = config.critChance;
        this.damageReduction = config.damageReduction;
        this.reloadDamageReduction = config.reloadDamageReduction || 0;
        this.longRangeBonus = config.longRangeBonus || 0;
        this.color = config.color;
        this.name = config.name;
        
        this.angle = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        
        this.weapons = {};
        this.currentWeaponType = 'pistol';
        this.lastShotTime = 0;
        
        this.hitFlashTime = 0;
        this.invincibleTime = 0;
        
        this.kills = 0;
        this.score = 0;
        this.damageDealt = 0;
    }

    initWeapons() {
        this.weapons = {
            pistol: new Weapon('pistol', this),
            rifle: new Weapon('rifle', this),
            shotgun: new Weapon('shotgun', this)
        };
        this.currentWeaponType = 'pistol';
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponType];
    }

    update(dt, currentTime, map, enemies) {
        this.angle = Utils.angle(this.x, this.y, Input.mouse.worldX, Input.mouse.worldY);
        
        const move = Input.getMoveVector();
        let targetVX = move.x * this.moveSpeed;
        let targetVY = move.y * this.moveSpeed;
        
        this.velocityX = Utils.lerp(this.velocityX, targetVX, 0.2);
        this.velocityY = Utils.lerp(this.velocityY, targetVY, 0.2);
        
        const newX = this.x + this.velocityX * dt;
        const newY = this.y + this.velocityY * dt;
        
        if (!map.checkCollision(newX, this.y, this.radius)) {
            this.x = newX;
        } else {
            this.velocityX = 0;
        }
        
        if (!map.checkCollision(this.x, newY, this.radius)) {
            this.y = newY;
        } else {
            this.velocityY = 0;
        }
        
        this.x = Utils.clamp(this.x, this.radius, Config.MAP_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, Config.MAP_HEIGHT - this.radius);
        
        if (this.currentWeapon) {
            this.currentWeapon.update(currentTime);
        }
        
        const weaponSwitch = Input.getWeaponSwitch();
        if (weaponSwitch && this.weapons[weaponSwitch] && weaponSwitch !== this.currentWeaponType) {
            this.switchWeapon(weaponSwitch);
        }
        
        if (Input.isReloadPressed() && this.currentWeapon && !this.currentWeapon.isReloading) {
            this.currentWeapon.startReload(currentTime);
        }
        
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= dt;
        }
        
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
        }
    }

    tryShoot(currentTime, bullets) {
        if (!Input.mouse.down || !this.currentWeapon) return false;
        
        const weapon = this.currentWeapon;
        if (!weapon.canFire(currentTime)) return false;
        
        const muzzleX = this.x + Math.cos(this.angle) * 25;
        const muzzleY = this.y + Math.sin(this.angle) * 25;
        
        weapon.fire(currentTime, muzzleX, muzzleY, this.angle, bullets);
        return true;
    }

    switchWeapon(type) {
        if (this.weapons[type]) {
            if (this.currentWeapon && this.currentWeapon.isReloading) {
                this.currentWeapon.cancelReload();
            }
            this.currentWeaponType = type;
        }
    }

    takeDamage(damage, source = null) {
        if (this.invincibleTime > 0) return false;
        
        let actualDamage = damage;
        let reduction = this.damageReduction;
        
        if (this.currentWeapon && this.currentWeapon.isReloading) {
            reduction = Math.max(reduction, this.reloadDamageReduction);
        }
        
        actualDamage = Math.ceil(actualDamage * (1 - reduction));
        this.health = Math.max(0, this.health - actualDamage);
        this.hitFlashTime = 0.2;
        this.invincibleTime = 0.1;
        
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    calculateDamage(baseDamage, distance) {
        let damage = baseDamage * this.damageMultiplier;
        
        const isCrit = Math.random() < this.critChance;
        if (isCrit) {
            damage *= 2;
        }
        
        if (this.longRangeBonus > 0 && distance > 300) {
            damage *= (1 + this.longRangeBonus);
        }
        
        return { damage: Math.ceil(damage), isCrit };
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        
        const groundGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 60);
        groundGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        groundGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = groundGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 20, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 40 * pulse;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * pulse})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 30, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▼', screenX, screenY - this.radius - 35);
        
        const aimLength = 60;
        const aimEndX = screenX + Math.cos(this.angle) * aimLength;
        const aimEndY = screenY + Math.sin(this.angle) * aimLength;
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(screenX + Math.cos(this.angle) * (this.radius + 5), screenY + Math.sin(this.angle) * (this.radius + 5));
        ctx.lineTo(aimEndX, aimEndY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.arc(aimEndX, aimEndY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(3, 8, this.radius + 4, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        const bodyColor = this.hitFlashTime > 0 ? '#ff6666' : this.color;
        gradient.addColorStop(0, bodyColor);
        gradient.addColorStop(1, this.darkenColor(bodyColor, 0.4));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(12, -6, 28, 12);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(14, -4, 24, 8);
        
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(-5, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        if (this.currentWeapon && this.currentWeapon.isReloading) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX - 40, screenY + this.radius + 15, 80, 10);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(screenX - 40, screenY + this.radius + 15, 80 * this.currentWeapon.getReloadProgress(), 10);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - 40, screenY + this.radius + 15, 80, 10);
        }
        
        const barWidth = 70;
        const barHeight = 10;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.radius - 25;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    serialize() {
        const weaponsData = {};
        for (const type in this.weapons) {
            weaponsData[type] = this.weapons[type].serialize();
        }
        
        return {
            id: this.id,
            classType: this.classType,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            angle: this.angle,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            currentWeaponType: this.currentWeaponType,
            weapons: weaponsData,
            kills: this.kills,
            score: this.score,
            damageDealt: this.damageDealt,
            hitFlashTime: this.hitFlashTime,
            invincibleTime: this.invincibleTime
        };
    }

    static deserialize(data) {
        const player = new Player(data.classType, data.x, data.y);
        player.id = data.id;
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        player.angle = data.angle;
        player.velocityX = data.velocityX;
        player.velocityY = data.velocityY;
        player.currentWeaponType = data.currentWeaponType;
        player.kills = data.kills;
        player.score = data.score;
        player.damageDealt = data.damageDealt;
        player.hitFlashTime = data.hitFlashTime;
        player.invincibleTime = data.invincibleTime;
        
        player.weapons = {};
        for (const type in data.weapons) {
            player.weapons[type] = Weapon.deserialize(data.weapons[type], player);
        }
        
        return player;
    }
}

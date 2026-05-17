class Mecha {
    constructor(type, x, y) {
        this.config = CONFIG.MECHAS[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 100;
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.defense = this.config.defense;
        this.ammo = this.config.ammo;
        this.maxAmmo = this.config.ammo;
        this.color = this.config.color;
        this.selectedSkill = 'normal';
        this.ultimateCharge = 0;
        this.maxUltimateCharge = 100;
        this.effects = [];
        this.defenseModules = this.createDefenseModules();
        this.isStunned = false;
        this.stunEndTime = 0;
        this.isBurning = false;
        this.burnEndTime = 0;
        this.burnDamage = 0;
        this.hasShield = false;
        this.shieldEndTime = 0;
    }

    createDefenseModules() {
        const modules = [];
        const moduleCount = 3;
        const startX = this.x - this.width / 2 + 10;
        
        for (let i = 0; i < moduleCount; i++) {
            modules.push({
                x: startX + i * 25,
                y: this.y - 20,
                width: 20,
                height: 15,
                health: this.defense / moduleCount,
                maxHealth: this.defense / moduleCount,
                destroyed: false
            });
        }
        return modules;
    }

    takeDamage(damage) {
        if (this.hasShield) {
            damage *= 0.5;
        }
        
        let remainingDamage = damage;
        
        for (const module of this.defenseModules) {
            if (!module.destroyed && remainingDamage > 0) {
                const moduleDamage = Math.min(module.health, remainingDamage);
                module.health -= moduleDamage;
                remainingDamage -= moduleDamage;
                
                if (module.health <= 0) {
                    module.destroyed = true;
                }
            }
        }
        
        if (remainingDamage > 0) {
            this.health -= remainingDamage;
            if (this.health < 0) this.health = 0;
        }
        
        this.addUltimateCharge(damage * 0.5);
    }

    addUltimateCharge(amount) {
        this.ultimateCharge = Math.min(this.maxUltimateCharge, this.ultimateCharge + amount);
    }

    canUseUltimate() {
        return this.ultimateCharge >= this.maxUltimateCharge;
    }

    useUltimate() {
        if (this.canUseUltimate()) {
            this.ultimateCharge = 0;
            return true;
        }
        return false;
    }

    applyEffect(effectType, duration, damage = 0) {
        const now = Date.now();
        
        switch (effectType) {
            case 'paralyze':
                this.isStunned = true;
                this.stunEndTime = now + duration * 1000;
                break;
            case 'burn':
                this.isBurning = true;
                this.burnEndTime = now + duration * 1000;
                this.burnDamage = damage;
                break;
            case 'shield':
                this.hasShield = true;
                this.shieldEndTime = now + duration * 1000;
                break;
        }
    }

    updateEffects() {
        const now = Date.now();
        
        if (this.isStunned && now > this.stunEndTime) {
            this.isStunned = false;
        }
        
        if (this.isBurning) {
            if (now > this.burnEndTime) {
                this.isBurning = false;
            } else {
                this.health -= this.burnDamage * 0.016;
                if (this.health < 0) this.health = 0;
            }
        }
        
        if (this.hasShield && now > this.shieldEndTime) {
            this.hasShield = false;
        }
    }

    restoreAmmo() {
        this.ammo = this.maxAmmo;
    }

    useAmmo() {
        if (this.ammo > 0) {
            this.ammo--;
            return true;
        }
        return false;
    }

    draw(ctx) {
        this.updateEffects();
        
        const mechaX = this.x - this.width / 2;
        const mechaY = this.y - this.height / 2;
        
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
            ctx.fill();
        }
        
        const gradient = ctx.createLinearGradient(mechaX, mechaY, mechaX + this.width, mechaY + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.adjustColor(this.color, -30));
        gradient.addColorStop(1, this.adjustColor(this.color, -60));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(mechaX, mechaY, this.width, this.height, 10);
        ctx.fill();
        
        ctx.strokeStyle = this.adjustColor(this.color, 30);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 15, mechaY + 25, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 15, mechaY + 25, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.isStunned ? '#ffff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 15, mechaY + 25, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 15, mechaY + 25, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.adjustColor(this.color, -40);
        ctx.fillRect(mechaX + 10, mechaY + 50, this.width - 20, 20);
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.x, mechaY + 60, 6, 0, Math.PI * 2);
        ctx.fill();
        
        for (const module of this.defenseModules) {
            if (!module.destroyed) {
                const moduleGradient = ctx.createLinearGradient(module.x, module.y, module.x + module.width, module.y + module.height);
                moduleGradient.addColorStop(0, '#00ccff');
                moduleGradient.addColorStop(1, '#0066cc');
                ctx.fillStyle = moduleGradient;
                ctx.beginPath();
                ctx.roundRect(module.x, module.y, module.width, module.height, 3);
                ctx.fill();
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        if (this.isBurning) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            for (let i = 0; i < 5; i++) {
                const flameX = mechaX + Math.random() * this.width;
                const flameY = mechaY + Math.random() * this.height * 0.5;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 5 + Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            ammo: this.ammo,
            ultimateCharge: this.ultimateCharge,
            selectedSkill: this.selectedSkill,
            defenseModules: this.defenseModules,
            isStunned: this.isStunned,
            stunEndTime: this.stunEndTime,
            isBurning: this.isBurning,
            burnEndTime: this.burnEndTime,
            burnDamage: this.burnDamage,
            hasShield: this.hasShield,
            shieldEndTime: this.shieldEndTime
        };
    }

    loadState(state) {
        this.type = state.type;
        this.config = CONFIG.MECHAS[state.type];
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.maxHealth = state.maxHealth;
        this.ammo = state.ammo;
        this.ultimateCharge = state.ultimateCharge;
        this.selectedSkill = state.selectedSkill;
        this.defenseModules = state.defenseModules;
        this.isStunned = state.isStunned;
        this.stunEndTime = state.stunEndTime;
        this.isBurning = state.isBurning;
        this.burnEndTime = state.burnEndTime;
        this.burnDamage = state.burnDamage;
        this.hasShield = state.hasShield;
        this.shieldEndTime = state.shieldEndTime;
    }
}
const Character = (() => {
    class Player {
        constructor(type, x, y) {
            const config = Constants.CHARACTERS[type];
            this.type = type;
            this.name = config.name;
            this.x = x;
            this.y = y;
            this.width = 55;
            this.height = 90;
            this.maxHealth = config.maxHealth;
            this.health = config.maxHealth;
            this.attack = config.attack;
            this.defense = config.defense;
            this.speed = config.speed;
            this.skillDamage = config.skillDamage;
            this.skillName = config.skillName;
            this.color = config.color;
            this.icon = config.icon;
            this.skillEnergy = 0;
            this.maxSkillEnergy = 100;
            this.isShielded = false;
            this.shieldDuration = 0;
            this.attackCooldown = 0;
            this.isAttacking = false;
            this.attackFrame = 0;
            this.invincible = false;
            this.invincibleTime = 0;
            this.velocityX = 0;
            this.velocityY = 0;
        }
        
        update(deltaTime, elevator) {
            const { dx, dy } = Input.getDirection();
            this.velocityX = dx * this.speed;
            this.velocityY = dy * this.speed;
            
            const newX = this.x + this.velocityX;
            const newY = this.y + this.velocityY;
            
            const minX = elevator.x + 30;
            const maxX = elevator.x + elevator.width - this.width - 30;
            const minY = elevator.y + 90;
            const maxY = elevator.y + elevator.height - this.height - 30;
            
            this.x = Math.max(minX, Math.min(maxX, newX));
            this.y = Math.max(minY, Math.min(maxY, newY));
            
            if (this.attackCooldown > 0) {
                this.attackCooldown -= deltaTime;
            }
            
            if (this.isAttacking) {
                this.attackFrame += deltaTime;
                if (this.attackFrame > 300) {
                    this.isAttacking = false;
                    this.attackFrame = 0;
                }
            }
            
            if (this.isShielded) {
                this.shieldDuration -= deltaTime;
                if (this.shieldDuration <= 0) {
                    this.isShielded = false;
                }
            }
            
            if (this.invincible) {
                this.invincibleTime -= deltaTime;
                if (this.invincibleTime <= 0) {
                    this.invincible = false;
                }
            }
            
            this.skillEnergy = Math.min(this.maxSkillEnergy, this.skillEnergy + deltaTime * 0.01);
        }
        
        takeDamage(damage) {
            if (this.invincible) return 0;
            
            let actualDamage = Math.max(1, damage - this.defense);
            if (this.isShielded) {
                actualDamage = Math.floor(actualDamage * 0.5);
            }
            
            this.health = Math.max(0, this.health - actualDamage);
            this.invincible = true;
            this.invincibleTime = 500;
            
            return actualDamage;
        }
        
        normalAttack() {
            if (this.attackCooldown > 0) return null;
            
            this.attackCooldown = 500;
            this.isAttacking = true;
            this.attackFrame = 0;
            this.skillEnergy = Math.min(this.maxSkillEnergy, this.skillEnergy + 5);
            
            return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                radius: 60,
                damage: this.attack
            };
        }
        
        useSkill() {
            if (this.skillEnergy < this.maxSkillEnergy) return null;
            
            this.skillEnergy = 0;
            
            if (this.type === 'agent') {
                this.isShielded = true;
                this.shieldDuration = 3000;
                return {
                    type: 'shield',
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    radius: 80,
                    damage: this.skillDamage,
                    duration: 3000
                };
            } else if (this.type === 'runner') {
                this.invincible = true;
                this.invincibleTime = 1500;
                return {
                    type: 'dash',
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    radius: 100,
                    damage: this.skillDamage
                };
            } else if (this.type === 'security') {
                return {
                    type: 'knockback',
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    radius: 120,
                    damage: this.skillDamage,
                    knockbackForce: 150
                };
            }
            
            return null;
        }
        
        heal(amount) {
            this.health = Math.min(this.maxHealth, this.health + amount);
        }
        
        getState() {
            return {
                type: this.type,
                x: this.x,
                y: this.y,
                health: this.health,
                skillEnergy: this.skillEnergy,
                isShielded: this.isShielded,
                shieldDuration: this.shieldDuration,
                invincible: this.invincible,
                invincibleTime: this.invincibleTime
            };
        }
        
        restoreState(state) {
            this.x = state.x;
            this.y = state.y;
            this.health = state.health;
            this.skillEnergy = state.skillEnergy;
            this.isShielded = state.isShielded;
            this.shieldDuration = state.shieldDuration;
            this.invincible = state.invincible;
            this.invincibleTime = state.invincibleTime;
        }
    }
    
    const createPlayer = (type, x, y) => {
        return new Player(type, x, y);
    };
    
    return {
        Player,
        createPlayer
    };
})();
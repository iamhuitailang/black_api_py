const Combat = {
    checkHit(attacker, defender) {
        if (!attacker.currentAttack || attacker.attackHit) return false;
        
        const attackHitbox = attacker.getAttackHitbox();
        const defenderHitbox = defender.getHitbox();
        
        if (!attackHitbox) return false;
        
        const hit = this.checkCollision(attackHitbox, defenderHitbox);
        
        if (hit) {
            attacker.attackHit = true;
            this.applyDamage(attacker, defender);
            return true;
        }
        
        return false;
    },
    
    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    },
    
    applyDamage(attacker, defender) {
        const attack = attacker.currentAttack;
        if (!attack) return;
        
        let damage = attack.damage + (attacker.attackPower - 10);
        damage = Math.max(1, damage);
        
        const comboBonus = attacker.getComboBonus();
        if (comboBonus) {
            damage = Math.floor(damage * comboBonus.damageMultiplier) + comboBonus.bonusDamage;
            this.showComboEffect(attacker, comboBonus.name);
        }
        
        const actualDamage = defender.takeDamage(
            damage,
            attack.hitstun,
            attack.knockback,
            attacker,
            attack.canBlock
        );
        
        if (actualDamage > 0) {
            attacker.addEnergy(attack.energyGain);
            this.showDamageNumber(defender, actualDamage);
            this.createHitEffect(defender);
        }
    },
    
    showDamageNumber(target, damage) {
        const container = document.getElementById('game-container');
        const dmgEl = document.createElement('div');
        dmgEl.className = 'damage-number';
        dmgEl.textContent = `-${damage}`;
        dmgEl.style.left = `${target.x + target.width / 2}px`;
        dmgEl.style.top = `${target.y}px`;
        container.appendChild(dmgEl);
        
        setTimeout(() => {
            dmgEl.remove();
        }, 1000);
    },
    
    showComboEffect(attacker, comboName) {
        const container = document.getElementById('game-container');
        const comboEl = document.createElement('div');
        comboEl.id = 'combo-display';
        comboEl.innerHTML = `<div class="combo-text">${comboName}!</div>`;
        container.appendChild(comboEl);
        
        setTimeout(() => {
            comboEl.remove();
        }, 1500);
    },
    
    createHitEffect(target) {
        const container = document.getElementById('game-container');
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        container.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 100);
    },
    
    checkBodyCollision(char1, char2) {
        const box1 = char1.getHitbox();
        const box2 = char2.getHitbox();
        
        if (this.checkCollision(box1, box2)) {
            const overlapX = Math.min(box1.x + box1.width, box2.x + box2.width) - 
                            Math.max(box1.x, box2.x);
            
            if (char1.x < char2.x) {
                char1.x -= overlapX / 2;
                char2.x += overlapX / 2;
            } else {
                char1.x += overlapX / 2;
                char2.x -= overlapX / 2;
            }
            
            char1.x = Math.max(0, Math.min(GameConfig.CANVAS_WIDTH - char1.width, char1.x));
            char2.x = Math.max(0, Math.min(GameConfig.CANVAS_WIDTH - char2.width, char2.x));
        }
    },
    
    updateCombat(player, opponent, deltaTime) {
        if (player.state === GameConfig.CHARACTER_STATES.DEAD ||
            opponent.state === GameConfig.CHARACTER_STATES.DEAD) {
            return;
        }
        
        if (player.isAttacking() && !player.attackHit) {
            this.checkHit(player, opponent);
        }
        
        if (opponent.isAttacking() && !opponent.attackHit) {
            this.checkHit(opponent, player);
        }
        
        this.checkBodyCollision(player, opponent);
    },
    
    handlePlayerInput(player, opponent) {
        if (player.state === GameConfig.CHARACTER_STATES.DEAD) return;
        
        if (Input.getBlock()) {
            player.startBlock();
        } else {
            player.stopBlock();
        }
        
        if (player.blocking) return;
        
        if (Input.getLeft()) {
            player.moveLeft();
        } else if (Input.getRight()) {
            player.moveRight();
        } else {
            player.stopMoving();
        }
        
        if (Input.getUp()) {
            player.jump();
        }
        
        if (Input.getLightPunch()) {
            player.startAttack(GameConfig.ATTACK_TYPES.LIGHT_PUNCH);
        } else if (Input.getHeavyPunch()) {
            player.startAttack(GameConfig.ATTACK_TYPES.HEAVY_PUNCH);
        } else if (Input.getLightKick()) {
            player.startAttack(GameConfig.ATTACK_TYPES.LIGHT_KICK);
        } else if (Input.getHeavyKick()) {
            if (player.energy >= 100) {
                player.startAttack(GameConfig.ATTACK_TYPES.SPECIAL);
            } else {
                player.startAttack(GameConfig.ATTACK_TYPES.HEAVY_KICK);
            }
        } else if (Input.getSpecial()) {
            if (player.energy >= 100) {
                player.startAttack(GameConfig.ATTACK_TYPES.SPECIAL);
            }
        }
        
        if (Input.getGrab()) {
            if (player.isInRange(opponent)) {
                player.startAttack(GameConfig.ATTACK_TYPES.GRAB);
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Combat;
}

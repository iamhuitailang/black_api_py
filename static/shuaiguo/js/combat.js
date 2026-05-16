class CombatSystem {
    constructor() {
        this.attackQueue = [];
        this.hitEffects = [];
    }

    checkCollision(attacker, defender) {
        if (!attacker.isAttackActive()) return false;
        
        const attack = attacker.currentAttack;
        const attackRange = attack.range;
        
        const attackerCenterX = attacker.x + attacker.width / 2;
        const defenderCenterX = defender.x + defender.width / 2;
        
        const distance = Math.abs(attackerCenterX - defenderCenterX);
        
        const facingCorrect = (attacker.facing > 0 && defenderCenterX > attackerCenterX) ||
                              (attacker.facing < 0 && defenderCenterX < attackerCenterX);
        
        return distance <= attackRange && facingCorrect;
    }

    calculateDamage(attacker, defender, attack) {
        const baseDamage = attack.damage;
        const characterBonus = attacker.characterData.attackDamage / 10;
        const defenseReduction = defender.isDefending ? defender.defense : 0;
        
        const finalDamage = Math.max(1, Math.floor(baseDamage * characterBonus - defenseReduction));
        return finalDamage;
    }

    processAttack(attacker, defender) {
        if (!attacker.isAttackActive()) return null;
        if (!this.checkCollision(attacker, defender)) return null;
        
        const attack = attacker.currentAttack;
        
        if (attack.processed) return null;
        attack.processed = true;
        
        const damage = this.calculateDamage(attacker, defender, attack);
        defender.addBlame(damage);
        
        this.addHitEffect(defender.x + defender.width / 2, defender.y + defender.height / 2, attack.color);
        
        return {
            attacker: attacker.isPlayer ? 'player' : 'enemy',
            defender: defender.isPlayer ? 'player' : 'enemy',
            attack: attack.id,
            damage: damage,
            wasDefended: defender.isDefending
        };
    }

    updateCombat(player, enemy) {
        const results = [];
        
        const playerHit = this.processAttack(player, enemy);
        if (playerHit) results.push(playerHit);
        
        const enemyHit = this.processAttack(enemy, player);
        if (enemyHit) results.push(enemyHit);
        
        player.updateCooldowns(1/60);
        enemy.updateCooldowns(1/60);
        
        return results;
    }

    addHitEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.hitEffects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                color: color,
                life: 0.5,
                size: 8
            });
        }
    }

    updateEffects(deltaTime) {
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.life -= deltaTime;
            effect.size *= 0.95;
            
            if (effect.life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
    }

    resetAttackProcessing(player, enemy) {
        if (player.currentAttack) {
            player.currentAttack.processed = false;
        }
        if (enemy.currentAttack) {
            enemy.currentAttack.processed = false;
        }
    }

    checkGameOver(player, enemy) {
        if (player.isDefeated()) {
            return { winner: 'enemy', reason: '你背锅了！' };
        }
        if (enemy.isDefeated()) {
            return { winner: 'player', reason: '成功甩锅！' };
        }
        return null;
    }

    getState() {
        return {
            hitEffects: [...this.hitEffects]
        };
    }

    loadState(state) {
        this.hitEffects = state.hitEffects ? [...state.hitEffects] : [];
    }
}

class InputHandler {
    constructor() {
        this.keys = {};
        this.keySequence = [];
        this.sequenceTimer = 0;
        this.maxSequenceTime = 0.5;
        this.player = null;
        this.attackQueue = [];
        
        this.setupEventListeners();
    }

    setPlayer(player) {
        this.player = player;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const wasPressed = this.keys[e.key];
            this.keys[e.key] = true;
            if (!wasPressed) {
                this.addToSequence(e.key);
                this.handleAttackKey(e.key);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    handleAttackKey(key) {
        if (!this.player) return;
        
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'a') {
            this.player.attack('lightThrow');
        } else if (lowerKey === 's') {
            this.player.attack('heavyThrow');
        } else if (lowerKey === 'd') {
            this.player.attack('roast');
        } else if (lowerKey === 'w') {
            this.player.attack('deskSlap');
        }
    }

    addToSequence(key) {
        const normalizedKey = this.normalizeKey(key);
        if (normalizedKey) {
            this.keySequence.push(normalizedKey);
            this.sequenceTimer = this.maxSequenceTime;
        }
    }

    normalizeKey(key) {
        const keyMap = {
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'ArrowDown': '↓',
            'ArrowUp': '↑',
            'a': 'A',
            'A': 'A',
            's': 'S',
            'S': 'S',
            'd': 'D',
            'D': 'D',
            'w': 'W',
            'W': 'W'
        };
        return keyMap[key] || null;
    }

    updateSequence(deltaTime) {
        this.sequenceTimer -= deltaTime;
        if (this.sequenceTimer <= 0) {
            this.keySequence = [];
        }
    }

    checkUltimate() {
        const sequence = this.keySequence.slice(-3);
        const ultimateSequence = ['↓', '→', 'A'];
        
        if (sequence.length >= 3) {
            const lastThree = sequence.slice(-3);
            return lastThree.every((v, i) => v === ultimateSequence[i]);
        }
        return false;
    }

    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    handlePlayerInput(player, deltaTime) {
        this.player = player;
        this.updateSequence(deltaTime);
        
        if (this.isKeyPressed('ArrowLeft')) {
            player.moveLeft();
        } else if (this.isKeyPressed('ArrowRight')) {
            player.moveRight();
        } else {
            player.stopMoving();
        }
        
        if (this.isKeyPressed('ArrowUp')) {
            player.jump();
        }
        
        player.defend(this.isKeyPressed('ArrowDown'));
        
        if (this.checkUltimate()) {
            player.attack('ultimate');
            this.keySequence = [];
        }
    }
}
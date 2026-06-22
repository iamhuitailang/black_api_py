class Player {
    constructor(startX, startY) {
        this.x = startX + 0.5;
        this.y = startY + 0.5;
        this.maxHp = CONFIG.PLAYER_MAX_HP;
        this.hp = CONFIG.PLAYER_MAX_HP;
        this.speed = CONFIG.PLAYER_SPEED;
        this.antidoteCount = CONFIG.ANTIDOTE_COUNT;

        this.immuneTime = 0;
        this.poisonBoostTime = 0;
        this.lastPoisonTick = 0;
        this.invincibleTime = 0;

        this.direction = { x: 0, y: 0 };
        this.isMoving = false;
        this.moveInput = { up: false, down: false, left: false, right: false };
    }

    reset(startX, startY) {
        this.x = startX + 0.5;
        this.y = startY + 0.5;
        this.hp = CONFIG.PLAYER_MAX_HP;
        this.antidoteCount = CONFIG.ANTIDOTE_COUNT;
        this.immuneTime = 0;
        this.poisonBoostTime = 0;
        this.lastPoisonTick = 0;
        this.invincibleTime = 0;
        this.moveInput = { up: false, down: false, left: false, right: false };
    }

    useAntidote() {
        if (this.antidoteCount <= 0) return false;
        this.antidoteCount--;
        this.immuneTime = Math.max(this.immuneTime, CONFIG.ANTIDOTE_IMMUNE_TIME);
        return true;
    }

    takeDamage(damage) {
        if (this.invincibleTime > 0) return;
        this.hp = Math.max(0, this.hp - damage);
        this.invincibleTime = 0.5;
        Effects.showDamageOverlay();
    }

    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    applyPurification(healAmount, immuneTime) {
        this.heal(healAmount);
        this.immuneTime = Math.max(this.immuneTime, immuneTime);
        this.poisonBoostTime = 0;
        Effects.showHealOverlay();
    }

    applyPoisonBoost(duration) {
        this.poisonBoostTime = Math.max(this.poisonBoostTime, duration);
    }

    applyPoisonDamage(zoneDamage, deltaTime) {
        if (this.immuneTime > 0) return 0;

        this.lastPoisonTick += deltaTime;
        if (this.lastPoisonTick >= 1) {
            this.lastPoisonTick = 0;
            let damage = zoneDamage;
            if (this.poisonBoostTime > 0) {
                damage *= 2;
            }
            this.hp = Math.max(0, this.hp - damage);
            return damage;
        }
        return 0;
    }

    setMovement(direction, pressed) {
        switch (direction) {
            case 'up':
                this.moveInput.up = pressed;
                break;
            case 'down':
                this.moveInput.down = pressed;
                break;
            case 'left':
                this.moveInput.left = pressed;
                break;
            case 'right':
                this.moveInput.right = pressed;
                break;
        }
    }

    update(deltaTime, gameMap) {
        if (this.immuneTime > 0) {
            this.immuneTime -= deltaTime;
        }
        if (this.poisonBoostTime > 0) {
            this.poisonBoostTime -= deltaTime;
        }
        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
        }

        let dx = 0, dy = 0;
        if (this.moveInput.up) dy -= 1;
        if (this.moveInput.down) dy += 1;
        if (this.moveInput.left) dx -= 1;
        if (this.moveInput.right) dx += 1;

        this.isMoving = dx !== 0 || dy !== 0;

        if (this.isMoving) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.direction = { x: dx, y: dy };

            const moveDistance = this.speed * deltaTime;
            const newX = this.x + dx * moveDistance;
            const newY = this.y + dy * moveDistance;

            if (gameMap.canMove(newX, this.y)) {
                this.x = newX;
            }
            if (gameMap.canMove(this.x, newY)) {
                this.y = newY;
            }

            gameMap.exploreArea(this.x, this.y, CONFIG.VISION_RADIUS);
        }

        const zoneDamage = gameMap.getZoneDamage(this.x);
        this.applyPoisonDamage(zoneDamage, deltaTime);

        if (gameMap.checkPoisonPool(this.x, this.y)) {
            this.applyPoisonDamage(CONFIG.ZONES.EXIT.damage, deltaTime * 2);
        }
    }

    render(ctx) {
        const tileSize = CONFIG.TILE_SIZE;
        const px = this.x * tileSize;
        const py = this.y * tileSize;

        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
            return;
        }

        if (this.immuneTime > 0) {
            const pulse = (Math.sin(Date.now() / 100) + 1) / 2;
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, tileSize * (0.8 + pulse * 0.3));
            gradient.addColorStop(0, 'rgba(57, 255, 20, 0.4)');
            gradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(px - tileSize, py - tileSize, tileSize * 3, tileSize * 3);
        }

        if (this.poisonBoostTime > 0) {
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, tileSize * 0.6);
            gradient.addColorStop(0, 'rgba(220, 20, 60, 0.5)');
            gradient.addColorStop(1, 'rgba(220, 20, 60, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(px - tileSize / 2, py - tileSize / 2, tileSize * 2, tileSize * 2);
        }

        ctx.fillStyle = CONFIG.COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(px, py, tileSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        const eyeOffset = tileSize * 0.1;
        const eyeSize = tileSize * 0.08;
        ctx.beginPath();
        ctx.arc(px - eyeOffset, py - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.arc(px + eyeOffset, py - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        const arrowLength = tileSize * 0.3;
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(
                px + this.direction.x * arrowLength,
                py + this.direction.y * arrowLength
            );
            ctx.stroke();
        }
    }

    isDead() {
        return this.hp <= 0;
    }

    getHpPercent() {
        return (this.hp / this.maxHp) * 100;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            maxHp: this.maxHp,
            hp: this.hp,
            speed: this.speed,
            antidoteCount: this.antidoteCount,
            immuneTime: this.immuneTime,
            poisonBoostTime: this.poisonBoostTime,
            lastPoisonTick: this.lastPoisonTick,
            invincibleTime: this.invincibleTime,
            direction: this.direction,
            isMoving: this.isMoving,
            moveInput: this.moveInput
        };
    }

    static deserialize(data) {
        const player = Object.create(Player.prototype);
        player.x = data.x;
        player.y = data.y;
        player.maxHp = data.maxHp;
        player.hp = data.hp;
        player.speed = data.speed;
        player.antidoteCount = data.antidoteCount;
        player.immuneTime = data.immuneTime;
        player.poisonBoostTime = data.poisonBoostTime;
        player.lastPoisonTick = data.lastPoisonTick;
        player.invincibleTime = data.invincibleTime;
        player.direction = data.direction;
        player.isMoving = data.isMoving;
        player.moveInput = data.moveInput;
        return player;
    }
}

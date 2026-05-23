class Item {
    constructor(x, type, speed) {
        this.x = x;
        this.y = -50;
        this.type = type;
        this.config = GameConfig.ITEM_TYPES[type];
        this.size = this.config.size;
        this.speed = speed;
        this.rotation = 0;
        this.rotationSpeed = Utils.random(-2, 2);
        this.alive = true;
        this.wobble = 0;
        this.wobbleSpeed = Utils.random(3, 6);
    }

    update(deltaTime, canvasHeight) {
        this.y += this.speed * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;
        this.wobble += this.wobbleSpeed * deltaTime;

        if (this.y > canvasHeight + 50) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        switch(this.type) {
            case 'APPLE':
                this.drawApple(ctx);
                break;
            case 'KNIFE':
                this.drawKnife(ctx);
                break;
            case 'LONG_KNIFE':
                this.drawLongKnife(ctx);
                break;
            case 'GIFT':
                this.drawGift(ctx);
                break;
            case 'ROTTEN':
                this.drawRotten(ctx);
                break;
            case 'ROCK':
                this.drawRock(ctx);
                break;
            case 'BOTTLE':
                this.drawBottle(ctx);
                break;
        }

        ctx.restore();

        if (this.config.type === 'buff') {
            ctx.save();
            const glowSize = this.size * 0.8 + Math.sin(Date.now() * 0.005) * 8;
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.config.type === 'danger') {
            ctx.save();
            const warnSize = this.size * 0.6;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.008) * 0.2;
            const warnGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, warnSize);
            warnGradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
            warnGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = warnGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, warnSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawApple(ctx) {
        const s = this.size / 2;
        
        const appleGradient = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
        appleGradient.addColorStop(0, '#FF8A8A');
        appleGradient.addColorStop(0.5, '#FF6B6B');
        appleGradient.addColorStop(1, '#E74C3C');
        ctx.fillStyle = appleGradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.35, s * 0.25, s * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.1, -s * 1.1, s * 0.15, -s * 1.2);
        ctx.stroke();

        ctx.fillStyle = '#27AE60';
        ctx.beginPath();
        ctx.ellipse(s * 0.2, -s * 0.95, s * 0.25, s * 0.12, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawKnife(ctx) {
        const s = this.size / 2;
        
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, -s * 0.8);
        ctx.lineTo(s * 0.15, -s * 0.8);
        ctx.lineTo(s * 0.25, s * 0.2);
        ctx.lineTo(-s * 0.25, s * 0.2);
        ctx.closePath();
        ctx.fill();

        const bladeGradient = ctx.createLinearGradient(-s * 0.15, 0, s * 0.15, 0);
        bladeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        bladeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        bladeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
        ctx.fillStyle = bladeGradient;
        ctx.fill();

        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(0, s * 0.2);
        ctx.stroke();

        ctx.fillStyle = '#8B4513';
        Utils.drawRoundRect(ctx, -s * 0.3, s * 0.2, s * 0.6, s * 0.4, 4);
        ctx.fill();

        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-s * 0.15 + i * s * 0.15, s * 0.4, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#FFD700';
        Utils.drawRoundRect(ctx, -s * 0.35, s * 0.15, s * 0.7, s * 0.1, 2);
        ctx.fill();
    }

    drawLongKnife(ctx) {
        const s = this.size / 2;
        
        ctx.fillStyle = '#B0B0B0';
        ctx.beginPath();
        ctx.moveTo(-s * 0.12, -s);
        ctx.lineTo(s * 0.12, -s);
        ctx.lineTo(s * 0.2, s * 0.3);
        ctx.lineTo(-s * 0.2, s * 0.3);
        ctx.closePath();
        ctx.fill();

        const bladeGradient = ctx.createLinearGradient(-s * 0.12, 0, s * 0.12, 0);
        bladeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        bladeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
        bladeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        ctx.fillStyle = bladeGradient;
        ctx.fill();

        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s * 0.3);
        ctx.stroke();

        ctx.fillStyle = '#5D3A1A';
        Utils.drawRoundRect(ctx, -s * 0.25, s * 0.3, s * 0.5, s * 0.5, 5);
        ctx.fill();

        ctx.fillStyle = '#6B4423';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-s * 0.12 + i * s * 0.08, s * 0.55, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#C9A227';
        Utils.drawRoundRect(ctx, -s * 0.3, s * 0.25, s * 0.6, s * 0.12, 3);
        ctx.fill();
    }

    drawGift(ctx) {
        const s = this.size / 2;
        
        const boxGradient = ctx.createLinearGradient(-s, -s, s, s);
        boxGradient.addColorStop(0, '#FFE066');
        boxGradient.addColorStop(0.5, '#FFD93D');
        boxGradient.addColorStop(1, '#F4C430');
        ctx.fillStyle = boxGradient;
        Utils.drawRoundRect(ctx, -s * 0.8, -s * 0.6, s * 1.6, s * 1.2, 8);
        ctx.fill();

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(-s * 0.15, -s * 0.6, s * 0.3, s * 1.2);
        ctx.fillRect(-s * 0.8, -s * 0.15, s * 1.6, s * 0.3);

        ctx.fillStyle = '#FF5252';
        Utils.drawRoundRect(ctx, -s * 0.15, -s * 0.6, s * 0.3, s * 1.2, 3);
        ctx.fill();
        Utils.drawRoundRect(ctx, -s * 0.8, -s * 0.15, s * 1.6, s * 0.3, 3);
        ctx.fill();

        ctx.fillStyle = '#FFE066';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.6);
        ctx.quadraticCurveTo(-s * 0.4, -s * 1.2, -s * 0.2, -s * 0.9);
        ctx.quadraticCurveTo(0, -s * 0.7, s * 0.2, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.4, -s * 1.2, 0, -s * 0.6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, -s * 0.3, s * 0.2, s * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRotten(ctx) {
        const s = this.size / 2;
        
        const rottenGradient = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s);
        rottenGradient.addColorStop(0, '#8B7355');
        rottenGradient.addColorStop(0.5, '#6B5344');
        rottenGradient.addColorStop(1, '#4A3728');
        ctx.fillStyle = rottenGradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3D2914';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = s * 0.4;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * dist, 
                Math.sin(angle) * dist, 
                s * 0.12, 
                0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.7);
        ctx.quadraticCurveTo(-s * 0.1, -s * 0.9, s * 0.1, -s * 0.8);
        ctx.stroke();

        ctx.fillStyle = '#27AE60';
        ctx.beginPath();
        ctx.ellipse(s * 0.15, -s * 0.85, s * 0.15, s * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(-s * 0.2, s * 0.1, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.25, -s * 0.1, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRock(ctx) {
        const s = this.size / 2;
        
        const rockGradient = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
        rockGradient.addColorStop(0, '#A0A0A0');
        rockGradient.addColorStop(0.5, '#7F8C8D');
        rockGradient.addColorStop(1, '#566573');
        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, s * 0.2);
        ctx.lineTo(-s * 0.5, -s * 0.6);
        ctx.lineTo(-s * 0.1, -s * 0.8);
        ctx.lineTo(s * 0.4, -s * 0.7);
        ctx.lineTo(s * 0.8, -s * 0.2);
        ctx.lineTo(s * 0.7, s * 0.5);
        ctx.lineTo(s * 0.2, s * 0.7);
        ctx.lineTo(-s * 0.5, s * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.5);
        ctx.lineTo(-s * 0.2, -s * 0.7);
        ctx.lineTo(s * 0.1, -s * 0.5);
        ctx.lineTo(-s * 0.1, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, s * 0.3, s * 0.2, s * 0.1, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.3, s * 0.1, s * 0.15, s * 0.08, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBottle(ctx) {
        const s = this.size / 2;
        
        const glassGradient = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
        glassGradient.addColorStop(0, 'rgba(149, 165, 166, 0.6)');
        glassGradient.addColorStop(0.5, 'rgba(189, 195, 199, 0.8)');
        glassGradient.addColorStop(1, 'rgba(149, 165, 166, 0.6)');
        ctx.fillStyle = glassGradient;

        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.9);
        ctx.lineTo(s * 0.2, -s * 0.9);
        ctx.lineTo(s * 0.25, -s * 0.5);
        ctx.lineTo(s * 0.35, -s * 0.3);
        ctx.lineTo(s * 0.35, s * 0.7);
        ctx.lineTo(-s * 0.35, s * 0.7);
        ctx.lineTo(-s * 0.35, -s * 0.3);
        ctx.lineTo(-s * 0.25, -s * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(52, 73, 94, 0.6)';
        ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.6);

        ctx.fillStyle = '#8B4513';
        Utils.drawRoundRect(ctx, -s * 0.15, -s * 1.1, s * 0.3, s * 0.25, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.15, 0, s * 0.06, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() {
        const boundSize = this.size * 0.7;
        return {
            x: this.x - boundSize / 2,
            y: this.y - boundSize / 2,
            width: boundSize,
            height: boundSize
        };
    }
}

class ItemManager {
    constructor(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.GAME.BASE_SPAWN_INTERVAL;
        this.dropSpeed = GameConfig.GAME.INITIAL_DROP_SPEED;
        this.currentStage = 0;
        this.stageTimer = 0;
        this.particles = [];
    }

    reset() {
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.GAME.BASE_SPAWN_INTERVAL;
        this.dropSpeed = GameConfig.GAME.INITIAL_DROP_SPEED;
        this.currentStage = 0;
        this.stageTimer = 0;
        this.particles = [];
    }

    updateDifficulty(elapsedTime) {
        this.stageTimer = elapsedTime;
        const newStage = Math.floor(elapsedTime / GameConfig.GAME.DIFFICULTY_INCREASE_INTERVAL);
        
        if (newStage !== this.currentStage) {
            this.currentStage = Math.min(newStage, GameConfig.DIFFICULTY_STAGES.length - 1);
            const stageConfig = GameConfig.DIFFICULTY_STAGES[this.currentStage];
            this.dropSpeed = stageConfig.dropSpeed;
            this.spawnInterval = Math.max(
                GameConfig.GAME.MIN_SPAWN_INTERVAL,
                GameConfig.GAME.BASE_SPAWN_INTERVAL - 
                this.currentStage * GameConfig.GAME.SPAWN_DECREASE_PER_STAGE
            );
        }
    }

    spawnItem() {
        const stageConfig = GameConfig.DIFFICULTY_STAGES[this.currentStage];
        const benefitChance = stageConfig.benefitChance;
        const buffChance = stageConfig.buffChance;

        const random = Math.random();
        let itemType;

        if (random < buffChance) {
            itemType = 'GIFT';
        } else if (random < buffChance + benefitChance) {
            const benefitItems = ['APPLE', 'KNIFE', 'LONG_KNIFE'];
            const weights = [0.5, 0.35, 0.15];
            itemType = Utils.weightedChoice(benefitItems, weights);
        } else {
            const dangerItems = ['ROTTEN', 'ROCK', 'BOTTLE'];
            const weights = [0.4, 0.35, 0.25];
            itemType = Utils.weightedChoice(dangerItems, weights);
        }

        const config = GameConfig.ITEM_TYPES[itemType];
        const x = Utils.random(config.size, this.canvasWidth - config.size);
        const speedVariation = Utils.random(-30, 30);
        
        const item = new Item(x, itemType, this.dropSpeed + speedVariation);
        this.items.push(item);

        return item;
    }

    update(deltaTime, player, game) {
        this.spawnTimer += deltaTime * 1000;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnItem();
        }

        const playerBounds = player.getBounds();

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(deltaTime, this.canvasHeight);

            if (!item.alive) {
                this.items.splice(i, 1);
                continue;
            }

            const itemBounds = item.getBounds();
            if (Utils.rectCollision(
                itemBounds.x, itemBounds.y, itemBounds.width, itemBounds.height,
                playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height
            )) {
                this.handleCollision(item, player, game);
                this.items.splice(i, 1);
            }
        }

        this.updateParticles(deltaTime);
    }

    handleCollision(item, player, game) {
        const config = item.config;

        this.createCollisionParticles(item.x, item.y, config.color);

        if (config.type === 'benefit' || config.type === 'buff') {
            const comboBonus = 1 + Math.floor(player.combo / 10) * 0.5;
            const score = Math.floor(config.score * comboBonus);
            game.addScore(score);
            player.addCombo();

            if (config.invincible) {
                player.activateInvincible();
            }

            game.onItemPicked(item, score);
        } else if (config.type === 'danger') {
            const isDead = player.takeDamage(1);
            game.onPlayerHit(item, config.score);

            if (isDead) {
                game.onGameOver();
            }
        }
    }

    createCollisionParticles(x, y, color) {
        const newParticles = Utils.createParticle(x, y, color, 10);
        this.particles.push(...newParticles);
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 200 * deltaTime;
            p.life -= p.decay * deltaTime;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.items.forEach(item => item.draw(ctx));
        this.drawParticles(ctx);
    }

    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    getState() {
        return {
            items: this.items.map(item => ({
                x: item.x,
                y: item.y,
                type: item.type,
                speed: item.speed,
                rotation: item.rotation
            })),
            spawnTimer: this.spawnTimer,
            spawnInterval: this.spawnInterval,
            dropSpeed: this.dropSpeed,
            currentStage: this.currentStage,
            stageTimer: this.stageTimer
        };
    }

    loadState(state) {
        if (state) {
            this.items = state.items.map(itemData => {
                const item = new Item(itemData.x, itemData.type, itemData.speed);
                item.y = itemData.y;
                item.rotation = itemData.rotation;
                return item;
            });
            this.spawnTimer = state.spawnTimer || 0;
            this.spawnInterval = state.spawnInterval || GameConfig.GAME.BASE_SPAWN_INTERVAL;
            this.dropSpeed = state.dropSpeed || GameConfig.GAME.INITIAL_DROP_SPEED;
            this.currentStage = state.currentStage || 0;
            this.stageTimer = state.stageTimer || 0;
        }
    }
}

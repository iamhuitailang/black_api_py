class Arrow {
    constructor(x, y, angle, arrowType, owner = 'player') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.type = arrowType;
        this.owner = owner;
        this.speed = arrowType.speed;
        this.damage = arrowType.damage;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.active = true;
        this.trail = [];
        this.maxTrailLength = 10;
        this.traveledDistance = 0;
        this.maxRange = arrowType.range;
        this.piercing = false;
        this.homing = false;
        this.hitTargets = [];
        this.arrowLength = 25;
        this.arrowWidth = 3;
    }

    update(targetX, targetY) {
        if (!this.active) return false;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        if (this.homing && targetX !== undefined && targetY !== undefined) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const targetAngle = Math.atan2(dy, dx);
            const angleDiff = targetAngle - this.angle;
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            this.angle += normalizedDiff * 0.05;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += GAME_CONFIG.GRAVITY * 0.3;

        const dx = this.x - this.startX;
        const dy = this.y - this.startY;
        this.traveledDistance = Math.sqrt(dx * dx + dy * dy);

        if (this.traveledDistance > this.maxRange) {
            this.active = false;
            return false;
        }

        if (this.y > GAME_CONFIG.GROUND_Y + 20 || 
            this.x < -50 || 
            this.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
            this.active = false;
            return false;
        }

        return true;
    }

    checkCollision(target) {
        if (!this.active || (this.piercing && this.hitTargets.includes(target.id))) {
            return false;
        }

        const arrowHeadX = this.x + Math.cos(this.angle) * this.arrowLength / 2;
        const arrowHeadY = this.y + Math.sin(this.angle) * this.arrowLength / 2;

        const dx = arrowHeadX - target.x;
        const dy = arrowHeadY - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = target.isCrouching ? 25 : 35;

        if (distance < hitRadius) {
            if (this.piercing) {
                this.hitTargets.push(target.id);
            } else {
                this.active = false;
            }
            return true;
        }

        return false;
    }

    draw(ctx) {
        if (!this.active) return;

        if (this.trail.length > 1) {
            ctx.save();
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.5;
                const width = (i / this.trail.length) * this.arrowWidth;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.type.trailColor;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradient = ctx.createLinearGradient(-this.arrowLength / 2, 0, this.arrowLength / 2, 0);
        gradient.addColorStop(0, this.type.color);
        gradient.addColorStop(1, this.lightenColor(this.type.color, 30));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.arrowWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-this.arrowLength / 2, 0);
        ctx.lineTo(this.arrowLength / 2, 0);
        ctx.stroke();

        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.moveTo(this.arrowLength / 2 + 5, 0);
        ctx.lineTo(this.arrowLength / 2 - 3, -5);
        ctx.lineTo(this.arrowLength / 2 - 3, 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.arrowLength / 2, 0);
        ctx.lineTo(-this.arrowLength / 2 - 6, -4);
        ctx.moveTo(-this.arrowLength / 2, 0);
        ctx.lineTo(-this.arrowLength / 2 - 6, 4);
        ctx.stroke();

        ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

class ArrowManager {
    constructor() {
        this.arrows = [];
    }

    fire(x, y, angle, arrowType, owner) {
        const arrow = new Arrow(x, y, angle, arrowType, owner);
        this.arrows.push(arrow);
        return arrow;
    }

    update(player, enemy) {
        this.arrows = this.arrows.filter(arrow => {
            const targetX = arrow.owner === 'player' ? enemy.x : player.x;
            const targetY = arrow.owner === 'player' ? enemy.y : player.y;
            return arrow.update(targetX, targetY);
        });
    }

    checkCollisions(player, enemy, effects) {
        let hits = { player: false, enemy: false, damage: 0 };

        this.arrows.forEach(arrow => {
            if (!arrow.active) return;

            if (arrow.owner === 'player') {
                if (arrow.checkCollision(enemy)) {
                    const actualDamage = Math.max(1, arrow.damage - (enemy.dodge || 0));
                    const isCrit = Math.random() < 0.1;
                    const finalDamage = isCrit ? Math.floor(actualDamage * 1.5) : actualDamage;
                    enemy.health -= finalDamage;
                    effects.addHit(arrow.x, arrow.y, '#ffff00');
                    effects.addDamage(enemy.x, enemy.y - 40, finalDamage, isCrit);
                    
                    if (arrow.type.explosive) {
                        effects.addExplosion(arrow.x, arrow.y, arrow.type.explosionRadius);
                    }
                    
                    hits.enemy = true;
                    hits.damage = finalDamage;
                }
            } else {
                if (arrow.checkCollision(player)) {
                    if (player.isCrouching && Math.random() < 0.3) {
                        effects.addHit(arrow.x, arrow.y, '#44aaff');
                        return;
                    }
                    
                    const actualDamage = Math.max(1, arrow.damage - (player.dodge || 0));
                    const isCrit = Math.random() < 0.1;
                    const finalDamage = isCrit ? Math.floor(actualDamage * 1.5) : actualDamage;
                    player.health -= finalDamage;
                    effects.addHit(arrow.x, arrow.y, '#ff4444');
                    effects.addDamage(player.x, player.y - 40, finalDamage, isCrit);
                    hits.player = true;
                    hits.damage = finalDamage;
                }
            }
        });

        return hits;
    }

    draw(ctx) {
        this.arrows.forEach(arrow => arrow.draw(ctx));
    }

    clear() {
        this.arrows = [];
    }
}

const Physics = {
    updateCharacter(char, deltaTime) {
        char.vy += GRAVITY;
        char.x += char.vx * deltaTime * 60;
        char.y += char.vy * deltaTime * 60;

        if (char.y >= GROUND_Y) {
            char.y = GROUND_Y;
            char.vy = 0;
            char.isJumping = false;
        }

        char.vx *= 0.85;

        char.animTimer += deltaTime;
        if (char.animTimer > 0.1) {
            char.animTimer = 0;
            char.animFrame++;
        }

        if (char.isHurt) {
            char.hurtTimer -= deltaTime;
            char.shakeOffset.x = (Math.random() - 0.5) * 8;
            char.shakeOffset.y = (Math.random() - 0.5) * 8;
            if (char.hurtTimer <= 0) {
                char.isHurt = false;
                char.shakeOffset.x = 0;
                char.shakeOffset.y = 0;
            }
        }
    },

    checkCollision(char1, char2) {
        const box1 = {
            x: char1.x,
            y: char1.y - char1.height,
            width: char1.width,
            height: char1.height
        };
        const box2 = {
            x: char2.x,
            y: char2.y - char2.height,
            width: char2.width,
            height: char2.height
        };

        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    },

    resolveCollision(char1, char2) {
        if (!this.checkCollision(char1, char2)) return;

        const overlap1 = (char1.x + char1.width) - char2.x;
        const overlap2 = (char2.x + char2.width) - char1.x;
        const minOverlap = Math.min(overlap1, overlap2);

        if (overlap1 < overlap2) {
            char1.x -= minOverlap / 2;
            char2.x += minOverlap / 2;
        } else {
            char1.x += minOverlap / 2;
            char2.x -= minOverlap / 2;
        }

        char1.vx = 0;
        char2.vx = 0;
    },

    getAttackRange(attacker, attack) {
        let range = 60;
        if (attack.range === 'medium') range = 100;
        if (attack.range === '贴身') range = 40;

        return {
            x: attacker.facingRight ? attacker.x + attacker.width : attacker.x - range,
            y: attacker.y - attacker.height,
            width: range,
            height: attacker.height
        };
    },

    checkAttackHit(attacker, defender, attack) {
        const attackBox = this.getAttackRange(attacker, attack);
        const defenderBox = {
            x: defender.x,
            y: defender.y - defender.height,
            width: defender.width,
            height: defender.height
        };

        return attackBox.x < defenderBox.x + defenderBox.width &&
               attackBox.x + attackBox.width > defenderBox.x &&
               attackBox.y < defenderBox.y + defenderBox.height &&
               attackBox.y + attackBox.height > defenderBox.y;
    },

    updateEffects(effects, deltaTime) {
        for (let i = effects.length - 1; i >= 0; i--) {
            effects[i].timer -= deltaTime;
            effects[i].alpha -= deltaTime * 2;
            effects[i].radius += deltaTime * 50;
            
            if (effects[i].timer <= 0 || effects[i].alpha <= 0) {
                effects.splice(i, 1);
            }
        }
    },

    updateParticles(particles, deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx * deltaTime * 60;
            particles[i].y += particles[i].vy * deltaTime * 60;
            particles[i].vy += 0.5 * deltaTime * 60;
            particles[i].alpha -= deltaTime * 1.5;
            
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    },

    updateScreenShake(shake, deltaTime) {
        if (shake.intensity > 0) {
            shake.x = (Math.random() - 0.5) * shake.intensity * 10;
            shake.y = (Math.random() - 0.5) * shake.intensity * 10;
            shake.intensity -= deltaTime * 3;
        } else {
            shake.x = 0;
            shake.y = 0;
            shake.intensity = 0;
        }
    },

    createHitEffect(x, y) {
        return {
            type: 'hit',
            x: x,
            y: y,
            radius: 20,
            alpha: 1,
            timer: 0.5
        };
    },

    createStompEffect(x, y) {
        return {
            type: 'stomp',
            x: x,
            y: y,
            radius: 30,
            alpha: 0.8,
            timer: 0.4
        };
    },

    createParticles(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                size: Math.random() * 6 + 3,
                r: color.r,
                g: color.g,
                b: color.b,
                alpha: 1
            });
        }
        return particles;
    }
};
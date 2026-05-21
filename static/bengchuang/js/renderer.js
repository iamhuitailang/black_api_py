const Renderer = (function() {
    let canvas, ctx;
    let particles = [];
    let bgTime = 0;

    function drawRoundRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
    }

    function clear() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    function drawBackground() {
        bgTime += 0.02;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawCloud(100 + Math.sin(bgTime * 0.5) * 20, 80, 40);
        drawCloud(300 + Math.cos(bgTime * 0.3) * 15, 50, 35);
        drawCloud(550 + Math.sin(bgTime * 0.4) * 25, 100, 45);
        drawCloud(800 + Math.cos(bgTime * 0.35) * 20, 60, 38);
        
        drawCircusTent(50, 120);
        drawCircusTent(850, 140);
        
        drawAudience();
        
        drawBalloons();
        
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(0, 0, GAME_WIDTH, 20);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, GAME_HEIGHT - 15, GAME_WIDTH, 15);
    }

    function drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawCircusTent(x, baseY) {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + 60, baseY);
        ctx.lineTo(x + 50, baseY - 60);
        ctx.lineTo(x + 10, baseY - 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x + 15, baseY);
        ctx.lineTo(x + 25, baseY);
        ctx.lineTo(x + 22, baseY - 50);
        ctx.lineTo(x + 18, baseY - 50);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 35, baseY);
        ctx.lineTo(x + 45, baseY);
        ctx.lineTo(x + 42, baseY - 50);
        ctx.lineTo(x + 38, baseY - 50);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 30, baseY - 65, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(x + 30, baseY - 70);
        ctx.lineTo(x + 30, baseY - 90);
        ctx.lineTo(x + 50, baseY - 85);
        ctx.lineTo(x + 30, baseY - 80);
        ctx.closePath();
        ctx.fill();
    }

    function drawAudience() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
        for (let i = 0; i < 30; i++) {
            const x = 100 + i * 28;
            const y = 180 + Math.sin(i * 0.5) * 5;
            const color = colors[i % colors.length];
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFD5B5';
            ctx.beginPath();
            ctx.arc(x, y - 12, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 3, y - 13, 2, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 13, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, y - 10, 3, 0, Math.PI);
            ctx.stroke();
        }
    }

    function drawBalloons() {
        const balloons = [
            { x: 120, y: 100, color: '#FF6B6B', speed: 0.3 },
            { x: 250, y: 80, color: '#4ECDC4', speed: 0.25 },
            { x: 400, y: 120, color: '#FFE66D', speed: 0.35 },
            { x: 600, y: 90, color: '#FF69B4', speed: 0.28 },
            { x: 750, y: 110, color: '#00CED1', speed: 0.32 },
            { x: 880, y: 85, color: '#FFA500', speed: 0.3 }
        ];
        
        for (let balloon of balloons) {
            const bobY = Math.sin(bgTime * balloon.speed) * 10;
            
            ctx.fillStyle = balloon.color;
            ctx.beginPath();
            ctx.ellipse(balloon.x, balloon.y + bobY, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(balloon.x, balloon.y + bobY + 20);
            ctx.lineTo(balloon.x - 3, balloon.y + bobY + 28);
            ctx.lineTo(balloon.x + 3, balloon.y + bobY + 28);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(balloon.x, balloon.y + bobY + 28);
            ctx.quadraticCurveTo(
                balloon.x + Math.sin(bgTime * balloon.speed * 2) * 10, 
                balloon.y + bobY + 45,
                balloon.x, balloon.y + bobY + 55
            );
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(balloon.x - 5, balloon.y + bobY - 8, 4, 6, -0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawArena() {
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(ARENA_LEFT - 20, GROUND_Y, ARENA_RIGHT - ARENA_LEFT + 40, GAME_HEIGHT - GROUND_Y);
        
        ctx.fillStyle = '#FFD700';
        for (let i = ARENA_LEFT - 15; i < ARENA_RIGHT + 15; i += 30) {
            ctx.beginPath();
            ctx.arc(i, GROUND_Y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ARENA_LEFT, GROUND_Y - 5);
        ctx.lineTo(ARENA_LEFT, 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(ARENA_RIGHT, GROUND_Y - 5);
        ctx.lineTo(ARENA_RIGHT, 50);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(ARENA_LEFT, 50, 12, 0, Math.PI * 2);
        ctx.arc(ARENA_RIGHT, 50, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 10; i++) {
            const x = ARENA_LEFT + 5 + i * 85;
            drawStar(x, 30, 8);
        }
        
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(ARENA_LEFT - 40, GROUND_Y - 3);
        ctx.lineTo(ARENA_RIGHT + 40, GROUND_Y - 3);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawStar(x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawTrampolines() {
        for (let trampoline of TRAMPOLINES) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            drawRoundRect(trampoline.x + 3, trampoline.y + 5, trampoline.width, trampoline.height, 5);
            ctx.fill();
            
            const grad = ctx.createLinearGradient(trampoline.x, trampoline.y, trampoline.x, trampoline.y + trampoline.height);
            grad.addColorStop(0, trampoline.color);
            grad.addColorStop(1, shadeColor(trampoline.color, -30));
            ctx.fillStyle = grad;
            drawRoundRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height, 5);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 10; i < trampoline.width - 10; i += 15) {
                ctx.beginPath();
                ctx.moveTo(trampoline.x + i, trampoline.y + 5);
                ctx.lineTo(trampoline.x + i + 5, trampoline.y + trampoline.height - 5);
                ctx.stroke();
            }
            
            ctx.strokeStyle = shadeColor(trampoline.color, -40);
            ctx.lineWidth = 3;
            drawRoundRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height, 5);
            ctx.stroke();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            const label = trampoline.type === 'strong' ? '★强' : '弹';
            ctx.fillText(label, trampoline.x + trampoline.width / 2, trampoline.y + trampoline.height / 2 + 4);
        }
    }

    function drawSpringboards() {
        for (let springboard of SPRINGBOARDS) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            drawRoundRect(springboard.x + 2, springboard.y + 3, springboard.width, springboard.height, 3);
            ctx.fill();
            
            const grad = ctx.createLinearGradient(springboard.x, springboard.y, springboard.x, springboard.y + springboard.height);
            grad.addColorStop(0, springboard.color);
            grad.addColorStop(1, '#FFA500');
            ctx.fillStyle = grad;
            drawRoundRect(springboard.x, springboard.y, springboard.width, springboard.height, 3);
            ctx.fill();
            
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 2;
            drawRoundRect(springboard.x, springboard.y, springboard.width, springboard.height, 3);
            ctx.stroke();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', springboard.x + springboard.width / 2, springboard.y + springboard.height / 2 + 4);
        }
    }

    function drawEdgeSlopes() {
        for (let slope of EDGE_SLOPES) {
            const grad = ctx.createLinearGradient(slope.x, slope.y, slope.x + slope.width, slope.y);
            if (slope.side === 'left') {
                grad.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
                grad.addColorStop(1, 'rgba(255, 150, 100, 0.3)');
            } else {
                grad.addColorStop(0, 'rgba(255, 150, 100, 0.3)');
                grad.addColorStop(1, 'rgba(255, 100, 100, 0.6)');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(slope.x, slope.y, slope.width, slope.height);
            
            ctx.fillStyle = '#FF4444';
            for (let i = 0; i < 5; i++) {
                const y = slope.y + 15 + i * 25;
                ctx.beginPath();
                ctx.arc(slope.x + slope.width / 2, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function drawCharacter(character) {
        const centerX = character.x + character.width / 2;
        const centerY = character.y + character.height / 2;
        
        if (character.damageFlash > 0 && Math.floor(character.damageFlash / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        const squashY = character.isGrounded ? 1 : character.squash;
        const stretchY = character.isGrounded ? 1 : character.stretch;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, character.height / 2 + 5, character.width / 2 * stretchY, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const charGrad = ctx.createRadialGradient(-10, -15, 5, 0, 0, character.width / 1.5);
        charGrad.addColorStop(0, lightenColor(character.color, 40));
        charGrad.addColorStop(0.7, character.color);
        charGrad.addColorStop(1, shadeColor(character.color, -20));
        ctx.fillStyle = charGrad;
        
        ctx.beginPath();
        ctx.ellipse(0, 5, character.width / 2 * stretchY, character.height / 2 * squashY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = character.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, 20, character.width / 3, character.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeY = -10;
        const eyeOffset = character.facingRight ? 8 : -8;
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-12 + eyeOffset / 2, eyeY, 8, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(8 + eyeOffset / 2, eyeY, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-12 + eyeOffset, eyeY + 2, 4, 0, Math.PI * 2);
        ctx.arc(8 + eyeOffset, eyeY + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-14 + eyeOffset, eyeY - 1, 2, 0, Math.PI * 2);
        ctx.arc(6 + eyeOffset, eyeY - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(-2 + eyeOffset / 2, eyeY + 10, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0 + eyeOffset / 2, eyeY + 18, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = character.color;
        const cheekOffset = character.facingRight ? 12 : -12;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(-15 - cheekOffset / 2, eyeY + 5, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(15 - cheekOffset / 2, eyeY + 5, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        if (character.charType === 'clown') {
            drawClownHat(eyeOffset);
        } else if (character.charType === 'bear') {
            drawBearEars();
        } else if (character.charType === 'rabbit') {
            drawRabbitEars();
        } else if (character.charType === 'lion') {
            drawLionMane();
        }
        
        if (character.attackState === ATTACK_STATES.ATTACKING && character.attackHitbox) {
            drawAttackEffect(character);
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    function drawClownHat(eyeOffset) {
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.moveTo(-15, -25);
        ctx.lineTo(15, -25);
        ctx.lineTo(0, -50);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -50, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00CED1';
        ctx.beginPath();
        ctx.arc(-8, -15, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBearEars() {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(-18, -28, 10, 0, Math.PI * 2);
        ctx.arc(18, -28, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(-18, -28, 5, 0, Math.PI * 2);
        ctx.arc(18, -28, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRabbitEars() {
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-12, -40, 6, 20, -0.2, 0, Math.PI * 2);
        ctx.ellipse(12, -40, 6, 20, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-12, -40, 3, 15, -0.2, 0, Math.PI * 2);
        ctx.ellipse(12, -40, 3, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLionMane() {
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 25 - 10;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawAttackEffect(character) {
        const hitbox = character.attackHitbox;
        if (!hitbox) return;
        
        const effectX = character.facingRight ? 30 : -30;
        
        if (hitbox.type === 'charge') {
            ctx.fillStyle = 'rgba(255, 68, 68, 0.6)';
            ctx.beginPath();
            ctx.ellipse(effectX, 0, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(effectX, 0, 15 + i * 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (hitbox.type === 'kick') {
            ctx.fillStyle = 'rgba(68, 255, 68, 0.6)';
            ctx.save();
            ctx.translate(effectX, 10);
            ctx.rotate(character.facingRight ? 0.5 : -0.5);
            ctx.fillRect(-15, -8, 30, 16);
            ctx.restore();
            
            ctx.fillStyle = '#44FF44';
            ctx.beginPath();
            ctx.moveTo(effectX + (character.facingRight ? 20 : -20), 0);
            ctx.lineTo(effectX + (character.facingRight ? 40 : -40), -10);
            ctx.lineTo(effectX + (character.facingRight ? 40 : -40), 10);
            ctx.closePath();
            ctx.fill();
        } else if (hitbox.type === 'special') {
            const time = Date.now() / 100;
            ctx.save();
            ctx.translate(effectX, 0);
            ctx.rotate(time);
            
            ctx.strokeStyle = '#FF44FF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * 30;
                const y = Math.sin(angle) * 30;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 68, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    function drawHUD(player1, player2) {
        drawPlayerHUD(player1, true);
        drawPlayerHUD(player2, false);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VS', GAME_WIDTH / 2, 50);
    }

    function drawPlayerHUD(character, isLeft) {
        const x = isLeft ? 20 : GAME_WIDTH - 20;
        const align = isLeft ? 'left' : 'right';
        
        ctx.textAlign = align;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        drawRoundRect(x - 5, 20, 200, 80, 10);
        ctx.fill();
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = character.color;
        ctx.fillText(character.emoji + ' ' + character.name, x, 45);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#AAA';
        ctx.fillText(character.type, x, 62);
        
        const staminaPercent = character.stamina / STAMINA.max;
        const barX = isLeft ? x : x - 180;
        
        ctx.fillStyle = '#333';
        drawRoundRect(barX, 70, 180, 15, 5);
        ctx.fill();
        
        const staminaGrad = ctx.createLinearGradient(barX, 70, barX + 180, 70);
        if (staminaPercent > 0.5) {
            staminaGrad.addColorStop(0, '#4CAF50');
            staminaGrad.addColorStop(1, '#8BC34A');
        } else if (staminaPercent > 0.25) {
            staminaGrad.addColorStop(0, '#FFC107');
            staminaGrad.addColorStop(1, '#FF9800');
        } else {
            staminaGrad.addColorStop(0, '#F44336');
            staminaGrad.addColorStop(1, '#E91E63');
        }
        ctx.fillStyle = staminaGrad;
        drawRoundRect(barX, 70, 180 * staminaPercent, 15, 5);
        ctx.fill();
        
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText('体力: ' + Math.floor(character.stamina) + '/' + STAMINA.max, barX + 90, 81);
        
        if (character.attackCooldown > 0) {
            const cooldownPercent = character.attackCooldown / MOVES.special.cooldown;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            drawRoundRect(barX, 90, 180 * cooldownPercent, 5, 3);
            ctx.fill();
        }
        
        if (character.onEdge) {
            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = align;
            ctx.fillText('⚠️ 危险！', x, 110);
        }
    }

    function drawParticle(particle) {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            p.alpha = p.life / p.maxLife;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function createHitParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                size: Math.random() * 8 + 4,
                color: color,
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }

    function drawGameOver(winner) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        
        if (winner === 'player') {
            ctx.fillText('🎉 胜利！🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        } else {
            ctx.fillText('😢 失败...', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        }
        
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('点击任意位置重新开始', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    }

    function shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    function lightenColor(color, percent) {
        return shadeColor(color, percent);
    }

    function render(player1, player2, gameState, winner) {
        clear();
        drawBackground();
        drawArena();
        drawTrampolines();
        drawSpringboards();
        drawEdgeSlopes();
        
        if (player1) drawCharacter(player1);
        if (player2) drawCharacter(player2);
        
        updateParticles();
        for (let p of particles) {
            drawParticle(p);
        }
        
        if (gameState === GAME_STATES.PLAYING) {
            drawHUD(player1, player2);
        }
        
        if (gameState === GAME_STATES.GAME_OVER) {
            drawGameOver(winner);
        }
    }

    return {
        init,
        render,
        createHitParticles
    };
})();
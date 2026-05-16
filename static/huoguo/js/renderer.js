const Renderer = (function() {
    let canvas, ctx;
    let particles = [];
    let damageNumbers = [];
    let soupResource = null;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        console.log('Renderer initialized, canvas size:', canvas.width, 'x', canvas.height);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getGroundY() {
        return canvas.height - 120;
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a0a00');
        gradient.addColorStop(0.3, '#2d1810');
        gradient.addColorStop(0.7, '#2d1810');
        gradient.addColorStop(1, '#1a0a00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawNeonLights();
        drawMarketStalls();
        drawGround();
        drawSteamParticles();
    }

    function drawNeonLights() {
        const neonColors = ['#ff0066', '#00ffff', '#ffff00', '#ff6600', '#00ff00'];
        for (let i = 0; i < 8; i++) {
            const x = (i + 1) * canvas.width / 9;
            const y = 80;
            const color = neonColors[i % neonColors.length];
            
            ctx.save();
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + 12);
            ctx.lineTo(x, 150);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff6600';
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 36px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🍲 火锅大排档 🍲', canvas.width / 2, 100);
        ctx.restore();
    }

    function drawMarketStalls() {
        ctx.fillStyle = '#5c3d2e';
        ctx.fillRect(50, getGroundY() - 80, 150, 80);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(45, getGroundY() - 90, 160, 15);
        
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(45, getGroundY() - 90);
        ctx.lineTo(125, getGroundY() - 130);
        ctx.lineTo(205, getGroundY() - 90);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5c3d2e';
        ctx.fillRect(canvas.width - 200, getGroundY() - 80, 150, 80);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(canvas.width - 205, getGroundY() - 90, 160, 15);
        
        ctx.fillStyle = '#4444ff';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 205, getGroundY() - 90);
        ctx.lineTo(canvas.width - 125, getGroundY() - 130);
        ctx.lineTo(canvas.width - 45, getGroundY() - 90);
        ctx.closePath();
        ctx.fill();

        ctx.font = '28px Arial';
        for (let i = 0; i < 3; i++) {
            ctx.fillText('🍢', 80 + i * 40, getGroundY() - 50);
            ctx.fillText('🍡', canvas.width - 170 + i * 40, getGroundY() - 50);
        }
    }

    function drawGround() {
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(0, getGroundY(), canvas.width, 120);
        
        ctx.fillStyle = '#5c4030';
        for (let i = 0; i < canvas.width; i += 60) {
            ctx.fillRect(i, getGroundY(), 40, 8);
        }

        ctx.fillStyle = '#6b4423';
        const tablePositions = [canvas.width * 0.25, canvas.width * 0.5, canvas.width * 0.75];
        tablePositions.forEach(x => {
            ctx.fillRect(x - 40, getGroundY() - 20, 80, 10);
            ctx.fillRect(x - 35, getGroundY() - 10, 8, 10);
            ctx.fillRect(x + 27, getGroundY() - 10, 8, 10);
        });
    }

    function drawSteamParticles() {
        const time = Date.now() / 1000;
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffaa66';
        
        for (let i = 0; i < 20; i++) {
            const x = (i * canvas.width / 20) + Math.sin(time + i) * 10;
            const y = getGroundY() - 20 - (time * 20 + i * 15) % 80;
            const size = 15 + Math.sin(time * 2 + i) * 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawCharacter(character, isPlayer) {
        if (!character) {
            console.log('Character is null');
            return;
        }
        
        const height = character.crouching ? 60 : 100;
        const x = Math.max(0, Math.min(character.x, canvas.width - character.width));
        const y = Math.max(0, Math.min(character.y, canvas.height - height)) + (100 - height);

        console.log('Drawing character at:', x, y, 'width:', character.width, 'height:', height, 'emoji:', character.emoji);

        ctx.save();

        if (character.isInvincible && Math.floor(character.invincibleFrame / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (character.isHurt) {
            ctx.filter = 'brightness(1.5) sepia(1) saturate(3) hue-rotate(-30deg)';
        }

        ctx.shadowBlur = 25;
        ctx.shadowColor = character.glowColor;

        ctx.fillStyle = character.color;
        ctx.beginPath();
        ctx.roundRect(x, y, character.width, height, 15);
        ctx.fill();

        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x - 8, y - 15, character.width + 16, 20);

        ctx.fillStyle = character.type === 'clear' ? '#fff8dc' : 
                         character.type === 'tomato' ? '#ff7f7f' : '#a52a2a';
        ctx.beginPath();
        ctx.ellipse(x + character.width / 2, y + 18, 32, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(character.emoji, x + character.width / 2, y + 55);

        if (character.isAttacking) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            ctx.globalAlpha = Math.max(0.2, 1 - character.attackFrame / 30);
            ctx.beginPath();
            ctx.arc(x + character.width / 2, y + height / 2, 50 + character.attackFrame * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawProjectiles() {
        const projectiles = Combat.getProjectiles();
        
        projectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            if (p.isUltimate) {
                ctx.shadowBlur = 40;
                ctx.shadowColor = '#ff4400';
            } else {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffaa00';
            }

            ctx.font = `${p.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, 0, 0);

            ctx.restore();
        });
    }

    function drawSoupResource() {
        if (!soupResource) return;

        ctx.save();
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#ffcc00';

        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.font = `${50 * pulse}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍲', soupResource.x, soupResource.y);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px "Microsoft YaHei", Arial';
        ctx.fillText('汤底能量', soupResource.x, soupResource.y + 45);

        ctx.restore();
    }

    function spawnSoupResource() {
        if (!soupResource && Math.random() < 0.003) {
            soupResource = {
                x: canvas.width / 2,
                y: getGroundY() - 40,
                collected: false
            };
        }
    }

    function checkSoupCollection(player, enemy) {
        if (!soupResource) return;

        const dist1 = Math.abs(player.x + player.width / 2 - soupResource.x);
        const dist2 = Math.abs(enemy.x + enemy.width / 2 - soupResource.x);

        if (dist1 < 60) {
            const x = soupResource.x;
            const y = soupResource.y;
            Characters.addEnergy(player, 30);
            soupResource = null;
            createParticles(x, y, '#ffcc00', 25);
        } else if (dist2 < 60) {
            const x = soupResource.x;
            const y = soupResource.y;
            Characters.addEnergy(enemy, 30);
            soupResource = null;
            createParticles(x, y, '#ffcc00', 25);
        }
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 12,
                velocityY: (Math.random() - 0.5) * 12 - 3,
                size: Math.random() * 10 + 5,
                color: color,
                life: 1
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.velocityY += 0.3;
            p.life -= 0.025;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    function createDamageNumber(x, y, damage) {
        damageNumbers.push({
            x: x,
            y: y,
            damage: damage,
            life: 1
        });
    }

    function updateDamageNumbers() {
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const d = damageNumbers[i];
            d.y -= 2.5;
            d.life -= 0.02;

            if (d.life <= 0) {
                damageNumbers.splice(i, 1);
            }
        }
    }

    function drawDamageNumbers() {
        damageNumbers.forEach(d => {
            ctx.save();
            ctx.globalAlpha = d.life;
            ctx.fillStyle = '#ff3333';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(`-${d.damage}`, d.x, d.y);
            ctx.fillText(`-${d.damage}`, d.x, d.y);
            ctx.restore();
        });
    }

    function render(player, enemy, hits) {
        if (!ctx) {
            console.log('No context, skipping render');
            return;
        }
        
        console.log('Rendering, player:', player ? 'exists' : 'null', 'enemy:', enemy ? 'exists' : 'null');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        drawSoupResource();
        
        if (player) {
            drawCharacter(player, true);
        }
        if (enemy) {
            drawCharacter(enemy, false);
        }
        
        drawProjectiles();
        drawParticles();
        drawDamageNumbers();
    }

    function update(player, enemy) {
        updateParticles();
        updateDamageNumbers();
        spawnSoupResource();
        checkSoupCollection(player, enemy);
    }

    function clear() {
        particles = [];
        damageNumbers = [];
        soupResource = null;
    }

    return {
        init,
        render,
        update,
        getGroundY,
        clear,
        createParticles,
        createDamageNumber
    };
})();

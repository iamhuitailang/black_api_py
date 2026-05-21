const Renderer = (function() {
    let canvas, ctx;
    let width, height;
    let cameraX = 0;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function clear() {
        ctx.clearRect(0, 0, width, height);
    }

    function drawSky(weather) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        
        if (weather.effect === 'rain') {
            gradient.addColorStop(0, '#5a5a6a');
            gradient.addColorStop(1, '#7a7a8a');
        } else if (weather.effect === 'slow') {
            gradient.addColorStop(0, '#7a9eb5');
            gradient.addColorStop(1, '#a8c5d8');
        } else if (weather.effect === 'fast') {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#e0f4ff');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height * 0.6);

        if (weather.effect !== 'rain') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            drawCloud(100 - cameraX * 0.1, 80, 60);
            drawCloud(400 - cameraX * 0.1, 120, 80);
            drawCloud(700 - cameraX * 0.1, 60, 50);
        }

        if (weather.effect === 'rain') {
            ctx.strokeStyle = 'rgba(150, 180, 220, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 100; i++) {
                const rx = (i * 37 + Date.now() * 0.1) % width;
                const ry = (i * 53 + Date.now() * 0.5) % (height * 0.6);
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 5, ry + 15);
                ctx.stroke();
            }
        }
    }

    function drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawStadium() {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(0, height * 0.3, width, height * 0.1);
        
        ctx.fillStyle = '#6b7280';
        for (let i = 0; i < 20; i++) {
            const sx = ((i * 100 - cameraX * 0.3) % (width + 100)) - 50;
            ctx.beginPath();
            ctx.moveTo(sx, height * 0.35);
            ctx.lineTo(sx + 50, height * 0.3);
            ctx.lineTo(sx + 100, height * 0.35);
            ctx.lineTo(sx + 50, height * 0.4);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawTrack(totalLanes) {
        const trackY = height * 0.65;
        const laneHeight = (height * 0.25) / Math.max(totalLanes, 4);
        
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(0, trackY, width, laneHeight * totalLanes);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i <= totalLanes; i++) {
            ctx.beginPath();
            ctx.moveTo(0, trackY + i * laneHeight);
            ctx.lineTo(width, trackY + i * laneHeight);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        for (let x = 0; x < width + 200; x += 200) {
            const meter = Math.floor((x + cameraX) / 10);
            if (meter % 10 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(x - cameraX % 200 - 100, trackY, 2, laneHeight * totalLanes);
            }
        }

        return { trackY, laneHeight };
    }

    function drawHurdles(hurdlePositions, trackInfo, totalLanes, hitHurdles) {
        const { trackY, laneHeight } = trackInfo;
        const hurdleHeight = laneHeight * 0.6;
        const hurdleY = trackY - hurdleHeight;

        hurdlePositions.forEach((pos, index) => {
            const screenX = pos * 10 - cameraX;
            
            if (screenX > -50 && screenX < width + 50) {
                for (let lane = 0; lane < totalLanes; lane++) {
                    const isHit = hitHurdles && hitHurdles[`${lane}-${index}`];
                    const laneY = hurdleY + lane * laneHeight;
                    
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(screenX - 3, laneY, 6, hurdleHeight);
                    ctx.fillRect(screenX - 3 + 40, laneY, 6, hurdleHeight);

                    ctx.fillStyle = isHit ? '#ff6b6b' : '#ffd700';
                    ctx.fillRect(screenX - 5, laneY, 50, 8);

                    if (isHit) {
                        ctx.save();
                        ctx.translate(screenX + 20, laneY + 4);
                        ctx.rotate(Math.sin(Date.now() * 0.01 + index) * 0.2);
                        ctx.fillStyle = '#ffd700';
                        ctx.fillRect(-25, -4, 50, 8);
                        ctx.restore();
                    }
                }
            }
        });
    }

    function drawFinishLine(raceDistance, trackInfo, totalLanes) {
        const { trackY, laneHeight } = trackInfo;
        const screenX = raceDistance * 10 - cameraX;

        if (screenX > 0 && screenX < width) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX, trackY - 50, 5, laneHeight * totalLanes + 50);
            
            ctx.fillStyle = '#000000';
            for (let i = 0; i < laneHeight * totalLanes + 50; i += 10) {
                ctx.fillRect(screenX, trackY - 50 + i, 5, 5);
            }

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FINISH', screenX + 2, trackY - 60);
        }
    }

    function drawRunner(runner, trackInfo, isPlayer, color) {
        const { trackY, laneHeight } = trackInfo;
        const screenX = runner.x * 10 - cameraX;
        const laneY = trackY + runner.lane * laneHeight + laneHeight / 2;
        const jumpOffset = -runner.jumpHeight * 15;

        if (runner.jumpHeight > 0.1) {
            ctx.save();
            ctx.globalAlpha = 0.3 - runner.jumpHeight * 0.02;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(screenX, laneY + 10, 15 - runner.jumpHeight, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (runner.trail && runner.trail.length > 0) {
            runner.trail.forEach((trail, i) => {
                const trailX = trail.x * 10 - cameraX;
                ctx.save();
                ctx.globalAlpha = trail.alpha * 0.3;
                drawRunnerBody(trailX, laneY, 0, color, isPlayer, 0.8, null);
                ctx.restore();
            });
        }

        drawRunnerBody(screenX, laneY, jumpOffset, color, isPlayer, 1, runner);
    }

    function drawRunnerBody(x, y, jumpY, color, isPlayer, scale, runner) {
        ctx.save();
        ctx.translate(x, y + jumpY);
        ctx.scale(scale, scale);

        const runCycle = runner ? Math.sin(runner.animateFrame * 0.6) : 0;
        const runCycle2 = runner ? Math.cos(runner.animateFrame * 0.6) : 0;
        const skinColor = '#e8b89d';
        const skinShadow = '#d4a58a';
        const uniformColor = color;
        const uniformShadow = shadeColor(color, -20);
        const uniformLight = shadeColor(color, 20);

        ctx.save();
        ctx.translate(0, -10);
        const legSwing = runCycle * 0.7;
        
        ctx.save();
        ctx.rotate(legSwing);
        drawRealisticLeg(0, 0, uniformColor, uniformShadow, skinColor, skinShadow, runCycle > 0);
        ctx.restore();

        ctx.save();
        ctx.rotate(-legSwing);
        drawRealisticLeg(0, 0, uniformShadow, shadeColor(color, -30), skinShadow, '#c4957a', runCycle <= 0);
        ctx.restore();

        ctx.restore();

        const bodyGradient = ctx.createLinearGradient(-12, -45, 12, -15);
        bodyGradient.addColorStop(0, uniformLight);
        bodyGradient.addColorStop(0.5, uniformColor);
        bodyGradient.addColorStop(1, uniformShadow);
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(-10, -45);
        ctx.lineTo(-12, -15);
        ctx.lineTo(12, -15);
        ctx.lineTo(10, -45);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = uniformShadow;
        ctx.beginPath();
        ctx.ellipse(0, -18, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const armSwing = runCycle2 * 0.8;
        
        ctx.save();
        ctx.translate(-10, -38);
        ctx.rotate(-armSwing);
        drawRealisticArm(skinColor, skinShadow, true);
        ctx.restore();

        ctx.save();
        ctx.translate(10, -38);
        ctx.rotate(armSwing);
        drawRealisticArm(skinColor, skinShadow, false);
        ctx.restore();

        ctx.save();
        ctx.translate(0, -48);
        
        const headGradient = ctx.createRadialGradient(-3, -8, 2, 0, 0, 14);
        headGradient.addColorStop(0, '#f5d0b5');
        headGradient.addColorStop(0.7, skinColor);
        headGradient.addColorStop(1, skinShadow);
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        const hairColor = isPlayer ? '#2c1810' : '#1a0f0a';
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.ellipse(0, -10, 12, 8, 0, Math.PI, 0);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(-8, -8, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -8, 4, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(-4, -2, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -2, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-3.5, -2.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4.5, -2.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinShadow;
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = skinShadow;
        ctx.beginPath();
        ctx.ellipse(0, 1, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.restore();
    }

    function drawRealisticLeg(x, y, color1, color2, skinColor, skinShadow, isFront) {
        const legGradient = ctx.createLinearGradient(-5, 0, 5, 0);
        legGradient.addColorStop(0, color2);
        legGradient.addColorStop(0.5, color1);
        legGradient.addColorStop(1, color2);

        ctx.fillStyle = legGradient;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-5, 20);
        ctx.lineTo(5, 20);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();

        const calfGradient = ctx.createLinearGradient(-4, 20, 4, 20);
        calfGradient.addColorStop(0, color2);
        calfGradient.addColorStop(0.5, color1);
        calfGradient.addColorStop(1, color2);

        ctx.fillStyle = calfGradient;
        ctx.beginPath();
        ctx.moveTo(-5, 20);
        ctx.quadraticCurveTo(-6, 30, -4, 38);
        ctx.lineTo(4, 38);
        ctx.quadraticCurveTo(6, 30, 5, 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(0, 38, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isFront ? '#fff' : '#ddd';
        ctx.beginPath();
        ctx.ellipse(0, 42, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isFront ? '#333' : '#222';
        ctx.beginPath();
        ctx.ellipse(2, 44, 5, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRealisticArm(skinColor, skinShadow, isLeft) {
        const armGradient = ctx.createLinearGradient(-2, 0, 4, 0);
        armGradient.addColorStop(0, skinShadow);
        armGradient.addColorStop(0.5, skinColor);
        armGradient.addColorStop(1, skinShadow);

        ctx.fillStyle = armGradient;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-4, 12, -2, 22);
        ctx.lineTo(3, 22);
        ctx.quadraticCurveTo(5, 12, 3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, 24, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinShadow;
        ctx.beginPath();
        ctx.arc(isLeft ? -1 : 1, 24, 2, 0, Math.PI * 2);
        ctx.fill();
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

    function updateCamera(playerX, raceDistance) {
        const targetX = playerX * 10 - width * 0.3;
        cameraX += (targetX - cameraX) * 0.1;
        cameraX = Math.max(0, Math.min(cameraX, raceDistance * 10 - width + 200));
    }

    function render(gameState) {
        clear();
        
        const totalLanes = Math.max(gameState.opponents.length + 1, 4);
        
        drawSky(gameState.weather);
        drawStadium();
        const trackInfo = drawTrack(totalLanes);
        drawHurdles(gameState.hurdlePositions, trackInfo, totalLanes, gameState.hitHurdles);
        drawFinishLine(gameState.raceDistance, trackInfo, totalLanes);

        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63'];
        
        gameState.opponents.forEach((opponent, index) => {
            drawRunner(opponent, trackInfo, false, colors[(index + 1) % colors.length]);
        });

        drawRunner(gameState.player, trackInfo, true, colors[0]);

        updateCamera(gameState.player.x, gameState.raceDistance);
    }

    function getCameraX() {
        return cameraX;
    }

    function setCameraX(x) {
        cameraX = x;
    }

    return {
        init,
        resize,
        clear,
        render,
        getCameraX,
        setCameraX
    };
})();
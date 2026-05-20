const Renderer = (() => {
    let canvas = null;
    let ctx = null;
    let width = 1200;
    let height = 500;
    let trackStartX = 60;
    let trackEndX = 0;
    let trackY = 100;
    let laneHeight = 70;

    const init = (canvasElement) => {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
        trackEndX = width - 60;
    };

    const resize = (newWidth, newHeight) => {
        width = newWidth;
        height = newHeight;
        canvas.width = newWidth;
        canvas.height = newHeight;
        trackEndX = width - 60;
    };

    const drawSky = (weather) => {
        let gradient;
        
        switch (weather.id) {
            case 'sunny':
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.6, '#B0E0E6');
                gradient.addColorStop(1, '#98FB98');
                break;
            case 'tailwind':
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#6495ED');
                gradient.addColorStop(0.6, '#87CEEB');
                gradient.addColorStop(1, '#90EE90');
                break;
            case 'headwind':
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#5F9EA0');
                gradient.addColorStop(0.6, '#708090');
                gradient.addColorStop(1, '#6B8E23');
                break;
            case 'rainy':
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#2C3E50');
                gradient.addColorStop(0.6, '#546E7A');
                gradient.addColorStop(1, '#3D5A45');
                break;
            default:
                gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#98FB98');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    };

    const drawStadium = () => {
        ctx.fillStyle = '#34495E';
        ctx.fillRect(0, 0, width, 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏟️ 奥林匹克体育场 100米跑道 🏟️', width / 2, 26);
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 40, width, trackY - 40);
        
        for (let i = 0; i < width; i += 40) {
            ctx.fillStyle = 'rgba(0, 100, 0, 0.2)';
            ctx.fillRect(i, 40, 20, trackY - 40);
        }
    };

    const drawSun = (weather, time) => {
        if (weather.id === 'rainy') return;
        
        const sunX = width - 80;
        const sunY = 70;
        
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        glow.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(sunX - 6, sunY - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        
        if (weather.id === 'sunny') {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 22.5 + time * 0.015) * Math.PI / 180;
                const innerR = 35;
                const outerR = 50;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
                ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
                ctx.stroke();
            }
        }
    };

    const drawClouds = (weather, time) => {
        if (weather.id === 'rainy') return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const cloudPositions = [
            { x: 120, y: 55, scale: 1.1 },
            { x: 380, y: 75, scale: 0.9 },
            { x: 650, y: 50, scale: 1.0 },
            { x: 900, y: 65, scale: 0.85 }
        ];
        
        cloudPositions.forEach((cloud, i) => {
            const speed = weather.id === 'tailwind' ? 0.06 : weather.id === 'headwind' ? 0.01 : 0.025;
            const offsetX = (time * speed * (i + 1)) % (width + 200) - 100;
            drawCloud(cloud.x + offsetX, cloud.y, cloud.scale);
        });
    };

    const drawCloud = (x, y, scale) => {
        ctx.beginPath();
        ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y - 10 * scale, 26 * scale, 0, Math.PI * 2);
        ctx.arc(x + 50 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 28 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawRain = (weather, time) => {
        if (weather.id !== 'rainy') return;
        
        ctx.strokeStyle = 'rgba(150, 180, 220, 0.7)';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < 200; i++) {
            const x = (i * 13 + time * 1.0) % width;
            const y = (i * 7 + time * 6) % (height * 0.85);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + 25);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(80, 120, 180, 0.15)';
        ctx.fillRect(0, 0, width, height);
    };

    const drawWindEffect = (weather, time) => {
        if (weather.id !== 'tailwind' && weather.id !== 'headwind') return;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        const direction = weather.id === 'tailwind' ? 1 : -1;
        const speed = weather.id === 'tailwind' ? 0.6 : 0.35;
        
        for (let i = 0; i < 25; i++) {
            const y = trackY - 30 + i * 20;
            const xOffset = (time * speed * direction + i * 70) % (width + 150) - 75;
            
            ctx.beginPath();
            ctx.moveTo(xOffset, y);
            ctx.lineTo(xOffset + 50 * direction, y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(xOffset + 50 * direction, y);
            ctx.lineTo(xOffset + 38 * direction, y - 8);
            ctx.moveTo(xOffset + 50 * direction, y);
            ctx.lineTo(xOffset + 38 * direction, y + 8);
            ctx.stroke();
        }
    };

    const drawTrack = (laneCount) => {
        const totalTrackHeight = laneCount * laneHeight;
        const trackBottom = trackY + totalTrackHeight;
        
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(0, trackBottom, width, height - trackBottom);
        
        for (let i = 0; i < width; i += 30) {
            ctx.fillStyle = 'rgba(0, 80, 0, 0.15)';
            ctx.fillRect(i, trackBottom, 15, height - trackBottom);
        }
        
        const trackGradient = ctx.createLinearGradient(0, trackY, 0, trackBottom);
        trackGradient.addColorStop(0, '#8B4513');
        trackGradient.addColorStop(0.25, '#A0522D');
        trackGradient.addColorStop(0.5, '#CD853F');
        trackGradient.addColorStop(0.75, '#A0522D');
        trackGradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = trackGradient;
        ctx.fillRect(trackStartX - 30, trackY, trackEndX - trackStartX + 60, totalTrackHeight);
        
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(trackStartX - 30, trackY, 30, totalTrackHeight);
        ctx.fillRect(trackEndX, trackY, 30, totalTrackHeight);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        for (let i = 0; i <= laneCount; i++) {
            const y = trackY + i * laneHeight;
            ctx.beginPath();
            ctx.moveTo(trackStartX - 30, y);
            ctx.lineTo(trackEndX + 30, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        for (let i = 1; i < laneCount; i++) {
            const y = trackY + i * laneHeight;
            ctx.beginPath();
            ctx.moveTo(trackStartX, y);
            ctx.lineTo(trackEndX, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        for (let m = 0; m <= 100; m += 10) {
            const x = trackStartX + (trackEndX - trackStartX) * (m / 100);
            ctx.fillText(m + 'm', x, trackY - 12);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(x - 2, trackY, 4, totalTrackHeight);
            ctx.fillStyle = '#FFFFFF';
        }
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(trackStartX - 8, trackY, 8, totalTrackHeight);
        
        drawFinishLine(trackEndX, trackY, totalTrackHeight);
    };

    const drawFinishLine = (x, y, height) => {
        const squareSize = 10;
        for (let row = 0; row < height / squareSize; row++) {
            for (let col = 0; col < 4; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#000000' : '#FFFFFF';
                ctx.fillRect(x + col * squareSize - 20, y + row * squareSize, squareSize, squareSize);
            }
        }
        
        const poleGradient = ctx.createLinearGradient(x + 22, y, x + 32, y);
        poleGradient.addColorStop(0, '#654321');
        poleGradient.addColorStop(0.5, '#8B4513');
        poleGradient.addColorStop(1, '#654321');
        ctx.fillStyle = poleGradient;
        ctx.fillRect(x + 22, y - 40, 10, height + 40);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 27, y - 45, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(x + 32, y - 40);
        ctx.lineTo(x + 70, y - 30);
        ctx.lineTo(x + 32, y - 20);
        ctx.closePath();
        ctx.fill();
    };

    const drawRunner = (runner, isPlayer, time) => {
        const x = trackStartX + (trackEndX - trackStartX) * (runner.position / 100);
        const y = trackY + runner.lane * laneHeight + laneHeight / 2;
        
        if (runner.speed > 9 && runner.hasStarted && !runner.isFinished) {
            drawSpeedLines(x, y, runner.speed);
        }
        
        if (runner.speed > 7.5 && runner.hasStarted && !runner.isFinished) {
            drawAfterimage(x, y, runner, time);
        }
        
        drawAthlete(x, y, runner, isPlayer, time);
        
        if (runner.isFinished) {
            drawFinishRibbon(x, y, time);
        }
        
        drawRunnerLabel(x, y, runner, isPlayer);
    };

    const drawAthlete = (x, y, runner, isPlayer, time) => {
        const bodyColor = runner.color;
        const isRunning = runner.hasStarted && !runner.isFinished;
        const runCycle = isRunning ? (time * 0.025) % (Math.PI * 2) : 0;
        
        const legAngle = isRunning ? Math.sin(runCycle) * 0.9 : 0;
        const armAngle = isRunning ? Math.sin(runCycle + Math.PI) * 0.8 : 0;
        const bodyLean = isRunning ? 0.18 : 0;
        const verticalBob = isRunning ? Math.abs(Math.sin(runCycle * 2)) * 4 : 0;
        
        ctx.save();
        ctx.translate(x, y - verticalBob);
        ctx.rotate(bodyLean);
        
        const upperLegLength = 18;
        const lowerLegLength = 18;
        
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const leftHipX = -5;
        const leftHipY = 14;
        const leftKneeX = leftHipX + Math.sin(-legAngle - 0.35) * upperLegLength;
        const leftKneeY = leftHipY + Math.cos(-legAngle - 0.35) * upperLegLength;
        const leftAnkleX = leftKneeX + Math.sin(-legAngle * 0.6 + 0.6) * lowerLegLength;
        const leftAnkleY = leftKneeY + Math.cos(-legAngle * 0.6 + 0.6) * lowerLegLength;
        
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftKneeX, leftKneeY);
        ctx.lineTo(leftAnkleX, leftAnkleY);
        ctx.stroke();
        
        const rightHipX = 5;
        const rightHipY = 14;
        const rightKneeX = rightHipX + Math.sin(legAngle - 0.35) * upperLegLength;
        const rightKneeY = rightHipY + Math.cos(legAngle - 0.35) * upperLegLength;
        const rightAnkleX = rightKneeX + Math.sin(legAngle * 0.6 + 0.6) * lowerLegLength;
        const rightAnkleY = rightKneeY + Math.cos(legAngle * 0.6 + 0.6) * lowerLegLength;
        
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightKneeX, rightKneeY);
        ctx.lineTo(rightAnkleX, rightAnkleY);
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(leftAnkleX, leftAnkleY + 4, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightAnkleX, rightAnkleY + 4, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(leftAnkleX, leftAnkleY + 5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightAnkleX, rightAnkleY + 5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const torsoGradient = ctx.createLinearGradient(-12, -12, 12, 18);
        torsoGradient.addColorStop(0, lightenColor(bodyColor, 25));
        torsoGradient.addColorStop(0.5, bodyColor);
        torsoGradient.addColorStop(1, darkenColor(bodyColor, 15));
        ctx.fillStyle = torsoGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = darkenColor(bodyColor, 20);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(-12 + Math.sin(armAngle) * 14, -3 + Math.cos(armAngle) * 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12 + Math.sin(-armAngle) * 14, -3 + Math.cos(-armAngle) * 14, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-9, -6);
        ctx.lineTo(-12 + Math.sin(armAngle) * 14, -3 + Math.cos(armAngle) * 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(9, -6);
        ctx.lineTo(12 + Math.sin(-armAngle) * 14, -3 + Math.cos(-armAngle) * 14);
        ctx.stroke();
        
        const neckY = -17;
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(-4, neckY, 8, 7);
        
        const headY = -28;
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(0, headY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.ellipse(0, headY - 6, 10, 6, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C2C2C';
        ctx.beginPath();
        ctx.arc(-3, headY - 2, 1.8, 0, Math.PI * 2);
        ctx.arc(3, headY - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-2.5, headY - 2.5, 0.6, 0, Math.PI * 2);
        ctx.arc(3.5, headY - 2.5, 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, headY + 3, 4, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        if (isPlayer) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', 0, headY - 22);
            
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, headY, 14, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    };

    const lightenColor = (color, percent) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    };

    const darkenColor = (color, percent) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)
        ).toString(16).slice(1);
    };

    const drawSpeedLines = (x, y, speed) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        const lineCount = Math.floor((speed - 9) * 4);
        for (let i = 0; i < lineCount; i++) {
            const offsetY = (Math.random() - 0.5) * 60;
            const length = 30 + Math.random() * 40;
            ctx.beginPath();
            ctx.moveTo(x - length, y + offsetY);
            ctx.lineTo(x - 20, y + offsetY);
            ctx.stroke();
        }
    };

    const drawAfterimage = (x, y, runner, time) => {
        const alpha = 0.2;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        for (let i = 1; i <= 3; i++) {
            const offsetX = -i * 15 - (runner.speed * 0.9);
            drawAthlete(x + offsetX, y, runner, false, time);
        }
        
        ctx.restore();
    };

    const drawFinishRibbon = (x, y, time) => {
        const ribbonY = y - 40 + Math.sin(time * 0.02) * 5;
        
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(x, ribbonY);
        ctx.lineTo(x + 35, ribbonY - 22);
        ctx.lineTo(x + 28, ribbonY);
        ctx.lineTo(x + 35, ribbonY + 22);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x, ribbonY);
        ctx.lineTo(x - 35, ribbonY - 22);
        ctx.lineTo(x - 28, ribbonY);
        ctx.lineTo(x - 35, ribbonY + 22);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', x, ribbonY + 5);
    };

    const drawRunnerLabel = (x, y, runner, isPlayer) => {
        const label = isPlayer ? '你' : runner.name;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x - textWidth / 2 - 8, y + 38, textWidth + 16, 20);
        
        ctx.fillStyle = isPlayer ? '#FFD700' : '#FFFFFF';
        ctx.fillText(label, x, y + 52);
        
        if (runner.isFinished && runner.finishTime) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            const timeText = runner.finishTime.toFixed(2) + 's';
            const timeWidth = ctx.measureText(timeText).width;
            ctx.fillRect(x - timeWidth / 2 - 8, y + 60, timeWidth + 16, 18);
            
            ctx.fillStyle = '#4ECDC4';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(timeText, x, y + 73);
        }
    };

    const drawGunFlash = (intensity) => {
        if (intensity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = intensity * 0.8;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    };

    const drawPositionIndicators = (runners) => {
        const sorted = [...runners].sort((a, b) => b.position - a.position);
        
        sorted.forEach((runner, index) => {
            if (runner.position > 0 && !runner.isFinished) {
                const x = trackStartX + (trackEndX - trackStartX) * (runner.position / 100);
                const y = trackY + runner.lane * laneHeight - 18;
                
                if (index < 3) {
                    ctx.fillStyle = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    
                    const rankText = ['🥇', '🥈', '🥉'][index];
                    ctx.fillText(rankText, x, y);
                }
            }
        });
    };

    const drawWeatherIndicator = (weather) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(trackStartX, height - 40, 220, 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${weather.icon} ${weather.name} - ${weather.description}`, trackStartX + 12, height - 18);
    };

    const render = (gameState) => {
        const { runners, weather, gamePhase, gunFlashIntensity, time, player } = gameState;
        
        if (!weather || !runners || runners.length === 0) return;
        
        ctx.clearRect(0, 0, width, height);
        
        drawSky(weather);
        drawStadium();
        drawSun(weather, time);
        drawClouds(weather, time);
        drawRain(weather, time);
        drawWindEffect(weather, time);
        drawTrack(runners.length);
        drawPositionIndicators(runners);
        
        const sortedRunners = [...runners].sort((a, b) => a.lane - b.lane);
        sortedRunners.forEach(runner => {
            drawRunner(runner, runner.id === 'player', time);
        });
        
        drawWeatherIndicator(weather);
        drawGunFlash(gunFlashIntensity);
    };

    return {
        init,
        resize,
        render
    };
})();
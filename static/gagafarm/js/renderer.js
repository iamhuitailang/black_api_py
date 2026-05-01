/**
 * 咯咯农场 - Canvas渲染引擎
 * 负责游戏画面的绘制和动画效果
 */

const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let animationFrameId = null;
    let gameState = null;
    
    const CHICKEN_SIZE = 40;
    const EGG_SIZE = 20;
    
    const COLORS = {
        sky: '#87CEEB',
        skyGradient: ['#87CEEB', '#B0E0E6'],
        nightSkyGradient: ['#191970', '#4B0082'],
        duskSkyGradient: ['#FF6B6B', '#483D8B'],
        dawnSkyGradient: ['#FFB347', '#87CEEB'],
        grass: '#90EE90',
        grassDark: '#32CD32',
        grassLight: '#98FB98',
        nightGrass: ['#228B22', '#006400'],
        dirt: '#8B4513',
        dirtLight: '#CD853F',
        wood: '#DEB887',
        woodDark: '#D2691E',
        fence: '#8B4513',
        water: '#4169E1',
        lightYellow: '#FFFFE0',
        lightOrange: '#FFD700'
    };
    
    let dogAnimation = {
        frame: 0,
        direction: 1,
        isBarking: false,
        lastBarkTime: 0
    };
    
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        return true;
    }
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        const maxWidth = Math.min(800, rect.width - 40);
        const maxHeight = Math.min(500, window.innerHeight * 0.5);
        
        const aspectRatio = 800 / 500;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }
    
    function startRendering(state) {
        gameState = state;
        renderLoop();
    }
    
    function stopRendering() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    function updateState(state) {
        gameState = state;
    }
    
    function renderLoop() {
        render();
        animationFrameId = requestAnimationFrame(renderLoop);
    }
    
    function render() {
        if (!ctx || !gameState) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const timePeriod = getCurrentTimePeriodInternal();
        
        drawBackground(timePeriod);
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            drawStars();
            drawMoon();
        }
        
        const coop = getCoopTypeById(gameState.currentCoopId);
        drawCoop(coop, timePeriod);
        
        drawGrass(timePeriod);
        
        drawEggs();
        
        drawChickens(gameState.chickens);
        
        drawFence();
        
        if (gameState.hasDog) {
            drawDog(timePeriod);
        }
        
        drawTimeIndicator(timePeriod);
    }
    
    function getCurrentTimePeriodInternal() {
        if (!gameState || !gameState.timeSystem) {
            return TIME_PERIOD.DAY;
        }
        
        const dayDurationMs = secondsToMs(CONFIG.DAY_DURATION_SECONDS);
        const timeInCycle = gameState.timeSystem.elapsedTime % dayDurationMs;
        const percent = timeInCycle / dayDurationMs;
        
        if (percent >= CONFIG.NIGHT_START_PERCENT || percent < CONFIG.DAY_START_PERCENT) {
            return TIME_PERIOD.NIGHT;
        } else if (percent >= CONFIG.DAY_START_PERCENT && percent < CONFIG.DAY_START_PERCENT + 0.1) {
            return TIME_PERIOD.DAWN;
        } else if (percent >= CONFIG.NIGHT_START_PERCENT - 0.1 && percent < CONFIG.NIGHT_START_PERCENT) {
            return TIME_PERIOD.DUSK;
        } else {
            return TIME_PERIOD.DAY;
        }
    }
    
    function drawBackground(timePeriod) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        
        switch (timePeriod) {
            case TIME_PERIOD.NIGHT:
                skyGradient.addColorStop(0, COLORS.nightSkyGradient[0]);
                skyGradient.addColorStop(1, COLORS.nightSkyGradient[1]);
                break;
            case TIME_PERIOD.DUSK:
                skyGradient.addColorStop(0, COLORS.duskSkyGradient[0]);
                skyGradient.addColorStop(1, COLORS.duskSkyGradient[1]);
                break;
            case TIME_PERIOD.DAWN:
                skyGradient.addColorStop(0, COLORS.dawnSkyGradient[0]);
                skyGradient.addColorStop(1, COLORS.dawnSkyGradient[1]);
                break;
            default:
                skyGradient.addColorStop(0, COLORS.skyGradient[0]);
                skyGradient.addColorStop(1, COLORS.skyGradient[1]);
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
        
        if (timePeriod === TIME_PERIOD.DAY || timePeriod === TIME_PERIOD.DAWN || timePeriod === TIME_PERIOD.DUSK) {
            drawCloud(100, 80, 60);
            drawCloud(300, 50, 80);
            drawCloud(600, 100, 50);
        }
        
        const grassGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            grassGradient.addColorStop(0, COLORS.nightGrass[0]);
            grassGradient.addColorStop(1, COLORS.nightGrass[1]);
        } else {
            grassGradient.addColorStop(0, COLORS.grassLight);
            grassGradient.addColorStop(0.5, COLORS.grass);
            grassGradient.addColorStop(1, COLORS.grassDark);
        }
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);
    }
    
    function drawStars() {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.5;
            const size = Math.random() * 3 + 1;
            const twinkle = Math.sin(Date.now() / 500 + i) * 0.3 + 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawMoon() {
        const moonX = canvas.width * 0.8;
        const moonY = canvas.height * 0.15;
        const moonSize = 35;
        
        const glowGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonSize * 2);
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(200, 200, 150, 0.3)';
        ctx.beginPath();
        ctx.arc(moonX - 8, moonY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX + 10, moonY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawCloud(x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawCoop(coop, timePeriod) {
        const coopX = canvas.width * 0.05;
        const coopY = canvas.height * 0.35;
        const coopWidth = canvas.width * 0.3;
        const coopHeight = canvas.height * 0.35;
        
        ctx.fillStyle = COLORS.wood;
        ctx.fillRect(coopX, coopY + coopHeight * 0.3, coopWidth, coopHeight * 0.7);
        
        ctx.fillStyle = COLORS.dirt;
        ctx.beginPath();
        ctx.moveTo(coopX - 10, coopY + coopHeight * 0.3);
        ctx.lineTo(coopX + coopWidth / 2, coopY - 20);
        ctx.lineTo(coopX + coopWidth + 10, coopY + coopHeight * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = COLORS.woodDark;
        ctx.fillRect(coopX + coopWidth * 0.6, coopY + coopHeight * 0.45, coopWidth * 0.25, coopHeight * 0.55);
        
        ctx.fillStyle = COLORS.dirtLight;
        ctx.fillRect(coopX + coopWidth * 0.1, coopY + coopHeight * 0.45, coopWidth * 0.2, coopWidth * 0.2);
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            const windowX = coopX + coopWidth * 0.1;
            const windowY = coopY + coopHeight * 0.45;
            const windowSize = coopWidth * 0.2;
            
            const lightGradient = ctx.createRadialGradient(
                windowX + windowSize / 2, windowY + windowSize / 2, 0,
                windowX + windowSize / 2, windowY + windowSize / 2, windowSize * 2
            );
            lightGradient.addColorStop(0, 'rgba(255, 223, 128, 0.6)');
            lightGradient.addColorStop(1, 'rgba(255, 223, 128, 0)');
            ctx.fillStyle = lightGradient;
            ctx.beginPath();
            ctx.arc(windowX + windowSize / 2, windowY + windowSize / 2, windowSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 223, 128, 0.8)';
            ctx.fillRect(windowX, windowY, windowSize, windowSize);
        }
        
        ctx.fillStyle = timePeriod === TIME_PERIOD.NIGHT ? '#FFF' : '#333';
        ctx.font = 'bold 14px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(coop.name, coopX + coopWidth / 2, coopY + coopHeight * 0.2);
    }
    
    function drawGrass(timePeriod) {
        const grassY = canvas.height * 0.7;
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = grassY + Math.random() * (canvas.height - grassY);
            const height = 10 + Math.random() * 15;
            
            if (timePeriod === TIME_PERIOD.NIGHT) {
                ctx.fillStyle = i % 2 === 0 ? COLORS.nightGrass[0] : COLORS.nightGrass[1];
            } else {
                ctx.fillStyle = i % 2 === 0 ? COLORS.grassDark : COLORS.grassLight;
            }
            ctx.fillRect(x, y, 2, height);
        }
    }
    
    function drawEggs() {
        if (!gameState || gameState.eggs <= 0) return;
        
        const eggCount = Math.min(gameState.eggs, 20);
        const startX = canvas.width * 0.7;
        const startY = canvas.height * 0.8;
        
        for (let i = 0; i < eggCount; i++) {
            const x = startX + (i % 5) * 25 - 50;
            const y = startY - Math.floor(i / 5) * 15;
            
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.ellipse(x, y, EGG_SIZE / 2, EGG_SIZE / 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#DDD';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        if (gameState.eggs > 20) {
            ctx.fillStyle = '#8B4513';
            ctx.font = 'bold 14px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.fillText(`+${gameState.eggs - 20}`, startX, startY - 60);
        }
    }
    
    function drawChickens(chickens) {
        if (!chickens || chickens.length === 0) return;
        
        const displayChickens = chickens.slice(0, 50);
        
        for (const chicken of displayChickens) {
            drawChicken(chicken);
        }
    }
    
    function drawChicken(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        
        const x = chicken.position.x * canvas.width;
        const y = chicken.position.y * canvas.height;
        
        const statusEmoji = getStatusEmoji(chicken);
        
        ctx.font = `${CHICKEN_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        
        if (chicken.animation.direction < 0) {
            ctx.scale(-1, 1);
            ctx.fillText(statusEmoji, -x, y);
        } else {
            ctx.fillText(statusEmoji, x, y);
        }
        
        ctx.restore();
        
        drawChickenStatus(chicken, x, y);
    }
    
    function getStatusEmoji(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        
        switch (chicken.status) {
            case CHICKEN_STATUS.CHICK:
                return '🐤';
            case CHICKEN_STATUS.ADULT:
                return chickenType.icon;
            case CHICKEN_STATUS.SENIOR:
                return '👵';
            default:
                return chickenType.icon;
        }
    }
    
    function drawChickenStatus(chicken, x, y) {
        const barWidth = 30;
        const barHeight = 4;
        const barY = y - CHICKEN_SIZE / 2 - 10;
        
        if (chicken.status === CHICKEN_STATUS.CHICK) {
            const progress = ChickenManager.getChickenGrowthProgress(chicken);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);
            
            ctx.fillStyle = progress >= 1 ? '#32CD32' : '#FFD700';
            ctx.fillRect(x - barWidth / 2, barY, barWidth * progress, barHeight);
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);
        }
        
        if (chicken.status === CHICKEN_STATUS.ADULT || chicken.status === CHICKEN_STATUS.SENIOR) {
            const remaining = ChickenManager.getNextLayTimeRemaining(chicken);
            const chickenType = getChickenTypeById(chicken.type);
            let totalInterval = secondsToMs(chickenType.layIntervalSeconds);
            
            if (chicken.status === CHICKEN_STATUS.SENIOR) {
                totalInterval = totalInterval / CONFIG.SENIOR_PRODUCTION_RATE;
            }
            
            const progress = 1 - (remaining / totalInterval);
            
            if (progress > 0.8) {
                ctx.font = '12px Arial';
                ctx.fillText('💫', x, y - CHICKEN_SIZE / 2 - 20);
            }
        }
        
        if (chicken.status === CHICKEN_STATUS.SENIOR) {
            ctx.font = '12px Arial';
            ctx.fillText('⚰️', x + CHICKEN_SIZE / 2 - 5, y - CHICKEN_SIZE / 2);
        }
    }
    
    function drawFence() {
        ctx.fillStyle = COLORS.fence;
        
        const fenceY = canvas.height * 0.55;
        
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.fillRect(x, fenceY, 5, 40);
            ctx.fillRect(x + 35, fenceY, 5, 40);
        }
        
        ctx.fillRect(0, fenceY + 10, canvas.width, 4);
        ctx.fillRect(0, fenceY + 25, canvas.width, 4);
    }
    
    function drawDog(timePeriod) {
        const dogX = canvas.width * 0.85;
        const dogY = canvas.height * 0.65;
        const dogSize = 45;
        
        dogAnimation.frame += 0.05;
        if (dogAnimation.frame > 2) {
            dogAnimation.frame = 0;
        }
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            const now = Date.now();
            if (now - dogAnimation.lastBarkTime > 5000 && Math.random() < 0.005) {
                dogAnimation.isBarking = true;
                dogAnimation.lastBarkTime = now;
                
                setTimeout(() => {
                    dogAnimation.isBarking = false;
                }, 1500);
            }
        }
        
        ctx.font = `${dogSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const bounce = Math.sin(Date.now() / 500) * 2;
        
        ctx.fillText('🐕', dogX, dogY + bounce);
        
        if (dogAnimation.isBarking && timePeriod === TIME_PERIOD.NIGHT) {
            ctx.font = '16px Microsoft YaHei';
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.strokeText('汪汪!', dogX, dogY - 50);
            ctx.fillText('汪汪!', dogX, dogY - 50);
        }
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            ctx.font = '14px Microsoft YaHei';
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.fillText('🦷 看家中', dogX, dogY + 35);
        }
    }
    
    function drawTimeIndicator(timePeriod) {
        const indicatorX = canvas.width * 0.08;
        const indicatorY = canvas.height * 0.08;
        
        ctx.font = '14px Microsoft YaHei';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        let timeText = '';
        let timeIcon = '';
        let textColor = '#333';
        
        switch (timePeriod) {
            case TIME_PERIOD.NIGHT:
                timeText = '夜晚';
                timeIcon = '🌙';
                textColor = '#FFF';
                break;
            case TIME_PERIOD.DUSK:
                timeText = '黄昏';
                timeIcon = '🌅';
                textColor = '#FFF';
                break;
            case TIME_PERIOD.DAWN:
                timeText = '黎明';
                timeIcon = '🌄';
                textColor = '#333';
                break;
            default:
                timeText = '白天';
                timeIcon = '☀️';
                textColor = '#333';
        }
        
        const bgWidth = 100;
        const bgHeight = 30;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(indicatorX - 5, indicatorY - 15, bgWidth, bgHeight);
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(indicatorX - 5, indicatorY - 15, bgWidth, bgHeight);
        
        ctx.fillStyle = textColor;
        ctx.fillText(`${timeIcon} ${timeText}`, indicatorX, indicatorY);
        
        if (timePeriod === TIME_PERIOD.NIGHT) {
            ctx.font = '11px Microsoft YaHei';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('⚠️ 注意黄鼠狼!', indicatorX, indicatorY + 20);
        }
    }
    
    function getCanvasCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    function findChickenAtPosition(x, y) {
        if (!gameState || !gameState.chickens) return null;
        
        const clickRadius = CHICKEN_SIZE;
        
        for (const chicken of gameState.chickens) {
            const chickenX = chicken.position.x * canvas.width;
            const chickenY = chicken.position.y * canvas.height;
            
            const distance = Math.sqrt(
                Math.pow(x - chickenX, 2) + Math.pow(y - chickenY, 2)
            );
            
            if (distance < clickRadius) {
                return chicken;
            }
        }
        
        return null;
    }
    
    return {
        init,
        startRendering,
        stopRendering,
        updateState,
        getCanvasCoordinates,
        findChickenAtPosition
    };
})();

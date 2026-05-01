const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    let hoveredPlotIndex = -1;
    let animationFrame = 0;

    const PLOT_CONFIG = {
        rows: 2,
        cols: 3,
        plotWidth: 160,
        plotHeight: 130,
        startX: 160,
        startY: 100,
        gapX: 30,
        gapY: 30
    };

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
    }

    function getPlotBounds(index) {
        const row = Math.floor(index / PLOT_CONFIG.cols);
        const col = index % PLOT_CONFIG.cols;
        
        return {
            x: PLOT_CONFIG.startX + col * (PLOT_CONFIG.plotWidth + PLOT_CONFIG.gapX),
            y: PLOT_CONFIG.startY + row * (PLOT_CONFIG.plotHeight + PLOT_CONFIG.gapY),
            width: PLOT_CONFIG.plotWidth,
            height: PLOT_CONFIG.plotHeight
        };
    }

    function getPlotAtPosition(x, y) {
        for (let i = 0; i < 6; i++) {
            const bounds = getPlotBounds(i);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return i;
            }
        }
        return -1;
    }

    function setHoveredPlot(index) {
        hoveredPlotIndex = index;
    }

    function getHoveredPlot() {
        return hoveredPlotIndex;
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(0.3, '#8B4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * 100;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + 10);
            ctx.lineTo(x + 3, y + 10);
            ctx.closePath();
            ctx.fill();
        }

        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🌻', 50, 50);
        ctx.fillText('🌺', canvas.width - 80, 60);
        ctx.fillText('🌸', 100, 80);
        ctx.fillText('🌼', canvas.width - 120, 40);
    }

    function drawPlot(index, plot, isHovered) {
        const bounds = getPlotBounds(index);
        const { x, y, width, height } = bounds;

        ctx.save();
        
        ctx.fillStyle = isHovered ? '#8B4513' : '#654321';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();

        ctx.strokeStyle = isHovered ? '#D2691E' : '#4A3520';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(
                    x + 20 + i * 35,
                    y + 25 + j * 40,
                    8,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        const isValidPlot = plot && 
                           typeof plot === 'object' && 
                           !Array.isArray(plot);

        if (isValidPlot && plot.cropId) {
            const crop = DataManager.getCropById(plot.cropId);
            if (crop && plot.plantedAt) {
                const growth = DataManager.getGrowthStage(
                    crop,
                    plot.plantedAt,
                    plot.wateredAt,
                    plot.fertilizedAt
                );
                
                if (growth) {
                    drawCrop(x, y, width, height, crop, growth, plot);
                }
            }
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+', x + width / 2, y + height / 2 + 10);
        }

        ctx.restore();
    }

    function drawCrop(x, y, width, height, crop, growth, plot) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const soilY = y + height * 0.7;

        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 4;

        if (growth.stage === 'seed') {
            ctx.strokeStyle = '#32CD32';
            ctx.lineWidth = 3;
            
            const sproutHeight = 20 + Math.sin(animationFrame * 0.1) * 3;
            
            ctx.beginPath();
            ctx.moveTo(centerX, soilY);
            ctx.quadraticCurveTo(centerX - 5, soilY - sproutHeight / 2, centerX, soilY - sproutHeight);
            ctx.stroke();

            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.ellipse(centerX - 8, soilY - sproutHeight + 5, 8, 5, -0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(centerX + 8, soilY - sproutHeight + 5, 8, 5, 0.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (growth.stage === 'seedling') {
            const plantHeight = 50 + Math.sin(animationFrame * 0.08) * 2;
            
            ctx.beginPath();
            ctx.moveTo(centerX, soilY);
            ctx.quadraticCurveTo(centerX - 3, soilY - plantHeight / 2, centerX, soilY - plantHeight);
            ctx.stroke();

            ctx.fillStyle = '#228B22';
            
            for (let i = 0; i < 3; i++) {
                const leafY = soilY - plantHeight * (0.3 + i * 0.25);
                const leafSize = 12 + i * 3;
                const side = i % 2 === 0 ? -1 : 1;
                
                ctx.beginPath();
                ctx.ellipse(
                    centerX + side * 15,
                    leafY,
                    leafSize,
                    leafSize * 0.6,
                    side * 0.3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

        } else if (growth.stage === 'mature') {
            const plantHeight = 60 + Math.sin(animationFrame * 0.05) * 3;
            
            ctx.beginPath();
            ctx.moveTo(centerX, soilY);
            ctx.quadraticCurveTo(centerX - 2, soilY - plantHeight / 2, centerX, soilY - plantHeight);
            ctx.stroke();

            ctx.fillStyle = '#228B22';
            for (let i = 0; i < 4; i++) {
                const leafY = soilY - plantHeight * (0.2 + i * 0.2);
                const leafSize = 10 + i * 2;
                const side = i % 2 === 0 ? -1 : 1;
                
                ctx.beginPath();
                ctx.ellipse(
                    centerX + side * 18,
                    leafY,
                    leafSize,
                    leafSize * 0.5,
                    side * 0.4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(crop.emoji, centerX, soilY - plantHeight + 5);

            if (growth.isMature) {
                const glowSize = 40 + Math.sin(animationFrame * 0.1) * 10;
                const gradient = ctx.createRadialGradient(
                    centerX, soilY - plantHeight + 5,
                    0,
                    centerX, soilY - plantHeight + 5,
                    glowSize
                );
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, soilY - plantHeight + 5, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawStatusIndicators(x, y, width, growth, plot);
    }

    function drawStatusIndicators(x, y, width, growth, plot) {
        let indicatorX = x + 10;
        const indicatorY = y + 10;

        if (growth.waterBoostActive) {
            ctx.font = '16px Arial';
            ctx.fillText('💧', indicatorX, indicatorY + 15);
            indicatorX += 25;
        }

        if (growth.fertilizerActive) {
            ctx.font = '16px Arial';
            ctx.fillText('✨', indicatorX, indicatorY + 15);
            indicatorX += 25;
        }

        if (!growth.isMature) {
            const progressBarWidth = width - 20;
            const progressBarX = x + 10;
            const progressBarY = y + height - 20;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.roundRect(progressBarX, progressBarY, progressBarWidth, 12, 6);
            ctx.fill();

            const progressColor = growth.stage === 'seed' ? '#90EE90' :
                                 growth.stage === 'seedling' ? '#32CD32' : '#FFD700';
            ctx.fillStyle = progressColor;
            ctx.beginPath();
            ctx.roundRect(progressBarX + 1, progressBarY + 1, (progressBarWidth - 2) * growth.progress, 10, 5);
            ctx.fill();

            ctx.fillStyle = '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                formatTime(growth.remainingTime),
                progressBarX + progressBarWidth / 2,
                progressBarY + 9
            );
        }
    }

    function formatTime(ms) {
        if (ms <= 0) return '成熟';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        }
        return `${remainingSeconds}秒`;
    }

    function render(plots) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        
        for (let i = 0; i < 6; i++) {
            drawPlot(i, plots[i], i === hoveredPlotIndex);
        }
        
        animationFrame++;
    }

    return {
        init,
        getPlotAtPosition,
        setHoveredPlot,
        getHoveredPlot,
        getPlotBounds,
        render
    };
})();

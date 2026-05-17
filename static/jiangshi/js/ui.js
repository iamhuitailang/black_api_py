const UI = {
    elements: {},

    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            startBtn: document.getElementById('start-btn'),
            diffBtns: document.querySelectorAll('.diff-btn'),
            highestWavePreview: document.getElementById('highest-wave-preview'),
            totalKillsPreview: document.getElementById('total-kills-preview'),
            
            currentWave: document.getElementById('current-wave'),
            totalWaves: document.getElementById('total-waves'),
            killCount: document.getElementById('kill-count'),
            highestWave: document.getElementById('highest-wave'),
            score: document.getElementById('score'),
            sunCount: document.getElementById('sun-count'),
            waveStatus: document.getElementById('wave-status'),
            
            pauseBtn: document.getElementById('pause-btn'),
            restartBtn: document.getElementById('restart-btn'),
            nextWaveBtn: document.getElementById('next-wave-btn'),
            
            pauseOverlay: document.getElementById('pause-overlay'),
            resumeBtn: document.getElementById('resume-btn'),
            overlayRestartBtn: document.getElementById('overlay-restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            
            gameoverOverlay: document.getElementById('gameover-overlay'),
            finalWave: document.getElementById('final-wave'),
            finalKills: document.getElementById('final-kills'),
            finalScore: document.getElementById('final-score'),
            gameoverRestartBtn: document.getElementById('gameover-restart-btn'),
            gameoverQuitBtn: document.getElementById('gameover-quit-btn'),
            
            victoryOverlay: document.getElementById('victory-overlay'),
            victoryKills: document.getElementById('victory-kills'),
            victoryScore: document.getElementById('victory-score'),
            victoryRestartBtn: document.getElementById('victory-restart-btn'),
            victoryQuitBtn: document.getElementById('victory-quit-btn'),
            
            plantCards: document.querySelectorAll('.plant-card'),
            canvas: document.getElementById('game-canvas')
        };
        
        this.elements.totalWaves.textContent = CONFIG.GAME.TOTAL_WAVES;
    },

    showScreen(screenName) {
        this.elements.startScreen.classList.remove('active');
        this.elements.gameScreen.classList.remove('active');
        
        if (screenName === 'start') {
            this.elements.startScreen.classList.add('active');
        } else if (screenName === 'game') {
            this.elements.gameScreen.classList.add('active');
        }
    },

    updateStats(gameState) {
        this.elements.currentWave.textContent = gameState.currentWave;
        this.elements.killCount.textContent = gameState.killCount;
        this.elements.score.textContent = gameState.score;
        this.elements.sunCount.textContent = gameState.sun;
    },

    updateHighestWave(wave) {
        this.elements.highestWave.textContent = wave;
    },

    updatePreviewStats(stats) {
        this.elements.highestWavePreview.textContent = stats.highestWave;
        this.elements.totalKillsPreview.textContent = stats.totalKills;
    },

    setSelectedPlant(plantType) {
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.plant === plantType) {
                card.classList.add('selected');
            }
        });
    },

    clearSelectedPlant() {
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('selected');
        });
    },

    updatePlantCards(sun) {
        document.querySelectorAll('.plant-card').forEach(card => {
            const plantType = card.dataset.plant;
            const cost = CONFIG.PLANTS[plantType].cost;
            if (sun < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    },

    updateWaveStatus(text) {
        this.elements.waveStatus.textContent = text;
    },

    showPauseOverlay() {
        this.elements.pauseOverlay.classList.remove('hidden');
    },

    hidePauseOverlay() {
        this.elements.pauseOverlay.classList.add('hidden');
    },

    showGameOver(gameState) {
        this.elements.finalWave.textContent = gameState.currentWave;
        this.elements.finalKills.textContent = gameState.killCount;
        this.elements.finalScore.textContent = gameState.score;
        this.elements.gameoverOverlay.classList.remove('hidden');
    },

    hideGameOver() {
        this.elements.gameoverOverlay.classList.add('hidden');
    },

    showVictory(gameState) {
        this.elements.victoryKills.textContent = gameState.killCount;
        this.elements.victoryScore.textContent = gameState.score;
        this.elements.victoryOverlay.classList.remove('hidden');
    },

    hideVictory() {
        this.elements.victoryOverlay.classList.add('hidden');
    },

    hideAllOverlays() {
        this.hidePauseOverlay();
        this.hideGameOver();
        this.hideVictory();
    },

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#4a7c3a');
        gradient.addColorStop(1, '#2d5a27');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        this.drawLawnTexture(ctx);
        this.drawGrid(ctx);
        this.drawHouse(ctx);
    },

    drawLawnTexture(ctx) {
        ctx.fillStyle = 'rgba(60, 100, 50, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * CONFIG.CANVAS.WIDTH;
            const y = Math.random() * CONFIG.CANVAS.HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
        ctx.lineWidth = 1;
        
        for (let row = 0; row < CONFIG.CANVAS.GRID_ROWS; row++) {
            for (let col = 0; col < CONFIG.CANVAS.GRID_COLS; col++) {
                const x = CONFIG.CANVAS.GRID_OFFSET_X + col * CONFIG.CANVAS.CELL_WIDTH;
                const y = CONFIG.CANVAS.GRID_OFFSET_Y + row * CONFIG.CANVAS.CELL_HEIGHT;
                
                ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(76, 124, 60, 0.4)' : 'rgba(60, 100, 50, 0.4)';
                ctx.fillRect(x, y, CONFIG.CANVAS.CELL_WIDTH, CONFIG.CANVAS.CELL_HEIGHT);
                
                ctx.strokeRect(x, y, CONFIG.CANVAS.CELL_WIDTH, CONFIG.CANVAS.CELL_HEIGHT);
            }
        }
    },

    drawHouse(ctx) {
        const houseX = 10;
        const houseY = CONFIG.CANVAS.GRID_OFFSET_Y;
        const houseWidth = 80;
        const houseHeight = CONFIG.CANVAS.CELL_HEIGHT * CONFIG.CANVAS.GRID_ROWS;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(houseX, houseY, houseWidth, houseHeight);
        
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(houseX - 5, houseY);
        ctx.lineTo(houseX + houseWidth / 2, houseY - 30);
        ctx.lineTo(houseX + houseWidth + 5, houseY);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(houseX + 20, houseY + houseHeight - 60, 40, 60);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(houseX + 50, houseY + houseHeight - 30, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '32px serif';
        ctx.fillStyle = '#FF6B6B';
        ctx.textAlign = 'center';
        for (let row = 0; row < CONFIG.CANVAS.GRID_ROWS; row++) {
            const y = houseY + row * CONFIG.CANVAS.CELL_HEIGHT + CONFIG.CANVAS.CELL_HEIGHT / 2;
            ctx.fillText('🏠', houseX + houseWidth / 2, y);
        }
    },

    drawProjectiles(ctx, projectiles) {
        for (const proj of projectiles) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            
            if (proj.type === 'iceshooter') {
                ctx.fillStyle = '#00BFFF';
                ctx.shadowColor = '#00BFFF';
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = '#32CD32';
                ctx.shadowColor = '#32CD32';
                ctx.shadowBlur = 5;
            }
            
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.arc(-3, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    },

    drawSuns(ctx, suns) {
        for (const sun of suns) {
            if (sun.collected) continue;
            
            ctx.save();
            ctx.translate(sun.x, sun.y);
            
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☀️', 0, 0);
            
            ctx.restore();
        }
    },

    drawPlacementPreview(ctx, col, row, plantType, canPlace) {
        if (!Utils.isValidGrid(col, row)) return;
        
        const pos = Utils.gridToPixel(col, row);
        const config = CONFIG.PLANTS[plantType];
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        
        ctx.fillStyle = canPlace ? 'rgba(144, 238, 144, 0.5)' : 'rgba(255, 100, 100, 0.5)';
        ctx.fillRect(pos.x, pos.y, CONFIG.CANVAS.CELL_WIDTH, CONFIG.CANVAS.CELL_HEIGHT);
        
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.emoji, pos.x + CONFIG.CANVAS.CELL_WIDTH / 2, pos.y + CONFIG.CANVAS.CELL_HEIGHT / 2);
        
        ctx.restore();
    }
};

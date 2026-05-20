class UIManager {
    constructor() {
        this.elements = {};
        this.selectedLevel = Storage.getCurrentLevel();
        this.initElements();
    }
    
    initElements() {
        this.elements = {
            altitudeValue: document.getElementById('altitude-value'),
            altitudeFill: document.getElementById('altitude-fill'),
            windArrow: document.getElementById('wind-arrow'),
            windValue: document.getElementById('wind-value'),
            highScore: document.getElementById('high-score'),
            parachuteStatus: document.getElementById('parachute-status'),
            currentScore: document.getElementById('current-score'),
            landingIndicator: document.getElementById('landing-indicator'),
            startMenu: document.getElementById('start-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOverMenu: document.getElementById('game-over-menu'),
            tutorialMenu: document.getElementById('tutorial-menu'),
            menuHighScore: document.getElementById('menu-high-score'),
            levelGrid: document.getElementById('level-grid'),
            terrainSelect: document.getElementById('terrain-select'),
            startBtn: document.getElementById('start-btn'),
            tutorialBtn: document.getElementById('tutorial-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backToMenuBtn: document.getElementById('back-to-menu-btn'),
            closeTutorialBtn: document.getElementById('close-tutorial-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            cameraBtn: document.getElementById('camera-btn'),
            levelBadge: document.getElementById('level-badge'),
            lowAltitudeWarning: document.getElementById('low-altitude-warning'),
            gameOverTitle: document.getElementById('game-over-title'),
            resultDistance: document.getElementById('result-distance'),
            resultScore: document.getElementById('result-score'),
            resultHighScore: document.getElementById('result-high-score')
        };
    }
    
    updateHUD(player, windSystem, terrainSystem, currentScore, currentLevel = 1, cameraMode = 'follow') {
        const altitude = Math.max(0, Math.floor(player.altitude));
        this.elements.altitudeValue.textContent = `${altitude}m`;
        
        const altitudePercent = Utils.map(altitude, 0, CONFIG.GAME.START_ALTITUDE, 0, 100);
        this.elements.altitudeFill.style.width = `${altitudePercent}%`;
        
        const windInfo = windSystem.getWindInfo();
        const windSpeed = windInfo.effectiveSpeed;
        this.elements.windArrow.textContent = Utils.getWindArrow(windSpeed);
        this.elements.windArrow.style.transform = `rotate(${Utils.getWindRotation(windSpeed)}deg)`;
        this.elements.windValue.textContent = `${Math.abs(windSpeed).toFixed(1)} m/s`;
        
        const highScore = Storage.getHighScore();
        this.elements.highScore.textContent = highScore;
        
        if (player.canOpenParachute && !player.parachuteOpened) {
            this.elements.parachuteStatus.classList.remove('hidden');
        } else {
            this.elements.parachuteStatus.classList.add('hidden');
        }
        
        const levelConfig = CONFIG.LEVELS[currentLevel] || CONFIG.LEVELS[1];
        const cameraNames = {
            'follow': '跟随视角',
            'fixed': '固定视角',
            'firstPerson': '第一人称'
        };
        this.elements.currentScore.textContent = `第${currentLevel}关: ${levelConfig.name} | ${cameraNames[cameraMode] || ''} | 得分: ${currentScore}`;
        
        this.updateLandingIndicator(player, terrainSystem);
        
        if (altitude < CONFIG.GAME.LOW_ALTITUDE_WARNING) {
            this.elements.lowAltitudeWarning.classList.remove('hidden');
        } else {
            this.elements.lowAltitudeWarning.classList.add('hidden');
        }
        
        if (player.parachuteOpened || altitude > CONFIG.PARACHUTE_OPEN_ALTITUDE) {
            this.elements.pauseBtn.classList.remove('hidden');
            this.elements.cameraBtn.classList.remove('hidden');
        } else {
            this.elements.pauseBtn.classList.add('hidden');
            this.elements.cameraBtn.classList.add('hidden');
        }
        
        this.elements.levelBadge.textContent = `第 ${currentLevel} 关`;
    }
    
    updateLandingIndicator(player, terrainSystem) {
        const targetX = terrainSystem.targetX;
        const playerX = player.x;
        const diff = targetX - playerX;
        
        const arrow = this.elements.landingIndicator.querySelector('.indicator-arrow');
        
        if (Math.abs(diff) < 5) {
            arrow.textContent = '↓';
            arrow.style.transform = 'rotate(0deg)';
        } else if (diff > 0) {
            arrow.textContent = '→';
            arrow.style.transform = 'rotate(0deg)';
        } else {
            arrow.textContent = '←';
            arrow.style.transform = 'rotate(0deg)';
        }
    }
    
    showStartMenu() {
        this.hideAllMenus();
        this.elements.startMenu.classList.remove('hidden');
        this.elements.menuHighScore.textContent = Storage.getHighScore();
        this.populateLevelGrid();
        this.populateTerrainSelect();
    }
    
    populateLevelGrid() {
        const grid = this.elements.levelGrid;
        const unlockedLevel = Storage.getCurrentLevel();
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= 10; i++) {
            const levelConfig = CONFIG.LEVELS[i];
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            
            if (i <= unlockedLevel) {
                btn.classList.add('unlocked');
                btn.innerHTML = `
                    <span class="level-num">${i}</span>
                    <span class="level-name">${levelConfig.name}</span>
                `;
                btn.addEventListener('click', () => this.selectLevel(i));
                
                if (i === this.selectedLevel) {
                    btn.classList.add('selected');
                }
            } else {
                btn.innerHTML = `
                    <span class="locked-icon">🔒</span>
                    <span class="level-name">第${i}关</span>
                `;
                btn.disabled = true;
            }
            
            grid.appendChild(btn);
        }
    }
    
    selectLevel(level) {
        this.selectedLevel = level;
        this.populateLevelGrid();
    }
    
    getSelectedLevel() {
        return this.selectedLevel;
    }
    
    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    }
    
    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    }
    
    showGameOverMenu(isSuccess, distance, score, highScore, deathReason = '') {
        if (isSuccess) {
            const rating = Utils.getScoreRating(score);
            this.elements.gameOverTitle.textContent = `🎉 ${rating.text} 着陆成功!`;
            this.elements.gameOverTitle.style.color = rating.color;
        } else {
            this.elements.gameOverTitle.textContent = deathReason ? `💥 ${deathReason}` : '💥 着陆失败';
            this.elements.gameOverTitle.style.color = '#f44336';
        }
        this.elements.resultDistance.textContent = `${distance.toFixed(1)}m`;
        this.elements.resultScore.textContent = score;
        this.elements.resultHighScore.textContent = highScore;
        this.elements.gameOverMenu.classList.remove('hidden');
    }
    
    hideGameOverMenu() {
        this.elements.gameOverMenu.classList.add('hidden');
    }
    
    showTutorialMenu() {
        this.elements.tutorialMenu.classList.remove('hidden');
    }
    
    hideTutorialMenu() {
        this.elements.tutorialMenu.classList.add('hidden');
    }
    
    hideAllMenus() {
        this.elements.startMenu.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.tutorialMenu.classList.add('hidden');
    }
    
    populateTerrainSelect() {
        const select = this.elements.terrainSelect;
        const unlockedTerrains = Storage.getUnlockedTerrains();
        const currentLevel = Storage.getCurrentLevel();
        
        select.innerHTML = '';
        
        for (const [id, terrain] of Object.entries(CONFIG.TERRAIN.TYPES)) {
            const option = document.createElement('option');
            option.value = id;
            
            const isUnlocked = unlockedTerrains.includes(id);
            const lockText = isUnlocked ? '' : ` (🔒 第${terrain.unlockLevel}关解锁)`;
            option.textContent = `${terrain.name} (${terrain.scoreMultiplier}x)${lockText}`;
            option.disabled = !isUnlocked;
            
            if (isUnlocked) {
                select.appendChild(option);
            }
        }
    }
    
    getSelectedTerrain() {
        return this.elements.terrainSelect.value;
    }
}

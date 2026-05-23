class HUD {
    constructor() {
        this.timeDisplay = document.getElementById('time-display');
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.scoreDisplay = document.getElementById('score-display');
        this.buffsContainer = document.getElementById('buffs-container');
        this.phaseLabel = document.getElementById('phase-label');
        this.phaseProgressFill = document.getElementById('phase-progress-fill');
    }
    
    update(timeLeft, player, score, currentPhase, phaseProgress) {
        this.updateTime(timeLeft);
        this.updateHealth(player);
        this.updateScore(score);
        this.updateBuffs(player);
        this.updatePhase(currentPhase, phaseProgress);
    }
    
    updateTime(timeLeft) {
        const seconds = Math.ceil(timeLeft / 1000);
        this.timeDisplay.textContent = seconds;
        
        if (seconds <= GameConfig.TIME.WARNING_TIME) {
            this.timeDisplay.classList.add('warning');
        } else {
            this.timeDisplay.classList.remove('warning');
        }
    }
    
    updateHealth(player) {
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.healthFill.style.width = healthPercent + '%';
        this.healthText.textContent = `${player.health}/${player.maxHealth}`;
        
        this.healthFill.classList.remove('low', 'medium');
        if (healthPercent <= 25) {
            this.healthFill.classList.add('low');
        } else if (healthPercent <= 50) {
            this.healthFill.classList.add('medium');
        }
    }
    
    updateScore(score) {
        this.scoreDisplay.textContent = score;
    }
    
    updatePhase(currentPhase, phaseProgress) {
        let phaseName, phaseDesc;
        
        switch (currentPhase) {
            case 1:
                phaseName = '第一阶段';
                phaseDesc = '零星掉落';
                break;
            case 2:
                phaseName = '第二阶段';
                phaseDesc = '批量损毁';
                break;
            case 3:
                phaseName = '第三阶段';
                phaseDesc = '全域坍塌';
                break;
        }
        
        this.phaseLabel.textContent = `${phaseName}: ${phaseDesc}`;
        
        this.phaseLabel.classList.remove('phase-2', 'phase-3');
        this.phaseProgressFill.classList.remove('phase-2', 'phase-3');
        
        if (currentPhase === 2) {
            this.phaseLabel.classList.add('phase-2');
            this.phaseProgressFill.classList.add('phase-2');
        } else if (currentPhase === 3) {
            this.phaseLabel.classList.add('phase-3');
            this.phaseProgressFill.classList.add('phase-3');
        }
        
        this.phaseProgressFill.style.width = (phaseProgress * 100) + '%';
    }
    
    updateBuffs(player) {
        const buffs = player.getActiveBuffs();
        
        let html = '';
        buffs.forEach(buff => {
            let timeText = '';
            if (buff.charges !== undefined) {
                timeText = `x${buff.charges}`;
            } else {
                timeText = `${buff.time}s`;
            }
            
            html += `
                <div class="buff-icon ${buff.type}">
                    <span>${this.getBuffIcon(buff.type)}</span>
                    <span>${buff.name}</span>
                    <span class="buff-time">${timeText}</span>
                </div>
            `;
        });
        
        this.buffsContainer.innerHTML = html;
    }
    
    getBuffIcon(type) {
        switch (type) {
            case 'speed': return '⚡';
            case 'shield': return '🛡';
            case 'heal': return '♥';
            case 'clear': return '✦';
            default: return '★';
        }
    }
    
    reset() {
        this.timeDisplay.classList.remove('warning');
        this.healthFill.style.width = '100%';
        this.healthText.textContent = '100/100';
        this.healthFill.classList.remove('low', 'medium');
        this.scoreDisplay.textContent = '0';
        this.buffsContainer.innerHTML = '';
        this.phaseLabel.textContent = '第一阶段: 零星掉落';
        this.phaseLabel.classList.remove('phase-2', 'phase-3');
        this.phaseProgressFill.classList.remove('phase-2', 'phase-3');
        this.phaseProgressFill.style.width = '0%';
    }
}

class MenuManager {
    constructor() {
        this.startMenu = document.getElementById('start-menu');
        this.recordsMenu = document.getElementById('records-menu');
        this.helpMenu = document.getElementById('help-menu');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.victoryMenu = document.getElementById('victory-menu');
        
        this.highScoreDisplay = document.getElementById('high-score');
        
        this.initSceneSelector();
    }
    
    initSceneSelector() {
        const sceneOptions = document.querySelectorAll('.scene-option');
        this.selectedScene = 0;
        
        sceneOptions.forEach(option => {
            option.addEventListener('click', () => {
                sceneOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedScene = parseInt(option.dataset.scene);
            });
        });
    }
    
    getSelectedScene() {
        return this.selectedScene;
    }
    
    showStartMenu() {
        this.hideAllMenus();
        this.startMenu.classList.remove('hidden');
        this.highScoreDisplay.textContent = Storage.getHighScore();
    }
    
    showRecordsMenu() {
        this.hideAllMenus();
        this.recordsMenu.classList.remove('hidden');
        this.updateRecordsList();
    }
    
    showHelpMenu() {
        this.hideAllMenus();
        this.helpMenu.classList.remove('hidden');
    }
    
    showPauseMenu() {
        this.hideAllMenus();
        this.pauseMenu.classList.remove('hidden');
    }
    
    showGameOverMenu(reason, stats, isNewRecord) {
        this.hideAllMenus();
        this.gameOverMenu.classList.remove('hidden');
        
        document.getElementById('game-over-title').textContent = '逃生失败';
        document.getElementById('game-over-reason').textContent = reason;
        document.getElementById('final-score').textContent = stats.score;
        document.getElementById('survival-time').textContent = stats.survivalTime;
        document.getElementById('dodged-count').textContent = stats.dodgedCount;
        
        const badge = document.getElementById('new-record-badge');
        if (isNewRecord) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    showVictoryMenu(stats, isNewRecord) {
        this.hideAllMenus();
        this.victoryMenu.classList.remove('hidden');
        
        document.getElementById('victory-time').textContent = stats.victoryTime;
        document.getElementById('victory-health').textContent = stats.remainingHealth;
        document.getElementById('victory-score').textContent = stats.score;
        
        const badge = document.getElementById('new-record-badge-v');
        if (isNewRecord) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    hideAllMenus() {
        this.startMenu.classList.add('hidden');
        this.recordsMenu.classList.add('hidden');
        this.helpMenu.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
        this.gameOverMenu.classList.add('hidden');
        this.victoryMenu.classList.add('hidden');
    }
    
    updateRecordsList() {
        const records = Storage.getRecords();
        const listEl = document.getElementById('records-list');
        
        if (records.length === 0) {
            listEl.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">暂无通关记录</p>';
            return;
        }
        
        let html = '';
        records.forEach((record, index) => {
            const sceneName = GameConfig.SCENES[record.sceneIndex]?.name || '未知场景';
            html += `
                <div class="record-item">
                    <div class="record-info">
                        <div class="record-scene">#${index + 1} ${sceneName}</div>
                        <div class="record-time">${Utils.formatDate(record.timestamp)} | 用时: ${record.victoryTime}秒</div>
                    </div>
                    <div class="record-score">${record.score}</div>
                </div>
            `;
        });
        
        listEl.innerHTML = html;
    }
}

class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        
        this.init();
    }
    
    init() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            this.keyPressed[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }
    
    isKeyDown(code) {
        return !!this.keys[code];
    }
    
    wasKeyPressed(code) {
        const pressed = !!this.keyPressed[code];
        this.keyPressed[code] = false;
        return pressed;
    }
    
    clearKeyPressed() {
        this.keyPressed = {};
    }
}

const UISystem = {
    elements: {},

    init() {
        this.elements = {
            foodCount: document.getElementById('food-count'),
            stoneCount: document.getElementById('stone-count'),
            honeyCount: document.getElementById('honey-count'),
            currentWave: document.getElementById('current-wave'),
            unitCount: document.getElementById('unit-count'),
            unitMax: document.getElementById('unit-max'),
            hpFill: document.getElementById('hp-fill'),
            hpText: document.getElementById('hp-text'),
            unitButtons: document.getElementById('unit-buttons'),
            upgradeButtons: document.getElementById('upgrade-buttons'),
            queueCount: document.getElementById('queue-count'),
            waveNotification: document.getElementById('wave-notification'),
            waveText: document.getElementById('wave-text'),
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            highestWaveDisplay: document.getElementById('highest-wave-display'),
            continueBtn: document.getElementById('continue-btn'),
            finalWave: document.getElementById('final-wave'),
            newRecord: document.getElementById('new-record'),
            hatchProgress: document.getElementById('hatch-progress'),
            hatchBar: document.getElementById('hatch-bar'),
            hatchText: document.getElementById('hatch-text'),
            speedBtn: document.getElementById('speed-btn')
        };

        this.createUnitButtons();
        this.createUpgradeButtons();
        this.bindEvents();
    },

    createUnitButtons() {
        const container = this.elements.unitButtons;
        container.innerHTML = '';

        Object.keys(CONFIG.UNIT_TYPES).forEach(type => {
            const config = CONFIG.UNIT_TYPES[type];
            const btn = document.createElement('button');
            btn.className = 'unit-btn';
            btn.dataset.type = type;
            
            btn.innerHTML = `
                <span class="unit-icon">${config.icon}</span>
                <span class="unit-name">${config.name}</span>
                <span class="unit-cost">🍃 ${config.cost}</span>
            `;
            
            if (config.unlockWave > 0) {
                btn.innerHTML += `<div class="lock-overlay">第${config.unlockWave}波</div>`;
                btn.classList.add('locked');
            }
            
            btn.addEventListener('click', () => this.onUnitClick(type));
            container.appendChild(btn);
        });
    },

    createUpgradeButtons() {
        const container = this.elements.upgradeButtons;
        container.innerHTML = '';

        Object.keys(CONFIG.UPGRADES).forEach(key => {
            const config = CONFIG.UPGRADES[key];
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.dataset.type = key;
            
            btn.innerHTML = `
                <span class="upgrade-name">${config.icon} ${config.name}</span>
                <span class="upgrade-level">Lv.0/${config.maxLevel}</span>
                <span class="upgrade-cost">🪨 ${config.cost}</span>
            `;
            
            btn.addEventListener('click', () => this.onUpgradeClick(key));
            container.appendChild(btn);
        });
    },

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => Game.startNewGame());
        document.getElementById('continue-btn').addEventListener('click', () => Game.continueGame());
        document.getElementById('resume-btn').addEventListener('click', () => Game.resume());
        document.getElementById('restart-btn').addEventListener('click', () => Game.restart());
        document.getElementById('quit-btn').addEventListener('click', () => Game.quitToMenu());
        document.getElementById('retry-btn').addEventListener('click', () => Game.startNewGame());
        document.getElementById('back-btn').addEventListener('click', () => Game.quitToMenu());
        document.getElementById('pause-btn').addEventListener('click', () => Game.togglePause());
        this.elements.speedBtn.addEventListener('click', () => this.toggleSpeed());
    },

    onUnitClick(type) {
        if (GameState.canHatchUnit(type)) {
            GameState.addToHatchQueue(type);
        }
    },

    onUpgradeClick(key) {
        if (GameState.canUpgrade(key)) {
            GameState.doUpgrade(key);
        }
    },

    toggleSpeed() {
        const speeds = [1, 2, 3];
        const currentIndex = speeds.indexOf(GameState.speedMultiplier);
        const nextIndex = (currentIndex + 1) % speeds.length;
        GameState.speedMultiplier = speeds[nextIndex];
        this.updateSpeedButton();
    },

    updateSpeedButton() {
        if (this.elements.speedBtn) {
            this.elements.speedBtn.textContent = `⏩ ${GameState.speedMultiplier}x`;
        }
    },

    update() {
        this.updateResourceDisplay();
        this.updateStatusDisplay();
        this.updateUnitButtons();
        this.updateUpgradeButtons();
        this.updateHatchProgress();
    },

    updateResourceDisplay() {
        this.elements.foodCount.textContent = Math.floor(GameState.resources.food);
        this.elements.stoneCount.textContent = Math.floor(GameState.resources.stone);
        this.elements.honeyCount.textContent = Math.floor(GameState.resources.honey);
    },

    updateStatusDisplay() {
        this.elements.currentWave.textContent = GameState.currentWave;
        this.elements.unitCount.textContent = GameState.units.length;
        this.elements.unitMax.textContent = GameState.getUnitLimit();
        
        if (GameState.colony) {
            const hpPercent = (GameState.colony.hp / GameState.colony.maxHp) * 100;
            this.elements.hpFill.style.width = `${hpPercent}%`;
            this.elements.hpText.textContent = `${Math.ceil(GameState.colony.hp)}/${GameState.colony.maxHp}`;
        }
        
        this.elements.queueCount.textContent = GameState.hatchQueue.length;
    },

    updateUnitButtons() {
        const buttons = this.elements.unitButtons.querySelectorAll('.unit-btn');
        buttons.forEach(btn => {
            const type = btn.dataset.type;
            const config = CONFIG.UNIT_TYPES[type];
            
            const isUnlocked = GameState.currentWave >= config.unlockWave;
            const canAfford = GameState.canAfford(config.cost, config.costType);
            const hasSpace = GameState.getTotalUnits() < GameState.getUnitLimit();
            
            const lockOverlay = btn.querySelector('.lock-overlay');
            if (lockOverlay) {
                lockOverlay.style.display = isUnlocked ? 'none' : 'flex';
            }
            
            btn.disabled = !isUnlocked || !canAfford || !hasSpace;
        });
    },

    updateUpgradeButtons() {
        const buttons = this.elements.upgradeButtons.querySelectorAll('.upgrade-btn');
        buttons.forEach(btn => {
            const key = btn.dataset.type;
            const config = CONFIG.UPGRADES[key];
            const level = GameState.upgrades[key];
            const cost = config.cost * (level + 1);
            
            const levelSpan = btn.querySelector('.upgrade-level');
            const costSpan = btn.querySelector('.upgrade-cost');
            
            levelSpan.textContent = `Lv.${level}/${config.maxLevel}`;
            
            if (level >= config.maxLevel) {
                costSpan.textContent = '已满级';
                btn.disabled = true;
            } else {
                costSpan.textContent = `🪨 ${cost}`;
                btn.disabled = !GameState.canUpgrade(key);
            }
        });
    },

    updateHatchProgress() {
        if (GameState.hatchQueue.length > 0 && GameState.totalHatchTime > 0) {
            this.elements.hatchProgress.style.display = 'block';
            const progress = (GameState.currentHatchTime / GameState.totalHatchTime) * 100;
            this.elements.hatchBar.style.setProperty('--progress', `${progress}%`);
            this.elements.hatchText.textContent = `孵化中: ${CONFIG.UNIT_TYPES[GameState.hatchQueue[0]].name}`;
        } else {
            this.elements.hatchProgress.style.display = 'none';
        }
    },

    showWaveNotification(wave, description) {
        this.elements.waveText.textContent = `第 ${wave} 波来袭！${description ? ` - ${description}` : ''}`;
        this.elements.waveNotification.style.display = 'block';
        
        setTimeout(() => {
            this.elements.waveNotification.style.display = 'none';
        }, 2000);
    },

    showStartScreen() {
        this.elements.startScreen.style.display = 'flex';
        this.elements.pauseScreen.style.display = 'none';
        this.elements.gameoverScreen.style.display = 'none';
        
        const highestWave = Storage.getHighestWave();
        this.elements.highestWaveDisplay.textContent = highestWave;
        
        if (Storage.hasSavedGame()) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },

    hideStartScreen() {
        this.elements.startScreen.style.display = 'none';
    },

    showPauseScreen() {
        this.elements.pauseScreen.style.display = 'flex';
    },

    hidePauseScreen() {
        this.elements.pauseScreen.style.display = 'none';
    },

    showGameOver(isVictory) {
        this.elements.gameoverScreen.style.display = 'flex';
        this.elements.finalWave.textContent = GameState.currentWave;
        
        const highestWave = Storage.getHighestWave();
        if (GameState.currentWave >= highestWave && GameState.currentWave > 0) {
            this.elements.newRecord.style.display = 'block';
        } else {
            this.elements.newRecord.style.display = 'none';
        }
        
        Storage.clear();
    },

    hideGameOverScreen() {
        this.elements.gameoverScreen.style.display = 'none';
    }
};

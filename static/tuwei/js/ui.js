const UI = {
    elements: {},
    selectedClass: 'assault',

    init() {
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            hud: document.getElementById('hud'),
            healthFill: document.getElementById('healthFill'),
            healthText: document.getElementById('healthText'),
            ammoText: document.getElementById('ammoText'),
            weaponName: document.getElementById('weaponName'),
            weaponIcon: document.getElementById('weaponIcon'),
            waveText: document.getElementById('waveText'),
            enemyCount: document.getElementById('enemyCount'),
            timerText: document.getElementById('timerText'),
            reloadIndicator: document.getElementById('reloadIndicator'),
            reloadFill: document.getElementById('reloadFill'),
            waveAnnounce: document.getElementById('waveAnnounce'),
            waveAnnounceText: document.getElementById('waveAnnounceText'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            gameOverStats: document.getElementById('gameOverStats'),
            startBtn: document.getElementById('startBtn'),
            continueBtn: document.getElementById('continueBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            quitBtn: document.getElementById('quitBtn'),
            retryBtn: document.getElementById('retryBtn'),
            backToMenuBtn: document.getElementById('backToMenuBtn')
        };

        this.initCharacterSelect();
    },

    initCharacterSelect() {
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedClass = card.dataset.class;
            });
        });

        cards[0].classList.add('selected');
    },

    showStartScreen(showContinue = false) {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.hud.classList.add('hidden');
        
        if (showContinue) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },

    showPauseScreen() {
        this.elements.pauseScreen.classList.remove('hidden');
    },

    hidePauseScreen() {
        this.elements.pauseScreen.classList.add('hidden');
    },

    showGameOverScreen(victory, stats) {
        this.elements.hud.classList.add('hidden');
        this.elements.gameOverScreen.classList.remove('hidden');
        
        if (victory) {
            this.elements.gameOverTitle.textContent = '任务成功！';
            this.elements.gameOverTitle.style.color = '#44ff44';
        } else {
            this.elements.gameOverTitle.textContent = '任务失败';
            this.elements.gameOverTitle.style.color = '#ff4444';
        }
        
        this.elements.gameOverStats.innerHTML = `
            存活时间: ${stats.survivalTime}秒<br>
            击杀数: ${stats.kills}<br>
            得分: ${stats.score}<br>
            造成伤害: ${stats.damageDealt}<br>
            完成波次: ${stats.wavesCompleted}/${Config.TOTAL_WAVES}
        `;
    },

    hideAllScreens() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.hud.classList.remove('hidden');
    },

    updateHUD(player, gameState) {
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthFill.style.width = `${healthPercent}%`;
        this.elements.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
        
        if (player.currentWeapon) {
            this.elements.ammoText.textContent = `${player.currentWeapon.ammo}/${player.currentWeapon.magazineSize}`;
            this.elements.weaponName.textContent = player.currentWeapon.name;
            
            if (player.currentWeapon.isReloading) {
                this.elements.reloadIndicator.classList.remove('hidden');
                this.elements.reloadFill.style.width = `${player.currentWeapon.getReloadProgress() * 100}%`;
            } else {
                this.elements.reloadIndicator.classList.add('hidden');
            }
        }
        
        this.elements.waveText.textContent = `波次: ${gameState.currentWave}/${Config.TOTAL_WAVES}`;
        this.elements.enemyCount.textContent = `敌人: ${gameState.enemiesRemaining}`;
        
        const time = Math.max(0, gameState.timeRemaining);
        this.elements.timerText.textContent = Utils.formatTime(time);
    },

    showWaveAnnounce(wave, isBreak = false) {
        this.elements.waveAnnounce.classList.remove('hidden');
        
        if (isBreak) {
            this.elements.waveAnnounceText.textContent = `休整时间 - 补给中...`;
            this.elements.waveAnnounceText.style.color = '#44ff44';
        } else {
            this.elements.waveAnnounceText.textContent = `第 ${wave} 波 来袭！`;
            this.elements.waveAnnounceText.style.color = '#ff4444';
        }
        
        setTimeout(() => {
            this.elements.waveAnnounce.classList.add('hidden');
        }, 2000);
    },

    getSelectedClass() {
        return this.selectedClass;
    }
};

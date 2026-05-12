class UI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.initElements();
        this.setupEventListeners();
    }

    initElements() {
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            hud: document.getElementById('hud'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            waveDisplay: document.getElementById('waveDisplay'),
            highScore: document.getElementById('highScore'),
            healthFill: document.getElementById('healthFill'),
            healthText: document.getElementById('healthText'),
            weaponName: document.getElementById('weaponName'),
            ammoDisplay: document.getElementById('ammoDisplay'),
            finalScore: document.getElementById('finalScore'),
            highScoreDisplay: document.getElementById('highScoreDisplay'),
            comboDisplay: document.getElementById('comboDisplay'),
            damageFlash: document.getElementById('damageFlash'),
            continueBtn: document.getElementById('continueBtn')
        };
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.game.startGame(false);
        });

        document.getElementById('continueBtn').addEventListener('click', () => {
            this.game.startGame(true);
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.game.pauseGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.game.isPlaying) {
                    this.game.pauseGame();
                } else if (this.game.isPaused) {
                    this.game.resumeGame();
                }
            }
            
            if (e.key === 'r' || e.key === 'R') {
                if (this.game.isPlaying && this.game.player) {
                    this.game.player.reload();
                }
            }
            
            if (e.key >= '1' && e.key <= '4') {
                const index = parseInt(e.key) - 1;
                if (this.game.isPlaying && this.game.player) {
                    this.game.player.weaponManager.switchWeapon(index);
                }
            }
        });
    }

    showStartScreen() {
        this.hideAllScreens();
        this.elements.startScreen.classList.remove('hidden');
        this.elements.hud.classList.add('hidden');
        
        const hasSave = Storage.hasSavedGame();
        if (hasSave) {
            this.elements.continueBtn.classList.remove('hidden');
        } else {
            this.elements.continueBtn.classList.add('hidden');
        }
    }

    showPauseScreen() {
        this.elements.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.elements.pauseScreen.classList.add('hidden');
    }

    showGameOverScreen(score, highScore) {
        this.hideAllScreens();
        this.elements.gameOverScreen.classList.remove('hidden');
        this.elements.finalScore.textContent = score;
        this.elements.highScoreDisplay.textContent = highScore;
        this.elements.hud.classList.add('hidden');
    }

    showHUD() {
        this.elements.hud.classList.remove('hidden');
    }

    hideAllScreens() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
    }

    updateHUD() {
        if (!this.game.player) return;

        const player = this.game.player;
        const weapon = player.getCurrentWeapon();

        this.elements.scoreDisplay.textContent = this.game.score;
        this.elements.waveDisplay.textContent = this.game.wave;
        this.elements.highScore.textContent = this.game.highScore;

        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthFill.style.width = `${healthPercent}%`;
        this.elements.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

        if (weapon) {
            this.elements.weaponName.textContent = weapon.name;
            if (weapon.isReloading) {
                const progress = Math.round(weapon.getReloadProgress() * 100);
                this.elements.ammoDisplay.textContent = `RELOAD ${progress}%`;
            } else {
                this.elements.ammoDisplay.textContent = `${weapon.ammo}/${weapon.magazineSize}`;
            }
        }
    }

    showCombo(kills, bonusScore) {
        this.elements.comboDisplay.textContent = `COMBO x${kills}! +${bonusScore}`;
        this.elements.comboDisplay.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.comboDisplay.classList.add('hidden');
        }, 1000);
    }

    showDamageFlash() {
        this.elements.damageFlash.classList.remove('hidden');
        setTimeout(() => {
            this.elements.damageFlash.classList.add('hidden');
        }, 200);
    }

    update() {
        this.updateHUD();
    }
}

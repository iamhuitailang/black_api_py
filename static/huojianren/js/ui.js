class UIManager {
    constructor(game) {
        this.game = game;
        this.selectedCharacter = 'balanced';
        this.initEventListeners();
    }

    initEventListeners() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.char;
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.game.startGame(this.selectedCharacter);
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.game.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.game.backToMenu();
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.game.gameState === GAME_STATES.PLAYING) {
                this.game.pauseGame();
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen-overlay').forEach(screen => {
            screen.classList.add('hidden');
        });
        if (screenId) {
            document.getElementById(screenId).classList.remove('hidden');
        }
    }

    showHUD(show) {
        const hud = document.getElementById('game-hud');
        const controls = document.getElementById('controls-hint');
        if (show) {
            hud.classList.remove('hidden');
            controls.classList.remove('hidden');
        } else {
            hud.classList.add('hidden');
            controls.classList.add('hidden');
        }
    }

    updateHealthBars(player, enemy) {
        const playerHealth = document.getElementById('player-health');
        const playerHealthText = document.getElementById('player-health-text');
        const playerPercent = (player.health / player.maxHealth) * 100;
        playerHealth.style.width = playerPercent + '%';
        playerHealthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

        const enemyHealth = document.getElementById('enemy-health');
        const enemyHealthText = document.getElementById('enemy-health-text');
        const enemyPercent = (enemy.health / enemy.maxHealth) * 100;
        enemyHealth.style.width = enemyPercent + '%';
        enemyHealthText.textContent = `${Math.ceil(enemy.health)}/${enemy.maxHealth}`;
    }

    updateSkillBar(player) {
        const skillFill = document.getElementById('player-skill');
        const percent = player.getSpecialCooldownPercent() * 100;
        skillFill.style.width = percent + '%';
    }

    updateTimer(time) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        document.getElementById('game-timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateRound(round) {
        document.getElementById('round-info').textContent = `第 ${round} 局`;
    }

    showResult(isWin, stats) {
        const title = document.getElementById('result-title');
        const desc = document.getElementById('result-desc');
        
        if (isWin) {
            title.textContent = '胜利!';
            title.classList.remove('lose');
            desc.textContent = '恭喜你击败了对手!';
        } else {
            title.textContent = '失败...';
            title.classList.add('lose');
            desc.textContent = '你被对手击败了，再接再厉!';
        }

        document.getElementById('result-time').textContent = stats.time;
        document.getElementById('result-hits').textContent = stats.hits;
        document.getElementById('result-dodges').textContent = stats.dodges;
        
        this.showScreen('result-screen');
    }
}

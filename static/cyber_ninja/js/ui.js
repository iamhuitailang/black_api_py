class UIManager {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            audioManager.init();
            this.game.startGame();
        });

        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            this.showMenu('help-menu');
        });

        document.getElementById('help-back-btn').addEventListener('click', () => {
            this.showMenu('start-menu');
        });

        document.getElementById('leaderboard-back-btn').addEventListener('click', () => {
            this.showMenu('start-menu');
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('game-over-restart-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('game-over-quit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.querySelectorAll('.buff-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buffType = e.currentTarget.dataset.buff;
                this.game.selectBuff(buffType);
            });
        });
    }

    showMenu(menuId) {
        document.querySelectorAll('.menu-overlay').forEach(menu => {
            menu.classList.add('hidden');
        });
        document.getElementById(menuId).classList.remove('hidden');
    }

    hideAllMenus() {
        document.querySelectorAll('.menu-overlay').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
    }

    hideHUD() {
        document.getElementById('hud').classList.add('hidden');
    }

    updateHUD(game) {
        const healthPercent = (game.player.health / game.player.maxHealth) * 100;
        document.getElementById('health-fill').style.width = `${healthPercent}%`;
        document.getElementById('health-text').textContent = `${game.player.health}/${game.player.maxHealth}`;

        document.getElementById('score-value').textContent = game.score;
        document.getElementById('level-info').textContent = `第 ${game.currentLevelIndex + 1} 关`;
        document.getElementById('area-name').textContent = game.currentAreaConfig.name;

        const buffContainer = document.getElementById('buff-indicators');
        buffContainer.innerHTML = '';
        
        if (game.player.buffs.attackSpeed.active) {
            const timer = Math.ceil(game.player.buffs.attackSpeed.timer / 1000);
            buffContainer.innerHTML += `<div class="buff-indicator">⚡ 攻速×2 ${timer}s</div>`;
        }
        if (game.player.buffs.moveSpeed.active) {
            const timer = Math.ceil(game.player.buffs.moveSpeed.timer / 1000);
            buffContainer.innerHTML += `<div class="buff-indicator">💨 移速×1.5 ${timer}s</div>`;
        }
        if (game.player.buffs.invincible.active) {
            const timer = Math.ceil(game.player.buffs.invincible.timer / 1000);
            buffContainer.innerHTML += `<div class="buff-indicator">🛡️ 无敌 ${timer}s</div>`;
        }

        if (game.boss && !game.boss.isDead) {
            document.getElementById('boss-health-container').classList.remove('hidden');
            const bossHealthPercent = (game.boss.health / game.boss.maxHealth) * 100;
            document.getElementById('boss-health-fill').style.width = `${bossHealthPercent}%`;
        } else {
            document.getElementById('boss-health-container').classList.add('hidden');
        }
    }

    showGameOver(isVictory, score, level) {
        document.getElementById('game-over-title').textContent = isVictory ? '🎉 游戏通关!' : '💀 游戏结束';
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-level').textContent = level;
        this.showMenu('game-over-menu');
    }

    showPauseMenu() {
        this.showMenu('pause-menu');
    }

    showBuffSelection() {
        document.getElementById('buff-selection').classList.remove('hidden');
    }

    hideBuffSelection() {
        document.getElementById('buff-selection').classList.add('hidden');
    }

    showLevelTransition(title, subtitle) {
        const transition = document.getElementById('level-transition');
        document.getElementById('transition-title').textContent = title;
        document.getElementById('transition-subtitle').textContent = subtitle;
        transition.classList.remove('hidden');
        
        setTimeout(() => {
            transition.classList.add('hidden');
        }, 2000);
    }

    async showLeaderboard() {
        try {
            const data = await api.getLeaderboard();
            const listElement = document.getElementById('leaderboard-list');
            
            if (data && data.items && data.items.length > 0) {
                let html = '';
                data.items.forEach((item, index) => {
                    const topClass = index < 3 ? `top-${index + 1}` : '';
                    html += `
                        <div class="leaderboard-item ${topClass}">
                            <span class="rank">${item.rank}</span>
                            <div class="player-info">
                                <div class="name">${item.player_name}</div>
                                <div class="level">关卡: ${item.level}</div>
                            </div>
                            <span class="score-info">${item.score}</span>
                        </div>
                    `;
                });
                listElement.innerHTML = html;
            } else {
                listElement.innerHTML = '<div class="loading">暂无记录</div>';
            }
        } catch (error) {
            document.getElementById('leaderboard-list').innerHTML = '<div class="loading">加载失败</div>';
        }
        
        this.showMenu('leaderboard-menu');
    }

    getPlayerName() {
        const input = document.getElementById('player-name');
        return input.value.trim() || '匿名忍者';
    }
}

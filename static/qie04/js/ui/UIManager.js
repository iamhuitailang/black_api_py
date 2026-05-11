export class UIManager {
    constructor(game) {
        this.game = game;
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.screens = {
            start: document.getElementById('start-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen'),
            levelcomplete: document.getElementById('levelcomplete-screen')
        };
        
        this.buttons = {
            start: document.getElementById('start-btn'),
            continue: document.getElementById('continue-btn'),
            resume: document.getElementById('resume-btn'),
            restart: document.getElementById('restart-btn'),
            quit: document.getElementById('quit-btn'),
            retry: document.getElementById('retry-btn'),
            menu: document.getElementById('menu-btn'),
            nextLevel: document.getElementById('next-level-btn'),
            pause: document.getElementById('pause-btn'),
            itemMagnet: document.getElementById('item-magnet'),
            itemClaw: document.getElementById('item-claw'),
            itemShield: document.getElementById('item-shield'),
            itemRocket: document.getElementById('item-rocket')
        };
        
        this.hud = {
            container: document.getElementById('game-hud'),
            level: document.getElementById('hud-level'),
            score: document.getElementById('hud-score'),
            highscore: document.getElementById('hud-highscore'),
            time: document.getElementById('hud-time'),
            pushes: document.getElementById('hud-pushes'),
            lives: document.getElementById('hud-lives')
        };
        
        this.finalScores = {
            score: document.getElementById('final-score'),
            level: document.getElementById('final-level'),
            highscore: document.getElementById('final-highscore')
        };
        
        this.levelScores = {
            score: document.getElementById('level-score'),
            pushes: document.getElementById('level-pushes'),
            time: document.getElementById('level-time')
        };
        
        this.gameoverTitle = document.getElementById('gameover-title');
    }

    bindEvents() {
        this.buttons.start.addEventListener('click', () => this.game.startGame());
        this.buttons.continue.addEventListener('click', () => this.game.continueGame());
        this.buttons.resume.addEventListener('click', () => this.game.resumeGame());
        this.buttons.restart.addEventListener('click', () => this.game.restartLevel());
        this.buttons.quit.addEventListener('click', () => this.game.quitToMenu());
        this.buttons.retry.addEventListener('click', () => this.game.restartGame());
        this.buttons.menu.addEventListener('click', () => this.game.quitToMenu());
        this.buttons.nextLevel.addEventListener('click', () => this.game.nextLevel());
        this.buttons.pause.addEventListener('click', () => this.game.togglePause());
        
        this.buttons.itemMagnet.addEventListener('click', () => this.game.useItem('magnet'));
        this.buttons.itemClaw.addEventListener('click', () => this.game.useItem('claw'));
        this.buttons.itemShield.addEventListener('click', () => this.game.useItem('shield'));
        this.buttons.itemRocket.addEventListener('click', () => this.game.useItem('rocket'));
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (screenName && this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
    }

    showHUD() {
        this.hud.container.classList.remove('hidden');
        this.hud.container.classList.add('active');
    }

    hideHUD() {
        this.hud.container.classList.add('hidden');
        this.hud.container.classList.remove('active');
    }

    updateHUD(game) {
        this.hud.level.textContent = game.currentLevel;
        this.hud.score.textContent = game.score;
        this.hud.highscore.textContent = game.highScore;
        this.hud.time.textContent = Math.floor(game.gameTime / 1000);
        this.hud.pushes.textContent = game.pushes;
        
        let livesHtml = '';
        for (let i = 0; i < game.penguin.lives; i++) {
            livesHtml += '❤️';
        }
        this.hud.lives.textContent = livesHtml || '💔';
    }

    updateItemSlots(penguin) {
        const items = ['magnet', 'claw', 'shield', 'rocket'];
        items.forEach(item => {
            const btn = this.buttons[`item${item.charAt(0).toUpperCase() + item.slice(1)}`];
            if (btn) {
                if (penguin.items[item] > 0) {
                    btn.classList.add('active');
                    btn.title = `${this.getItemName(item)} x${penguin.items[item]}`;
                } else {
                    btn.classList.remove('active');
                    btn.title = this.getItemName(item);
                }
            }
        });
    }

    getItemName(type) {
        const names = {
            magnet: '磁铁鱼 (按1使用)',
            claw: '冰爪 (按2使用)',
            shield: '护盾 (按3使用)',
            rocket: '火箭 (按4使用)'
        };
        return names[type] || type;
    }

    showGameOver(won, game) {
        this.gameoverTitle.textContent = won ? '🎉 恭喜通关!' : '💔 游戏结束';
        this.gameoverTitle.className = won ? 'win' : 'lose';
        
        this.finalScores.score.textContent = game.score;
        this.finalScores.level.textContent = game.currentLevel;
        this.finalScores.highscore.textContent = game.highScore;
        
        this.showScreen('gameover');
        this.hideHUD();
    }

    showLevelComplete(game) {
        this.levelScores.score.textContent = game.score;
        this.levelScores.pushes.textContent = game.pushes;
        this.levelScores.time.textContent = Math.floor(game.gameTime / 1000);
        
        this.showScreen('levelcomplete');
    }

    showStartScreen(hasSaveData) {
        if (hasSaveData) {
            this.buttons.continue.classList.remove('hidden');
        } else {
            this.buttons.continue.classList.add('hidden');
        }
        
        this.showScreen('start');
        this.hideHUD();
    }

    showPauseMenu() {
        this.showScreen('pause');
    }

    hidePauseMenu() {
        this.hideAllScreens();
    }

    createParticles(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 5 + 2,
                color: color,
                life: 1
            });
        }
        return particles;
    }
}

import { GAME_STATE } from './constants.js';
import { LEVELS, getTotalLevels } from './levels.js';

export class UIManager {
    constructor() {
        this.menus = {
            start: document.getElementById('startMenu'),
            pause: document.getElementById('pauseMenu'),
            levelSelect: document.getElementById('levelSelectMenu'),
            win: document.getElementById('winMenu'),
            complete: document.getElementById('completeMenu'),
        };
        
        this.hud = {
            level: document.getElementById('levelDisplay'),
            stars: document.getElementById('starsDisplay'),
            time: document.getElementById('timeDisplay'),
        };

        this.buttons = {
            start: document.getElementById('startBtn'),
            selectLevel: document.getElementById('selectLevelBtn'),
            resume: document.getElementById('resumeBtn'),
            restart: document.getElementById('restartBtn'),
            exit: document.getElementById('exitBtn'),
            back: document.getElementById('backBtn'),
            nextLevel: document.getElementById('nextLevelBtn'),
            replay: document.getElementById('replayBtn'),
            playAgain: document.getElementById('playAgainBtn'),
            pause: document.getElementById('pauseBtn'),
        };

        this.levelGrid = document.getElementById('levelGrid');
    }

    showMenu(menuName) {
        Object.values(this.menus).forEach(menu => {
            menu.classList.add('hidden');
        });
        if (menuName && this.menus[menuName]) {
            this.menus[menuName].classList.remove('hidden');
        }
    }

    updateHUD(level, starsCollected, totalStars, time) {
        this.hud.level.textContent = level;
        this.hud.stars.textContent = `${starsCollected}/${totalStars}`;
        this.hud.time.textContent = this.formatTime(time);
    }

    updateWinScreen(stars, time) {
        document.getElementById('winStars').textContent = stars;
        document.getElementById('winTime').textContent = this.formatTime(time);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    populateLevelSelect(progress, unlockedLevels) {
        this.levelGrid.innerHTML = '';
        
        LEVELS.forEach((level, index) => {
            const levelBtn = document.createElement('button');
            levelBtn.className = `level-btn ${index >= unlockedLevels ? 'locked' : ''}`;
            levelBtn.innerHTML = `
                <span>${level.id}</span>
                <span class="stars">${this.getStarsDisplay(progress[level.id])}</span>
            `;
            
            if (index < unlockedLevels) {
                levelBtn.addEventListener('click', () => {
                    this.onLevelSelect && this.onLevelSelect(level.id);
                });
            }
            
            this.levelGrid.appendChild(levelBtn);
        });
    }

    getStarsDisplay(progress) {
        if (!progress) return '☆☆☆☆☆';
        const stars = progress.stars || 0;
        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
    }

    bindButtonEvents(callbacks) {
        this.buttons.start.addEventListener('click', callbacks.onStart);
        this.buttons.selectLevel.addEventListener('click', callbacks.onSelectLevel);
        this.buttons.resume.addEventListener('click', callbacks.onResume);
        this.buttons.restart.addEventListener('click', callbacks.onRestart);
        this.buttons.exit.addEventListener('click', callbacks.onExit);
        this.buttons.back.addEventListener('click', callbacks.onBack);
        this.buttons.nextLevel.addEventListener('click', callbacks.onNextLevel);
        this.buttons.replay.addEventListener('click', callbacks.onReplay);
        this.buttons.playAgain.addEventListener('click', callbacks.onPlayAgain);
        this.buttons.pause.addEventListener('click', callbacks.onPause);
        
        this.onLevelSelect = callbacks.onLevelSelect;
    }
}

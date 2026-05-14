const UI = {
    elements: {},

    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            gameHud: document.getElementById('game-hud'),
            healthDisplay: document.getElementById('health-display'),
            killsDisplay: document.getElementById('kills-display'),
            timeDisplay: document.getElementById('time-display'),
            gameoverTitle: document.getElementById('gameover-title'),
            gameoverMessage: document.getElementById('gameover-message'),
            startBtn: document.getElementById('start-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            homeBtn: document.getElementById('home-btn'),
            pauseBtn: document.getElementById('pause-btn')
        };
        
        this.bindEvents();
    },

    bindEvents() {
        const { elements } = this;
        
        elements.startBtn.addEventListener('click', () => {
            this.onStartClick();
        });
        
        elements.resumeBtn.addEventListener('click', () => {
            this.onResumeClick();
        });
        
        elements.restartBtn.addEventListener('click', () => {
            this.onRestartClick();
        });
        
        elements.quitBtn.addEventListener('click', () => {
            this.onQuitClick();
        });
        
        elements.retryBtn.addEventListener('click', () => {
            this.onRestartClick();
        });
        
        elements.homeBtn.addEventListener('click', () => {
            this.onQuitClick();
        });
        
        elements.pauseBtn.addEventListener('click', () => {
            this.onPauseClick();
        });
    },

    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    },

    onStartClick() {
        if (this.callbacks && this.callbacks.onStart) {
            this.callbacks.onStart();
        }
    },

    onResumeClick() {
        if (this.callbacks && this.callbacks.onResume) {
            this.callbacks.onResume();
        }
    },

    onRestartClick() {
        if (this.callbacks && this.callbacks.onRestart) {
            this.callbacks.onRestart();
        }
    },

    onQuitClick() {
        if (this.callbacks && this.callbacks.onQuit) {
            this.callbacks.onQuit();
        }
    },

    onPauseClick() {
        if (this.callbacks && this.callbacks.onPause) {
            this.callbacks.onPause();
        }
    },

    showScreen(screenName) {
        const { elements } = this;
        
        elements.startScreen.classList.add('hidden');
        elements.pauseScreen.classList.add('hidden');
        elements.gameoverScreen.classList.add('hidden');
        
        switch (screenName) {
            case 'start':
                elements.startScreen.classList.remove('hidden');
                elements.gameHud.classList.add('hidden');
                break;
            case 'pause':
                elements.pauseScreen.classList.remove('hidden');
                break;
            case 'gameover':
                elements.gameoverScreen.classList.remove('hidden');
                elements.gameHud.classList.add('hidden');
                break;
            case 'playing':
                elements.gameHud.classList.remove('hidden');
                break;
        }
    },

    updateHealth(health) {
        this.elements.healthDisplay.textContent = health;
    },

    updateKills(kills, target = 20) {
        this.elements.killsDisplay.textContent = `${kills}/${target}`;
    },

    updateTime(time) {
        this.elements.timeDisplay.textContent = Utils.formatTime(time);
    },

    showGameOver(isWin, kills, time) {
        if (isWin) {
            this.elements.gameoverTitle.textContent = '🎉 胜利！';
            this.elements.gameoverTitle.style.color = '#FFD700';
            this.elements.gameoverMessage.textContent = 
                `恭喜你成功击败了海盗！击杀: ${kills} 剩余时间: ${Math.ceil(time)}秒`;
        } else {
            this.elements.gameoverTitle.textContent = '💀 游戏结束';
            this.elements.gameoverTitle.style.color = '#FF4444';
            this.elements.gameoverMessage.textContent = 
                `船长被海盗击败了... 击杀: ${kills}`;
        }
        this.showScreen('gameover');
    },

    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        effect.innerHTML = '💥';
        effect.style.fontSize = '30px';
        document.getElementById('game-container').appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 300);
    }
};
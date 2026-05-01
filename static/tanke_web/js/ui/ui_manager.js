const UIManager = {
    elements: {},
    isLoggedIn: false,

    init() {
        this.cacheElements();
        this.bindEvents();
        this.initGameManagerCallbacks();
        this.checkAuth();
    },

    cacheElements() {
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            gameScreen: document.getElementById('game-screen'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOverMenu: document.getElementById('game-over-menu'),
            levelUpNotification: document.getElementById('level-up-notification'),
            waveNotification: document.getElementById('wave-notification'),
            messageToast: document.getElementById('message-toast'),
            
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            loginBtn: document.getElementById('login-btn'),
            registerBtn: document.getElementById('register-btn'),
            guestBtn: document.getElementById('guest-btn'),
            formMessage: document.getElementById('form-message'),
            menuForm: document.getElementById('menu-form'),
            
            pauseBtn: document.getElementById('pause-btn'),
            quitBtn: document.getElementById('quit-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            backMenuBtn: document.getElementById('back-menu-btn'),
            
            retryBtn: document.getElementById('retry-btn'),
            goMenuBtn: document.getElementById('go-menu-btn'),
            gameOverTitle: document.getElementById('game-over-title'),
            finalWave: document.getElementById('final-wave'),
            finalScore: document.getElementById('final-score'),
            finalKills: document.getElementById('final-kills'),
            
            toastText: document.getElementById('toast-text'),
            newLevel: document.getElementById('new-level'),
            levelUpDesc: document.getElementById('level-up-desc'),
            waveText: document.getElementById('wave-text')
        };
    },

    bindEvents() {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        }
        if (this.elements.registerBtn) {
            this.elements.registerBtn.addEventListener('click', () => this.handleRegister());
        }
        if (this.elements.guestBtn) {
            this.elements.guestBtn.addEventListener('click', () => this.handleGuest());
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => GameManager.pause());
        }
        if (this.elements.quitBtn) {
            this.elements.quitBtn.addEventListener('click', () => this.quitGame());
        }
        
        if (this.elements.resumeBtn) {
            this.elements.resumeBtn.addEventListener('click', () => GameManager.resume());
        }
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        }
        if (this.elements.backMenuBtn) {
            this.elements.backMenuBtn.addEventListener('click', () => this.backToMenu());
        }
        
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.restartGame());
        }
        if (this.elements.goMenuBtn) {
            this.elements.goMenuBtn.addEventListener('click', () => this.backToMenu());
        }
        
        if (this.elements.username) {
            this.elements.username.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        if (this.elements.password) {
            this.elements.password.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    },

    initGameManagerCallbacks() {
        GameManager.onScoreUpdate = (score) => {
            Utils.updateElement('hud-score', score);
        };
        GameManager.onWaveUpdate = (wave) => {
            Utils.updateElement('hud-wave', wave);
        };
        GameManager.onKillsUpdate = (kills) => {
            Utils.updateElement('hud-kills', kills);
        };
        
        GameManager.onPause = () => {
            this.showPauseMenu();
        };
        GameManager.onResume = () => {
            this.hidePauseMenu();
        };
        
        GameManager.onGameOver = (data) => {
            this.showGameOver(data);
        };
    },

    async checkAuth() {
        if (Auth.isLoggedIn()) {
            try {
                const response = await Auth.refreshUserInfo();
                if (response && response.code === 0) {
                    this.isLoggedIn = true;
                    this.updateMenuForLoggedInUser(response.data.user);
                } else {
                    await Auth.logout();
                }
            } catch (e) {
                await Auth.logout();
            }
        }
    },

    updateMenuForLoggedInUser(user) {
        if (this.elements.menuForm) {
            this.elements.menuForm.innerHTML = `
                <div class="logged-in-info">
                    <p class="welcome-text">欢迎, <span class="username-display">${user.username}</span></p>
                    <button class="btn btn-secondary" id="logout-btn">退出登录</button>
                </div>
            `;
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }
        }
    },

    async handleLogin() {
        const username = this.elements.username?.value?.trim();
        const password = this.elements.password?.value;
        
        if (!username || !password) {
            this.showFormMessage('请输入用户名和密码', 'error');
            return;
        }
        
        try {
            const response = await Auth.login(username, password);
            
            if (response.code === 0) {
                this.isLoggedIn = true;
                this.showFormMessage('登录成功!', 'success');
                this.updateMenuForLoggedInUser(response.data.user);
                this.showToast('登录成功，可以保存游戏进度!');
            } else {
                this.showFormMessage(response.msg || '登录失败', 'error');
            }
        } catch (e) {
            this.showFormMessage('网络错误，请稍后重试', 'error');
        }
    },

    async handleRegister() {
        const username = this.elements.username?.value?.trim();
        const password = this.elements.password?.value;
        
        if (!username || !password) {
            this.showFormMessage('请输入用户名和密码', 'error');
            return;
        }
        
        if (username.length < 3 || username.length > 20) {
            this.showFormMessage('用户名长度应为3-20个字符', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showFormMessage('密码长度至少6个字符', 'error');
            return;
        }
        
        try {
            const response = await Auth.register(username, password);
            
            if (response.code === 0) {
                this.showFormMessage('注册成功! 请登录', 'success');
            } else {
                this.showFormMessage(response.msg || '注册失败', 'error');
            }
        } catch (e) {
            this.showFormMessage('网络错误，请稍后重试', 'error');
        }
    },

    async handleLogout() {
        await Auth.logout();
        this.isLoggedIn = false;
        location.reload();
    },

    async handleGuest() {
        this.startGame();
    },

    showFormMessage(message, type) {
        if (!this.elements.formMessage) return;
        
        this.elements.formMessage.textContent = message;
        this.elements.formMessage.className = `form-message ${type}`;
        this.elements.formMessage.style.display = 'block';
        
        setTimeout(() => {
            if (this.elements.formMessage) {
                this.elements.formMessage.style.display = 'none';
            }
        }, 3000);
    },

    showToast(message, duration = 2000) {
        if (!this.elements.messageToast || !this.elements.toastText) return;
        
        this.elements.toastText.textContent = message;
        this.elements.messageToast.style.display = 'block';
        this.elements.messageToast.style.animation = 'toastIn 0.3s ease-out';
        
        setTimeout(() => {
            if (this.elements.messageToast) {
                this.elements.messageToast.style.animation = 'toastOut 0.3s ease-in';
                setTimeout(() => {
                    if (this.elements.messageToast) {
                        this.elements.messageToast.style.display = 'none';
                    }
                }, 300);
            }
        }, duration);
    },

    async startGame() {
        const canvas = document.getElementById('game-canvas');
        GameManager.init(canvas);
        
        this.hideAllMenus();
        this.showGameScreen();
        
        await GameManager.startGame();
    },

    showGameScreen() {
        if (this.elements.gameScreen) {
            this.elements.gameScreen.style.display = 'flex';
        }
    },

    hideGameScreen() {
        if (this.elements.gameScreen) {
            this.elements.gameScreen.style.display = 'none';
        }
    },

    showMainMenu() {
        if (this.elements.mainMenu) {
            this.elements.mainMenu.style.display = 'flex';
        }
    },

    hideMainMenu() {
        if (this.elements.mainMenu) {
            this.elements.mainMenu.style.display = 'none';
        }
    },

    showPauseMenu() {
        if (this.elements.pauseMenu) {
            this.elements.pauseMenu.style.display = 'flex';
        }
    },

    hidePauseMenu() {
        if (this.elements.pauseMenu) {
            this.elements.pauseMenu.style.display = 'none';
        }
    },

    showGameOver(data) {
        if (this.elements.gameOverMenu) {
            this.elements.gameOverMenu.style.display = 'flex';
        }
        
        if (this.elements.gameOverTitle) {
            this.elements.gameOverTitle.textContent = data.victory ? '🏆 胜利!' : '💀 游戏结束';
            this.elements.gameOverTitle.className = `game-over-title ${data.victory ? 'victory' : 'defeat'}`;
        }
        
        Utils.updateElement('final-wave', data.wave);
        Utils.updateElement('final-score', data.score);
        Utils.updateElement('final-kills', data.kills);
    },

    hideGameOverMenu() {
        if (this.elements.gameOverMenu) {
            this.elements.gameOverMenu.style.display = 'none';
        }
    },

    hideAllMenus() {
        this.hideMainMenu();
        this.hidePauseMenu();
        this.hideGameOverMenu();
    },

    quitGame() {
        GameManager.quitGame();
        this.hideGameScreen();
        this.showMainMenu();
    },

    async restartGame() {
        this.hideAllMenus();
        this.hideGameScreen();
        
        const canvas = document.getElementById('game-canvas');
        GameManager.init(canvas);
        
        this.showGameScreen();
        await GameManager.startGame();
    },

    backToMenu() {
        GameManager.quitGame();
        this.hideAllMenus();
        this.hideGameScreen();
        this.showMainMenu();
    }
};

window.UIManager = UIManager;

import { CHARACTER_CONFIGS, FLOOR_THEMES } from './config_v2.js';

export class UIManager {
    constructor(container) {
        this.container = container;
        this.selectedCharacter = 'dreamer';
        this.callbacks = {};
        this.createUI();
    }

    createUI() {
        if (!this.container) {
            console.error('UI container not found');
            return;
        }
        const html = `
            <div id="start-screen" class="screen">
                <div class="star-bg"></div>
                <div class="menu-content">
                    <h1 class="game-title">梦境探险</h1>
                    <h2 class="game-subtitle">· 失落之塔 ·</h2>
                    <p class="game-desc">操控探险者深入梦境高塔，破解机关、躲避魔物、收集碎片</p>
                    
                    <div class="character-select">
                        <h3>选择角色</h3>
                        <div class="character-list">
                            ${Object.entries(CHARACTER_CONFIGS).map(([type, config]) => `
                                <div class="character-card" data-type="${type}">
                                    <div class="char-icon">${config.icon}</div>
                                    <div class="char-name">${config.name}</div>
                                    <div class="char-desc">${config.canDoubleJump ? '敏捷型' : '均衡型'}</div>
                                    <div class="char-stats">
                                        <span>❤${config.maxHealth}</span>
                                        <span>⚡${config.speed}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="menu-buttons">
                        <button id="start-btn" class="btn btn-primary">开始游戏</button>
                        <button id="continue-btn" class="btn btn-secondary" style="display:none">继续游戏</button>
                    </div>
                </div>
            </div>
            
            <div id="pause-screen" class="screen">
                <div class="menu-content pause-menu">
                    <h2 class="game-title" style="font-size:36px;">游戏暂停</h2>
                    <div style="margin-top:30px;">
                        <button id="resume-btn" class="btn btn-primary">继续游戏</button>
                        <button id="restart-btn" class="btn btn-secondary">重新开始</button>
                        <button id="quit-btn" class="btn btn-danger">退出游戏</button>
                    </div>
                </div>
            </div>
            
            <div id="gameover-screen" class="screen">
                <div class="menu-content">
                    <h2 class="gameover-title">探险失败</h2>
                    <p id="gameover-desc" class="game-desc">你在梦境中迷失了...</p>
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">到达层数</span>
                            <span id="final-floor" class="stat-value">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">收集碎片</span>
                            <span id="final-fragments" class="stat-value">0</span>
                        </div>
                    </div>
                    <button id="retry-btn" class="btn btn-primary">再试一次</button>
                    <button id="menu-btn" class="btn btn-secondary">返回主菜单</button>
                </div>
            </div>
            
            <div id="victory-screen" class="screen">
                <div class="menu-content">
                    <h2 class="victory-title">🎉 探险成功！</h2>
                    <p class="game-desc">你成功抵达了失落之塔的塔顶！</p>
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">最终层数</span>
                            <span id="victory-floor" class="stat-value">5</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">总碎片数</span>
                            <span id="victory-fragments" class="stat-value">0</span>
                        </div>
                    </div>
                    <button id="play-again-btn" class="btn btn-primary">再玩一次</button>
                    <button id="victory-menu-btn" class="btn btn-secondary">返回主菜单</button>
                </div>
            </div>
            
            <div id="level-transition" class="screen">
                <div class="transition-content">
                    <h2 id="transition-title">第 1 层</h2>
                    <p id="transition-desc">梦境入口</p>
                </div>
            </div>
            
            <div id="game-hud" class="hidden">
                <div class="hud-top">
                    <div class="hud-left">
                        <div class="health-bar">
                            <div class="health-label">生命</div>
                            <div class="health-track">
                                <div id="health-fill" class="health-fill" style="width:100%"></div>
                            </div>
                            <div id="health-text" class="health-text">100/100</div>
                        </div>
                        <div class="shield-bar">
                            <div class="shield-label">护盾</div>
                            <div class="shield-track">
                                <div id="shield-fill" class="shield-fill" style="width:100%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="hud-center">
                        <div class="level-info">
                            <span class="level-label">第 <span id="floor-num">1</span> 层</span>
                        </div>
                    </div>
                    <div class="hud-right">
                        <div class="fragment-info">
                            <span class="fragment-icon">💎</span>
                            <span id="fragment-count">0</span>
                            <span>/</span>
                            <span id="fragment-total">3</span>
                        </div>
                        <button id="pause-btn" class="btn-icon">⏸</button>
                    </div>
                </div>
                <div class="hud-bottom">
                    <div class="controls-hint">
                        <span>← → 移动</span>
                        <span>↑ 跳跃</span>
                        <span>↓ 下蹲</span>
                        <span>空格 护盾</span>
                        <span>ESC 暂停</span>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            levelTransition: document.getElementById('level-transition'),
            gameHud: document.getElementById('game-hud'),
            
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            shieldFill: document.getElementById('shield-fill'),
            floorNum: document.getElementById('floor-num'),
            fragmentCount: document.getElementById('fragment-count'),
            fragmentTotal: document.getElementById('fragment-total'),
            
            transitionTitle: document.getElementById('transition-title'),
            transitionDesc: document.getElementById('transition-desc'),
            
            gameoverDesc: document.getElementById('gameover-desc'),
            finalFloor: document.getElementById('final-floor'),
            finalFragments: document.getElementById('final-fragments'),
            
            victoryFloor: document.getElementById('victory-floor'),
            victoryFragments: document.getElementById('victory-fragments'),
            
            startBtn: document.getElementById('start-btn'),
            continueBtn: document.getElementById('continue-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            menuBtn: document.getElementById('menu-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            victoryMenuBtn: document.getElementById('victory-menu-btn'),
        };
        
        console.log('Elements created, startScreen:', this.elements.startScreen);
        
        this.initCharacterSelect();
        this.bindEvents();
        
        this.hideAllScreens();
        if (this.elements.startScreen) {
            this.elements.startScreen.classList.remove('hidden');
        }
    }

    initCharacterSelect() {
        const cards = document.querySelectorAll('.character-card');
        if (cards.length === 0) return;
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.type;
            });
        });
        cards[0].classList.add('selected');
    }

    bindEvents() {
        const eventMap = {
            start: this.elements.startBtn,
            continue: this.elements.continueBtn,
            pause: this.elements.pauseBtn,
            resume: this.elements.resumeBtn,
            restart: this.elements.restartBtn,
            quit: this.elements.quitBtn,
            retry: this.elements.retryBtn,
            menu: this.elements.menuBtn,
            playAgain: this.elements.playAgainBtn,
            victoryMenu: this.elements.victoryMenuBtn,
        };
        
        Object.entries(eventMap).forEach(([event, btn]) => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.callbacks[event]) {
                        this.callbacks[event]();
                    }
                });
            }
        });
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    getSelectedCharacter() {
        return this.selectedCharacter;
    }

    showScreen(screenName) {
        this.hideAllScreens();
        if (this.elements[screenName]) {
            this.elements[screenName].classList.remove('hidden');
        }
    }

    hideAllScreens() {
        const screens = ['startScreen', 'pauseScreen', 'gameoverScreen', 'victoryScreen', 'levelTransition'];
        screens.forEach(name => {
            if (this.elements[name]) {
                this.elements[name].classList.add('hidden');
            }
        });
    }

    showHUD() {
        this.elements.gameHud.classList.remove('hidden');
    }

    hideHUD() {
        this.elements.gameHud.classList.add('hidden');
    }

    showContinueButton(show) {
        this.elements.continueBtn.style.display = show ? 'inline-block' : 'none';
    }

    updateHealth(current, max) {
        const percent = Math.max(0, (current / max) * 100);
        this.elements.healthFill.style.width = `${percent}%`;
        this.elements.healthText.textContent = `${Math.max(0, Math.ceil(current))}/${max}`;
    }

    updateShield(percent) {
        this.elements.shieldFill.style.width = `${Math.max(0, percent * 100)}%`;
    }

    updateFloor(floor) {
        this.elements.floorNum.textContent = floor;
    }

    updateFragments(current, total) {
        this.elements.fragmentCount.textContent = current;
        this.elements.fragmentTotal.textContent = total;
    }

    showLevelTransition(floor) {
        const theme = FLOOR_THEMES[Math.min(floor - 1, FLOOR_THEMES.length - 1)];
        this.elements.transitionTitle.textContent = `第 ${floor} 层`;
        this.elements.transitionDesc.textContent = theme.name;
        this.elements.levelTransition.classList.remove('hidden');
    }

    hideLevelTransition() {
        this.elements.levelTransition.classList.add('hidden');
    }

    showGameOver(floor, totalFragments, isVictory = false) {
        if (isVictory) {
            this.elements.victoryFloor.textContent = floor;
            this.elements.victoryFragments.textContent = totalFragments;
            this.showScreen('victoryScreen');
        } else {
            this.elements.gameoverDesc.textContent = '你在梦境中迷失了...';
            this.elements.finalFloor.textContent = floor;
            this.elements.finalFragments.textContent = totalFragments;
            this.showScreen('gameoverScreen');
        }
        this.hideHUD();
    }
}

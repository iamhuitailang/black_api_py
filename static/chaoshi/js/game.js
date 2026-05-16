class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        
        this.player = null;
        this.clerks = [];
        this.productManager = new ProductManager();
        this.skillSystem = new SkillSystem();
        
        this.keys = {};
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = 0;
        
        this.timeRemaining = CONSTANTS.GAME_DURATION;
        this.isOvertime = false;
        
        this.selectedCharacter = 'speed';
        this.pickupEffects = [];
        
        this.autoSaveTimer = 0;
        this.autoSaveInterval = 2000;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            const wasPressed = this.keys[e.key];
            this.keys[e.key] = true;
            
            if (!wasPressed && this.player && this.isRunning && !this.isPaused) {
                const result = this.skillSystem.handleKey(e.key, this.player);
                if (result) {
                    this.showSkillHint(result.message);
                }
            }
            
            if (e.key === 'Escape' && this.isRunning && !this.isGameOver) {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.character;
            });
        });
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('back-menu-btn').addEventListener('click', () => this.quitGame());
    }
    
    initPlayer(characterType) {
        this.player = new Player(characterType);
    }
    
    initClerks() {
        this.clerks = [
            new Clerk(450, 450),
            new Clerk(750, 750),
            new Clerk(1000, 1000)
        ];
    }
    
    startGame(forceNewGame = false) {
        console.log('>>> 开始游戏! forceNewGame=', forceNewGame);
        
        localStorage.removeItem('chaoshi_game_state');
        
        this.initPlayer(this.selectedCharacter);
        this.initClerks();
        this.productManager.reset();
        this.timeRemaining = 180;
        this.isOvertime = false;
        
        console.log('初始时间设置为:', this.timeRemaining, '秒');
        
        this.skillSystem.reset();
        
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('pause-btn').classList.remove('hidden');
        
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = Date.now();
        
        this.frameCount = 0;
        
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        const deltaTime = Math.max(0, Math.min(33, currentTime - this.lastTime));
        this.lastTime = currentTime;
        
        if (!this.isPaused && !this.isGameOver) {
            this.update(deltaTime);
        }
        
        this.renderer.render(this);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.frameCount++;
        
        const timeDecrease = deltaTime / 1000;
        const oldTime = this.timeRemaining;
        this.timeRemaining -= timeDecrease;
        
        if (this.frameCount < 10) {
            console.log('帧 #' + this.frameCount, 
                'delta:', deltaTime.toFixed(2), 
                '减少:', timeDecrease.toFixed(4), 
                '时间:', oldTime.toFixed(2), '→', this.timeRemaining.toFixed(2));
        }
        
        if (this.timeRemaining < 175 && this.frameCount < 60) {
            console.log('⚠️ 时间异常! 强制重置为180秒!');
            this.timeRemaining = 180;
        }
        
        this.updateTimerDisplay();
        
        if (this.timeRemaining <= 0) {
            console.log('时间正常结束!');
            if (this.isOvertime) {
                this.endGame('draw');
            } else {
                this.checkOvertime();
            }
            return;
        }
        
        this.player.update(this.keys, deltaTime);
        
        this.clerks.forEach((clerk) => {
            clerk.update(this.player, deltaTime);
            
            if (clerk.canCatch()) {
                if (this.player.takeDamage()) {
                    clerk.stun();
                    this.showDamageEffect();
                    
                    if (!this.player.isAlive()) {
                        this.endGame('lose');
                    }
                } else {
                    clerk.stun();
                }
            }
        });
        
        this.productManager.update(deltaTime);
        
        const pickedProducts = this.productManager.checkPickup(this.player);
        pickedProducts.forEach(product => {
            const earned = this.player.pickupProduct(product);
            this.addPickupEffect(product.x, product.y, earned);
        });
        
        this.skillSystem.update(deltaTime);
        
        this.updatePickupEffects(deltaTime);
        
        this.updateHUD();
    }
    
    checkOvertime() {
        if (this.player.money > 0) {
            this.endGame('win');
        } else {
            this.endGame('draw');
        }
    }
    
    endGame(result) {
        this.isGameOver = true;
        this.isRunning = false;
        
        Storage.clearState();
        
        const resultTitle = document.getElementById('result-title');
        const resultContent = document.getElementById('result-content');
        
        let title, content;
        
        switch (result) {
            case 'win':
                title = '🎉 胜利！';
                content = this.createResultContent('win');
                break;
            case 'lose':
                title = '😢 失败！';
                content = this.createResultContent('lose');
                break;
            case 'draw':
                title = '⚖️ 平局！';
                content = this.createResultContent('draw');
                break;
        }
        
        resultTitle.textContent = title;
        resultContent.innerHTML = content;
        
        document.getElementById('game-over-menu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
    }
    
    createResultContent(result) {
        const finalMoney = this.player ? this.player.money : 0;
        const itemCount = this.player ? this.player.itemCount : 0;
        
        return `
            <div class="result-money">¥${finalMoney}</div>
            <div style="margin: 15px 0;">
                <div class="result-item">
                    <span>收集商品</span>
                    <span>${itemCount} 件</span>
                </div>
                <div class="result-item">
                    <span>剩余生命</span>
                    <span>${this.player ? this.player.life : 0} ❤️</span>
                </div>
            </div>
            <p style="color: #666; margin-top: 10px;">
                ${result === 'win' ? '恭喜你成为抢购达人！' :
                  result === 'lose' ? '被店员抓住太多次了...' :
                  '势均力敌，下次再战！'}
            </p>
        `;
    }
    
    updateHUD() {
        document.getElementById('money-display').textContent = `¥${this.player.money}`;
        document.getElementById('life-display').textContent = this.player.life;
        document.getElementById('item-count').textContent = this.player.itemCount;
    }
    
    updateTimerDisplay() {
        const minutes = Math.max(0, Math.floor(this.timeRemaining / 60));
        const seconds = Math.max(0, Math.floor(this.timeRemaining % 60));
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-display').textContent = display;
        
        if (this.timeRemaining < 30) {
            document.getElementById('timer-display').style.color = '#FF0000';
        } else {
            document.getElementById('timer-display').style.color = 'white';
        }
    }
    
    showSkillHint(message) {
        const hint = document.getElementById('skill-hint');
        hint.textContent = message;
        hint.classList.remove('hidden');
        
        setTimeout(() => {
            hint.classList.add('hidden');
        }, 2000);
    }
    
    showDamageEffect() {
        this.canvas.style.boxShadow = '0 0 50px rgba(255, 0, 0, 0.5) inset';
        setTimeout(() => {
            this.canvas.style.boxShadow = 'none';
        }, 200);
    }
    
    addPickupEffect(x, y, amount) {
        this.pickupEffects.push({
            x, y, amount,
            startTime: Date.now(),
            duration: 800
        });
    }
    
    updatePickupEffects(deltaTime) {
        const now = Date.now();
        this.pickupEffects = this.pickupEffects.filter(effect => {
            const elapsed = now - effect.startTime;
            if (elapsed < effect.duration) {
                const progress = elapsed / effect.duration;
                this.renderer.drawPickupEffect(
                    effect.x,
                    effect.y - progress * 50,
                    effect.amount
                );
                return true;
            }
            return false;
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pause-menu').classList.remove('hidden');
        } else {
            document.getElementById('pause-menu').classList.add('hidden');
            this.lastTime = performance.now();
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        this.lastTime = performance.now();
    }
    
    restartGame() {
        Storage.clearState();
        
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
    }
    
    quitGame() {
        Storage.clearState();
        
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
    }
    
    saveGame() {
        if (this.isGameOver || !this.player) return;
        
        const state = {
            characterType: this.player.type,
            playerState: this.player.getState(),
            clerksState: this.clerks.map(c => c.getState()),
            productsState: this.productManager.getState(),
            timeRemaining: this.timeRemaining,
            isOvertime: this.isOvertime,
            savedAt: Date.now()
        };
        
        Storage.saveState(state);
    }
    
    loadGameState(state) {
        this.initPlayer(state.characterType);
        this.player.loadState(state.playerState);
        
        this.clerks = state.clerksState.map(cs => {
            const clerk = new Clerk(cs.x, cs.patrolCenter);
            clerk.loadState(cs);
            return clerk;
        });
        
        this.productManager.loadState(state.productsState);
        
        this.timeRemaining = state.timeRemaining;
        this.isOvertime = state.isOvertime;
    }
}
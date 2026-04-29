const GameState = {
    IDLE: 'idle',
    COUNTDOWN: 'countdown',
    READY: 'ready',
    SHOOTING: 'shooting',
    ROUND_END: 'round_end',
    GAME_END: 'game_end',
    PAUSED: 'paused'
};

const Game = {
    state: GameState.IDLE,
    previousState: null,
    
    playerScore: 0,
    computerScore: 0,
    currentRound: 1,
    totalRounds: 0,
    
    countdownValue: 3,
    countdownTimer: null,
    roundTimer: null,
    
    drawSignalTime: null,
    computerReactionTime: 0,
    
    isActionTaken: false,
    lastActionTime: 0,
    
    logs: [],
    
    canvas: null,
    ctx: null,
    
    playerPosition: { x: 100, y: 250 },
    computerPosition: { x: 650, y: 250 },
    crosshairPosition: { x: 0, y: 0 },
    isCrosshairVisible: false,
    targetOffset: { x: 0, y: 0 },
    
    shotAnimation: {
        active: false,
        x: 0,
        y: 0,
        time: 0,
        fromPlayer: true
    },
    
    flashEffect: {
        active: false,
        opacity: 0
    },
    
    autoSaveInterval: null,
    
    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bindEvents();
        this.loadFromStorage();
        this.updateUI();
        this.render();
        this.startRenderLoop();
        this.startAutoSave();
    },
    
    startAutoSave: function() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            this.saveToStorage();
        }, 1000);
    },
    
    bindEvents: function() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('shootBtn').addEventListener('click', () => this.shoot());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        const saveHandler = () => {
            this.saveToStorage();
        };
        
        window.addEventListener('beforeunload', saveHandler);
        window.addEventListener('unload', saveHandler);
        window.addEventListener('pagehide', saveHandler);
        
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveToStorage();
            }
        });
    },
    
    saveToStorage: function() {
        const data = {
            state: this.state,
            previousState: this.previousState,
            playerScore: this.playerScore,
            computerScore: this.computerScore,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            countdownValue: this.countdownValue,
            logs: this.logs.slice(-20)
        };
        localStorage.setItem('quickdraw_game_state', JSON.stringify(data));
    },
    
    loadFromStorage: function() {
        const saved = localStorage.getItem('quickdraw_game_state');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state = data.state || GameState.IDLE;
                this.previousState = data.previousState || null;
                this.playerScore = data.playerScore || 0;
                this.computerScore = data.computerScore || 0;
                this.currentRound = data.currentRound || 1;
                this.totalRounds = data.totalRounds || 0;
                this.countdownValue = data.countdownValue || 3;
                this.logs = data.logs ? [...data.logs] : [];
                
                if (this.state === GameState.COUNTDOWN || 
                    this.state === GameState.READY || 
                    this.state === GameState.SHOOTING ||
                    this.state === GameState.ROUND_END) {
                    this.state = GameState.IDLE;
                    this.previousState = null;
                }
                
                this.updateUI();
                this.updateButtons();
                
                const container = document.getElementById('logContainer');
                container.innerHTML = '';
                this.logs.forEach(log => {
                    const div = document.createElement('div');
                    div.className = 'log-entry';
                    if (log.type) {
                        div.classList.add(log.type);
                    }
                    div.textContent = `[${log.time}] ${log.message}`;
                    container.appendChild(div);
                });
                container.scrollTop = container.scrollHeight;
                
                if (this.logs.length > 0) {
                    const div = document.createElement('div');
                    div.className = 'log-entry';
                    div.textContent = `[${new Date().toLocaleTimeString()}] 游戏状态已恢复，点击开始继续。`;
                    container.appendChild(div);
                    container.scrollTop = container.scrollHeight;
                }
            } catch (e) {
                console.error('加载游戏状态失败:', e);
            }
        }
    },
    
    clearTimers: function() {
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
    },
    
    startGame: function() {
        if (this.state === GameState.PAUSED) {
            this.resumeGame();
            return;
        }
        
        if (this.state !== GameState.IDLE && this.state !== GameState.GAME_END) {
            return;
        }
        
        if (this.state === GameState.GAME_END || 
            (this.state === GameState.IDLE && this.playerScore === 0 && this.computerScore === 0)) {
            this.resetGame();
        }
        
        this.startRound();
    },
    
    resetGame: function() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.currentRound = 1;
        this.totalRounds = 0;
        this.logs = [];
        this.state = GameState.IDLE;
        this.previousState = null;
        this.isActionTaken = false;
        this.isCrosshairVisible = false;
        this.drawSignalTime = null;
        this.shotAnimation.active = false;
        this.flashEffect.active = false;
        
        this.hideCountdown();
        this.hideGameMessage();
        this.updateUI();
        this.updateButtons();
        
        const container = document.getElementById('logContainer');
        container.innerHTML = '';
        
        this.addLog('新游戏开始！');
        this.saveToStorage();
    },
    
    restartGame: function() {
        this.clearTimers();
        this.resetGame();
        this.startRound();
    },
    
    startRound: function() {
        this.state = GameState.COUNTDOWN;
        this.countdownValue = 3;
        this.isActionTaken = false;
        this.drawSignalTime = null;
        this.computerReactionTime = 200 + Math.random() * 300;
        this.targetOffset = {
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 40
        };
        
        this.updateButtons();
        this.hideGameMessage();
        this.showCountdown(this.countdownValue);
        this.addLog(`第 ${this.currentRound} 回合开始，倒计时...`);
        this.saveToStorage();
        
        this.runCountdown();
    },
    
    runCountdown: function() {
        if (this.countdownValue > 0) {
            this.showCountdown(this.countdownValue);
            this.countdownTimer = setTimeout(() => {
                this.countdownValue--;
                this.runCountdown();
            }, 1000);
        } else {
            this.state = GameState.READY;
            this.drawSignalTime = Date.now();
            this.hideCountdown();
            this.showGameMessage('拔枪！', 'foul');
            this.updateButtons();
            this.addLog('拔枪信号！快速射击！');
            this.saveToStorage();
            
            this.roundTimer = setTimeout(() => {
                if (!this.isActionTaken && this.state === GameState.READY) {
                    this.computerShootsFirst();
                }
            }, this.computerReactionTime);
        }
    },
    
    shoot: function() {
        const now = Date.now();
        
        if (now - this.lastActionTime < 100) {
            return;
        }
        this.lastActionTime = now;
        
        if (this.isActionTaken) {
            return;
        }
        
        if (this.state === GameState.COUNTDOWN) {
            this.isActionTaken = true;
            this.clearTimers();
            this.state = GameState.ROUND_END;
            this.hideCountdown();
            this.showGameMessage('抢跑犯规！电脑人获胜！', 'foul');
            this.computerScore++;
            this.totalRounds++;
            this.addLog('抢跑！犯规！电脑人赢得此回合。', 'foul');
            this.updateUI();
            this.updateButtons();
            this.saveToStorage();
            
            this.checkGameEnd();
            return;
        }
        
        if (this.state === GameState.READY) {
            this.isActionTaken = true;
            this.clearTimers();
            this.state = GameState.SHOOTING;
            
            const playerReactionTime = now - this.drawSignalTime;
            const computerWins = playerReactionTime >= this.computerReactionTime;
            
            if (computerWins) {
                this.computerShootsFirst();
            } else {
                this.playerShootsFirst(playerReactionTime);
            }
        }
    },
    
    playerShootsFirst: function(reactionTime) {
        const isHit = this.checkHit(true);
        
        this.playShotAnimation(this.playerPosition.x + 50, this.playerPosition.y, true);
        this.isCrosshairVisible = true;
        
        if (isHit) {
            this.playerScore++;
            this.showGameMessage('命中！你赢了这回合！', 'hit');
            this.addLog(`你拔枪用时 ${reactionTime}ms，命中！得分！`, 'hit');
            this.playFlashEffect('#2ecc71');
        } else {
            this.computerScore++;
            this.showGameMessage('未命中！电脑人反击命中！', 'miss');
            this.addLog(`你拔枪用时 ${reactionTime}ms，但未命中！电脑人反击得分。`, 'miss');
            this.playFlashEffect('#e74c3c');
        }
        
        this.totalRounds++;
        this.state = GameState.ROUND_END;
        this.updateUI();
        this.updateButtons();
        this.saveToStorage();
        
        this.checkGameEnd();
    },
    
    computerShootsFirst: function() {
        this.isActionTaken = true;
        this.clearTimers();
        this.state = GameState.SHOOTING;
        
        const isHit = this.checkHit(false);
        
        this.playShotAnimation(this.computerPosition.x - 50, this.computerPosition.y, false);
        
        if (isHit) {
            this.computerScore++;
            this.showGameMessage('电脑人更快！命中！', 'miss');
            this.addLog(`电脑人拔枪更快（${Math.round(this.computerReactionTime)}ms），命中并得分！`, 'miss');
            this.playFlashEffect('#e74c3c');
        } else {
            this.playerScore++;
            this.showGameMessage('电脑人未命中！你反击命中！', 'hit');
            this.addLog(`电脑人更快但未命中！你反击得分！`, 'hit');
            this.playFlashEffect('#2ecc71');
        }
        
        this.totalRounds++;
        this.state = GameState.ROUND_END;
        this.updateUI();
        this.updateButtons();
        this.saveToStorage();
        
        this.checkGameEnd();
    },
    
    checkHit: function(isPlayerShooting) {
        const targetX = isPlayerShooting ? 
            this.computerPosition.x + this.targetOffset.x : 
            this.playerPosition.x + this.targetOffset.x;
        const targetY = isPlayerShooting ? 
            this.computerPosition.y + this.targetOffset.y : 
            this.playerPosition.y + this.targetOffset.y;
        
        this.crosshairPosition = { x: targetX, y: targetY };
        
        const accuracy = Math.random();
        const hitChance = 0.7;
        
        return accuracy < hitChance;
    },
    
    playShotAnimation: function(x, y, fromPlayer) {
        this.shotAnimation = {
            active: true,
            x: x,
            y: y,
            time: 0,
            fromPlayer: fromPlayer
        };
    },
    
    playFlashEffect: function(color) {
        this.flashEffect = {
            active: true,
            opacity: 0.3,
            color: color
        };
    },
    
    checkGameEnd: function() {
        if (this.playerScore >= 3) {
            this.state = GameState.GAME_END;
            this.showGameMessage('你赢得了比赛！', 'hit');
            this.addLog('🎉 恭喜！你赢得了整场比赛！', 'win');
        } else if (this.computerScore >= 3) {
            this.state = GameState.GAME_END;
            this.showGameMessage('电脑人赢得了比赛！', 'miss');
            this.addLog('💔 电脑人赢得了整场比赛。', 'win');
        } else {
            this.currentRound++;
            
            this.roundTimer = setTimeout(() => {
                if (this.state === GameState.ROUND_END) {
                    this.hideGameMessage();
                    this.isCrosshairVisible = false;
                    this.startRound();
                }
            }, 2500);
        }
        
        this.updateButtons();
        this.saveToStorage();
    },
    
    togglePause: function() {
        if (this.state === GameState.PAUSED) {
            this.resumeGame();
        } else if (this.state === GameState.COUNTDOWN || this.state === GameState.READY) {
            this.previousState = this.state;
            this.state = GameState.PAUSED;
            this.clearTimers();
            this.showGameMessage('游戏暂停', 'foul');
            this.updateButtons();
            this.addLog('游戏已暂停');
            this.saveToStorage();
        }
    },
    
    resumeGame: function() {
        if (this.state === GameState.PAUSED && this.previousState) {
            this.state = this.previousState;
            this.hideGameMessage();
            this.updateButtons();
            this.addLog('游戏继续');
            
            if (this.state === GameState.COUNTDOWN) {
                this.runCountdown();
            } else if (this.state === GameState.READY) {
                this.showGameMessage('拔枪！', 'foul');
                const remainingTime = this.computerReactionTime - (Date.now() - this.drawSignalTime);
                if (remainingTime > 0) {
                    this.roundTimer = setTimeout(() => {
                        if (!this.isActionTaken && this.state === GameState.READY) {
                            this.computerShootsFirst();
                        }
                    }, remainingTime);
                }
            }
            
            this.saveToStorage();
        }
    },
    
    showCountdown: function(value) {
        const el = document.getElementById('countdownDisplay');
        el.textContent = value;
        el.classList.add('active');
    },
    
    hideCountdown: function() {
        const el = document.getElementById('countdownDisplay');
        el.classList.remove('active');
    },
    
    showGameMessage: function(message, type) {
        const el = document.getElementById('gameMessage');
        el.textContent = message;
        el.className = 'game-message show';
        if (type) {
            el.classList.add(type);
        }
    },
    
    hideGameMessage: function() {
        const el = document.getElementById('gameMessage');
        el.className = 'game-message';
    },
    
    addLog: function(message, type = '') {
        const logEntry = {
            message: message,
            type: type,
            time: new Date().toLocaleTimeString()
        };
        
        this.logs.push(logEntry);
        
        const container = document.getElementById('logContainer');
        const div = document.createElement('div');
        div.className = 'log-entry';
        if (type) {
            div.classList.add(type);
        }
        div.textContent = `[${logEntry.time}] ${message}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        
        if (this.logs.length > 50) {
            this.logs = this.logs.slice(-20);
        }
    },
    
    updateUI: function() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('computerScore').textContent = this.computerScore;
        document.getElementById('currentRound').textContent = this.currentRound;
        document.getElementById('totalRounds').textContent = this.totalRounds;
    },
    
    updateButtons: function() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const shootBtn = document.getElementById('shootBtn');
        
        shootBtn.disabled = this.state !== GameState.READY;
        pauseBtn.disabled = this.state !== GameState.COUNTDOWN && this.state !== GameState.READY;
        
        if (this.state === GameState.PAUSED) {
            startBtn.disabled = false;
            startBtn.textContent = '继续游戏';
            pauseBtn.disabled = true;
            restartBtn.disabled = false;
        } else if (this.state === GameState.IDLE || this.state === GameState.GAME_END) {
            startBtn.disabled = false;
            startBtn.textContent = '开始游戏';
            restartBtn.disabled = this.state === GameState.IDLE && this.playerScore === 0 && this.computerScore === 0;
        } else {
            startBtn.disabled = true;
            startBtn.textContent = '开始游戏';
            restartBtn.disabled = false;
        }
    },
    
    render: function() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.drawBackground();
        this.drawCharacters();
        
        if (this.isCrosshairVisible) {
            this.drawCrosshair();
        }
        
        if (this.shotAnimation.active) {
            this.drawShotEffect();
        }
        
        if (this.flashEffect.active) {
            this.drawFlash();
        }
    },
    
    drawBackground: function() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        skyGradient.addColorStop(0, '#1a1a2e');
        skyGradient.addColorStop(0.5, '#2c3e50');
        skyGradient.addColorStop(1, '#34495e');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
        
        const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
        groundGradient.addColorStop(0, '#5d4e37');
        groundGradient.addColorStop(1, '#3d2e1f');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, canvas.height * 0.6 - 2, canvas.width, 2);
        
        ctx.fillStyle = '#e67e22';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(700, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },
    
    drawCharacters: function() {
        this.drawPlayer(this.playerPosition.x, this.playerPosition.y, true);
        this.drawPlayer(this.computerPosition.x, this.computerPosition.y, false);
    },
    
    drawPlayer: function(x, y, isPlayer) {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 80, 40, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
        ctx.fillRect(x - 25, y - 40, 50, 70);
        
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.arc(x, y - 60, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 30, y - 90, 60, 10);
        ctx.fillRect(x - 20, y - 110, 40, 25);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x - 20, y + 30, 18, 50);
        ctx.fillRect(x + 2, y + 30, 18, 50);
        
        const armX = isPlayer ? x + 35 : x - 35;
        const armDir = isPlayer ? 1 : -1;
        
        ctx.fillStyle = '#f5deb3';
        ctx.save();
        ctx.translate(x + armDir * 30, y);
        
        if (this.state === GameState.SHOOTING || this.state === GameState.ROUND_END || this.state === GameState.GAME_END) {
            ctx.rotate(armDir * -0.3);
            ctx.fillRect(0, -8, 40 * armDir, 16);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(35 * armDir, -5, 25 * armDir, 10);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(35 * armDir, -3, 15 * armDir, 6);
        } else {
            ctx.fillRect(0, 0, 30 * armDir, 16);
            
            ctx.fillStyle = '#555';
            ctx.fillRect(25 * armDir, 5, 8 * armDir, 20);
        }
        ctx.restore();
        
        ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isPlayer ? '玩家' : '电脑人', x, y - 100);
    },
    
    drawCrosshair: function() {
        const ctx = this.ctx;
        const x = this.crosshairPosition.x;
        const y = this.crosshairPosition.y;
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(x - 30, y);
        ctx.lineTo(x - 10, y);
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 30, y);
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x, y - 10);
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x, y + 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    },
    
    drawShotEffect: function() {
        const ctx = this.ctx;
        const anim = this.shotAnimation;
        
        anim.time += 16;
        const progress = Math.min(anim.time / 300, 1);
        const scale = 1 + progress * 2;
        const opacity = 1 - progress;
        
        ctx.globalAlpha = opacity;
        
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerR = 20 * scale;
            const outerR = 40 * scale;
            ctx.beginPath();
            ctx.moveTo(
                anim.x + Math.cos(angle) * innerR,
                anim.y + Math.sin(angle) * innerR
            );
            ctx.lineTo(
                anim.x + Math.cos(angle) * outerR,
                anim.y + Math.sin(angle) * outerR
            );
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        if (progress >= 1) {
            this.shotAnimation.active = false;
        }
    },
    
    drawFlash: function() {
        const ctx = this.ctx;
        const flash = this.flashEffect;
        
        flash.opacity -= 0.01;
        if (flash.opacity <= 0) {
            flash.active = false;
            return;
        }
        
        ctx.fillStyle = flash.color || '#fff';
        ctx.globalAlpha = flash.opacity;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalAlpha = 1;
    },
    
    startRenderLoop: function() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        loop();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

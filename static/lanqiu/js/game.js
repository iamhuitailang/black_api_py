const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    gameState: CONSTANTS.GAME_STATES.MENU,
    
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeLeft: CONSTANTS.TIME.GAME_DURATION,
    energy: 0,
    
    animationId: null,
    timerInterval: null,
    
    court: null,
    player: null,
    defender: null,
    ball: null,
    hoop: null,
    effects: null,
    
    aimData: null,
    trajectoryPoints: null,
    
    ballPreviousY: 0,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.createGameObjects();
        this.setupInputHandlers();
        
        UI.init(this);
        Input.init(this.canvas);
        
        this.tryLoadSavedGame();
        
        this.render();
        
        setInterval(() => {
            if (this.gameState === CONSTANTS.GAME_STATES.PLAYING) {
                this.saveCurrentState();
            }
        }, 3000);
        
        window.addEventListener('beforeunload', () => {
            if (this.gameState === CONSTANTS.GAME_STATES.PLAYING || 
                this.gameState === CONSTANTS.GAME_STATES.PAUSED) {
                this.saveCurrentState();
            }
        });
    },

    setupCanvas: function() {
        this.width = CONSTANTS.DIMENSIONS.CANVAS_WIDTH;
        this.height = CONSTANTS.DIMENSIONS.CANVAS_HEIGHT;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    resizeCanvas: function() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scale = Math.min(
            containerWidth / this.width,
            containerHeight / this.height
        );
        
        this.canvas.style.width = (this.width * scale) + 'px';
        this.canvas.style.height = (this.height * scale) + 'px';
    },

    createGameObjects: function() {
        this.court = new BasketballCourt();
        this.player = new BasketballPlayer(
            CONSTANTS.POSITIONS.PLAYER_X,
            CONSTANTS.POSITIONS.GROUND_Y,
            true
        );
        this.defender = new BasketballPlayer(
            CONSTANTS.DEFENDER.POSITION_X,
            CONSTANTS.DEFENDER.POSITION_Y,
            false
        );
        this.defender.isDefending = false;
        this.defender.defendTimer = 0;
        this.defender.yellTimer = 0;
        this.defender.isYelling = false;
        
        this.ball = new Basketball();
        this.hoop = new BasketballHoop();
        this.effects = new EffectsSystem();
    },

    setupInputHandlers: function() {
        Input.onShoot = (data) => this.handleShoot(data);
        Input.onSkill = () => this.handleSkill();
        Input.onAimStart = () => this.handleAimStart();
        Input.onAimUpdate = (data) => this.handleAimUpdate(data);
        Input.onAimEnd = () => this.handleAimEnd();
    },

    saveCurrentState: function() {
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.GAME_STATE, this.gameState);
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.SCORE, this.score.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.COMBO, this.combo.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.MAX_COMBO, this.maxCombo.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.TIME_LEFT, this.timeLeft.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.ENERGY, this.energy.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.BALL_IS_FLYING, this.ball.isFlying.toString());
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.LAST_SAVE, Date.now().toString());
        } catch (e) {
            console.warn('保存状态失败:', e);
        }
    },

    tryLoadSavedGame: function() {
        try {
            const gameState = localStorage.getItem(CONSTANTS.STORAGE_KEYS.GAME_STATE);
            const lastSave = localStorage.getItem(CONSTANTS.STORAGE_KEYS.LAST_SAVE);
            
            if (gameState !== CONSTANTS.GAME_STATES.PLAYING) {
                return false;
            }
            
            if (lastSave) {
                const age = Date.now() - parseInt(lastSave);
                if (age > 12 * 60 * 60 * 1000) {
                    this.clearSavedState();
                    return false;
                }
            }
            
            const isFlying = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BALL_IS_FLYING) === 'true';
            
            if (isFlying) {
                this.clearSavedState();
                return false;
            }
            
            this.score = parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.SCORE)) || 0;
            this.combo = parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.COMBO)) || 0;
            this.maxCombo = parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.MAX_COMBO)) || 0;
            this.timeLeft = parseFloat(localStorage.getItem(CONSTANTS.STORAGE_KEYS.TIME_LEFT)) || CONSTANTS.TIME.GAME_DURATION;
            this.energy = parseInt(localStorage.getItem(CONSTANTS.STORAGE_KEYS.ENERGY)) || 0;
            
            this.gameState = CONSTANTS.GAME_STATES.PLAYING;
            
            this.startGameLoop();
            this.startTimer();
            UI.showScreen('playing');
            this.updateUI();
            
            this.saveCurrentState();
            
            return true;
        } catch (e) {
            console.warn('加载保存状态失败:', e);
            this.clearSavedState();
            return false;
        }
    },

    clearSavedState: function() {
        try {
            Object.values(CONSTANTS.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.warn('清除保存状态失败:', e);
        }
    },

    startGame: function() {
        this.resetGame();
        this.gameState = CONSTANTS.GAME_STATES.PLAYING;
        
        UI.showScreen('playing');
        this.updateUI();
        
        this.startGameLoop();
        this.startTimer();
        
        this.saveCurrentState();
    },

    resetGame: function() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.timeLeft = CONSTANTS.TIME.GAME_DURATION;
        this.energy = 0;
        
        this.createGameObjects();
        
        this.clearSavedState();
        Input.reset();
    },

    pauseGame: function() {
        if (this.gameState !== CONSTANTS.GAME_STATES.PLAYING) return;
        
        this.gameState = CONSTANTS.GAME_STATES.PAUSED;
        
        this.stopGameLoop();
        this.stopTimer();
        
        UI.showScreen('pause');
        this.saveCurrentState();
    },

    resumeGame: function() {
        if (this.gameState !== CONSTANTS.GAME_STATES.PAUSED) return;
        
        this.gameState = CONSTANTS.GAME_STATES.PLAYING;
        
        UI.hideAllScreens();
        UI.showScreen('playing');
        
        this.startGameLoop();
        this.startTimer();
    },

    restartGame: function() {
        this.stopGameLoop();
        this.stopTimer();
        this.clearSavedState();
        this.startGame();
    },

    quitGame: function() {
        this.stopGameLoop();
        this.stopTimer();
        this.clearSavedState();
        this.showMenu();
    },

    showMenu: function() {
        this.gameState = CONSTANTS.GAME_STATES.MENU;
        UI.showScreen('start');
        this.render();
    },

    endGame: function() {
        this.gameState = CONSTANTS.GAME_STATES.GAMEOVER;
        
        this.stopGameLoop();
        this.stopTimer();
        
        UI.updateFinalStats(this.score, this.maxCombo);
        UI.showScreen('gameover');
        
        this.clearSavedState();
    },

    startGameLoop: function() {
        this.gameLoop();
    },

    stopGameLoop: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    gameLoop: function() {
        this.update();
        this.render();
        
        if (this.gameState === CONSTANTS.GAME_STATES.PLAYING) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    },

    startTimer: function() {
        this.timerInterval = setInterval(() => {
            if (this.gameState === CONSTANTS.GAME_STATES.PLAYING) {
                this.timeLeft -= 0.1;
                
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.endGame();
                    return;
                }
                
                UI.updateTime(this.timeLeft);
            }
        }, 100);
    },

    stopTimer: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    update: function() {
        this.player.update();
        this.updateDefender();
        this.hoop.update();
        
        if (this.ball.isFlying) {
            this.updateBall();
        }
        
        this.effects.update();
    },

    updateDefender: function() {
        this.defender.update();
        
        if (this.defender.defendTimer > 0) {
            this.defender.defendTimer--;
            if (this.defender.defendTimer <= 0) {
                this.defender.isDefending = false;
            }
        }
        
        if (this.defender.yellTimer > 0) {
            this.defender.yellTimer--;
            if (this.defender.yellTimer <= 0) {
                this.defender.isYelling = false;
            }
        }
    },

    triggerDefenderActions: function() {
        if (Math.random() < CONSTANTS.DEFENDER.INTERFERENCE_CHANCE) {
            this.defender.isDefending = true;
            this.defender.defendTimer = 90;
        }
        
        if (Math.random() < CONSTANTS.DEFENDER.YELL_CHANCE) {
            this.defender.isYelling = true;
            this.defender.yellTimer = 60;
        }
    },

    getDefenderPenalty: function() {
        let penalty = 0;
        if (this.defender.isDefending) {
            penalty += CONSTANTS.DEFENDER.INTERFERENCE_PENALTY;
        }
        if (this.defender.isYelling) {
            penalty += CONSTANTS.DEFENDER.YELL_PENALTY;
        }
        return penalty;
    },

    updateBall: function() {
        const ballPrevX = this.ball.x;
        const ballPrevY = this.ball.y;
        
        this.ball.update();
        
        const hoopX = this.hoop.centerX;
        const hoopY = this.hoop.centerY;
        const hoopR = this.hoop.radius;
        const ballR = this.ball.radius;
        
        const goingDown = this.ball.vy > 0;
        
        if (goingDown) {
            const wasAbove = ballPrevY < hoopY;
            const isBelow = this.ball.y >= hoopY;
            const crossedHoopY = wasAbove && isBelow;
            
            if (crossedHoopY) {
                const ballXAtCross = (ballPrevX + this.ball.x) / 2;
                const dx = Math.abs(ballXAtCross - hoopX);
                
                const scoreRange = hoopR * 0.9;
                const swishRange = hoopR * 0.4;
                
                if (dx < scoreRange) {
                    const isSwish = dx < swishRange;
                    this.handleScore(isSwish);
                    return;
                }
            }
        }
        
        const rimDx = Math.abs(this.ball.x - hoopX);
        const rimDy = Math.abs(this.ball.y - hoopY);
        
        if (rimDx > hoopR * 0.4 && 
            rimDx < hoopR + ballR &&
            rimDy < ballR * 2) {
            
            if (this.ball.x < hoopX) {
                this.ball.vx = -Math.abs(this.ball.vx) * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
            } else {
                this.ball.vx = Math.abs(this.ball.vx) * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
            }
            
            this.effects.add('duang', hoopX, hoopY - 20, { duration: 800 });
        }
        
        const backboardX = CONSTANTS.POSITIONS.BACKBOARD_X;
        const backboardY = this.hoop.backboardY;
        const backboardW = CONSTANTS.DIMENSIONS.BACKBOARD_WIDTH;
        const backboardH = CONSTANTS.DIMENSIONS.BACKBOARD_HEIGHT;
        
        const ballLeft = this.ball.x - ballR;
        const ballRight = this.ball.x + ballR;
        const ballTop = this.ball.y - ballR;
        const ballBottom = this.ball.y + ballR;
        
        const boardCollision = ballRight > backboardX && 
                               ballLeft < backboardX + backboardW &&
                               ballBottom > backboardY && 
                               ballTop < backboardY + backboardH &&
                               this.ball.vx > 0;
        
        if (boardCollision) {
            this.ball.vx = -Math.abs(this.ball.vx) * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
            this.effects.add('duang', this.ball.x, this.ball.y, { duration: 800 });
        }
        
        const groundY = CONSTANTS.POSITIONS.GROUND_Y;
        
        if (this.ball.y + ballR >= groundY) {
            this.ball.y = groundY - ballR;
            this.ball.vy = -this.ball.vy * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
            this.ball.vx *= CONSTANTS.PHYSICS.FRICTION;
            
            if (Math.abs(this.ball.vy) < 1.5) {
                this.ball.vy = 0;
                
                setTimeout(() => {
                    if (this.ball && !this.ball.isFlying) {
                        this.handleMiss();
                    }
                }, 600);
            }
        }
        
        if (this.ball.y > this.height + 100 || 
            this.ball.x < -100 || 
            this.ball.x > this.width + 100) {
            this.handleMiss();
        }
    },

    handleAimStart: function() {
        if (this.gameState !== CONSTANTS.GAME_STATES.PLAYING || this.ball.isFlying) return;
        
        UI.showPowerBar();
        UI.showAngleIndicator();
    },

    handleAimUpdate: function(data) {
        if (this.gameState !== CONSTANTS.GAME_STATES.PLAYING) return;
        
        this.aimData = data;
        
        UI.updatePowerBar(data.powerPercent);
        UI.updateAngleIndicator(data.angle);
        
        const inGreenZone = Utils.isInGreenZone(data.powerPercent, data.angle);
        
        this.trajectoryPoints = [];
        
        const radians = data.angle * Math.PI / 180;
        let px = this.ball.x;
        let py = this.ball.y;
        let vx = Math.cos(radians) * data.power;
        let vy = -Math.sin(radians) * data.power;
        
        for (let i = 0; i < 40; i++) {
            this.trajectoryPoints.push({ x: px, y: py });
            
            vy += CONSTANTS.PHYSICS.GRAVITY;
            px += vx;
            py += vy;
            
            if (py > this.height) break;
        }
    },

    handleAimEnd: function() {
        UI.hidePowerBar();
        UI.hideAngleIndicator();
        this.aimData = null;
        this.trajectoryPoints = null;
    },

    handleShoot: function(data) {
        if (this.gameState !== CONSTANTS.GAME_STATES.PLAYING || this.ball.isFlying) return;
        
        this.triggerDefenderActions();
        
        const inGreenZone = Utils.isInGreenZone(data.powerPercent, data.angle);
        
        let finalPower = data.power;
        let finalAngle = data.angle;
        
        const penalty = this.getDefenderPenalty();
        
        if (penalty > 0) {
            let interferenceChance = penalty;
            
            if (inGreenZone) {
                interferenceChance *= 0.4;
            }
            
            if (Math.random() < interferenceChance + 0.15) {
                const powerOffset = Utils.randomRange(-5, 5);
                const angleOffset = Utils.randomRange(-10, 10);
                finalPower = Utils.clamp(finalPower + powerOffset, 
                    CONSTANTS.PHYSICS.MIN_POWER, CONSTANTS.PHYSICS.MAX_POWER);
                finalAngle = Utils.clamp(finalAngle + angleOffset, 
                    CONSTANTS.ANGLE.MIN, CONSTANTS.ANGLE.MAX);
            }
        }
        
        this.ball.shoot(finalAngle, finalPower);
        
        this.player.isCelebrating = false;
        this.player.celebrationTimer = 0;
        
        this.effects.add('shoot', this.ball.x, this.ball.y, { duration: 500 });
        
        this.energy = Math.min(CONSTANTS.ENERGY.MAX, 
            this.energy + CONSTANTS.ENERGY.PER_SHOT);
        UI.updateEnergy(this.energy);
    },

    handleSkill: function() {
        if (this.gameState !== CONSTANTS.GAME_STATES.PLAYING) return;
        if (this.energy < CONSTANTS.ENERGY.MAX) return;
        if (this.ball.isFlying) return;
        
        this.energy = 0;
        UI.updateEnergy(this.energy);
        
        const dx = this.hoop.centerX - this.ball.x;
        const dy = this.hoop.centerY - 50 - this.ball.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(-dy, dx);
        
        const g = CONSTANTS.PHYSICS.GRAVITY;
        const targetY = this.hoop.centerY - 30;
        const h = this.ball.y - targetY;
        
        let power = 18;
        if (distance > 500) power = 20;
        if (distance < 400) power = 16;
        
        let angleDeg = Utils.radiansToDegrees(targetAngle);
        angleDeg = Utils.clamp(angleDeg, 50, 65);
        
        this.ball.shoot(angleDeg, power);
        
        this.player.isCelebrating = false;
        this.player.celebrationTimer = 0;
        
        this.effects.add('shoot', this.ball.x, this.ball.y, { duration: 800 });
    },

    handleScore: function(isSwish) {
        this.ball.isFlying = false;
        
        const isThreePointer = this.player.x <= CONSTANTS.POSITIONS.THREE_POINT_LINE;
        
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        let points = isThreePointer ? 
            CONSTANTS.SCORING.THREE_POINTER : 
            CONSTANTS.SCORING.FREE_THROW;
        
        if (isSwish) {
            points += CONSTANTS.SCORING.SWISH_BONUS;
        }
        
        if (this.combo > 1) {
            const comboBonus = Math.min(this.combo - 1, CONSTANTS.SCORING.COMBO_MAX_BONUS);
            points += comboBonus;
        }
        
        this.score += points;
        
        if (isSwish) {
            this.timeLeft += CONSTANTS.SCORING.SWISH_TIME_BONUS;
            this.energy = Math.min(CONSTANTS.ENERGY.MAX, 
                this.energy + CONSTANTS.ENERGY.PER_SWISH);
            
            this.effects.add('perfect', 
                this.hoop.centerX, this.hoop.centerY - 40, { duration: 1500 });
            this.effects.add('swish', 
                this.hoop.centerX, this.hoop.centerY, { duration: 1000 });
            
            this.hoop.openMouth();
        }
        
        const scoreText = isThreePointer ? `+${points} 3分` : `+${points}`;
        this.effects.add('score', 
            this.hoop.centerX - 40, this.hoop.centerY - 70, 
            { text: scoreText, color: '#FFD700', duration: 1200 });
        
        this.player.celebrate();
        this.effects.add('celebration', 
            this.player.x, this.player.y - 80, { duration: 1500 });
        
        this.updateUI();
        
        setTimeout(() => {
            if (this.gameState === CONSTANTS.GAME_STATES.PLAYING) {
                this.ball.resetToPlayer();
                this.player.isCelebrating = false;
            }
        }, 1200);
    },

    handleMiss: function() {
        if (!this.ball.isFlying) return;
        
        this.ball.isFlying = false;
        this.combo = 0;
        
        this.effects.add('duang', 
            this.ball.x, this.ball.y - 25, { duration: 800 });
        
        this.updateUI();
        
        setTimeout(() => {
            if (this.gameState === CONSTANTS.GAME_STATES.PLAYING) {
                this.ball.resetToPlayer();
                this.player.isCelebrating = false;
            }
        }, 1500);
    },

    updateUI: function() {
        UI.updateScore(this.score);
        UI.updateCombo(this.combo);
        UI.updateTime(this.timeLeft);
        UI.updateEnergy(this.energy);
    },

    render: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.court.draw(this.ctx);
        this.hoop.draw(this.ctx);
        this.player.draw(this.ctx);
        this.defender.draw(this.ctx);
        this.ball.draw(this.ctx);
        
        if (this.aimData && this.trajectoryPoints && this.trajectoryPoints.length > 0) {
            const inGreenZone = Utils.isInGreenZone(
                this.aimData.powerPercent, this.aimData.angle
            );
            
            this.drawTrajectory(this.trajectoryPoints, inGreenZone);
            this.drawAimLine(this.aimData);
        }
        
        this.effects.draw(this.ctx);
        
        this.drawDefenderStatus();
    },

    drawTrajectory: function(points, inGreenZone) {
        if (!points || points.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = inGreenZone ? '#4CAF50' : '#FF6B00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        for (let i = 0; i < points.length; i += 4) {
            const alpha = 1 - (i / points.length) * 0.6;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = inGreenZone ? '#4CAF50' : '#FF6B00';
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    },

    drawAimLine: function(data) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([6, 4]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(data.startX, data.startY);
        this.ctx.lineTo(data.currentX, data.currentY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(data.currentX, data.currentY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    },

    drawDefenderStatus: function() {
        if (this.defender.isDefending || this.defender.isYelling) {
            this.ctx.save();
            
            if (this.defender.isDefending) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 10;
                this.ctx.fillText('⚠️ 干扰中', this.defender.x, this.defender.feetY - 110);
                this.ctx.shadowBlur = 0;
            }
            
            if (this.defender.isYelling) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = 'bold 22px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 8;
                const offset = this.defender.isDefending ? 25 : 0;
                this.ctx.fillText('防守! 加油!', this.defender.x, this.defender.feetY - 140 + offset);
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}

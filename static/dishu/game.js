class WhackAMoleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.score = 0;
        this.timeLeft = 30;
        this.highScore = this._loadHighScore();
        this.gameStatus = 'idle';
        this.isPaused = false;
        
        this.holes = [];
        this.activeMoles = [];
        this.floatingScores = [];
        this.hitEffects = [];
        this.particles = [];
        
        this.mousePosX = 0;
        this.mousePosY = 0;
        this.hammerRotation = 0;
        this.isHammerSwinging = false;
        this.swingProgress = 0;
        
        this.gameTimerId = null;
        this.spawnTimerId = null;
        this.lastFrameTime = 0;
        
        this.pauseStartTime = 0;
        this.totalPauseDuration = 0;
        
        this._init();
    }
    
    _init() {
        this._createHoleLayout();
        this._bindEventHandlers();
        this._updateDisplay();
        this._restoreSavedGame();
        this._startGameLoop();
    }
    
    _createHoleLayout() {
        const rows = 3;
        const cols = 4;
        const holeRadius = 50;
        const paddingX = this.width / (cols + 1);
        const paddingY = (this.height - 60) / (rows + 1);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const holeIndex = row * cols + col;
                this.holes.push({
                    id: holeIndex,
                    centerX: paddingX * (col + 1),
                    centerY: paddingY * (row + 1) + 30,
                    radius: holeRadius,
                    grassDetails: this._generateGrassDetails(),
                    dirtDecorations: this._generateDirtDecorations()
                });
            }
        }
    }
    
    _generateGrassDetails() {
        const blades = [];
        const numBlades = 24;
        for (let i = 0; i < numBlades; i++) {
            const baseAngle = (i / numBlades) * Math.PI * 2;
            blades.push({
                baseAngle: baseAngle,
                bladeHeight: 8 + Math.random() * 16,
                bladeWidth: 2 + Math.random() * 3,
                curveAmount: (Math.random() - 0.5) * 0.6,
                wavePhase: Math.random() * Math.PI * 2,
                colorVariant: this._getRandomGreenShade()
            });
        }
        return blades;
    }
    
    _generateDirtDecorations() {
        const decorations = [];
        const numDecorations = 10;
        for (let i = 0; i < numDecorations; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 45 + Math.random() * 35;
            decorations.push({
                offsetX: Math.cos(angle) * distance,
                offsetY: Math.sin(angle) * distance * 0.5,
                decorationSize: 2 + Math.random() * 5,
                colorShade: this._getRandomBrownShade()
            });
        }
        return decorations;
    }
    
    _getRandomGreenShade() {
        const greenShades = ['#228B22', '#2E8B57', '#32CD32', '#3CB371', '#4CAF50', '#66BB6A'];
        return greenShades[Math.floor(Math.random() * greenShades.length)];
    }
    
    _getRandomBrownShade() {
        const brownShades = ['#8B4513', '#A0522D', '#6B4423', '#8B5A2B', '#795548', '#6D4C41'];
        return brownShades[Math.floor(Math.random() * brownShades.length)];
    }
    
    _bindEventHandlers() {
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this._handleMouseClick(e));
        this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this._startNewGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this._togglePauseState());
        document.getElementById('restartBtn').addEventListener('click', () => this._restartCurrentGame());
        
        window.addEventListener('beforeunload', () => this._saveCurrentGame());
    }
    
    _handleMouseMove(e) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleFactorX = this.canvas.width / canvasRect.width;
        const scaleFactorY = this.canvas.height / canvasRect.height;
        
        this.mousePosX = (e.clientX - canvasRect.left) * scaleFactorX;
        this.mousePosY = (e.clientY - canvasRect.top) * scaleFactorY;
    }
    
    _handleMouseClick(e) {
        if (this.gameStatus !== 'playing' || this.isPaused) return;
        
        this.isHammerSwinging = true;
        this.swingProgress = 0;
        this._createSwingEffect();
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleFactorX = this.canvas.width / canvasRect.width;
        const scaleFactorY = this.canvas.height / canvasRect.height;
        
        const clickPosX = (e.clientX - canvasRect.left) * scaleFactorX;
        const clickPosY = (e.clientY - canvasRect.top) * scaleFactorY;
        
        this._checkMoleHit(clickPosX, clickPosY);
        
        setTimeout(() => {
            this.isHammerSwinging = false;
        }, 120);
    }
    
    _handleMouseDown(e) {
        this.hammerRotation = -0.25;
    }
    
    _handleMouseUp(e) {
        this.hammerRotation = 0;
    }
    
    _createSwingEffect() {
        const currentTime = this._getAdjustedTime();
        for (let i = 0; i < 4; i++) {
            this.hitEffects.push({
                posX: this.mousePosX + (Math.random() - 0.5) * 15,
                posY: this.mousePosY + (Math.random() - 0.5) * 15,
                opacityLevel: 0.8 - i * 0.15,
                effectSize: 20 + i * 6,
                createdTime: currentTime
            });
        }
    }
    
    _createHitParticles(x, y, particleColor) {
        const currentTime = this._getAdjustedTime();
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                posX: x,
                posY: y,
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed - 1.5,
                particleSize: 2 + Math.random() * 4,
                color: particleColor,
                opacityLevel: 1,
                createdTime: currentTime,
                gravityForce: 0.12
            });
        }
    }
    
    _getAdjustedTime() {
        return Date.now() - this.totalPauseDuration;
    }
    
    _checkMoleHit(clickX, clickY) {
        for (let i = this.activeMoles.length - 1; i >= 0; i--) {
            const mole = this.activeMoles[i];
            if (mole.isActive && !mole.hasBeenHit) {
                const dx = clickX - mole.posX;
                const dy = clickY - mole.posY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mole.radius + 12) {
                    this._processMoleHit(mole, i);
                    break;
                }
            }
        }
    }
    
    _processMoleHit(mole, moleIndex) {
        mole.hasBeenHit = true;
        mole.hitTimestamp = this._getAdjustedTime();
        
        const earnedPoints = mole.pointValue;
        this.score += earnedPoints;
        this._updateDisplay();
        
        this._createFloatingScore(mole.posX, mole.posY - mole.radius, earnedPoints);
        this._createHitParticles(mole.posX, mole.posY, mole.bodyColor);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this._saveHighScore();
            this._updateDisplay();
        }
        
        this._saveCurrentGame();
    }
    
    _createFloatingScore(x, y, points) {
        this.floatingScores.push({
            posX: x,
            posY: y,
            scoreValue: points,
            opacityLevel: 1,
            scaleFactor: 1,
            moveSpeedY: -1.2,
            createdTime: this._getAdjustedTime()
        });
    }
    
    _startNewGame() {
        this._stopAllTimers();
        this._resetGameState();
        this.gameStatus = 'playing';
        this.isPaused = false;
        
        this._updateDisplay();
        this._updateButtonStates();
        this._hideGameMessage();
        
        this._startGameTimers();
        this._saveCurrentGame();
    }
    
    _resetGameState() {
        this.score = 0;
        this.timeLeft = 30;
        this.activeMoles = [];
        this.floatingScores = [];
        this.hitEffects = [];
        this.particles = [];
        this.totalPauseDuration = 0;
        this.pauseStartTime = 0;
    }
    
    _startGameTimers() {
        this._stopAllTimers();
        
        this.gameTimerId = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this._updateDisplay();
                this._saveCurrentGame();
                
                if (this.timeLeft <= 0) {
                    this._endGameSession();
                }
            }
        }, 1000);
        
        this._scheduleNextMoleSpawn();
    }
    
    _stopAllTimers() {
        if (this.gameTimerId) {
            clearInterval(this.gameTimerId);
            this.gameTimerId = null;
        }
        if (this.spawnTimerId) {
            clearTimeout(this.spawnTimerId);
            this.spawnTimerId = null;
        }
    }
    
    _scheduleNextMoleSpawn() {
        if (this.gameStatus !== 'playing') return;
        
        const spawnDelay = 350 + Math.random() * 750;
        this.spawnTimerId = setTimeout(() => {
            if (this.gameStatus === 'playing' && !this.isPaused) {
                this._spawnNewMole();
            }
            this._scheduleNextMoleSpawn();
        }, spawnDelay);
    }
    
    _spawnNewMole() {
        const availableHoles = this.holes.filter(hole => {
            return !this.activeMoles.some(mole => 
                mole.holeId === hole.id && (mole.isActive || mole.hasBeenHit)
            );
        });
        
        if (availableHoles.length === 0) return;
        
        const selectedHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        const moleType = this._selectRandomMoleType();
        const lifespan = 800 + Math.random() * 700;
        const currentTime = this._getAdjustedTime();
        
        const newMole = {
            posX: selectedHole.centerX,
            posY: selectedHole.centerY,
            radius: 38,
            holeId: selectedHole.id,
            moleVariant: moleType.variant,
            bodyColor: moleType.color,
            pointValue: moleType.points,
            isActive: true,
            hasBeenHit: false,
            spawnTimestamp: currentTime,
            totalLifespan: lifespan,
            hitTimestamp: null,
            expression: Math.random() > 0.65 ? 'sneaky' : 'happy',
            bobPhase: Math.random() * Math.PI * 2,
            bobSpeed: 0.002 + Math.random() * 0.002
        };
        
        this.activeMoles.push(newMole);
        this._saveCurrentGame();
    }
    
    _selectRandomMoleType() {
        const randomValue = Math.random() * 100;
        
        if (randomValue < 70) {
            return { variant: 'normal', color: '#CD853F', points: 10 };
        } else if (randomValue < 85) {
            return { variant: 'red', color: '#FF6B6B', points: 20 };
        } else if (randomValue < 95) {
            return { variant: 'green', color: '#66BB6A', points: 30 };
        } else {
            return { variant: 'gold', color: '#FFD54F', points: 50 };
        }
    }
    
    _togglePauseState() {
        if (this.gameStatus !== 'playing') return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseStartTime = Date.now();
            this._showGameMessage('游戏暂停中...');
        } else {
            if (this.pauseStartTime > 0) {
                this.totalPauseDuration += Date.now() - this.pauseStartTime;
                this.pauseStartTime = 0;
            }
            this._hideGameMessage();
        }
        
        this._updateButtonStates();
        this._saveCurrentGame();
    }
    
    _restartCurrentGame() {
        this._stopAllTimers();
        this._clearSavedGame();
        this._startNewGame();
    }
    
    _endGameSession() {
        this._stopAllTimers();
        this.gameStatus = 'ended';
        this._updateButtonStates();
        
        if (this.score >= this.highScore && this.score > 0) {
            this._showGameMessage(`🎉 太棒了！新纪录：${this.score} 分！`);
        } else {
            this._showGameMessage(`游戏结束！你的得分：${this.score} 分`);
        }
        
        this._clearSavedGame();
    }
    
    _updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.timeLeft;
        document.getElementById('highscore').textContent = this.highScore;
    }
    
    _updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (this.gameStatus === 'idle') {
            startBtn.disabled = false;
            startBtn.textContent = '开始游戏';
            pauseBtn.disabled = true;
            restartBtn.disabled = true;
        } else if (this.gameStatus === 'playing') {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            restartBtn.disabled = false;
            pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        } else if (this.gameStatus === 'ended') {
            startBtn.disabled = false;
            startBtn.textContent = '再玩一次';
            pauseBtn.disabled = true;
            restartBtn.disabled = true;
        }
    }
    
    _showGameMessage(msg) {
        document.getElementById('gameMessage').textContent = msg;
    }
    
    _hideGameMessage() {
        document.getElementById('gameMessage').textContent = '';
    }
    
    _saveHighScore() {
        localStorage.setItem('whack_mole_highscore', this.highScore.toString());
    }
    
    _loadHighScore() {
        const saved = localStorage.getItem('whack_mole_highscore');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    _saveCurrentGame() {
        const currentTime = this._getAdjustedTime();
        const gameData = {
            currentScore: this.score,
            remainingTime: this.timeLeft,
            gameStatus: this.gameStatus,
            isPaused: this.isPaused,
            totalPauseDuration: this.totalPauseDuration,
            molesData: this.activeMoles.map(mole => ({
                ...mole,
                remainingLifespan: mole.hasBeenHit ? 0 : Math.max(0, mole.totalLifespan - (currentTime - mole.spawnTimestamp))
            }))
        };
        localStorage.setItem('whack_mole_state', JSON.stringify(gameData));
    }
    
    _restoreSavedGame() {
        const savedData = localStorage.getItem('whack_mole_state');
        if (!savedData) return;
        
        try {
            const gameData = JSON.parse(savedData);
            
            if (gameData.gameStatus === 'playing' && gameData.remainingTime > 0) {
                this.score = gameData.currentScore;
                this.timeLeft = gameData.remainingTime;
                this.gameStatus = gameData.gameStatus;
                this.isPaused = gameData.isPaused || false;
                this.totalPauseDuration = gameData.totalPauseDuration || 0;
                
                const currentTime = this._getAdjustedTime();
                if (gameData.molesData && Array.isArray(gameData.molesData)) {
                    this.activeMoles = gameData.molesData
                        .filter(mole => !mole.hasBeenHit && mole.remainingLifespan > 0)
                        .map(mole => ({
                            ...mole,
                            spawnTimestamp: currentTime,
                            totalLifespan: mole.remainingLifespan,
                            hitTimestamp: null,
                            hasBeenHit: false,
                            isActive: true
                        }));
                }
                
                this._updateDisplay();
                this._updateButtonStates();
                
                if (this.isPaused) {
                    this._showGameMessage('游戏暂停中...');
                }
                
                this._startGameTimers();
            }
        } catch (error) {
            console.error('恢复游戏状态失败:', error);
            this._clearSavedGame();
        }
    }
    
    _clearSavedGame() {
        localStorage.removeItem('whack_mole_state');
    }
    
    _startGameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this._updateGameState(deltaTime);
        this._renderGameFrame();
        
        requestAnimationFrame((time) => this._startGameLoop(time));
    }
    
    _updateGameState(deltaTime) {
        this._updateActiveMoles();
        this._updateFloatingScores();
        this._updateHitEffects();
        this._updateParticles();
        this._updateHammerAnimation(deltaTime);
    }
    
    _updateActiveMoles() {
        const currentTime = this._getAdjustedTime();
        
        for (let i = this.activeMoles.length - 1; i >= 0; i--) {
            const mole = this.activeMoles[i];
            
            if (mole.hasBeenHit) {
                if (mole.hitTimestamp && currentTime - mole.hitTimestamp > 350) {
                    this.activeMoles.splice(i, 1);
                }
                continue;
            }
            
            const elapsedTime = currentTime - mole.spawnTimestamp;
            if (elapsedTime > mole.totalLifespan) {
                mole.isActive = false;
                this.activeMoles.splice(i, 1);
            }
        }
    }
    
    _updateFloatingScores() {
        for (let i = this.floatingScores.length - 1; i >= 0; i--) {
            const score = this.floatingScores[i];
            score.posY += score.moveSpeedY;
            score.opacityLevel -= 0.012;
            score.scaleFactor += 0.006;
            
            if (score.opacityLevel <= 0) {
                this.floatingScores.splice(i, 1);
            }
        }
    }
    
    _updateHitEffects() {
        const currentTime = this._getAdjustedTime();
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            const age = currentTime - effect.createdTime;
            effect.opacityLevel = Math.max(0, 0.8 - age / 180);
            effect.effectSize += 0.4;
            
            if (effect.opacityLevel <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }
    }
    
    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.posX += particle.velX;
            particle.posY += particle.velY;
            particle.velY += particle.gravityForce;
            particle.opacityLevel -= 0.018;
            particle.particleSize *= 0.97;
            
            if (particle.opacityLevel <= 0 || particle.particleSize < 0.4) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    _updateHammerAnimation(deltaTime) {
        if (this.swingProgress < 1) {
            this.swingProgress += 0.08;
            if (this.swingProgress > 1) {
                this.swingProgress = 1;
            }
        }
    }
    
    _renderGameFrame() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this._drawBackgroundScene();
        this._drawAllHoles();
        this._drawAllMoles();
        this._drawParticles();
        this._drawHitEffects();
        this._drawFloatingScores();
        this._drawHammer();
    }
    
    _drawBackgroundScene() {
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, '#B9F6CA');
        bgGradient.addColorStop(0.4, '#A5D6A7');
        bgGradient.addColorStop(1, '#66BB6A');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 60; i++) {
            const posX = (i * 131 + 40) % this.width;
            const posY = (i * 79 + 25) % this.height;
            const size = 1.5 + Math.sin(i * 0.5) * 1;
            this.ctx.beginPath();
            this.ctx.arc(posX, posY, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this._drawDecorativeFlowers();
    }
    
    _drawDecorativeFlowers() {
        const flowers = [
            { x: 60, y: 80, color: '#FF8A80', size: 12 },
            { x: 740, y: 100, color: '#FFD180', size: 10 },
            { x: 50, y: 520, color: '#EA80FC', size: 11 },
            { x: 750, y: 540, color: '#82B1FF', size: 9 },
            { x: 400, y: 50, color: '#FF8A80', size: 8 }
        ];
        
        flowers.forEach(flower => {
            this._drawSingleFlower(flower.x, flower.y, flower.color, flower.size);
        });
    }
    
    _drawSingleFlower(x, y, color, size) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(3, size, 0, size * 2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const petalX = Math.cos(angle) * size * 0.6;
            const petalY = Math.sin(angle) * size * 0.6;
            
            this.ctx.beginPath();
            this.ctx.ellipse(petalX, petalY, size * 0.4, size * 0.25, angle, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#FFF176';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    _drawAllHoles() {
        this.holes.forEach((hole, index) => {
            this._drawSingleHole(hole, index);
        });
    }
    
    _drawSingleHole(hole, index) {
        const currentTime = this._getAdjustedTime();
        
        this.ctx.save();
        this.ctx.translate(hole.centerX, hole.centerY);
        
        hole.dirtDecorations.forEach(decoration => {
            this.ctx.fillStyle = decoration.colorShade;
            this.ctx.beginPath();
            this.ctx.ellipse(decoration.offsetX, decoration.offsetY, decoration.decorationSize, decoration.decorationSize * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        const shadowGrad = this.ctx.createRadialGradient(0, 12, 0, 0, 12, hole.radius + 15);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = shadowGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 12, hole.radius + 15, (hole.radius + 15) * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const rimGrad = this.ctx.createRadialGradient(0, 0, hole.radius - 10, 0, 0, hole.radius + 8);
        rimGrad.addColorStop(0, '#6D4C41');
        rimGrad.addColorStop(0.5, '#8D6E63');
        rimGrad.addColorStop(1, '#A1887F');
        this.ctx.fillStyle = rimGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, hole.radius + 8, (hole.radius + 8) * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const innerGrad = this.ctx.createRadialGradient(0, -8, 0, 0, -8, hole.radius);
        innerGrad.addColorStop(0, '#1B0F0A');
        innerGrad.addColorStop(0.3, '#2D1810');
        innerGrad.addColorStop(0.6, '#3E2723');
        innerGrad.addColorStop(1, '#4E342E');
        this.ctx.fillStyle = innerGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, hole.radius - 5, (hole.radius - 5) * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, hole.radius + 5, (hole.radius + 5) * 0.5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this._drawHoleGrass(hole, currentTime);
        
        this.ctx.restore();
    }
    
    _drawHoleGrass(hole, currentTime) {
        hole.grassDetails.forEach(blade => {
            this.ctx.save();
            
            const wave = Math.sin(currentTime * 0.0015 + blade.wavePhase) * 0.15;
            const angle = blade.baseAngle + wave;
            
            this.ctx.rotate(angle);
            this.ctx.translate(hole.radius + 3, 0);
            
            this.ctx.beginPath();
            this.ctx.moveTo(-blade.bladeWidth / 2, 0);
            
            const ctrlX = blade.bladeHeight * 0.4 * Math.cos(blade.curve + wave);
            const ctrlY = -blade.bladeHeight * 0.4;
            const endX = blade.bladeHeight * Math.cos(blade.curve + wave * 2);
            const endY = -blade.bladeHeight;
            
            this.ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            this.ctx.quadraticCurveTo(ctrlX + blade.bladeWidth / 2, ctrlY, blade.bladeWidth / 2, 0);
            this.ctx.closePath();
            
            const grassGrad = this.ctx.createLinearGradient(0, 0, 0, -blade.bladeHeight);
            grassGrad.addColorStop(0, this._adjustColorBrightness(blade.colorVariant, -25));
            grassGrad.addColorStop(0.5, blade.colorVariant);
            grassGrad.addColorStop(1, this._adjustColorBrightness(blade.colorVariant, 35));
            
            this.ctx.fillStyle = grassGrad;
            this.ctx.fill();
            
            this.ctx.strokeStyle = this._adjustColorBrightness(blade.colorVariant, -35);
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    _drawAllMoles() {
        const sortedMoles = [...this.activeMoles].sort((a, b) => {
            if (a.hasBeenHit && !b.hasBeenHit) return -1;
            if (!a.hasBeenHit && b.hasBeenHit) return 1;
            return 0;
        });
        
        sortedMoles.forEach(mole => {
            if (mole.isActive) {
                this._drawSingleMole(mole);
            }
        });
    }
    
    _drawSingleMole(mole) {
        const currentTime = this._getAdjustedTime();
        const elapsedTime = currentTime - mole.spawnTimestamp;
        const totalLife = mole.totalLifespan;
        
        let emergeProgress;
        if (elapsedTime < 220) {
            emergeProgress = elapsedTime / 220;
        } else if (elapsedTime > totalLife - 220 && !mole.hasBeenHit) {
            emergeProgress = (totalLife - elapsedTime) / 220;
        } else {
            emergeProgress = 1;
        }
        
        if (mole.hasBeenHit && mole.hitTimestamp) {
            const hitElapsed = currentTime - mole.hitTimestamp;
            emergeProgress = Math.max(0, 1 - hitElapsed / 350);
        }
        
        const bobOffset = Math.sin(currentTime * mole.bobSpeed + mole.bobPhase) * 2.5;
        const scaleVertical = 0.65 + emergeProgress * 0.35;
        const scaleHorizontal = 0.85 + emergeProgress * 0.15;
        
        this.ctx.save();
        this.ctx.translate(mole.posX, mole.posY + bobOffset);
        this.ctx.scale(scaleHorizontal, scaleVertical);
        
        const shakeX = mole.hasBeenHit ? (Math.random() - 0.5) * 10 : 0;
        const shakeY = mole.hasBeenHit ? (Math.random() - 0.5) * 10 : 0;
        this.ctx.translate(shakeX, shakeY);
        
        if (mole.hasBeenHit) {
            this.ctx.globalAlpha = emergeProgress;
        }
        
        this._drawMoleBody(mole);
        this._drawMoleEars(mole);
        this._drawMoleCheeks();
        this._drawMoleEyes(mole);
        this._drawMoleNose();
        this._drawMoleMouth(mole);
        this._drawMoleTeeth();
        this._drawMoleWhiskers();
        
        this.ctx.restore();
    }
    
    _drawMoleBody(mole) {
        const r = mole.radius;
        
        const bodyGrad = this.ctx.createRadialGradient(
            -r * 0.35, -r * 0.35, 0,
            0, 0, r
        );
        
        if (mole.moleVariant === 'gold') {
            bodyGrad.addColorStop(0, '#FFF9C4');
            bodyGrad.addColorStop(0.25, '#FFF59D');
            bodyGrad.addColorStop(0.5, '#FFEE58');
            bodyGrad.addColorStop(0.75, '#FFD54F');
            bodyGrad.addColorStop(1, '#FFC107');
            
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 235, 59, 0.25)';
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const dist = r + 8;
                this.ctx.beginPath();
                this.ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
                this.ctx.lineTo(Math.cos(angle) * (dist + 14), Math.sin(angle) * (dist + 14));
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            }
            this.ctx.restore();
        } else if (mole.moleVariant === 'red') {
            bodyGrad.addColorStop(0, '#FFCDD2');
            bodyGrad.addColorStop(0.3, '#EF9A9A');
            bodyGrad.addColorStop(0.6, '#E57373');
            bodyGrad.addColorStop(1, '#EF5350');
        } else if (mole.moleVariant === 'green') {
            bodyGrad.addColorStop(0, '#C8E6C9');
            bodyGrad.addColorStop(0.3, '#A5D6A7');
            bodyGrad.addColorStop(0.6, '#81C784');
            bodyGrad.addColorStop(1, '#66BB6A');
        } else {
            bodyGrad.addColorStop(0, '#FFCC80');
            bodyGrad.addColorStop(0.25, '#FFB74D');
            bodyGrad.addColorStop(0.5, '#FFA726');
            bodyGrad.addColorStop(0.75, '#FF9800');
            bodyGrad.addColorStop(1, '#FB8C00');
        }
        
        this.ctx.fillStyle = bodyGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        
        const bellyGrad = this.ctx.createRadialGradient(0, r * 0.15, 0, 0, r * 0.15, r * 0.55);
        if (mole.moleVariant === 'gold') {
            bellyGrad.addColorStop(0, '#FFFDE7');
            bellyGrad.addColorStop(1, '#FFF9C4');
        } else {
            bellyGrad.addColorStop(0, '#FFF8E1');
            bellyGrad.addColorStop(1, '#FFECB3');
        }
        this.ctx.fillStyle = bellyGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, r * 0.15, r * 0.48, r * 0.38, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this._adjustColorBrightness(mole.bodyColor, -40);
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    _drawMoleEars(mole) {
        const r = mole.radius;
        const earSize = r * 0.38;
        
        const earPositions = [
            { x: -r * 0.78, y: -r * 0.42 },
            { x: r * 0.78, y: -r * 0.42 }
        ];
        
        earPositions.forEach((pos, idx) => {
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            
            const earGrad = this.ctx.createRadialGradient(
                -earSize * 0.25, -earSize * 0.25, 0,
                0, 0, earSize
            );
            
            if (mole.moleVariant === 'gold') {
                earGrad.addColorStop(0, '#FFF9C4');
                earGrad.addColorStop(1, '#FFE082');
            } else {
                earGrad.addColorStop(0, this._adjustColorBrightness(mole.bodyColor, 25));
                earGrad.addColorStop(1, mole.bodyColor);
            }
            
            this.ctx.fillStyle = earGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, earSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            const innerEarGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, earSize * 0.7);
            innerEarGrad.addColorStop(0, '#FFCDD2');
            innerEarGrad.addColorStop(1, '#F48FB1');
            this.ctx.fillStyle = innerEarGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, earSize * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = this._adjustColorBrightness(mole.bodyColor, -30);
            this.ctx.lineWidth = 1.8;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, earSize, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    _drawMoleCheeks() {
        const r = 40;
        
        const cheekPositions = [
            { x: -r * 0.62, y: r * 0.08 },
            { x: r * 0.62, y: r * 0.08 }
        ];
        
        cheekPositions.forEach(pos => {
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            
            const cheekGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
            cheekGrad.addColorStop(0, 'rgba(255, 138, 128, 0.9)');
            cheekGrad.addColorStop(1, 'rgba(255, 138, 128, 0)');
            this.ctx.fillStyle = cheekGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    _drawMoleEyes(mole) {
        const eyeY = -6;
        const eyeSpacing = 17;
        
        [-1, 1].forEach(side => {
            const x = side * eyeSpacing;
            
            this.ctx.save();
            this.ctx.translate(x, eyeY);
            
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#424242';
            this.ctx.lineWidth = 1.2;
            this.ctx.stroke();
            
            let pupilOffsetX = side * 1.5;
            let pupilOffsetY = 1.5;
            
            if (mole.expression === 'sneaky') {
                pupilOffsetX = side * 4;
                pupilOffsetY = 0;
            }
            
            this.ctx.fillStyle = '#1A1A1A';
            this.ctx.beginPath();
            this.ctx.arc(pupilOffsetX, pupilOffsetY, 5.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(pupilOffsetX + side * 2, pupilOffsetY - 2.5, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(pupilOffsetX - side * 0.8, pupilOffsetY + 1.5, 1.2, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (mole.hasBeenHit) {
                this.ctx.strokeStyle = '#212121';
                this.ctx.lineWidth = 2.5;
                this.ctx.lineCap = 'round';
                
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI + Math.PI / 4;
                    const len = 9;
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.cos(angle) * len * 0.25, Math.sin(angle) * len * 0.25);
                    this.ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        });
        
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 2.8;
        this.ctx.lineCap = 'round';
        
        [-1, 1].forEach(side => {
            const x = side * eyeSpacing;
            this.ctx.beginPath();
            if (mole.expression === 'sneaky') {
                this.ctx.moveTo(x - 9, eyeY - 11);
                this.ctx.quadraticCurveTo(x, eyeY - 14, x + 9, eyeY - 11);
            } else {
                this.ctx.moveTo(x - 9, eyeY - 13);
                this.ctx.quadraticCurveTo(x, eyeY - 17, x + 9, eyeY - 13);
            }
            this.ctx.stroke();
        });
    }
    
    _drawMoleNose() {
        this.ctx.save();
        this.ctx.translate(0, 11);
        
        const noseGrad = this.ctx.createRadialGradient(-1.5, -1.5, 0, 0, 0, 11);
        noseGrad.addColorStop(0, '#FFCDD2');
        noseGrad.addColorStop(0.4, '#F48FB1');
        noseGrad.addColorStop(1, '#EC407A');
        
        this.ctx.fillStyle = noseGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#C2185B';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#880E4F';
        this.ctx.beginPath();
        this.ctx.ellipse(-4, -0.5, 2.8, 2.2, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(4, -0.5, 2.8, 2.2, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.ellipse(-3, -3.5, 2.2, 1.8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    _drawMoleMouth(mole) {
        this.ctx.save();
        this.ctx.translate(0, 19);
        
        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 2.2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        if (mole.expression === 'sneaky') {
            this.ctx.arc(0, 4, 7, 0.15, Math.PI - 0.15);
        } else {
            this.ctx.arc(0, -1, 9, 0.2, Math.PI - 0.2);
        }
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    _drawMoleTeeth() {
        const teethY = 22;
        const teethW = 7.5;
        const teethH = 11;
        
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 1;
        
        const teethPositions = [
            { x: -teethW - 3.5 },
            { x: 3.5 }
        ];
        
        teethPositions.forEach(pos => {
            this.ctx.save();
            this.ctx.translate(pos.x, teethY);
            
            this.ctx.beginPath();
            this.ctx.moveTo(-teethW / 2, 0);
            this.ctx.lineTo(-teethW / 2 + 1.2, teethH);
            this.ctx.lineTo(teethW / 2 - 1.2, teethH);
            this.ctx.lineTo(teethW / 2, 0);
            this.ctx.closePath();
            
            const toothGrad = this.ctx.createLinearGradient(0, 0, 0, teethH);
            toothGrad.addColorStop(0, '#FFFEF7');
            toothGrad.addColorStop(0.6, '#FAFAFA');
            toothGrad.addColorStop(1, '#F0F0F0');
            
            this.ctx.fillStyle = toothGrad;
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.ellipse(-1, 2.5, 2.2, 3.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    _drawMoleWhiskers() {
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 1.4;
        this.ctx.lineCap = 'round';
        
        const startY = 13;
        const whiskerSets = [
            { side: -1, lengths: [26, 22, 17], angles: [-0.3, 0, 0.3], baseX: -15 },
            { side: 1, lengths: [26, 22, 17], angles: [-0.3, 0, 0.3], baseX: 15 }
        ];
        
        whiskerSets.forEach(set => {
            set.lengths.forEach((len, i) => {
                const angle = set.angles[i];
                
                this.ctx.beginPath();
                this.ctx.moveTo(set.baseX, startY + i * 4.5);
                
                const cp1x = set.baseX + set.side * len * 0.3;
                const cp1y = startY + i * 4.5 + angle * len * 0.3;
                const cp2x = set.baseX + set.side * len * 0.7;
                const cp2y = startY + i * 4.5 + angle * len * 0.5;
                const endX = set.baseX + set.side * len;
                const endY = startY + i * 4.5 + angle * len;
                
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
                this.ctx.stroke();
            });
        });
    }
    
    _drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.opacityLevel;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.posX, p.posY, p.particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    _drawHitEffects() {
        this.hitEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.opacityLevel * 0.5;
            this.ctx.strokeStyle = '#FF9800';
            this.ctx.lineWidth = 2.5;
            this.ctx.setLineDash([6, 6]);
            this.ctx.beginPath();
            this.ctx.arc(effect.posX, effect.posY, effect.effectSize, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });
    }
    
    _drawFloatingScores() {
        this.floatingScores.forEach(score => {
            this.ctx.save();
            this.ctx.globalAlpha = score.opacityLevel;
            this.ctx.translate(score.posX, score.posY);
            this.ctx.scale(score.scaleFactor, score.scaleFactor);
            
            this.ctx.font = 'bold 44px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this.ctx.fillText(`+${score.scoreValue}`, 3, 3);
            
            const textGrad = this.ctx.createLinearGradient(0, -28, 0, 28);
            textGrad.addColorStop(0, '#FFC107');
            textGrad.addColorStop(0.25, '#FFECB3');
            textGrad.addColorStop(0.5, '#FFF9C4');
            textGrad.addColorStop(0.75, '#FFD54F');
            textGrad.addColorStop(1, '#FFB300');
            
            this.ctx.fillStyle = textGrad;
            this.ctx.strokeStyle = '#FF8F00';
            this.ctx.lineWidth = 3.5;
            
            this.ctx.strokeText(`+${score.scoreValue}`, 0, 0);
            this.ctx.fillText(`+${score.scoreValue}`, 0, 0);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.fillText(`+${score.scoreValue}`, -2, -5);
            
            this.ctx.restore();
        });
    }
    
    _drawHammer() {
        if (this.gameStatus !== 'playing' || this.isPaused) return;
        
        const swingAngle = this.isHammerSwinging ? -0.55 : this.hammerRotation;
        
        this.ctx.save();
        this.ctx.translate(this.mousePosX, this.mousePosY);
        this.ctx.rotate(swingAngle + Math.PI * 0.7);
        
        const handleLen = 68;
        const handleW = 11;
        const headW = 36;
        const headH = 24;
        
        const handleGrad = this.ctx.createLinearGradient(0, -handleW / 2, 0, handleW / 2);
        handleGrad.addColorStop(0, '#FFCC80');
        handleGrad.addColorStop(0.2, '#FFB74D');
        handleGrad.addColorStop(0.5, '#FF9800');
        handleGrad.addColorStop(0.8, '#F57C00');
        handleGrad.addColorStop(1, '#E65100');
        
        this.ctx.fillStyle = handleGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(-handleLen, -handleW / 2, handleLen, handleW, 5);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#BF360C';
        this.ctx.lineWidth = 1.8;
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#795548';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
            const x = -handleLen + 10 + i * 10;
            this.ctx.beginPath();
            this.ctx.moveTo(x, -handleW / 2 + 2.5);
            this.ctx.quadraticCurveTo(x + 2.5, 0, x, handleW / 2 - 2.5);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#5D4037';
        this.ctx.beginPath();
        this.ctx.roundRect(-10, -handleW / 2 - 3, 14, handleW + 6, 3);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#3E2723';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();
        
        const headGrad = this.ctx.createLinearGradient(-headW / 2, -headH, -headW / 2, 0);
        headGrad.addColorStop(0, '#BDBDBD');
        headGrad.addColorStop(0.1, '#E0E0E0');
        headGrad.addColorStop(0.25, '#F5F5F5');
        headGrad.addColorStop(0.4, '#FAFAFA');
        headGrad.addColorStop(0.55, '#E0E0E0');
        headGrad.addColorStop(0.7, '#BDBDBD');
        headGrad.addColorStop(0.85, '#9E9E9E');
        headGrad.addColorStop(1, '#757575');
        
        this.ctx.fillStyle = headGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(-headW / 2, -headH - 8, headW, headH, 7);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        this.ctx.beginPath();
        this.ctx.roundRect(-headW / 2 + 5, -headH - 6, headW / 2 - 6, headH / 2 - 3, 4);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const y = -headH - 6 + i * 5.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-headW / 2 + 5, y);
            this.ctx.lineTo(headW / 2 - 5, y);
            this.ctx.stroke();
        }
        
        const faceGrad = this.ctx.createRadialGradient(0, -headH / 2 - 8, 0, 0, -headH / 2 - 8, 11);
        faceGrad.addColorStop(0, '#FF8A80');
        faceGrad.addColorStop(1, '#EF5350');
        
        this.ctx.fillStyle = faceGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, -headH / 2 - 8, 11, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#C62828';
        this.ctx.lineWidth = 1.8;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-3.5, -headH / 2 - 10, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(3.5, -headH / 2 - 10, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.beginPath();
        this.ctx.arc(-3.5, -headH / 2 - 9.5, 1.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(3.5, -headH / 2 - 9.5, 1.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#1A1A1A';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(0, -headH / 2 - 5, 5, 0.15, Math.PI - 0.15);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    _adjustColorBrightness(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WhackAMoleGame();
});
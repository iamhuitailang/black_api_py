const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    state: 'start',
    score: 0,
    highScore: 0,
    combo: 0,
    lives: 5,
    maxLives: 5,
    
    timePerLevel: 5000,
    currentTime: 0,
    lastTime: 0,
    
    ball: {
        screenX: 0,
        screenY: 0,
        radius: 20,
        falling: false,
        fallProgress: 0,
        fallStartY: 0,
        expression: 'normal',
        squash: 1
    },
    
    platforms: [],
    platformHeight: 30,
    platformGap: 90,
    initialPlatformCount: 7,
    
    gapAngle: Math.PI / 3,
    obstacleCount: 2,
    
    baseRotationSpeed: 0.01,
    rotationSpeed: 0.01,
    
    cameraY: 0,
    targetCameraY: 0,
    cameraAnimating: false,
    
    particles: [],
    floatTexts: [],
    
    storageKey: 'qiuqiu_highscore',
    stateStorageKey: 'qiuqiu_game_state',
    
    perspectiveScale: 0.5,
    
    targetPlatform: null,
    
    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.lastTime = performance.now();
        
        this.resize();
        this.loadHighScore();
        this.tryRestoreState();
        this.setupEvents();
        this.setupAutoSave();
        this.updateUI();
        
        this.gameLoop();
    },
    
    resize: function() {
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = 9 / 16;
        if (containerWidth / containerHeight > aspectRatio) {
            this.height = Math.min(containerHeight, 900);
            this.width = this.height * aspectRatio;
        } else {
            this.width = Math.min(containerWidth, 500);
            this.height = this.width / aspectRatio;
        }
        
        this.canvas.width = this.width * 2;
        this.canvas.height = this.height * 2;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(2, 2);
        
        this.ball.screenX = this.width / 2;
        this.ball.screenY = this.height * 0.18;
    },
    
    loadHighScore: function() {
        const saved = Utils.loadFromLocalStorage(this.storageKey, 0);
        this.highScore = saved || 0;
    },
    
    saveHighScore: function() {
        Utils.saveToLocalStorage(this.storageKey, this.highScore);
    },
    
    tryRestoreState: function() {
        const savedState = Utils.loadFromLocalStorage(this.stateStorageKey, null);
        
        if (!savedState || savedState.state !== 'playing') {
            return;
        }
        
        if (savedState.lives !== undefined && savedState.lives <= 0) {
            Utils.saveToLocalStorage(this.stateStorageKey, null);
            return;
        }
        
        try {
            this.savedState = savedState;
            
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn btn-secondary';
            continueBtn.id = 'continueBtn';
            continueBtn.textContent = '继续游戏';
            continueBtn.style.marginTop = '10px';
            
            const startBtn = document.getElementById('startBtn');
            startBtn.parentNode.insertBefore(continueBtn, startBtn.nextSibling);
            
            continueBtn.addEventListener('click', () => {
                this.resumeGame(savedState);
            });
        } catch (e) {
            console.error('Failed to prepare state restore:', e);
            Utils.saveToLocalStorage(this.stateStorageKey, null);
        }
    },
    
    resumeGame: function(savedState) {
        this.state = 'playing';
        this.score = savedState.score || 0;
        this.combo = savedState.combo || 0;
        this.lives = savedState.lives !== undefined ? savedState.lives : this.maxLives;
        this.cameraY = savedState.cameraY || 0;
        this.targetCameraY = savedState.targetCameraY || 0;
        
        if (savedState.currentTime !== undefined && savedState.currentTime > 100) {
            this.currentTime = savedState.currentTime;
        } else {
            this.currentTime = this.timePerLevel;
        }
        
        this.ball.screenX = this.width / 2;
        this.ball.screenY = this.height * 0.18;
        this.ball.falling = false;
        this.ball.fallProgress = 0;
        this.ball.expression = 'normal';
        this.ball.squash = 1;
        
        this.platforms = [];
        if (savedState.platforms && savedState.platforms.length > 0) {
            this.platforms = savedState.platforms.map(p => ({
                worldY: p.worldY,
                rotation: p.rotation || 0,
                gapStart: p.gapStart,
                gapEnd: p.gapEnd,
                obstacles: p.obstacles || [],
                colorIndex: p.colorIndex || 0,
                seed: p.seed || Math.random()
            }));
        }
        
        const speedMult = 1 + this.score * 0.03;
        this.rotationSpeed = this.baseRotationSpeed * Math.min(speedMult, 2.5);
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) continueBtn.remove();
        
        this.updateUI();
        this.lastTime = performance.now();
    },
    
    saveGameState: function() {
        if (this.state !== 'playing') {
            Utils.saveToLocalStorage(this.stateStorageKey, null);
            return;
        }
        
        const stateToSave = {
            state: this.state,
            score: this.score,
            combo: this.combo,
            lives: this.lives,
            currentTime: this.currentTime,
            cameraY: this.cameraY,
            targetCameraY: this.targetCameraY,
            platforms: this.platforms.map(p => ({
                worldY: p.worldY,
                rotation: p.rotation,
                gapStart: p.gapStart,
                gapEnd: p.gapEnd,
                obstacles: p.obstacles.map(o => ({ angle: o.angle })),
                colorIndex: p.colorIndex,
                seed: p.seed
            }))
        };
        
        Utils.saveToLocalStorage(this.stateStorageKey, stateToSave);
    },
    
    setupAutoSave: function() {
        window.addEventListener('beforeunload', () => this.saveGameState());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.saveGameState();
        });
    },
    
    setupEvents: function() {
        window.addEventListener('resize', () => {
            this.resize();
        });
        
        const handleDrop = (e) => {
            if (this.state === 'playing' && !this.ball.falling && !this.cameraAnimating) {
                e.preventDefault();
                this.dropBall();
            }
        };
        
        this.canvas.addEventListener('click', handleDrop);
        this.canvas.addEventListener('touchstart', handleDrop, { passive: false });
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                handleDrop(e);
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startNewGame();
        });
    },
    
    startNewGame: function() {
        Utils.saveToLocalStorage(this.stateStorageKey, null);
        
        this.state = 'playing';
        this.score = 0;
        this.combo = 0;
        this.lives = this.maxLives;
        this.currentTime = this.timePerLevel;
        this.rotationSpeed = this.baseRotationSpeed;
        
        this.ball.screenX = this.width / 2;
        this.ball.screenY = this.height * 0.18;
        this.ball.falling = false;
        this.ball.fallProgress = 0;
        this.ball.expression = 'normal';
        this.ball.squash = 1;
        
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.cameraAnimating = false;
        
        this.particles = [];
        this.floatTexts = [];
        
        this.generateInitialPlatforms();
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.updateUI();
        this.saveGameState();
        this.lastTime = performance.now();
    },
    
    generateInitialPlatforms: function() {
        this.platforms = [];
        
        const startWorldY = this.height * 0.25;
        
        for (let i = 0; i < this.initialPlatformCount; i++) {
            const platform = this.createPlatform(
                startWorldY + i * this.platformGap,
                i
            );
            this.platforms.push(platform);
        }
    },
    
    createPlatform: function(worldY, index) {
        const seed = Math.random();
        const gapStart = seed * Math.PI * 2;
        const gapEnd = gapStart + this.gapAngle;
        
        const obstacles = [];
        
        for (let i = 0; i < this.obstacleCount; i++) {
            let obsAngle;
            let attempts = 0;
            
            do {
                obsAngle = Math.random() * Math.PI * 2;
                attempts++;
                
                const inGap = Utils.isAngleInRange(obsAngle, gapStart - 0.6, gapEnd + 0.6);
                if (!inGap) {
                    let tooClose = false;
                    for (const existing of obstacles) {
                        const diff = Math.abs(obsAngle - existing.angle);
                        if (Math.min(diff, Math.PI * 2 - diff) < 0.5) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (!tooClose) break;
                }
            } while (attempts < 100);
            
            if (attempts < 100) {
                obstacles.push({
                    angle: obsAngle
                });
            }
        }
        
        const colorIndex = index % 5;
        
        return {
            worldY: worldY,
            rotation: 0,
            gapStart: gapStart,
            gapEnd: gapEnd,
            obstacles: obstacles,
            colorIndex: colorIndex,
            seed: seed
        };
    },
    
    dropBall: function() {
        if (this.ball.falling) return;
        
        this.targetPlatform = this.getCurrentPlatform();
        
        this.ball.falling = true;
        this.ball.fallStartY = this.ball.screenY;
        this.ball.fallProgress = 0;
        this.ball.expression = 'falling';
        this.ball.squash = 0.85;
        
        this.addParticles(this.ball.screenX, this.ball.screenY, '#FFD700', 8);
    },
    
    update: function(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.updatePlatformRotation(deltaTime);
        this.updateBallFall(deltaTime);
        this.updateCamera(deltaTime);
        this.updateTimer(deltaTime);
        this.updateParticles(deltaTime);
        this.updateFloatTexts(deltaTime);
        this.managePlatforms();
    },
    
    updatePlatformRotation: function(deltaTime) {
        const speedMult = 1 + this.score * 0.03;
        this.rotationSpeed = this.baseRotationSpeed * Math.min(speedMult, 2.5);
        
        const rotationDelta = this.rotationSpeed * (deltaTime / 16);
        
        for (const platform of this.platforms) {
            platform.rotation -= rotationDelta;
            if (platform.rotation < 0) {
                platform.rotation += Math.PI * 2;
            }
        }
    },
    
    updateBallFall: function(deltaTime) {
        if (!this.ball.falling) return;
        
        const fallDuration = 400;
        this.ball.fallProgress += deltaTime / fallDuration;
        
        if (this.ball.fallProgress >= 1) {
            this.ball.fallProgress = 1;
            this.ball.screenY = this.ball.fallStartY + this.platformGap;
            this.ball.squash = 1.2;
            this.ball.expression = 'scared';
            this.checkLandingResult();
        } else {
            const eased = Utils.easeInOutCubic(this.ball.fallProgress);
            const fallDistance = this.platformGap;
            
            this.ball.screenY = this.ball.fallStartY + fallDistance * eased;
            
            if (this.ball.fallProgress < 0.4) {
                this.ball.squash = 0.85 + this.ball.fallProgress * 0.15;
                this.ball.expression = 'falling';
            } else {
                this.ball.squash = 1 + (this.ball.fallProgress - 0.4) * 0.25;
                this.ball.expression = 'scared';
            }
        }
    },
    
    checkLandingResult: function() {
        const targetPlatform = this.targetPlatform;
        
        if (!targetPlatform) {
            this.handleSuccessfulDrop();
            return;
        }
        
        const ballAngle = Math.PI * 1.5;
        
        const gapStartWorld = Utils.normalizeAngle(targetPlatform.gapStart + targetPlatform.rotation);
        const gapEndWorld = Utils.normalizeAngle(targetPlatform.gapEnd + targetPlatform.rotation);
        
        const inGap = Utils.isAngleInRange(ballAngle, gapStartWorld, gapEndWorld);
        
        if (inGap) {
            this.handleSuccessfulDrop();
            return;
        }
        
        for (const obstacle of targetPlatform.obstacles) {
            const obsAngleWorld = Utils.normalizeAngle(obstacle.angle + targetPlatform.rotation);
            
            const angleDiff = Math.abs(ballAngle - obsAngleWorld);
            const minDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            const hitThreshold = 0.4;
            if (minDiff < hitThreshold) {
                this.handleGameOver('obstacle');
                return;
            }
        }
        
        this.handleMiss();
    },
    
    getCurrentPlatform: function() {
        const ballWorldY = this.ball.screenY + this.cameraY;
        
        let closestPlatform = null;
        let minDistance = Infinity;
        
        for (const platform of this.platforms) {
            const screenY = platform.worldY - this.cameraY;
            if (screenY < this.ball.screenY) continue;
            
            const distance = screenY - this.ball.screenY;
            if (distance < minDistance) {
                minDistance = distance;
                closestPlatform = platform;
            }
        }
        
        return closestPlatform;
    },
    
    findTargetPlatform: function() {
        const ballWorldY = this.ball.screenY + this.cameraY;
        
        for (const platform of this.platforms) {
            const minY = platform.worldY - this.platformGap * 0.2;
            const maxY = platform.worldY + this.platformGap * 0.8;
            
            if (ballWorldY >= minY && ballWorldY < maxY) {
                return platform;
            }
        }
        
        return null;
    },
    
    handleSuccessfulDrop: function() {
        this.score++;
        this.combo++;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.ball.expression = 'happy';
        this.ball.squash = 0.75;
        
        this.addFloatText('+1', this.ball.screenX, this.ball.screenY - 40, '#FF6B9D');
        
        if (this.combo >= 5) {
            this.addFloatText(`Super Combo x${this.combo}!`, this.ball.screenX, this.ball.screenY - 75, '#FF4500');
            this.addParticles(this.ball.screenX, this.ball.screenY, '#FF6347', 25);
        } else if (this.combo >= 3) {
            this.addFloatText(`Combo x${this.combo}!`, this.ball.screenX, this.ball.screenY - 70, '#FFA500');
            this.addParticles(this.ball.screenX, this.ball.screenY, '#FFD700', 18);
        } else {
            this.addParticles(this.ball.screenX, this.ball.screenY, '#32CD32', 12);
        }
        
        this.currentTime = this.timePerLevel;
        
        this.cameraAnimating = true;
        this.targetCameraY += this.platformGap;
        
        this.ball.falling = false;
        this.ball.fallProgress = 0;
        this.ball.screenY = this.height * 0.18;
        
        this.updateUI();
        this.saveGameState();
        
        setTimeout(() => {
            if (this.state === 'playing') {
                this.ball.expression = 'normal';
                this.ball.squash = 1;
            }
        }, 450);
    },
    
    updateCamera: function(deltaTime) {
        if (!this.cameraAnimating) return;
        
        const speed = 0.15;
        const diff = this.targetCameraY - this.cameraY;
        
        this.cameraY += diff * speed;
        
        if (Math.abs(diff) < 0.5) {
            this.cameraY = this.targetCameraY;
            this.cameraAnimating = false;
        }
    },
    
    updateTimer: function(deltaTime) {
        if (this.ball.falling) return;
        
        this.currentTime -= deltaTime;
        
        const timerFill = document.getElementById('timerFill');
        const percentage = Math.max(0, this.currentTime / this.timePerLevel) * 100;
        timerFill.style.width = percentage + '%';
        
        if (percentage < 30) {
            timerFill.classList.add('warning');
        } else {
            timerFill.classList.remove('warning');
        }
        
        if (this.currentTime <= 0) {
            this.handleTimeOut();
        }
    },
    
    handleTimeOut: function() {
        this.lives--;
        this.combo = 0;
        this.currentTime = this.timePerLevel;
        
        this.addFloatText('💔', this.ball.screenX, this.ball.screenY - 40, '#FF0000');
        this.addParticles(this.ball.screenX, this.ball.screenY, '#FF4444', 12);
        
        this.ball.expression = 'scared';
        
        this.updateUI();
        this.saveGameState();
        
        if (this.lives <= 0) {
            this.handleGameOver('timeout');
        }
        
        setTimeout(() => {
            if (this.state === 'playing') {
                this.ball.expression = 'normal';
            }
        }, 350);
    },
    
    handleMiss: function() {
        this.lives--;
        this.combo = 0;
        this.currentTime = this.timePerLevel;
        
        this.addFloatText('😅', this.ball.screenX, this.ball.screenY - 40, '#FF8800');
        this.addParticles(this.ball.screenX, this.ball.screenY, '#FFAA00', 10);
        
        this.ball.expression = 'sad';
        this.ball.falling = false;
        this.ball.fallProgress = 0;
        this.ball.screenY = this.height * 0.18;
        
        this.updateUI();
        this.saveGameState();
        
        if (this.lives <= 0) {
            this.handleGameOver('miss');
        }
        
        setTimeout(() => {
            if (this.state === 'playing') {
                this.ball.expression = 'normal';
                this.ball.squash = 1;
            }
        }, 350);
    },
    
    handleGameOver: function(reason) {
        this.state = 'gameOver';
        this.ball.expression = 'dead';
        this.ball.squash = 1.4;
        
        this.addParticles(this.ball.screenX, this.ball.screenY, '#FF4444', 30);
        
        Utils.saveToLocalStorage(this.stateStorageKey, null);
        
        setTimeout(() => {
            this.showGameOverScreen();
        }, 700);
    },
    
    showGameOverScreen: function() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        
        const newRecordEl = document.getElementById('newRecord');
        if (this.score >= this.highScore && this.score > 0) {
            newRecordEl.style.display = 'block';
        } else {
            newRecordEl.style.display = 'none';
        }
        
        document.getElementById('gameOverScreen').style.display = 'flex';
    },
    
    managePlatforms: function() {
        if (this.platforms.length === 0) return;
        
        const bottomPlatform = this.platforms[this.platforms.length - 1];
        const screenBottom = this.cameraY + this.height;
        
        if (bottomPlatform.worldY < screenBottom + this.platformGap * 3) {
            const newPlatform = this.createPlatform(
                bottomPlatform.worldY + this.platformGap,
                this.platforms.length
            );
            this.platforms.push(newPlatform);
        }
        
        const topPlatform = this.platforms[0];
        if (topPlatform.worldY < this.cameraY - this.platformGap * 2) {
            this.platforms.shift();
        }
    },
    
    addParticles: function(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-4, 4),
                vy: Utils.random(-8, -2),
                life: 1,
                color: color,
                size: Utils.random(4, 9)
            });
        }
    },
    
    updateParticles: function(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18;
            p.life -= 0.016;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    addFloatText: function(text, x, y, color) {
        this.floatTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1,
            scale: 0.5,
            targetScale: 1.3
        });
    },
    
    updateFloatTexts: function(deltaTime) {
        for (let i = this.floatTexts.length - 1; i >= 0; i--) {
            const t = this.floatTexts[i];
            t.y -= 1.3;
            t.life -= 0.012;
            t.scale = Utils.lerp(t.scale, t.targetScale, 0.12);
            
            if (t.life <= 0) {
                this.floatTexts.splice(i, 1);
            }
        }
    },
    
    updateUI: function() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        
        let hearts = '';
        for (let i = 0; i < this.lives; i++) {
            hearts += '❤️';
        }
        for (let i = this.lives; i < this.maxLives; i++) {
            hearts += '🖤';
        }
        document.getElementById('lives').textContent = hearts;
    },
    
    render: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        const currentPlatform = this.getCurrentPlatform();
        
        const sortedPlatforms = [...this.platforms].sort((a, b) => b.worldY - a.worldY);
        
        for (const platform of sortedPlatforms) {
            const screenY = platform.worldY - this.cameraY;
            
            if (screenY < -this.platformGap * 3 || screenY > this.height + this.platformGap * 3) {
                continue;
            }
            
            const isCurrentPlatform = currentPlatform === platform;
            this.drawPlatform25D(platform, screenY, isCurrentPlatform);
        }
        
        this.drawBall();
        this.drawParticles();
        this.drawFloatTexts();
    },
    
    drawBackground: function() {
        const progress = Math.min(this.score / 30, 1);
        
        const bgSets = [
            ['#FFF5F7', '#FFE4E9'],
            ['#F0F9FF', '#E0F2FE'],
            ['#F0FDF4', '#DCFCE7'],
            ['#FEFCE8', '#FEF9C3'],
            ['#FDF4FF', '#FAE8FF']
        ];
        
        const idx1 = Math.floor(progress * (bgSets.length - 1));
        const idx2 = Math.min(idx1 + 1, bgSets.length - 1);
        const t = (progress * (bgSets.length - 1)) - idx1;
        
        const color1 = this.lerpColor(bgSets[idx1][0], bgSets[idx2][0], t);
        const color2 = this.lerpColor(bgSets[idx1][1], bgSets[idx2][1], t);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawDecorativeBubbles();
    },
    
    drawDecorativeBubbles: function() {
        const ctx = this.ctx;
        const time = performance.now() * 0.001;
        
        ctx.save();
        ctx.globalAlpha = 0.12;
        
        const colors = ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#FFDAB9'];
        
        for (let i = 0; i < 12; i++) {
            const phase = (i * 0.6 + time * 0.25) % (Math.PI * 2);
            const x = (i * 48 + Math.sin(phase) * 25) % (this.width + 80) - 40;
            const y = (i * 70 + Math.cos(phase * 0.8) * 35) % (this.height + 80) - 40;
            const size = 12 + Math.sin(phase * 2) * 10;
            
            const bubbleGrad = ctx.createRadialGradient(
                x - size * 0.25, y - size * 0.25, 0,
                x, y, size
            );
            bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            bubbleGrad.addColorStop(0.4, colors[i % colors.length]);
            bubbleGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = bubbleGrad;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    lerpColor: function(c1, c2, t) {
        const rgb1 = this.hexToRgb(c1);
        const rgb2 = this.hexToRgb(c2);
        
        const r = Math.round(Utils.lerp(rgb1.r, rgb2.r, t));
        const g = Math.round(Utils.lerp(rgb1.g, rgb2.g, t));
        const b = Math.round(Utils.lerp(rgb1.b, rgb2.b, t));
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    hexToRgb: function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    },
    
    drawPlatform25D: function(platform, screenY, isCurrentPlatform) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const platformRadius = Math.min(this.width, this.height) * 0.38;
        
        const radiusX = platformRadius;
        const radiusY = platformRadius * this.perspectiveScale;
        
        const thickness = this.platformHeight;
        
        const colors = this.getPlatformColors(platform.colorIndex);
        
        const gapStartWorld = Utils.normalizeAngle(platform.gapStart + platform.rotation);
        const gapEndWorld = Utils.normalizeAngle(platform.gapEnd + platform.rotation);
        
        this.drawPlatformShadow(centerX, screenY, radiusX, radiusY, thickness);
        
        this.drawPlatformTopSurface(centerX, screenY, radiusX, radiusY, colors, gapStartWorld, gapEndWorld);
        
        this.drawObstaclesBack(centerX, screenY, radiusX, radiusY, platform);
        
        this.drawObstaclesFront(centerX, screenY, radiusX, radiusY, platform);
        
        this.drawPlatformFrontSide(centerX, screenY, radiusX, radiusY, thickness, colors, platform, gapStartWorld, gapEndWorld);
        
        if (isCurrentPlatform) {
            this.drawGapIndicator(centerX, screenY, radiusX, radiusY, platform);
        }
    },
    
    drawObstaclesBack: function(centerX, screenY, radiusX, radiusY, platform) {
        const ctx = this.ctx;
        const perspective = radiusY / radiusX;
        
        for (const obstacle of platform.obstacles) {
            const obsAngleWorld = Utils.normalizeAngle(obstacle.angle + platform.rotation);
            
            const yFactor = Math.sin(obsAngleWorld);
            if (yFactor >= 0) continue;
            
            const obsX = centerX + Math.cos(obsAngleWorld) * radiusX;
            const obsY = screenY + Math.sin(obsAngleWorld) * radiusY;
            
            const obsHeight = this.platformHeight * 2.2;
            const obsRadius = 14;
            
            this.drawSingleObstacle(ctx, obsX, obsY, obsRadius, obsHeight, perspective, yFactor);
        }
    },
    
    drawObstaclesFront: function(centerX, screenY, radiusX, radiusY, platform) {
        const ctx = this.ctx;
        const perspective = radiusY / radiusX;
        
        for (const obstacle of platform.obstacles) {
            const obsAngleWorld = Utils.normalizeAngle(obstacle.angle + platform.rotation);
            
            const yFactor = Math.sin(obsAngleWorld);
            if (yFactor < 0) continue;
            
            const obsX = centerX + Math.cos(obsAngleWorld) * radiusX;
            const obsY = screenY + Math.sin(obsAngleWorld) * radiusY;
            
            const obsHeight = this.platformHeight * 2.2;
            const obsRadius = 14;
            
            this.drawSingleObstacle(ctx, obsX, obsY, obsRadius, obsHeight, perspective, yFactor);
        }
    },
    
    getPlatformColors: function(index) {
        const sets = [
            { top: '#FFE8F0', main: '#FF9EC5', dark: '#FF6B9D', glow: '#FFC8DD', accent: '#FFD700' },
            { top: '#E3F2FD', main: '#64B5F6', dark: '#1E88E5', glow: '#90CAF9', accent: '#00BCD4' },
            { top: '#E8F5E9', main: '#81C784', dark: '#43A047', glow: '#A5D6A7', accent: '#CDDC39' },
            { top: '#F3E5F5', main: '#BA68C8', dark: '#7B1FA2', glow: '#CE93D8', accent: '#E91E63' },
            { top: '#FFF8E1', main: '#FFD54F', dark: '#FF8F00', glow: '#FFE082', accent: '#FF9800' }
        ];
        return sets[index % sets.length];
    },
    
    drawPlatformShadow: function(centerX, screenY, radiusX, radiusY, thickness) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = 0.15;
        
        const shadowGradient = ctx.createRadialGradient(
            centerX, screenY + thickness, 0,
            centerX, screenY + thickness, radiusX * 1.3
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, screenY + thickness + 5, radiusX * 1.1, radiusY * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawPlatformFrontSide: function(centerX, screenY, radiusX, radiusY, thickness, colors, platform, gapStartWorld, gapEndWorld) {
        const ctx = this.ctx;
        
        ctx.save();
        
        const segments = 90;
        const angleStep = (Math.PI * 2) / segments;
        
        for (let i = 0; i < segments; i++) {
            const angle1 = i * angleStep;
            const angle2 = (i + 1) * angleStep;
            const midAngle = (angle1 + angle2) / 2;
            
            const inGap = Utils.isAngleInRange(midAngle, gapStartWorld, gapEndWorld);
            if (inGap) continue;
            
            const yFactor = Math.sin(midAngle);
            if (yFactor < 0) continue;
            
            const brightness = 0.45 + yFactor * 0.55;
            const lightColor = this.lightenColor(colors.dark, brightness);
            
            ctx.fillStyle = lightColor;
            
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle1) * radiusX,
                screenY + Math.sin(angle1) * radiusY
            );
            ctx.lineTo(
                centerX + Math.cos(angle2) * radiusX,
                screenY + Math.sin(angle2) * radiusY
            );
            ctx.lineTo(
                centerX + Math.cos(angle2) * radiusX,
                screenY + thickness + Math.sin(angle2) * radiusY
            );
            ctx.lineTo(
                centerX + Math.cos(angle1) * radiusX,
                screenY + thickness + Math.sin(angle1) * radiusY
            );
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    drawPlatformTopSurface: function(centerX, screenY, radiusX, radiusY, colors, gapStart, gapEnd) {
        const ctx = this.ctx;
        
        ctx.save();
        
        ctx.beginPath();
        if (gapStart <= gapEnd) {
            if (gapStart > 0) {
                ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, 0, gapStart, false);
            }
            if (gapEnd < Math.PI * 2) {
                ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, gapEnd, Math.PI * 2, false);
            }
        } else {
            ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, gapEnd, gapStart, false);
        }
        ctx.lineTo(centerX, screenY);
        ctx.closePath();
        
        const topGradient = ctx.createRadialGradient(centerX, screenY, 0, centerX, screenY, radiusX);
        topGradient.addColorStop(0, '#FFFFFF');
        topGradient.addColorStop(0.25, colors.top);
        topGradient.addColorStop(0.6, colors.main);
        topGradient.addColorStop(1, colors.dark);
        
        ctx.fillStyle = topGradient;
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        if (gapStart <= gapEnd) {
            if (gapStart > 0) {
                ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, 0, gapStart, false);
            }
            if (gapEnd < Math.PI * 2) {
                ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, gapEnd, Math.PI * 2, false);
            }
        } else {
            ctx.ellipse(centerX, screenY, radiusX, radiusY, 0, gapEnd, gapStart, false);
        }
        ctx.lineTo(centerX, screenY);
        ctx.closePath();
        ctx.clip();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < 6; i++) {
            const r = radiusX * (0.2 + i * 0.14);
            ctx.beginPath();
            ctx.ellipse(centerX, screenY, r, r * (radiusY / radiusX), 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.restore();
    },
    
    drawGapIndicator: function(centerX, screenY, radiusX, radiusY, platform) {
        const ctx = this.ctx;
        const time = performance.now() * 0.002;
        const glowPhase = platform.seed * 10 + time;
        const glowIntensity = 0.45 + Math.sin(glowPhase) * 0.25;
        
        const gapStartWorld = Utils.normalizeAngle(platform.gapStart + platform.rotation);
        const gapEndWorld = Utils.normalizeAngle(platform.gapEnd + platform.rotation);
        
        const ballAngle = Math.PI * 1.5;
        const ballInGap = Utils.isAngleInRange(ballAngle, gapStartWorld, gapEndWorld);
        
        const finalIntensity = ballInGap ? glowIntensity + 0.35 : glowIntensity;
        
        ctx.save();
        ctx.globalAlpha = finalIntensity;
        
        const glowRadiusX = radiusX * 1.2;
        const glowRadiusY = radiusY * 1.2;
        
        ctx.beginPath();
        ctx.moveTo(centerX, screenY);
        
        if (gapStartWorld <= gapEndWorld) {
            ctx.ellipse(centerX, screenY, glowRadiusX, glowRadiusY, 0, gapStartWorld, gapEndWorld, false);
        } else {
            ctx.ellipse(centerX, screenY, glowRadiusX, glowRadiusY, 0, gapStartWorld, Math.PI * 2, false);
            ctx.ellipse(centerX, screenY, glowRadiusX, glowRadiusY, 0, 0, gapEndWorld, false);
        }
        ctx.closePath();
        
        const glowColor = ballInGap ? 'rgba(50, 205, 50,' : 'rgba(255, 215, 0,';
        const glowGradient = ctx.createRadialGradient(centerX, screenY, 0, centerX, screenY, glowRadiusX);
        glowGradient.addColorStop(0, glowColor + ' 0)');
        glowGradient.addColorStop(0.5, glowColor + ' 0.4)');
        glowGradient.addColorStop(1, glowColor + ' 0.7)');
        
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        ctx.strokeStyle = ballInGap ? 'rgba(50, 205, 50, 0.8)' : 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        
        ctx.beginPath();
        if (gapStartWorld <= gapEndWorld) {
            ctx.ellipse(centerX, screenY, glowRadiusX * 0.92, glowRadiusY * 0.92, 0, gapStartWorld, gapEndWorld, false);
        } else {
            ctx.ellipse(centerX, screenY, glowRadiusX * 0.92, glowRadiusY * 0.92, 0, gapStartWorld, Math.PI * 2, false);
            ctx.moveTo(
                centerX + Math.cos(0) * glowRadiusX * 0.92,
                screenY + Math.sin(0) * glowRadiusY * 0.92
            );
            ctx.ellipse(centerX, screenY, glowRadiusX * 0.92, glowRadiusY * 0.92, 0, 0, gapEndWorld, false);
        }
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.restore();
        
        if (ballInGap) {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.3;
            
            const arrowAngle = Math.PI * 1.5;
            const arrowX = centerX + Math.cos(arrowAngle) * (radiusX * 0.6);
            const arrowY = screenY + Math.sin(arrowAngle) * radiusY;
            
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY - 15);
            ctx.lineTo(arrowX - 10, arrowY);
            ctx.lineTo(arrowX + 10, arrowY);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    },
    
    drawSingleObstacle: function(ctx, x, y, radius, height, perspective, yFactor) {
        ctx.save();
        
        const depthScale = 0.7 + yFactor * 0.3;
        const actualRadius = radius * Math.max(0.6, depthScale);
        
        const sideGradient = ctx.createLinearGradient(x, y - height, x, y);
        sideGradient.addColorStop(0, '#E040FB');
        sideGradient.addColorStop(0.3, '#D500F9');
        sideGradient.addColorStop(0.6, '#AA00FF');
        sideGradient.addColorStop(1, '#7B1FA2');
        
        ctx.fillStyle = sideGradient;
        
        const topRadiusX = actualRadius;
        const topRadiusY = actualRadius * perspective * 0.5;
        const bottomRadiusX = actualRadius * 1.1;
        const bottomRadiusY = actualRadius * perspective * 0.65;
        
        ctx.beginPath();
        ctx.ellipse(x, y, bottomRadiusX, bottomRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x - topRadiusX, y - height);
        ctx.lineTo(x - bottomRadiusX, y);
        ctx.ellipse(x, y, bottomRadiusX, bottomRadiusY, 0, Math.PI, 0, true);
        ctx.lineTo(x + topRadiusX, y - height);
        ctx.ellipse(x, y - height, topRadiusX, topRadiusY, 0, 0, Math.PI, true);
        ctx.fill();
        
        const topGradient = ctx.createRadialGradient(
            x - topRadiusX * 0.25, y - height - topRadiusY * 0.3, 0,
            x, y - height, topRadiusX
        );
        topGradient.addColorStop(0, '#F8BBD9');
        topGradient.addColorStop(0.3, '#F06292');
        topGradient.addColorStop(0.7, '#E040FB');
        topGradient.addColorStop(1, '#9C27B0');
        
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.ellipse(x, y - height, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(
            x - topRadiusX * 0.3,
            y - height - topRadiusY * 0.1,
            topRadiusX * 0.35,
            topRadiusY * 0.4,
            -0.2,
            0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - height, topRadiusX * 0.5, -0.5, 0.5);
        ctx.stroke();
        
        ctx.restore();
    },
    
    lightenColor: function(hexColor, factor) {
        const rgb = this.hexToRgb(hexColor);
        const r = Math.min(255, Math.round(rgb.r * factor + 255 * (1 - factor) * 0.25));
        const g = Math.min(255, Math.round(rgb.g * factor + 255 * (1 - factor) * 0.25));
        const b = Math.min(255, Math.round(rgb.b * factor + 255 * (1 - factor) * 0.25));
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    drawBall: function() {
        if (this.state !== 'playing' && this.state !== 'gameOver') return;
        
        const x = this.ball.screenX;
        const y = this.ball.screenY;
        const radius = this.ball.radius;
        
        this.drawBallShadow(x, y, radius);
        this.drawBallBody(x, y, radius);
        this.drawBallExpression(x, y, radius);
    },
    
    drawBallShadow: function(x, y, radius) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = 0.25;
        
        const shadowY = y + radius * 2.5;
        const shadowRX = radius * 1.4;
        const shadowRY = radius * 0.4;
        
        const shadowGrad = ctx.createRadialGradient(x, shadowY, 0, x, shadowY, shadowRX);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(x, shadowY, shadowRX, shadowRY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawBallBody: function(x, y, radius) {
        const ctx = this.ctx;
        const squash = this.ball.squash;
        const scaleY = squash;
        const scaleX = 2 - squash;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, scaleY);
        
        const bodyGrad = ctx.createRadialGradient(
            -radius * 0.3, -radius * 0.35, 0,
            0, 0, radius
        );
        bodyGrad.addColorStop(0, '#FFF9C4');
        bodyGrad.addColorStop(0.2, '#FFEB3B');
        bodyGrad.addColorStop(0.5, '#FFC107');
        bodyGrad.addColorStop(0.8, '#FF9800');
        bodyGrad.addColorStop(1, '#F57C00');
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        const mainHighlightGrad = ctx.createRadialGradient(
            -radius * 0.25, -radius * 0.3, 0,
            -radius * 0.2, -radius * 0.25, radius * 0.45
        );
        mainHighlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        mainHighlightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        mainHighlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = mainHighlightGrad;
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.25, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        
        const secondaryHighlightGrad = ctx.createRadialGradient(
            radius * 0.15, -radius * 0.4, 0,
            radius * 0.15, -radius * 0.4, radius * 0.2
        );
        secondaryHighlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        secondaryHighlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = secondaryHighlightGrad;
        ctx.beginPath();
        ctx.arc(radius * 0.15, -radius * 0.4, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(230, 120, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },
    
    drawBallExpression: function(x, y, radius) {
        const ctx = this.ctx;
        const expression = this.ball.expression;
        const squash = this.ball.squash;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(2 - squash, squash);
        
        const eyeSpacing = radius * 0.4;
        const eyeY = -radius * 0.1;
        
        switch (expression) {
            case 'normal':
                this.drawCuteEyes(ctx, eyeSpacing, eyeY, radius);
                this.drawCuteMouth(ctx, 0, radius * 0.3, radius);
                break;
            case 'falling':
                this.drawWideEyes(ctx, eyeSpacing, eyeY, radius);
                this.drawOMouth(ctx, 0, radius * 0.38, radius);
                break;
            case 'scared':
                this.drawXXEyes(ctx, eyeSpacing, eyeY, radius);
                this.drawWavyMouth(ctx, 0, radius * 0.38, radius);
                break;
            case 'happy':
                this.drawHappyEyes(ctx, eyeSpacing, eyeY, radius);
                this.drawBigHappyMouth(ctx, 0, radius * 0.28, radius);
                break;
            case 'dead':
                this.drawDeadEyes(ctx, eyeSpacing, eyeY, radius);
                this.drawDeadMouth(ctx, 0, radius * 0.42, radius);
                break;
        }
        
        if (expression !== 'dead') {
            this.drawBlush(ctx, eyeSpacing, radius * 0.12, radius);
        }
        
        ctx.restore();
    },
    
    drawCuteEyes: function(ctx, spacing, y, radius) {
        const eyeSize = radius * 0.26;
        
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.arc(-spacing, y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing, y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-spacing - eyeSize * 0.28, y - eyeSize * 0.35, eyeSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing - eyeSize * 0.28, y - eyeSize * 0.35, eyeSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-spacing + eyeSize * 0.22, y + eyeSize * 0.18, eyeSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing + eyeSize * 0.22, y + eyeSize * 0.18, eyeSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawWideEyes: function(ctx, spacing, y, radius) {
        const eyeSize = radius * 0.32;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-spacing, y, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(spacing, y, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.arc(-spacing, y, eyeSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing, y, eyeSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-spacing - eyeSize * 0.22, y - eyeSize * 0.28, eyeSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing - eyeSize * 0.22, y - eyeSize * 0.28, eyeSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawXXEyes: function(ctx, spacing, y, radius) {
        const eyeSize = radius * 0.3;
        
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(-spacing - eyeSize * 0.45, y - eyeSize * 0.45);
        ctx.lineTo(-spacing + eyeSize * 0.45, y + eyeSize * 0.45);
        ctx.moveTo(-spacing + eyeSize * 0.45, y - eyeSize * 0.45);
        ctx.lineTo(-spacing - eyeSize * 0.45, y + eyeSize * 0.45);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(spacing - eyeSize * 0.45, y - eyeSize * 0.45);
        ctx.lineTo(spacing + eyeSize * 0.45, y + eyeSize * 0.45);
        ctx.moveTo(spacing + eyeSize * 0.45, y - eyeSize * 0.45);
        ctx.lineTo(spacing - eyeSize * 0.45, y + eyeSize * 0.45);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
        ctx.beginPath();
        ctx.arc(-spacing, y, eyeSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing, y, eyeSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawHappyEyes: function(ctx, spacing, y, radius) {
        const eyeSize = radius * 0.28;
        
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(-spacing, y + eyeSize * 0.12, eyeSize * 0.75, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(spacing, y + eyeSize * 0.12, eyeSize * 0.75, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();
        
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.arc(-spacing, y + eyeSize * 0.12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing, y + eyeSize * 0.12, 2.5, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawDeadEyes: function(ctx, spacing, y, radius) {
        const eyeSize = radius * 0.28;
        
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(-spacing, y, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(spacing, y, eyeSize, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-spacing - eyeSize * 0.5, y - eyeSize * 0.35);
        ctx.lineTo(-spacing + eyeSize * 0.5, y + eyeSize * 0.35);
        ctx.moveTo(-spacing + eyeSize * 0.5, y - eyeSize * 0.35);
        ctx.lineTo(-spacing - eyeSize * 0.5, y + eyeSize * 0.35);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(spacing - eyeSize * 0.5, y - eyeSize * 0.35);
        ctx.lineTo(spacing + eyeSize * 0.5, y + eyeSize * 0.35);
        ctx.moveTo(spacing + eyeSize * 0.5, y - eyeSize * 0.35);
        ctx.lineTo(spacing - eyeSize * 0.5, y + eyeSize * 0.35);
        ctx.stroke();
    },
    
    drawCuteMouth: function(ctx, x, y, radius) {
        const mouthSize = radius * 0.24;
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(x, y - mouthSize * 0.35, mouthSize, 0.15, Math.PI - 0.15, false);
        ctx.stroke();
    },
    
    drawOMouth: function(ctx, x, y, radius) {
        const mouthW = radius * 0.18;
        const mouthH = radius * 0.28;
        
        ctx.fillStyle = '#4A2C2A';
        ctx.beginPath();
        ctx.ellipse(x, y, mouthW, mouthH, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x, y + mouthH * 0.25, mouthW * 0.65, mouthH * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawWavyMouth: function(ctx, x, y, radius) {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.22, y);
        ctx.quadraticCurveTo(x - radius * 0.11, y - radius * 0.14, x, y);
        ctx.quadraticCurveTo(x + radius * 0.11, y + radius * 0.14, x + radius * 0.22, y);
        ctx.stroke();
    },
    
    drawBigHappyMouth: function(ctx, x, y, radius) {
        const mouthSize = radius * 0.3;
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(x, y - mouthSize * 0.25, mouthSize, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#CC5555';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, y - mouthSize * 0.25, mouthSize, 0, Math.PI, false);
        ctx.stroke();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(x, y - mouthSize * 0.15, mouthSize * 0.55, mouthSize * 0.35, 0, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x - mouthSize * 0.65, y - mouthSize * 0.25);
        ctx.lineTo(x - mouthSize * 0.28, y - mouthSize * 0.6);
        ctx.lineTo(x + mouthSize * 0.28, y - mouthSize * 0.6);
        ctx.lineTo(x + mouthSize * 0.65, y - mouthSize * 0.25);
        ctx.closePath();
        ctx.fill();
    },
    
    drawDeadMouth: function(ctx, x, y, radius) {
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 2.2;
        
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.12, radius * 0.2, Math.PI, 0, false);
        ctx.stroke();
    },
    
    drawBlush: function(ctx, spacing, y, radius) {
        const blushSpacing = spacing * 1.45;
        const blushSize = radius * 0.24;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        const leftGrad = ctx.createRadialGradient(
            -blushSpacing, y, 0,
            -blushSpacing, y, blushSize
        );
        leftGrad.addColorStop(0, '#FF9999');
        leftGrad.addColorStop(0.5, '#FFB6C1');
        leftGrad.addColorStop(1, 'rgba(255, 182, 193, 0)');
        
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.ellipse(-blushSpacing, y, blushSize, blushSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const rightGrad = ctx.createRadialGradient(
            blushSpacing, y, 0,
            blushSpacing, y, blushSize
        );
        rightGrad.addColorStop(0, '#FF9999');
        rightGrad.addColorStop(0.5, '#FFB6C1');
        rightGrad.addColorStop(1, 'rgba(255, 182, 193, 0)');
        
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.ellipse(blushSpacing, y, blushSize, blushSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawParticles: function() {
        const ctx = this.ctx;
        
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, p.color);
            grad.addColorStop(1, this.lightenColor(p.color, 1.3));
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    },
    
    drawFloatTexts: function() {
        const ctx = this.ctx;
        
        for (const t of this.floatTexts) {
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            ctx.font = `bold ${Math.round(24 * t.scale)}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillText(t.text, t.x, t.y);
            
            ctx.restore();
        }
    },
    
    gameLoop: function() {
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
};

window.addEventListener('load', () => {
    Game.init();
});

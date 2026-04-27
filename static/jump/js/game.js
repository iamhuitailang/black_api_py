const JumpGame = (function() {
    'use strict';
    
    const CONFIG = {
        canvasWidth: 800,
        canvasHeight: 600,
        maxChargeTime: 1500,
        gravity: 0.5,
        maxJumpDistance: 350,
        minJumpDistance: 60,
        perfectRange: 20,
        goodRange: 50,
        baseScore: 2,
        timedModeDuration: 60,
        platformBaseWidth: 100,
        platformHeight: 25,
        platformTypes: {
            normal: {
                name: 'normal',
                color: '#4ade80',
                widthMultiplier: 1,
                moveSpeed: 0,
                scoreMultiplier: 1,
                emoji: '🌿'
            },
            moving: {
                name: 'moving',
                color: '#60a5fa',
                widthMultiplier: 1.3,
                moveSpeed: 1.5,
                moveRange: 60,
                scoreMultiplier: 1.5,
                emoji: '💨'
            },
            narrow: {
                name: 'narrow',
                color: '#fb923c',
                widthMultiplier: 0.55,
                moveSpeed: 0,
                scoreMultiplier: 2,
                emoji: '🔥'
            }
        }
    };
    
    let gameState = {
        score: 0,
        combo: 0,
        highScore: 0,
        isGameOver: false,
        isCharging: false,
        chargeTime: 0,
        maxChargeTime: CONFIG.maxChargeTime,
        gameMode: 'endless',
        timeLeft: CONFIG.timedModeDuration,
        isPaused: false,
        isPlaying: false,
        startTime: 0,
        elapsedTime: 0
    };
    
    let canvas, ctx;
    let player = null;
    let platforms = [];
    let currentPlatformIndex = 0;
    let animationId = null;
    let lastTime = 0;
    let chargeStartTime = 0;
    let timerInterval = null;
    let camera = { x: 0, y: 0 };
    let platformStartX = 0;
    
    const DOM = {
        canvas: null,
        scoreDisplay: null,
        currentScore: null,
        highScore: null,
        timeDisplay: null,
        timeLeft: null,
        chargeBarContainer: null,
        chargeProgress: null,
        comboDisplay: null,
        startMenu: null,
        pauseMenu: null,
        gameOverMenu: null,
        controlButtons: null,
        overlay: null,
        failOverlay: null,
        finalScore: null,
        newRecord: null,
        endlessBtn: null,
        timedBtn: null,
        resumeBtn: null,
        restartBtn: null,
        restartFromPauseBtn: null,
        backToMenuBtn: null,
        pauseBtn: null
    };
    
    function init() {
        initDOM();
        initCanvas();
        tryLoadGameState();
        bindEvents();
        gameLoop();
    }
    
    function initDOM() {
        DOM.canvas = document.getElementById('gameCanvas');
        DOM.scoreDisplay = document.getElementById('scoreDisplay');
        DOM.currentScore = document.getElementById('currentScore');
        DOM.highScore = document.getElementById('highScore');
        DOM.timeDisplay = document.getElementById('timeDisplay');
        DOM.timeLeft = document.getElementById('timeLeft');
        DOM.chargeBarContainer = document.getElementById('chargeBarContainer');
        DOM.chargeProgress = document.getElementById('chargeProgress');
        DOM.comboDisplay = document.getElementById('comboDisplay');
        DOM.startMenu = document.getElementById('startMenu');
        DOM.pauseMenu = document.getElementById('pauseMenu');
        DOM.gameOverMenu = document.getElementById('gameOverMenu');
        DOM.controlButtons = document.getElementById('controlButtons');
        DOM.overlay = document.getElementById('overlay');
        DOM.failOverlay = document.getElementById('failOverlay');
        DOM.finalScore = document.getElementById('finalScore');
        DOM.newRecord = document.getElementById('newRecord');
        DOM.endlessBtn = document.getElementById('endlessBtn');
        DOM.timedBtn = document.getElementById('timedBtn');
        DOM.resumeBtn = document.getElementById('resumeBtn');
        DOM.restartBtn = document.getElementById('restartBtn');
        DOM.restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
        DOM.backToMenuBtn = document.getElementById('backToMenuBtn');
        DOM.pauseBtn = document.getElementById('pauseBtn');
    }
    
    function initCanvas() {
        canvas = DOM.canvas;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    function bindEvents() {
        DOM.endlessBtn.addEventListener('click', () => startGame('endless'));
        DOM.timedBtn.addEventListener('click', () => startGame('timed'));
        DOM.resumeBtn.addEventListener('click', resumeGame);
        DOM.restartBtn.addEventListener('click', () => startGame(gameState.gameMode));
        DOM.restartFromPauseBtn.addEventListener('click', () => startGame(gameState.gameMode));
        DOM.backToMenuBtn.addEventListener('click', backToMenu);
        DOM.pauseBtn.addEventListener('click', pauseGame);
        
        canvas.addEventListener('mousedown', handleInputStart);
        canvas.addEventListener('mouseup', handleInputEnd);
        canvas.addEventListener('mouseleave', handleInputEnd);
        
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchEnd);
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && gameState.isPlaying && !gameState.isPaused) {
                e.preventDefault();
                handleInputStart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && gameState.isCharging) {
                handleInputEnd();
            }
        });
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        handleInputStart();
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        handleInputEnd();
    }
    
    function handleInputStart() {
        if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver || 
            gameState.isCharging || player.isJumping || player.isFalling) {
            return;
        }
        
        gameState.isCharging = true;
        chargeStartTime = performance.now();
        DOM.chargeBarContainer.classList.add('active');
    }
    
    function handleInputEnd() {
        if (!gameState.isCharging) {
            return;
        }
        
        gameState.isCharging = false;
        const currentTime = performance.now();
        gameState.chargeTime = Math.min(currentTime - chargeStartTime, CONFIG.maxChargeTime);
        DOM.chargeBarContainer.classList.remove('active');
        
        jump();
    }
    
    function jump() {
        if (gameState.isGameOver || player.isFalling || player.isJumping) return;
        
        const chargeRatio = gameState.chargeTime / CONFIG.maxChargeTime;
        const jumpPower = CONFIG.minJumpDistance + chargeRatio * (CONFIG.maxJumpDistance - CONFIG.minJumpDistance);
        
        const currentPlatform = platforms[currentPlatformIndex];
        const nextPlatform = platforms[currentPlatformIndex + 1];
        
        if (!nextPlatform) {
            generateMorePlatforms();
            return jump();
        }
        
        const targetX = currentPlatform.x + jumpPower;
        
        player.startJumping(targetX, jumpPower, nextPlatform);
    }
    
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.radius = 28;
            this.isJumping = false;
            this.jumpStartX = x;
            this.jumpStartY = y;
            this.jumpTargetX = x;
            this.jumpDistance = 0;
            this.jumpProgress = 0;
            this.maxHeight = 0;
            this.targetPlatform = null;
            this.isFalling = false;
            this.fallVelocity = 0;
            this.squash = 1;
            this.stretch = 1;
            this.rotation = 0;
            this.blinkTimer = 0;
            this.isBlinking = false;
        }
        
        startJumping(targetX, distance, targetPlatform) {
            this.isJumping = true;
            this.jumpStartX = this.x;
            this.jumpStartY = this.y;
            this.jumpTargetX = targetX;
            this.jumpDistance = distance;
            this.jumpProgress = 0;
            this.maxHeight = Math.min(140, distance * 0.45);
            this.targetPlatform = targetPlatform;
            this.isFalling = false;
            this.fallVelocity = 0;
            this.stretch = 1.3;
            this.squash = 0.8;
        }
        
        update(deltaTime) {
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 3000 && !this.isBlinking) {
                this.isBlinking = true;
                setTimeout(() => {
                    this.isBlinking = false;
                    this.blinkTimer = 0;
                }, 150);
            }
            
            if (this.isFalling) {
                this.fallVelocity += CONFIG.gravity;
                this.y += this.fallVelocity;
                this.rotation += 0.15;
                this.squash = 0.9;
                this.stretch = 1.1;
                
                if (this.y > canvas.height + 200) {
                    gameOver();
                }
                return;
            }
            
            if (!this.isJumping) {
                if (this.squash > 1) {
                    this.squash -= 0.08;
                    if (this.squash < 1) this.squash = 1;
                }
                if (this.stretch > 1) {
                    this.stretch -= 0.08;
                    if (this.stretch < 1) this.stretch = 1;
                }
                return;
            }
            
            this.jumpProgress += deltaTime / (350 + this.jumpDistance * 0.4);
            
            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.checkLanding();
            }
            
            const t = this.jumpProgress;
            this.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * t;
            
            const jumpHeight = Math.sin(t * Math.PI) * this.maxHeight;
            this.y = this.jumpStartY - jumpHeight;
            
            if (t < 0.3) {
                this.stretch = 1.3 - t * 0.5;
                this.squash = 0.8 + t * 0.3;
            } else if (t > 0.7) {
                this.stretch = 0.9 + (1 - t) * 0.5;
                this.squash = 1.1 + (t - 0.7) * 0.8;
            }
            
            if (t < 0.5) {
                this.rotation = t * 0.4;
            } else {
                this.rotation = (1 - t) * 0.4;
            }
        }
        
        checkLanding() {
            const platform = this.targetPlatform;
            const platformLeft = platform.x - platform.width / 2;
            const platformRight = platform.x + platform.width / 2;
            const platformTop = platform.y - platform.height;
            
            const distFromCenter = Math.abs(this.x - platform.x);
            const onPlatform = this.x >= platformLeft && this.x <= platformRight;
            
            if (onPlatform) {
                this.isJumping = false;
                this.y = platformTop;
                this.baseY = platformTop;
                this.squash = 1.2;
                this.stretch = 0.85;
                
                currentPlatformIndex++;
                
                if (distFromCenter <= CONFIG.perfectRange) {
                    showPerfect();
                    gameState.combo++;
                    const baseScore = CONFIG.baseScore * gameState.combo;
                    const platformMultiplier = platform.type.scoreMultiplier;
                    gameState.score += Math.floor(baseScore * platformMultiplier);
                    showCombo(gameState.combo);
                } else if (distFromCenter <= CONFIG.goodRange) {
                    gameState.combo = 0;
                    gameState.score += Math.floor(CONFIG.baseScore * platform.type.scoreMultiplier);
                } else {
                    gameState.combo = 0;
                    gameState.score += 1;
                }
                
                updateScoreDisplay();
                generateMorePlatforms();
                saveGameState();
            } else {
                this.isJumping = false;
                this.isFalling = true;
                this.fallVelocity = 1;
            }
        }
        
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.squash, this.stretch);
            
            ctx.beginPath();
            ctx.ellipse(3, -this.radius * 0.1, this.radius * 1.15, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fill();
            
            this.drawLeg(ctx, -this.radius * 0.5, -this.radius * 0.1, true);
            this.drawLeg(ctx, this.radius * 0.5, -this.radius * 0.1, false);
            
            const bodyGradient = ctx.createRadialGradient(
                -this.radius * 0.3, -this.radius * 0.7, this.radius * 0.2,
                0, -this.radius * 0.3, this.radius * 1.1
            );
            bodyGradient.addColorStop(0, '#86efac');
            bodyGradient.addColorStop(0.3, '#4ade80');
            bodyGradient.addColorStop(0.7, '#22c55e');
            bodyGradient.addColorStop(1, '#15803d');
            
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.3, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = bodyGradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(-this.radius * 0.2, -this.radius * 0.5, this.radius * 0.45, this.radius * 0.3, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
            
            const eyeOffsetY = -this.radius * 0.85;
            const eyeSpacing = this.radius * 0.45;
            const eyeSize = this.radius * 0.35;
            
            this.drawEye(ctx, -eyeSpacing, eyeOffsetY, eyeSize);
            this.drawEye(ctx, eyeSpacing, eyeOffsetY, eyeSize);
            
            this.drawMouth(ctx);
            this.drawCheek(ctx, -this.radius * 0.65, -this.radius * 0.35);
            this.drawCheek(ctx, this.radius * 0.65, -this.radius * 0.35);
            
            ctx.restore();
        }
        
        drawLeg(ctx, x, y, isLeft) {
            ctx.save();
            ctx.translate(x, y);
            
            const legGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
            legGradient.addColorStop(0, '#86efac');
            legGradient.addColorStop(1, '#15803d');
            
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(-8, 0);
                ctx.quadraticCurveTo(-15, 8, -12, 12);
                ctx.quadraticCurveTo(-5, 15, 0, 10);
                ctx.quadraticCurveTo(3, 5, -3, 2);
            } else {
                ctx.moveTo(8, 0);
                ctx.quadraticCurveTo(15, 8, 12, 12);
                ctx.quadraticCurveTo(5, 15, 0, 10);
                ctx.quadraticCurveTo(-3, 5, 3, 2);
            }
            ctx.closePath();
            ctx.fillStyle = legGradient;
            ctx.fill();
            
            ctx.restore();
        }
        
        drawEye(ctx, x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            
            const eyeBgGradient = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size);
            eyeBgGradient.addColorStop(0, '#ffffff');
            eyeBgGradient.addColorStop(1, '#f0fdf4');
            
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 1.1, 0, 0, Math.PI * 2);
            ctx.fillStyle = eyeBgGradient;
            ctx.fill();
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            if (this.isBlinking) {
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.5, 0, Math.PI);
                ctx.fillStyle = '#15803d';
                ctx.fill();
            } else {
                const pupilSize = size * 0.55;
                const pupilOffsetX = (this.x - this.jumpStartX) * 0.008;
                const clampedOffsetX = Math.max(-size * 0.2, Math.min(size * 0.2, pupilOffsetX));
                
                const pupilGradient = ctx.createRadialGradient(
                    clampedOffsetX, 1, pupilSize * 0.3,
                    clampedOffsetX, 1, pupilSize
                );
                pupilGradient.addColorStop(0, '#166534');
                pupilGradient.addColorStop(1, '#052e16');
                
                ctx.beginPath();
                ctx.arc(clampedOffsetX, 1, pupilSize, 0, Math.PI * 2);
                ctx.fillStyle = pupilGradient;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(clampedOffsetX - pupilSize * 0.25, -pupilSize * 0.2, pupilSize * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(clampedOffsetX + pupilSize * 0.15, pupilSize * 0.1, pupilSize * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        drawMouth(ctx) {
            ctx.save();
            ctx.translate(0, -this.radius * 0.15);
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.35, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.05, this.radius * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
            ctx.fill();
            
            ctx.restore();
        }
        
        drawCheek(ctx, x, y) {
            ctx.save();
            
            const cheekGradient = ctx.createRadialGradient(x, y, 0, x, y, this.radius * 0.25);
            cheekGradient.addColorStop(0, 'rgba(251, 113, 133, 0.5)');
            cheekGradient.addColorStop(1, 'rgba(251, 113, 133, 0)');
            
            ctx.beginPath();
            ctx.arc(x, y, this.radius * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = cheekGradient;
            ctx.fill();
            
            ctx.restore();
        }
        
        serialize() {
            return {
                x: this.x,
                y: this.y,
                baseY: this.baseY,
                radius: this.radius,
                isJumping: this.isJumping,
                jumpStartX: this.jumpStartX,
                jumpStartY: this.jumpStartY,
                jumpTargetX: this.jumpTargetX,
                jumpDistance: this.jumpDistance,
                jumpProgress: this.jumpProgress,
                maxHeight: this.maxHeight,
                isFalling: this.isFalling,
                fallVelocity: this.fallVelocity,
                squash: this.squash,
                stretch: this.stretch,
                rotation: this.rotation
            };
        }
        
        static deserialize(data) {
            const p = new Player(data.x, data.y);
            p.baseY = data.baseY;
            p.radius = data.radius;
            p.isJumping = data.isJumping;
            p.jumpStartX = data.jumpStartX;
            p.jumpStartY = data.jumpStartY;
            p.jumpTargetX = data.jumpTargetX;
            p.jumpDistance = data.jumpDistance;
            p.jumpProgress = data.jumpProgress;
            p.maxHeight = data.maxHeight;
            p.isFalling = data.isFalling;
            p.fallVelocity = data.fallVelocity;
            p.squash = data.squash;
            p.stretch = data.stretch;
            p.rotation = data.rotation;
            return p;
        }
    }
    
    class Platform {
        constructor(x, y, type, width = CONFIG.platformBaseWidth, height = CONFIG.platformHeight) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = width * type.widthMultiplier;
            this.height = height;
            this.radius = 12;
            this.startX = x;
            this.direction = 1;
            this.animOffset = Math.random() * Math.PI * 2;
        }
        
        update(deltaTime) {
            if (this.type.name === 'moving' && this.type.moveSpeed > 0) {
                this.x += this.type.moveSpeed * this.direction;
                
                if (this.x > this.startX + this.type.moveRange) {
                    this.direction = -1;
                } else if (this.x < this.startX - this.type.moveRange) {
                    this.direction = 1;
                }
            }
            
            this.animOffset += deltaTime * 0.003;
        }
        
        draw(ctx) {
            ctx.save();
            
            const bounceOffset = Math.sin(this.animOffset) * 1;
            
            const shadowOffset = 6;
            ctx.beginPath();
            this.roundRect(
                ctx,
                this.x - this.width / 2 + shadowOffset,
                this.y - this.height + shadowOffset + bounceOffset,
                this.width,
                this.height,
                this.radius
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fill();
            
            const mainGradient = ctx.createLinearGradient(
                this.x, this.y - this.height + bounceOffset,
                this.x, this.y + bounceOffset
            );
            
            const baseColor = this.type.color;
            mainGradient.addColorStop(0, this.lightenColor(baseColor, 30));
            mainGradient.addColorStop(0.3, this.lightenColor(baseColor, 10));
            mainGradient.addColorStop(0.7, baseColor);
            mainGradient.addColorStop(1, this.darkenColor(baseColor, 25));
            
            ctx.beginPath();
            this.roundRect(
                ctx,
                this.x - this.width / 2,
                this.y - this.height + bounceOffset,
                this.width,
                this.height,
                this.radius
            );
            ctx.fillStyle = mainGradient;
            ctx.fill();
            
            ctx.beginPath();
            this.roundRect(
                ctx,
                this.x - this.width / 2 + 6,
                this.y - this.height + 4 + bounceOffset,
                this.width - 12,
                this.height / 3,
                this.radius - 4
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.height / 2 + bounceOffset, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
            
            ctx.font = `${Math.min(16, this.width * 0.15)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.6;
            ctx.fillText(this.type.emoji, this.x, this.y - this.height / 2 + bounceOffset);
            ctx.globalAlpha = 1;
            
            ctx.restore();
        }
        
        roundRect(ctx, x, y, width, height, radius) {
            const r = Math.min(radius, width / 2, height / 2);
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + width - r, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + r);
            ctx.lineTo(x + width, y + height - r);
            ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
            ctx.lineTo(x + r, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
        }
        
        lightenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, (num >> 16) + amt);
            const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
            const B = Math.min(255, (num & 0x0000FF) + amt);
            return `rgb(${R}, ${G}, ${B})`;
        }
        
        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return `rgb(${R}, ${G}, ${B})`;
        }
        
        serialize() {
            return {
                x: this.x,
                y: this.y,
                typeName: this.type.name,
                width: this.width,
                height: this.height,
                startX: this.startX,
                direction: this.direction
            };
        }
        
        static deserialize(data) {
            const type = CONFIG.platformTypes[data.typeName] || CONFIG.platformTypes.normal;
            const p = new Platform(data.x, data.y, type, data.width / type.widthMultiplier, data.height);
            p.startX = data.startX;
            p.direction = data.direction;
            return p;
        }
    }
    
    function generateMorePlatforms() {
        while (platforms.length <= currentPlatformIndex + 5) {
            const lastPlatform = platforms[platforms.length - 1];
            const distance = 80 + Math.random() * 200;
            const newX = lastPlatform.x + distance;
            
            let yVariation = 0;
            if (platforms.length > 5) {
                yVariation = (Math.random() - 0.5) * 40;
            }
            const newY = Math.max(canvas.height * 0.5, Math.min(canvas.height * 0.85, lastPlatform.y + yVariation));
            
            const typeRoll = Math.random();
            let platformType;
            
            if (platforms.length < 4) {
                platformType = CONFIG.platformTypes.normal;
            } else if (typeRoll < 0.45) {
                platformType = CONFIG.platformTypes.normal;
            } else if (typeRoll < 0.75) {
                platformType = CONFIG.platformTypes.moving;
            } else {
                platformType = CONFIG.platformTypes.narrow;
            }
            
            const newPlatform = new Platform(newX, newY, platformType);
            platforms.push(newPlatform);
        }
        
        if (currentPlatformIndex > 3) {
            platforms.splice(0, currentPlatformIndex - 2);
            currentPlatformIndex = 2;
        }
    }
    
    function updateCamera() {
        const targetX = player.x - canvas.width * 0.35;
        camera.x += (targetX - camera.x) * 0.08;
    }
    
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(0.3, '#dcfce7');
        gradient.addColorStop(0.7, '#bbf7d0');
        gradient.addColorStop(1, '#fef9c3');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.lineWidth = 1;
        
        const gridSize = 60;
        const offsetX = -camera.x % gridSize;
        const offsetY = -camera.y % gridSize;
        
        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        drawDecorations();
    }
    
    function drawDecorations() {
        const time = performance.now() * 0.001;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 6; i++) {
            const cloudX = ((i * 280 + time * 15 - camera.x * 0.08) % (canvas.width + 250)) - 120;
            const cloudY = 40 + i * 25 + Math.sin(time + i) * 5;
            drawCloud(ctx, cloudX, cloudY, 25 + i * 6);
        }
        
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        for (let i = 0; i < 15; i++) {
            const grassX = ((i * 120 + time * 5 - camera.x * 0.02) % (canvas.width + 150)) - 50;
            const grassY = canvas.height - 30 + Math.sin(time * 2 + i * 0.7) * 5;
            drawGrass(ctx, grassX, grassY);
        }
    }
    
    function drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
        ctx.arc(x + size * 0.55, y - size * 0.25, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 1.1, y, size * 0.55, 0, Math.PI * 2);
        ctx.arc(x + size * 0.55, y + size * 0.15, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawGrass(ctx, x, y) {
        const time = performance.now() * 0.001;
        for (let i = 0; i < 5; i++) {
            const offsetX = (i - 2) * 6;
            const sway = Math.sin(time * 2 + i * 0.5 + x * 0.01) * 3;
            
            ctx.beginPath();
            ctx.moveTo(x + offsetX, y);
            ctx.quadraticCurveTo(
                x + offsetX + sway,
                y - 15,
                x + offsetX + sway * 1.5,
                y - 25 - Math.random() * 10
            );
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
    
    function updateScoreDisplay() {
        DOM.currentScore.textContent = gameState.score;
        DOM.highScore.textContent = gameState.highScore;
    }
    
    function updateChargeBar() {
        if (!gameState.isCharging) return;
        
        const currentTime = performance.now();
        gameState.chargeTime = Math.min(currentTime - chargeStartTime, CONFIG.maxChargeTime);
        const chargeRatio = gameState.chargeTime / CONFIG.maxChargeTime;
        
        const rotation = -90 + chargeRatio * 360;
        DOM.chargeProgress.style.transform = `rotate(${rotation}deg)`;
    }
    
    function showPerfect() {
        const effectDiv = document.createElement('div');
        effectDiv.className = 'perfect-effect';
        effectDiv.innerHTML = '<div class="glow-effect"></div><div class="perfect-text">Perfect!</div>';
        document.querySelector('.game-container').appendChild(effectDiv);
        
        DOM.overlay.classList.add('shake');
        
        setTimeout(() => {
            if (effectDiv.parentNode) {
                effectDiv.parentNode.removeChild(effectDiv);
            }
            DOM.overlay.classList.remove('shake');
        }, 1000);
    }
    
    function showCombo(count) {
        if (count < 2) return;
        
        DOM.comboDisplay.textContent = `${count}连击!`;
        DOM.comboDisplay.classList.remove('show');
        void DOM.comboDisplay.offsetWidth;
        DOM.comboDisplay.classList.add('show');
    }
    
    function startGame(mode, fromSave = false) {
        if (!fromSave) {
            gameState.score = 0;
            gameState.combo = 0;
            gameState.isGameOver = false;
            gameState.isCharging = false;
            gameState.chargeTime = 0;
            gameState.gameMode = mode;
            gameState.timeLeft = CONFIG.timedModeDuration;
            gameState.isPaused = false;
            gameState.isPlaying = true;
            gameState.startTime = performance.now();
            gameState.elapsedTime = 0;
            
            platforms = [];
            currentPlatformIndex = 0;
            camera = { x: 0, y: 0 };
            
            const startPlatform = new Platform(canvas.width * 0.25, canvas.height * 0.7, CONFIG.platformTypes.normal);
            platforms.push(startPlatform);
            platformStartX = startPlatform.x;
            
            player = new Player(
                startPlatform.x,
                startPlatform.y - startPlatform.height
            );
            
            generateMorePlatforms();
        }
        
        DOM.startMenu.style.display = 'none';
        DOM.pauseMenu.style.display = 'none';
        DOM.gameOverMenu.style.display = 'none';
        DOM.controlButtons.style.display = 'block';
        
        if (gameState.gameMode === 'timed') {
            DOM.timeDisplay.style.display = 'block';
            DOM.timeLeft.textContent = Math.ceil(gameState.timeLeft);
            if (gameState.timeLeft <= 10) {
                DOM.timeLeft.classList.add('warning');
            } else {
                DOM.timeLeft.classList.remove('warning');
            }
            startTimer();
        } else {
            DOM.timeDisplay.style.display = 'none';
        }
        
        updateScoreDisplay();
        saveGameState();
    }
    
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            if (gameState.isPaused || gameState.isGameOver || !gameState.isPlaying) {
                return;
            }
            
            gameState.timeLeft -= 1;
            DOM.timeLeft.textContent = Math.ceil(gameState.timeLeft);
            
            if (gameState.timeLeft <= 10) {
                DOM.timeLeft.classList.add('warning');
            }
            
            if (gameState.timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                gameOver();
            }
            
            saveGameState();
        }, 1000);
    }
    
    function pauseGame() {
        if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) {
            return;
        }
        
        gameState.isPaused = true;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        DOM.pauseMenu.style.display = 'block';
        DOM.controlButtons.style.display = 'none';
        saveGameState();
    }
    
    function resumeGame() {
        gameState.isPaused = false;
        restoreGameUI();
        
        if (gameState.gameMode === 'timed') {
            startTimer();
        }
        
        saveGameState();
    }
    
    function backToMenu() {
        gameState.isPlaying = false;
        gameState.isPaused = false;
        gameState.isGameOver = false;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        localStorage.removeItem('jumpGame_running');
        
        DOM.startMenu.style.display = 'block';
        DOM.pauseMenu.style.display = 'none';
        DOM.gameOverMenu.style.display = 'none';
        DOM.controlButtons.style.display = 'none';
        DOM.timeDisplay.style.display = 'none';
    }
    
    function gameOver() {
        gameState.isGameOver = true;
        gameState.isPlaying = false;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        const isNewRecord = gameState.score > gameState.highScore;
        if (isNewRecord) {
            gameState.highScore = gameState.score;
        }
        
        DOM.failOverlay.classList.add('active');
        
        setTimeout(() => {
            DOM.failOverlay.classList.remove('active');
            DOM.gameOverMenu.style.display = 'block';
            DOM.controlButtons.style.display = 'none';
            DOM.finalScore.textContent = gameState.score;
            
            if (isNewRecord) {
                DOM.newRecord.style.display = 'block';
            } else {
                DOM.newRecord.style.display = 'none';
            }
            
            updateScoreDisplay();
            localStorage.removeItem('jumpGame_running');
            saveGameState();
        }, 800);
    }
    
    function saveGameState() {
        const saveData = {
            highScore: gameState.highScore,
            timestamp: Date.now()
        };
        
        localStorage.setItem('jumpGame_save', JSON.stringify(saveData));
        
        if (gameState.isPlaying && !gameState.isGameOver && player) {
            const runningData = {
                score: gameState.score,
                combo: gameState.combo,
                gameMode: gameState.gameMode,
                timeLeft: gameState.timeLeft,
                isPaused: gameState.isPaused,
                isPlaying: gameState.isPlaying,
                currentPlatformIndex: currentPlatformIndex,
                camera: camera,
                platformStartX: platformStartX,
                player: player.serialize(),
                platforms: platforms.map(p => p.serialize()),
                timestamp: Date.now()
            };
            
            localStorage.setItem('jumpGame_running', JSON.stringify(runningData));
        }
    }
    
    function loadGameState() {
        const saved = localStorage.getItem('jumpGame_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                gameState.highScore = data.highScore || 0;
                updateScoreDisplay();
            } catch (e) {
                console.error('Failed to load game state:', e);
            }
        }
    }
    
    function restoreGameUI() {
        DOM.startMenu.style.display = 'none';
        DOM.pauseMenu.style.display = gameState.isPaused ? 'block' : 'none';
        DOM.gameOverMenu.style.display = 'none';
        DOM.controlButtons.style.display = gameState.isPaused ? 'none' : 'block';
        
        if (gameState.gameMode === 'timed') {
            DOM.timeDisplay.style.display = 'block';
            DOM.timeLeft.textContent = Math.ceil(gameState.timeLeft);
            if (gameState.timeLeft <= 10) {
                DOM.timeLeft.classList.add('warning');
            } else {
                DOM.timeLeft.classList.remove('warning');
            }
        } else {
            DOM.timeDisplay.style.display = 'none';
        }
        
        updateScoreDisplay();
    }
    
    function tryLoadGameState() {
        loadGameState();
        
        const running = localStorage.getItem('jumpGame_running');
        if (running) {
            try {
                const data = JSON.parse(running);
                
                const age = Date.now() - data.timestamp;
                if (age > 5 * 60 * 1000) {
                    localStorage.removeItem('jumpGame_running');
                    return;
                }
                
                gameState.score = data.score || 0;
                gameState.combo = data.combo || 0;
                gameState.gameMode = data.gameMode || 'endless';
                gameState.timeLeft = data.timeLeft || CONFIG.timedModeDuration;
                gameState.isPaused = data.isPaused || false;
                gameState.isPlaying = data.isPlaying || true;
                gameState.isGameOver = false;
                currentPlatformIndex = data.currentPlatformIndex || 0;
                camera = data.camera || { x: 0, y: 0 };
                platformStartX = data.platformStartX || 0;
                
                if (data.player) {
                    player = Player.deserialize(data.player);
                }
                
                if (data.platforms && Array.isArray(data.platforms)) {
                    platforms = data.platforms.map(pd => Platform.deserialize(pd));
                }
                
                restoreGameUI();
                
                if (!gameState.isPaused && gameState.gameMode === 'timed') {
                    startTimer();
                }
                
            } catch (e) {
                console.error('Failed to load running game state:', e);
                localStorage.removeItem('jumpGame_running');
            }
        }
    }
    
    function gameLoop(timestamp = 0) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update(deltaTime);
        render();
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function update(deltaTime) {
        if (gameState.isPaused || !gameState.isPlaying) {
            return;
        }
        
        updateChargeBar();
        
        for (const platform of platforms) {
            platform.update(deltaTime);
        }
        
        if (player) {
            player.update(deltaTime);
            if (!player.isFalling) {
                updateCamera();
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        
        if (gameState.isPlaying || gameState.isGameOver) {
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            
            for (const platform of platforms) {
                platform.draw(ctx);
            }
            
            if (player) {
                player.draw(ctx);
            }
            
            ctx.restore();
        }
    }
    
    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    JumpGame.init();
});

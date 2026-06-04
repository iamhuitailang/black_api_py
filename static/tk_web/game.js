class SpaceRunner {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = 'menu';
        this.currentLevel = 0;
        this.distance = 0;
        this.crystals = 0;
        this.lives = 3;
        this.boost = 0;
        this.isBoosting = false;
        this.gameSpeed = 5;
        this.baseSpeed = 5;
        
        this.player = {
            x: 100,
            y: 0,
            width: 45,
            height: 65,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            groundY: 0,
            jumpForce: -15,
            gravity: 0.6,
            animFrame: 0
        };
        
        this.resizeCanvas();
        
        this.obstacles = [];
        this.crystalItems = [];
        this.particles = [];
        this.backgroundElements = [];
        
        this.levels = this.initLevels();
        
        this.lastObstacleTime = 0;
        this.lastCrystalTime = 0;
        this.animationId = null;
        this.saveInterval = null;
        
        this.bindEvents();
        this.updateLevelUI();
        this.checkAndRestoreGame();
    }
    
    checkAndRestoreGame() {
        const savedState = this.loadGameState();
        if (savedState && savedState.gameState === 'playing') {
            const shouldRestore = confirm('检测到未完成的游戏进度，是否继续？\n\n' +
                `关卡: ${this.levels[savedState.currentLevel].name}\n` +
                `距离: ${Math.floor(savedState.distance)}m\n` +
                `晶体: ${savedState.crystals}\n` +
                `生命: ${savedState.lives}`);
            if (shouldRestore) {
                this.currentLevel = savedState.currentLevel;
                this.restoreGameState(savedState);
                this.showScreen('game-screen');
                this.gameState = 'playing';
                this.gameLoop();
                this.startAutoSave();
            } else {
                this.clearGameState();
            }
        }
    }
    
    initLevels() {
        return [
            {
                name: '沙漠星球',
                icon: '🏜️',
                targetDistance: 500,
                targetCrystals: 10,
                bgColor1: '#1a0a00',
                bgColor2: '#8B4513',
                groundColor: '#D2691E',
                skyColor: '#DEB887',
                obstacles: ['sandstorm', 'quicksand', 'cactus'],
                enemies: ['sandworm'],
                speed: 5
            },
            {
                name: '丛林星球',
                icon: '🌴',
                targetDistance: 700,
                targetCrystals: 15,
                bgColor1: '#051a05',
                bgColor2: '#228B22',
                groundColor: '#2E8B57',
                skyColor: '#90EE90',
                obstacles: ['vine', 'flytrap', 'log'],
                enemies: ['junglebeast'],
                speed: 6
            },
            {
                name: '冰雪星球',
                icon: '❄️',
                targetDistance: 900,
                targetCrystals: 20,
                bgColor1: '#0a1628',
                bgColor2: '#4169E1',
                groundColor: '#B0E0E6',
                skyColor: '#E0FFFF',
                obstacles: ['iceberg', 'avalanche', 'icicle'],
                enemies: ['frostmonster'],
                speed: 7
            },
            {
                name: '机械星球',
                icon: '🤖',
                targetDistance: 1200,
                targetCrystals: 25,
                bgColor1: '#1a1a2e',
                bgColor2: '#4a4a6a',
                groundColor: '#696969',
                skyColor: '#6366f1',
                obstacles: ['laser', 'spike', 'barrier'],
                enemies: ['robot'],
                speed: 8
            }
        ];
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 80;
        this.player.groundY = this.canvas.height - 100;
        this.player.y = this.player.groundY - this.player.height;
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('beforeunload', () => this.saveFullProgress());
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.canvas.addEventListener('click', () => this.jump());
        this.canvas.addEventListener('touchstart', () => this.jump());
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('level-select-btn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('start-screen'));
        
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const level = parseInt(card.dataset.level);
                this.selectLevel(level);
            });
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('retry-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('complete-menu-btn').addEventListener('click', () => this.quitToMenu());
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.jump();
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            this.slide(true);
        } else if (e.code === 'Escape') {
            this.pauseGame();
        }
    }
    
    handleKeyUp(e) {
        if (e.code === 'ArrowDown') {
            this.slide(false);
        }
    }
    
    jump() {
        if (this.gameState !== 'playing') return;
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.velocityY = this.player.jumpForce;
            this.player.isJumping = true;
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, '#00ffff', 5);
        }
    }
    
    slide(isSliding) {
        if (this.gameState !== 'playing') return;
        if (!this.player.isJumping) {
            this.player.isSliding = isSliding;
            this.player.height = isSliding ? 35 : 65;
            if (isSliding) {
                this.player.y = this.player.groundY - this.player.height;
            }
        }
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }
    
    showLevelSelect() {
        this.updateLevelUI();
        this.showScreen('level-select');
    }
    
    updateLevelUI() {
        const progress = this.getProgress();
        this.levels.forEach((level, index) => {
            const card = document.querySelector(`.level-card[data-level="${index}"]`);
            const status = document.getElementById(`level-${index}-status`);
            
            card.classList.remove('unlocked', 'completed');
            
            if (index === 0 || progress.unlockedLevels.includes(index)) {
                card.classList.add('unlocked');
                if (progress.completedLevels.includes(index)) {
                    card.classList.add('completed');
                    status.textContent = '✅ 已完成';
                    status.style.color = '#ffd700';
                } else {
                    status.textContent = '🔓 可游玩';
                    status.style.color = '#00ff00';
                }
            } else {
                status.textContent = '🔒 未解锁';
                status.style.color = '#ff6600';
            }
        });
    }
    
    selectLevel(level) {
        const progress = this.getProgress();
        if (level === 0 || progress.unlockedLevels.includes(level)) {
            this.currentLevel = level;
            this.startGame();
        }
    }
    
    startGame() {
        const levelConfig = this.levels[this.currentLevel];
        
        const savedState = this.loadGameState();
        if (savedState && savedState.currentLevel === this.currentLevel && savedState.gameState === 'playing') {
            const shouldRestore = confirm('检测到该关卡未完成的进度，是否继续？\n\n' +
                `距离: ${Math.floor(savedState.distance)}m\n` +
                `晶体: ${savedState.crystals}\n` +
                `生命: ${savedState.lives}`);
            if (shouldRestore) {
                this.restoreGameState(savedState);
                this.showScreen('game-screen');
                this.gameLoop();
                this.startAutoSave();
                return;
            }
        }
        
        this.clearGameState();
        this.distance = 0;
        this.crystals = 0;
        this.lives = 3;
        this.boost = 0;
        this.isBoosting = false;
        this.gameSpeed = levelConfig.speed;
        this.baseSpeed = levelConfig.speed;
        
        this.obstacles = [];
        this.crystalItems = [];
        this.particles = [];
        this.backgroundElements = [];
        
        this.player.y = this.player.groundY - 65;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.height = 65;
        
        this.lastObstacleTime = 0;
        this.lastCrystalTime = 0;
        
        this.initBackground();
        this.updateHUD();
        this.showScreen('game-screen');
        this.gameState = 'playing';
        this.gameLoop();
        this.startAutoSave();
    }
    
    initBackground() {
        this.backgroundElements = [];
        for (let i = 0; i < 15; i++) {
            this.backgroundElements.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - 250) + 50,
                size: Math.random() * 40 + 20,
                speed: Math.random() * 0.5 + 0.2,
                type: Math.floor(Math.random() * 3)
            });
        }
    }
    
    startAutoSave() {
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.saveFullProgress();
            }
        }, 1500);
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            cancelAnimationFrame(this.animationId);
            this.saveFullProgress();
            this.showScreen('pause-screen');
            document.getElementById('game-screen').classList.add('active');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('game-screen');
            this.gameLoop();
        }
    }
    
    restartLevel() {
        this.clearGameState();
        this.startGame();
    }
    
    quitToMenu() {
        this.gameState = 'menu';
        cancelAnimationFrame(this.animationId);
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveFullProgress();
        this.showScreen('start-screen');
    }
    
    nextLevel() {
        this.clearGameState();
        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            this.startGame();
        } else {
            this.quitToMenu();
        }
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const currentTime = Date.now();
        const levelConfig = this.levels[this.currentLevel];
        
        this.distance += this.gameSpeed * 0.1;
        this.player.animFrame += 0.15;
        
        if (this.isBoosting && this.boost > 0) {
            this.boost -= 0.5;
            this.gameSpeed = this.baseSpeed * 1.5;
            if (this.boost <= 0) {
                this.isBoosting = false;
                this.boost = 0;
                this.gameSpeed = this.baseSpeed;
            }
        }
        
        document.getElementById('boost-fill').style.width = `${this.boost}%`;
        
        this.updatePlayer();
        this.spawnObstacles(currentTime);
        this.spawnCrystals(currentTime);
        this.updateObstacles();
        this.updateCrystals();
        this.updateParticles();
        this.updateBackground();
        this.checkCollisions();
        this.updateHUD();
        
        if (this.distance >= levelConfig.targetDistance && this.crystals >= levelConfig.targetCrystals) {
            this.completeLevel();
        }
    }
    
    updatePlayer() {
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;
        
        if (this.player.y >= this.player.groundY - this.player.height) {
            this.player.y = this.player.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
    }
    
    spawnObstacles(currentTime) {
        const spawnInterval = Math.max(1200 - this.currentLevel * 150, 700);
        if (currentTime - this.lastObstacleTime > spawnInterval) {
            this.createObstacle();
            this.lastObstacleTime = currentTime;
        }
    }
    
    createObstacle() {
        const levelConfig = this.levels[this.currentLevel];
        const types = levelConfig.obstacles;
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            x: this.canvas.width + 50,
            type: type,
            passed: false,
            isEnemy: false
        };
        
        if (Math.random() > 0.5) {
            obstacle.isEnemy = true;
            obstacle.width = 55;
            obstacle.height = 55;
            obstacle.y = this.player.groundY - obstacle.height;
        } else {
            switch(type) {
                case 'sandstorm':
                case 'vine':
                case 'laser':
                    obstacle.y = this.player.groundY - 110;
                    obstacle.width = 35;
                    obstacle.height = 90;
                    break;
                case 'quicksand':
                case 'flytrap':
                case 'iceberg':
                case 'spike':
                    obstacle.y = this.player.groundY - 45;
                    obstacle.width = 70;
                    obstacle.height = 45;
                    break;
                case 'cactus':
                case 'log':
                case 'icicle':
                case 'barrier':
                    obstacle.y = this.player.groundY - 60;
                    obstacle.width = 45;
                    obstacle.height = 60;
                    break;
                case 'avalanche':
                    obstacle.y = 0;
                    obstacle.width = 120;
                    obstacle.height = 220;
                    break;
                default:
                    obstacle.y = this.player.groundY - 50;
                    obstacle.width = 50;
                    obstacle.height = 50;
            }
        }
        
        this.obstacles.push(obstacle);
    }
    
    spawnCrystals(currentTime) {
        if (currentTime - this.lastCrystalTime > 1200) {
            if (Math.random() > 0.3) {
                this.crystalItems.push({
                    x: this.canvas.width + 50,
                    y: this.player.groundY - 120 - Math.random() * 80,
                    width: 28,
                    height: 35,
                    collected: false,
                    rotation: 0,
                    floatOffset: Math.random() * Math.PI * 2
                });
                this.lastCrystalTime = currentTime;
            }
        }
    }
    
    updateObstacles() {
        this.obstacles = this.obstacles.filter(obs => {
            obs.x -= this.gameSpeed;
            return obs.x > -150;
        });
    }
    
    updateCrystals() {
        this.crystalItems = this.crystalItems.filter(crystal => {
            crystal.x -= this.gameSpeed;
            crystal.rotation += 0.08;
            crystal.floatOffset += 0.1;
            return crystal.x > -50 && !crystal.collected;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            p.vy += 0.15;
            return p.life > 0;
        });
    }
    
    updateBackground() {
        this.backgroundElements.forEach(el => {
            el.x -= el.speed * this.gameSpeed * 0.3;
            if (el.x < -60) {
                el.x = this.canvas.width + 60;
                el.y = Math.random() * (this.canvas.height - 250) + 50;
            }
        });
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                color: color,
                size: Math.random() * 6 + 2,
                life: 1
            });
        }
    }
    
    checkCollisions() {
        const playerBox = {
            x: this.player.x + 8,
            y: this.player.y + 5,
            width: this.player.width - 16,
            height: this.player.height - 10
        };
        
        this.crystalItems.forEach(crystal => {
            if (!crystal.collected && this.isColliding(playerBox, crystal)) {
                crystal.collected = true;
                this.crystals++;
                this.boost = Math.min(100, this.boost + 25);
                if (this.boost >= 100) {
                    this.isBoosting = true;
                }
                this.createParticles(crystal.x, crystal.y, '#00ffff', 12);
            }
        });
        
        this.obstacles.forEach(obs => {
            if (!obs.passed && this.isColliding(playerBox, obs)) {
                this.hitObstacle();
                obs.passed = true;
            }
        });
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    hitObstacle() {
        this.lives--;
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff0000', 18);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        cancelAnimationFrame(this.animationId);
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.clearGameState();
        
        document.getElementById('final-distance').textContent = Math.floor(this.distance);
        document.getElementById('final-crystals').textContent = this.crystals;
        
        this.showScreen('game-over');
        document.getElementById('game-screen').classList.add('active');
    }
    
    completeLevel() {
        this.gameState = 'complete';
        cancelAnimationFrame(this.animationId);
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.clearGameState();
        
        this.saveProgress();
        
        document.getElementById('complete-distance').textContent = Math.floor(this.distance);
        document.getElementById('complete-crystals').textContent = this.crystals;
        
        if (this.currentLevel >= this.levels.length - 1) {
            document.getElementById('next-level-btn').style.display = 'none';
            document.getElementById('complete-message').textContent = '恭喜你完成了所有关卡！你是真正的太空探险家！';
        } else {
            document.getElementById('next-level-btn').style.display = 'inline-block';
        }
        
        this.showScreen('level-complete');
        document.getElementById('game-screen').classList.add('active');
    }
    
    updateHUD() {
        const levelConfig = this.levels[this.currentLevel];
        document.getElementById('distance').textContent = Math.floor(this.distance);
        document.getElementById('target-distance').textContent = levelConfig.targetDistance;
        document.getElementById('crystals').textContent = this.crystals;
        document.getElementById('target-crystals').textContent = levelConfig.targetCrystals;
        document.getElementById('lives').textContent = this.lives;
    }
    
    render() {
        const levelConfig = this.levels[this.currentLevel];
        
        this.ctx.fillStyle = levelConfig.bgColor1;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, levelConfig.bgColor1);
        gradient.addColorStop(0.5, levelConfig.bgColor2);
        gradient.addColorStop(1, levelConfig.groundColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.renderBackground();
        this.renderGround();
        this.renderObstacles();
        this.renderCrystals();
        this.renderPlayer();
        this.renderParticles();
        
        if (this.isBoosting) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    renderBackground() {
        this.backgroundElements.forEach(el => {
            this.ctx.save();
            this.ctx.globalAlpha = 0.4;
            
            if (this.currentLevel === 0) {
                this.ctx.fillStyle = '#CD853F';
                this.ctx.beginPath();
                this.ctx.moveTo(el.x, el.y + el.size);
                this.ctx.quadraticCurveTo(el.x + el.size / 2, el.y, el.x + el.size, el.y + el.size);
                this.ctx.fill();
            } else if (this.currentLevel === 1) {
                this.ctx.fillStyle = '#006400';
                this.ctx.beginPath();
                this.ctx.moveTo(el.x, el.y + el.size);
                this.ctx.lineTo(el.x + el.size / 2, el.y);
                this.ctx.lineTo(el.x + el.size, el.y + el.size);
                this.ctx.fill();
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(el.x + el.size / 2 - 5, el.y + el.size - 10, 10, 15);
            } else if (this.currentLevel === 2) {
                this.ctx.fillStyle = '#E0FFFF';
                this.ctx.beginPath();
                this.ctx.moveTo(el.x, el.y + el.size);
                this.ctx.lineTo(el.x + el.size / 3, el.y);
                this.ctx.lineTo(el.x + el.size * 2 / 3, el.y + el.size / 2);
                this.ctx.lineTo(el.x + el.size, el.y + el.size);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#6366f1';
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.arc(el.x, el.y, el.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderGround() {
        const levelConfig = this.levels[this.currentLevel];
        this.ctx.fillStyle = levelConfig.groundColor;
        this.ctx.fillRect(0, this.player.groundY, this.canvas.width, 100);
        
        this.ctx.strokeStyle = levelConfig.skyColor;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.player.groundY);
        this.ctx.lineTo(this.canvas.width, this.player.groundY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.fillRect(i, this.player.groundY + 5, 30, 3);
        }
    }
    
    renderPlayer() {
        const p = this.player;
        const ctx = this.ctx;
        const bobOffset = p.isJumping ? 0 : Math.sin(p.animFrame) * 2;
        const runOffset = Math.sin(p.animFrame * 2) * 3;
        
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2 + bobOffset);
        
        if (this.isBoosting) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            
            ctx.fillStyle = 'rgba(255, 150, 0, 0.9)';
            ctx.beginPath();
            ctx.moveTo(-10, p.height / 2 - 10);
            ctx.lineTo(-6, p.height / 2 + 15 + Math.random() * 10);
            ctx.lineTo(-2, p.height / 2 - 10);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(2, p.height / 2 - 10);
            ctx.lineTo(6, p.height / 2 + 15 + Math.random() * 10);
            ctx.lineTo(10, p.height / 2 - 10);
            ctx.fill();
        }
        
        if (p.isSliding) {
            ctx.rotate(-Math.PI / 6);
        }
        
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.roundRect(-16, -8, 32, p.height - 20, 6);
        ctx.fill();
        
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(-14, -5, 28, 4);
        ctx.fillRect(-14, 8, 28, 4);
        ctx.fillRect(-14, 21, 28, 4);
        
        ctx.fillStyle = '#42A5F5';
        ctx.fillRect(-10, 0, 20, 6);
        ctx.fillRect(-10, 14, 20, 6);
        
        ctx.fillStyle = '#00BCD4';
        ctx.shadowColor = '#00BCD4';
        ctx.shadowBlur = 4;
        ctx.fillRect(-7, 2, 5, 3);
        ctx.fillRect(2, 2, 5, 3);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(-20, -5, 6, 28);
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(-17, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-17, 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F5F5F5';
        ctx.save();
        ctx.translate(-16, 5);
        ctx.rotate((p.isJumping ? -0.3 : Math.sin(p.animFrame * 2) * 0.2));
        ctx.beginPath();
        ctx.roundRect(-3, 0, 6, 18, 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(16, 5);
        ctx.rotate((p.isJumping ? 0.3 : -Math.sin(p.animFrame * 2) * 0.2));
        ctx.beginPath();
        ctx.roundRect(-3, 0, 6, 18, 2);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#F5F5F5';
        ctx.save();
        ctx.translate(-7, p.height - 28);
        ctx.rotate((p.isJumping ? 0 : runOffset * 0.05));
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 22, 3);
        ctx.fill();
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-5, 18, 10, 6);
        ctx.restore();
        
        ctx.save();
        ctx.translate(7, p.height - 28);
        ctx.rotate((p.isJumping ? 0 : -runOffset * 0.05));
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 22, 3);
        ctx.fill();
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-5, 18, 10, 6);
        ctx.restore();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, -p.height / 2 + 18, 16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -p.height / 2 + 18, 16, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#81D4FA';
        ctx.beginPath();
        ctx.arc(0, -p.height / 2 + 18, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-4, -p.height / 2 + 14, 4, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.ellipse(4, -p.height / 2 + 18, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(5, -p.height / 2 + 16, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderObstacles() {
        this.obstacles.forEach(obs => {
            this.ctx.save();
            
            if (obs.isEnemy) {
                this.renderEnemy(obs);
            } else {
                switch(obs.type) {
                    case 'sandstorm':
                        this.ctx.fillStyle = 'rgba(210, 180, 140, 0.6)';
                        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                        this.ctx.fillStyle = '#DEB887';
                        for (let i = 0; i < 15; i++) {
                            this.ctx.beginPath();
                            this.ctx.arc(obs.x + Math.random() * obs.width, obs.y + Math.random() * obs.height, 2 + Math.random() * 2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                        break;
                    case 'quicksand':
                        this.ctx.fillStyle = '#C4A35A';
                        this.ctx.beginPath();
                        this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#8B7355';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 3, 0, Math.PI * 1.5);
                        this.ctx.stroke();
                        break;
                    case 'cactus':
                        this.ctx.fillStyle = '#228B22';
                        this.ctx.beginPath();
                        this.ctx.roundRect(obs.x + 15, obs.y, 15, obs.height, 5);
                        this.ctx.fill();
                        this.ctx.beginPath();
                        this.ctx.roundRect(obs.x + 3, obs.y + 15, 15, 25, 5);
                        this.ctx.fill();
                        this.ctx.beginPath();
                        this.ctx.roundRect(obs.x + 27, obs.y + 10, 15, 30, 5);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#006400';
                        this.ctx.lineWidth = 1;
                        for (let i = 0; i < 5; i++) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(obs.x + 22 + Math.random() * 5, obs.y + i * 12);
                            this.ctx.lineTo(obs.x + 35, obs.y + i * 12 - 5);
                            this.ctx.stroke();
                        }
                        break;
                    case 'vine':
                        this.ctx.strokeStyle = '#228B22';
                        this.ctx.lineWidth = 8;
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x + obs.width / 2, 0);
                        this.ctx.quadraticCurveTo(obs.x + obs.width + 20, obs.y + obs.height / 2, obs.x + obs.width / 2, obs.y + obs.height);
                        this.ctx.stroke();
                        this.ctx.fillStyle = '#32CD32';
                        for (let i = 0; i < 3; i++) {
                            this.ctx.beginPath();
                            this.ctx.ellipse(obs.x + obs.width / 2 + 10, obs.y + 20 + i * 25, 12, 8, 0.5, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                        break;
                    case 'flytrap':
                        this.ctx.fillStyle = '#8B0000';
                        this.ctx.beginPath();
                        this.ctx.ellipse(obs.x + obs.width / 2, obs.y + 15, obs.width / 2, 22, 0, 0, Math.PI);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#FFD700';
                        for (let i = 0; i < 6; i++) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(obs.x + 10 + i * 10, obs.y + 15);
                            this.ctx.lineTo(obs.x + 15 + i * 10, obs.y + 5);
                            this.ctx.lineTo(obs.x + 20 + i * 10, obs.y + 15);
                            this.ctx.fill();
                        }
                        this.ctx.fillStyle = '#228B22';
                        this.ctx.beginPath();
                        this.ctx.roundRect(obs.x + obs.width / 2 - 6, obs.y + 15, 12, obs.height - 15, 4);
                        this.ctx.fill();
                        break;
                    case 'log':
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.beginPath();
                        this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#DEB887';
                        this.ctx.beginPath();
                        this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 3, obs.height / 3, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#8B4513';
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 4, obs.height / 4, 0, 0, Math.PI * 2);
                        this.ctx.stroke();
                        break;
                    case 'iceberg':
                        this.ctx.fillStyle = '#B0E0E6';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x, obs.y + obs.height);
                        this.ctx.lineTo(obs.x + obs.width * 0.3, obs.y);
                        this.ctx.lineTo(obs.x + obs.width * 0.6, obs.y + obs.height * 0.3);
                        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                        this.ctx.fill();
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x + 5, obs.y + obs.height);
                        this.ctx.lineTo(obs.x + obs.width * 0.3, obs.y + 5);
                        this.ctx.lineTo(obs.x + obs.width * 0.4, obs.y + obs.height * 0.5);
                        this.ctx.fill();
                        break;
                    case 'avalanche':
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x, obs.y);
                        this.ctx.lineTo(obs.x + obs.width, obs.y);
                        this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
                        this.ctx.fill();
                        this.ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
                        for (let i = 0; i < 8; i++) {
                            this.ctx.beginPath();
                            this.ctx.arc(obs.x + Math.random() * obs.width, obs.y + Math.random() * obs.height, 5 + Math.random() * 8, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                        break;
                    case 'icicle':
                        this.ctx.fillStyle = '#ADD8E6';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x, obs.y);
                        this.ctx.lineTo(obs.x + obs.width, obs.y);
                        this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
                        this.ctx.fill();
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x + 5, obs.y);
                        this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height * 0.7);
                        this.ctx.lineTo(obs.x + obs.width - 5, obs.y);
                        this.ctx.fill();
                        break;
                    case 'laser':
                        this.ctx.fillStyle = '#ff0000';
                        this.ctx.shadowColor = '#ff0000';
                        this.ctx.shadowBlur = 20;
                        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                        this.ctx.fillStyle = '#ffff00';
                        this.ctx.fillRect(obs.x + obs.width / 2 - 3, obs.y, 6, obs.height);
                        this.ctx.fillStyle = '#4a4a4a';
                        this.ctx.shadowBlur = 0;
                        this.ctx.fillRect(obs.x - 5, obs.y - 10, obs.width + 10, 15);
                        this.ctx.fillRect(obs.x - 5, obs.y + obs.height - 5, obs.width + 10, 15);
                        break;
                    case 'spike':
                        this.ctx.fillStyle = '#708090';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x, obs.y + obs.height);
                        this.ctx.lineTo(obs.x + obs.width / 4, obs.y);
                        this.ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
                        this.ctx.lineTo(obs.x + obs.width * 3 / 4, obs.y);
                        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#A9A9A9';
                        this.ctx.beginPath();
                        this.ctx.moveTo(obs.x + obs.width / 8, obs.y + obs.height);
                        this.ctx.lineTo(obs.x + obs.width / 4, obs.y + 5);
                        this.ctx.lineTo(obs.x + obs.width * 3 / 8, obs.y + obs.height);
                        this.ctx.fill();
                        break;
                    case 'barrier':
                        this.ctx.fillStyle = '#4a4a6a';
                        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                        this.ctx.strokeStyle = '#6366f1';
                        this.ctx.lineWidth = 3;
                        this.ctx.shadowColor = '#6366f1';
                        this.ctx.shadowBlur = 10;
                        this.ctx.strokeRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
                        this.ctx.fillStyle = '#6366f1';
                        this.ctx.shadowBlur = 5;
                        this.ctx.beginPath();
                        this.ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 8, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                    default:
                        this.ctx.fillStyle = '#ff0000';
                        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                }
            }
            
            this.ctx.restore();
        });
    }
    
    renderEnemy(obs) {
        const bounce = Math.sin(Date.now() / 100) * 3;
        
        this.ctx.save();
        this.ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2 + bounce);
        
        switch(this.currentLevel) {
            case 0:
                this.ctx.fillStyle = '#8B4513';
                for (let i = 0; i < 4; i++) {
                    this.ctx.beginPath();
                    this.ctx.ellipse(-15 + i * 12, 0, 10, 12 - i * 1.5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.fillStyle = '#654321';
                this.ctx.beginPath();
                this.ctx.ellipse(-20, 0, 12, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(-25, -5, 4, 0, Math.PI * 2);
                this.ctx.arc(-15, -5, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#8B4513';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(-28, 5);
                this.ctx.quadraticCurveTo(-35, 15, -30, 20);
                this.ctx.stroke();
                break;
                
            case 1:
                this.ctx.fillStyle = '#2F4F2F';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 5, obs.width / 2 - 5, obs.height / 2 - 5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.ellipse(-12, -8, 8, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(12, -8, 8, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.ellipse(-12, -8, 3, 6, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(12, -8, 3, 6, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#2F4F2F';
                this.ctx.beginPath();
                this.ctx.moveTo(-15, -15);
                this.ctx.lineTo(-8, -30);
                this.ctx.lineTo(-2, -15);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(2, -15);
                this.ctx.lineTo(8, -30);
                this.ctx.lineTo(15, -15);
                this.ctx.fill();
                break;
                
            case 2:
                this.ctx.fillStyle = '#B0E0E6';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, obs.width / 2 - 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(-10, -10, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000080';
                this.ctx.beginPath();
                this.ctx.arc(-10, -5, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(10, -5, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(-8, -7, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(12, -7, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#4169E1';
                this.ctx.beginPath();
                this.ctx.moveTo(-8, 10);
                this.ctx.quadraticCurveTo(0, 20, 8, 10);
                this.ctx.fill();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    this.ctx.fillStyle = '#E0FFFF';
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                    this.ctx.lineTo(Math.cos(angle + 0.3) * 30, Math.sin(angle + 0.3) * 30);
                    this.ctx.lineTo(Math.cos(angle + 0.6) * 20, Math.sin(angle + 0.6) * 20);
                    this.ctx.fill();
                }
                break;
                
            case 3:
                this.ctx.fillStyle = '#4a4a6a';
                this.ctx.beginPath();
                this.ctx.roundRect(-obs.width / 2 + 5, -obs.height / 2 + 10, obs.width - 10, obs.height - 15, 8);
                this.ctx.fill();
                this.ctx.fillStyle = '#3a3a5a';
                this.ctx.beginPath();
                this.ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, 20, 5);
                this.ctx.fill();
                this.ctx.fillStyle = '#ff0000';
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(-15, -obs.height / 2 + 5, 10, 8);
                this.ctx.fillRect(5, -obs.height / 2 + 5, 10, 8);
                this.ctx.fillStyle = '#6366f1';
                this.ctx.shadowBlur = 5;
                this.ctx.beginPath();
                this.ctx.arc(0, 5, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -obs.height / 2);
                this.ctx.lineTo(0, -obs.height / 2 - 10);
                this.ctx.stroke();
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(0, -obs.height / 2 - 12, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#5a5a7a';
                this.ctx.fillRect(-obs.width / 2 + 8, obs.height / 2 - 15, 12, 15);
                this.ctx.fillRect(obs.width / 2 - 20, obs.height / 2 - 15, 12, 15);
                break;
        }
        
        this.ctx.restore();
    }
    
    renderCrystals() {
        this.crystalItems.forEach(crystal => {
            const floatY = Math.sin(crystal.floatOffset) * 5;
            
            this.ctx.save();
            this.ctx.translate(crystal.x + crystal.width / 2, crystal.y + crystal.height / 2 + floatY);
            this.ctx.rotate(crystal.rotation);
            
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 20;
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -crystal.height / 2);
            this.ctx.lineTo(crystal.width / 2, -crystal.height / 4);
            this.ctx.lineTo(crystal.width / 2, crystal.height / 4);
            this.ctx.lineTo(0, crystal.height / 2);
            this.ctx.lineTo(-crystal.width / 2, crystal.height / 4);
            this.ctx.lineTo(-crystal.width / 2, -crystal.height / 4);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -crystal.height / 2 + 5);
            this.ctx.lineTo(crystal.width / 4, -crystal.height / 6);
            this.ctx.lineTo(0, crystal.height / 6);
            this.ctx.lineTo(-crystal.width / 4, -crystal.height / 6);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(-crystal.width / 6, -crystal.height / 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    saveProgress() {
        const progress = this.getProgress();
        
        if (!progress.completedLevels.includes(this.currentLevel)) {
            progress.completedLevels.push(this.currentLevel);
        }
        
        const nextLevel = this.currentLevel + 1;
        if (nextLevel < this.levels.length && !progress.unlockedLevels.includes(nextLevel)) {
            progress.unlockedLevels.push(nextLevel);
        }
        
        localStorage.setItem('spaceRunnerProgress', JSON.stringify(progress));
        this.updateLevelUI();
    }
    
    getProgress() {
        const saved = localStorage.getItem('spaceRunnerProgress');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            unlockedLevels: [0],
            completedLevels: []
        };
    }
    
    saveFullProgress() {
        const progress = this.getProgress();
        
        if (this.gameState === 'playing') {
            const gameState = {
                gameState: this.gameState,
                currentLevel: this.currentLevel,
                distance: this.distance,
                crystals: this.crystals,
                lives: this.lives,
                boost: this.boost,
                isBoosting: this.isBoosting,
                gameSpeed: this.gameSpeed,
                baseSpeed: this.baseSpeed,
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    width: this.player.width,
                    height: this.player.height,
                    velocityY: this.player.velocityY,
                    isJumping: this.player.isJumping,
                    isSliding: this.player.isSliding
                },
                obstacles: JSON.parse(JSON.stringify(this.obstacles)),
                crystalItems: JSON.parse(JSON.stringify(this.crystalItems)),
                lastObstacleTime: this.lastObstacleTime,
                lastCrystalTime: this.lastCrystalTime,
                timestamp: Date.now()
            };
            localStorage.setItem('spaceRunnerGameState', JSON.stringify(gameState));
        }
        
        localStorage.setItem('spaceRunnerProgress', JSON.stringify(progress));
    }
    
    loadGameState() {
        const saved = localStorage.getItem('spaceRunnerGameState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.timestamp && Date.now() - state.timestamp > 3600000) {
                    localStorage.removeItem('spaceRunnerGameState');
                    return null;
                }
                if (typeof state.crystals !== 'number') {
                    localStorage.removeItem('spaceRunnerGameState');
                    return null;
                }
                return state;
            } catch (e) {
                localStorage.removeItem('spaceRunnerGameState');
                return null;
            }
        }
        return null;
    }
    
    restoreGameState(state) {
        this.gameState = state.gameState;
        this.currentLevel = state.currentLevel;
        this.distance = state.distance;
        this.crystals = state.crystals;
        this.lives = state.lives;
        this.boost = state.boost;
        this.isBoosting = state.isBoosting;
        this.gameSpeed = state.gameSpeed;
        this.baseSpeed = state.baseSpeed;
        
        this.player.x = state.player.x;
        this.player.y = state.player.y;
        this.player.width = state.player.width;
        this.player.height = state.player.height;
        this.player.velocityY = state.player.velocityY;
        this.player.isJumping = state.player.isJumping;
        this.player.isSliding = state.player.isSliding;
        
        this.initBackground();
        
        if (state.obstacles && state.obstacles.length > 0) {
            this.obstacles = state.obstacles;
        } else {
            this.obstacles = [];
        }
        
        if (state.crystalItems && state.crystalItems.length > 0) {
            this.crystalItems = state.crystalItems;
        } else {
            this.crystalItems = [];
        }
        
        this.particles = [];
        this.lastObstacleTime = state.lastObstacleTime || Date.now();
        this.lastCrystalTime = state.lastCrystalTime || Date.now();
        
        this.updateHUD();
    }
    
    clearGameState() {
        localStorage.removeItem('spaceRunnerGameState');
    }
    
    loadFullProgress() {
        const gameState = this.loadGameState();
        if (gameState && gameState.gameState === 'playing') {
        }
        return this.getProgress();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpaceRunner();
});

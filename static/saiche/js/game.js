const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    state: 'menu',
    lastTime: 0,
    deltaTime: 0,
    
    player: null,
    enemies: [],
    powerUps: [],
    effects: [],
    
    scrollSpeed: 3,
    baseScrollSpeed: 3,
    maxScrollSpeed: 8,
    
    distance: 0,
    score: 0,
    timeRemaining: 30,
    timeAccumulator: 0,
    
    fuelCount: 0,
    nitroCount: 0,
    
    roadOffset: 0,
    laneLines: [],
    speedLines: [],
    
    keys: {},
    mouseDown: false,
    isAccelerating: false,
    
    spawnTimer: 0,
    spawnInterval: 800,
    checkpointDistance: 0,
    
    ui: {
        distance: null,
        timer: null,
        score: null,
        fuelBar: null,
        nitroBar: null,
        fuelCount: null,
        nitroCount: null,
        bestDistance: null,
        finalDistance: null,
        finalScore: null,
        finalBest: null,
        savedDistance: null
    },
    
    screens: {
        menu: null,
        pause: null,
        gameover: null,
        savedGameInfo: null
    },
    
    buttons: {
        start: null,
        pause: null,
        resume: null,
        restart: null,
        quit: null,
        retry: null,
        menu: null,
        resumeSaved: null
    },
    
    savedState: null,

    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.player = new PlayerCar(this);
        
        this.setupUI();
        this.setupInput();
        this.setupEvents();
        
        this.updateBestDistance();
        
        this.gameLoop();
        
        setInterval(() => {
            if (this.state === 'playing') {
                this.saveState();
            }
        }, 5000);
        
        this.savedState = Storage.loadGameState();
        if (this.savedState) {
            this.showResumeButton();
        }
    },

    showResumeButton: function() {
        if (!this.savedState) return;
        
        this.buttons.resumeSaved.classList.remove('hidden');
        this.screens.savedGameInfo.classList.remove('hidden');
        this.ui.savedDistance.textContent = Math.floor(this.savedState.distance || 0) + 'm';
    },

    hideResumeButton: function() {
        this.buttons.resumeSaved.classList.add('hidden');
        this.screens.savedGameInfo.classList.add('hidden');
    },

    resumeSavedGame: function() {
        if (!this.savedState) return;
        
        const state = this.savedState;
        
        this.reset();
        
        this.distance = state.distance || 0;
        this.score = state.score || 0;
        this.timeRemaining = state.timeRemaining || 30;
        this.fuelCount = state.fuelCount || 0;
        this.nitroCount = state.nitroCount || 0;
        this.scrollSpeed = state.scrollSpeed || this.baseScrollSpeed;
        this.checkpointDistance = state.checkpointDistance || 0;
        
        if (state.playerLane !== undefined) {
            this.player.lane = state.playerLane;
            this.player.targetLane = state.playerLane;
        }
        
        const laneWidth = this.width / 3;
        this.player.x = laneWidth * this.player.lane + laneWidth / 2 - this.player.width / 2;
        
        this.state = 'playing';
        this.showScreen('playing');
        this.hideResumeButton();
        this.savedState = null;
        Storage.clearGameState();
    },

    resize: function() {
        const container = document.getElementById('game-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.initLaneLines();
        
        if (this.player) {
            this.player.init(this.width, this.height);
        }
    },

    initLaneLines: function() {
        this.laneLines = [];
        const laneWidth = this.width / 3;
        
        for (let i = 0; i < 20; i++) {
            this.laneLines.push({
                x: laneWidth,
                y: -50 + i * 60
            });
            this.laneLines.push({
                x: laneWidth * 2,
                y: -50 + i * 60
            });
        }
    },

    setupUI: function() {
        this.ui.distance = document.getElementById('distance');
        this.ui.timer = document.getElementById('timer');
        this.ui.score = document.getElementById('score');
        this.ui.fuelBar = document.getElementById('fuel-bar');
        this.ui.nitroBar = document.getElementById('nitro-bar');
        this.ui.fuelCount = document.getElementById('fuel-count');
        this.ui.nitroCount = document.getElementById('nitro-count');
        this.ui.bestDistance = document.getElementById('best-distance');
        this.ui.finalDistance = document.getElementById('final-distance');
        this.ui.finalScore = document.getElementById('final-score');
        this.ui.finalBest = document.getElementById('final-best');
        this.ui.savedDistance = document.getElementById('saved-distance');
        
        this.screens.menu = document.getElementById('menu-screen');
        this.screens.pause = document.getElementById('pause-screen');
        this.screens.gameover = document.getElementById('gameover-screen');
        this.screens.savedGameInfo = document.getElementById('saved-game-info');
        
        this.buttons.start = document.getElementById('start-btn');
        this.buttons.pause = document.getElementById('pause-btn');
        this.buttons.resume = document.getElementById('resume-btn');
        this.buttons.restart = document.getElementById('restart-btn');
        this.buttons.quit = document.getElementById('quit-btn');
        this.buttons.retry = document.getElementById('retry-btn');
        this.buttons.menu = document.getElementById('menu-btn');
        this.buttons.resumeSaved = document.getElementById('resume-saved-btn');
    },

    setupInput: function() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'Escape' && this.state === 'playing') {
                this.pause();
            }
            
            if (e.key === ' ' && this.state === 'playing') {
                this.player.activateNitro();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            if (this.state === 'playing') {
                this.mouseDown = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing') {
                this.mouseDown = true;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouseDown = false;
        });
    },

    setupEvents: function() {
        this.buttons.start.addEventListener('click', () => this.start());
        this.buttons.pause.addEventListener('click', () => this.pause());
        this.buttons.resume.addEventListener('click', () => this.resume());
        this.buttons.restart.addEventListener('click', () => this.restart());
        this.buttons.quit.addEventListener('click', () => this.quit());
        this.buttons.retry.addEventListener('click', () => this.restart());
        this.buttons.menu.addEventListener('click', () => this.quit());
        this.buttons.resumeSaved.addEventListener('click', () => this.resumeSavedGame());
        
        window.addEventListener('beforeunload', () => {
            if (this.state === 'playing') {
                this.saveState();
            }
        });
    },

    updateBestDistance: function() {
        const best = Storage.getBestDistance();
        this.ui.bestDistance.textContent = best + 'm';
    },

    showScreen: function(screenName) {
        this.screens.menu.classList.add('hidden');
        this.screens.pause.classList.add('hidden');
        this.screens.gameover.classList.add('hidden');
        this.buttons.pause.classList.add('hidden');
        
        if (screenName === 'menu') {
            this.screens.menu.classList.remove('hidden');
        } else if (screenName === 'pause') {
            this.screens.pause.classList.remove('hidden');
        } else if (screenName === 'gameover') {
            this.screens.gameover.classList.remove('hidden');
        } else if (screenName === 'playing') {
            this.buttons.pause.classList.remove('hidden');
        }
    },

    start: function() {
        this.state = 'playing';
        this.showScreen('playing');
        this.hideResumeButton();
        this.reset();
        this.savedState = null;
        Storage.clearGameState();
    },

    pause: function() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.showScreen('pause');
            this.saveState();
        }
    },

    resume: function() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.showScreen('playing');
            this.lastTime = performance.now();
        }
    },

    restart: function() {
        this.state = 'playing';
        this.showScreen('playing');
        this.reset();
        Storage.clearGameState();
    },

    quit: function() {
        this.state = 'menu';
        this.showScreen('menu');
        this.updateBestDistance();
        Storage.clearGameState();
    },

    gameOver: function() {
        this.state = 'gameover';
        this.showScreen('gameover');
        
        const isNewBest = Storage.setBestDistance(Math.floor(this.distance));
        Storage.addGameStats(Math.floor(this.distance), this.score);
        
        this.ui.finalDistance.textContent = Math.floor(this.distance) + 'm';
        this.ui.finalScore.textContent = this.score;
        this.ui.finalBest.textContent = Storage.getBestDistance() + 'm';
        
        Storage.clearGameState();
    },

    reset: function() {
        this.distance = 0;
        this.score = 0;
        this.timeRemaining = 30;
        this.timeAccumulator = 0;
        this.fuelCount = 0;
        this.nitroCount = 0;
        this.scrollSpeed = this.baseScrollSpeed;
        this.spawnTimer = 0;
        this.checkpointDistance = 0;
        this.mouseDown = false;
        
        this.enemies = [];
        this.powerUps = [];
        this.effects = [];
        
        this.player.init(this.width, this.height);
        this.initLaneLines();
        
        this.updateUI();
    },

    saveState: function() {
        const state = {
            distance: this.distance,
            score: this.score,
            timeRemaining: this.timeRemaining,
            fuelCount: this.fuelCount,
            nitroCount: this.nitroCount,
            scrollSpeed: this.scrollSpeed,
            checkpointDistance: this.checkpointDistance,
            playerLane: this.player.lane,
            playerX: this.player.x,
            playerY: this.player.y
        };
        Storage.saveGameState(state);
    },

    update: function() {
        if (this.state !== 'playing') return;
        
        this.timeAccumulator += this.deltaTime;
        
        while (this.timeAccumulator >= 1000) {
            this.timeAccumulator -= 1000;
            this.timeRemaining--;
            
            if (this.timeRemaining <= 0) {
                this.gameOver();
                return;
            }
        }
        
        this.handleInput();
        
        this.isAccelerating = this.mouseDown || this.player.nitroActive;
        
        const baseSpeedMultiplier = this.mouseDown ? 1.8 : 0.6;
        const nitroMultiplier = this.player.nitroActive ? 2.5 : 1;
        const actualSpeed = this.scrollSpeed * baseSpeedMultiplier * nitroMultiplier;
        
        this.distance += actualSpeed * 0.1;
        
        if (Math.floor(this.distance / 500) > this.checkpointDistance) {
            this.checkpointDistance = Math.floor(this.distance / 500);
            this.timeRemaining += 5;
            this.createEffect('star', this.player.x + this.player.width / 2, this.player.y);
        }
        
        this.scrollSpeed = Math.min(
            this.maxScrollSpeed,
            this.baseScrollSpeed + this.distance * 0.0003
        );
        
        this.player.update(this.width);
        
        this.updateLaneLines(actualSpeed);
        
        this.spawnTimer += this.deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnObjects();
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(actualSpeed, this.width);
            if (this.enemies[i].y > this.height + 100) {
                this.enemies.splice(i, 1);
            }
        }
        
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].update(actualSpeed, this.width, this.deltaTime);
            if (this.powerUps[i].y > this.height + 100) {
                this.powerUps.splice(i, 1);
            }
        }
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update(this.deltaTime);
            if (this.effects[i].isDead()) {
                this.effects.splice(i, 1);
            }
        }
        
        this.checkCollisions();
        
        this.updateUI();
    },

    updateSpeedLines: function(speed) {
        if (this.speedLines.length > 10) {
            this.speedLines.splice(0, this.speedLines.length - 8);
        }
        
        if (this.isAccelerating && Math.random() > 0.97) {
            const laneWidth = this.width / 3;
            const lane = Utils.randomInt(0, 2);
            this.speedLines.push({
                x: laneWidth * lane + Utils.random(10, laneWidth - 10),
                y: -20,
                speed: speed * Utils.random(1.2, 1.5),
                length: Utils.random(15, 25),
                alpha: Utils.random(0.2, 0.4)
            });
        }
        
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.y += line.speed;
            line.alpha -= 0.05;
            
            if (line.y > this.height + 30 || line.alpha <= 0) {
                this.speedLines.splice(i, 1);
            }
        }
    },

    handleInput: function() {
        if (this.keys['a'] || this.keys['arrowleft']) {
            if (!this.keys['a_pressed']) {
                this.keys['a_pressed'] = true;
                this.player.moveLeft();
            }
        } else {
            this.keys['a_pressed'] = false;
        }
        
        if (this.keys['d'] || this.keys['arrowright']) {
            if (!this.keys['d_pressed']) {
                this.keys['d_pressed'] = true;
                this.player.moveRight();
            }
        } else {
            this.keys['d_pressed'] = false;
        }
    },

    updateLaneLines: function(speed) {
        for (let line of this.laneLines) {
            line.y += speed;
            if (line.y > this.height + 50) {
                line.y -= this.height + 100;
            }
        }
    },

    spawnObjects: function() {
        const roll = Math.random();
        
        if (roll < 0.2) {
            this.spawnEnemy();
        } else if (roll < 0.4) {
            this.spawnPowerUp();
        } else if (roll < 0.5) {
            this.spawnBarrier();
        }
    },

    spawnEnemy: function() {
        const types = ['van', 'watermelon', 'truck'];
        const weights = [0.45, 0.45, 0.1];
        let type = 'van';
        let roll = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (roll < cumulative) {
                type = types[i];
                break;
            }
        }
        
        let lane = Utils.randomInt(0, 2);
        
        const occupiedLanes = new Set();
        for (let enemy of this.enemies) {
            if (enemy.y < 100) {
                occupiedLanes.add(enemy.lane);
                if (enemy.type === 'truck') {
                    occupiedLanes.add(enemy.lane + 1);
                }
            }
        }
        
        if (occupiedLanes.has(lane)) {
            for (let l = 0; l < 3; l++) {
                if (!occupiedLanes.has(l)) {
                    lane = l;
                    break;
                }
            }
        }
        
        if (occupiedLanes.has(lane)) return;
        
        const enemy = new EnemyCar(this, type, lane, -80);
        this.enemies.push(enemy);
    },

    spawnPowerUp: function() {
        const roll = Math.random();
        let type;
        
        if (roll < 0.6) {
            type = 'fuel';
        } else {
            type = 'nitro';
        }
        
        const lane = Utils.randomInt(0, 2);
        
        const powerUp = new PowerUp(this, type, lane, -40);
        this.powerUps.push(powerUp);
    },

    spawnBarrier: function() {
        const lane = Utils.randomInt(0, 2);
        
        const barrier = new PowerUp(this, 'barrier', lane, -40);
        this.powerUps.push(barrier);
    },

    checkCollisions: function() {
        const playerBounds = this.player.getBounds();
        
        for (let enemy of this.enemies) {
            if (Utils.rectCollision(playerBounds, enemy.getBounds())) {
                const hitType = enemy.type === 'truck' ? 'truck' : 'car';
                const timePenalty = this.player.hit(hitType);
                
                if (typeof timePenalty === 'number' && timePenalty > 0) {
                    if (enemy.collisionCooldown && enemy.collisionCooldown > 0) continue;
                    
                    enemy.collisionCooldown = 120;
                    this.timeRemaining = Math.max(0, this.timeRemaining - timePenalty);
                    this.createEffect('hit', enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    this.showCollisionFlash();
                }
            }
            
            if (enemy.collisionCooldown && enemy.collisionCooldown > 0) {
                enemy.collisionCooldown--;
            }
        }
        
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (Utils.rectCollision(playerBounds, powerUp.getBounds())) {
                if (powerUp.type === 'fuel') {
                    this.collectFuel();
                    this.createEffect('star', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                    this.powerUps.splice(i, 1);
                } else if (powerUp.type === 'nitro') {
                    this.collectNitro();
                    this.createEffect('nitroActivated', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                    this.powerUps.splice(i, 1);
                } else if (powerUp.type === 'barrier') {
                    const timePenalty = this.player.hit('barrier');
                    if (typeof timePenalty === 'number' && timePenalty > 0) {
                        this.timeRemaining = Math.max(0, this.timeRemaining - timePenalty);
                        this.createEffect('hit', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                        this.showCollisionFlash();
                    }
                    this.powerUps.splice(i, 1);
                }
            }
        }
    },

    showCollisionFlash: function() {
        this.collisionFlash = 1.0;
    },

    collectFuel: function() {
        this.fuelCount++;
        this.score += 100;
        
        if (this.fuelCount >= 5) {
            this.fuelCount = 0;
            this.nitroCount++;
        }
    },

    collectNitro: function() {
        this.nitroCount++;
    },

    createEffect: function(type, x, y) {
        if (type === 'star') {
            for (let i = 0; i < 5; i++) {
                this.effects.push(new Effect('star', x + Utils.random(-20, 20), y + Utils.random(-20, 20)));
            }
        } else {
            this.effects.push(new Effect(type, x, y));
        }
    },

    updateUI: function() {
        this.ui.distance.textContent = Math.floor(this.distance) + 'm';
        this.ui.timer.textContent = Math.ceil(this.timeRemaining) + 's';
        this.ui.score.textContent = this.score;
        
        this.ui.fuelBar.style.width = (this.fuelCount / 5 * 100) + '%';
        this.ui.fuelCount.textContent = this.fuelCount;
        
        this.ui.nitroBar.style.width = Math.min(100, this.nitroCount * 33) + '%';
        this.ui.nitroCount.textContent = this.nitroCount;
        
        if (this.timeRemaining <= 10) {
            this.ui.timer.style.color = GameObjects.COLORS.red;
        } else {
            this.ui.timer.style.color = GameObjects.COLORS.white;
        }
    },

    render: function() {
        this.ctx.fillStyle = GameObjects.COLORS.trackDark;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawRoad();
        
        for (let effect of this.effects) {
            if (effect.type === 'skidMark') {
                effect.draw(this.ctx);
            }
        }
        
        for (let powerUp of this.powerUps) {
            powerUp.draw(this.ctx);
        }
        
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        for (let effect of this.effects) {
            if (effect.type !== 'skidMark') {
                effect.draw(this.ctx);
            }
        }
        
        if (this.collisionFlash && this.collisionFlash > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.collisionFlash * 0.3;
            this.ctx.fillStyle = GameObjects.COLORS.red;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
            
            this.collisionFlash -= 0.05;
            if (this.collisionFlash <= 0) {
                this.collisionFlash = 0;
            }
        }
    },

    drawRoad: function() {
        this.ctx.fillStyle = GameObjects.COLORS.trackGray;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const laneWidth = this.width / 3;
        
        this.ctx.fillStyle = GameObjects.COLORS.neonBlue;
        this.ctx.fillRect(0, 0, 8, this.height);
        this.ctx.fillRect(this.width - 8, 0, 8, this.height);
        
        this.ctx.strokeStyle = GameObjects.COLORS.neonBlue;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 30]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(laneWidth, 0);
        this.ctx.lineTo(laneWidth, this.height);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(laneWidth * 2, 0);
        this.ctx.lineTo(laneWidth * 2, this.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    },

    gameLoop: function(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.deltaTime = Math.min(this.deltaTime, 64);
        
        this.update();
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
};

window.addEventListener('load', () => {
    Game.init();
});

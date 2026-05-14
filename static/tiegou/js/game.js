class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.gameState = 'menu';
        this.isPaused = false;
        
        this.captain = null;
        this.enemies = [];
        this.particles = [];
        
        this.health = 3;
        this.kills = 0;
        this.killsToWin = 20;
        this.timeRemaining = 30;
        this.score = 0;
        
        this.spawnTimer = 0;
        this.spawnInterval = 60;
        this.lastTime = 0;
        this.autoSaveTimer = 0;
        
        this.backgroundOffset = 0;
        
        this.init();
    }

    init() {
        this.captain = new Captain(120, this.height / 2 + 20);
        
        this.bindEvents();
    }

    bindEvents() {
        const handleAnyClick = (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing' || this.isPaused) return;
            
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;
            
            console.log('点击坐标:', x, y, '敌人数:', this.enemies.length);
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (enemy.isDead) continue;
                
                const dx = x - enemy.x;
                const dy = y - enemy.y;
                const hitRadius = enemy.type === 'big' ? 55 : 35;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                console.log('敌人', i, '坐标:', enemy.x, enemy.y, '距离:', distance, '半径:', hitRadius);
                
                if (distance < hitRadius) {
                    console.log('命中!');
                    this.hitEnemy(enemy);
                    return;
                }
            }
        };
        
        this.canvas.addEventListener('click', handleAnyClick);
        this.canvas.addEventListener('touchstart', handleAnyClick);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.gameState === 'playing') {
                    this.pause();
                }
            }
        });
    }

    hitEnemy(enemy) {
        enemy.hit();
        this.kills++;
        this.score += enemy.type === 'big' ? 200 : 100;
        
        this.captain.attack();
        
        this.createHitParticles(enemy.x, enemy.y);
    }

    createHitParticles(x, y) {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#8B0000'];
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(
                x + Utils.random(-20, 20),
                y + Utils.random(-20, 20),
                Utils.randomChoice(colors)
            ));
        }
    }

    start() {
        this.reset();
        this.gameState = 'playing';
        UI.showScreen('playing');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    reset() {
        this.health = 3;
        this.kills = 0;
        this.timeRemaining = 30;
        this.score = 0;
        this.enemies = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.isPaused = false;
        
        this.captain = new Captain(120, this.height / 2 + 20);
        
        Storage.clearState();
        
        UI.updateHealth(this.health);
        UI.updateKills(this.kills, this.killsToWin);
        UI.updateTime(this.timeRemaining);
    }

    pause() {
        this.isPaused = true;
        UI.showScreen('pause');
        Storage.saveGame(this);
    }

    resume() {
        this.isPaused = false;
        UI.showScreen('playing');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    quit() {
        this.gameState = 'menu';
        this.isPaused = false;
        UI.showScreen('start');
        Storage.clearState();
    }

    restart() {
        this.start();
    }

    spawnEnemy() {
        const y = Utils.random(150, this.height - 150);
        const type = Math.random() < 0.2 ? 'big' : 'normal';
        const enemy = new Enemy(this.width + 50, y, type);
        this.enemies.push(enemy);
    }

    update(deltaTime) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        const dt = deltaTime / 16.67;
        
        this.timeRemaining -= deltaTime / 1000;
        UI.updateTime(this.timeRemaining);
        
        if (this.timeRemaining <= 0) {
            this.win();
            return;
        }
        
        this.spawnTimer += dt;
        const currentSpawnInterval = Math.max(30, 60 - (30 - this.timeRemaining));
        if (this.spawnTimer >= currentSpawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
        
        this.captain.update();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();
            
            if (!enemy.isDead && enemy.reachedCaptain(this.captain.x)) {
                this.health--;
                UI.updateHealth(this.health);
                enemy.hit();
                
                if (this.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
            
            if (enemy.isDead && enemy.deathFrame > 40) {
                this.enemies.splice(i, 1);
            } else if (enemy.isOffScreen()) {
                this.enemies.splice(i, 1);
            }
        }
        
        if (this.kills >= this.killsToWin) {
            this.win();
            return;
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        UI.updateKills(this.kills, this.killsToWin);
        
        this.backgroundOffset += 0.5;
        
        this.autoSaveTimer++;
        if (this.autoSaveTimer >= 60) {
            Storage.saveGame(this);
            this.autoSaveTimer = 0;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        this.particles.forEach(p => p.draw(this.ctx));
        
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        this.captain.draw(this.ctx);
    }

    drawBackground() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B0E0E6');
        skyGradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height * 0.6);
        
        this.ctx.fillStyle = '#fff';
        this.drawCloud(100 + (this.backgroundOffset * 0.3) % 200, 80, 1);
        this.drawCloud(400 + (this.backgroundOffset * 0.2) % 300, 50, 0.8);
        this.drawCloud(700 + (this.backgroundOffset * 0.25) % 250, 100, 0.7);
        
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, this.height * 0.55, this.width, this.height * 0.45);
        
        this.ctx.fillStyle = '#6B5344';
        for (let i = 0; i < this.width; i += 30) {
            this.ctx.fillRect(i, this.height * 0.55, 15, this.height * 0.45);
        }
        
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(0, this.height * 0.55, this.width, 5);
    }

    drawCloud(x, y, scale) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 25 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 55 * scale, y, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 30 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }

    win() {
        this.gameState = 'gameover';
        UI.showGameOver(true, this.kills, this.timeRemaining);
        Storage.clearState();
    }

    gameOver() {
        this.gameState = 'gameover';
        UI.showGameOver(false, this.kills, this.timeRemaining);
        Storage.clearState();
    }

    loadSavedState() {
        const savedState = Storage.loadState();
        if (savedState) {
            Storage.restoreGame(this, savedState);
            UI.updateHealth(this.health);
            UI.updateKills(this.kills, this.killsToWin);
            UI.updateTime(this.timeRemaining);
            return true;
        }
        return false;
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
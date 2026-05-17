class Game {
    constructor() {
        this.state = 'menu';
        this.selectedMecha = 'thunder';
        this.player = null;
        this.enemy = null;
        this.balls = [];
        this.explosions = [];
        this.timeRemaining = CONFIG.GAME_DURATION;
        this.lastTime = 0;
        this.saveInterval = null;
        
        this.isAiming = false;
        this.aimX = 0;
        this.aimY = 0;
        
        this.canvas = null;
        this.ctx = null;
        this.ui = null;
    }

    init() {
        console.log('Game initializing...');
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.ui = new UI(this);
        console.log('UI initialized');
        
        const savedState = gameStorage.load();
        if (savedState && savedState.state === 'playing') {
            console.log('Loading saved state...');
            this.loadState(savedState);
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 500;
        this.canvas.width = width;
        this.canvas.height = height;
        console.log('Canvas resized to:', width, 'x', height);
    }

    startGame() {
        console.log('Starting game...');
        this.state = 'playing';
        this.timeRemaining = CONFIG.GAME_DURATION;
        this.balls = [];
        this.explosions = [];
        this.isAiming = false;
        this.aimX = 0;
        this.aimY = 0;
        
        this.ui.showScreen('game');
        
        setTimeout(() => {
            this.resizeCanvas();
            this.ui.bindCanvasEvents();
            
            const centerX = this.canvas.width / 2;
            console.log('Creating player at:', centerX, this.canvas.height - 80);
            this.player = new Mecha(this.selectedMecha, centerX, this.canvas.height - 80);
            this.enemy = new Enemy(centerX, 140);
            
            this.ui.updateSkillSelection();
            
            this.startGameLoop();
            this.startAutoSave();
            console.log('Game started!');
        }, 100);
    }

    startGameLoop() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(currentTime) {
        if (this.state !== 'playing') return;
        
        try {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.gameOver(false);
                return;
            }
            
            this.update();
            this.render();
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update() {
        try {
            if (!this.enemy || !this.player) return;
            
            this.enemy.update(this.canvas.width, this.player.x, this.player.y);
            
            if (this.enemy.canAttack()) {
                const newBalls = this.enemy.attack(this.player.x, this.player.y);
                this.balls.push(...newBalls);
            }
            
            for (let i = this.balls.length - 1; i >= 0; i--) {
                const ball = this.balls[i];
                ball.update(this.canvas.width, this.canvas.height);
                
                if (ball.y > this.canvas.height + 50 || ball.y < -50) {
                    if (ball.isPlayer) {
                        this.player.restoreAmmo();
                    }
                    this.balls.splice(i, 1);
                    continue;
                }
                
                this.checkCollisions(ball, i);
            }
            
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                this.explosions[i].life -= 0.05;
                if (this.explosions[i].life <= 0) {
                    this.explosions.splice(i, 1);
                }
            }
            
            if (this.player.health <= 0) {
                this.gameOver(false);
                return;
            }
            
            if (this.enemy.health <= 0) {
                this.gameOver(true);
                return;
            }
            
            this.ui.update();
        } catch (error) {
            console.error('Update error:', error);
        }
    }

    checkCollisions(ball, ballIndex) {
        if (!ball.active) return;
        
        const playerRect = {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };
        
        const enemyRect = {
            x: this.enemy.x - this.enemy.width / 2,
            y: this.enemy.y - this.enemy.height / 2,
            width: this.enemy.width,
            height: this.enemy.height
        };
        
        if (ball.isPlayer) {
            if (physics.checkCircleRectCollision(ball, enemyRect)) {
                this.handlePlayerBallHit(ball, this.enemy, 'enemy');
                if (ball.type !== 'pierce' || !ball.canPierce('enemy')) {
                    this.balls.splice(ballIndex, 1);
                } else {
                    ball.markPierced('enemy');
                    physics.resolveRectCollision(ball, enemyRect);
                }
            }
            
            for (const module of this.enemy.defenseModules || []) {
                if (!module.destroyed && physics.checkCircleRectCollision(ball, module)) {
                    module.health -= ball.damage;
                    if (module.health <= 0) {
                        module.destroyed = true;
                    }
                    if (ball.type !== 'pierce' || !ball.canPierce('module')) {
                        this.balls.splice(ballIndex, 1);
                    } else {
                        ball.markPierced('module');
                    }
                    break;
                }
            }
        } else {
            if (physics.checkCircleRectCollision(ball, playerRect)) {
                this.player.takeDamage(ball.damage);
                if (ball.type === 'explosive') {
                    this.explosions.push({
                        x: ball.x,
                        y: ball.y,
                        radius: 50,
                        life: 1
                    });
                }
                this.balls.splice(ballIndex, 1);
                return;
            }
            
            for (const module of this.player.defenseModules) {
                if (!module.destroyed && physics.checkCircleRectCollision(ball, module)) {
                    module.health -= ball.damage;
                    if (module.health <= 0) {
                        module.destroyed = true;
                    }
                    this.balls.splice(ballIndex, 1);
                    break;
                }
            }
        }
    }

    handlePlayerBallHit(ball, target, targetId) {
        let damage = ball.damage + this.player.config.damage;
        
        if (ball.type === 'ultimate') {
            damage = this.player.config.ultimateDamage;
            
            const effect = this.player.config.ultimateEffect;
            const duration = this.player.config.ultimateDuration;
            
            if (effect === 'paralyze') {
                target.applyEffect('paralyze', duration);
            } else if (effect === 'burn') {
                target.applyEffect('burn', duration, damage * 0.3);
            } else if (effect === 'shield') {
                this.player.applyEffect('shield', this.player.config.shieldDuration);
            }
            
            for (let i = 0; i < 3; i++) {
                this.explosions.push({
                    x: target.x + (Math.random() - 0.5) * 40,
                    y: target.y + (Math.random() - 0.5) * 40,
                    radius: 40,
                    life: 1
                });
            }
        }
        
        if (ball.type === 'explosive') {
            this.explosions.push({
                x: ball.x,
                y: ball.y,
                radius: CONFIG.BALL_TYPES.explosive.explosionRadius,
                life: 1
            });
        }
        
        target.takeDamage(damage);
        this.player.addUltimateCharge(damage * 0.3);
    }

    shoot(targetX, targetY) {
        console.log('Shoot called at:', targetX, targetY, 'Current ammo:', this.player.ammo);
        const startX = this.player.x;
        const startY = this.player.y - this.player.height / 2;
        
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 12;
        
        let ballType = this.player.selectedSkill;
        console.log('Selected skill:', ballType);
        
        if (ballType === 'ultimate' && this.player.canUseUltimate()) {
            console.log('Using ultimate');
            this.player.useUltimate();
            for (let i = 0; i < this.player.config.ultimateBalls; i++) {
                const angle = Math.atan2(dy, dx) + (i - 0.5) * 0.15;
                const ball = new Ball(
                    startX, startY,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    'ultimate', true
                );
                this.balls.push(ball);
            }
            this.saveState();
        } else {
            if (this.player.ammo <= 0) {
                console.log('No ammo, restoring');
                this.player.restoreAmmo();
            }
            
            if (this.player.useAmmo()) {
                console.log('Shooting normal ball');
                if (ballType === 'ultimate') {
                    ballType = 'normal';
                }
                
                const ball = new Ball(
                    startX, startY,
                    (dx / dist) * speed,
                    (dy / dist) * speed,
                    ballType, true
                );
                this.balls.push(ball);
                this.saveState();
            }
        }
    }

    render() {
        try {
            if (!this.player || !this.enemy) return;
            
            this.ctx.fillStyle = '#0a0a1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawStarfield();
            
            for (const explosion of this.explosions) {
                this.ui.drawExplosion(this.ctx, explosion.x, explosion.y, explosion.radius * explosion.life);
            }
            
            this.player.draw(this.ctx);
            this.enemy.draw(this.ctx);
            this.ui.drawEnemyHealthBar(this.ctx, this.enemy);
            
            for (const ball of this.balls) {
                ball.draw(this.ctx);
            }
            
            this.ui.drawAimLine(this.ctx);
        } catch (error) {
            console.error('Render error:', error);
        }
    }

    drawStarfield() {
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = ((i * 97.3 + time * 10) % this.canvas.height);
            const size = (i % 3) * 0.5 + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showScreen('pause');
            this.saveState();
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.showScreen('game');
            this.startGameLoop();
        }
    }

    restartGame() {
        this.stopAutoSave();
        gameStorage.clear();
        this.startGame();
    }

    quitToMenu() {
        this.state = 'menu';
        this.stopAutoSave();
        gameStorage.clear();
        this.ui.showScreen('start');
    }

    gameOver(isWin) {
        this.state = 'gameOver';
        this.stopAutoSave();
        gameStorage.clear();
        this.ui.showGameOver(isWin);
    }

    startAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        this.saveInterval = setInterval(() => {
            if (this.state === 'playing') {
                this.saveState();
            }
        }, 2000);
    }

    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    saveState() {
        const state = {
            state: this.state,
            selectedMecha: this.selectedMecha,
            timeRemaining: this.timeRemaining,
            player: this.player ? this.player.getState() : null,
            enemy: this.enemy ? this.enemy.getState() : null,
            balls: this.balls.map(b => b.getState())
        };
        gameStorage.save(state);
    }

    loadState(state) {
        this.state = state.state;
        this.selectedMecha = state.selectedMecha;
        this.timeRemaining = state.timeRemaining;
        this.isAiming = false;
        this.aimX = 0;
        this.aimY = 0;
        
        this.ui.showScreen('game');
        
        setTimeout(() => {
            this.resizeCanvas();
            this.ui.bindCanvasEvents();
            
            if (state.player) {
                this.player = new Mecha(state.player.type, state.player.x, state.player.y);
                this.player.loadState(state.player);
            }
            
            if (state.enemy) {
                this.enemy = new Enemy(state.enemy.x, state.enemy.y);
                this.enemy.loadState(state.enemy);
            }
            
            this.balls = state.balls.map(b => Ball.fromState(b));
            
            if (this.state === 'playing') {
                this.ui.updateSkillSelection();
                this.startGameLoop();
                this.startAutoSave();
            }
        }, 100);
    }
}
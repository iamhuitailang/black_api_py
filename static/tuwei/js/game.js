class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = Config.CANVAS_WIDTH;
        this.height = Config.CANVAS_HEIGHT;
        
        this.camera = { x: 0, y: 0 };
        this.cameraLocked = true;
        
        this.player = null;
        this.map = null;
        this.enemies = [];
        this.bullets = [];
        
        this.gameState = {
            status: 'menu',
            currentWave: 0,
            enemiesRemaining: 0,
            timeRemaining: Config.GAME_DURATION,
            survivalTime: 0,
            isWaveBreak: false,
            waveBreakTime: 0
        };
        
        this.lastTime = 0;
        this.currentTime = 0;
        this.animationId = null;
        
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameState.status === 'playing') {
                this.pause();
            }
        });
    }

    startNewGame(playerClass) {
        this.map = new GameMap();
        
        const spawnPos = this.map.findSpawnPosition();
        this.player = new Player(playerClass, spawnPos.x, spawnPos.y);
        this.player.initWeapons();
        
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.muzzleFlashes = [];
        
        this.gameState = {
            status: 'playing',
            currentWave: 0,
            enemiesRemaining: 0,
            timeRemaining: Config.GAME_DURATION,
            survivalTime: 0,
            isWaveBreak: false,
            waveBreakTime: 0
        };
        
        this.cameraLocked = true;
        this.lockFrames = 180;
        this.gameStarted = false;
        
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        const maxX = Math.max(0, Config.MAP_WIDTH - this.width);
        const maxY = Math.max(0, Config.MAP_HEIGHT - this.height);
        this.camera.x = Utils.clamp(targetX, 0, maxX);
        this.camera.y = Utils.clamp(targetY, 0, maxY);
        
        Input.init(this.canvas, this.camera);
        Input.reset();
        Input.updateMouseWorld();
        
        this.startNextWave();
        this.saveGame();
        
        UI.hideAllScreens();
        
        this.render();
        
        setTimeout(() => {
            this.startLoop();
        }, 50);
    }

    loadGame(saveData) {
        this.map = GameMap.deserialize(saveData.map);
        this.player = Player.deserialize(saveData.player);
        
        this.enemies = saveData.enemies.map(e => Enemy.deserialize(e));
        this.bullets = saveData.bullets.map(b => Bullet.deserialize(b));
        this.particles = [];
        this.muzzleFlashes = [];
        
        this.gameState = saveData.gameState;
        
        this.cameraLocked = true;
        this.lockFrames = 180;
        this.gameStarted = false;
        
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        const maxX = Math.max(0, Config.MAP_WIDTH - this.width);
        const maxY = Math.max(0, Config.MAP_HEIGHT - this.height);
        this.camera.x = Utils.clamp(targetX, 0, maxX);
        this.camera.y = Utils.clamp(targetY, 0, maxY);
        
        Input.init(this.canvas, this.camera);
        Input.reset();
        Input.updateMouseWorld();
        
        UI.hideAllScreens();
        
        this.render();
        
        setTimeout(() => {
            this.startLoop();
        }, 50);
    }

    startLoop() {
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        const maxX = Math.max(0, Config.MAP_WIDTH - this.width);
        const maxY = Math.max(0, Config.MAP_HEIGHT - this.height);
        this.camera.x = Utils.clamp(targetX, 0, maxX);
        this.camera.y = Utils.clamp(targetY, 0, maxY);
        
        Input.updateMouseWorld();
        
        this.render();
        
        this.lastTime = performance.now();
        this.currentTime = this.lastTime;
        this.gameStarted = true;
        this.loop();
    }

    loop() {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.currentTime = now;
        
        if (this.gameState.status === 'playing') {
            if (this.cameraLocked) {
                const targetX = this.player.x - this.width / 2;
                const targetY = this.player.y - this.height / 2;
                const maxX = Math.max(0, Config.MAP_WIDTH - this.width);
                const maxY = Math.max(0, Config.MAP_HEIGHT - this.height);
                this.camera.x = Utils.clamp(targetX, 0, maxX);
                this.camera.y = Utils.clamp(targetY, 0, maxY);
                Input.updateMouseWorld();
            }
            
            this.update(dt);
            this.render();
        }
        
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        this.gameState.timeRemaining -= dt;
        this.gameState.survivalTime += dt;
        
        if (this.gameState.isWaveBreak) {
            this.gameState.waveBreakTime -= dt;
            if (this.gameState.waveBreakTime <= 0) {
                this.gameState.isWaveBreak = false;
                this.startNextWave();
            }
        }
        
        if (this.player) {
            this.player.update(dt, this.currentTime, this.map, this.enemies);
            const fired = this.player.tryShoot(this.currentTime, this.bullets);
            if (fired) {
                this.addMuzzleFlash();
            }
            this.updateCamera();
        }

        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            this.muzzleFlashes[i].life -= dt;
            if (this.muzzleFlashes[i].life <= 0) {
                this.muzzleFlashes.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.currentTime, this.player, this.map, this.bullets);
            
            if (enemy.isDead) {
                this.enemies.splice(i, 1);
                this.gameState.enemiesRemaining--;
            }
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(dt, this.map);
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            if (bullet.owner === 'player') {
                for (const enemy of this.enemies) {
                    if (enemy.isDead) continue;
                    const dist = Utils.distance(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < enemy.radius + bullet.radius) {
                        const distance = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
                        const { damage, isCrit } = this.player.calculateDamage(bullet.damage, distance);
                        
                        const scoreGain = enemy.takeDamage(damage);
                        if (scoreGain > 0) {
                            this.player.kills++;
                            this.player.score += scoreGain;
                        }
                        this.player.damageDealt += damage;
                        
                        this.addHitEffect(bullet.x, bullet.y);
                        
                        bullet.active = false;
                        break;
                    }
                }
            } else if (bullet.owner === 'enemy') {
                const dist = Utils.distance(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < this.player.radius + bullet.radius) {
                    this.player.takeDamage(bullet.damage);
                    this.addHitEffect(bullet.x, bullet.y);
                    bullet.active = false;
                }
            }
        }
        
        this.gameState.enemiesRemaining = this.enemies.filter(e => !e.isDead).length;
        
        if (!this.gameState.isWaveBreak && this.gameState.enemiesRemaining === 0 && this.gameState.currentWave > 0) {
            if (this.gameState.currentWave >= Config.TOTAL_WAVES) {
                this.victory();
            } else {
                this.startWaveBreak();
            }
        }
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        if (this.gameState.timeRemaining <= 0) {
            this.victory();
        }
        
        UI.updateHUD(this.player, this.gameState);
        
        if (Math.floor(this.gameState.survivalTime * 10) % 10 === 0) {
            this.saveGame();
        }
    }

    updateCamera() {
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        const maxX = Math.max(0, Config.MAP_WIDTH - this.width);
        const maxY = Math.max(0, Config.MAP_HEIGHT - this.height);
        const clampedTargetX = Utils.clamp(targetX, 0, maxX);
        const clampedTargetY = Utils.clamp(targetY, 0, maxY);
        
        if (this.cameraLocked) {
            this.camera.x = clampedTargetX;
            this.camera.y = clampedTargetY;
            this.lockFrames--;
            if (this.lockFrames <= 0) {
                this.cameraLocked = false;
            }
        } else {
            this.camera.x = Utils.lerp(this.camera.x, clampedTargetX, 0.08);
            this.camera.y = Utils.lerp(this.camera.y, clampedTargetY, 0.08);
        }
        
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
        
        Input.updateMouseWorld();
    }

    addMuzzleFlash() {
        const angle = this.player.angle;
        const dist = 25;
        this.muzzleFlashes.push({
            x: this.player.x + Math.cos(angle) * dist,
            y: this.player.y + Math.sin(angle) * dist,
            angle: angle,
            life: 0.05,
            size: 15 + Math.random() * 5
        });

        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                vx: Math.cos(angle + Utils.randomRange(-0.3, 0.3)) * Utils.randomRange(50, 150),
                vy: Math.sin(angle + Utils.randomRange(-0.3, 0.3)) * Utils.randomRange(50, 150),
                life: 0.15,
                maxLife: 0.15,
                color: '#ffcc00',
                size: Utils.randomRange(2, 4)
            });
        }
    }

    addHitEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Utils.randomRange(0, Math.PI * 2);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * Utils.randomRange(80, 200),
                vy: Math.sin(angle) * Utils.randomRange(80, 200),
                life: 0.2,
                maxLife: 0.2,
                color: '#ff4444',
                size: Utils.randomRange(3, 6)
            });
        }
    }

    startNextWave() {
        this.gameState.currentWave++;
        
        if (this.gameState.currentWave > Config.TOTAL_WAVES) {
            this.victory();
            return;
        }
        
        const waveConfig = Config.WAVE_CONFIG[this.gameState.currentWave - 1];
        this.spawnWaveEnemies(waveConfig);
        
        UI.showWaveAnnounce(this.gameState.currentWave);
    }

    spawnWaveEnemies(config) {
        const { zombies, shooters, elites } = config;
        const total = zombies + shooters + elites;
        this.gameState.enemiesRemaining = total;
        
        for (let i = 0; i < zombies; i++) {
            this.spawnEnemy('zombie');
        }
        
        for (let i = 0; i < shooters; i++) {
            this.spawnEnemy('shooter');
        }
        
        for (let i = 0; i < elites; i++) {
            this.spawnEnemy('elite');
        }
    }

    spawnEnemy(type) {
        let attempts = 0;
        while (attempts < 50) {
            const pos = this.map.findSpawnPosition();
            const distToPlayer = Utils.distance(pos.x, pos.y, this.player.x, this.player.y);
            
            if (distToPlayer > 300) {
                this.enemies.push(new Enemy(type, pos.x, pos.y));
                return;
            }
            attempts++;
        }
        
        const pos = this.map.findSpawnPosition();
        this.enemies.push(new Enemy(type, pos.x, pos.y));
    }

    startWaveBreak() {
        this.gameState.isWaveBreak = true;
        this.gameState.waveBreakTime = Config.WAVE_BREAK_TIME;
        
        this.player.heal(30);
        
        UI.showWaveAnnounce(this.gameState.currentWave, true);
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.map.render(this.ctx, this.camera);
        
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        for (const bullet of this.bullets) {
            bullet.render(this.ctx, this.camera);
        }
        
        for (const enemy of this.enemies) {
            enemy.render(this.ctx, this.camera);
        }
        
        if (this.player) {
            this.player.render(this.ctx, this.camera);
        }
        
        for (const flash of this.muzzleFlashes) {
            this.ctx.save();
            this.ctx.translate(flash.x, flash.y);
            this.ctx.rotate(flash.angle);
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, flash.size);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(flash.size * 1.5, -flash.size * 0.3);
            this.ctx.lineTo(flash.size * 2, 0);
            this.ctx.lineTo(flash.size * 1.5, flash.size * 0.3);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
        
        this.renderCrosshair();
    }

    renderCrosshair() {
        const x = Input.mouse.x;
        const y = Input.mouse.y;
        
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 10;
        
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - 18, y);
        this.ctx.lineTo(x - 6, y);
        this.ctx.moveTo(x + 6, y);
        this.ctx.lineTo(x + 18, y);
        this.ctx.moveTo(x, y - 18);
        this.ctx.lineTo(x, y - 6);
        this.ctx.moveTo(x, y + 6);
        this.ctx.lineTo(x, y + 18);
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
    }

    pause() {
        this.gameState.status = 'paused';
        UI.showPauseScreen();
        this.saveGame();
    }

    resume() {
        this.gameState.status = 'playing';
        UI.hidePauseScreen();
        this.lastTime = performance.now();
    }

    victory() {
        this.gameState.status = 'victory';
        this.stopLoop();
        Storage.clear();
        
        UI.showGameOverScreen(true, {
            survivalTime: Math.floor(this.gameState.survivalTime),
            kills: this.player.kills,
            score: this.player.score,
            damageDealt: this.player.damageDealt,
            wavesCompleted: this.gameState.currentWave
        });
    }

    gameOver() {
        this.gameState.status = 'gameover';
        this.stopLoop();
        Storage.clear();
        
        UI.showGameOverScreen(false, {
            survivalTime: Math.floor(this.gameState.survivalTime),
            kills: this.player.kills,
            score: this.player.score,
            damageDealt: this.player.damageDealt,
            wavesCompleted: this.gameState.currentWave - 1
        });
    }

    stopLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    quitToMenu() {
        this.stopLoop();
        this.gameState.status = 'menu';
        UI.showStartScreen(Storage.hasSave());
    }

    saveGame() {
        if (this.gameState.status !== 'playing') return;
        
        const saveData = {
            player: this.player.serialize(),
            map: this.map.serialize(),
            enemies: this.enemies.map(e => e.serialize()),
            bullets: this.bullets.map(b => b.serialize()),
            gameState: Utils.deepClone(this.gameState)
        };
        
        Storage.save(saveData);
    }

    getState() {
        return this.gameState;
    }
}

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.gameTime = 0;
        
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.energyFragments = [];
        
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.energyCollected = 0;
        this.bossKilled = 0;
        
        this.waveEnemiesRemaining = 0;
        this.waveInProgress = false;
        this.waveAnnouncement = '';
        this.waveAnnouncementTimer = 0;
        
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2;
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        this.ultimateActive = false;
        this.ultimateTimer = 0;
        this.ultimateDuration = 1;
        this.ultimateRadius = 0;
        this.ultimateMaxRadius = 2000;
        
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraShake = 0;
        this.cameraShakeIntensity = 0;
        
        this.onScoreUpdate = null;
        this.onWaveUpdate = null;
        this.onHealthUpdate = null;
        this.onEnergyUpdate = null;
        this.onKillsUpdate = null;
        this.onWaveAnnouncement = null;
        this.onGameOver = null;
        
        this.setupEventListeners();
        this.resize();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' && this.running && !this.paused) {
                e.preventDefault();
                this.activateUltimate();
            }
            
            if (e.code === 'Escape' && this.running) {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        particleSystem.initStars(this.width, this.height);
    }

    start() {
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.gameTime = 0;
        
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.energyCollected = 0;
        this.bossKilled = 0;
        
        this.bullets = [];
        this.enemies = [];
        this.energyFragments = [];
        particleSystem.clear();
        
        this.player = new Player(this.width / 2, this.height / 2);
        
        this.startWave();
        this.updateUI();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    stop() {
        this.running = false;
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    startWave() {
        this.waveInProgress = true;
        
        const isBossWave = this.wave % 5 === 0;
        
        if (isBossWave) {
            this.waveEnemiesRemaining = 1;
            this.waveAnnouncement = `BOSS 来袭！第 ${this.wave} 波`;
            this.spawnBoss();
        } else {
            const baseEnemies = 5 + this.wave * 2;
            this.waveEnemiesRemaining = Math.min(baseEnemies, 30);
            this.waveAnnouncement = `第 ${this.wave} 波`;
            this.enemySpawnTimer = 0;
            this.enemySpawnInterval = Math.max(2 - this.wave * 0.05, 0.5);
        }
        
        this.waveAnnouncementTimer = 3;
        
        if (this.onWaveAnnouncement) {
            this.onWaveAnnouncement(this.waveAnnouncement);
        }
        if (this.onWaveUpdate) {
            this.onWaveUpdate(this.wave);
        }
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        const margin = 50;
        
        switch (side) {
            case 0:
                x = Math.random() * this.width;
                y = -margin;
                break;
            case 1:
                x = this.width + margin;
                y = Math.random() * this.height;
                break;
            case 2:
                x = Math.random() * this.width;
                y = this.height + margin;
                break;
            case 3:
                x = -margin;
                y = Math.random() * this.height;
                break;
        }
        
        const isAsteroid = Math.random() < 0.6;
        
        if (isAsteroid) {
            const sizes = ['large', 'medium', 'small'];
            const sizeWeights = [0.3, 0.4, 0.3];
            let r = Math.random();
            let size = 'large';
            let cumulative = 0;
            for (let i = 0; i < sizes.length; i++) {
                cumulative += sizeWeights[i];
                if (r < cumulative) {
                    size = sizes[i];
                    break;
                }
            }
            this.enemies.push(new Asteroid(x, y, this.wave, size));
        } else {
            this.enemies.push(new Alien(x, y, this.wave));
        }
        
        this.waveEnemiesRemaining--;
    }

    spawnBoss() {
        const boss = new Boss(this.width / 2, 100, this.wave);
        this.enemies.push(boss);
    }

    checkWaveComplete() {
        if (this.waveInProgress && 
            this.waveEnemiesRemaining <= 0 && 
            this.enemies.length === 0) {
            
            this.waveInProgress = false;
            this.wave++;
            
            setTimeout(() => {
                if (this.running && !this.paused) {
                    this.startWave();
                }
            }, 2000);
        }
    }

    activateUltimate() {
        if (!this.player || !this.player.useUltimate()) return;
        
        this.ultimateActive = true;
        this.ultimateTimer = this.ultimateDuration;
        this.ultimateRadius = 0;
        this.cameraShakeIntensity = 20;
        this.cameraShake = 0.5;
        
        particleSystem.emitUltimate(this.player.x, this.player.y, this.ultimateMaxRadius);
        
        for (const enemy of this.enemies) {
            if (enemy.type !== 'boss') {
                const score = enemy.getScoreValue();
                this.score += score;
                this.kills++;
                
                if (Math.random() < enemy.getEnergyDropChance()) {
                    this.spawnEnergyFragment(enemy.x, enemy.y);
                }
                
                enemy.onDeath();
                enemy.destroy();
            } else {
                enemy.takeDamage(200);
            }
        }
        
        for (const bullet of this.bullets) {
            if (!bullet.isPlayerBullet) {
                bullet.destroy();
            }
        }
        
        this.updateUI();
    }

    spawnEnergyFragment(x, y) {
        this.energyFragments.push(new EnergyFragment(x, y));
    }

    gameLoop(currentTime) {
        if (!this.running || this.paused) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.gameTime += deltaTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.waveAnnouncementTimer > 0) {
            this.waveAnnouncementTimer -= deltaTime;
            if (this.waveAnnouncementTimer <= 0 && this.onWaveAnnouncement) {
                this.onWaveAnnouncement('');
            }
        }

        if (this.ultimateActive) {
            this.ultimateTimer -= deltaTime;
            this.ultimateRadius = Math.min(
                this.ultimateMaxRadius,
                this.ultimateRadius + (this.ultimateMaxRadius / this.ultimateDuration) * deltaTime
            );
            
            if (this.ultimateTimer <= 0) {
                this.ultimateActive = false;
            }
        }

        if (this.cameraShake > 0) {
            this.cameraShake -= deltaTime;
            this.cameraX = (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraY = (Math.random() - 0.5) * this.cameraShakeIntensity;
        } else {
            this.cameraX = 0;
            this.cameraY = 0;
            this.cameraShakeIntensity = 0;
        }

        if (this.player && this.player.isActive()) {
            this.player.update(
                deltaTime,
                this.keys,
                this.mouseX,
                this.mouseY,
                this.width,
                this.height
            );
            
            if (this.mouseDown) {
                const bullet = this.player.fire(this.gameTime * 1000);
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }
        }

        if (this.waveInProgress && this.waveEnemiesRemaining > 0 && this.wave % 5 !== 0) {
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                this.spawnEnemy();
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.isActive()) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            enemy.update(deltaTime, this.player.x, this.player.y, this.width, this.height);
            
            if (enemy.type === 'alien') {
                const bullet = enemy.tryFire(
                    this.gameTime * 1000,
                    this.player.x,
                    this.player.y
                );
                if (bullet) {
                    this.bullets.push(bullet);
                }
            } else if (enemy.type === 'boss') {
                const bullets = enemy.tryFire(
                    this.gameTime * 1000,
                    this.player.x,
                    this.player.y
                );
                this.bullets.push(...bullets);
            }
            
            if (this.player && this.player.isActive() && enemy.circleCollidesWith(this.player)) {
                const damage = enemy.type === 'boss' ? 30 : (enemy.type === 'asteroid' ? 15 : 10);
                this.player.takeDamage(damage);
                this.cameraShakeIntensity = 15;
                this.cameraShake = 0.3;
                
                if (enemy.type === 'asteroid') {
                    const newSizes = enemy.split();
                    for (const size of newSizes) {
                        this.enemies.push(new Asteroid(enemy.x, enemy.y, this.wave, size));
                    }
                    enemy.onDeath();
                    enemy.destroy();
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.isActive()) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            bullet.update(deltaTime, this.width, this.height);
            
            if (bullet.isPlayerBullet) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (enemy.isActive() && bullet.circleCollidesWith(enemy)) {
                        const killed = enemy.takeDamage(bullet.damage);
                        bullet.destroy();
                        
                        if (killed) {
                            const score = enemy.getScoreValue();
                            this.score += score;
                            this.kills++;
                            
                            if (enemy.type === 'boss') {
                                this.bossKilled++;
                                this.cameraShakeIntensity = 30;
                                this.cameraShake = 1;
                                
                                const dropAmount = enemy.getEnergyDropAmount();
                                for (let k = 0; k < dropAmount; k++) {
                                    this.spawnEnergyFragment(
                                        enemy.x + (Math.random() - 0.5) * 50,
                                        enemy.y + (Math.random() - 0.5) * 50
                                    );
                                }
                            } else {
                                const dropChance = enemy.getEnergyDropChance();
                                if (Math.random() < dropChance) {
                                    this.spawnEnergyFragment(enemy.x, enemy.y);
                                }
                            }
                            
                            if (enemy.type === 'asteroid') {
                                const newSizes = enemy.split();
                                for (const size of newSizes) {
                                    this.enemies.push(new Asteroid(enemy.x, enemy.y, this.wave, size));
                                }
                            }
                            
                            enemy.onDeath();
                            enemy.destroy();
                            
                            this.updateUI();
                        }
                        break;
                    }
                }
            } else {
                if (this.player && this.player.isActive() && bullet.circleCollidesWith(this.player)) {
                    this.player.takeDamage(bullet.damage);
                    bullet.destroy();
                    this.cameraShakeIntensity = 10;
                    this.cameraShake = 0.2;
                    this.updateUI();
                }
            }
        }

        for (let i = this.energyFragments.length - 1; i >= 0; i--) {
            const fragment = this.energyFragments[i];
            
            if (!fragment.isActive()) {
                this.energyFragments.splice(i, 1);
                continue;
            }
            
            if (this.player && this.player.isActive()) {
                const dx = this.player.x - fragment.x;
                const dy = this.player.y - fragment.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150 && !fragment.collecting) {
                    fragment.startCollecting({ x: this.player.x, y: this.player.y });
                }
                
                const collected = fragment.update(deltaTime, this.player.x, this.player.y);
                
                if (collected) {
                    this.player.addEnergy(5);
                    this.energyCollected += 5;
                    this.energyFragments.splice(i, 1);
                    this.updateUI();
                }
            } else {
                fragment.update(deltaTime, 0, 0);
            }
        }

        particleSystem.updateStars(deltaTime, this.gameTime, this.cameraX, this.cameraY, this.width, this.height);
        particleSystem.update(deltaTime);

        if (this.player && !this.player.isActive()) {
            this.gameOver();
            return;
        }

        this.checkWaveComplete();
    }

    render() {
        this.ctx.save();
        this.ctx.translate(this.cameraX, this.cameraY);

        particleSystem.drawBackground(this.ctx, this.width, this.height, this.wave);

        for (const fragment of this.energyFragments) {
            fragment.draw(this.ctx);
        }

        for (const enemy of this.enemies) {
            if (enemy.isActive()) {
                enemy.draw(this.ctx);
            }
        }

        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        if (this.player && this.player.isActive()) {
            this.player.draw(this.ctx);
        }

        particleSystem.draw(this.ctx);

        if (this.ultimateActive) {
            const alpha = this.ultimateTimer / this.ultimateDuration;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha * 0.3;
            
            const gradient = this.ctx.createRadialGradient(
                this.player.x, this.player.y, 0,
                this.player.x, this.player.y, this.ultimateRadius
            );
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 100, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.ultimateRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 5;
            this.ctx.stroke();
            
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    updateUI() {
        if (this.onScoreUpdate && this.score !== undefined) {
            this.onScoreUpdate(this.score);
        }
        if (this.onHealthUpdate && this.player) {
            this.onHealthUpdate(this.player.health);
        }
        if (this.onEnergyUpdate && this.player) {
            this.onEnergyUpdate(this.player.energy);
        }
        if (this.onKillsUpdate) {
            this.onKillsUpdate(this.kills);
        }
    }

    gameOver() {
        this.running = false;
        this.paused = false;
        
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                wave: this.wave,
                kills: this.kills,
                energyCollected: this.energyCollected,
                bossKilled: this.bossKilled
            });
        }
    }

    getGameState() {
        return {
            score: this.score,
            wave: this.wave,
            kills: this.kills,
            energyCollected: this.energyCollected,
            bossKilled: this.bossKilled,
            health: this.player ? this.player.health : 0,
            energy: this.player ? this.player.energy : 0
        };
    }
}

let gameEngine = null;

function initGameEngine(canvas) {
    gameEngine = new GameEngine(canvas);
    return gameEngine;
}

function getGameEngine() {
    return gameEngine;
}

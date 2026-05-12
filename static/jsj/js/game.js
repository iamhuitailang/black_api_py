class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.highScore = Storage.getHighScore();
        this.comboCount = 0;
        this.lastKillTime = 0;
        
        this.player = null;
        this.bullets = [];
        this.zombieManager = new ZombieManager();
        this.itemManager = new ItemManager();
        this.particleSystem = new ParticleSystem();
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.autoSaveTimer = 0;
        
        this.ui = new UI(this);
        
        this.resize();
        this.setupEventListeners();
        this.drawBackground();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGame(loadSave = false) {
        this.isPlaying = true;
        this.isPaused = false;
        this.isGameOver = false;
        
        if (loadSave) {
            this.loadSavedGame();
        } else {
            this.score = 0;
            this.wave = 1;
            this.kills = 0;
            this.comboCount = 0;
            
            this.bullets = [];
            this.zombieManager.clear();
            this.itemManager.clear();
            this.particleSystem.clear();
            
            this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
            
            this.zombieManager.setDifficulty(this.wave);
        }
        
        this.ui.hideAllScreens();
        this.ui.showHUD();
        
        this.gameLoop();
    }

    loadSavedGame() {
        const saveData = Storage.loadGameState();
        if (!saveData) return false;
        
        this.score = saveData.gameState.score || 0;
        this.wave = saveData.gameState.wave || 1;
        this.kills = saveData.gameState.kills || 0;
        this.highScore = Math.max(this.highScore, saveData.gameState.highScore || 0);
        this.comboCount = saveData.gameState.comboCount || 0;
        
        const playerData = saveData.player;
        this.player = new Player(playerData.x, playerData.y);
        this.player.health = playerData.health;
        this.player.maxHealth = playerData.maxHealth;
        
        if (saveData.weapons && saveData.weapons.length > 0) {
            this.player.weaponManager.weapons = [];
            saveData.weapons.forEach((w, i) => {
                const weaponKey = ['PISTOL', 'SHOTGUN', 'SMG', 'SNIPER'][i] || 'PISTOL';
                const weapon = new Weapon(weaponKey);
                weapon.ammo = w.ammo;
                weapon.isReloading = w.isReloading;
                this.player.weaponManager.weapons.push(weapon);
            });
            if (playerData.currentWeapon !== undefined) {
                this.player.weaponManager.currentWeaponIndex = playerData.currentWeapon;
            }
        }
        
        if (saveData.buffs) {
            this.player.buffs = saveData.buffs;
        }
        
        this.bullets = [];
        if (saveData.bullets) {
            saveData.bullets.forEach(b => {
                const bullet = new Bullet(b.x, b.y, 0, 0, b.damage);
                bullet.vx = b.vx;
                bullet.vy = b.vy;
                this.bullets.push(bullet);
            });
        }
        
        this.zombieManager.clear();
        if (saveData.zombies) {
            saveData.zombies.forEach(z => {
                const zombie = ZombieFactory.create(z.x, z.y, z.type);
                zombie.health = z.health;
                zombie.maxHealth = z.maxHealth;
                this.zombieManager.zombies.push(zombie);
            });
        }
        
        this.itemManager.clear();
        if (saveData.items) {
            saveData.items.forEach(i => {
                const item = new Item(i.x, i.y, i.type);
                this.itemManager.items.push(item);
            });
        }
        
        this.zombieManager.setDifficulty(this.wave);
        
        return true;
    }

    pauseGame() {
        if (!this.isPlaying || this.isGameOver) return;
        this.isPaused = true;
        this.ui.showPauseScreen();
    }

    resumeGame() {
        this.isPaused = false;
        this.ui.hidePauseScreen();
        this.gameLoop();
    }

    restartGame() {
        this.ui.hideAllScreens();
        this.startGame();
    }

    quitToMenu() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        Storage.clear();
        this.ui.showStartScreen();
    }

    gameOver() {
        this.isGameOver = true;
        this.isPlaying = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            Storage.saveHighScore(this.highScore);
        }
        
        Storage.clear();
        this.ui.showGameOverScreen(this.score, this.highScore);
    }

    addScore(amount) {
        this.score += amount;
        this.player.checkWeaponUnlocks(this.score);
    }

    playerTakeDamage(amount) {
        if (!this.player) return;
        
        const isDead = this.player.takeDamage(amount);
        this.ui.showDamageFlash();
        
        if (isDead) {
            this.gameOver();
        }
    }

    killAllZombies() {
        const score = this.zombieManager.killAll();
        this.addScore(score);
        this.particleSystem.emitExplosion(this.canvas.width / 2, this.canvas.height / 2, 100);
    }

    handleShooting() {
        if (this.mouseDown && this.player) {
            this.player.shoot(this.bullets, this.particleSystem);
        }
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return !bullet.isOutOfBounds(this.canvas);
        });
    }

    updateSpawning(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.zombieManager.spawnInterval) {
            this.zombieManager.spawn(this.canvas.width, this.canvas.height);
            this.spawnTimer = 0;
        }
        
        this.waveTimer += deltaTime;
        if (this.waveTimer >= 30000) {
            this.wave++;
            this.zombieManager.setDifficulty(this.wave);
            this.waveTimer = 0;
        }
    }

    checkCollisions() {
        const result = this.zombieManager.checkBulletCollisions(
            this.bullets, 
            this.particleSystem,
            this
        );
        
        this.bullets = result.bullets;
        
        if (result.scoreGained > 0) {
            this.addScore(result.scoreGained);
            this.kills += result.kills;
            
            const now = Date.now();
            if (now - this.lastKillTime < CONFIG.COMBO.TIME_WINDOW) {
                this.comboCount += result.kills;
                if (this.comboCount >= CONFIG.COMBO.KILL_COUNT) {
                    this.addScore(CONFIG.COMBO.BONUS_SCORE);
                    this.ui.showCombo(this.comboCount, CONFIG.COMBO.BONUS_SCORE);
                    this.comboCount = 0;
                }
            } else {
                this.comboCount = result.kills;
            }
            this.lastKillTime = now;
            
            if (Math.random() < 0.1) {
                this.itemManager.trySpawn(
                    this.zombieManager.zombies[this.zombieManager.zombies.length - 1]?.x || this.mouseX,
                    this.zombieManager.zombies[this.zombieManager.zombies.length - 1]?.y || this.mouseY,
                    1
                );
            }
        }
        
        this.zombieManager.checkPlayerCollision(this.player, this);
        this.itemManager.checkPlayerCollision(this.player, this);
    }

    autoSave() {
        this.autoSaveTimer++;
        if (this.autoSaveTimer >= 300) {
            Storage.saveGameState(this);
            this.autoSaveTimer = 0;
        }
    }

    update(deltaTime) {
        if (!this.isPlaying || this.isPaused || this.isGameOver) return;
        
        this.player.update(this.keys, this.mouseX, this.mouseY);
        this.handleShooting();
        this.updateBullets();
        this.zombieManager.update(this.player);
        this.itemManager.update();
        this.particleSystem.update();
        this.updateSpawning(deltaTime);
        this.checkCollisions();
        this.ui.update();
        this.autoSave();
    }

    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#0a0a15');
        skyGradient.addColorStop(0.3, '#151525');
        skyGradient.addColorStop(0.6, '#1a1a30');
        skyGradient.addColorStop(1, '#252030');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137) % w;
            const y = (i * 97) % (h * 0.5);
            const size = (i % 3) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const moonGlow = ctx.createRadialGradient(w * 0.8, h * 0.15, 0, w * 0.8, h * 0.15, 80);
        moonGlow.addColorStop(0, 'rgba(200, 200, 220, 0.3)');
        moonGlow.addColorStop(0.5, 'rgba(150, 150, 180, 0.1)');
        moonGlow.addColorStop(1, 'rgba(100, 100, 130, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(w * 0.8, h * 0.15, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d0d0e0';
        ctx.beginPath();
        ctx.arc(w * 0.8, h * 0.15, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#a0a0b0';
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.14, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.82, h * 0.17, 5, 0, Math.PI * 2);
        ctx.fill();
        
        const buildings = [
            { x: -50, width: 80, height: h * 0.4, windows: 5 },
            { x: 50, width: 60, height: h * 0.35, windows: 4 },
            { x: 130, width: 100, height: h * 0.5, windows: 7 },
            { x: 250, width: 70, height: h * 0.3, windows: 4 },
            { x: 340, width: 90, height: h * 0.45, windows: 6 },
            { x: 450, width: 55, height: h * 0.28, windows: 3 },
            { x: 530, width: 85, height: h * 0.52, windows: 8 },
            { x: 640, width: 65, height: h * 0.38, windows: 5 },
            { x: 730, width: 95, height: h * 0.42, windows: 6 },
            { x: 850, width: 75, height: h * 0.32, windows: 4 },
            { x: 950, width: 110, height: h * 0.48, windows: 7 },
            { x: 1080, width: 80, height: h * 0.36, windows: 5 },
            { x: 1180, width: 90, height: h * 0.44, windows: 6 },
            { x: 1300, width: 70, height: h * 0.3, windows: 4 },
            { x: 1400, width: 100, height: h * 0.5, windows: 7 }
        ];
        
        buildings.forEach(b => {
            const buildingGradient = ctx.createLinearGradient(b.x, h - b.height, b.x, h);
            buildingGradient.addColorStop(0, '#1a1a28');
            buildingGradient.addColorStop(1, '#0f0f18');
            ctx.fillStyle = buildingGradient;
            ctx.fillRect(b.x, h - b.height, b.width, b.height);
            
            ctx.fillStyle = 'rgba(255, 100, 50, 0.15)';
            const windowW = b.width / (b.windows + 1);
            const windowH = b.height / (Math.floor(b.height / 30) + 1);
            
            for (let row = 0; row < Math.floor(b.height / 30); row++) {
                for (let col = 0; col < b.windows; col++) {
                    if (Math.random() > 0.6) {
                        ctx.fillRect(
                            b.x + (col + 1) * windowW - windowW * 0.3,
                            h - b.height + row * windowH + 10,
                            windowW * 0.5,
                            windowH * 0.6
                        );
                    }
                }
            }
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const damageX = b.x + Math.random() * b.width * 0.8;
                const damageY = h - b.height + Math.random() * b.height * 0.6;
                ctx.beginPath();
                ctx.moveTo(damageX, damageY);
                ctx.lineTo(damageX - 10, damageY + 20);
                ctx.lineTo(damageX + 5, damageY + 35);
                ctx.stroke();
            }
        });
        
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(0, h * 0.88, w, h * 0.12);
        
        ctx.fillStyle = '#2a2520';
        for (let i = 0; i < 20; i++) {
            const rubbleX = (i * 80) % w;
            const rubbleY = h * 0.9 + Math.sin(i * 1.5) * 10;
            ctx.beginPath();
            ctx.ellipse(rubbleX, rubbleY, 15 + Math.random() * 10, 8 + Math.random() * 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = 'rgba(50, 50, 60, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, h * 0.88);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = h * 0.88; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
        ctx.beginPath();
        ctx.moveTo(100, h * 0.92);
        ctx.quadraticCurveTo(130, h * 0.82, 160, h * 0.92);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(600, h * 0.93);
        ctx.quadraticCurveTo(640, h * 0.85, 680, h * 0.93);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(1100, h * 0.91);
        ctx.quadraticCurveTo(1150, h * 0.8, 1200, h * 0.91);
        ctx.fill();
    }

    draw() {
        this.drawBackground();
        
        this.itemManager.draw(this.ctx);
        this.zombieManager.draw(this.ctx);
        
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        this.particleSystem.draw(this.ctx);
    }

    gameLoop(timestamp = 0) {
        if (!this.isPlaying || this.isPaused) return;
        
        const deltaTime = 16;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

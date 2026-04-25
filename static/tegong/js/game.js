const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const GAME_DURATION = 60;
const MAX_HEALTH = 10;
const HEADSHOT_BONUS = 2;

const WEAPONS = {
    pistol: {
        name: '手枪',
        damage: 40,
        maxAmmo: 6,
        reloadTime: 1500,
        scopeZoom: 1
    },
    sniper: {
        name: '狙击枪',
        damage: 100,
        maxAmmo: 6,
        reloadTime: 2000,
        scopeZoom: 2,
        cost: 100
    }
};

const ENEMY_TYPES = {
    spy: {
        name: '间谍',
        score: 10,
        health: 100,
        speed: 0,
        radius: 40,
        color: '#666666',
        eyeColor: '#333333',
        canShoot: false
    },
    robot: {
        name: '机器人',
        score: 20,
        health: 100,
        speed: 1.5,
        radius: 45,
        color: '#4444ff',
        eyeColor: '#ff4444',
        canShoot: true
    },
    hostage: {
        name: '人质',
        score: -10,
        health: 100,
        speed: 0,
        radius: 35,
        color: '#ffcc99',
        eyeColor: '#333333',
        canShoot: false,
        isHostage: true
    }
};

const BACKGROUNDS = {
    city: {
        name: '城市',
        skyColor: '#1a1a2e',
        groundColor: '#0f0f1a',
        buildingColors: ['#16213e', '#1a1a3e', '#0f3460'],
        accentColor: '#39ff14'
    },
    desert: {
        name: '沙漠',
        skyColor: '#c2956e',
        groundColor: '#d4a574',
        buildingColors: ['#8b7355', '#a0826d', '#6b5344'],
        accentColor: '#ff6600'
    },
    snow: {
        name: '雪地',
        skyColor: '#87ceeb',
        groundColor: '#e8e8e8',
        buildingColors: ['#b0c4de', '#a9c5db', '#9db4c0'],
        accentColor: '#ffffff'
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSaveData();
        this.setupUI();
        this.resetGameState();
        this.isRunning = false;
        this.lastTime = 0;
        this.animationId = null;
        this.checkSavedGame();
    }
    
    setupCanvas() {
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scale = Math.min(containerWidth / CANVAS_WIDTH, containerHeight / CANVAS_HEIGHT);
        this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
        this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
        this.scale = scale;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseenter', () => this.mouseInCanvas = true);
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseInCanvas = false;
            this.isAiming = false;
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isAiming = false;
            }
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying && !this.isPaused) {
                this.saveCurrentState();
            }
        });
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('switchWeaponBtn').addEventListener('click', () => this.switchWeapon());
        document.getElementById('reloadBtn').addEventListener('click', () => this.reload());
        
        document.getElementById('pistolBtn').addEventListener('click', () => this.selectWeapon('pistol'));
        document.getElementById('sniperBtn').addEventListener('click', () => {
            if (StorageManager.isWeaponUnlocked('sniper')) {
                this.selectWeapon('sniper');
            } else if (StorageManager.canBuySniper()) {
                if (confirm('确定花费100积分购买狙击枪？')) {
                    if (StorageManager.buySniper()) {
                        this.updateMenuUI();
                        this.selectWeapon('sniper');
                    }
                }
            }
        });
    }
    
    loadSaveData() {
        this.saveData = StorageManager.load();
        this.updateMenuUI();
    }
    
    updateMenuUI() {
        const data = StorageManager.load();
        document.getElementById('highScore').textContent = data.highScore;
        document.getElementById('credits').textContent = data.credits;
        
        const sniperBtn = document.getElementById('sniperBtn');
        if (StorageManager.isWeaponUnlocked('sniper')) {
            sniperBtn.classList.remove('locked');
            sniperBtn.textContent = '狙击枪 (伤害:100, 弹夹:6) - 已解锁';
        } else if (StorageManager.canBuySniper()) {
            sniperBtn.classList.remove('locked');
            sniperBtn.textContent = '狙击枪 (伤害:100, 弹夹:6) - 100积分购买';
        } else {
            sniperBtn.classList.add('locked');
            sniperBtn.textContent = `狙击枪 (伤害:100, 弹夹:6) - 需要100积分`;
        }
    }
    
    checkSavedGame() {
        const savedState = StorageManager.loadGameState();
        if (savedState && savedState.isPlaying) {
            if (confirm('检测到未完成的游戏，是否继续？')) {
                this.restoreGameState(savedState);
            } else {
                StorageManager.clearGameState();
            }
        }
    }
    
    resetGameState() {
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.health = MAX_HEALTH;
        this.timeLeft = GAME_DURATION;
        this.combo = 1;
        this.comboTimer = 0;
        this.selectedWeapon = 'pistol';
        this.ammo = {
            pistol: WEAPONS.pistol.maxAmmo,
            sniper: WEAPONS.sniper.maxAmmo
        };
        this.isReloading = false;
        this.reloadTimer = 0;
        this.enemies = [];
        this.effects = [];
        this.particles = [];
        this.damageIndicators = [];
        this.background = null;
        this.mouseX = CANVAS_WIDTH / 2;
        this.mouseY = CANVAS_HEIGHT / 2;
        this.mouseInCanvas = false;
        this.isAiming = false;
        this.scopeZoom = 1;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        this.wave = 1;
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 2000;
        this.maxEnemies = 5;
        this.lastEnemyShot = 0;
        this.enemyShotCooldown = 2000;
        this.enemiesThatShot = new Set();
        this.enemiesAlertTime = 0;
        this.enemiesAlertDuration = 3000;
        this.screenShakeTime = 0;
        this.screenShakeIntensity = 0;
        this.damageFlashTime = 0;
        this.damageFlashIntensity = 0;
        this.animationTime = 0;
        this.windowStates = [];
    }
    
    selectWeapon(weaponId) {
        if (!StorageManager.isWeaponUnlocked(weaponId) && weaponId !== 'pistol') return;
        
        this.selectedWeapon = weaponId;
        
        document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('selected'));
        if (weaponId === 'pistol') {
            document.getElementById('pistolBtn').classList.add('selected');
        } else {
            document.getElementById('sniperBtn').classList.add('selected');
        }
    }
    
    startGame() {
        StorageManager.incrementGamesPlayed();
        this.resetGameState();
        this.selectedWeapon = document.querySelector('.weapon-btn.selected').id === 'pistolBtn' ? 'pistol' : 'sniper';
        
        const bgKeys = Object.keys(BACKGROUNDS);
        this.background = BACKGROUNDS[bgKeys[Math.floor(Math.random() * bgKeys.length)]];
        
        this.isPlaying = true;
        this.isPaused = false;
        this.showScreen('none');
        document.getElementById('gameUI').classList.remove('hidden');
        document.getElementById('controlButtons').classList.remove('hidden');
        
        this.startTimer();
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('controlButtons').classList.add('hidden');
        
        if (screenName === 'start') {
            document.getElementById('startScreen').classList.remove('hidden');
        } else if (screenName === 'pause') {
            document.getElementById('pauseScreen').classList.remove('hidden');
            document.getElementById('gameUI').classList.remove('hidden');
        } else if (screenName === 'gameOver') {
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (this.isPlaying && !this.isPaused) {
                this.timeLeft--;
                this.updateUI();
                
                if (this.timeLeft <= 0) {
                    this.gameOver();
                }
            }
        }, 1000);
    }
    
    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.saveCurrentState();
            this.showScreen('pause');
        } else {
            this.showScreen('none');
            document.getElementById('gameUI').classList.remove('hidden');
            document.getElementById('controlButtons').classList.remove('hidden');
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        this.showScreen('none');
        document.getElementById('gameUI').classList.remove('hidden');
        document.getElementById('controlButtons').classList.remove('hidden');
    }
    
    restartGame() {
        StorageManager.clearGameState();
        this.stopGame();
        this.resetGameState();
        this.updateMenuUI();
        this.showScreen('start');
    }
    
    backToMenu() {
        StorageManager.clearGameState();
        this.stopGame();
        this.resetGameState();
        this.updateMenuUI();
        this.showScreen('start');
    }
    
    stopGame() {
        this.isRunning = false;
        this.isPlaying = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameOver() {
        this.stopGame();
        StorageManager.clearGameState();
        
        const isNewRecord = StorageManager.updateHighScore(this.score);
        const earnedCredits = Math.floor(this.score / 10);
        StorageManager.addCredits(earnedCredits);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('earnedCredits').textContent = earnedCredits;
        
        if (isNewRecord) {
            document.getElementById('newRecord').classList.remove('hidden');
        } else {
            document.getElementById('newRecord').classList.add('hidden');
        }
        
        this.showScreen('gameOver');
        this.updateMenuUI();
    }
    
    saveCurrentState() {
        const state = {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            score: this.score,
            health: this.health,
            timeLeft: this.timeLeft,
            combo: this.combo,
            currentWeapon: this.selectedWeapon,
            ammo: { ...this.ammo },
            maxAmmo: {
                pistol: WEAPONS.pistol.maxAmmo,
                sniper: WEAPONS.sniper.maxAmmo
            },
            wave: this.wave,
            background: this.background ? Object.keys(BACKGROUNDS).find(key => BACKGROUNDS[key] === this.background) : null,
            enemies: this.enemies.map(e => ({
                type: e.type,
                x: e.x,
                y: e.y,
                health: e.health,
                direction: e.direction,
                lastShot: e.lastShot
            })),
            effects: this.effects,
            particles: this.particles,
            damageIndicators: this.damageIndicators,
            lastEnemySpawn: this.lastEnemySpawn,
            lastEnemyShot: this.lastEnemyShot,
            enemyShotCooldown: this.enemyShotCooldown
        };
        
        StorageManager.saveGameState(state);
    }
    
    restoreGameState(state) {
        this.resetGameState();
        
        this.isPlaying = state.isPlaying;
        this.isPaused = state.isPaused;
        this.score = state.score;
        this.health = state.health;
        this.timeLeft = state.timeLeft;
        this.combo = state.combo;
        this.selectedWeapon = state.currentWeapon || 'pistol';
        this.ammo = { ...state.ammo };
        this.wave = state.wave || 1;
        
        if (state.background) {
            this.background = BACKGROUNDS[state.background];
        } else {
            const bgKeys = Object.keys(BACKGROUNDS);
            this.background = BACKGROUNDS[bgKeys[Math.floor(Math.random() * bgKeys.length)]];
        }
        
        if (state.enemies) {
            this.enemies = state.enemies.map(e => this.createEnemyFromData(e));
        }
        
        this.effects = state.effects || [];
        this.particles = state.particles || [];
        this.damageIndicators = state.damageIndicators || [];
        this.lastEnemySpawn = state.lastEnemySpawn || 0;
        this.lastEnemyShot = state.lastEnemyShot || 0;
        this.enemyShotCooldown = state.enemyShotCooldown || 2000;
        
        this.showScreen('none');
        document.getElementById('gameUI').classList.remove('hidden');
        document.getElementById('controlButtons').classList.remove('hidden');
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.startTimer();
        this.gameLoop(this.lastTime);
        this.updateUI();
    }
    
    createEnemyFromData(data) {
        const enemy = new Enemy(data.type, data.x, data.y);
        enemy.health = data.health;
        enemy.direction = data.direction || 1;
        enemy.lastShot = data.lastShot || 0;
        return enemy;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / this.scale;
        this.mouseY = (e.clientY - rect.top) / this.scale;
    }
    
    handleMouseDown(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        if (e.button === 0) {
            this.aim(true);
        }
    }
    
    handleMouseUp(e) {
        if (!this.isPlaying) return;
        
        if (e.button === 0) {
            this.aim(false);
        }
    }
    
    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
        } else if (e.code === 'KeyR') {
            this.reload();
        } else if (e.code === 'Digit1') {
            this.selectWeapon('pistol');
        } else if (e.code === 'Digit2' && StorageManager.isWeaponUnlocked('sniper')) {
            this.selectWeapon('sniper');
        } else if (e.code === 'Escape') {
            if (this.isPlaying) {
                this.togglePause();
            }
        }
    }
    
    aim(isAiming) {
        this.isAiming = isAiming;
        
        if (isAiming) {
            this.fire();
        }
    }
    
    fire() {
        if (this.isReloading) return;
        if (this.ammo[this.selectedWeapon] <= 0) {
            this.reload();
            return;
        }
        
        this.ammo[this.selectedWeapon]--;
        
        const weapon = WEAPONS[this.selectedWeapon];
        const damage = weapon.damage;
        
        this.addShootEffect();
        
        this.enemiesAlertTime = this.enemiesAlertDuration;
        
        let hitEnemy = null;
        let isHeadshot = false;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dist = Math.hypot(this.mouseX - enemy.x, this.mouseY - enemy.y);
            
            if (dist < enemy.radius) {
                hitEnemy = enemy;
                
                const headY = enemy.y - enemy.radius * 0.3;
                const headDist = Math.hypot(this.mouseX - enemy.x, this.mouseY - headY);
                
                if (headDist < enemy.radius * 0.4) {
                    isHeadshot = true;
                }
                
                break;
            }
        }
        
        if (hitEnemy) {
            this.handleEnemyHit(hitEnemy, damage, isHeadshot);
        }
        
        this.updateUI();
        this.saveCurrentState();
    }
    
    handleEnemyHit(enemy, damage, isHeadshot) {
        const finalDamage = isHeadshot ? damage * HEADSHOT_BONUS : damage;
        enemy.health -= finalDamage;
        
        this.addHitEffect(enemy.x, enemy.y, isHeadshot);
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy, isHeadshot);
        } else {
            this.addDamageNumber(enemy.x, enemy.y, finalDamage, false);
        }
    }
    
    killEnemy(enemy, isHeadshot) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        const config = ENEMY_TYPES[enemy.type];
        let points = config.score;
        
        if (isHeadshot && !config.isHostage) {
            points *= 2;
        }
        
        points *= this.combo;
        this.score += points;
        
        if (config.isHostage) {
            this.combo = 1;
            this.comboTimer = 0;
            this.addDamageNumber(enemy.x, enemy.y, points, true);
        } else {
            this.combo++;
            this.comboTimer = 3000;
            this.addDamageNumber(enemy.x, enemy.y, `+${points}`, false);
        }
        
        if (isHeadshot) {
            this.addHeadshotEffect(enemy.x, enemy.y);
        }
        
        this.addExplosionEffect(enemy.x, enemy.y, config.color);
        
        this.updateUI();
    }
    
    reload() {
        if (this.isReloading) return;
        
        const weapon = WEAPONS[this.selectedWeapon];
        if (this.ammo[this.selectedWeapon] >= weapon.maxAmmo) return;
        
        this.isReloading = true;
        this.reloadTimer = weapon.reloadTime;
    }
    
    switchWeapon() {
        if (StorageManager.isWeaponUnlocked('sniper')) {
            if (this.selectedWeapon === 'pistol') {
                this.selectWeapon('sniper');
            } else {
                this.selectWeapon('pistol');
            }
            this.isReloading = false;
            this.updateUI();
        }
    }
    
    addShootEffect() {
        this.effects.push({
            type: 'muzzleFlash',
            x: this.mouseX,
            y: this.mouseY,
            life: 100,
            maxLife: 100
        });
    }
    
    addHitEffect(x, y, isHeadshot) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 500,
                maxLife: 500,
                color: isHeadshot ? '#ff4444' : '#ffaa00',
                size: Math.random() * 4 + 2
            });
        }
    }
    
    addHeadshotEffect(x, y) {
        this.effects.push({
            type: 'headshot',
            x: x,
            y: y - 20,
            text: '💥',
            life: 800,
            maxLife: 800
        });
    }
    
    addExplosionEffect(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 6 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 600,
                maxLife: 600,
                color: color,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    addDamageNumber(x, y, text, isNegative) {
        this.damageIndicators.push({
            x: x,
            y: y,
            text: text.toString(),
            life: 1000,
            maxLife: 1000,
            isNegative: isNegative
        });
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        const types = ['spy', 'spy', 'robot', 'hostage'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const margin = 100;
        const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
        const y = 150 + Math.random() * (CANVAS_HEIGHT - 300);
        
        const enemy = new Enemy(type, x, y);
        this.enemies.push(enemy);
    }
    
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const config = ENEMY_TYPES[enemy.type];
            
            if (config.speed > 0) {
                enemy.x += config.speed * enemy.direction;
                
                if (enemy.x - enemy.radius < 50 || enemy.x + enemy.radius > CANVAS_WIDTH - 50) {
                    enemy.direction *= -1;
                }
            }
            
            if (config.canShoot && this.enemiesAlertTime > 0) {
                const now = performance.now();
                if (now - enemy.lastShot > this.enemyShotCooldown) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = now;
                }
            }
        }
    }
    
    enemyShoot(enemy) {
        this.health--;
        
        this.addDamageNumber(this.mouseX, this.mouseY, '-1', true);
        
        this.screenShakeTime = 200;
        this.screenShakeIntensity = 8;
        
        this.damageFlashTime = 300;
        this.damageFlashIntensity = 0.5;
        
        this.updateDirectionIndicators(enemy);
        
        if (this.health <= 0) {
            this.gameOver();
        }
        
        this.updateUI();
    }
    
    updateDirectionIndicators(enemy) {
        const container = document.getElementById('directionIndicators');
        
        const indicator = document.createElement('div');
        indicator.className = 'direction-indicator';
        
        const dx = enemy.x - this.mouseX;
        const dy = enemy.y - this.mouseY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                indicator.textContent = '⚠️ →';
                indicator.style.right = '20px';
                indicator.style.top = '50%';
                indicator.style.transform = 'translateY(-50%)';
            } else {
                indicator.textContent = '← ⚠️';
                indicator.style.left = '20px';
                indicator.style.top = '50%';
                indicator.style.transform = 'translateY(-50%)';
            }
        } else {
            if (dy > 0) {
                indicator.textContent = '⚠️ ↓';
                indicator.style.bottom = '100px';
                indicator.style.left = '50%';
                indicator.style.transform = 'translateX(-50%)';
            } else {
                indicator.textContent = '↑ ⚠️';
                indicator.style.top = '100px';
                indicator.style.left = '50%';
                indicator.style.transform = 'translateX(-50%)';
            }
        }
        
        container.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1500);
    }
    
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].life -= deltaTime;
            if (this.effects[i].life <= 0) {
                this.effects.splice(i, 1);
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const d = this.damageIndicators[i];
            d.y -= 1;
            d.life -= deltaTime;
            if (d.life <= 0) {
                this.damageIndicators.splice(i, 1);
            }
        }
        
        if (this.enemiesAlertTime > 0) {
            this.enemiesAlertTime -= deltaTime;
            if (this.enemiesAlertTime < 0) {
                this.enemiesAlertTime = 0;
            }
        }
        
        if (this.screenShakeTime > 0) {
            this.screenShakeTime -= deltaTime;
            if (this.screenShakeTime < 0) {
                this.screenShakeTime = 0;
            }
        }
        
        if (this.damageFlashTime > 0) {
            this.damageFlashTime -= deltaTime;
            if (this.damageFlashTime < 0) {
                this.damageFlashTime = 0;
            }
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                this.updateUI();
            }
        }
        
        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                this.ammo[this.selectedWeapon] = WEAPONS[this.selectedWeapon].maxAmmo;
                this.updateUI();
            }
        }
        
        this.animationTime += deltaTime;
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const now = performance.now();
        
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = now;
        }
        
        this.updateEnemies(deltaTime);
        this.updateEffects(deltaTime);
        this.updateUI();
        
        if (Math.floor(now / 5000) !== Math.floor((now - deltaTime) / 5000)) {
            this.saveCurrentState();
        }
    }
    
    render() {
        this.ctx.save();
        
        let shakeX = 0;
        let shakeY = 0;
        if (this.screenShakeTime > 0) {
            const progress = this.screenShakeTime / 200;
            const intensity = this.screenShakeIntensity * progress;
            shakeX = (Math.random() - 0.5) * intensity * 2;
            shakeY = (Math.random() - 0.5) * intensity * 2;
            this.ctx.translate(shakeX, shakeY);
        }
        
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.renderBackground();
        this.renderBuildings();
        this.renderEnemies();
        this.renderEffects();
        this.renderParticles();
        this.renderDamageNumbers();
        this.renderCrosshair();
        
        if (this.isReloading) {
            this.renderReloadProgress();
        }
        
        this.ctx.restore();
        
        if (this.damageFlashTime > 0) {
            const alpha = (this.damageFlashTime / 300) * this.damageFlashIntensity;
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.restore();
        }
        
        if (this.enemiesAlertTime > 0) {
            const alpha = Math.min(0.1, (this.enemiesAlertTime / this.enemiesAlertDuration) * 0.1);
            this.ctx.save();
            
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha + 0.2})`;
            this.ctx.lineWidth = 8;
            this.ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
            
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(15, 15, CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30);
            
            this.ctx.restore();
        }
    }
    
    renderBackground() {
        if (!this.background) return;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, this.background.skyColor);
        gradient.addColorStop(1, this.background.groundColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        const t = this.animationTime;
        const starCount = 60;
        for (let i = 0; i < starCount; i++) {
            const x = (i * 137 + 53) % CANVAS_WIDTH;
            const y = (i * 97 + 29) % (CANVAS_HEIGHT / 2);
            
            const twinkleSpeed = 1000 + (i * 73) % 2000;
            const twinkle = Math.sin((t + i * 100) / twinkleSpeed) * 0.5 + 0.5;
            const alpha = 0.1 + twinkle * 0.4;
            const size = 0.8 + twinkle * 1.2;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (twinkle > 0.85) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x - size * 2, y);
                this.ctx.lineTo(x + size * 2, y);
                this.ctx.moveTo(x, y - size * 2);
                this.ctx.lineTo(x, y + size * 2);
                this.ctx.stroke();
            }
        }
    }
    
    renderBuildings() {
        if (!this.background) return;
        
        const t = this.animationTime;
        
        const buildings = [
            { x: 50, width: 150, height: 300 },
            { x: 250, width: 120, height: 400 },
            { x: 420, width: 180, height: 250 },
            { x: 650, width: 140, height: 350 },
            { x: 850, width: 160, height: 280 },
            { x: 1050, width: 100, height: 380 }
        ];
        
        buildings.forEach((building, index) => {
            const color = this.background.buildingColors[index % this.background.buildingColors.length];
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(building.x, CANVAS_HEIGHT - building.height, building.width, building.height);
            
            const windowSize = 15;
            const windowGap = 25;
            let windowIndex = 0;
            
            for (let wy = CANVAS_HEIGHT - building.height + 30; wy < CANVAS_HEIGHT - 30; wy += windowGap) {
                for (let wx = building.x + 20; wx < building.x + building.width - 20; wx += windowGap) {
                    const seed = building.x * 1000 + wy * 100 + windowIndex;
                    
                    const baseOn = ((seed * 73 + 137) % 100) > 30;
                    
                    const flickerCycle = 5000 + (seed % 3000);
                    const flickerPhase = (t + seed * 17) % flickerCycle;
                    const isChanging = flickerPhase > flickerCycle - 200;
                    
                    let isOn = baseOn;
                    if (isChanging) {
                        const flicker = Math.sin(flickerPhase * 50) > 0;
                        isOn = flicker;
                    }
                    
                    let alpha = 0.25;
                    if (isOn) {
                        const pulse = Math.sin((t + seed * 31) / 1500) * 0.1 + 0.9;
                        alpha = 0.3 + pulse * 0.3;
                    }
                    
                    this.ctx.fillStyle = this.background.accentColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                    this.ctx.fillRect(wx, wy, windowSize, windowSize);
                    
                    windowIndex++;
                }
            }
        });
    }
    
    renderEnemies() {
        this.enemies.forEach(enemy => {
            this.renderEnemy(enemy);
        });
    }
    
    renderEnemy(enemy) {
        const config = ENEMY_TYPES[enemy.type];
        const { x, y, radius } = enemy;
        
        const t = this.animationTime;
        const uniqueOffset = (enemy.x * 137 + enemy.y * 97) % 10000;
        
        const breatheScale = 1 + Math.sin((t + uniqueOffset) / 800) * 0.03;
        const floatOffset = Math.sin((t + uniqueOffset) / 1200) * 3;
        const headBobOffset = Math.sin((t + uniqueOffset) / 1000) * 1.5;
        
        this.ctx.save();
        
        this.ctx.translate(x, y + floatOffset);
        this.ctx.scale(breatheScale, breatheScale);
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, radius * 0.3, radius * 0.8, radius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = config.color;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(0, -radius * 0.2 + headBobOffset, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fillStyle = config.color;
        this.ctx.fill();
        
        const eyeOffset = radius * 0.2;
        const eyeSize = radius * 0.12;
        const headY = -radius * 0.25 + headBobOffset;
        
        const blinkCycle = (t + uniqueOffset) % 4000;
        const isBlinking = blinkCycle > 3900 && blinkCycle < 3980;
        
        this.ctx.fillStyle = '#ffffff';
        if (!isBlinking) {
            this.ctx.beginPath();
            this.ctx.arc(-eyeOffset, headY, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(eyeOffset, headY, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = config.eyeColor;
            this.ctx.beginPath();
            this.ctx.arc(-eyeOffset, headY, eyeSize * 0.6, 0, Math.PI * 2);
            this.ctx.arc(eyeOffset, headY, eyeSize * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = config.eyeColor;
            this.ctx.fillRect(-eyeOffset - eyeSize, headY - 1, eyeSize * 2, 2);
            this.ctx.fillRect(eyeOffset - eyeSize, headY - 1, eyeSize * 2, 2);
        }
        
        if (config.isHostage) {
            this.ctx.fillStyle = '#ff9999';
            this.ctx.font = `${radius * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👤', 0, radius * 0.8);
        }
        
        if (enemy.type === 'robot') {
            const lightPulse = Math.sin((t + uniqueOffset) / 500) * 0.5 + 0.5;
            
            this.ctx.strokeStyle = '#888888';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -radius * 0.8);
            this.ctx.lineTo(0, -radius * 1.1);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 0.3 + lightPulse * 0.7;
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 1.1, 5 + lightPulse * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = lightPulse * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 1.1, 12 + lightPulse * 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.restore();
        
        const healthPercent = enemy.health / ENEMY_TYPES[enemy.type].health;
        const barWidth = radius * 1.5;
        const barHeight = 6;
        
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - barWidth / 2, y + floatOffset - radius * 1.3, barWidth, barHeight);
        
        this.ctx.fillStyle = healthPercent > 0.5 ? '#39ff14' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        this.ctx.fillRect(x - barWidth / 2, y + floatOffset - radius * 1.3, barWidth * healthPercent, barHeight);
    }
    
    renderEffects() {
        this.effects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            
            if (effect.type === 'muzzleFlash') {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, 20 * (1 - alpha), 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else if (effect.type === 'headshot') {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(effect.text, effect.x, effect.y - (1 - alpha) * 50);
                this.ctx.restore();
            }
        });
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    renderDamageNumbers() {
        this.damageIndicators.forEach(d => {
            const alpha = d.life / d.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = d.isNegative ? '#ff4444' : '#39ff14';
            this.ctx.fillText(d.text, d.x, d.y);
            this.ctx.restore();
        });
    }
    
    renderCrosshair() {
        if (!this.mouseInCanvas && this.isPlaying) return;
        
        const { mouseX: x, mouseY: y } = this;
        
        this.ctx.save();
        
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.lineWidth = 2;
        
        const outerSize = 40;
        const innerSize = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - outerSize, y);
        this.ctx.lineTo(x - innerSize, y);
        this.ctx.moveTo(x + innerSize, y);
        this.ctx.lineTo(x + outerSize, y);
        this.ctx.moveTo(x, y - outerSize);
        this.ctx.lineTo(x, y - innerSize);
        this.ctx.moveTo(x, y + innerSize);
        this.ctx.lineTo(x, y + outerSize);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 102, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerSize - 5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        if (this.selectedWeapon === 'sniper') {
            this.ctx.strokeStyle = 'rgba(255, 102, 0, 0.3)';
            this.ctx.lineWidth = 1;
            
            for (let i = 1; i <= 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + outerSize + 5 + i * 10, y - 2);
                this.ctx.lineTo(x + outerSize + 5 + i * 10, y + 2);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x - outerSize - 5 - i * 10, y - 2);
                this.ctx.lineTo(x - outerSize - 5 - i * 10, y + 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    renderReloadProgress() {
        const weapon = WEAPONS[this.selectedWeapon];
        const progress = 1 - (this.reloadTimer / weapon.reloadTime);
        
        this.ctx.save();
        
        const barWidth = 200;
        const barHeight = 20;
        const x = CANVAS_WIDTH / 2 - barWidth / 2;
        const y = CANVAS_HEIGHT - 100;
        
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = '#39ff14';
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        this.ctx.strokeStyle = '#39ff14';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('装弹中...', CANVAS_WIDTH / 2, y + 15);
        
        this.ctx.restore();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('timer').textContent = this.timeLeft;
        document.getElementById('health').textContent = this.health;
        document.getElementById('combo').textContent = `x${this.combo}`;
        
        const weapon = WEAPONS[this.selectedWeapon];
        document.getElementById('weaponName').textContent = weapon.name;
        document.getElementById('ammo').textContent = `${this.ammo[this.selectedWeapon]}/${weapon.maxAmmo}`;
        
        const healthEl = document.getElementById('health');
        if (this.health <= 3) {
            healthEl.style.color = '#ff4444';
            healthEl.style.textShadow = '0 0 10px #ff4444';
        } else {
            healthEl.style.color = '';
            healthEl.style.textShadow = '';
        }
        
        const timerEl = document.getElementById('timer');
        if (this.timeLeft <= 10) {
            timerEl.style.color = '#ff4444';
            timerEl.style.textShadow = '0 0 10px #ff4444';
        } else {
            timerEl.style.color = '';
            timerEl.style.textShadow = '';
        }
    }
}

class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = ENEMY_TYPES[type].radius;
        this.health = ENEMY_TYPES[type].health;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.lastShot = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

const API_BASE = '/api/shooting';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    SUPPLY: 'supply',
    GAMEOVER: 'gameover',
    WIN: 'win'
};

const BulletType = {
    NORMAL: 'normal',
    EXPLOSIVE: 'explosive',
    PIERCING: 'piercing'
};

const EnemyType = {
    RUSH: 'rush',
    DEFENSE: 'defense',
    SUICIDE: 'suicide'
};

class ThermalShooterGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = GameState.MENU;
        this.levels = [];
        this.selectedLevel = null;
        this.levelConfig = null;
        this.currentWave = 0;
        this.score = 0;
        this.kills = 0;
        this.gameStartTime = 0;
        this.supplyTimer = 0;
        this.supplyInterval = null;

        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.floatTexts = [];

        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.lastFrameTime = 0;
        this.animationId = null;

        this.init();
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.bindEvents();
        this.loadLevels();
        this.initDefaultData();
    }

    resizeCanvas() {
        const hudTop = document.querySelector('.game-hud');
        const hudHeight = hudTop ? hudTop.offsetHeight : 160;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - hudHeight;
        this.cellSize = 40;
        this.gridCols = Math.floor(this.canvas.width / this.cellSize);
        this.gridRows = Math.floor(this.canvas.height / this.cellSize);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === '1') this.selectBullet(BulletType.NORMAL);
            if (e.key === '2') this.selectBullet(BulletType.EXPLOSIVE);
            if (e.key === '3') this.selectBullet(BulletType.PIERCING);
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.tryShoot();
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.selectBullet(BulletType.EXPLOSIVE);
            } else {
                this.selectBullet(BulletType.PIERCING);
            }
        }, { passive: false });

        document.querySelectorAll('.bullet-type').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.type;
                this.selectBullet(type);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
        document.getElementById('retry-btn').addEventListener('click', () => this.startGame());
        document.getElementById('back-menu-btn').addEventListener('click', () => this.backToMenu());
    }

    async initDefaultData() {
        try {
            await fetch(`${API_BASE}/init/data/get`);
        } catch (e) {
            console.log('Init data skipped');
        }
    }

    async loadLevels() {
        try {
            const res = await fetch(`${API_BASE}/level/list/get`);
            const data = await res.json();
            if (data.code === 0 && data.data.items.length > 0) {
                this.levels = data.data.items;
                this.renderLevelList();
            }
        } catch (e) {
            console.error('Failed to load levels:', e);
        }
    }

    renderLevelList() {
        const container = document.getElementById('level-list');
        container.innerHTML = '';

        this.levels.forEach(level => {
            const div = document.createElement('div');
            div.className = 'level-item';
            div.dataset.levelNum = level.level_num;
            div.innerHTML = `
                <div class="level-num">${level.level_num}</div>
                <div class="level-name">${level.level_name.split(' - ')[1] || level.level_name}</div>
            `;
            div.addEventListener('click', () => this.selectLevel(level.level_num));
            container.appendChild(div);
        });
    }

    async selectLevel(levelNum) {
        this.selectedLevel = levelNum;

        document.querySelectorAll('.level-item').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.levelNum) === levelNum);
        });

        document.getElementById('start-btn').disabled = false;

        try {
            const res = await fetch(`${API_BASE}/ranking/get?level_num=${levelNum}&limit=10`);
            const data = await res.json();
            this.renderRanking(data.code === 0 ? data.data.items : []);
        } catch (e) {
            this.renderRanking([]);
        }
    }

    renderRanking(items) {
        const container = document.getElementById('ranking-display');
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="hint">暂无记录，来创造第一个记录吧！</p>';
            return;
        }

        container.innerHTML = '';
        items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `ranking-item rank-${idx + 1}`;
            div.innerHTML = `
                <span class="rank-num">#${idx + 1}</span>
                <span class="rank-name">${item.player_name}</span>
                <span class="rank-kills">击杀 ${item.kills}</span>
                <span class="rank-score">${item.score} 分</span>
            `;
            container.appendChild(div);
        });
    }

    async startGame() {
        if (!this.selectedLevel) return;

        try {
            const res = await fetch(`${API_BASE}/level/config/get?level_num=${this.selectedLevel}`);
            const data = await res.json();
            if (data.code !== 0) {
                alert(data.message);
                return;
            }
            this.levelConfig = data.data;
        } catch (e) {
            alert('加载关卡配置失败');
            return;
        }

        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        setTimeout(() => {
            this.resizeCanvas();
            this.initGameState();
            this.startGameLoop();
        }, 100);
    }

    initGameState() {
        const heatSys = this.levelConfig.heat_system;
        const playerCfg = this.levelConfig.player;

        this.state = GameState.PLAYING;
        this.currentWave = 0;
        this.score = 0;
        this.kills = 0;
        this.gameStartTime = Date.now();
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.floatTexts = [];

        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 16,
            health: playerCfg.initial_health,
            maxHealth: playerCfg.max_health,
            heat: heatSys.initial_heat,
            maxHeat: heatSys.max_heat,
            speed: playerCfg.move_speed * 180,
            angle: 0,
            selectedBullet: BulletType.NORMAL,
            lastStepTime: 0,
            invincible: 0
        };

        this.selectBullet(BulletType.NORMAL);
        this.updateHUD();
        this.spawnWave();
        this.hideOverlays();
    }

    hideOverlays() {
        document.getElementById('supply-overlay').classList.add('hidden');
        document.getElementById('gameover-overlay').classList.add('hidden');
    }

    spawnWave() {
        this.currentWave++;
        if (this.currentWave > this.levelConfig.wave_count) {
            this.winGame();
            return;
        }

        const waveData = this.levelConfig.wave_config.find(w => w.wave_num === this.currentWave);
        if (!waveData) return;

        const spawnPoints = this.getSpawnPoints();
        let spawnIdx = 0;

        waveData.enemies.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                const spawn = spawnPoints[spawnIdx % spawnPoints.length];
                spawnIdx++;
                this.spawnEnemy(group.type, spawn.x, spawn.y);
            }
        });

        this.updateHUD();
    }

    getSpawnPoints() {
        const points = [];
        const padding = 60;
        const edges = [
            { x: padding, y: padding },
            { x: this.canvas.width - padding, y: padding },
            { x: padding, y: this.canvas.height - padding },
            { x: this.canvas.width - padding, y: this.canvas.height - padding },
            { x: this.canvas.width / 2, y: padding },
            { x: this.canvas.width / 2, y: this.canvas.height - padding },
            { x: padding, y: this.canvas.height / 2 },
            { x: this.canvas.width - padding, y: this.canvas.height / 2 }
        ];
        edges.forEach(p => points.push({
            x: p.x + (Math.random() - 0.5) * 100,
            y: p.y + (Math.random() - 0.5) * 100
        }));
        return points.sort(() => Math.random() - 0.5);
    }

    spawnEnemy(type, x, y) {
        const types = this.levelConfig.enemy_types;
        const cfg = types[type];
        const baseHp = cfg.hp;
        const difficultyMult = 1 + (this.selectedLevel - 1) * 0.25;
        const enemy = {
            type: type,
            x: x,
            y: y,
            radius: type === EnemyType.DEFENSE ? 20 : type === EnemyType.SUICIDE ? 16 : 14,
            hp: Math.floor(baseHp * difficultyMult),
            maxHp: Math.floor(baseHp * difficultyMult),
            speed: cfg.speed * (type === EnemyType.RUSH ? 120 : type === EnemyType.DEFENSE ? 40 : 80),
            damage: cfg.damage || 0,
            color: cfg.color,
            explodeRadius: cfg.explode_radius ? cfg.explode_radius * this.cellSize : 0,
            explodeDamage: cfg.explode_damage || 0,
            shieldReduction: cfg.shield_reduction || 0,
            angle: 0,
            lastAttack: 0,
            explodeTriggered: false
        };
        this.enemies.push(enemy);
    }

    selectBullet(type) {
        if (!this.player) {
            document.querySelectorAll('.bullet-type').forEach(el => {
                el.classList.toggle('selected', el.dataset.type === type);
            });
            return;
        }
        this.player.selectedBullet = type;
        document.querySelectorAll('.bullet-type').forEach(el => {
            el.classList.toggle('selected', el.dataset.type === type);
        });
        this.updateBulletAvailability();
    }

    updateBulletAvailability() {
        if (!this.player) return;
        const bulletCosts = {
            [BulletType.NORMAL]: 10,
            [BulletType.EXPLOSIVE]: 35,
            [BulletType.PIERCING]: 50
        };
        document.querySelectorAll('.bullet-type').forEach(el => {
            const cost = bulletCosts[el.dataset.type];
            el.classList.toggle('insufficient', this.player.heat < cost);
        });
    }

    tryShoot() {
        if (this.state !== GameState.PLAYING) return;
        if (!this.player || this.player.heat <= 0) return;

        const bulletCosts = {
            [BulletType.NORMAL]: 10,
            [BulletType.EXPLOSIVE]: 35,
            [BulletType.PIERCING]: 50
        };
        const bulletCfg = this.levelConfig.bullet_types;
        const type = this.player.selectedBullet;
        const cost = bulletCosts[type];

        if (this.player.heat < cost) {
            this.addFloatText(this.player.x, this.player.y - 30, '热能不足!', '#ff4444');
            return;
        }

        this.player.heat -= cost;
        this.updateHUD();
        this.updateBulletAvailability();

        const angle = this.player.angle;
        const speed = 600;

        const bullet = {
            type: type,
            x: this.player.x + Math.cos(angle) * (this.player.radius + 5),
            y: this.player.y + Math.sin(angle) * (this.player.radius + 5),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: type === BulletType.EXPLOSIVE ? 8 : type === BulletType.PIERCING ? 6 : 5,
            damage: bulletCfg[type].damage,
            color: bulletCfg[type].color,
            life: 2.5,
            piercedEnemies: [],
            pierceCount: bulletCfg[type].pierce_count || 0,
            radius_damage: bulletCfg[type].radius || 0,
            damageReduction: bulletCfg[type].damage_reduction || 0
        };

        this.bullets.push(bullet);
        this.createMuzzleFlash(this.player.x + Math.cos(angle) * (this.player.radius + 10),
            this.player.y + Math.sin(angle) * (this.player.radius + 10),
            bullet.color);
    }

    createMuzzleFlash(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.2,
                maxLife: 0.2,
                radius: 2 + Math.random() * 3,
                color: color
            });
        }
    }

    createExplosion(x, y, radius, color) {
        const particleCount = Math.floor(radius * 2);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 50 + Math.random() * 150;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                maxLife: 0.5,
                radius: 3 + Math.random() * 5,
                color: color
            });
        }
    }

    addFloatText(x, y, text, color) {
        this.floatTexts.push({
            x: x,
            y: y,
            text: text,
            color: color || '#fff',
            life: 1.0,
            maxLife: 1.0,
            vy: -50
        });
    }

    recoverHeatOnStep() {
        const now = Date.now();
        if (now - this.player.lastStepTime > 150) {
            this.player.heat = Math.min(this.player.maxHeat,
                this.player.heat + this.levelConfig.heat_system.recover_per_step);
            this.player.lastStepTime = now;
            this.updateHUD();
            this.updateBulletAvailability();
        }
    }

    recoverHeatOnKill() {
        this.player.heat = Math.min(this.player.maxHeat,
            this.player.heat + this.levelConfig.heat_system.recover_per_kill);
        this.updateHUD();
        this.updateBulletAvailability();
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        const loop = (now) => {
            const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
            this.lastFrameTime = now;
            this.update(dt);
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(dt) {
        if (this.state === GameState.PLAYING) {
            this.updatePlayer(dt);
            this.updateBullets(dt);
            this.updateEnemies(dt);
            this.checkWaveComplete();
        }
        this.updateParticles(dt);
        this.updateFloatTexts(dt);
    }

    updatePlayer(dt) {
        if (!this.player) return;

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
            const newX = this.player.x + dx * this.player.speed * 0.016;
            const newY = this.player.y + dy * this.player.speed * 0.016;
            if (newX !== this.player.x || newY !== this.player.y) {
                this.recoverHeatOnStep();
            }
            this.player.x = Math.max(this.player.radius,
                Math.min(this.canvas.width - this.player.radius, newX));
            this.player.y = Math.max(this.player.radius,
                Math.min(this.canvas.height - this.player.radius, newY));
        }

        this.player.angle = Math.atan2(
            this.mouse.y - this.player.y,
            this.mouse.x - this.player.x
        );

        if (this.player.invincible > 0) {
            this.player.invincible -= 0.016;
        }

        if (this.mouse.down) {
            this.tryShoot();
            this.mouse.down = false;
        }
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            let hitEnemy = false;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (b.piercedEnemies.includes(j)) continue;

                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                if (dist < b.radius + e.radius) {
                    hitEnemy = true;

                    let damage = b.damage;

                    if (e.type === EnemyType.DEFENSE) {
                        const dx = e.x - this.player.x;
                        const dy = e.y - this.player.y;
                        const enemyAngle = Math.atan2(dy, dx);
                        const bulletAngle = Math.atan2(-b.vy, -b.vx);
                        let angleDiff = Math.abs(bulletAngle - enemyAngle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (angleDiff < Math.PI / 2) {
                            damage = damage * (1 - e.shieldReduction);
                            this.addFloatText(e.x, e.y - 20, '格挡!', '#4488ff');
                        }
                    }

                    if (b.type === BulletType.PIERCING && b.piercedEnemies.length > 0) {
                        damage = damage * (1 - b.damageReduction);
                    }

                    e.hp -= damage;
                    this.addFloatText(e.x, e.y - 20, `-${Math.round(damage)}`, '#ffff00');
                    this.createHitParticles(b.x, b.y, b.color);

                    if (b.type === BulletType.EXPLOSIVE) {
                        this.createExplosion(b.x, b.y, b.radius_damage * this.cellSize, b.color);
                        this.explosionDamage(b.x, b.y, b.radius_damage * this.cellSize, b.damage);
                    }

                    if (b.type === BulletType.PIERCING) {
                        b.piercedEnemies.push(j);
                        if (b.piercedEnemies.length >= b.pierceCount) {
                            break;
                        }
                        hitEnemy = false;
                    }

                    if (e.hp <= 0) {
                        this.killEnemy(j);
                    }

                    if (hitEnemy && b.type !== BulletType.PIERCING) {
                        break;
                    }
                }
            }

            if (hitEnemy && b.type !== BulletType.PIERCING) {
                this.bullets.splice(i, 1);
                continue;
            }

            if (b.life <= 0 ||
                b.x < -50 || b.x > this.canvas.width + 50 ||
                b.y < -50 || b.y > this.canvas.height + 50) {
                if (b.type === BulletType.EXPLOSIVE && b.life <= 0) {
                    this.createExplosion(b.x, b.y, b.radius_damage * this.cellSize, b.color);
                }
                this.bullets.splice(i, 1);
            }
        }
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.3,
                maxLife: 0.3,
                radius: 2 + Math.random() * 2,
                color: color
            });
        }
    }

    explosionDamage(x, y, radius, baseDamage) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            const dist = Math.hypot(e.x - x, e.y - y);
            if (dist < radius + e.radius) {
                const falloff = 1 - (dist / radius);
                const dmg = Math.max(0, baseDamage * falloff);
                e.hp -= dmg;
                this.addFloatText(e.x, e.y - 20, `-${Math.round(dmg)}`, '#ff8800');
                if (e.hp <= 0) {
                    this.killEnemy(j);
                }
            }
        }
    }

    killEnemy(index) {
        const e = this.enemies[index];
        this.createExplosion(e.x, e.y, e.radius + 10, e.color);
        this.score += e.type === EnemyType.DEFENSE ? 50 :
            e.type === EnemyType.SUICIDE ? 30 : 20;
        this.kills++;
        this.recoverHeatOnKill();
        this.addFloatText(e.x, e.y, '+' + (e.type === EnemyType.DEFENSE ? 50 :
            e.type === EnemyType.SUICIDE ? 30 : 20), '#00ff88');
        this.enemies.splice(index, 1);
        this.updateHUD();
    }

    updateEnemies(dt) {
        const now = Date.now();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dx = this.player.x - e.x;
            const dy = this.player.y - e.y;
            const dist = Math.hypot(dx, dy);
            e.angle = Math.atan2(dy, dx);

            if (e.type === EnemyType.SUICIDE) {
                const triggerDist = e.explodeRadius;
                if (dist < triggerDist && !e.explodeTriggered) {
                    e.explodeTriggered = true;
                }
                if (e.explodeTriggered) {
                    e.speed *= 1.5;
                    if (dist < this.player.radius + e.radius + 5) {
                        this.suicideExplode(i);
                        continue;
                    }
                }
            }

            if (dist > 0) {
                e.x += (dx / dist) * e.speed * dt;
                e.y += (dy / dist) * e.speed * dt;
            }

            if (e.type !== EnemyType.SUICIDE) {
                const touchDist = this.player.radius + e.radius;
                if (dist < touchDist && now - e.lastAttack > 800) {
                    this.damagePlayer(e.damage);
                    e.lastAttack = now;
                }
            }
        }
    }

    suicideExplode(index) {
        const e = this.enemies[index];
        this.createExplosion(e.x, e.y, e.explodeRadius, e.color);

        const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);
        if (distToPlayer < e.explodeRadius) {
            const falloff = 1 - (distToPlayer / e.explodeRadius);
            const dmg = Math.max(0, e.explodeDamage * falloff);
            this.damagePlayer(dmg);
        }

        for (let j = this.enemies.length - 1; j >= 0; j--) {
            if (j === index) continue;
            const other = this.enemies[j];
            const d = Math.hypot(other.x - e.x, other.y - e.y);
            if (d < e.explodeRadius) {
                const falloff = 1 - (d / e.explodeRadius);
                other.hp -= e.explodeDamage * 0.5 * falloff;
                if (other.hp <= 0) {
                    this.killEnemy(j > index ? j - 1 : j);
                }
            }
        }

        this.score += 30;
        this.kills++;
        this.recoverHeatOnKill();
        this.addFloatText(e.x, e.y, '+30', '#00ff88');
        if (index < this.enemies.length) {
            this.enemies.splice(index, 1);
        }
        this.updateHUD();
    }

    damagePlayer(damage) {
        if (this.player.invincible > 0) return;
        this.player.health -= damage;
        this.player.invincible = 0.5;
        this.addFloatText(this.player.x, this.player.y - 30, `-${Math.round(damage)}`, '#ff4444');
        this.updateHUD();
        if (this.player.health <= 0) {
            this.gameOver(false);
        }
    }

    checkWaveComplete() {
        if (this.enemies.length === 0 && this.currentWave < this.levelConfig.wave_count) {
            this.startSupplyPhase();
        }
    }

    startSupplyPhase() {
        this.state = GameState.SUPPLY;
        this.supplyTimer = this.levelConfig.supply_interval;
        document.getElementById('supply-overlay').classList.remove('hidden');
        document.getElementById('supply-timer').textContent = this.supplyTimer;

        if (this.supplyInterval) clearInterval(this.supplyInterval);
        this.supplyInterval = setInterval(() => {
            this.supplyTimer--;
            document.getElementById('supply-timer').textContent = this.supplyTimer;
            if (this.supplyTimer <= 0) {
                clearInterval(this.supplyInterval);
                this.supplyInterval = null;
                this.endSupplyPhase();
            }
        }, 1000);
    }

    endSupplyPhase() {
        document.getElementById('supply-overlay').classList.add('hidden');
        this.state = GameState.PLAYING;
        this.spawnWave();
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateFloatTexts(dt) {
        for (let i = this.floatTexts.length - 1; i >= 0; i--) {
            const t = this.floatTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            if (t.life <= 0) {
                this.floatTexts.splice(i, 1);
            }
        }
    }

    updateHUD() {
        if (!this.player) return;
        document.getElementById('hud-level').textContent = this.selectedLevel;
        document.getElementById('hud-wave').textContent =
            `${this.currentWave}/${this.levelConfig ? this.levelConfig.wave_count : 6}`;
        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-kills').textContent = this.kills;

        const hpPct = Math.max(0, this.player.health / this.player.maxHealth * 100);
        document.getElementById('health-fill').style.width = hpPct + '%';
        document.getElementById('health-text').textContent =
            `${Math.max(0, Math.round(this.player.health))}/${this.player.maxHealth}`;

        const heatPct = Math.max(0, this.player.heat / this.player.maxHeat * 100);
        document.getElementById('heat-fill').style.width = heatPct + '%';
        document.getElementById('heat-text').textContent =
            `${Math.round(this.player.heat)} / ${this.player.maxHeat}`;
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawBullets();
        this.drawEnemies();
        this.drawPlayer();
        this.drawParticles();
        this.drawFloatTexts();
        this.drawAimLine();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(60, 60, 100, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawPlayer() {
        if (!this.player) return;
        const ctx = this.ctx;
        const p = this.player;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#3388ff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#2266cc';
        ctx.strokeStyle = '#66bbff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#aaddff';
        ctx.fillRect(p.radius - 2, -4, 18, 8);
        ctx.strokeStyle = '#66bbff';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.radius - 2, -4, 18, 8);

        ctx.restore();

        const hpBarW = 40;
        const hpBarH = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(p.x - hpBarW / 2, p.y - p.radius - 14, hpBarW, hpBarH);
        const hpPct = Math.max(0, p.health / p.maxHealth);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff66' : hpPct > 0.25 ? '#ffcc00' : '#ff3333';
        ctx.fillRect(p.x - hpBarW / 2, p.y - p.radius - 14, hpBarW * hpPct, hpBarH);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - hpBarW / 2, p.y - p.radius - 14, hpBarW, hpBarH);
    }

    drawEnemies() {
        const ctx = this.ctx;
        this.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.angle);

            let fillColor = e.color;
            if (e.type === EnemyType.DEFENSE) {
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = fillColor;
                ctx.beginPath();
                ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#88bbff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, e.radius, -Math.PI / 3, Math.PI / 3);
                ctx.stroke();

                ctx.fillStyle = '#aaccff';
                ctx.fillRect(e.radius * 0.3, -3, 10, 6);
            } else if (e.type === EnemyType.SUICIDE) {
                const pulse = 1 + Math.sin(Date.now() / 100) * 0.15;
                if (e.explodeTriggered) {
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 25;
                } else {
                        ctx.shadowColor = e.color;
                        ctx.shadowBlur = 10;
                    }
                ctx.fillStyle = fillColor;
                ctx.beginPath();
                ctx.arc(0, 0, e.radius * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = e.explodeTriggered ? '#ff0000' : '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = fillColor;
                ctx.beginPath();
                ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#ffaaaa';
                ctx.beginPath();
                ctx.moveTo(e.radius, -e.radius * 0.6);
                ctx.lineTo(e.radius + 12, 0);
                ctx.lineTo(e.radius, e.radius * 0.6);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();

            const hpBarW = e.radius * 2.5;
            const hpBarH = 4;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(e.x - hpBarW / 2, e.y - e.radius - 10, hpBarW, hpBarH);
            const hpPct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = hpPct > 0.5 ? '#00ff66' : hpPct > 0.25 ? '#ffcc00' : '#ff3333';
            ctx.fillRect(e.x - hpBarW / 2, e.y - e.radius - 10, hpBarW * hpPct, hpBarH);
        });
    }

    drawBullets() {
        const ctx = this.ctx;
        this.bullets.forEach(b => {
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = b.type === BulletType.EXPLOSIVE ? 20 : 12;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            if (b.type === BulletType.PIERCING) {
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawFloatTexts() {
        const ctx = this.ctx;
        this.floatTexts.forEach(t => {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.font = 'bold 14px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 5;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        });
    }

    drawAimLine() {
        if (!this.player || this.state !== GameState.PLAYING) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 8]);
        ctx.beginPath();
        ctx.moveTo(
            this.player.x + Math.cos(this.player.angle) * (this.player.radius + 20),
            this.player.y + Math.sin(this.player.angle) * (this.player.radius + 20)
        );
        ctx.lineTo(
            this.player.x + Math.cos(this.player.angle) * 300,
            this.player.y + Math.sin(this.player.angle) * 300
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    gameOver(win) {
        this.state = win ? GameState.WIN : GameState.GAMEOVER;
        this.stopGameLoop();
        if (this.supplyInterval) {
            clearInterval(this.supplyInterval);
            this.supplyInterval = null;
        }

        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.finalStats = {
            win: win,
            score: this.score,
            kills: this.kills,
            remainingHealth: Math.max(0, Math.round(this.player.health)),
            maxHealth: this.player.maxHealth,
            waves: this.currentWave,
            totalWaves: this.levelConfig.wave_count,
            duration: duration
        };

        document.getElementById('gameover-title').textContent = win ? '🎉 胜利通关！🎉' : '💀 游戏结束 💀';
        document.getElementById('gameover-title').style.color = win ? '#00ff88' : '#ff4444';

        const statsDiv = document.getElementById('gameover-stats');
        statsDiv.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">最终得分</span>
                <span class="stat-value score-highlight">${this.score} 分</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">击杀数</span>
                <span class="stat-value">${this.kills}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">通关波次</span>
                <span class="stat-value">${this.currentWave} / ${this.levelConfig.wave_count}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">剩余生命</span>
                <span class="stat-value">${this.finalStats.remainingHealth} / ${this.player.maxHealth}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">游戏时长</span>
                <span class="stat-value">${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>
            </div>
        `;

        document.getElementById('gameover-overlay').classList.remove('hidden');
    }

    winGame() {
        this.gameOver(true);
    }

    async submitScore() {
        if (!this.finalStats) return;
        const playerName = document.getElementById('player-name').value.trim() || '无名玩家';

        try {
            const res = await fetch(`${API_BASE}/score/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level_num: this.selectedLevel,
                    player_name: playerName,
                    score: this.finalStats.score,
                    kills: this.finalStats.kills,
                    remaining_health: this.finalStats.remainingHealth,
                    duration: this.finalStats.duration
                })
            });
            const data = await res.json();
            if (data.code === 0) {
                const btn = document.getElementById('submit-score-btn');
                btn.disabled = true;
                btn.textContent = data.data.rank
                    ? `已提交！排名第 ${data.data.rank}`
                    : '已提交！';
                btn.style.background = 'linear-gradient(135deg, #4a8a4a, #6aaa6a)';
            } else {
                alert('提交失败：' + data.message);
            }
        } catch (e) {
            alert('提交失败');
        }
    }

    backToMenu() {
        this.stopGameLoop();
        if (this.supplyInterval) {
            clearInterval(this.supplyInterval);
            this.supplyInterval = null;
        }
        document.getElementById('submit-score-btn').disabled = false;
        document.getElementById('submit-score-btn').textContent = '提交分数';
        document.getElementById('submit-score-btn').style.background = '';

        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('menu-screen').classList.add('active');
        this.state = GameState.MENU;
        this.hideOverlays();
        this.selectedLevel && this.selectLevel(this.selectedLevel);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ThermalShooterGame();
});

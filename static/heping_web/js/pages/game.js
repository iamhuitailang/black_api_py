const GamePage = {
    canvas: null,
    ctx: null,
    gameState: 'loading',
    mapId: 0,
    animFrame: null,
    autoSaveTimer: null,
    lastTime: 0,
    startTime: 0,
    elapsedTime: 0,

    WORLD_W: 3000,
    WORLD_H: 3000,
    SAFE_ZONE_INITIAL: 2000,
    safeZoneRadius: 2000,
    safeZoneCenterX: 1500,
    safeZoneCenterY: 1500,
    safeZoneTargetRadius: 2000,
    safeZoneTargetCX: 1500,
    safeZoneTargetCY: 1500,
    safeZoneShrinkSpeed: 0.15,
    safeZonePhase: 0,
    safeZonePhaseTimer: 0,
    outsideDamage: 2,

    player: null,
    enemies: [],
    bullets: [],
    items: [],
    obstacles: [],
    particles: [],
    weaponList: [],
    killCount: 0,
    aliveCount: 0,
    totalEnemies: 0,

    keys: {},
    mouseX: 0,
    mouseY: 0,
    cameraX: 0,
    cameraY: 0,
    canvasW: 0,
    canvasH: 0,

    SHOOT_COOLDOWN: 150,
    lastShootTime: 0,

    _onKeyDown: null,
    _onKeyUp: null,
    _onResize: null,

    reset() {
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.obstacles = [];
        this.particles = [];
        this.killCount = 0;
        this.aliveCount = 0;
        this.totalEnemies = 0;
        this.elapsedTime = 0;
        this.safeZoneRadius = this.SAFE_ZONE_INITIAL;
        this.safeZoneCenterX = this.WORLD_W / 2;
        this.safeZoneCenterY = this.WORLD_H / 2;
        this.safeZoneTargetRadius = this.SAFE_ZONE_INITIAL;
        this.safeZoneTargetCX = this.WORLD_W / 2;
        this.safeZoneTargetCY = this.WORLD_H / 2;
        this.safeZonePhase = 0;
        this.safeZonePhaseTimer = 0;
        this.outsideDamage = 2;
        this.keys = {};
        this.lastShootTime = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.mapType = 'forest';
        this.mapConfig = null;
    },

    async render() {
        this.reset();

        const app = document.getElementById('app');
        const params = Router.getParams() || {};
        this.mapId = params.map_id || 1;
        Storage.set('game_map_id', this.mapId);

        app.innerHTML = `
            <div class="hp-game-page">
                <canvas id="hpGameCanvas"></canvas>
                <div class="hp-game-hud" id="hpGameHud" style="display:none;">
                    <div class="hp-hud-top">
                        <div class="hp-hud-health">
                            <div class="hp-hud-health-bar">
                                <div class="hp-hud-health-fill" id="hpHealthFill"></div>
                            </div>
                            <span class="hp-hud-health-text" id="hpHealthText">100</span>
                        </div>
                        <div class="hp-hud-info">
                            <span id="hpHudAlive">存活: 0</span>
                            <span id="hpHudKills">击杀: 0</span>
                        </div>
                        <button class="hp-hud-pause" id="hpPauseBtn">⏸</button>
                    </div>
                    <div class="hp-hud-bottom">
                        <div class="hp-hud-weapon" id="hpHudWeapon">拳头</div>
                        <div class="hp-hud-ammo" id="hpHudAmmo">∞</div>
                    </div>
                    <div class="hp-hud-minimap">
                        <canvas id="hpMinimap" width="120" height="120"></canvas>
                    </div>
                </div>
                <div class="hp-game-loading" id="hpGameLoading">
                    <div class="hp-loading-spinner"></div>
                    <div class="hp-loading-text">战场加载中...</div>
                </div>
                <div class="hp-game-pause-overlay" id="hpPauseOverlay" style="display:none;">
                    <div class="hp-pause-content">
                        <h2>游戏暂停</h2>
                        <button class="hp-btn hp-btn-primary" id="hpResumeBtn">继续游戏</button>
                        <button class="hp-btn hp-btn-secondary" id="hpQuitBtn">退出游戏</button>
                    </div>
                </div>
                <div class="hp-game-result-overlay" id="hpResultOverlay" style="display:none;">
                    <div class="hp-result-content" id="hpResultContent"></div>
                </div>
            </div>
        `;

        this.bindBeforeUnload();
        this.bindEvents();
        await this.initGame();
    },

    bindBeforeUnload() {
        this._onBeforeUnload = () => {
            if (this.gameState === 'playing') {
                const state = {
                    mapId: this.mapId,
                    mapType: this.mapType,
                    mapConfig: this.mapConfig,
                    player: this.player,
                    enemies: this.enemies.filter(e => e.alive),
                    items: this.items.filter(i => !i.picked),
                    obstacles: this.obstacles,
                    killCount: this.killCount,
                    elapsedTime: this.elapsedTime,
                    safeZoneRadius: this.safeZoneRadius,
                    safeZoneCenterX: this.safeZoneCenterX,
                    safeZoneCenterY: this.safeZoneCenterY,
                    safeZoneTargetRadius: this.safeZoneTargetRadius,
                    safeZoneTargetCX: this.safeZoneTargetCX,
                    safeZoneTargetCY: this.safeZoneTargetCY,
                    safeZonePhase: this.safeZonePhase,
                    safeZonePhaseTimer: this.safeZonePhaseTimer,
                    outsideDamage: this.outsideDamage
                };
                Storage.setGameState(state);
            }
        };
        window.addEventListener('beforeunload', this._onBeforeUnload);
    },

    bindEvents() {
        document.getElementById('hpPauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('hpResumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('hpQuitBtn').addEventListener('click', () => this.quitGame());

        this._onKeyDown = (e) => {
            this.keys[e.key] = true;
            if (e.key === 'Escape' && this.gameState === 'playing') {
                this.togglePause();
            }
        };
        this._onKeyUp = (e) => { this.keys[e.key] = false; };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        this._onMouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        };
        this._onMouseDown = (e) => {
            if (this.gameState === 'playing') {
                this.shoot();
            }
        };
        this._onContextMenu = (e) => e.preventDefault();
    },

    async initGame() {
        const initCanvas = () => {
            this.canvas = document.getElementById('hpGameCanvas');
            if (!this.canvas) return false;
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) return false;
            this.resizeCanvas();
            return true;
        };

        if (!initCanvas()) {
            await new Promise(resolve => {
                setTimeout(() => {
                    initCanvas();
                    resolve();
                }, 100);
            });
        }

        this._onResize = () => this.resizeCanvas();
        window.addEventListener('resize', this._onResize);
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', this._onMouseMove);
            this.canvas.addEventListener('mousedown', this._onMouseDown);
            this.canvas.addEventListener('contextmenu', this._onContextMenu);
        }

        try {
            await this.loadWeaponList();
        } catch (e) {
            console.error(e);
        }
        try {
            await this.loadSavedState();
        } catch (e) {
            console.error(e);
        }

        this.generateWorld();
        this.gameState = 'playing';
        this.startTime = Date.now() - this.elapsedTime * 1000;
        this.lastTime = performance.now();

        document.getElementById('hpGameLoading').style.display = 'none';
        document.getElementById('hpGameHud').style.display = 'block';

        this.startGameLoop();
        this.startAutoSave();
    },

    resizeCanvas() {
        this.canvasW = window.innerWidth;
        this.canvasH = window.innerHeight;
        this.canvas.width = this.canvasW;
        this.canvas.height = this.canvasH;
    },

    async loadWeaponList() {
        try {
            const result = await ApiService.get('/heping/weapon/list/get', { page: 1, page_size: 50 });
            if (result.code === 0 && result.data.items) {
                this.weaponList = result.data.items;
            }
        } catch (e) {
            console.error(e);
        }
        if (!this.weaponList.length) {
            this.weaponList = [
                { id: 1, name: 'P92', type: 'pistol', damage: 15, fire_rate: 3.5, range: 250, ammo_capacity: 15, rarity: 'common' },
                { id: 2, name: 'M416', type: 'rifle', damage: 20, fire_rate: 12, range: 450, ammo_capacity: 30, rarity: 'rare' },
                { id: 3, name: 'AKM', type: 'rifle', damage: 25, fire_rate: 10, range: 400, ammo_capacity: 30, rarity: 'uncommon' },
                { id: 4, name: 'AWM', type: 'sniper', damage: 80, fire_rate: 1.8, range: 700, ammo_capacity: 5, rarity: 'legendary' },
                { id: 5, name: 'S686', type: 'shotgun', damage: 50, fire_rate: 2, range: 120, ammo_capacity: 2, rarity: 'common' },
                { id: 6, name: 'UZI', type: 'smg', damage: 12, fire_rate: 15, range: 200, ammo_capacity: 25, rarity: 'common' }
            ];
        }
    },

    async loadSavedState() {
        try {
            const result = await ApiService.get('/heping/game/state/load/get');
            if (result.code === 0 && result.data && result.data.state_data) {
                const state = JSON.parse(result.data.state_data);
                if (state && state.mapId === this.mapId && state.player && state.player.hp > 0) {
                    const aliveEnemies = (state.enemies || []).filter(e => e.alive);
                    if (aliveEnemies.length > 0) {
                        this.restoreState(state);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        try {
            const localState = Storage.getGameState();
            if (localState) {
                const state = typeof localState === 'string' ? JSON.parse(localState) : localState;
                if (state && state.mapId === this.mapId && state.player && state.player.hp > 0) {
                    const aliveEnemies = (state.enemies || []).filter(e => e.alive);
                    if (aliveEnemies.length > 0) {
                        this.restoreState(state);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        this.elapsedTime = 0;
    },

    restoreState(state) {
        this.player = state.player;
        this.enemies = state.enemies || [];
        this.items = state.items || [];
        this.obstacles = state.obstacles || [];
        this.killCount = state.killCount || 0;
        this.elapsedTime = state.elapsedTime || 0;
        this.safeZoneRadius = state.safeZoneRadius || this.SAFE_ZONE_INITIAL;
        this.safeZoneCenterX = state.safeZoneCenterX || this.WORLD_W / 2;
        this.safeZoneCenterY = state.safeZoneCenterY || this.WORLD_H / 2;
        this.safeZoneTargetRadius = state.safeZoneTargetRadius || this.SAFE_ZONE_INITIAL;
        this.safeZoneTargetCX = state.safeZoneTargetCX || this.WORLD_W / 2;
        this.safeZoneTargetCY = state.safeZoneTargetCY || this.WORLD_H / 2;
        this.safeZonePhase = state.safeZonePhase || 0;
        this.safeZonePhaseTimer = state.safeZonePhaseTimer || 0;
        this.outsideDamage = state.outsideDamage || 2;
        this.mapType = state.mapType || 'forest';
        this.mapConfig = state.mapConfig || null;
        if (!this.mapConfig) {
            this.rebuildMapConfig();
        }
        const aliveEnemies = this.enemies.filter(e => e.alive);
        this.aliveCount = aliveEnemies.length + 1;
        this.totalEnemies = this.enemies.length;
    },

    rebuildMapConfig() {
        const mapConfigs = {
            1: { name: 'forest', buildings: 35, trees: 60, weapons: 30, medkits: 20, ammos: 25, buildingColors: ['#4a4a4a', '#3d5a3d', '#4a554a'], groundColor: '#1a2e1a', gridColor: '#223322', treeColor: '#2d5a2d', treeHighlight: '#3a7a3a', borderColor: '#4CAF50', waterZones: [] },
            2: { name: 'desert', buildings: 25, trees: 15, weapons: 28, medkits: 15, ammos: 22, buildingColors: ['#c2a070', '#b09060', '#d4b080'], groundColor: '#3d2e1a', gridColor: '#4a3a22', treeColor: '#8b7355', treeHighlight: '#9a8266', borderColor: '#c2a070', waterZones: [] },
            3: { name: 'city', buildings: 60, trees: 10, weapons: 35, medkits: 18, ammos: 30, buildingColors: ['#5a5a6a', '#6a6a7a', '#4a4a5a'], groundColor: '#1a1a2e', gridColor: '#22223a', treeColor: '#2d5a2d', treeHighlight: '#3a7a3a', borderColor: '#6a6a8a', waterZones: [] },
            4: { name: 'island', buildings: 20, trees: 45, weapons: 25, medkits: 22, ammos: 20, buildingColors: ['#e8dcc8', '#d0c4b0', '#c4b8a0'], groundColor: '#1a2e2e', gridColor: '#223a3a', treeColor: '#2d6a4e', treeHighlight: '#3a8a5e', borderColor: '#4a8a9a', waterZones: [
                { x: 0, y: 0, w: 300, h: 3000 },
                { x: 2700, y: 0, w: 300, h: 3000 },
                { x: 0, y: 0, w: 3000, h: 300 },
                { x: 0, y: 2700, w: 3000, h: 300 }
            ] }
        };
        this.mapConfig = mapConfigs[this.mapId] || mapConfigs[1];
        this.mapType = this.mapConfig.name;
    },

    generateWorld() {
        if (this.player) return;

        this.player = {
            x: this.WORLD_W / 2 + Utils.randomInt(-200, 200),
            y: this.WORLD_H / 2 + Utils.randomInt(-200, 200),
            hp: 100,
            maxHp: 100,
            speed: 3,
            radius: 14,
            weapon: null,
            ammo: 0,
            angle: 0,
            damageDealt: 0,
            damageTaken: 0,
            weaponsUsed: [],
            itemsCollected: []
        };

        const mapConfigs = {
            1: { name: 'forest', buildings: 35, trees: 60, weapons: 30, medkits: 20, ammos: 25, buildingColors: ['#4a4a4a', '#3d5a3d', '#4a554a'], groundColor: '#1a2e1a', gridColor: '#223322', treeColor: '#2d5a2d', treeHighlight: '#3a7a3a', borderColor: '#4CAF50', waterZones: [] },
            2: { name: 'desert', buildings: 25, trees: 15, weapons: 28, medkits: 15, ammos: 22, buildingColors: ['#c2a070', '#b09060', '#d4b080'], groundColor: '#3d2e1a', gridColor: '#4a3a22', treeColor: '#8b7355', treeHighlight: '#9a8266', borderColor: '#c2a070', waterZones: [] },
            3: { name: 'city', buildings: 60, trees: 10, weapons: 35, medkits: 18, ammos: 30, buildingColors: ['#5a5a6a', '#6a6a7a', '#4a4a5a'], groundColor: '#1a1a2e', gridColor: '#22223a', treeColor: '#2d5a2d', treeHighlight: '#3a7a3a', borderColor: '#6a6a8a', waterZones: [] },
            4: { name: 'island', buildings: 20, trees: 45, weapons: 25, medkits: 22, ammos: 20, buildingColors: ['#e8dcc8', '#d0c4b0', '#c4b8a0'], groundColor: '#1a2e2e', gridColor: '#223a3a', treeColor: '#2d6a4e', treeHighlight: '#3a8a5e', borderColor: '#4a8a9a', waterZones: [
                { x: 0, y: 0, w: 300, h: 3000 },
                { x: 2700, y: 0, w: 300, h: 3000 },
                { x: 0, y: 0, w: 3000, h: 300 },
                { x: 0, y: 2700, w: 3000, h: 300 }
            ] }
        };

        const cfg = mapConfigs[this.mapId] || mapConfigs[1];
        this.mapType = cfg.name;
        this.mapConfig = cfg;

        const enemyCount = Utils.randomInt(12, 20);
        this.totalEnemies = enemyCount;
        this.aliveCount = enemyCount + 1;
        this.enemies = [];
        this.killCount = 0;

        for (let i = 0; i < enemyCount; i++) {
            this.enemies.push(this.createEnemy(i));
        }

        this.obstacles = [];
        for (let i = 0; i < cfg.buildings; i++) {
            const colors = cfg.buildingColors;
            this.obstacles.push({
                type: 'building',
                x: Utils.randomInt(100, this.WORLD_W - 200),
                y: Utils.randomInt(100, this.WORLD_H - 200),
                w: Utils.randomInt(50, 150),
                h: Utils.randomInt(50, 150),
                color: colors[Utils.randomInt(0, colors.length - 1)]
            });
        }
        for (let i = 0; i < cfg.trees; i++) {
            this.obstacles.push({
                type: 'tree',
                x: Utils.randomInt(50, this.WORLD_W - 50),
                y: Utils.randomInt(50, this.WORLD_H - 50),
                radius: Utils.randomInt(15, 30),
                color: cfg.treeColor,
                highlight: cfg.treeHighlight
            });
        }

        this.items = [];
        for (let i = 0; i < cfg.weapons; i++) {
            this.items.push(this.createWeaponCrate());
        }
        for (let i = 0; i < cfg.medkits; i++) {
            this.items.push(this.createEquipmentCrate());
        }
        for (let i = 0; i < cfg.ammos; i++) {
            this.items.push(this.createAmmoCrate());
        }
    },

    createEnemy(index) {
        const cx = this.WORLD_W / 2;
        const cy = this.WORLD_H / 2;
        const maxR = this.SAFE_ZONE_INITIAL - 100;
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * (maxR - 300);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        return {
            id: index,
            x: x,
            y: y,
            hp: 60 + Utils.randomInt(0, 40),
            maxHp: 100,
            speed: 1.2 + Math.random() * 1.2,
            radius: 13,
            angle: Math.random() * Math.PI * 2,
            moveAngle: Math.random() * Math.PI * 2,
            moveTimer: 0,
            weapon: this.weaponList.length ? this.weaponList[Utils.randomInt(0, Math.min(3, this.weaponList.length - 1))] : null,
            lastShootTime: 0,
            state: 'wander',
            detectRange: 250 + Utils.randomInt(0, 100),
            alive: true
        };
    },

    createWeaponCrate() {
        const weapon = this.weaponList.length ? this.weaponList[Utils.randomInt(0, this.weaponList.length - 1)] : null;
        return {
            type: 'weapon',
            x: Utils.randomInt(100, this.WORLD_W - 100),
            y: Utils.randomInt(100, this.WORLD_H - 100),
            weapon: weapon,
            picked: false
        };
    },

    createEquipmentCrate() {
        return {
            type: 'equipment',
            x: Utils.randomInt(100, this.WORLD_W - 100),
            y: Utils.randomInt(100, this.WORLD_H - 100),
            healAmount: Utils.randomInt(20, 50),
            picked: false
        };
    },

    createAmmoCrate() {
        return {
            type: 'ammo',
            x: Utils.randomInt(100, this.WORLD_W - 100),
            y: Utils.randomInt(100, this.WORLD_H - 100),
            ammoAmount: Utils.randomInt(15, 40),
            picked: false
        };
    },

    randomBuildingColor() {
        const colors = ['#4a4a4a', '#555555', '#606060', '#3d3d3d', '#484848'];
        return colors[Utils.randomInt(0, colors.length - 1)];
    },

    startGameLoop() {
        const loop = (timestamp) => {
            if (this.gameState === 'ended') return;

            const dt = Math.min(timestamp - this.lastTime, 50);
            this.lastTime = timestamp;

            if (this.gameState === 'playing') {
                this.update(dt);
                this.draw();
                this.updateHUD();
            }

            this.animFrame = requestAnimationFrame(loop);
        };
        this.animFrame = requestAnimationFrame(loop);
    },

    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            if (this.gameState === 'playing') {
                this.saveState();
            }
        }, 10000);
    },

    update(dt) {
        const factor = dt / 16;
        this.elapsedTime = (Date.now() - this.startTime) / 1000;

        this.updatePlayer(factor);
        this.updateEnemies(factor);
        this.updateBullets(factor);
        this.updateSafeZone(factor);
        this.checkItemPickup();
        this.updateParticles(factor);

        const aliveEnemies = this.enemies.filter(e => e.alive);
        this.aliveCount = aliveEnemies.length + 1;

        this.enemyFights(aliveEnemies, factor);

        if (this.player.hp <= 0) {
            this.endGame(false);
        } else if (aliveEnemies.length === 0) {
            this.endGame(true);
        }
    },

    updatePlayer(factor) {
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy = -1;
        if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy = 1;
        if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) dx = -1;
        if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        let nx = this.player.x + dx * this.player.speed * factor;
        let ny = this.player.y + dy * this.player.speed * factor;

        if (!this.collidesWithObstacles(nx, ny, this.player.radius)) {
            this.player.x = nx;
            this.player.y = ny;
        } else {
            if (!this.collidesWithObstacles(nx, this.player.y, this.player.radius)) {
                this.player.x = nx;
            }
            if (!this.collidesWithObstacles(this.player.x, ny, this.player.radius)) {
                this.player.y = ny;
            }
        }

        this.player.x = Math.max(this.player.radius, Math.min(this.WORLD_W - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.WORLD_H - this.player.radius, this.player.y));

        const worldMouseX = this.mouseX + this.cameraX;
        const worldMouseY = this.mouseY + this.cameraY;
        this.player.angle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);

        this.cameraX = this.player.x - this.canvasW / 2;
        this.cameraY = this.player.y - this.canvasH / 2;
    },

    updateEnemies(factor) {
        for (const e of this.enemies) {
            if (!e.alive) continue;

            e.moveTimer -= factor;
            if (e.moveTimer <= 0) {
                e.moveTimer = 60 + Utils.randomInt(0, 120);
                e.moveAngle = Math.random() * Math.PI * 2;
            }

            const distToPlayer = this.dist(e.x, e.y, this.player.x, this.player.y);

            if (distToPlayer < e.detectRange) {
                e.state = 'chase';
                const angleToPlayer = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                e.angle = angleToPlayer;

                let enx = e.x + Math.cos(angleToPlayer) * e.speed * factor;
                let eny = e.y + Math.sin(angleToPlayer) * e.speed * factor;

                if (!this.collidesWithObstacles(enx, eny, e.radius)) {
                    e.x = enx;
                    e.y = eny;
                }

                const weaponRange = e.weapon ? e.weapon.range : 150;
                if (distToPlayer < weaponRange && Date.now() - e.lastShootTime > 800) {
                    this.enemyShoot(e);
                    e.lastShootTime = Date.now();
                }
            } else {
                e.state = 'wander';
                let enx = e.x + Math.cos(e.moveAngle) * e.speed * 0.5 * factor;
                let eny = e.y + Math.sin(e.moveAngle) * e.speed * 0.5 * factor;

                if (!this.collidesWithObstacles(enx, eny, e.radius)) {
                    e.x = enx;
                    e.y = eny;
                }

                e.x = Math.max(e.radius, Math.min(this.WORLD_W - e.radius, e.x));
                e.y = Math.max(e.radius, Math.min(this.WORLD_H - e.radius, e.y));
            }

            const distFromCenter = this.dist(e.x, e.y, this.safeZoneCenterX, this.safeZoneCenterY);
            if (distFromCenter > this.safeZoneRadius) {
                e.hp -= this.outsideDamage * 0.3 * factor;
                if (e.hp <= 0) {
                    e.alive = false;
                    this.spawnParticles(e.x, e.y, '#ff4444', 6);
                }
            }
        }
    },

    enemyFights(aliveEnemies, factor) {
        for (let i = 0; i < aliveEnemies.length; i++) {
            for (let j = i + 1; j < aliveEnemies.length; j++) {
                const a = aliveEnemies[i];
                const b = aliveEnemies[j];
                const d = this.dist(a.x, a.y, b.x, b.y);
                if (d < 120 && Math.random() < 0.005 * factor) {
                    const dmg = Utils.randomInt(3, 8);
                    b.hp -= dmg;
                    if (b.hp <= 0) {
                        b.alive = false;
                        this.spawnParticles(b.x, b.y, '#ff4444', 6);
                    }
                }
            }
        }
    },

    shoot() {
        const now = Date.now();
        const cooldown = this.player.weapon ? Math.max(100, 600 / this.player.weapon.fire_rate) : 400;
        if (now - this.lastShootTime < cooldown) return;
        this.lastShootTime = now;

        const angle = this.player.angle;
        let damage = 10;
        let speed = 10;
        let range = 300;
        let spread = 0.08;

        if (this.player.weapon) {
            if (this.player.ammo <= 0) {
                Utils.showToast('弹药不足');
                return;
            }
            damage = this.player.weapon.damage;
            speed = 10;
            range = this.player.weapon.range;
            spread = 0.04;
            this.player.ammo--;

            if (this.player.weapon.type === 'shotgun') {
                for (let i = 0; i < 5; i++) {
                    const a = angle + (Math.random() - 0.5) * 0.3;
                    this.bullets.push({
                        x: this.player.x + Math.cos(angle) * 20,
                        y: this.player.y + Math.sin(angle) * 20,
                        vx: Math.cos(a) * speed,
                        vy: Math.sin(a) * speed,
                        damage: damage / 5,
                        range: range,
                        traveled: 0,
                        owner: 'player'
                    });
                }
                return;
            }
        }

        const a = angle + (Math.random() - 0.5) * spread;
        this.bullets.push({
            x: this.player.x + Math.cos(angle) * 20,
            y: this.player.y + Math.sin(angle) * 20,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            damage: damage,
            range: range,
            traveled: 0,
            owner: 'player'
        });
    },

    enemyShoot(enemy) {
        const angleToPlayer = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        const spread = 0.15;
        const a = angleToPlayer + (Math.random() - 0.5) * spread;
        const damage = enemy.weapon ? enemy.weapon.damage * 0.3 : 5;
        const speed = 7;

        this.bullets.push({
            x: enemy.x + Math.cos(angleToPlayer) * 16,
            y: enemy.y + Math.sin(angleToPlayer) * 16,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            damage: damage,
            range: enemy.weapon ? enemy.weapon.range : 200,
            traveled: 0,
            owner: 'enemy',
            enemyId: enemy.id
        });
    },

    updateBullets(factor) {
        const toRemove = [];
        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            b.x += b.vx * factor;
            b.y += b.vy * factor;
            b.traveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy) * factor;

            if (b.traveled > b.range) {
                toRemove.push(i);
                continue;
            }

            if (b.x < 0 || b.x > this.WORLD_W || b.y < 0 || b.y > this.WORLD_H) {
                toRemove.push(i);
                continue;
            }

            if (this.collidesWithObstacles(b.x, b.y, 3)) {
                toRemove.push(i);
                this.spawnParticles(b.x, b.y, '#888', 3);
                continue;
            }

            if (b.owner === 'player') {
                for (const e of this.enemies) {
                    if (!e.alive) continue;
                    if (this.dist(b.x, b.y, e.x, e.y) < e.radius + 4) {
                        e.hp -= b.damage;
                        this.player.damageDealt += b.damage;
                        this.spawnParticles(b.x, b.y, '#ff6666', 4);
                        if (e.hp <= 0) {
                            e.alive = false;
                            this.killCount++;
                            this.spawnParticles(e.x, e.y, '#ff4444', 10);
                            if (Math.random() < 0.5) {
                                this.items.push(this.createWeaponCrateAt(e.x, e.y));
                            }
                            if (Math.random() < 0.4) {
                                this.items.push(this.createAmmoCrateAt(e.x, e.y));
                            }
                        }
                        toRemove.push(i);
                        break;
                    }
                }
            } else if (b.owner === 'enemy') {
                if (this.dist(b.x, b.y, this.player.x, this.player.y) < this.player.radius + 4) {
                    this.player.hp -= b.damage;
                    this.player.damageTaken += b.damage;
                    this.spawnParticles(b.x, b.y, '#ff4444', 4);
                    toRemove.push(i);
                }
            }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(toRemove[i], 1);
        }
    },

    createWeaponCrateAt(x, y) {
        const weapon = this.weaponList.length ? this.weaponList[Utils.randomInt(0, this.weaponList.length - 1)] : null;
        return { type: 'weapon', x: x + Utils.randomInt(-20, 20), y: y + Utils.randomInt(-20, 20), weapon: weapon, picked: false };
    },

    createAmmoCrateAt(x, y) {
        return { type: 'ammo', x: x + Utils.randomInt(-20, 20), y: y + Utils.randomInt(-20, 20), ammoAmount: Utils.randomInt(10, 30), picked: false };
    },

    updateSafeZone(factor) {
        this.safeZonePhaseTimer += factor;

        if (this.safeZonePhase === 0 && this.safeZonePhaseTimer > 600) {
            this.safeZonePhase = 1;
            this.safeZonePhaseTimer = 0;
            this.safeZoneTargetRadius = this.SAFE_ZONE_INITIAL * 0.65;
            this.safeZoneTargetCX = this.WORLD_W / 2 + Utils.randomInt(-200, 200);
            this.safeZoneTargetCY = this.WORLD_H / 2 + Utils.randomInt(-200, 200);
            this.outsideDamage = 3;
        } else if (this.safeZonePhase === 1 && this.safeZonePhaseTimer > 500) {
            this.safeZonePhase = 2;
            this.safeZonePhaseTimer = 0;
            this.safeZoneTargetRadius = this.SAFE_ZONE_INITIAL * 0.35;
            this.safeZoneTargetCX = this.WORLD_W / 2 + Utils.randomInt(-100, 100);
            this.safeZoneTargetCY = this.WORLD_H / 2 + Utils.randomInt(-100, 100);
            this.outsideDamage = 5;
        } else if (this.safeZonePhase === 2 && this.safeZonePhaseTimer > 400) {
            this.safeZonePhase = 3;
            this.safeZonePhaseTimer = 0;
            this.safeZoneTargetRadius = this.SAFE_ZONE_INITIAL * 0.1;
            this.safeZoneTargetCX = this.WORLD_W / 2;
            this.safeZoneTargetCY = this.WORLD_H / 2;
            this.outsideDamage = 10;
        }

        if (this.safeZonePhase > 0) {
            this.safeZoneRadius += (this.safeZoneTargetRadius - this.safeZoneRadius) * 0.003 * factor;
            this.safeZoneCenterX += (this.safeZoneTargetCX - this.safeZoneCenterX) * 0.002 * factor;
            this.safeZoneCenterY += (this.safeZoneTargetCY - this.safeZoneCenterY) * 0.002 * factor;
        }

        const distFromCenter = this.dist(this.player.x, this.player.y, this.safeZoneCenterX, this.safeZoneCenterY);
        if (distFromCenter > this.safeZoneRadius) {
            this.player.hp -= this.outsideDamage * 0.05 * factor;
            this.player.damageTaken += this.outsideDamage * 0.05 * factor;
        }
    },

    checkItemPickup() {
        for (const item of this.items) {
            if (item.picked) continue;
            const d = this.dist(this.player.x, this.player.y, item.x, item.y);
            if (d < this.player.radius + 18) {
                if (item.type === 'weapon' && item.weapon) {
                    this.player.weapon = item.weapon;
                    this.player.ammo = item.weapon.ammo_capacity;
                    if (!this.player.weaponsUsed.includes(item.weapon.name)) {
                        this.player.weaponsUsed.push(item.weapon.name);
                    }
                    this.player.itemsCollected.push(item.weapon.name);
                    Utils.showToast('拾取: ' + item.weapon.name);
                    item.picked = true;
                } else if (item.type === 'equipment') {
                    const heal = Math.min(item.healAmount, this.player.maxHp - this.player.hp);
                    this.player.hp += heal;
                    this.player.itemsCollected.push('医疗包');
                    Utils.showToast('恢复生命 +' + heal);
                    item.picked = true;
                } else if (item.type === 'ammo') {
                    this.player.ammo += item.ammoAmount;
                    this.player.itemsCollected.push('弹药');
                    Utils.showToast('拾取弹药 +' + item.ammoAmount);
                    item.picked = true;
                }
            }
        }
    },

    updateParticles(factor) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * factor;
            p.y += p.vy * factor;
            p.life -= factor;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    },

    collidesWithObstacles(x, y, r) {
        for (const o of this.obstacles) {
            if (o.type === 'building') {
                const closestX = Math.max(o.x, Math.min(x, o.x + o.w));
                const closestY = Math.max(o.y, Math.min(y, o.y + o.h));
                if (this.dist(x, y, closestX, closestY) < r) return true;
            } else if (o.type === 'tree') {
                if (this.dist(x, y, o.x, o.y) < r + o.radius * 0.5) return true;
            }
        }
        return false;
    },

    dist(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    },

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvasW, this.canvasH);

        ctx.save();
        ctx.translate(-this.cameraX, -this.cameraY);

        this.drawGround(ctx);
        this.drawSafeZone(ctx);
        this.drawObstacles(ctx);
        this.drawItems(ctx);
        this.drawBullets(ctx);
        this.drawEnemies(ctx);
        this.drawPlayer(ctx);
        this.drawParticles(ctx);

        ctx.restore();

        this.drawMinimap();
    },

    drawGround(ctx) {
        const cfg = this.mapConfig || { groundColor: '#1a2e1a', gridColor: '#223322', borderColor: '#4CAF50', waterZones: [] };

        ctx.fillStyle = cfg.groundColor;
        ctx.fillRect(0, 0, this.WORLD_W, this.WORLD_H);

        if (cfg.waterZones && cfg.waterZones.length > 0) {
            ctx.fillStyle = 'rgba(30, 100, 180, 0.5)';
            for (const wz of cfg.waterZones) {
                ctx.fillRect(wz.x, wz.y, wz.w, wz.h);
            }
            ctx.fillStyle = 'rgba(50, 150, 220, 0.3)';
            for (const wz of cfg.waterZones) {
                ctx.fillRect(wz.x + 20, wz.y + 20, wz.w - 40, wz.h - 40);
            }
        }

        if (cfg.name === 'desert') {
            ctx.fillStyle = 'rgba(210, 180, 120, 0.15)';
            for (let i = 0; i < 30; i++) {
                const dx = Utils.randomInt(100, this.WORLD_W - 100);
                const dy = Utils.randomInt(100, this.WORLD_H - 100);
                ctx.beginPath();
                ctx.arc(dx, dy, Utils.randomInt(30, 80), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (cfg.name === 'city') {
            ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.moveTo(this.WORLD_W / 2, 0);
            ctx.lineTo(this.WORLD_W / 2, this.WORLD_H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, this.WORLD_H / 2);
            ctx.lineTo(this.WORLD_W, this.WORLD_H / 2);
            ctx.stroke();
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(this.WORLD_W / 4, 0);
            ctx.lineTo(this.WORLD_W / 4, this.WORLD_H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.WORLD_W * 3 / 4, 0);
            ctx.lineTo(this.WORLD_W * 3 / 4, this.WORLD_H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, this.WORLD_H / 4);
            ctx.lineTo(this.WORLD_W, this.WORLD_H / 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, this.WORLD_H * 3 / 4);
            ctx.lineTo(this.WORLD_W, this.WORLD_H * 3 / 4);
            ctx.stroke();
        }

        ctx.strokeStyle = cfg.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 100;
        for (let x = 0; x <= this.WORLD_W; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.WORLD_H);
            ctx.stroke();
        }
        for (let y = 0; y <= this.WORLD_H; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.WORLD_W, y);
            ctx.stroke();
        }

        ctx.strokeStyle = cfg.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.WORLD_W, this.WORLD_H);
    },

    drawSafeZone(ctx) {
        ctx.beginPath();
        ctx.arc(this.safeZoneCenterX, this.safeZoneCenterY, this.safeZoneRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(68, 136, 255, 0.03)';
        ctx.beginPath();
        ctx.arc(this.safeZoneCenterX, this.safeZoneCenterY, this.safeZoneRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 50, 50, 0.08)';
        ctx.beginPath();
        ctx.rect(0, 0, this.WORLD_W, this.WORLD_H);
        ctx.arc(this.safeZoneCenterX, this.safeZoneCenterY, this.safeZoneRadius, 0, Math.PI * 2, true);
        ctx.fill();
    },

    drawObstacles(ctx) {
        for (const o of this.obstacles) {
            if (o.type === 'building') {
                ctx.fillStyle = o.color;
                ctx.fillRect(o.x, o.y, o.w, o.h);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.strokeRect(o.x, o.y, o.w, o.h);
            } else if (o.type === 'tree') {
                ctx.fillStyle = o.color;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = o.highlight || '#3a7a3a';
                ctx.beginPath();
                ctx.arc(o.x - 2, o.y - 2, o.radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    drawItems(ctx) {
        for (const item of this.items) {
            if (item.picked) continue;
            const sx = item.x;
            const sy = item.y;

            if (item.type === 'weapon') {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(sx - 10, sy - 10, 20, 20);
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx - 10, sy - 10, 20, 20);
                ctx.fillStyle = '#333';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('W', sx, sy + 4);
            } else if (item.type === 'equipment') {
                ctx.fillStyle = '#4488ff';
                ctx.fillRect(sx - 10, sy - 10, 20, 20);
                ctx.strokeStyle = '#2255bb';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx - 10, sy - 10, 20, 20);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+', sx, sy + 4);
            } else if (item.type === 'ammo') {
                ctx.fillStyle = '#ff8844';
                ctx.fillRect(sx - 8, sy - 8, 16, 16);
                ctx.strokeStyle = '#aa5522';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx - 8, sy - 8, 16, 16);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('A', sx, sy + 3);
            }
        }
    },

    drawBullets(ctx) {
        for (const b of this.bullets) {
            ctx.fillStyle = b.owner === 'player' ? '#ffff00' : '#ff6666';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = b.owner === 'player' ? 'rgba(255,255,0,0.3)' : 'rgba(255,100,100,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
            ctx.stroke();
        }
    },

    drawEnemies(ctx) {
        for (const e of this.enemies) {
            if (!e.alive) continue;

            ctx.fillStyle = '#cc3333';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#991111';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(e.angle) * (e.radius + 8), e.y + Math.sin(e.angle) * (e.radius + 8));
            ctx.stroke();

            const hpRatio = e.hp / e.maxHp;
            const barW = 26;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW * hpRatio, 4);
        }
    },

    drawPlayer(ctx) {
        const p = this.player;

        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#81C784';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * (p.radius + 10), p.y + Math.sin(p.angle) * (p.radius + 10));
        ctx.stroke();

        ctx.fillStyle = '#333';
        const barW = 30;
        ctx.fillRect(p.x - barW / 2, p.y - p.radius - 10, barW, 4);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(p.x - barW / 2, p.y - p.radius - 10, barW * (p.hp / p.maxHp), 4);
    },

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / 30);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawMinimap() {
        const mc = document.getElementById('hpMinimap');
        if (!mc) return;
        const mctx = mc.getContext('2d');
        const mw = mc.width;
        const mh = mc.height;
        const sx = mw / this.WORLD_W;
        const sy = mh / this.WORLD_H;

        mctx.fillStyle = '#0a1a0a';
        mctx.fillRect(0, 0, mw, mh);

        mctx.strokeStyle = '#4488ff';
        mctx.lineWidth = 1;
        mctx.beginPath();
        mctx.arc(this.safeZoneCenterX * sx, this.safeZoneCenterY * sy, this.safeZoneRadius * sx, 0, Math.PI * 2);
        mctx.stroke();

        mctx.fillStyle = '#555';
        for (const o of this.obstacles) {
            if (o.type === 'building') {
                mctx.fillRect(o.x * sx, o.y * sy, Math.max(2, o.w * sx), Math.max(2, o.h * sy));
            }
        }

        mctx.fillStyle = '#cc3333';
        for (const e of this.enemies) {
            if (!e.alive) continue;
            mctx.beginPath();
            mctx.arc(e.x * sx, e.y * sy, 2, 0, Math.PI * 2);
            mctx.fill();
        }

        mctx.fillStyle = '#4CAF50';
        mctx.beginPath();
        mctx.arc(this.player.x * sx, this.player.y * sy, 3, 0, Math.PI * 2);
        mctx.fill();
    },

    updateHUD() {
        const hpFill = document.getElementById('hpHealthFill');
        const hpText = document.getElementById('hpHealthText');
        const aliveText = document.getElementById('hpHudAlive');
        const killsText = document.getElementById('hpHudKills');
        const weaponText = document.getElementById('hpHudWeapon');
        const ammoText = document.getElementById('hpHudAmmo');

        if (hpFill) {
            const ratio = Math.max(0, this.player.hp / this.player.maxHp * 100);
            hpFill.style.width = ratio + '%';
            hpFill.style.backgroundColor = ratio > 50 ? '#4CAF50' : ratio > 25 ? '#ff9800' : '#f44336';
        }
        if (hpText) hpText.textContent = Math.max(0, Math.round(this.player.hp));
        if (aliveText) aliveText.textContent = '存活: ' + this.aliveCount;
        if (killsText) killsText.textContent = '击杀: ' + this.killCount;
        if (weaponText) weaponText.textContent = this.player.weapon ? this.player.weapon.name : '拳头';
        if (ammoText) ammoText.textContent = this.player.weapon ? this.player.ammo : '∞';
    },

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('hpPauseOverlay').style.display = 'flex';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startTime = Date.now() - this.elapsedTime * 1000;
            this.lastTime = performance.now();
            document.getElementById('hpPauseOverlay').style.display = 'none';
        }
    },

    async saveState() {
        try {
            const state = {
                mapId: this.mapId,
                mapType: this.mapType,
                mapConfig: this.mapConfig,
                player: this.player,
                enemies: this.enemies.filter(e => e.alive).map(e => ({
                    id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
                    speed: e.speed, radius: e.radius, angle: e.angle,
                    moveAngle: e.moveAngle, moveTimer: e.moveTimer,
                    weapon: e.weapon, detectRange: e.detectRange, alive: e.alive,
                    state: e.state, lastShootTime: e.lastShootTime
                })),
                items: this.items.filter(i => !i.picked),
                obstacles: this.obstacles,
                killCount: this.killCount,
                elapsedTime: this.elapsedTime,
                safeZoneRadius: this.safeZoneRadius,
                safeZoneCenterX: this.safeZoneCenterX,
                safeZoneCenterY: this.safeZoneCenterY,
                safeZoneTargetRadius: this.safeZoneTargetRadius,
                safeZoneTargetCX: this.safeZoneTargetCX,
                safeZoneTargetCY: this.safeZoneTargetCY,
                safeZonePhase: this.safeZonePhase,
                safeZonePhaseTimer: this.safeZonePhaseTimer,
                outsideDamage: this.outsideDamage
            };
            Storage.setGameState(JSON.stringify(state));
            await ApiService.post('/heping/game/state/save', {
                state_data: JSON.stringify(state)
            });
        } catch (e) {
            console.error(e);
        }
    },

    async endGame(isWin) {
        this.gameState = 'ended';

        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        Storage.removeGameState();

        const rank = isWin ? 1 : this.aliveCount;
        const surviveTime = Math.round(this.elapsedTime);
        const weaponsUsed = this.player.weaponsUsed.join(',');
        const itemsCollected = this.player.itemsCollected.join(',');

        try {
            await ApiService.post('/heping/game/end', {
                map_id: this.mapId,
                rank: rank,
                kills: this.killCount,
                damage_dealt: Math.round(this.player.damageDealt),
                damage_taken: Math.round(this.player.damageTaken),
                survive_time: surviveTime,
                weapons_used: weaponsUsed,
                items_collected: itemsCollected,
                is_win: isWin
            });
        } catch (e) {
            console.error(e);
        }

        this.showResult(isWin, rank, surviveTime);
    },

    showResult(isWin, rank, surviveTime) {
        const overlay = document.getElementById('hpResultOverlay');
        const content = document.getElementById('hpResultContent');

        const minutes = Math.floor(surviveTime / 60);
        const seconds = surviveTime % 60;

        content.innerHTML = `
            <div class="hp-result-title ${isWin ? 'hp-result-win' : 'hp-result-lose'}">
                ${isWin ? '🏆 大吉大利，今晚吃鸡！' : '💀 你被淘汰了'}
            </div>
            <div class="hp-result-stats">
                <div class="hp-result-stat">
                    <div class="hp-result-stat-value">#${rank}</div>
                    <div class="hp-result-stat-label">排名</div>
                </div>
                <div class="hp-result-stat">
                    <div class="hp-result-stat-value">${this.killCount}</div>
                    <div class="hp-result-stat-label">击杀</div>
                </div>
                <div class="hp-result-stat">
                    <div class="hp-result-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                    <div class="hp-result-stat-label">存活</div>
                </div>
                <div class="hp-result-stat">
                    <div class="hp-result-stat-value">${Math.round(this.player.damageDealt)}</div>
                    <div class="hp-result-stat-label">伤害</div>
                </div>
            </div>
            <div class="hp-result-actions">
                <button class="hp-btn hp-btn-primary" id="hpResultHomeBtn">返回大厅</button>
            </div>
        `;

        overlay.style.display = 'flex';

        document.getElementById('hpResultHomeBtn').addEventListener('click', () => {
            Router.navigate('home');
        });
    },

    quitGame() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        this.saveState();
        this.gameState = 'ended';
        Router.navigate('home');
    },

    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
        if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        if (this._onBeforeUnload) window.removeEventListener('beforeunload', this._onBeforeUnload);
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this._onMouseMove);
            this.canvas.removeEventListener('mousedown', this._onMouseDown);
            this.canvas.removeEventListener('contextmenu', this._onContextMenu);
        }
    }
};

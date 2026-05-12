class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager();
        this.storage = new StorageManager();
        this.mapManager = new MapManager();
        this.particles = new ParticleSystem();
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.currentScene = null;
        
        this.dreamEssence = 0;
        this.defeatedBosses = [];
        this.lastCheckpoint = null;
        this.unlockedAreas = [];
        
        this.isPaused = false;
        this.isRunning = false;
        this.gameLoopId = null;
        
        this.setupUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setupUI() {
        document.getElementById('resume-btn').onclick = () => this.resume();
        document.getElementById('restart-btn').onclick = () => this.restart();
        document.getElementById('quit-btn').onclick = () => this.quit();
    }

    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
        this.mapManager.init(window.innerWidth, window.innerHeight);
    }

    start(loadSave = false) {
        let gameState;
        
        if (loadSave && this.storage.hasSave()) {
            gameState = this.storage.load();
        } else {
            gameState = this.storage.getDefaultState();
        }
        
        this.applyState(gameState);
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop();
    }

    applyState(state) {
        this.player = new Player(state.player);
        this.currentScene = state.currentScene;
        this.dreamEssence = state.dreamEssence;
        this.defeatedBosses = state.defeatedBosses || [];
        this.lastCheckpoint = state.lastCheckpoint;
        this.unlockedAreas = state.unlockedAreas || ['nest_entrance'];
        this.collectedItems = state.collectedItems || {};
        this.collectedAbilities = state.collectedAbilities || [];
        
        this.mapManager.loadScene(this.currentScene);
        this.loadSceneEntities();
        this.updateUI();
    }

    loadSceneEntities() {
        const scene = this.mapManager.getScene();
        if (!scene) return;
        
        this.enemies = scene.enemies.map(e => new Enemy(e.type, e.x, e.y));
        
        if (scene.boss && !this.defeatedBosses.includes(scene.boss.type)) {
            this.boss = new Boss(scene.boss.type, scene.boss.x, scene.boss.y);
        } else {
            this.boss = null;
        }
        
        const sceneKey = this.currentScene;
        scene.collectibles.forEach((item, index) => {
            const itemKey = `${sceneKey}_item_${index}`;
            if (this.collectedItems[itemKey]) {
                item.collected = true;
            }
        });
        
        scene.abilityPickups.forEach((pickup, index) => {
            const pickupKey = `${sceneKey}_ability_${index}`;
            if (this.collectedAbilities.includes(pickupKey)) {
                pickup.collected = true;
            }
        });
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            this.update();
        }
        this.render();
        
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        const scene = this.mapManager.getScene();
        if (!scene) return;
        
        if (this.input.pause) {
            this.pause();
            this.input.update();
            return;
        }
        
        this.player.update(this.input, scene.platforms, scene.walls, this.particles);
        
        if (this.input.isKeyJustPressed('KeyE')) {
            for (const bench of scene.benches) {
                if (bench.isActive) {
                    this.restAtBench(bench);
                }
            }
        }
        
        for (const enemy of this.enemies) {
            enemy.update(scene.platforms, scene.walls, this.player);
            
            if (this.player.collidesWith(enemy)) {
                if (this.player.takeDamage(enemy.damage, this.particles)) {
                    this.playerDeath();
                }
            }
        }
        
        if (this.boss) {
            if (!this.boss.isActive) {
                const dist = Math.sqrt(
                    Math.pow(this.player.x - this.boss.x, 2) +
                    Math.pow(this.player.y - this.boss.y, 2)
                );
                if (dist < 300) {
                    this.boss.activate();
                    this.showBossUI();
                }
            }
            
            if (this.boss.isActive) {
                this.boss.update(scene.platforms, scene.walls, this.player);
                
                if (this.player.collidesWith(this.boss)) {
                    if (this.player.takeDamage(this.boss.damage, this.particles)) {
                        this.playerDeath();
                    }
                }
                
                this.updateBossUI();
            }
        }
        
        this.checkAttackHits();
        
        this.enemies = this.enemies.filter(e => e.health > 0);
        
        if (this.boss && this.boss.health <= 0) {
            this.bossDefeated();
        }
        
        scene.collectibles.forEach((item, index) => {
            if (!item.collected && item.checkCollision(this.player)) {
                this.collectItem(item, index);
            }
        });
        
        scene.abilityPickups.forEach((pickup, index) => {
            if (!pickup.collected && pickup.checkCollision(this.player)) {
                this.collectAbility(pickup, index);
            }
        });
        
        const exit = this.mapManager.checkExit(this.player);
        if (exit) {
            this.changeScene(exit.target, exit.spawnX, exit.spawnY);
        }
        
        this.mapManager.updateCamera(this.player.x, this.player.y);
        this.particles.update();
        this.input.update();
        this.updateUI();
        
        this.autoSave();
    }

    checkAttackHits() {
        const attackHitbox = this.player.getAttackHitbox();
        if (attackHitbox) {
            for (const enemy of this.enemies) {
                if (this.hitboxCollision(attackHitbox, enemy)) {
                    enemy.takeDamage(this.player.attack, this.particles);
                    this.player.addSoul(5);
                }
            }
            
            if (this.boss && this.boss.isActive && this.hitboxCollision(attackHitbox, this.boss)) {
                this.boss.takeDamage(this.player.attack, this.particles);
                this.player.addSoul(10);
            }
        }
    }

    hitboxCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    collectItem(item, index) {
        item.collected = true;
        const itemKey = `${this.currentScene}_item_${index}`;
        this.collectedItems[itemKey] = true;
        
        switch (item.type) {
            case 'essence':
                this.dreamEssence += item.value;
                this.particles.emitEssence(item.x, item.y);
                break;
            case 'health':
                this.player.heal(item.value);
                this.particles.emitEssence(item.x, item.y);
                break;
            case 'soul':
                this.player.addSoul(item.value);
                this.particles.emitEssence(item.x, item.y);
                break;
        }
    }

    collectAbility(pickup, index) {
        pickup.collected = true;
        const pickupKey = `${this.currentScene}_ability_${index}`;
        this.collectedAbilities.push(pickupKey);
        this.player.abilities[pickup.abilityType] = true;
        this.renderer.showAbilityUnlock(pickup.abilityType);
    }

    restAtBench(bench) {
        this.lastCheckpoint = bench.getCheckpoint();
        this.player.heal(this.player.maxHealth);
        this.player.soul = this.player.maxSoul;
        this.saveGame();
    }

    changeScene(sceneName, spawnX, spawnY) {
        if (!this.unlockedAreas.includes(sceneName)) {
            this.unlockedAreas.push(sceneName);
        }
        
        this.mapManager.loadScene(sceneName);
        this.currentScene = sceneName;
        this.player.x = spawnX;
        this.player.y = spawnY;
        this.loadSceneEntities();
        this.hideBossUI();
    }

    bossDefeated() {
        this.defeatedBosses.push(this.boss.type);
        this.dreamEssence += this.boss.essence;
        this.particles.emitDeath(this.boss.x, this.boss.y);
        this.boss = null;
        this.hideBossUI();
    }

    playerDeath() {
        if (this.lastCheckpoint) {
            this.changeScene(this.lastCheckpoint.scene, this.lastCheckpoint.x, this.lastCheckpoint.y);
        } else {
            const state = this.storage.getDefaultState();
            this.applyState(state);
        }
    }

    render() {
        const scene = this.mapManager.getScene();
        if (!scene) return;
        
        const camera = this.mapManager.getCamera();
        this.renderer.setCamera(camera);
        
        this.renderer.clear();
        this.renderer.drawBackground(scene.background);
        this.renderer.drawWalls(scene.walls);
        this.renderer.drawPlatforms(scene.platforms);
        this.renderer.drawExits(scene.exits);
        this.renderer.drawBenches(scene.benches, this.player);
        this.renderer.drawCollectibles(scene.collectibles);
        this.renderer.drawAbilityPickups(scene.abilityPickups);
        this.renderer.drawEnemies(this.enemies);
        this.renderer.drawBoss(this.boss);
        this.renderer.drawPlayer(this.player);
        this.renderer.drawParticles(this.particles);
    }

    updateUI() {
        const healthBar = document.getElementById('health-bar');
        healthBar.innerHTML = '';
        for (let i = 0; i < this.player.maxHealth; i++) {
            const cell = document.createElement('div');
            cell.className = `health-cell ${i < this.player.health ? 'filled' : 'empty'}`;
            healthBar.appendChild(cell);
        }
        
        const soulBar = document.getElementById('soul-bar');
        soulBar.innerHTML = '';
        const soulCells = 10;
        const soulPerCell = this.player.maxSoul / soulCells;
        for (let i = 0; i < soulCells; i++) {
            const cell = document.createElement('div');
            cell.className = `soul-cell ${(i + 1) * soulPerCell <= this.player.soul ? 'filled' : 'empty'}`;
            soulBar.appendChild(cell);
        }
        
        document.getElementById('essence-count').textContent = this.dreamEssence;
        
        const abilitiesDisplay = document.getElementById('abilities-display');
        abilitiesDisplay.innerHTML = '';
        const abilities = ['nail', 'dash', 'wallClimb', 'spell', 'shadowDash'];
        const icons = ['🗡️', '💨', '🧗', '🎯', '✨'];
        abilities.forEach((ability, i) => {
            const icon = document.createElement('div');
            icon.className = `ability-icon ${this.player.abilities[ability] ? 'unlocked' : ''}`;
            icon.textContent = icons[i];
            icon.title = this.getAbilityName(ability);
            abilitiesDisplay.appendChild(icon);
        });
    }

    getAbilityName(ability) {
        const names = {
            nail: '骨钉攻击',
            dash: '冲刺',
            wallClimb: '爬墙',
            spell: '灵魂法术',
            shadowDash: '暗影冲刺'
        };
        return names[ability] || ability;
    }

    showBossUI() {
        const container = document.getElementById('boss-health-container');
        container.style.display = 'block';
        document.getElementById('boss-name').textContent = this.boss.type === 'beeQueen' ? '蜂巢女王' : '蝎尾巨兽';
    }

    updateBossUI() {
        if (!this.boss) return;
        const fill = document.getElementById('boss-health-fill');
        const percent = Math.max(0, this.boss.health / 140) * 100;
        fill.style.width = `${percent}%`;
    }

    hideBossUI() {
        document.getElementById('boss-health-container').style.display = 'none';
    }

    pause() {
        this.isPaused = true;
        document.getElementById('pause-menu').style.display = 'flex';
    }

    resume() {
        this.isPaused = false;
        document.getElementById('pause-menu').style.display = 'none';
    }

    restart() {
        this.resume();
        this.stop();
        this.storage.clear();
        this.start(false);
    }

    quit() {
        this.stop();
        this.hideBossUI();
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        this.updateContinueButton();
    }

    stop() {
        this.isRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    autoSave() {
        const state = this.getState();
        this.storage.save(state);
    }

    saveGame() {
        const state = this.getState();
        this.storage.save(state);
    }

    getState() {
        return {
            player: this.player.getState(),
            currentScene: this.currentScene,
            dreamEssence: this.dreamEssence,
            defeatedBosses: this.defeatedBosses,
            lastCheckpoint: this.lastCheckpoint,
            unlockedAreas: this.unlockedAreas,
            collectedItems: this.collectedItems,
            collectedAbilities: this.collectedAbilities
        };
    }

    hasSave() {
        return this.storage.hasSave();
    }

    updateContinueButton() {
        const continueBtn = document.getElementById('continue-btn');
        if (this.hasSave()) {
            continueBtn.style.display = 'block';
        } else {
            continueBtn.style.display = 'none';
        }
    }
}
class MicroWorldGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = null;
        this.isPaused = false;
        this.isDialogOpen = false;
        this.keys = {};
        this.lastTime = 0;
        this.animationId = null;
        this.gameRunning = false;

        this.abilities = [
            { id: 'shrink', name: '🔬 分子缩小', desc: '按1键：缩小身体穿过窄缝 (5秒)', unlocked: false, cooldown: 0, maxCooldown: 15, duration: 0, maxDuration: 5 },
            { id: 'charge', name: '⚡ 电荷操控', desc: '按2键：推开附近敌人 (3秒)', unlocked: false, cooldown: 0, maxCooldown: 12, duration: 0, maxDuration: 3 },
            { id: 'phagocytosis', name: '🔵 吞噬融合', desc: '按3键：获得6秒无敌护盾', unlocked: false, cooldown: 0, maxCooldown: 20, duration: 0, maxDuration: 6 },
            { id: 'quantum', name: '✨ 量子跳跃', desc: '按4键：瞬移到前方距离', unlocked: false, cooldown: 0, maxCooldown: 8, duration: 0, maxDuration: 0 }
        ];

        this.levels = this.createLevels();
        this.init();
    }

    createLevels() {
        return [
            {
                id: 1,
                title: '细胞入口',
                description: '欢迎来到微观世界！你被缩小到纳米级别。\n收集所有ATP分子激活出口传送门。\n小心躲避红色细菌和紫色病毒！',
                collectibles: 5,
                abilityUnlock: null,
                bgColor: '#0a1628',
                enemySpeed: 3.8,
                enemyCount: 3,
                hostileRatio: 0.67,
                obstacleCount: 5,
                energyDrain: 0.15,
                narrowGaps: 0,
                movingObstacles: 1,
                chaseRange: 200,
                playerSpeed: 3.2
            },
            {
                id: 2,
                title: '细胞质迷宫',
                description: '细胞质里充满了危险！溶酶体在巡逻，细菌更加凶猛。\n完成本关将获得"分子缩小"能力！',
                collectibles: 6,
                abilityUnlock: 'shrink',
                bgColor: '#0d1a2d',
                enemySpeed: 4.3,
                enemyCount: 5,
                hostileRatio: 0.8,
                obstacleCount: 8,
                energyDrain: 0.22,
                narrowGaps: 2,
                movingObstacles: 3,
                chaseRange: 250,
                playerSpeed: 3.5
            },
            {
                id: 3,
                title: '细菌战场',
                description: '细菌大军入侵！敌人更多更快！\n利用"分子缩小"穿过窄缝找到捷径。\n完成本关获得"电荷操控"能力！',
                collectibles: 7,
                abilityUnlock: 'charge',
                bgColor: '#0a1a1a',
                enemySpeed: 4.8,
                enemyCount: 7,
                hostileRatio: 0.86,
                obstacleCount: 10,
                energyDrain: 0.28,
                narrowGaps: 4,
                movingObstacles: 4,
                chaseRange: 300,
                playerSpeed: 3.5
            },
            {
                id: 4,
                title: 'DNA螺旋',
                description: '深入细胞核！DNA螺旋形成了复杂迷宫。\n使用"电荷操控"推开敌人，找到隐藏的分子。\n完成获得"吞噬融合"能力！',
                collectibles: 8,
                abilityUnlock: 'phagocytosis',
                bgColor: '#1a0a2d',
                enemySpeed: 5.2,
                enemyCount: 9,
                hostileRatio: 0.89,
                obstacleCount: 12,
                energyDrain: 0.35,
                narrowGaps: 5,
                movingObstacles: 5,
                chaseRange: 350,
                playerSpeed: 3.8
            },
            {
                id: 5,
                title: '返回之门',
                description: '最终挑战！所有能力都将被用到！\n找到量子门户回到正常世界！\n完成获得"量子跳跃"能力！',
                collectibles: 10,
                abilityUnlock: 'quantum',
                bgColor: '#1a1a0a',
                enemySpeed: 5.8,
                enemyCount: 12,
                hostileRatio: 0.92,
                obstacleCount: 14,
                energyDrain: 0.42,
                narrowGaps: 6,
                movingObstacles: 6,
                chaseRange: 400,
                playerSpeed: 4.0
            }
        ];
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupEventListeners();
        this.setupSaveHandlers();
        this.checkSavedGameAndAutoResume();
    }

    setupSaveHandlers() {
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGame();
            }
        });
    }

    checkSavedGameAndAutoResume() {
        console.log('═══════════════════════════════════════');
        console.log('🔍 页面加载完成，开始检查存档...');
        console.log('🔍 localStorage 中的所有键:', Object.keys(localStorage));
        
        const saved = localStorage.getItem('microWorldSave');
        console.log('🔍 microWorldSave 存在:', saved ? '✅ 是' : '❌ 否');
        
        if (saved) {
            console.log('🔍 存档数据长度:', saved.length, '字符');
            try {
                const data = JSON.parse(saved);
                console.log('🔍 解析成功！gameState:', data.gameState);
                console.log('🔍 levelData.collectibles 数量:', data.levelData?.collectibles?.length);
                
                if (data && data.gameState && data.gameState.currentLevel) {
                    console.log('✅ 找到有效存档，当前关卡:', data.gameState.currentLevel);
                    console.log('✅ 已收集分子:', data.gameState.collected, '/', data.gameState.currentLevel);
                    
                    this.gameState = data.gameState;
                    this.abilities = data.abilities || this.abilities;

                    for (let i = 0; i < this.abilities.length; i++) {
                        this.abilities[i].cooldown = 0;
                        this.abilities[i].duration = 0;
                    }

                    document.getElementById('start-screen').classList.remove('active');
                    document.getElementById('game-screen').classList.add('active');
                    
                    console.log('🚀 准备调用 loadLevel...');
                    this.loadLevel(this.gameState.currentLevel, data.levelData);
                    console.log('═══════════════════════════════════════');
                    return;
                }
            } catch (e) {
                console.error('❌ 存档解析失败:', e);
                console.error('❌ 存档内容:', saved.substring(0, 200));
            }
        }
        console.log('⚠️ 没有有效存档，显示开始画面');
        console.log('═══════════════════════════════════════');
        document.getElementById('continue-game').style.display = saved ? 'block' : 'none';
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 80;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key === ' ' && !this.isPaused && !this.isDialogOpen && this.gameRunning) {
                e.preventDefault();
                this.handleInteraction();
            }
            if ((e.key === 'e' || e.key === 'E') && !this.isDialogOpen && this.gameRunning) {
                this.toggleAbilitiesPanel();
            }
            if (e.key === 'Escape') {
                if (this.isDialogOpen) {
                    this.closeDialog();
                } else if (this.gameRunning) {
                    this.togglePause();
                }
            }
            if (e.key >= '1' && e.key <= '4' && this.gameRunning && !this.isPaused && !this.isDialogOpen) {
                this.activateAbility(parseInt(e.key) - 1);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('continue-game').addEventListener('click', () => this.continueGame());
        document.getElementById('abilities-btn').addEventListener('click', () => this.toggleAbilitiesPanel());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('close-abilities').addEventListener('click', () => this.toggleAbilitiesPanel());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('dialog-close').addEventListener('click', () => this.closeDialog());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('play-again-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.returnToMenu());
    }

    checkSavedGame() {
        const saved = localStorage.getItem('microWorldSave');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data && data.gameState && data.gameState.currentLevel) {
                    document.getElementById('continue-game').style.display = 'block';
                    return;
                }
            } catch (e) { }
        }
        document.getElementById('continue-game').style.display = 'none';
    }

    startNewGame() {
        this.hideAllPanels();

        this.abilities = [
            { id: 'shrink', name: '🔬 分子缩小', desc: '按1键：缩小身体穿过窄缝 (5秒)', unlocked: false, cooldown: 0, maxCooldown: 15, duration: 0, maxDuration: 5 },
            { id: 'charge', name: '⚡ 电荷操控', desc: '按2键：推开附近敌人 (3秒)', unlocked: false, cooldown: 0, maxCooldown: 12, duration: 0, maxDuration: 3 },
            { id: 'phagocytosis', name: '🔵 吞噬融合', desc: '按3键：获得6秒无敌护盾', unlocked: false, cooldown: 0, maxCooldown: 20, duration: 0, maxDuration: 6 },
            { id: 'quantum', name: '✨ 量子跳跃', desc: '按4键：瞬移到前方距离', unlocked: false, cooldown: 0, maxCooldown: 8, duration: 0, maxDuration: 0 }
        ];

        this.gameState = {
            currentLevel: 1,
            energy: 100,
            collected: 0,
            totalCollected: 0,
            levelStartTime: Date.now()
        };

        localStorage.removeItem('microWorldSave');
        this.showGameScreen();
        this.loadLevel(1);
    }

    continueGame() {
        const saved = localStorage.getItem('microWorldSave');
        if (!saved) {
            this.startNewGame();
            return;
        }

        try {
            const data = JSON.parse(saved);
            this.gameState = data.gameState;
            this.abilities = data.abilities || this.abilities;

            for (let i = 0; i < this.abilities.length; i++) {
                this.abilities[i].cooldown = 0;
                this.abilities[i].duration = 0;
            }

            this.showGameScreen();
            this.loadLevel(this.gameState.currentLevel, data.levelData);
        } catch (e) {
            this.startNewGame();
        }
    }

    saveGame() {
        if (!this.gameState) return;

        try {
            const levelData = {
                collectibles: this.collectibles ? this.collectibles.map(c => ({
                    x: c.x, y: c.y, collected: c.collected, type: c.type, phase: c.phase
                })) : [],
                collected: this.gameState.collected,
                exitPortalActive: this.exitPortal ? this.exitPortal.active : false
            };

            const saveData = {
                gameState: this.gameState,
                abilities: this.abilities,
                levelData: levelData
            };

            console.log('💾 保存游戏:', {
                level: this.gameState.currentLevel,
                collected: this.gameState.collected,
                energy: this.gameState.energy,
                collectiblesCount: levelData.collectibles.length
            });

            localStorage.setItem('microWorldSave', JSON.stringify(saveData));
            this.showSaveIndicator();
        } catch (e) {
            console.warn('保存失败:', e);
        }
    }

    showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (!indicator) return;
        indicator.classList.add('show');
        clearTimeout(this.saveIndicatorTimer);
        this.saveIndicatorTimer = setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }

    showGameScreen() {
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }

    loadLevel(levelId, savedLevelData) {
        console.log('📦 loadLevel 被调用，levelId:', levelId, 'savedLevelData:', savedLevelData ? '有' : '无');
        
        this.currentLevel = this.levels[levelId - 1];
        this.gameState.currentLevel = levelId;
        this.gameState.levelStartTime = Date.now();

        document.getElementById('current-level').textContent = levelId;
        document.getElementById('level-title').textContent = this.currentLevel.title;
        document.getElementById('total-collectibles').textContent = this.currentLevel.collectibles;

        this.player = {
            x: 80,
            y: this.canvas.height / 2,
            radius: 15,
            baseRadius: 15,
            speed: this.currentLevel.playerSpeed || 3.5,
            vx: 0,
            vy: 0,
            glowPhase: 0,
            shielded: false,
            shrunk: false
        };

        this.createLevelObjects(savedLevelData);

        if (savedLevelData) {
            console.log('📦 恢复收集物数量:', savedLevelData.collected);
            this.gameState.collected = savedLevelData.collected || 0;
            document.getElementById('collected').textContent = this.gameState.collected;
            if (savedLevelData.exitPortalActive) {
                console.log('📦 出口已激活');
                this.exitPortal.active = true;
            }
            console.log('📦 恢复后 collectibles:', this.collectibles.filter(c => c.collected).length, '/', this.collectibles.length);
        } else {
            this.gameState.collected = 0;
            document.getElementById('collected').textContent = 0;
        }

        this.updateAbilityUI();

        if (!savedLevelData) {
            this.showDialog(this.currentLevel.description);
        }

        this.saveGame();
        this.gameRunning = true;
        this.isPaused = false;
        this.startGameLoop();
    }

    createLevelObjects(savedLevelData) {
        const level = this.currentLevel;

        this.obstacles = [];
        this.narrowGaps = [];
        this.collectibles = [];
        this.interactables = [];
        this.particles = [];
        this.movingObstacles = [];

        const cw = this.canvas.width;
        const ch = this.canvas.height;

        for (let i = 0; i < level.obstacleCount; i++) {
            const type = Math.random() > 0.5 ? 'membrane' : 'organelle';
            this.obstacles.push({
                x: 180 + Math.random() * (cw - 360),
                y: 80 + Math.random() * (ch - 160),
                width: type === 'membrane' ? 100 + Math.random() * 80 : 60 + Math.random() * 50,
                height: type === 'membrane' ? 12 + Math.random() * 8 : 60 + Math.random() * 50,
                type,
                phase: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < level.movingObstacles; i++) {
            const horizontal = Math.random() > 0.5;
            this.movingObstacles.push({
                x: 200 + Math.random() * (cw - 400),
                y: 100 + Math.random() * (ch - 200),
                width: horizontal ? 120 : 15,
                height: horizontal ? 15 : 120,
                type: 'membrane',
                phase: Math.random() * Math.PI * 2,
                horizontal,
                speed: 0.5 + Math.random() * 1.0,
                range: 80 + Math.random() * 80,
                startX: 0,
                startY: 0
            });
            this.movingObstacles[this.movingObstacles.length - 1].startX = this.movingObstacles[this.movingObstacles.length - 1].x;
            this.movingObstacles[this.movingObstacles.length - 1].startY = this.movingObstacles[this.movingObstacles.length - 1].y;
        }

        for (let i = 0; i < level.narrowGaps; i++) {
            const isVertical = Math.random() > 0.5;
            const gapX = 200 + Math.random() * (cw - 400);
            const gapY = 80 + Math.random() * (ch - 160);

            if (isVertical) {
                const wallLength = 100 + Math.random() * 80;
                this.narrowGaps.push({
                    type: 'wall',
                    x: gapX,
                    y: gapY,
                    width: 12,
                    height: wallLength,
                    gapY: gapY + wallLength * 0.3,
                    gapHeight: 45,
                    phase: Math.random() * Math.PI * 2
                });
            } else {
                const wallLength = 100 + Math.random() * 80;
                this.narrowGaps.push({
                    type: 'wall',
                    x: gapX,
                    y: gapY,
                    width: wallLength,
                    height: 12,
                    gapX: gapX + wallLength * 0.3,
                    gapWidth: 45,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        if (savedLevelData && savedLevelData.collectibles) {
            for (const c of savedLevelData.collectibles) {
                this.collectibles.push({
                    x: c.x,
                    y: c.y,
                    radius: 10,
                    collected: c.collected,
                    phase: c.phase || Math.random() * Math.PI * 2,
                    type: c.type
                });
            }
        } else {
            for (let i = 0; i < level.collectibles; i++) {
                let cx, cy, valid;
                let attempts = 0;
                do {
                    cx = 150 + Math.random() * (cw - 300);
                    cy = 100 + Math.random() * (ch - 200);
                    valid = true;
                    for (const obs of this.obstacles) {
                        if (cx > obs.x - 20 && cx < obs.x + obs.width + 20 &&
                            cy > obs.y - 20 && cy < obs.y + obs.height + 20) {
                            valid = false;
                            break;
                        }
                    }
                    attempts++;
                } while (!valid && attempts < 50);

                this.collectibles.push({
                    x: cx,
                    y: cy,
                    radius: 10,
                    collected: false,
                    phase: Math.random() * Math.PI * 2,
                    type: ['ATP', '分子', '能量'][Math.floor(Math.random() * 3)]
                });
            }
        }

        const hostileCount = Math.floor(level.enemyCount * level.hostileRatio);
        const friendlyCount = level.enemyCount - hostileCount;

        for (let i = 0; i < friendlyCount; i++) {
            this.interactables.push({
                x: 200 + Math.random() * (cw - 400),
                y: 100 + Math.random() * (ch - 200),
                radius: 25,
                type: 'mitochondria',
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                phase: Math.random() * Math.PI * 2,
                hostile: false,
                interacted: false
            });
        }

        for (let i = 0; i < hostileCount; i++) {
            const type = Math.random() > 0.5 ? 'bacteria' : 'virus';
            const spawnX = cw * 0.5 + Math.random() * (cw * 0.4);
            const spawnY = 100 + Math.random() * (ch - 200);

            this.interactables.push({
                x: spawnX,
                y: spawnY,
                radius: type === 'bacteria' ? 18 : 14,
                type,
                vx: (Math.random() - 0.5) * level.enemySpeed,
                vy: (Math.random() - 0.5) * level.enemySpeed,
                phase: Math.random() * Math.PI * 2,
                hostile: true,
                interacted: false,
                chaseSpeed: level.enemySpeed,
                chaseRange: level.chaseRange || 250,
                patrolAngle: Math.random() * Math.PI * 2,
                patrolTimer: 0,
                state: 'patrol'
            });
        }

        this.exitPortal = {
            x: cw - 70,
            y: ch / 2,
            radius: 35,
            phase: 0,
            active: false
        };

        this.backgroundParticles = [];
        for (let i = 0; i < 60; i++) {
            this.backgroundParticles.push({
                x: Math.random() * cw,
                y: Math.random() * ch,
                radius: Math.random() * 2.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.4 + 0.1
            });
        }
    }

    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;

        if (this.isPaused) {
            this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        this.updatePlayer(dt);
        this.updateAbilities(dt);
        this.updateInteractables(dt);
        this.updateMovingObstacles(dt);
        this.updateParticles(dt);
        this.updateBackgroundParticles();
        this.checkCollisions();
        this.drainEnergy(dt);
        this.checkExit();
        this.updateUI();

        this.autoSaveTimer = (this.autoSaveTimer || 0) + dt;
        if (this.autoSaveTimer >= 2) {
            this.autoSaveTimer = 0;
            this.saveGame();
        }
    }

    drainEnergy(dt) {
        if (this.currentLevel.energyDrain > 0) {
            this.gameState.energy -= this.currentLevel.energyDrain * dt * 60;
            if (this.gameState.energy <= 0) {
                this.gameState.energy = 0;
                this.gameOver();
            }
        }
    }

    gameOver() {
        this.isPaused = true;
        this.showDialog('💀 能量耗尽！你被微观世界吞噬了...\n点击确定重新尝试本关。');
        document.getElementById('dialog-close').onclick = () => {
            this.closeDialog();
            this.gameState.energy = 100;
            this.isPaused = false;
            this.loadLevel(this.gameState.currentLevel);
            document.getElementById('dialog-close').onclick = () => this.closeDialog();
        };
    }

    updatePlayer(dt) {
        let dx = 0, dy = 0;

        if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
        if (this.keys['arrowdown'] || this.keys['s']) dy += 1;
        if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
        if (this.keys['arrowright'] || this.keys['d']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.player.vx = dx * this.player.speed;
        this.player.vy = dy * this.player.speed;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

        this.player.glowPhase += dt * 3;

        if (this.player.shrunk) {
            this.player.radius = 8;
        } else {
            this.player.radius = this.player.baseRadius;
        }
    }

    updateAbilities(dt) {
        for (const ab of this.abilities) {
            if (!ab.unlocked) continue;

            if (ab.cooldown > 0) {
                ab.cooldown = Math.max(0, ab.cooldown - dt);
            }

            if (ab.duration > 0) {
                ab.duration -= dt;
                if (ab.duration <= 0) {
                    ab.duration = 0;
                    this.deactivateAbility(ab.id);
                }
            }
        }
    }

    activateAbility(index) {
        const ab = this.abilities[index];
        if (!ab || !ab.unlocked || ab.cooldown > 0 || ab.duration > 0) return;

        switch (ab.id) {
            case 'shrink':
                ab.duration = ab.maxDuration;
                ab.cooldown = ab.maxCooldown;
                this.player.shrunk = true;
                this.spawnAbilityParticles(this.player.x, this.player.y, '#00ffaa');
                break;
            case 'charge':
                ab.duration = ab.maxDuration;
                ab.cooldown = ab.maxCooldown;
                this.interactables.forEach(org => {
                    if (org.hostile) {
                        const angle = Math.atan2(org.y - this.player.y, org.x - this.player.x);
                        org.vx += Math.cos(angle) * 8;
                        org.vy += Math.sin(angle) * 8;
                    }
                });
                this.spawnAbilityParticles(this.player.x, this.player.y, '#ffff00');
                break;
            case 'phagocytosis':
                ab.duration = ab.maxDuration;
                ab.cooldown = ab.maxCooldown;
                this.player.shielded = true;
                this.spawnAbilityParticles(this.player.x, this.player.y, '#00aaff');
                break;
            case 'quantum':
                ab.cooldown = ab.maxCooldown;
                let jumpDx = 0, jumpDy = 0;
                if (this.keys['arrowup'] || this.keys['w']) jumpDy = -1;
                if (this.keys['arrowdown'] || this.keys['s']) jumpDy = 1;
                if (this.keys['arrowleft'] || this.keys['a']) jumpDx = -1;
                if (this.keys['arrowright'] || this.keys['d']) jumpDx = 1;

                if (jumpDx === 0 && jumpDy === 0) jumpDx = 1;

                const len = Math.sqrt(jumpDx * jumpDx + jumpDy * jumpDy);
                jumpDx /= len;
                jumpDy /= len;

                const oldX = this.player.x;
                const oldY = this.player.y;

                this.player.x += jumpDx * 150;
                this.player.y += jumpDy * 150;

                this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
                this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

                for (let i = 0; i < 8; i++) {
                    const t = i / 8;
                    this.particles.push({
                        x: oldX + (this.player.x - oldX) * t,
                        y: oldY + (this.player.y - oldY) * t,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: 5,
                        life: 0.6,
                        maxLife: 0.6,
                        alpha: 1,
                        color: '#aa00ff'
                    });
                }
                this.spawnAbilityParticles(this.player.x, this.player.y, '#aa00ff');
                break;
        }
        this.updateAbilityUI();
    }

    deactivateAbility(id) {
        switch (id) {
            case 'shrink':
                this.player.shrunk = false;
                break;
            case 'phagocytosis':
                this.player.shielded = false;
                break;
        }
        this.updateAbilityUI();
    }

    spawnAbilityParticles(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                radius: 5,
                life: 0.7,
                maxLife: 0.7,
                alpha: 1,
                color
            });
        }
    }

    updateAbilityUI() {
        const el = document.getElementById('ability-slots');
        if (!el) return;

        let html = '';
        for (let i = 0; i < this.abilities.length; i++) {
            const ab = this.abilities[i];
            const isActive = ab.duration > 0;
            const isOnCooldown = ab.cooldown > 0 && ab.duration <= 0;
            const isLocked = !ab.unlocked;

            let statusClass = 'ability-slot';
            if (isLocked) statusClass += ' locked';
            else if (isActive) statusClass += ' active';
            else if (isOnCooldown) statusClass += ' cooldown';

            let statusText = '';
            if (isLocked) statusText = '🔒';
            else if (isActive) statusText = `${ab.duration.toFixed(1)}s`;
            else if (isOnCooldown) statusText = `${ab.cooldown.toFixed(0)}s`;
            else statusText = `${i + 1}`;

            html += `<div class="${statusClass}">
                <div class="ability-slot-icon">${ab.name.split(' ')[0]}</div>
                <div class="ability-slot-key">${statusText}</div>
            </div>`;
        }
        el.innerHTML = html;
    }

    updateInteractables(dt) {
        this.interactables.forEach(org => {
            org.phase += dt * 2;

            if (org.hostile) {
                const distToPlayer = this.distance(org, this.player);
                const chaseRange = this.currentLevel.chaseRange || 250;

                if (distToPlayer < chaseRange) {
                    org.state = 'chase';
                    const angle = Math.atan2(this.player.y - org.y, this.player.x - org.x);
                    const speed = org.chaseSpeed;

                    org.vx = Math.cos(angle) * speed;
                    org.vy = Math.sin(angle) * speed;
                } else {
                    org.state = 'patrol';
                    org.patrolTimer += dt;
                    if (org.patrolTimer > 1.5) {
                        org.patrolTimer = 0;
                        org.patrolAngle += (Math.random() - 0.5) * Math.PI * 1.5;
                    }
                    const patrolSpeed = org.chaseSpeed * 0.4;
                    org.vx = Math.cos(org.patrolAngle) * patrolSpeed;
                    org.vy = Math.sin(org.patrolAngle) * patrolSpeed;
                }
            }

            org.x += org.vx;
            org.y += org.vy;

            const margin = org.radius + 5;
            if (org.x < margin) { org.x = margin; org.vx = Math.abs(org.vx); }
            if (org.x > this.canvas.width - margin) { org.x = this.canvas.width - margin; org.vx = -Math.abs(org.vx); }
            if (org.y < margin) { org.y = margin; org.vy = Math.abs(org.vy); }
            if (org.y > this.canvas.height - margin) { org.y = this.canvas.height - margin; org.vy = -Math.abs(org.vy); }
        });
    }

    updateMovingObstacles(dt) {
        this.movingObstacles.forEach(obs => {
            obs.phase += dt * obs.speed;
            if (obs.horizontal) {
                obs.x = obs.startX + Math.sin(obs.phase) * obs.range;
            } else {
                obs.y = obs.startY + Math.sin(obs.phase) * obs.range;
            }
        });
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateBackgroundParticles() {
        this.backgroundParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
        });
    }

    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    checkCollisions() {
        this.collectibles.forEach(c => {
            if (!c.collected && this.distance(this.player, c) < this.player.radius + c.radius) {
                c.collected = true;
                this.gameState.collected++;
                this.gameState.totalCollected++;
                this.spawnCollectParticles(c.x, c.y);
                this.gameState.energy = Math.min(100, this.gameState.energy + 15);

                if (this.gameState.collected >= this.currentLevel.collectibles) {
                    this.exitPortal.active = true;
                }

                this.saveGame();
            }
        });

        this.interactables.forEach(org => {
            const dist = this.distance(this.player, org);
            if (dist < this.player.radius + org.radius) {
                if (org.hostile) {
                    if (this.player.shielded) {
                        const angle = Math.atan2(org.y - this.player.y, org.x - this.player.x);
                        org.vx += Math.cos(angle) * 5;
                        org.vy += Math.sin(angle) * 5;
                    } else {
                        this.gameState.energy -= 2;
                        const angle = Math.atan2(this.player.y - org.y, this.player.x - org.x);
                        this.player.x += Math.cos(angle) * 8;
                        this.player.y += Math.sin(angle) * 8;

                        for (let i = 0; i < 5; i++) {
                            this.particles.push({
                                x: this.player.x,
                                y: this.player.y,
                                vx: (Math.random() - 0.5) * 4,
                                vy: (Math.random() - 0.5) * 4,
                                radius: 3,
                                life: 0.5,
                                maxLife: 0.5,
                                alpha: 1,
                                color: '#ff4444'
                            });
                        }

                        if (this.gameState.energy <= 0) {
                            this.gameState.energy = 0;
                            this.gameOver();
                        }
                    }
                } else if (!org.interacted) {
                    this.handleOrganismInteraction(org);
                }
            }
        });

        this.obstacles.forEach(obs => {
            if (this.rectCircleCollision(obs, this.player)) {
                this.resolveObstacleCollision(obs);
            }
        });

        this.movingObstacles.forEach(obs => {
            if (this.rectCircleCollision(obs, this.player)) {
                this.resolveObstacleCollision(obs);
            }
        });

        this.narrowGaps.forEach(wall => {
            this.handleNarrowGapCollision(wall);
        });
    }

    resolveObstacleCollision(obs) {
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const angle = Math.atan2(this.player.y - centerY, this.player.x - centerX);
        this.player.x += Math.cos(angle) * 4;
        this.player.y += Math.sin(angle) * 4;
    }

    handleNarrowGapCollision(wall) {
        if (wall.gapX !== undefined) {
            const inGap = this.player.x > wall.gapX && this.player.x < wall.gapX + wall.gapWidth;
            if (inGap) {
                if (this.player.shrunk) return;
                if (this.player.y > wall.y - this.player.radius && this.player.y < wall.y + wall.height + this.player.radius) {
                    if (this.player.y < wall.y + wall.height / 2) {
                        this.player.y = wall.y - this.player.radius;
                    } else {
                        this.player.y = wall.y + wall.height + this.player.radius;
                    }
                }
            } else {
                if (this.rectCircleCollision(wall, this.player)) {
                    this.resolveObstacleCollision(wall);
                }
            }
        } else if (wall.gapY !== undefined) {
            const inGap = this.player.y > wall.gapY && this.player.y < wall.gapY + wall.gapHeight;
            if (inGap) {
                if (this.player.shrunk) return;
                if (this.player.x > wall.x - this.player.radius && this.player.x < wall.x + wall.width + this.player.radius) {
                    if (this.player.x < wall.x + wall.width / 2) {
                        this.player.x = wall.x - this.player.radius;
                    } else {
                        this.player.x = wall.x + wall.width + this.player.radius;
                    }
                }
            } else {
                if (this.rectCircleCollision(wall, this.player)) {
                    this.resolveObstacleCollision(wall);
                }
            }
        }
    }

    rectCircleCollision(rect, circle) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const distX = circle.x - closestX;
        const distY = circle.y - closestY;
        return (distX * distX + distY * distY) < (circle.radius * circle.radius);
    }

    handleOrganismInteraction(org) {
        org.interacted = true;

        if (org.type === 'mitochondria') {
            this.showDialog('线粒体："旅行者，让我给你补充能量吧！"');
            this.gameState.energy = Math.min(100, this.gameState.energy + 25);
        }

        setTimeout(() => { org.interacted = false; }, 15000);
    }

    handleInteraction() {
        let nearestInteractable = null;
        let nearestDist = 120;

        this.interactables.forEach(org => {
            const dist = this.distance(this.player, org);
            if (dist < nearestDist && !org.hostile) {
                nearestDist = dist;
                nearestInteractable = org;
            }
        });

        if (nearestInteractable) {
            this.handleOrganismInteraction(nearestInteractable);
        }
    }

    spawnCollectParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                radius: 4,
                life: 0.8,
                maxLife: 0.8,
                alpha: 1,
                color: '#ffdd00'
            });
        }
    }

    checkExit() {
        if (this.exitPortal.active && this.distance(this.player, this.exitPortal) < this.exitPortal.radius) {
            this.completeLevel();
        }
    }

    completeLevel() {
        this.isPaused = true;

        if (this.currentLevel.abilityUnlock) {
            const ability = this.abilities.find(a => a.id === this.currentLevel.abilityUnlock);
            if (ability && !ability.unlocked) {
                ability.unlocked = true;
            }
        }

        const timeTaken = Math.floor((Date.now() - this.gameState.levelStartTime) / 1000);

        document.getElementById('final-collected').textContent = this.gameState.collected;
        document.getElementById('final-total').textContent = this.currentLevel.collectibles;
        document.getElementById('final-time').textContent = timeTaken;

        const abilityUnlocked = this.currentLevel.abilityUnlock;
        const abilityName = abilityUnlocked ? this.abilities.find(a => a.id === abilityUnlocked)?.name : null;

        if (this.gameState.currentLevel >= this.levels.length) {
            if (abilityName) {
                document.querySelector('#game-complete .complete-message').textContent =
                    `你成功找到了返回正常世界的方法！并获得了${abilityName}！`;
            }
            document.getElementById('game-complete').classList.remove('hidden');
        } else {
            if (abilityName) {
                const statsEl = document.querySelector('#level-complete .level-stats');
                const existing = statsEl.querySelector('.ability-unlock');
                if (existing) existing.remove();
                const unlockEl = document.createElement('p');
                unlockEl.className = 'ability-unlock';
                unlockEl.style.color = '#00ffcc';
                unlockEl.style.fontWeight = 'bold';
                unlockEl.textContent = `🎉 获得新能力: ${abilityName}`;
                statsEl.appendChild(unlockEl);
            }
            document.getElementById('level-complete').classList.remove('hidden');
        }

        this.saveGame();
    }

    nextLevel() {
        document.getElementById('level-complete').classList.add('hidden');
        this.isPaused = false;
        this.loadLevel(this.gameState.currentLevel + 1);
    }

    restartLevel() {
        document.getElementById('pause-panel').classList.add('hidden');
        document.getElementById('game-complete').classList.add('hidden');
        this.gameState.energy = 100;
        this.isPaused = false;
        this.loadLevel(this.gameState.currentLevel);
    }

    hideAllPanels() {
        document.getElementById('pause-panel').classList.add('hidden');
        document.getElementById('level-complete').classList.add('hidden');
        document.getElementById('game-complete').classList.add('hidden');
        document.getElementById('abilities-panel').classList.add('hidden');
        document.getElementById('dialog-box').classList.add('hidden');
        this.isDialogOpen = false;
    }

    updateUI() {
        document.getElementById('energy-bar').style.width = `${Math.max(0, this.gameState.energy)}%`;

        const energyBar = document.getElementById('energy-bar');
        if (this.gameState.energy < 25) {
            energyBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        } else if (this.gameState.energy < 50) {
            energyBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
        } else {
            energyBar.style.background = 'linear-gradient(90deg, #00ff88, #00aaff)';
        }

        document.getElementById('collected').textContent = this.gameState.collected;

        let nearestHint = null;
        let nearestDist = 120;

        this.interactables.forEach(org => {
            const dist = this.distance(this.player, org);
            if (dist < nearestDist) {
                nearestDist = dist;
                if (org.hostile) {
                    nearestHint = `⚠️ ${org.type === 'bacteria' ? '细菌' : '病毒'}！${this.player.shielded ? '护盾保护中' : '快跑！'}`;
                } else {
                    nearestHint = '按空格键与线粒体互动';
                }
            }
        });

        const hintEl = document.getElementById('interaction-hint');
        if (nearestHint && !this.isDialogOpen && !this.isPaused) {
            hintEl.textContent = nearestHint;
            hintEl.classList.remove('hidden');
        } else {
            hintEl.classList.add('hidden');
        }

        if (this.player.shielded) {
            const shieldHint = document.getElementById('shield-indicator');
            if (shieldHint) {
                const phagoAbility = this.abilities.find(a => a.id === 'phagocytosis');
                shieldHint.textContent = `🛡️ 护盾 ${phagoAbility.duration.toFixed(1)}s`;
                shieldHint.classList.remove('hidden');
            }
        } else {
            const shieldHint = document.getElementById('shield-indicator');
            if (shieldHint) shieldHint.classList.add('hidden');
        }

        if (this.player.shrunk) {
            const shrinkHint = document.getElementById('shrink-indicator');
            if (shrinkHint) {
                const shrinkAbility = this.abilities.find(a => a.id === 'shrink');
                shrinkHint.textContent = `🔬 缩小 ${shrinkAbility.duration.toFixed(1)}s`;
                shrinkHint.classList.remove('hidden');
            }
        } else {
            const shrinkHint = document.getElementById('shrink-indicator');
            if (shrinkHint) shrinkHint.classList.add('hidden');
        }

        this.updateAbilityUI();
    }

    render() {
        const ctx = this.ctx;

        ctx.fillStyle = this.currentLevel ? this.currentLevel.bgColor : '#050a15';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderBackgroundParticles();
        this.renderNarrowGaps();
        this.renderObstacles();
        this.renderMovingObstacles();
        this.renderCollectibles();
        this.renderInteractables();
        this.renderExit();
        this.renderPlayer();
        this.renderParticles();
    }

    renderBackgroundParticles() {
        const ctx = this.ctx;
        this.backgroundParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 200, 255, ${p.alpha})`;
            ctx.fill();
        });
    }

    renderNarrowGaps() {
        const ctx = this.ctx;

        this.narrowGaps.forEach(wall => {
            ctx.fillStyle = 'rgba(0, 200, 150, 0.6)';
            ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
            ctx.lineWidth = 2;

            if (wall.gapX !== undefined) {
                ctx.fillRect(wall.x, wall.y, wall.gapX - wall.x, wall.height);
                ctx.strokeRect(wall.x, wall.y, wall.gapX - wall.x, wall.height);

                const rightStart = wall.gapX + wall.gapWidth;
                ctx.fillRect(rightStart, wall.y, (wall.x + wall.width) - rightStart, wall.height);
                ctx.strokeRect(rightStart, wall.y, (wall.x + wall.width) - rightStart, wall.height);

                ctx.fillStyle = this.player.shrunk ? 'rgba(0, 255, 200, 0.3)' : 'rgba(255, 100, 100, 0.3)';
                ctx.fillRect(wall.gapX, wall.y, wall.gapWidth, wall.height);

                if (!this.player.shrunk) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('需缩小', wall.gapX + wall.gapWidth / 2, wall.y + wall.height / 2 + 3);
                }
            } else if (wall.gapY !== undefined) {
                ctx.fillRect(wall.x, wall.y, wall.width, wall.gapY - wall.y);
                ctx.strokeRect(wall.x, wall.y, wall.width, wall.gapY - wall.y);

                const bottomStart = wall.gapY + wall.gapHeight;
                ctx.fillRect(wall.x, bottomStart, wall.width, (wall.y + wall.height) - bottomStart);
                ctx.strokeRect(wall.x, bottomStart, wall.width, (wall.y + wall.height) - bottomStart);

                ctx.fillStyle = this.player.shrunk ? 'rgba(0, 255, 200, 0.3)' : 'rgba(255, 100, 100, 0.3)';
                ctx.fillRect(wall.x, wall.gapY, wall.width, wall.gapHeight);

                if (!this.player.shrunk) {
                    ctx.save();
                    ctx.translate(wall.x + wall.width / 2, wall.gapY + wall.gapHeight / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('需缩小', 0, 3);
                    ctx.restore();
                }
            }
        });
    }

    renderObstacles() {
        const ctx = this.ctx;

        this.obstacles.forEach(obs => {
            const pulse = Math.sin(obs.phase) * 0.05 + 1;
            obs.phase += 0.02;

            ctx.save();
            ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

            if (obs.type === 'membrane') {
                const gradient = ctx.createLinearGradient(-obs.width / 2, 0, obs.width / 2, 0);
                gradient.addColorStop(0, 'rgba(0, 255, 170, 0.15)');
                gradient.addColorStop(0.5, 'rgba(0, 255, 170, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 255, 170, 0.15)');

                ctx.fillStyle = gradient;
                ctx.fillRect(-obs.width / 2 * pulse, -obs.height / 2, obs.width * pulse, obs.height);

                ctx.strokeStyle = 'rgba(0, 255, 170, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-obs.width / 2 * pulse, -obs.height / 2, obs.width * pulse, obs.height);
            } else {
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2 * pulse, obs.height / 2 * pulse, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(170, 102, 255, 0.35)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(170, 102, 255, 0.9)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 4, obs.height / 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 150, 255, 0.5)';
                ctx.fill();
            }

            ctx.restore();
        });
    }

    renderMovingObstacles() {
        const ctx = this.ctx;

        this.movingObstacles.forEach(obs => {
            ctx.save();
            ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

            const gradient = ctx.createLinearGradient(-obs.width / 2, 0, obs.width / 2, 0);
            gradient.addColorStop(0, 'rgba(255, 170, 0, 0.15)');
            gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0.15)');

            ctx.fillStyle = gradient;
            ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

            ctx.strokeStyle = 'rgba(255, 170, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

            ctx.restore();
        });
    }

    renderCollectibles() {
        const ctx = this.ctx;

        this.collectibles.forEach(c => {
            if (c.collected) return;

            const pulse = Math.sin(c.phase) * 0.2 + 1;
            c.phase += 0.05;

            const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius * 3 * pulse);
            glow.addColorStop(0, 'rgba(255, 221, 0, 0.7)');
            glow.addColorStop(0.5, 'rgba(255, 221, 0, 0.2)');
            glow.addColorStop(1, 'rgba(255, 221, 0, 0)');

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius * 3 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffdd00';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffaa';
            ctx.beginPath();
            ctx.arc(c.x - 2, c.y - 2, c.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderInteractables() {
        const ctx = this.ctx;

        this.interactables.forEach(org => {
            const pulse = Math.sin(org.phase) * 0.1 + 1;

            ctx.save();
            ctx.translate(org.x, org.y);

            if (org.type === 'mitochondria') {
                ctx.fillStyle = 'rgba(255, 150, 50, 0.2)';
                ctx.beginPath();
                ctx.ellipse(0, 0, org.radius * 1.5 * pulse, org.radius * pulse, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ff9632';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
                ctx.lineWidth = 1;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-org.radius * 0.8, i * org.radius * 0.3);
                    ctx.lineTo(org.radius * 0.8, i * org.radius * 0.3);
                    ctx.stroke();
                }
            } else if (org.type === 'bacteria') {
                const isChasing = org.state === 'chase';
                const baseColor = isChasing ? 'rgba(255, 30, 30, 0.7)' : 'rgba(255, 80, 80, 0.5)';
                const strokeColor = isChasing ? '#ff1e1e' : '#ff5050';

                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, org.radius * 1.5 * pulse, org.radius * pulse, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-org.radius * 1.5, 0);
                ctx.quadraticCurveTo(-org.radius * 2, -10, -org.radius * 2.5, 0);
                ctx.stroke();

                if (isChasing) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
                    ctx.beginPath();
                    ctx.arc(0, 0, org.chaseRange, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (org.type === 'virus') {
                const isChasing = org.state === 'chase';
                const baseColor = isChasing ? 'rgba(220, 30, 220, 0.7)' : 'rgba(180, 50, 180, 0.5)';

                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.arc(0, 0, org.radius * pulse, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#c832c8';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 100, 255, 0.8)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + org.phase;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * org.radius, Math.sin(angle) * org.radius);
                    ctx.lineTo(Math.cos(angle) * org.radius * 1.8, Math.sin(angle) * org.radius * 1.8);
                    ctx.stroke();
                }

                if (isChasing) {
                    ctx.fillStyle = 'rgba(200, 0, 200, 0.1)';
                    ctx.beginPath();
                    ctx.arc(0, 0, org.chaseRange, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        });
    }

    renderExit() {
        const ctx = this.ctx;
        const portal = this.exitPortal;

        portal.phase += 0.03;

        if (portal.active) {
            const pulse = Math.sin(portal.phase) * 0.2 + 1;

            const outerGlow = ctx.createRadialGradient(portal.x, portal.y, 0, portal.x, portal.y, portal.radius * 2 * pulse);
            outerGlow.addColorStop(0, 'rgba(0, 255, 200, 0.9)');
            outerGlow.addColorStop(0.4, 'rgba(0, 200, 255, 0.4)');
            outerGlow.addColorStop(1, 'rgba(0, 100, 255, 0)');

            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(portal.x, portal.y, portal.radius * 2 * pulse, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(portal.x, portal.y);
                ctx.rotate(portal.phase + i * Math.PI * 2 / 3);

                ctx.strokeStyle = `rgba(0, 255, 200, ${0.8 - i * 0.2})`;
                ctx.lineWidth = 3 - i;
                ctx.beginPath();
                ctx.ellipse(0, 0, portal.radius * (1 - i * 0.2), portal.radius * 0.4 * (1 - i * 0.2), 0, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('出口', portal.x, portal.y + 5);
        } else {
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('收集所有', portal.x, portal.y - 5);
            ctx.fillText('分子激活', portal.x, portal.y + 10);
        }
    }

    renderPlayer() {
        const ctx = this.ctx;
        const p = this.player;

        const glowPulse = Math.sin(p.glowPhase) * 0.3 + 0.7;

        if (this.player.shielded) {
            const shieldGlow = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius * 2.5);
            shieldGlow.addColorStop(0, 'rgba(0, 170, 255, 0.3)');
            shieldGlow.addColorStop(1, 'rgba(0, 100, 255, 0)');

            ctx.fillStyle = shieldGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + Math.sin(p.glowPhase * 2) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        const outerGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        const glowColor = this.player.shrunk ? '0, 255, 170' : '0, 200, 255';
        outerGlow.addColorStop(0, `rgba(${glowColor}, ${0.4 * glowPulse})`);
        outerGlow.addColorStop(0.5, `rgba(${glowColor}, ${0.2 * glowPulse})`);
        outerGlow.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        const bodyGradient = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, p.radius);
        if (this.player.shrunk) {
            bodyGradient.addColorStop(0, '#aaffcc');
            bodyGradient.addColorStop(0.5, '#44ff88');
            bodyGradient.addColorStop(1, '#22aa44');
        } else {
            bodyGradient.addColorStop(0, '#aaddff');
            bodyGradient.addColorStop(0.5, '#44aaff');
            bodyGradient.addColorStop(1, '#2266cc');
        }

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.player.shrunk ? '#88ffaa' : '#88ddff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y - 2, Math.max(2, p.radius * 0.25), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#002244';
        ctx.beginPath();
        ctx.arc(p.x + 4, p.y - 2, Math.max(1, p.radius * 0.15), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x - 3, p.y - 3, Math.max(1.5, p.radius * 0.2), 0, Math.PI * 2);
        ctx.fill();
    }

    renderParticles() {
        const ctx = this.ctx;

        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    showDialog(text) {
        this.isDialogOpen = true;
        document.getElementById('dialog-text').textContent = text;
        document.getElementById('dialog-box').classList.remove('hidden');
    }

    closeDialog() {
        this.isDialogOpen = false;
        document.getElementById('dialog-box').classList.add('hidden');
    }

    toggleAbilitiesPanel() {
        const panel = document.getElementById('abilities-panel');
        const isHidden = panel.classList.contains('hidden');

        if (isHidden) {
            this.isPaused = true;
            this.renderAbilitiesList();
        } else {
            this.isPaused = false;
        }

        panel.classList.toggle('hidden');
    }

    renderAbilitiesList() {
        const list = document.getElementById('abilities-list');
        list.innerHTML = '';

        this.abilities.forEach((ability, i) => {
            const item = document.createElement('div');
            item.className = `ability-item ${ability.unlocked ? '' : 'locked'}`;

            let status = '';
            if (!ability.unlocked) {
                status = '🔒 未解锁';
            } else if (ability.duration > 0) {
                status = `⚡ 激活中 ${ability.duration.toFixed(1)}s`;
            } else if (ability.cooldown > 0) {
                status = `⏳ 冷却 ${ability.cooldown.toFixed(0)}s`;
            } else {
                status = `✅ 按键 ${i + 1} 使用`;
            }

            item.innerHTML = `
                <div class="ability-name">${ability.name} ${ability.unlocked ? '✓' : ''}</div>
                <div class="ability-desc">${ability.desc}</div>
                <div class="ability-status">${status}</div>
            `;
            list.appendChild(item);
        });
    }

    togglePause() {
        if (this.isDialogOpen) return;
        const panel = document.getElementById('pause-panel');
        this.isPaused = !this.isPaused;
        panel.classList.toggle('hidden');
    }

    returnToMenu() {
        this.gameRunning = false;
        this.isPaused = false;
        this.isDialogOpen = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.hideAllPanels();
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');

        this.checkSavedGame();
    }
}

window.addEventListener('load', () => {
    new MicroWorldGame();
});
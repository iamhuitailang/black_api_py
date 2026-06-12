class MicroAdventureGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.currentLevel = 0;
        this.score = 0;
        this.totalScore = 0;
        this.unlockedLevels = 1;
        this.completedLevels = [];
        this.abilities = [];
        this.currentAbility = null;
        this.abilityEnergy = 0;
        this.maxAbilityEnergy = 100;
        
        this.keys = {};
        this.player = null;
        this.entities = [];
        this.particles = [];
        this.dialogQueue = [];
        this.currentDialog = null;
        this.interactTarget = null;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.camera = { x: 0, y: 0 };
        this.worldWidth = 2000;
        this.worldHeight = 1500;
        this.levelObjective = '';
        
        this.initEventListeners();
        this.resizeCanvas();
        this.loadProgress();
        this.showScreen('start-screen');
    }

    initEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        document.getElementById('start-btn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('how-to-play-btn').addEventListener('click', () => this.showScreen('how-to-play-screen'));
        document.getElementById('back-from-help').addEventListener('click', () => this.showScreen('start-screen'));
        document.getElementById('back-to-start').addEventListener('click', () => this.showScreen('start-screen'));
        
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        
        document.getElementById('retry-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.totalScore = 0;
            this.abilities = [];
            this.unlockedLevels = 1;
            this.completedLevels = [];
            this.saveProgress();
            this.showScreen('start-screen');
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        this.keys[e.code] = true;

        if (e.key === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (this.currentDialog) {
                this.advanceDialog();
            } else if (this.gameState === 'playing') {
                this.useAbility();
            }
        }

        if (e.key.toLowerCase() === 'e' && this.gameState === 'playing' && this.interactTarget) {
            this.interactWith(this.interactTarget);
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.code] = false;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'level-select-screen') {
            this.renderLevelSelect();
        }
    }

    showLevelSelect() {
        this.showScreen('level-select-screen');
    }

    renderLevelSelect() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        
        const levels = this.getLevelDefinitions();
        
        levels.forEach((level, index) => {
            const card = document.createElement('div');
            card.className = 'level-card';
            
            const isUnlocked = index < this.unlockedLevels;
            const isCompleted = this.completedLevels.includes(index);
            
            if (!isUnlocked) card.classList.add('locked');
            if (isCompleted) card.classList.add('completed');
            
            card.innerHTML = `
                <div class="level-number">${index + 1}</div>
                <div class="level-title">${level.name}</div>
                <div class="level-desc">${level.description}</div>
                <div class="level-status ${isCompleted ? 'completed' : (isUnlocked ? '' : 'locked')}">
                    ${isCompleted ? '⭐ 已完成' : (isUnlocked ? '🎮 可挑战' : '🔒 未解锁')}
                </div>
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => this.startLevel(index));
            }
            
            grid.appendChild(card);
        });
    }

    getLevelDefinitions() {
        return [
            {
                name: '细胞膜入口',
                description: '穿越磷脂双分子层，进入细胞内部',
                abilityReward: { id: 'osmosis', name: '渗透作用', icon: '💧', desc: '短暂穿过微小缝隙并获得无敌' }
            },
            {
                name: '细胞质迷宫',
                description: '在细胞器之间穿梭，寻找细胞核',
                abilityReward: { id: 'mitochondria', name: '能量爆发', icon: '⚡', desc: '获得短暂加速冲刺，可撞击敌人' }
            },
            {
                name: '细菌战场',
                description: '与免疫细胞合作，消灭入侵细菌',
                abilityReward: { id: 'antibody', name: '抗体标记', icon: '🛡️', desc: '标记敌人使其减速' }
            },
            {
                name: 'DNA解码',
                description: '解开基因密码，找到关键序列',
                abilityReward: { id: 'mutation', name: '基因突变', icon: '🧬', desc: '短暂无敌并提升速度' }
            },
            {
                name: '分子传送门',
                description: '组装返回装置，回到宏观世界',
                abilityReward: null
            }
        ];
    }

    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.score = 0;
        this.abilityEnergy = 0;
        this.entities = [];
        this.particles = [];
        this.dialogQueue = [];
        this.currentDialog = null;
        this.interactTarget = null;
        this.gameState = 'playing';
        
        const levels = this.getLevelDefinitions();
        const level = levels[levelIndex];
        
        document.getElementById('level-name').textContent = `第${levelIndex + 1}关: ${level.name}`;
        document.getElementById('level-subtitle').textContent = level.description;
        
        this.showScreen('game-screen');
        this.updateUI();
        this.updateAbilitySlots();
        this.generateLevel(levelIndex);
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    generateLevel(levelIndex) {
        this.player = {
            x: 100,
            y: this.worldHeight / 2,
            width: 24,
            height: 24,
            vx: 0,
            vy: 0,
            speed: 200,
            health: 100,
            maxHealth: 100,
            invincible: false,
            invincibleTimer: 0,
            dashCooldown: 0,
            color: '#00ffcc'
        };

        switch (levelIndex) {
            case 0: this.generateLevel1(); break;
            case 1: this.generateLevel2(); break;
            case 2: this.generateLevel3(); break;
            case 3: this.generateLevel4(); break;
            case 4: this.generateLevel5(); break;
        }
    }

    generateLevel1() {
        this.worldWidth = 2500;
        this.worldHeight = 800;
        this.levelObjective = '穿过细胞膜，到达细胞核区域';
        document.getElementById('objective-text').textContent = this.levelObjective;
        
        this.addDialog('神秘声音', '欢迎来到微观世界...你现在缩小到了原子级别。');
        this.addDialog('神秘声音', '你需要穿过前方的细胞膜，小心那些磷脂分子！');
        this.addDialog('指导蛋白', '使用 WASD 或方向键移动。按 E 和我对话！');

        for (let i = 0; i < 12; i++) {
            this.entities.push({
                type: 'lipid',
                x: 400 + i * 150,
                y: 100 + (i % 2 === 0 ? 100 : 500),
                width: 50,
                height: 250,
                color: '#ff6b9d',
                wobble: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < 20; i++) {
            this.entities.push({
                type: 'molecule',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 15,
                height: 15,
                color: '#6ab04c',
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                bouncing: true,
                collectible: true,
                value: 10
            });
        }

        this.entities.push({
            type: 'exit',
            x: this.worldWidth - 100,
            y: this.worldHeight / 2,
            width: 60,
            height: 80,
            color: '#ffd700',
            interactive: true,
            name: '核孔通道'
        });

        this.entities.push({
            type: 'npc',
            x: 200,
            y: this.worldHeight / 2 - 50,
            width: 40,
            height: 40,
            color: '#a29bfe',
            interactive: true,
            name: '指导蛋白',
            dialogs: [
                '你好，冒险者！想穿过细胞膜吗？',
                '找到那些绿色的营养分子可以补充能量！',
                '粉色的磷脂双分子层会阻挡你，但它们之间有缝隙！',
                '找到缝隙穿过去吧，祝你好运！'
            ],
            dialogIndex: 0
        });
    }

    generateLevel2() {
        this.worldWidth = 2800;
        this.worldHeight = 1200;
        this.levelObjective = '收集 8 个 ATP 能量，激活线粒体传送门';
        document.getElementById('objective-text').textContent = this.levelObjective;
        
        this.atpCollected = 0;
        this.atpRequired = 8;

        this.addDialog('线粒体', '欢迎来到细胞质！这里充满了各种细胞器。');
        this.addDialog('线粒体', '收集 8 个 ATP 能量分子来激活我！');

        const organelles = [
            { x: 500, y: 200, w: 120, h: 80, color: '#e74c3c', name: '溶酶体' },
            { x: 900, y: 500, w: 100, h: 70, color: '#e67e22', name: '高尔基体' },
            { x: 1400, y: 250, w: 130, h: 90, color: '#9b59b6', name: '内质网' },
            { x: 1800, y: 750, w: 110, h: 75, color: '#e74c3c', name: '溶酶体' },
            { x: 2200, y: 300, w: 100, h: 65, color: '#e67e22', name: '高尔基体' }
        ];

        organelles.forEach(o => {
            this.entities.push({
                type: 'organelle',
                subtype: 'hazard',
                x: o.x,
                y: o.y,
                width: o.w,
                height: o.h,
                color: o.color,
                name: o.name,
                damage: 15
            });
        });

        for (let i = 0; i < 12; i++) {
            this.entities.push({
                type: 'atp',
                x: 300 + Math.random() * (this.worldWidth - 500),
                y: 100 + Math.random() * (this.worldHeight - 200),
                width: 22,
                height: 22,
                color: '#f1c40f',
                collectible: true,
                value: 50,
                atp: true,
                pulse: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < 15; i++) {
            this.entities.push({
                type: 'vesicle',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 25,
                height: 25,
                color: '#74b9ff',
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                bouncing: true
            });
        }

        this.entities.push({
            type: 'exit',
            subtype: 'mitochondria',
            x: this.worldWidth - 150,
            y: this.worldHeight / 2,
            width: 100,
            height: 120,
            color: '#ff6b6b',
            interactive: true,
            name: '线粒体',
            requiresATP: true,
            activated: false
        });

        this.entities.push({
            type: 'npc',
            x: 150,
            y: this.worldHeight / 2,
            width: 50,
            height: 50,
            color: '#55efc4',
            interactive: true,
            name: '核糖体',
            dialogs: [
                '嗨！我是核糖体，负责合成蛋白质的！',
                '那些红色的细胞器很危险，碰到会受伤的。',
                '金色的 ATP 分子是能量源泉，多收集一些吧！',
                '收集够了就去找巨大的线粒体！'
            ],
            dialogIndex: 0
        });
    }

    generateLevel3() {
        this.worldWidth = 2200;
        this.worldHeight = 1400;
        this.levelObjective = '帮助白细胞消灭 10 个入侵细菌';
        document.getElementById('objective-text').textContent = this.levelObjective;
        
        this.bacteriaKilled = 0;
        this.bacteriaRequired = 10;

        this.addDialog('白细胞', '警报！警报！有细菌入侵！');
        this.addDialog('白细胞', '小家伙，帮我消灭这些细菌吧！');
        this.addDialog('系统提示', '撞击红色细菌消灭它们！小心绿色益生菌！');

        for (let i = 0; i < 15; i++) {
            this.entities.push({
                type: 'bacteria',
                subtype: 'harmful',
                x: 400 + Math.random() * (this.worldWidth - 600),
                y: 100 + Math.random() * (this.worldHeight - 200),
                width: 35,
                height: 35,
                color: '#e74c3c',
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                bouncing: true,
                hp: 2,
                harmful: true,
                wobble: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < 6; i++) {
            this.entities.push({
                type: 'bacteria',
                subtype: 'friendly',
                x: 300 + Math.random() * (this.worldWidth - 500),
                y: 150 + Math.random() * (this.worldHeight - 300),
                width: 30,
                height: 30,
                color: '#27ae60',
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                bouncing: true,
                friendly: true,
                wobble: Math.random() * Math.PI * 2
            });
        }

        this.entities.push({
            type: 'npc',
            subtype: 'whitecell',
            x: 150,
            y: this.worldHeight / 2,
            width: 70,
            height: 70,
            color: '#ecf0f1',
            interactive: true,
            name: '白细胞',
            dialogs: [
                '加油！消灭所有红色有害细菌！',
                '小心别撞到绿色的益生菌！',
                '消灭细菌可以获得积分奖励！',
                '用冲刺撞击细菌更有效！'
            ],
            dialogIndex: 0
        });

        for (let i = 0; i < 8; i++) {
            this.entities.push({
                type: 'nutrient',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 18,
                height: 18,
                color: '#fd79a8',
                collectible: true,
                value: 15,
                heal: 10
            });
        }

        this.entities.push({
            type: 'exit',
            x: this.worldWidth - 100,
            y: this.worldHeight / 2,
            width: 70,
            height: 90,
            color: '#ffd700',
            interactive: true,
            name: '血管通道',
            requiresKills: true
        });
    }

    generateLevel4() {
        this.worldWidth = 2000;
        this.worldHeight = 1600;
        this.levelObjective = '按顺序激活 4 个基因序列：A → T → G → C';
        document.getElementById('objective-text').textContent = this.levelObjective;
        
        this.sequenceProgress = 0;
        this.correctSequence = ['A', 'T', 'G', 'C'];

        this.addDialog('细胞核', '这里是细胞核，遗传信息的控制中心。');
        this.addDialog('细胞核', '按正确顺序激活 4 个碱基！');
        this.addDialog('细胞核', '顺序是 A → T → G → C，按错了会重置！');

        const positions = [
            { x: 400, y: 300 },
            { x: 1500, y: 400 },
            { x: 600, y: 1100 },
            { x: 1400, y: 1200 }
        ];

        ['A', 'T', 'G', 'C'].forEach((base, i) => {
            this.entities.push({
                type: 'genebase',
                base: base,
                x: positions[i].x,
                y: positions[i].y,
                width: 60,
                height: 60,
                color: this.getBaseColor(base),
                interactive: true,
                activated: false,
                order: i,
                pulse: 0
            });
        });

        for (let i = 0; i < 18; i++) {
            this.entities.push({
                type: 'chromatin',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 50 + Math.random() * 60,
                height: 50 + Math.random() * 60,
                color: '#6c5ce7',
                hazard: true,
                damage: 8,
                slowPulse: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < 10; i++) {
            this.entities.push({
                type: 'rna',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 22,
                height: 22,
                color: '#00cec9',
                collectible: true,
                value: 30
            });
        }

        this.entities.push({
            type: 'npc',
            x: 100,
            y: this.worldHeight / 2,
            width: 55,
            height: 55,
            color: '#fdcb6e',
            interactive: true,
            name: 'DNA聚合酶',
            dialogs: [
                '我是DNA聚合酶！',
                '记住碱基配对规则：A配T，G配C。',
                '激活顺序很重要！',
                '按错会扣血并重置！'
            ],
            dialogIndex: 0
        });

        this.entities.push({
            type: 'exit',
            x: this.worldWidth - 100,
            y: this.worldHeight / 2,
            width: 70,
            height: 100,
            color: '#ffd700',
            interactive: true,
            name: '核仁出口',
            requiresSequence: true
        });
    }

    generateLevel5() {
        this.worldWidth = 2600;
        this.worldHeight = 1400;
        this.levelObjective = '收集 5 种分子碎片，组装返回传送门';
        document.getElementById('objective-text').textContent = this.levelObjective;
        
        this.fragmentsCollected = 0;
        this.fragmentsRequired = 5;
        this.fragmentTypes = ['碳', '氢', '氧', '氮', '磷'];
        this.fragmentColors = ['#b2bec3', '#ffffff', '#0984e3', '#6c5ce7', '#fd79a8'];
        this.collectedFragments = [];

        this.addDialog('系统', '你到达了最终关卡！');
        this.addDialog('系统', '收集 5 种基本分子碎片！');
        this.addDialog('系统', '碳(C)、氢(H)、氧(O)、氮(N)、磷(P)各一个！');

        this.fragmentTypes.forEach((type, i) => {
            this.entities.push({
                type: 'fragment',
                fragmentType: type,
                symbol: ['C', 'H', 'O', 'N', 'P'][i],
                x: 300 + (i * 450) + Math.random() * 100,
                y: 200 + Math.random() * (this.worldHeight - 400),
                width: 40,
                height: 40,
                color: this.fragmentColors[i],
                collectible: true,
                value: 200,
                isFragment: true,
                fragmentIndex: i,
                pulse: Math.random() * Math.PI * 2
            });
        });

        for (let i = 0; i < 20; i++) {
            this.entities.push({
                type: 'quantum',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 30 + Math.random() * 30,
                height: 30 + Math.random() * 30,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                bouncing: true,
                teleporting: true,
                teleportTimer: Math.random() * 3
            });
        }

        for (let i = 0; i < 10; i++) {
            this.entities.push({
                type: 'glitch',
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                width: 45,
                height: 45,
                color: '#d63031',
                hazard: true,
                damage: 20,
                phase: Math.random() * Math.PI * 2
            });
        }

        this.entities.push({
            type: 'portal',
            x: this.worldWidth - 150,
            y: this.worldHeight / 2,
            width: 120,
            height: 150,
            color: '#00ffcc',
            interactive: true,
            name: '分子传送门',
            requiresFragments: true,
            activated: false,
            rotation: 0
        });

        this.entities.push({
            type: 'npc',
            x: 100,
            y: this.worldHeight / 2,
            width: 60,
            height: 60,
            color: '#ffeaa7',
            interactive: true,
            name: '量子助手',
            dialogs: [
                '这里是分子层面的世界！',
                '那些彩色的量子粒子会瞬移！',
                '收集分子碎片激活传送门！',
                '回家就在眼前了！'
            ],
            dialogIndex: 0
        });
    }

    getBaseColor(base) {
        const colors = { 'A': '#e74c3c', 'T': '#3498db', 'G': '#27ae60', 'C': '#f39c12' };
        return colors[base] || '#fff';
    }

    addDialog(speaker, text) {
        this.dialogQueue.push({ speaker, text });
        if (!this.currentDialog) {
            this.showNextDialog();
        }
    }

    showNextDialog() {
        if (this.dialogQueue.length > 0) {
            this.currentDialog = this.dialogQueue.shift();
            document.getElementById('dialog-box').style.display = 'block';
            document.getElementById('dialog-speaker').textContent = this.currentDialog.speaker;
            document.getElementById('dialog-text').textContent = this.currentDialog.text;
        } else {
            this.currentDialog = null;
            document.getElementById('dialog-box').style.display = 'none';
        }
    }

    advanceDialog() {
        this.showNextDialog();
    }

    gameLoop(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'paused') {
            return;
        }

        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            this.update();
            this.render();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        this.updatePlayer();
        this.updateEntities();
        this.updateParticles();
        this.checkCollisions();
        this.updateCamera();
        this.updateUI();

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    updatePlayer() {
        let dx = 0, dy = 0;

        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        let speed = this.player.speed;
        
        if (this.player.dashCooldown > 0) {
            this.player.dashCooldown -= this.deltaTime;
            speed *= 2.5;
        }

        this.player.vx = dx * speed;
        this.player.vy = dy * speed;

        this.player.x += this.player.vx * this.deltaTime;
        this.player.y += this.player.vy * this.deltaTime;

        this.player.x = Math.max(this.player.width / 2, Math.min(this.worldWidth - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.worldHeight - this.player.height / 2, this.player.y));

        if (this.player.invincible) {
            this.player.invincibleTimer -= this.deltaTime;
            if (this.player.invincibleTimer <= 0) {
                this.player.invincible = false;
            }
        }

        if (this.abilityEnergy < this.maxAbilityEnergy) {
            this.abilityEnergy = Math.min(this.maxAbilityEnergy, this.abilityEnergy + 8 * this.deltaTime);
        }
    }

    updateEntities() {
        this.interactTarget = null;

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];

            if (e.wobble !== undefined) e.wobble += this.deltaTime * 2;
            if (e.pulse !== undefined) e.pulse += this.deltaTime * 3;
            if (e.slowPulse !== undefined) e.slowPulse += this.deltaTime * 1.5;
            if (e.phase !== undefined) e.phase += this.deltaTime * 2;
            if (e.rotation !== undefined) e.rotation += this.deltaTime * 2;

            if (e.vx !== undefined || e.vy !== undefined) {
                e.x += (e.vx || 0) * this.deltaTime;
                e.y += (e.vy || 0) * this.deltaTime;

                if (e.bouncing) {
                    if (e.x < e.width / 2) { e.x = e.width / 2; e.vx = Math.abs(e.vx); }
                    if (e.x > this.worldWidth - e.width / 2) { e.x = this.worldWidth - e.width / 2; e.vx = -Math.abs(e.vx); }
                    if (e.y < e.height / 2) { e.y = e.height / 2; e.vy = Math.abs(e.vy); }
                    if (e.y > this.worldHeight - e.height / 2) { e.y = this.worldHeight - e.height / 2; e.vy = -Math.abs(e.vy); }
                }

                if (e.type === 'quantum' && e.teleporting) {
                    e.teleportTimer -= this.deltaTime;
                    if (e.teleportTimer <= 0) {
                        e.x = Math.random() * this.worldWidth;
                        e.y = Math.random() * this.worldHeight;
                        e.teleportTimer = 1 + Math.random() * 2;
                        this.spawnParticles(e.x, e.y, e.color, 8);
                    }
                }
            }

            if (e.type === 'bacteria') {
                if (e.wobble !== undefined) {
                    e.x += Math.sin(e.wobble) * 0.3;
                    e.y += Math.cos(e.wobble * 0.7) * 0.3;
                }
            }

            if (e.collectible && this.rectCollision(this.player, e)) {
                this.collectItem(e, i);
                continue;
            }

            if (e.interactive) {
                const dist = this.distance(this.player, e);
                if (dist < 80) {
                    this.interactTarget = e;
                }
            }
        }

        const hint = document.getElementById('interaction-hint');
        hint.style.display = this.interactTarget ? 'block' : 'none';
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * this.deltaTime;
            p.y += p.vy * this.deltaTime;
            p.life -= this.deltaTime;
            p.alpha = p.life / p.maxLife;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];

            if (e.damage && this.rectCollision(this.player, e)) {
                if (!this.player.invincible) {
                    this.player.health -= e.damage;
                    this.player.invincible = true;
                    this.player.invincibleTimer = 1;
                    this.spawnParticles(this.player.x, this.player.y, '#ff4757', 15);
                }
            }

            if (e.hazard && this.rectCollision(this.player, e)) {
                if (!this.player.invincible) {
                    this.player.health -= e.damage || 10;
                    this.player.invincible = true;
                    this.player.invincibleTimer = 0.8;
                    this.spawnParticles(this.player.x, this.player.y, '#ff4757', 10);
                }
            }

            if (e.type === 'bacteria' && e.harmful && this.rectCollision(this.player, e)) {
                if (this.player.dashCooldown > 0) {
                    e.hp -= 1;
                    this.spawnParticles(e.x, e.y, '#e74c3c', 10);
                    if (e.hp <= 0) {
                        this.entities.splice(i, 1);
                        this.bacteriaKilled++;
                        this.score += 100;
                        this.spawnParticles(e.x, e.y, '#ffd700', 20);
                        
                        if (this.bacteriaKilled >= this.bacteriaRequired) {
                            this.addDialog('系统', '所有有害细菌已消灭！前往出口吧！');
                        }
                    }
                } else if (!this.player.invincible) {
                    this.player.health -= 10;
                    this.player.invincible = true;
                    this.player.invincibleTimer = 0.8;
                    this.spawnParticles(this.player.x, this.player.y, '#ff4757', 10);
                }
            }

            if (e.type === 'bacteria' && e.friendly && this.rectCollision(this.player, e)) {
                if (!this.player.invincible && this.player.dashCooldown > 0) {
                    this.player.health -= 20;
                    this.player.invincible = true;
                    this.player.invincibleTimer = 1;
                    this.addDialog('警告', '不要攻击有益细菌！');
                    this.spawnParticles(this.player.x, this.player.y, '#ff4757', 15);
                }
            }
        }
    }

    collectItem(item, index) {
        this.score += item.value || 10;
        this.abilityEnergy = Math.min(this.maxAbilityEnergy, this.abilityEnergy + 10);
        this.spawnParticles(item.x, item.y, item.color, 12);

        if (item.heal) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + item.heal);
        }

        if (item.atp) {
            this.atpCollected = (this.atpCollected || 0) + 1;
            this.addDialog('系统', `获得 ATP 能量！(${this.atpCollected}/${this.atpRequired})`);
            if (this.atpCollected >= this.atpRequired) {
                this.addDialog('系统', 'ATP 收集完毕！线粒体已激活！');
                const mito = this.entities.find(e => e.subtype === 'mitochondria');
                if (mito) mito.activated = true;
            }
        }

        if (item.isFragment) {
            if (!this.collectedFragments.includes(item.fragmentIndex)) {
                this.collectedFragments.push(item.fragmentIndex);
                this.fragmentsCollected++;
                this.addDialog('系统', `收集到 ${item.fragmentType}(${item.symbol}) 原子！(${this.fragmentsCollected}/${this.fragmentsRequired})`);
                
                if (this.fragmentsCollected >= this.fragmentsRequired) {
                    this.addDialog('系统', '所有分子碎片已收集！传送门已激活！');
                    const portal = this.entities.find(e => e.type === 'portal');
                    if (portal) portal.activated = true;
                }
            }
        }

        this.entities.splice(index, 1);
    }

    interactWith(target) {
        if (target.type === 'npc') {
            const dialog = target.dialogs[target.dialogIndex % target.dialogs.length];
            this.addDialog(target.name, dialog);
            target.dialogIndex++;
        }

        if (target.type === 'genebase' && !target.activated) {
            const expectedBase = this.correctSequence[this.sequenceProgress];
            if (target.base === expectedBase) {
                target.activated = true;
                this.sequenceProgress++;
                this.score += 150;
                this.spawnParticles(target.x, target.y, target.color, 25);
                this.addDialog('系统', `正确！激活了 ${target.base} 碱基！(${this.sequenceProgress}/4)`);
                
                if (this.sequenceProgress >= 4) {
                    this.addDialog('系统', '基因序列解码完成！出口已开启！');
                }
            } else {
                this.sequenceProgress = 0;
                this.entities.filter(e => e.type === 'genebase').forEach(e => e.activated = false);
                this.spawnParticles(this.player.x, this.player.y, '#ff4757', 20);
                this.player.health -= 15;
                this.addDialog('系统', '顺序错误！序列已重置！');
            }
        }

        if (target.type === 'exit') {
            if (target.subtype === 'mitochondria' && !target.activated) {
                this.addDialog('线粒体', `还需要 ${this.atpRequired - (this.atpCollected || 0)} 个 ATP！`);
                return;
            }
            if (target.requiresKills && this.bacteriaKilled < this.bacteriaRequired) {
                this.addDialog('系统', `还需要消灭 ${this.bacteriaRequired - this.bacteriaKilled} 个细菌！`);
                return;
            }
            if (target.requiresSequence && this.sequenceProgress < 4) {
                this.addDialog('系统', `还需要激活 ${4 - this.sequenceProgress} 个基因碱基！`);
                return;
            }
            this.completeLevel();
        }

        if (target.type === 'portal') {
            if (!target.activated) {
                this.addDialog('传送门', `还需要 ${this.fragmentsRequired - this.fragmentsCollected} 种分子碎片！`);
                return;
            }
            this.completeLevel();
        }
    }

    useAbility() {
        if (!this.currentAbility || this.abilityEnergy < 50) {
            return;
        }

        this.abilityEnergy -= 50;

        switch (this.currentAbility.id) {
            case 'osmosis':
                this.player.invincible = true;
                this.player.invincibleTimer = 2;
                this.spawnParticles(this.player.x, this.player.y, '#74b9ff', 20);
                break;
            case 'mitochondria':
                this.player.dashCooldown = 1.5;
                this.spawnParticles(this.player.x, this.player.y, '#f39c12', 25);
                break;
            case 'antibody':
                this.entities.filter(e => e.type === 'bacteria' && e.harmful).forEach(e => {
                    e.vx *= 0.2;
                    e.vy *= 0.2;
                    e.color = '#95a5a6';
                    this.spawnParticles(e.x, e.y, '#3498db', 10);
                });
                this.addDialog('系统', '敌人被抗体标记并减速！');
                break;
            case 'mutation':
                this.player.invincible = true;
                this.player.invincibleTimer = 3;
                const origSpeed = this.player.speed;
                this.player.speed = 320;
                setTimeout(() => { this.player.speed = origSpeed; }, 3000);
                this.spawnParticles(this.player.x, this.player.y, '#e056fd', 30);
                break;
        }

        this.updateAbilitySlots();
    }

    updateCamera() {
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.08;
        this.camera.y += (targetY - this.camera.y) * 0.08;
        
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y));
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health-fill').style.width = `${Math.max(0, (this.player.health / this.player.maxHealth) * 100)}%`;
        document.getElementById('ability-fill').style.width = `${(this.abilityEnergy / this.maxAbilityEnergy) * 100}%`;
    }

    updateAbilitySlots() {
        const slotsContainer = document.getElementById('ability-slots');
        slotsContainer.innerHTML = '';

        if (this.abilities.length === 0) {
            const slot = document.createElement('div');
            slot.className = 'ability-slot';
            slot.innerHTML = `
                <span class="ability-icon">?</span>
                <span class="ability-name">通关获得</span>
            `;
            slotsContainer.appendChild(slot);
        } else {
            this.abilities.forEach(ability => {
                const slot = document.createElement('div');
                slot.className = 'ability-slot';
                if (this.currentAbility && this.currentAbility.id === ability.id) {
                    slot.classList.add('active');
                }
                if (this.abilityEnergy >= 50) {
                    slot.classList.add('ready');
                }
                slot.innerHTML = `
                    <span class="ability-icon">${ability.icon}</span>
                    <span class="ability-name">${ability.name}</span>
                `;
                slot.title = `${ability.name}: ${ability.desc}`;
                slot.addEventListener('click', () => {
                    this.currentAbility = ability;
                    this.updateAbilitySlots();
                });
                slotsContainer.appendChild(slot);
            });
            
            if (!this.currentAbility && this.abilities.length > 0) {
                this.currentAbility = this.abilities[0];
                this.updateAbilitySlots();
            }
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();

        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        this.drawBoundary();

        this.entities.forEach(e => this.drawEntity(e));

        this.particles.forEach(p => this.drawParticle(p));

        this.drawPlayer();

        ctx.restore();

        this.drawMinimap();
    }

    drawBoundary() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 10]);
        ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
        ctx.setLineDash([]);
    }

    drawBackground() {
        const ctx = this.ctx;
        
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(1, '#020208');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 40; i++) {
            const x = ((i * 137 + this.camera.x * 0.1) % this.canvas.width + this.canvas.width) % this.canvas.width;
            const y = ((i * 97 + this.camera.y * 0.1) % this.canvas.height + this.canvas.height) % this.canvas.height;
            const size = 2 + (i % 4);
            ctx.fillStyle = `hsl(${(i * 47) % 360}, 70%, 60%)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawEntity(e) {
        const ctx = this.ctx;
        const wobbleOffset = e.wobble ? Math.sin(e.wobble) * 3 : 0;
        const pulseScale = e.pulse ? 1 + Math.sin(e.pulse) * 0.15 : 1;

        ctx.save();
        ctx.translate(e.x + wobbleOffset, e.y);

        if (e.type === 'lipid') {
            const grad = ctx.createLinearGradient(0, -e.height / 2, 0, e.height / 2);
            grad.addColorStop(0, '#ff6b9d');
            grad.addColorStop(0.5, '#c44569');
            grad.addColorStop(1, '#ff6b9d');
            ctx.fillStyle = grad;
            ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.beginPath();
                ctx.arc(0, -e.height/2 + 25 + i * (e.height / 5), 7, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (e.type === 'molecule' || e.type === 'rna' || e.type === 'nutrient') {
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (e.type === 'atp') {
            ctx.save();
            ctx.scale(pulseScale, pulseScale);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.width);
            grad.addColorStop(0, '#fff700');
            grad.addColorStop(0.5, '#f1c40f');
            grad.addColorStop(1, '#e67e22');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ATP', 0, 0);
            ctx.restore();
        } else if (e.type === 'organelle') {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(e.width, e.height) / 2);
            grad.addColorStop(0, this.lightenColor(e.color, 0.3));
            grad.addColorStop(1, this.darkenColor(e.color, 0.4));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(e.name, 0, e.height / 2 + 18);
        } else if (e.type === 'vesicle') {
            ctx.fillStyle = e.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (e.type === 'bacteria') {
            ctx.save();
            if (e.wobble) ctx.rotate(Math.sin(e.wobble) * 0.2);
            const grad = ctx.createRadialGradient(-5, -5, 0, 0, 0, e.width / 2);
            grad.addColorStop(0, this.lightenColor(e.color, 0.3));
            grad.addColorStop(1, e.color);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width / 2, e.height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.darkenColor(e.color, 0.3);
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * e.width / 2, Math.sin(angle) * e.height / 2.5);
                ctx.lineTo(Math.cos(angle) * (e.width / 2 + 8), Math.sin(angle) * (e.height / 2.5 + 8));
                ctx.stroke();
            }
            if (e.friendly) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', 0, 0);
            } else if (e.hp !== undefined) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                for (let i = 0; i < e.hp; i++) {
                    ctx.fillText('♥', -6 + i * 10, -e.height / 3 - 2);
                }
            }
            ctx.restore();
        } else if (e.type === 'genebase') {
            ctx.save();
            ctx.scale(pulseScale, pulseScale);
            if (e.activated) {
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 30;
            }
            ctx.fillStyle = e.activated ? this.lightenColor(e.color, 0.3) : e.color;
            this.roundRect(ctx, -e.width / 2, -e.height / 2, e.width, e.height, 12);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.base, 0, 0);
            ctx.restore();
        } else if (e.type === 'chromatin') {
            ctx.save();
            ctx.globalAlpha = 0.4 + Math.sin(e.slowPulse) * 0.2;
            ctx.fillStyle = e.color;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + e.slowPulse;
                const dist = 12 + Math.sin(e.slowPulse + i) * 8;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, e.width / 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (e.type === 'fragment') {
            ctx.save();
            ctx.scale(pulseScale, pulseScale);
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * e.width / 2;
                const y = Math.sin(angle) * e.height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = e.color;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.symbol, 0, 0);
            ctx.restore();
        } else if (e.type === 'quantum') {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        } else if (e.type === 'glitch') {
            ctx.save();
            const glitchOffset = Math.sin(e.phase) * 5;
            ctx.fillStyle = e.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(-e.width / 2 + glitchOffset, -e.height / 2, e.width, e.height);
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(-e.width / 2 - glitchOffset, -e.height / 2 + glitchOffset, e.width / 2, e.height / 2);
            ctx.restore();
        } else if (e.type === 'portal') {
            ctx.save();
            ctx.rotate(e.rotation);
            if (e.activated) {
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.width);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, '#00ffcc');
                grad.addColorStop(0.6, '#0099ff');
                grad.addColorStop(1, '#000033');
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = '#444';
            }
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            if (e.activated) {
                for (let i = 0; i < 6; i++) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - i * 0.1})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, e.width / 2 - i * 10, e.height / 2 - i * 12, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.restore();
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(e.name, 0, e.height / 2 + 22);
        } else if (e.type === 'exit' || e.type === 'npc') {
            ctx.save();
            if (e.interactive) {
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 15;
            }
            const grad = ctx.createRadialGradient(-5, -5, 0, 0, 0, e.width / 2);
            grad.addColorStop(0, this.lightenColor(e.color, 0.4));
            grad.addColorStop(1, e.color);
            ctx.fillStyle = grad;
            if (e.subtype === 'mitochondria') {
                ctx.beginPath();
                ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = this.darkenColor(e.color, 0.3);
                ctx.lineWidth = 2;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-e.width / 3, i * 15);
                    ctx.lineTo(e.width / 3, i * 15);
                    ctx.stroke();
                }
            } else if (e.subtype === 'whitecell') {
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r = e.width / 2 + Math.sin(Date.now() / 400 + i) * 6;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            if (e.name) {
                ctx.fillStyle = '#fff';
                ctx.font = '13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(e.name, 0, e.height / 2 + 20);
            }
        }

        ctx.restore();
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        if (p.dashCooldown > 0) {
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 25;
        } else {
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 15;
        }

        const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, p.width);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(1, this.darkenColor(p.color, 0.4));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 3, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    drawParticle(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawMinimap() {
        const ctx = this.ctx;
        const mapWidth = 160;
        const mapHeight = 100;
        const padding = 15;
        const x = this.canvas.width - mapWidth - padding;
        const y = this.canvas.height - mapHeight - padding - 110;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, mapWidth, mapHeight);
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, mapWidth, mapHeight);

        const scaleX = mapWidth / this.worldWidth;
        const scaleY = mapHeight / this.worldHeight;

        this.entities.forEach(e => {
            if (e.type === 'exit' || e.type === 'portal' || e.type === 'npc') {
                ctx.fillStyle = e.color;
                ctx.fillRect(x + e.x * scaleX - 2, y + e.y * scaleY - 2, 5, 5);
            } else if (e.collectible) {
                ctx.fillStyle = e.color;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(x + e.x * scaleX, y + e.y * scaleY, 2, 2);
                ctx.globalAlpha = 1;
            }
        });

        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(x + this.player.x * scaleX, y + this.player.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 2 + Math.random() * 4,
                color: color,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                alpha: 1
            });
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    rectCollision(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }

    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pause-menu').style.display = 'flex';
    }

    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pause-menu').style.display = 'none';
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    restartLevel() {
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over-screen').classList.remove('active');
        this.startLevel(this.currentLevel);
    }

    quitToMenu() {
        this.gameState = 'menu';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over-screen').classList.remove('active');
        this.showScreen('level-select-screen');
    }

    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('game-over-title').textContent = '💀 生命值耗尽';
        document.getElementById('game-over-text').textContent = '你在微观世界中消散了...再试一次吧！';
        this.showScreen('game-over-screen');
    }

    completeLevel() {
        this.gameState = 'levelcomplete';
        this.totalScore += this.score;

        const levels = this.getLevelDefinitions();
        const level = levels[this.currentLevel];

        if (!this.completedLevels.includes(this.currentLevel)) {
            this.completedLevels.push(this.currentLevel);
        }
        if (this.currentLevel + 1 < levels.length) {
            this.unlockedLevels = Math.max(this.unlockedLevels, this.currentLevel + 2);
        }
        this.saveProgress();

        const statsDiv = document.getElementById('level-stats');
        statsDiv.innerHTML = `
            <p>本关得分: <strong>${this.score}</strong></p>
            <p>累计得分: <strong>${this.totalScore}</strong></p>
        `;

        const newAbilityDiv = document.getElementById('new-ability');
        const abilityInfoDiv = document.getElementById('ability-info');
        
        if (level.abilityReward && !this.abilities.find(a => a.id === level.abilityReward.id)) {
            this.abilities.push(level.abilityReward);
            this.currentAbility = level.abilityReward;
            newAbilityDiv.style.display = 'block';
            abilityInfoDiv.innerHTML = `
                <p style="font-size:1.5em;">${level.abilityReward.icon} <strong>${level.abilityReward.name}</strong></p>
                <p style="color:#aaa;margin-top:10px;">${level.abilityReward.desc}</p>
                <p style="color:#888;margin-top:10px;font-size:0.9em;">按空格键使用能力（消耗50能量）</p>
            `;
        } else {
            newAbilityDiv.style.display = 'none';
        }

        const nextBtn = document.getElementById('next-level-btn');
        if (this.currentLevel >= levels.length - 1) {
            nextBtn.textContent = '🎉 通关结算';
        } else {
            nextBtn.textContent = '下一关';
        }

        document.getElementById('level-complete').style.display = 'flex';
    }

    nextLevel() {
        document.getElementById('level-complete').style.display = 'none';
        this.updateAbilitySlots();

        const levels = this.getLevelDefinitions();
        if (this.currentLevel >= levels.length - 1) {
            this.showVictory();
        } else {
            this.startLevel(this.currentLevel + 1);
        }
    }

    showVictory() {
        this.gameState = 'victory';
        document.getElementById('final-score').textContent = this.totalScore;
        
        const learnedList = document.getElementById('learned-abilities');
        learnedList.innerHTML = '';
        this.abilities.forEach(ability => {
            const li = document.createElement('li');
            li.innerHTML = `${ability.icon} <strong>${ability.name}</strong> - ${ability.desc}`;
            learnedList.appendChild(li);
        });

        this.showScreen('victory-screen');
    }

    saveProgress() {
        try {
            const data = {
                unlockedLevels: this.unlockedLevels,
                completedLevels: this.completedLevels,
                totalScore: this.totalScore,
                abilities: this.abilities
            };
            localStorage.setItem('microAdventureSave', JSON.stringify(data));
        } catch (e) {
        }
    }

    loadProgress() {
        try {
            const data = localStorage.getItem('microAdventureSave');
            if (data) {
                const parsed = JSON.parse(data);
                this.unlockedLevels = parsed.unlockedLevels || 1;
                this.completedLevels = parsed.completedLevels || [];
                this.totalScore = parsed.totalScore || 0;
                this.abilities = parsed.abilities || [];
                if (this.abilities.length > 0) {
                    this.currentAbility = this.abilities[0];
                }
            }
        } catch (e) {
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MicroAdventureGame();
});
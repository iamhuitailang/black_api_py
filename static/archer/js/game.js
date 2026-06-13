(function() {
    'use strict';

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const GRAVITY = 0.25;
    const MAX_CHARGE = 100;
    const CHARGE_SPEED = 0.8;
    const MIN_ARROW_SPEED = 3;
    const MAX_ARROW_SPEED = 14;

    const CASTLE_X = W / 2;
    const CASTLE_WIDTH = 120;
    const CASTLE_HEIGHT = 180;
    const CASTLE_TOP_Y = 100;
    const ARCHER_Y = CASTLE_TOP_Y + 20;
    const GROUND_Y = H - 60;

    const ARROW_LEVELS = [
        { name: '普通箭', cost: 0, type: 'normal' },
        { name: '火箭', cost: 100, type: 'fire', burnDamage: 5, burnDuration: 3000 },
        { name: '冰箭', cost: 200, type: 'ice', slowFactor: 0.5, slowDuration: 2000 }
    ];

    const WALL_LEVELS = [
        { name: '基础城墙', cost: 0, maxHp: 100 },
        { name: '加固城墙', cost: 150, maxHp: 150 },
        { name: '钢铁城墙', cost: 300, maxHp: 200 }
    ];

    const ENEMY_TYPES = {
        goblin: {
            name: '哥布林',
            hp: 15,
            speed: 2,
            color: '#2ecc71',
            size: { w: 20, h: 28 },
            gold: 5,
            score: 10,
            behavior: 'climb',
            climbTime: 5000,
            climbDamage: 5
        },
        skeleton: {
            name: '骷髅兵',
            hp: 25,
            speed: 1.5,
            color: '#ecf0f1',
            size: { w: 22, h: 36 },
            gold: 10,
            score: 20,
            behavior: 'shoot',
            shootInterval: 3000,
            shootDamage: 5,
            shootRange: 350
        },
        orc: {
            name: '兽人',
            hp: 50,
            speed: 1,
            color: '#7f8c8d',
            size: { w: 32, h: 44 },
            gold: 20,
            score: 40,
            behavior: 'smash',
            smashInterval: 2000,
            smashDamage: 10
        },
        assassin: {
            name: '暗影刺客',
            hp: 20,
            speed: 3,
            color: '#9b59b6',
            size: { w: 22, h: 34 },
            gold: 15,
            score: 30,
            behavior: 'stealth',
            stealthInterval: 4000,
            stealthDuration: 2000,
            stealthOffset: 40
        },
        boss: {
            name: '攻城锤Boss',
            hp: 200,
            speed: 0.8,
            color: '#8B4513',
            size: { w: 60, h: 70 },
            gold: 200,
            score: 500,
            behavior: 'boss_smash',
            smashInterval: 1000,
            smashDamage: 15
        }
    };

    let gameState = {
        running: false,
        paused: false,
        wave: 0,
        maxWave: 20,
        gold: 0,
        score: 0,
        castleHp: 100,
        castleMaxHp: 100,
        arrowLevel: 0,
        wallLevel: 0,
        enemies: [],
        arrows: [],
        particles: [],
        enemyArrows: [],
        stuckArrows: [],
        mouse: { x: W / 2, y: H / 2, down: false },
        charge: 0,
        charging: false,
        archerFrame: 0,
        restTimer: 0,
        resting: false,
        waveEnemiesLeft: 0,
        waveSpawnTimer: 0,
        waveSpawnQueue: [],
        playerName: '弓箭手',
        skyProgress: 0,
        gameOver: false,
        victory: false
    };

    const SAVE_KEY = 'archer_game_save_v1';

    function saveGame() {
        try {
            const saveData = {
                wave: gameState.wave,
                gold: gameState.gold,
                score: gameState.score,
                castleHp: gameState.castleHp,
                castleMaxHp: gameState.castleMaxHp,
                arrowLevel: gameState.arrowLevel,
                wallLevel: gameState.wallLevel,
                playerName: gameState.playerName,
                resting: gameState.resting,
                restTimer: gameState.restTimer,
                skyProgress: gameState.skyProgress
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
        }
    }

    function loadGame() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) return false;
            const saveData = JSON.parse(data);
            if (!saveData || saveData.wave === undefined || saveData.wave === null) return false;

            gameState.wave = saveData.wave !== undefined ? saveData.wave : 0;
            gameState.gold = saveData.gold !== undefined ? saveData.gold : 0;
            gameState.score = saveData.score !== undefined ? saveData.score : 0;
            gameState.castleHp = saveData.castleHp !== undefined ? saveData.castleHp : 100;
            gameState.castleMaxHp = saveData.castleMaxHp !== undefined ? saveData.castleMaxHp : 100;
            gameState.arrowLevel = saveData.arrowLevel !== undefined ? saveData.arrowLevel : 0;
            gameState.wallLevel = saveData.wallLevel !== undefined ? saveData.wallLevel : 0;
            gameState.playerName = saveData.playerName || '弓箭手';
            gameState.skyProgress = saveData.skyProgress !== undefined ? saveData.skyProgress : 0;
            gameState.resting = saveData.resting === true;
            gameState.enemies = [];
            gameState.arrows = [];
            gameState.particles = [];
            gameState.enemyArrows = [];
            gameState.stuckArrows = [];
            gameState.gameOver = false;
            gameState.victory = false;
            gameState.running = true;
            gameState.charge = 0;
            gameState.charging = false;
            gameState.waveEnemiesLeft = 0;
            gameState.waveSpawnTimer = 0;
            gameState.waveSpawnQueue = [];
            gameState.restTimer = saveData.restTimer !== undefined ? saveData.restTimer : 0;
            return true;
        } catch (e) {
            return false;
        }
    }

    function hasSavedGame() {
        try {
            return !!localStorage.getItem(SAVE_KEY);
        } catch (e) {
            return false;
        }
    }

    function clearSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {
        }
    }

    function initGame() {
        gameState = {
            running: false,
            paused: false,
            wave: 0,
            maxWave: 20,
            gold: 0,
            score: 0,
            castleHp: 100,
            castleMaxHp: 100,
            arrowLevel: 0,
            wallLevel: 0,
            enemies: [],
            arrows: [],
            particles: [],
            enemyArrows: [],
            stuckArrows: [],
            mouse: { x: W / 2, y: H / 2, down: false },
            charge: 0,
            charging: false,
            archerFrame: 0,
            restTimer: 0,
            resting: false,
            waveEnemiesLeft: 0,
            waveSpawnTimer: 0,
            waveSpawnQueue: [],
            playerName: document.getElementById('player-name').value || '弓箭手',
            skyProgress: 0,
            gameOver: false,
            victory: false
        };
        updateUI();
    }

    function showStartScreen() {
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.remove('hidden');

        const subtitle = startScreen.querySelector('.subtitle');

        const existingStartBtn = document.getElementById('start-btn');
        const existingContinueBtn = document.getElementById('continue-btn');
        let mainBtn = existingStartBtn || existingContinueBtn;

        const oldNewGameBtn = document.getElementById('new-game-btn');
        if (oldNewGameBtn) oldNewGameBtn.remove();
        const oldDeleteBtn = document.getElementById('delete-save-btn');
        if (oldDeleteBtn) oldDeleteBtn.remove();

        if (hasSavedGame()) {
            try {
                const saveData = JSON.parse(localStorage.getItem(SAVE_KEY));
                subtitle.textContent = `上次进度：第 ${saveData.wave} 波 | 金币 ${saveData.gold} | 分数 ${saveData.score}`;
            } catch (e) {
                subtitle.textContent = '发现存档数据';
            }

            if (mainBtn) {
                mainBtn.id = 'continue-btn';
                mainBtn.textContent = '继续游戏';
            }

            const btnGroup = mainBtn.parentElement;

            const newGameBtn = document.createElement('button');
            newGameBtn.id = 'new-game-btn';
            newGameBtn.className = 'btn btn-secondary';
            newGameBtn.textContent = '新游戏（覆盖存档）';
            btnGroup.appendChild(newGameBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-save-btn';
            deleteBtn.className = 'btn btn-secondary';
            deleteBtn.textContent = '删除存档';
            btnGroup.appendChild(deleteBtn);
        } else {
            subtitle.textContent = '守卫你的城堡，击退敌人的进攻！';

            if (mainBtn) {
                mainBtn.id = 'start-btn';
                mainBtn.textContent = '开始游戏';
            }
        }
    }

    function startNewGame() {
        initGame();
        gameState.running = true;
        document.getElementById('start-screen').classList.add('hidden');
        startNextWave();
        requestAnimationFrame(gameLoop);
        saveGame();
    }

    function startGame() {
        if (hasSavedGame()) {
            const loaded = loadGame();
            if (loaded && gameState.wave > 0) {
                document.getElementById('player-name').value = gameState.playerName;
                document.getElementById('start-screen').classList.add('hidden');
                updateUI();
                if (gameState.resting && gameState.wave % 5 === 0 && gameState.wave < gameState.maxWave) {
                    document.getElementById('upgrade-screen').classList.remove('hidden');
                    updateUpgradeUI();
                    document.getElementById('rest-timer').textContent = Math.max(1, Math.ceil(gameState.restTimer));
                    startRestCountdown();
                } else {
                    gameState.resting = false;
                    generateWaveEnemies(gameState.wave);
                    announceWave(gameState.wave);
                }
                requestAnimationFrame(gameLoop);
                return;
            }
        }
        startNewGame();
    }

    function startNextWave() {
        gameState.wave++;
        gameState.skyProgress = (gameState.wave - 1) / (gameState.maxWave - 1);
        gameState.resting = false;
        document.getElementById('upgrade-screen').classList.add('hidden');
        announceWave(gameState.wave);
        generateWaveEnemies(gameState.wave);
        saveGame();
    }

    function generateWaveEnemies(wave) {
        gameState.waveSpawnQueue = [];
        let enemies = [];

        if (wave <= 5) {
            const count = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                enemies.push('goblin');
            }
        } else if (wave <= 10) {
            const count = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                if (Math.random() < 0.6) {
                    enemies.push('goblin');
                } else {
                    enemies.push('skeleton');
                }
            }
        } else if (wave <= 15) {
            const count = 6 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                const r = Math.random();
                if (r < 0.4) {
                    enemies.push('goblin');
                } else if (r < 0.75) {
                    enemies.push('skeleton');
                } else {
                    enemies.push('orc');
                }
            }
        } else if (wave <= 19) {
            const count = (8 + Math.floor(Math.random() * 5)) * 2;
            for (let i = 0; i < count; i++) {
                const r = Math.random();
                if (r < 0.3) {
                    enemies.push('goblin');
                } else if (r < 0.55) {
                    enemies.push('skeleton');
                } else if (r < 0.75) {
                    enemies.push('orc');
                } else {
                    enemies.push('assassin');
                }
            }
        } else {
            enemies.push('boss');
            for (let i = 0; i < 6; i++) {
                enemies.push('goblin');
            }
            for (let i = 0; i < 4; i++) {
                enemies.push('skeleton');
            }
        }

        enemies.sort(() => Math.random() - 0.5);
        gameState.waveSpawnQueue = enemies;
        gameState.waveEnemiesLeft = enemies.length;
        gameState.waveSpawnTimer = 30;
    }

    function spawnEnemy(type) {
        const config = ENEMY_TYPES[type];
        const side = Math.random() < 0.5 ? 'left' : 'right';
        let x;

        if (side === 'left') {
            x = -config.size.w - Math.random() * 50;
        } else {
            x = W + Math.random() * 50;
        }

        const direction = side === 'left' ? 1 : -1;

        const enemy = {
            type: type,
            x: x,
            y: GROUND_Y - config.size.h,
            vx: config.speed * direction,
            vy: 0,
            hp: config.hp,
            maxHp: config.hp,
            width: config.size.w,
            height: config.size.h,
            color: config.color,
            gold: config.gold,
            score: config.score,
            direction: direction,
            state: 'walking',
            behavior: config.behavior,
            actionTimer: 0,
            actionCooldown: 0,
            hitFlash: 0,
            hitKnockback: 0,
            burnTimer: 0,
            burnDamage: 0,
            slowTimer: 0,
            slowFactor: 1,
            climbProgress: 0,
            climbTime: config.climbTime || 5000,
            climbDamage: config.climbDamage || 5,
            climbAnimFrame: 0,
            climbAnimTimer: 0,
            shootInterval: config.shootInterval || 3000,
            shootDamage: config.shootDamage || 5,
            shootRange: config.shootRange || 300,
            smashInterval: config.smashInterval || 2000,
            smashDamage: config.smashDamage || 10,
            stealthTimer: 0,
            stealthCooldown: config.stealthInterval || 4000,
            stealthDuration: config.stealthDuration || 2000,
            stealthOffset: config.stealthOffset || 40,
            isStealthed: false,
            animFrame: 0,
            animTimer: 0,
            side: side,
            dead: false
        };

        gameState.enemies.push(enemy);
    }

    function announceWave(wave) {
        const announceEl = document.getElementById('wave-announce');
        const textEl = document.getElementById('wave-announce-text');
        if (wave === 20) {
            textEl.textContent = '最终波 - Boss攻城！';
        } else {
            textEl.textContent = `第 ${wave} 波`;
        }
        announceEl.classList.remove('hidden');
        const span = announceEl.querySelector('span');
        span.style.animation = 'none';
        span.offsetHeight;
        span.style.animation = 'waveAnnounce 2s ease-out forwards';
        setTimeout(() => {
            announceEl.classList.add('hidden');
        }, 2000);
    }

    function shootArrow() {
        const chargePercent = gameState.charge / MAX_CHARGE;
        const speed = MIN_ARROW_SPEED + (MAX_ARROW_SPEED - MIN_ARROW_SPEED) * chargePercent;
        const damage = Math.round(chargePercent * 20);

        const archerX = CASTLE_X;
        const archerY = ARCHER_Y;

        const dx = gameState.mouse.x - archerX;
        const dy = gameState.mouse.y - archerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) return;

        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        const arrowLevel = ARROW_LEVELS[gameState.arrowLevel];

        const arrow = {
            x: archerX,
            y: archerY,
            vx: vx,
            vy: vy,
            damage: Math.max(1, damage),
            type: arrowLevel.type,
            burnDamage: arrowLevel.burnDamage || 0,
            burnDuration: arrowLevel.burnDuration || 0,
            slowFactor: arrowLevel.slowFactor || 1,
            slowDuration: arrowLevel.slowDuration || 0,
            active: true,
            trail: [],
            stuck: false,
            stuckTimer: 0,
            hitEnemy: null
        };

        gameState.arrows.push(arrow);
        gameState.charge = 0;
        gameState.charging = false;
        gameState.archerFrame = 2;
        setTimeout(() => {
            gameState.archerFrame = 0;
        }, 150);
    }

    function updateArrows(deltaTime) {
        for (let i = gameState.arrows.length - 1; i >= 0; i--) {
            const arrow = gameState.arrows[i];

            if (arrow.stuck) {
                arrow.stuckTimer++;
                if (arrow.stuckTimer > 30) {
                    gameState.arrows.splice(i, 1);
                }
                continue;
            }

            arrow.trail.push({ x: arrow.x, y: arrow.y });
            if (arrow.trail.length > 8) {
                arrow.trail.shift();
            }

            arrow.vy += GRAVITY;
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;

            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (enemy.dead) continue;

                if (checkArrowHit(arrow, enemy)) {
                    hitEnemy(enemy, arrow);
                    arrow.stuck = true;
                    arrow.hitEnemy = enemy;
                    arrow.stuckTimer = 0;
                    break;
                }
            }

            if (!arrow.stuck && arrow.y > GROUND_Y) {
                arrow.stuck = true;
                arrow.y = GROUND_Y;
                arrow.stuckTimer = 0;
            }

            if (arrow.x < -50 || arrow.x > W + 50 || arrow.y > H + 50) {
                gameState.arrows.splice(i, 1);
            }
        }
    }

    function checkArrowHit(arrow, enemy) {
        if (enemy.isStealthed) return false;

        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const dx = arrow.x - ex;
        const dy = arrow.y - ey;
        const hitRadius = Math.max(enemy.width, enemy.height) / 2;

        return (dx * dx + dy * dy) < (hitRadius * hitRadius);
    }

    function hitEnemy(enemy, arrow) {
        enemy.hp -= arrow.damage;
        enemy.hitFlash = 15;

        const knockbackDir = arrow.vx >= 0 ? 1 : -1;
        enemy.hitKnockback = 6;
        enemy.knockbackDir = knockbackDir;

        if (arrow.type === 'fire' && arrow.burnDamage > 0) {
            enemy.burnTimer = arrow.burnDuration;
            enemy.burnDamage = arrow.burnDamage;
        }

        if (arrow.type === 'ice' && arrow.slowFactor < 1) {
            enemy.slowTimer = arrow.slowDuration;
            enemy.slowFactor = arrow.slowFactor;
        }

        for (let i = 0; i < 8; i++) {
            gameState.particles.push({
                x: arrow.x,
                y: arrow.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                life: 25,
                maxLife: 25,
                color: arrow.type === 'fire' ? '#ff6b35' : arrow.type === 'ice' ? '#74b9ff' : '#ff3333',
                size: 3 + Math.random() * 2
            });
        }

        gameState.particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 4,
            vx: 0,
            vy: -1.5,
            life: 40,
            maxLife: 40,
            color: '#ff0000',
            size: 12,
            text: '-' + arrow.damage
        });

        if (enemy.hp <= 0) {
            killEnemy(enemy);
        }
    }

    function killEnemy(enemy) {
        enemy.dead = true;
        gameState.gold += enemy.gold;
        gameState.score += enemy.score;
        gameState.waveEnemiesLeft--;

        for (let i = 0; i < 15; i++) {
            gameState.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7 - 3,
                life: 35,
                maxLife: 35,
                color: enemy.color,
                size: 4 + Math.random() * 3
            });
        }

        gameState.particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y,
            vx: 0,
            vy: -1.2,
            life: 50,
            maxLife: 50,
            color: '#ffd700',
            size: 14,
            text: '+' + enemy.gold + '金'
        });

        updateUI();
        saveGame();

        if (gameState.waveEnemiesLeft <= 0 && gameState.waveSpawnQueue.length === 0) {
            onWaveComplete();
        }
    }

    function onWaveComplete() {
        saveGame();
        if (gameState.wave >= gameState.maxWave) {
            gameState.victory = true;
            endGame(true);
            return;
        }

        if (gameState.wave % 5 === 0) {
            startRestPeriod();
        } else {
            setTimeout(startNextWave, 1500);
        }
    }

    function startRestPeriod() {
        gameState.resting = true;
        gameState.restTimer = 10;
        document.getElementById('upgrade-screen').classList.remove('hidden');
        updateUpgradeUI();
        startRestCountdown();
    }

    function startRestCountdown() {
        const timerEl = document.getElementById('rest-timer');
        const countdown = setInterval(() => {
            if (!gameState.resting) {
                clearInterval(countdown);
                return;
            }
            gameState.restTimer--;
            timerEl.textContent = gameState.restTimer;
            if (gameState.restTimer <= 0) {
                clearInterval(countdown);
                if (gameState.resting) {
                    startNextWave();
                }
            }
        }, 1000);
    }

    function updateUpgradeUI() {
        document.getElementById('upgrade-gold').textContent = gameState.gold;

        const arrowLevel = gameState.arrowLevel;
        const nextArrowLevel = arrowLevel + 1;
        const arrowBtn = document.getElementById('arrow-upgrade-btn');

        if (nextArrowLevel < ARROW_LEVELS.length) {
            document.getElementById('arrow-level-text').textContent = `当前：${ARROW_LEVELS[arrowLevel].name}`;
            document.getElementById('arrow-upgrade-cost').textContent = ARROW_LEVELS[nextArrowLevel].cost;
            arrowBtn.disabled = gameState.gold < ARROW_LEVELS[nextArrowLevel].cost;
            arrowBtn.textContent = `升级到${ARROW_LEVELS[nextArrowLevel].name}`;
        } else {
            document.getElementById('arrow-level-text').textContent = `已满级：${ARROW_LEVELS[arrowLevel].name}`;
            arrowBtn.disabled = true;
            arrowBtn.textContent = '已满级';
        }

        const wallLevel = gameState.wallLevel;
        const nextWallLevel = wallLevel + 1;
        const wallBtn = document.getElementById('wall-upgrade-btn');

        if (nextWallLevel < WALL_LEVELS.length) {
            document.getElementById('wall-level-text').textContent = `当前：生命上限 ${WALL_LEVELS[wallLevel].maxHp}`;
            document.getElementById('wall-upgrade-cost').textContent = WALL_LEVELS[nextWallLevel].cost;
            wallBtn.disabled = gameState.gold < WALL_LEVELS[nextWallLevel].cost;
            wallBtn.textContent = '升级城墙';
        } else {
            document.getElementById('wall-level-text').textContent = `已满级：生命上限 ${WALL_LEVELS[wallLevel].maxHp}`;
            wallBtn.disabled = true;
            wallBtn.textContent = '已满级';
        }
    }

    function upgradeArrow() {
        const nextLevel = gameState.arrowLevel + 1;
        if (nextLevel >= ARROW_LEVELS.length) return;

        const cost = ARROW_LEVELS[nextLevel].cost;
        if (gameState.gold < cost) return;

        gameState.gold -= cost;
        gameState.arrowLevel = nextLevel;
        updateUpgradeUI();
        updateUI();
        saveGame();
    }

    function upgradeWall() {
        const nextLevel = gameState.wallLevel + 1;
        if (nextLevel >= WALL_LEVELS.length) return;

        const cost = WALL_LEVELS[nextLevel].cost;
        if (gameState.gold < cost) return;

        gameState.gold -= cost;
        gameState.wallLevel = nextLevel;
        gameState.castleMaxHp = WALL_LEVELS[nextLevel].maxHp;
        gameState.castleHp = gameState.castleMaxHp;
        updateUpgradeUI();
        updateUI();
        saveGame();
    }

    function updateEnemies(deltaTime) {
        const dt = deltaTime || 16;

        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            if (enemy.dead) {
                gameState.enemies.splice(i, 1);
                continue;
            }

            if (enemy.hitFlash > 0) enemy.hitFlash--;

            if (enemy.hitKnockback > 0) {
                enemy.x += enemy.knockbackDir * (enemy.hitKnockback / 2);
                enemy.hitKnockback--;
            }

            if (enemy.state !== 'walking' && enemy.state !== 'dead') {
                const castleLeftEdge = CASTLE_X - CASTLE_WIDTH / 2;
                const castleRightEdge = CASTLE_X + CASTLE_WIDTH / 2;
                const maxDistance = 20;
                let tooFar = false;

                if (enemy.side === 'left') {
                    if (enemy.x + enemy.width < castleLeftEdge - maxDistance) {
                        tooFar = true;
                    }
                } else {
                    if (enemy.x > castleRightEdge + maxDistance) {
                        tooFar = true;
                    }
                }

                if (tooFar) {
                    enemy.state = 'walking';
                    enemy.climbProgress = 0;
                    enemy.actionCooldown = 0;
                }
            }

            if (enemy.burnTimer > 0) {
                enemy.burnTimer -= dt;
                if (Math.random() < 0.1) {
                    gameState.particles.push({
                        x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * enemy.width,
                        y: enemy.y + Math.random() * enemy.height / 2,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -1 - Math.random() * 1,
                        life: 15,
                        maxLife: 15,
                        color: '#ff6b35',
                        size: 3
                    });
                }
                if (Math.floor(enemy.burnTimer / 500) !== Math.floor((enemy.burnTimer + dt) / 500)) {
                    enemy.hp -= enemy.burnDamage;
                    enemy.hitFlash = 5;
                    if (enemy.hp <= 0) {
                        killEnemy(enemy);
                        continue;
                    }
                }
            }

            if (enemy.slowTimer > 0) {
                enemy.slowTimer -= dt;
                if (enemy.slowTimer <= 0) {
                    enemy.slowFactor = 1;
                }
            }

            const speed = ENEMY_TYPES[enemy.type].speed * enemy.slowFactor;

            if (enemy.behavior === 'stealth') {
                if (enemy.isStealthed) {
                    enemy.stealthTimer -= dt;
                    if (enemy.stealthTimer <= 0) {
                        enemy.isStealthed = false;
                        enemy.stealthCooldown = ENEMY_TYPES.assassin.stealthInterval;
                        enemy.x += (Math.random() - 0.5) * enemy.stealthOffset;
                    }
                } else {
                    enemy.stealthCooldown -= dt;
                    if (enemy.stealthCooldown <= 0 && enemy.state === 'walking') {
                        enemy.isStealthed = true;
                        enemy.stealthTimer = enemy.stealthDuration;
                    }
                }
            }

            if (enemy.state === 'walking') {
                const castleLeftEdge = CASTLE_X - CASTLE_WIDTH / 2;
                const castleRightEdge = CASTLE_X + CASTLE_WIDTH / 2;

                let reachedCastle = false;
                if (enemy.side === 'left' && enemy.x + enemy.width >= castleLeftEdge) {
                    enemy.x = castleLeftEdge - enemy.width;
                    reachedCastle = true;
                } else if (enemy.side === 'right' && enemy.x <= castleRightEdge) {
                    enemy.x = castleRightEdge;
                    reachedCastle = true;
                }

                if (!reachedCastle) {
                    if (enemy.side === 'left') {
                        enemy.x += speed;
                    } else {
                        enemy.x -= speed;
                    }
                } else {
                    if (enemy.behavior === 'climb') {
                        enemy.state = 'climbing';
                        enemy.climbProgress = 0;
                        enemy.climbAnimFrame = 0;
                        enemy.climbAnimTimer = 0;
                    } else if (enemy.behavior === 'shoot') {
                        enemy.state = 'attacking';
                        enemy.actionCooldown = 1000;
                    } else if (enemy.behavior === 'smash' || enemy.behavior === 'boss_smash') {
                        enemy.state = 'attacking';
                        enemy.actionCooldown = 1500;
                    } else if (enemy.behavior === 'stealth') {
                        enemy.state = 'attacking';
                        enemy.actionCooldown = 1000;
                    }
                }

                enemy.animTimer++;
                if (enemy.animTimer > 8) {
                    enemy.animTimer = 0;
                    enemy.animFrame = (enemy.animFrame + 1) % 2;
                }
            } else if (enemy.state === 'climbing') {
                enemy.climbProgress += dt / enemy.climbTime;

                enemy.climbAnimTimer++;
                if (enemy.climbAnimTimer > 8) {
                    enemy.climbAnimTimer = 0;
                    enemy.climbAnimFrame = (enemy.climbAnimFrame + 1) % 4;
                }

                if (enemy.climbProgress >= 1) {
                    gameState.castleHp -= enemy.climbDamage;
                    updateUI();
                    saveGame();
                    if (gameState.castleHp <= 0) {
                        endGame(false);
                        return;
                    }
                    enemy.y = GROUND_Y - enemy.height;
                    enemy.state = 'walking';
                    enemy.climbProgress = 0;
                    enemy.x = enemy.side === 'left' ?
                        CASTLE_X - CASTLE_WIDTH / 2 - enemy.width - 40 :
                        CASTLE_X + CASTLE_WIDTH / 2 + 40;
                } else {
                    enemy.y = GROUND_Y - enemy.height - (CASTLE_HEIGHT - 40) * enemy.climbProgress;
                    if (enemy.side === 'left') {
                        enemy.x = CASTLE_X - CASTLE_WIDTH / 2 - enemy.width + 5;
                    } else {
                        enemy.x = CASTLE_X + CASTLE_WIDTH / 2 - 5;
                    }
                }
            } else if (enemy.state === 'attacking') {
                enemy.actionCooldown -= dt;
                if (enemy.actionCooldown <= 0) {
                    if (enemy.behavior === 'shoot') {
                        shootEnemyArrow(enemy);
                        enemy.actionCooldown = enemy.shootInterval;
                    } else if (enemy.behavior === 'smash' || enemy.behavior === 'boss_smash') {
                        gameState.castleHp -= enemy.smashDamage;
                        updateUI();
                        saveGame();
                        for (let p = 0; p < 12; p++) {
                            gameState.particles.push({
                                x: enemy.side === 'left' ?
                                    CASTLE_X - CASTLE_WIDTH / 2 :
                                    CASTLE_X + CASTLE_WIDTH / 2,
                                y: GROUND_Y - 30 - Math.random() * 60,
                                vx: (enemy.side === 'left' ? -1 : 1) * (1 + Math.random() * 3),
                                vy: -2 - Math.random() * 4,
                                life: 30,
                                maxLife: 30,
                                color: Math.random() < 0.5 ? '#888' : '#aaa',
                                size: 3 + Math.random() * 4
                            });
                        }
                        if (gameState.castleHp <= 0) {
                            endGame(false);
                            return;
                        }
                        enemy.actionCooldown = enemy.smashInterval;
                    } else if (enemy.behavior === 'stealth') {
                        gameState.castleHp -= 3;
                        updateUI();
                        saveGame();
                        if (gameState.castleHp <= 0) {
                            endGame(false);
                            return;
                        }
                        enemy.actionCooldown = 2000;
                    }
                }
            }
        }
    }

    function shootEnemyArrow(enemy) {
        const startX = enemy.x + enemy.width / 2;
        const startY = enemy.y + enemy.height / 3;
        const targetX = CASTLE_X;
        const targetY = ARCHER_Y;

        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 5;

        gameState.enemyArrows.push({
            x: startX,
            y: startY,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            damage: enemy.shootDamage,
            active: true
        });
    }

    function updateEnemyArrows() {
        for (let i = gameState.enemyArrows.length - 1; i >= 0; i--) {
            const arrow = gameState.enemyArrows[i];

            arrow.vy += GRAVITY * 0.5;
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;

            const castleLeft = CASTLE_X - CASTLE_WIDTH / 2;
            const castleRight = CASTLE_X + CASTLE_WIDTH / 2;
            const castleTop = CASTLE_TOP_Y;

            if (arrow.x > castleLeft && arrow.x < castleRight &&
                arrow.y > castleTop && arrow.y < GROUND_Y) {
                gameState.castleHp -= arrow.damage;
                updateUI();
                saveGame();
                for (let p = 0; p < 5; p++) {
                    gameState.particles.push({
                        x: arrow.x,
                        y: arrow.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -1 - Math.random() * 3,
                        life: 25,
                        maxLife: 25,
                        color: '#888',
                        size: 3
                    });
                }
                if (gameState.castleHp <= 0) {
                    endGame(false);
                    return;
                }
                gameState.enemyArrows.splice(i, 1);
                continue;
            }

            if (arrow.x < -50 || arrow.x > W + 50 || arrow.y > H + 50) {
                gameState.enemyArrows.splice(i, 1);
            }
        }
    }

    function updateParticles() {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }

    function updateWaveSpawning() {
        if (gameState.waveSpawnQueue.length === 0) return;

        gameState.waveSpawnTimer--;
        if (gameState.waveSpawnTimer <= 0) {
            const type = gameState.waveSpawnQueue.shift();
            spawnEnemy(type);
            gameState.waveSpawnTimer = 40 + Math.random() * 40;
        }
    }

    function drawSky() {
        const progress = gameState.skyProgress;
        const r1 = Math.floor(135 + (255 - 135) * progress * 0.8);
        const g1 = Math.floor(206 - (206 - 140) * progress * 0.5);
        const b1 = Math.floor(235 - (235 - 80) * progress * 0.9);

        const r2 = Math.floor(100 + (255 - 100) * progress * 0.9);
        const g2 = Math.floor(180 - (180 - 100) * progress * 0.6);
        const b2 = Math.floor(220 - (220 - 50) * progress * 0.9);

        const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, GROUND_Y);

        if (progress > 0.5) {
            const sunAlpha = (progress - 0.5) * 2;
            ctx.fillStyle = `rgba(255, 200, 100, ${sunAlpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(W * 0.8, GROUND_Y * 0.3, 50, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGround() {
        const gradient = ctx.createLinearGradient(0, GROUND_Y, 0, H);
        gradient.addColorStop(0, '#4a7c3a');
        gradient.addColorStop(1, '#3a6c2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        ctx.fillStyle = '#5a8c4a';
        for (let i = 0; i < 30; i++) {
            const x = (i * 31) % W;
            const y = GROUND_Y + 5 + (i % 5) * 8;
            ctx.fillRect(x, y, 3, 8);
        }
    }

    function drawCastle() {
        const x = CASTLE_X;
        const topY = CASTLE_TOP_Y;
        const width = CASTLE_WIDTH;
        const halfW = width / 2;

        const hpRatio = gameState.castleHp / gameState.castleMaxHp;

        ctx.fillStyle = '#8a8a9a';
        ctx.fillRect(x - halfW, topY, width, CASTLE_HEIGHT - 40);

        ctx.fillStyle = '#6a6a7a';
        for (let row = 0; row < 8; row++) {
            const offset = row % 2 === 0 ? 0 : 15;
            for (let col = 0; col < 5; col++) {
                const bx = x - halfW + offset + col * 30;
                const by = topY + 10 + row * 20;
                if (bx < x + halfW - 10 && by < topY + CASTLE_HEIGHT - 50) {
                    ctx.fillStyle = '#7a7a8a';
                    ctx.fillRect(bx, by, 28, 18);
                    ctx.strokeStyle = '#5a5a6a';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(bx, by, 28, 18);
                }
            }
        }

        if (hpRatio < 0.7) {
            ctx.strokeStyle = '#4a4a5a';
            ctx.lineWidth = 2;
            const crackCount = Math.floor((1 - hpRatio) * 8);
            for (let i = 0; i < crackCount; i++) {
                const cx = x - halfW + 20 + (i * 17) % (width - 40);
                const cy = topY + 30 + (i * 23) % (CASTLE_HEIGHT - 80);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + 8, cy + 15);
                ctx.lineTo(cx - 5, cy + 25);
                ctx.stroke();
            }
        }

        ctx.fillStyle = '#7a7a8a';
        ctx.fillRect(x - halfW - 15, topY - 20, 25, 25);
        ctx.fillRect(x + halfW - 10, topY - 20, 25, 25);

        ctx.fillStyle = '#6a4a8a';
        ctx.beginPath();
        ctx.moveTo(x - halfW - 18, topY - 20);
        ctx.lineTo(x - halfW - 3, topY - 50);
        ctx.lineTo(x - halfW + 12, topY - 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#6a4a8a';
        ctx.beginPath();
        ctx.moveTo(x + halfW - 13, topY - 20);
        ctx.lineTo(x + halfW + 2, topY - 50);
        ctx.lineTo(x + halfW + 17, topY - 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8a8a9a';
        const merlonCount = 7;
        const merlonW = width / merlonCount;
        for (let i = 0; i < merlonCount; i++) {
            if (i % 2 === 1) continue;
            const mx = x - halfW + i * merlonW;
            ctx.fillRect(mx, topY - 12, merlonW - 2, 12);
        }

        ctx.fillStyle = '#3498db';
        ctx.fillRect(x - 18, topY + 30, 36, 50);
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.arc(x, topY + 30, 18, Math.PI, 0);
        ctx.fill();
    }

    function drawArcher() {
        const x = CASTLE_X;
        const y = ARCHER_Y;

        const dx = gameState.mouse.x - x;
        const dy = gameState.mouse.y - y;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-8, 0, 16, 22);

        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(0, -8, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -12, 8, Math.PI, 0);
        ctx.fill();

        ctx.save();
        ctx.rotate(angle);

        let bowPull = 0;
        if (gameState.charging) {
            bowPull = (gameState.charge / MAX_CHARGE) * 8;
        } else if (gameState.archerFrame === 2) {
            bowPull = 2;
        }

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, 0, 22 + bowPull * 0.5, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10 + (22 + bowPull * 0.5) * Math.cos(-Math.PI / 2.5),
                   (22 + bowPull * 0.5) * Math.sin(-Math.PI / 2.5));
        ctx.lineTo(10 - bowPull, 0);
        ctx.lineTo(10 + (22 + bowPull * 0.5) * Math.cos(Math.PI / 2.5),
                   (22 + bowPull * 0.5) * Math.sin(Math.PI / 2.5));
        ctx.stroke();

        if (gameState.charging) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(10 - bowPull - 15, -1, 20, 2);

            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.moveTo(10 - bowPull + 5, -3);
            ctx.lineTo(10 - bowPull + 12, 0);
            ctx.lineTo(10 - bowPull + 5, 3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
    }

    function drawAimLine() {
        if (gameState.gameOver || gameState.resting) return;

        const x = CASTLE_X;
        const y = ARCHER_Y;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(gameState.mouse.x, gameState.mouse.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gameState.mouse.x, gameState.mouse.y, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gameState.mouse.x - 15, gameState.mouse.y);
        ctx.lineTo(gameState.mouse.x - 5, gameState.mouse.y);
        ctx.moveTo(gameState.mouse.x + 5, gameState.mouse.y);
        ctx.lineTo(gameState.mouse.x + 15, gameState.mouse.y);
        ctx.moveTo(gameState.mouse.x, gameState.mouse.y - 15);
        ctx.lineTo(gameState.mouse.x, gameState.mouse.y - 5);
        ctx.moveTo(gameState.mouse.x, gameState.mouse.y + 5);
        ctx.lineTo(gameState.mouse.x, gameState.mouse.y + 15);
        ctx.stroke();
    }

    function drawArrows() {
        for (const arrow of gameState.arrows) {
            if (arrow.stuck) {
                ctx.save();
                const angle = Math.atan2(arrow.vy, arrow.vx);
                ctx.translate(arrow.x, arrow.y);
                ctx.rotate(angle);
                drawArrowShape(arrow, 0.6);
                ctx.restore();
                continue;
            }

            if (arrow.trail.length > 1) {
                ctx.strokeStyle = arrow.type === 'fire' ? 'rgba(255, 107, 53, 0.5)' :
                                  arrow.type === 'ice' ? 'rgba(116, 185, 255, 0.5)' :
                                  'rgba(150, 150, 150, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(arrow.trail[0].x, arrow.trail[0].y);
                for (let i = 1; i < arrow.trail.length; i++) {
                    ctx.lineTo(arrow.trail[i].x, arrow.trail[i].y);
                }
                ctx.stroke();
            }

            ctx.save();
            const angle = Math.atan2(arrow.vy, arrow.vx);
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(angle);
            drawArrowShape(arrow, 1);
            ctx.restore();
        }
    }

    function drawArrowShape(arrow, alpha) {
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-15, -1, 25, 2);

        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(16, 0);
        ctx.lineTo(10, 4);
        ctx.closePath();
        ctx.fill();

        if (arrow.type === 'fire') {
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.moveTo(-15, -2);
            ctx.lineTo(-20, 0);
            ctx.lineTo(-15, 2);
            ctx.closePath();
            ctx.fill();
        } else if (arrow.type === 'ice') {
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.moveTo(-15, -2);
            ctx.lineTo(-20, 0);
            ctx.lineTo(-15, 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-15, -3);
            ctx.lineTo(-18, 0);
            ctx.lineTo(-15, 3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    function drawEnemyArrows() {
        ctx.fillStyle = '#e74c3c';
        for (const arrow of gameState.enemyArrows) {
            ctx.save();
            const angle = Math.atan2(arrow.vy, arrow.vx);
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(angle);
            ctx.fillRect(-10, -1, 18, 2);
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.moveTo(8, -3);
            ctx.lineTo(12, 0);
            ctx.lineTo(8, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawEnemies() {
        for (const enemy of gameState.enemies) {
            if (enemy.dead) continue;

            ctx.save();

            const isFlashing = enemy.hitFlash > 0 && enemy.hitFlash % 3 !== 0;
            const baseAlpha = enemy.isStealthed ? 0.25 : 1.0;
            ctx.globalAlpha = baseAlpha;

            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            if (isFlashing) {
                drawEnemyWhite(enemy, ex, ey, ew, eh);
            } else {
                switch (enemy.type) {
                    case 'goblin': drawGoblin(enemy, ex, ey, ew, eh); break;
                    case 'skeleton': drawSkeleton(enemy, ex, ey, ew, eh); break;
                    case 'orc': drawOrc(enemy, ex, ey, ew, eh); break;
                    case 'assassin': drawAssassin(enemy, ex, ey, ew, eh); break;
                    case 'boss': drawBoss(enemy, ex, ey, ew, eh); break;
                }
            }

            if (enemy.burnTimer > 0) {
                ctx.globalAlpha = 0.4 * baseAlpha;
                ctx.fillStyle = '#ff6b35';
                ctx.fillRect(ex, ey, ew, eh);
                ctx.globalAlpha = baseAlpha;
            }

            if (enemy.slowTimer > 0) {
                ctx.globalAlpha = 0.4 * baseAlpha;
                ctx.fillStyle = '#74b9ff';
                ctx.fillRect(ex, ey, ew, eh);
                ctx.globalAlpha = baseAlpha;
            }

            if (!enemy.isStealthed) {
                const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
                const barW = Math.max(24, ew + 6);
                const barH = 5;
                const barX = ex + ew / 2 - barW / 2;
                const barY = ey - 10;

                ctx.globalAlpha = 1;
                ctx.fillStyle = '#000';
                ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
                ctx.fillStyle = '#222';
                ctx.fillRect(barX, barY, barW, barH);
                const hpColor = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f1c40f' : '#e74c3c';
                ctx.fillStyle = hpColor;
                ctx.fillRect(barX, barY, barW * hpRatio, barH);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                ctx.strokeRect(barX, barY, barW, barH);
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }

    function drawEnemyWhite(enemy, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        switch (enemy.type) {
            case 'goblin':
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + h * 0.6, w / 2 - 2, h * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h * 0.25, w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x + w * 0.25 - 2, y + h - 8, 5, 8);
                ctx.fillRect(x + w * 0.65 - 2, y + h - 8, 5, 8);
                break;
            case 'skeleton':
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h * 0.18, w * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x + w * 0.4, y + h * 0.35, w * 0.2, h * 0.3);
                break;
            case 'orc':
                ctx.fillRect(x + w * 0.1, y + h * 0.35, w * 0.8, h * 0.5);
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h * 0.25, w * 0.38, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'assassin':
                ctx.beginPath();
                ctx.moveTo(x + w / 2, y + h * 0.2);
                ctx.lineTo(x + w * 0.15, y + h * 0.95);
                ctx.lineTo(x + w * 0.85, y + h * 0.95);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h * 0.18, w * 0.32, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'boss':
                ctx.fillRect(x, y + h * 0.2, w, h * 0.8);
                ctx.beginPath();
                ctx.moveTo(x - 5, y + h * 0.2);
                ctx.lineTo(x + w / 2, y);
                ctx.lineTo(x + w + 5, y + h * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }

    function drawGoblin(enemy, x, y, w, h) {
        const isClimbing = enemy.state === 'climbing';

        if (isClimbing) {
            const frame = enemy.climbAnimFrame;

            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';

            if (frame === 0 || frame === 2) {
                ctx.beginPath();
                ctx.moveTo(x + w * 0.3, y + h * 0.45);
                ctx.lineTo(x + w * 0.05, y + h * 0.35);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.7, y + h * 0.5);
                ctx.lineTo(x + w * 0.95, y + h * 0.45);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.35, y + h * 0.75);
                ctx.lineTo(x + w * 0.1, y + h * 0.6);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.65, y + h * 0.8);
                ctx.lineTo(x + w * 0.9, y + h * 0.7);
                ctx.stroke();
            } else if (frame === 1) {
                ctx.beginPath();
                ctx.moveTo(x + w * 0.3, y + h * 0.5);
                ctx.lineTo(x + w * 0.05, y + h * 0.55);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.7, y + h * 0.45);
                ctx.lineTo(x + w * 0.95, y + h * 0.3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.35, y + h * 0.8);
                ctx.lineTo(x + w * 0.1, y + h * 0.75);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.65, y + h * 0.75);
                ctx.lineTo(x + w * 0.9, y + h * 0.55);
                ctx.stroke();
            } else if (frame === 3) {
                ctx.beginPath();
                ctx.moveTo(x + w * 0.3, y + h * 0.4);
                ctx.lineTo(x + w * 0.05, y + h * 0.25);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.7, y + h * 0.55);
                ctx.lineTo(x + w * 0.95, y + h * 0.5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.35, y + h * 0.7);
                ctx.lineTo(x + w * 0.1, y + h * 0.5);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.65, y + h * 0.85);
                ctx.lineTo(x + w * 0.9, y + h * 0.8);
                ctx.stroke();
            }

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.55, w / 2 - 2, h * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.2, w / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + w * 0.35, y + h * 0.17, 4, 0, Math.PI * 2);
            ctx.arc(x + w * 0.65, y + h * 0.17, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w * 0.35, y + h * 0.17, 2, 0, Math.PI * 2);
            ctx.arc(x + w * 0.65, y + h * 0.17, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * 0.15);
            ctx.lineTo(x + w * 0.05, y + h * 0.0);
            ctx.lineTo(x + w * 0.25, y + h * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + w * 0.8, y + h * 0.15);
            ctx.lineTo(x + w * 0.95, y + h * 0.0);
            ctx.lineTo(x + w * 0.75, y + h * 0.05);
            ctx.closePath();
            ctx.fill();

        } else {
            const legOffset = enemy.animFrame === 0 ? 0 : 3;

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.6, w / 2 - 2, h * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.25, w / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + w * 0.35, y + h * 0.22, 4, 0, Math.PI * 2);
            ctx.arc(x + w * 0.65, y + h * 0.22, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w * 0.35, y + h * 0.22, 2, 0, Math.PI * 2);
            ctx.arc(x + w * 0.65, y + h * 0.22, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * 0.2);
            ctx.lineTo(x + w * 0.05, y + h * 0.05);
            ctx.lineTo(x + w * 0.25, y + h * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + w * 0.8, y + h * 0.2);
            ctx.lineTo(x + w * 0.95, y + h * 0.05);
            ctx.lineTo(x + w * 0.75, y + h * 0.1);
            ctx.closePath();
            ctx.fill();

            const armSwing = enemy.animFrame === 0 ? 0 : 4;
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * 0.5);
            ctx.lineTo(x + w * 0.05, y + h * 0.55 + armSwing);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + w * 0.8, y + h * 0.5);
            ctx.lineTo(x + w * 0.95, y + h * 0.55 - armSwing);
            ctx.stroke();

            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x + w * 0.25 - 2, y + h - 8 + legOffset, 5, 8);
            ctx.fillRect(x + w * 0.65 - 2, y + h - 8 - legOffset, 5, 8);
        }
    }

    function drawSkeleton(enemy, x, y, w, h) {
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 3;

        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.18, w * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(x + w * 0.38, y + h * 0.16, 3, 0, Math.PI * 2);
        ctx.arc(x + w * 0.62, y + h * 0.16, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.35);
        ctx.lineTo(x + w / 2, y + h * 0.65);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const ry = y + h * 0.38 + i * 7;
            ctx.beginPath();
            ctx.moveTo(x + w * 0.3, ry);
            ctx.lineTo(x + w * 0.7, ry);
            ctx.stroke();
        }

        const armSwing = Math.sin(Date.now() / 200) * 5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.4);
        ctx.lineTo(x + w * 0.15, y + h * 0.55 + armSwing);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.4);
        ctx.lineTo(x + w * 0.85, y + h * 0.55 - armSwing);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.65);
        ctx.lineTo(x + w * 0.35, y + h * 0.95);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.65);
        ctx.lineTo(x + w * 0.65, y + h * 0.95);
        ctx.stroke();

        if (enemy.state === 'attacking') {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            const bowX = x + (enemy.side === 'left' ? w * 0.15 : w * 0.85);
            const bowY = y + h * 0.45;
            const dir = enemy.side === 'left' ? -1 : 1;
            ctx.beginPath();
            ctx.arc(bowX, bowY, 12, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
        }
    }

    function drawOrc(enemy, x, y, w, h) {
        ctx.fillStyle = '#7f8c8d';

        ctx.fillRect(x + w * 0.1, y + h * 0.35, w * 0.8, h * 0.5);

        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.25, w * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.22, 5, 0, Math.PI * 2);
        ctx.arc(x + w * 0.65, y + h * 0.22, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.22, 2.5, 0, Math.PI * 2);
        ctx.arc(x + w * 0.65, y + h * 0.22, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#636e72';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y + h * 0.35);
        ctx.lineTo(x + w * 0.3, y + h * 0.45);
        ctx.lineTo(x + w * 0.38, y + h * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.75, y + h * 0.35);
        ctx.lineTo(x + w * 0.7, y + h * 0.45);
        ctx.lineTo(x + w * 0.62, y + h * 0.42);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w * 0.35, y + h * 0.36, 3, 6);
        ctx.fillRect(x + w * 0.58, y + h * 0.36, 3, 6);

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x + 2, y + h * 0.4, 8, h * 0.4);
        ctx.fillRect(x + w - 10, y + h * 0.4, 8, h * 0.4);

        if (enemy.state === 'attacking') {
            const hammerX = x + (enemy.side === 'left' ? -5 : w + 5);
            const hammerY = y + h * 0.45;
            ctx.fillStyle = '#636e72';
            ctx.fillRect(hammerX - 2, hammerY - 5, 4, 20);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(hammerX - 8, hammerY - 10, 16, 10);
        }
    }

    function drawAssassin(enemy, x, y, w, h) {
        ctx.fillStyle = '#9b59b6';

        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.2);
        ctx.lineTo(x + w * 0.15, y + h * 0.95);
        ctx.lineTo(x + w * 0.85, y + h * 0.95);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.18, w * 0.32, 0, Math.PI * 2);
        ctx.fill();

        if (!enemy.isStealthed) {
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.2, w * 0.22, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x + w * 0.4, y + h * 0.18, 3, 0, Math.PI * 2);
            ctx.arc(x + w * 0.6, y + h * 0.18, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (enemy.state === 'attacking') {
            ctx.fillStyle = '#c0c0c0';
            const dir = enemy.side === 'left' ? -1 : 1;
            const dx = x + w / 2 + dir * w * 0.4;
            ctx.beginPath();
            ctx.moveTo(dx, y + h * 0.5);
            ctx.lineTo(dx + dir * 18, y + h * 0.48);
            ctx.lineTo(dx + dir * 15, y + h * 0.55);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawBoss(enemy, x, y, w, h) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y + h * 0.2, w, h * 0.8);

        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 5, y + h * 0.25, w - 10, h * 0.7);

        ctx.fillStyle = '#4a2810';
        for (let i = 0; i < 3; i++) {
            const bx = x + 10 + i * (w - 20) / 2;
            ctx.beginPath();
            ctx.arc(bx, y + h * 0.35, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx, y + h * 0.55, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx, y + h * 0.75, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#8B4513';
        const coneY = y + h * 0.2;
        ctx.beginPath();
        ctx.moveTo(x - 5, coneY);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w + 5, coneY);
        ctx.closePath();
        ctx.fill();

        if (enemy.state === 'attacking') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x, y + h * 0.2, w, h * 0.8);
        }
    }

    function drawParticles() {
        for (const p of gameState.particles) {
            const alpha = p.life / p.maxLife;
            if (p.text) {
                ctx.font = `bold ${p.size}px Microsoft YaHei, sans-serif`;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText(p.text, p.x, p.y);
                ctx.fillText(p.text, p.x, p.y);
                ctx.textAlign = 'start';
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function updateUI() {
        document.getElementById('wave-display').textContent = `${gameState.wave} / ${gameState.maxWave}`;
        document.getElementById('gold-display').textContent = gameState.gold;
        document.getElementById('score-display').textContent = gameState.score;

        const hpPercent = Math.max(0, (gameState.castleHp / gameState.castleMaxHp) * 100);
        document.getElementById('castle-hp-bar').style.width = hpPercent + '%';
        document.getElementById('castle-hp-text').textContent =
            `${Math.max(0, Math.ceil(gameState.castleHp))} / ${gameState.castleMaxHp}`;
    }

    function updateChargeUI() {
        const chargeContainer = document.getElementById('charge-bar-container');
        const chargeBar = document.getElementById('charge-bar');
        const chargeText = document.getElementById('charge-text');

        if (gameState.charging) {
            chargeContainer.classList.add('visible');
            chargeBar.style.width = (gameState.charge / MAX_CHARGE * 100) + '%';
            chargeText.textContent = `蓄力 ${Math.floor(gameState.charge / MAX_CHARGE * 100)}%`;
        } else {
            chargeContainer.classList.remove('visible');
        }
    }

    function endGame(victory) {
        gameState.gameOver = true;
        gameState.running = false;
        gameState.victory = victory;

        clearSave();

        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('final-wave').textContent = gameState.wave;
        document.getElementById('final-score').textContent = gameState.score;
        document.getElementById('final-gold').textContent = gameState.gold;

        if (victory) {
            document.getElementById('gameover-title').textContent = '🎉 胜利！';
        } else {
            document.getElementById('gameover-title').textContent = '💀 游戏结束';
        }

        submitScore();
    }

    async function submitScore() {
        const statusEl = document.getElementById('submit-status');
        statusEl.textContent = '正在提交成绩...';
        statusEl.className = 'submit-status';

        try {
            const response = await fetch('/api/archer/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_name: gameState.playerName,
                    wave: gameState.wave,
                    score: gameState.score
                })
            });

            const data = await response.json();
            if (data.code === 0) {
                statusEl.textContent = '✓ 成绩提交成功！';
            } else {
                statusEl.textContent = '提交失败: ' + data.message;
                statusEl.className = 'submit-status error';
            }
        } catch (e) {
            statusEl.textContent = '提交失败，请检查网络';
            statusEl.className = 'submit-status error';
        }
    }

    async function loadLeaderboard() {
        const listEl = document.getElementById('leaderboard-list');
        listEl.innerHTML = '<p class="loading-text">加载中...</p>';

        try {
            const response = await fetch('/api/archer/getleaderboard?limit=20');
            const data = await response.json();

            if (data.code === 0 && data.data && data.data.items) {
                const items = data.data.items;
                if (items.length === 0) {
                    listEl.innerHTML = '<p class="loading-text">暂无记录</p>';
                } else {
                    let html = '';
                    for (const item of items) {
                        html += `
                            <div class="leaderboard-item rank-${item.rank}">
                                <span class="rank">${item.rank}</span>
                                <span class="player-name">${escapeHtml(item.player_name)}</span>
                                <span class="wave-score">
                                    <div>第 ${item.wave} 波</div>
                                    <div class="score">${item.score}</div>
                                </span>
                            </div>
                        `;
                    }
                    listEl.innerHTML = html;
                }
            } else {
                listEl.innerHTML = '<p class="loading-text">加载失败</p>';
            }
        } catch (e) {
            listEl.innerHTML = '<p class="loading-text">加载失败</p>';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    let lastTime = 0;
    let saveTimer = 0;
    function gameLoop(timestamp) {
        if (!gameState.running && gameState.gameOver) {
            return;
        }

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (gameState.running && !gameState.resting) {
            if (gameState.charging) {
                gameState.charge += CHARGE_SPEED;
                if (gameState.charge > MAX_CHARGE) {
                    gameState.charge = MAX_CHARGE;
                }
            }

            updateWaveSpawning();
            updateArrows(deltaTime);
            updateEnemies(deltaTime);
            updateEnemyArrows();
            updateParticles();
            updateChargeUI();

            saveTimer += deltaTime;
            if (saveTimer > 5000) {
                saveTimer = 0;
                saveGame();
            }
        }

        drawSky();
        drawGround();
        drawCastle();
        drawEnemies();
        drawArrows();
        drawEnemyArrows();
        drawArcher();
        drawAimLine();
        drawParticles();

        requestAnimationFrame(gameLoop);
    }

    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function handleMouseMove(e) {
        const coords = getCanvasCoords(e);
        gameState.mouse.x = coords.x;
        gameState.mouse.y = coords.y;
    }

    function handleMouseDown(e) {
        if (gameState.gameOver || gameState.resting || !gameState.running) return;
        if (e.button !== 0) return;

        gameState.mouse.down = true;
        gameState.charging = true;
        gameState.charge = 0;
        gameState.archerFrame = 1;
    }

    function handleMouseUp(e) {
        if (e.button !== 0) return;

        gameState.mouse.down = false;
        if (gameState.charging && gameState.running && !gameState.resting) {
            shootArrow();
        }
    }

    function handleMouseLeave(e) {
        gameState.mouse.down = false;
        if (gameState.charging && gameState.running && !gameState.resting) {
            shootArrow();
        }
    }

    function initEventListeners() {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        document.getElementById('show-leaderboard-btn').addEventListener('click', () => {
            loadLeaderboard();
            document.getElementById('leaderboard-screen').classList.remove('hidden');
        });
        document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
            document.getElementById('leaderboard-screen').classList.add('hidden');
        });
        document.getElementById('gameover-leaderboard-btn').addEventListener('click', () => {
            loadLeaderboard();
            document.getElementById('leaderboard-screen').classList.remove('hidden');
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('gameover-screen').classList.add('hidden');
            startNewGame();
        });

        document.getElementById('arrow-upgrade-btn').addEventListener('click', upgradeArrow);
        document.getElementById('wall-upgrade-btn').addEventListener('click', upgradeWall);
        document.getElementById('next-wave-btn').addEventListener('click', () => {
            gameState.resting = false;
            saveGame();
            startNextWave();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && gameState.resting) {
                e.preventDefault();
                gameState.resting = false;
                saveGame();
                startNextWave();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'start-btn' || e.target.id === 'continue-btn') {
                startGame();
            } else if (e.target.id === 'new-game-btn') {
                clearSave();
                document.getElementById('player-name').value = '';
                startNewGame();
            } else if (e.target.id === 'delete-save-btn') {
                clearSave();
                alert('存档已删除');
                showStartScreen();
            }
        });
    }

    initEventListeners();
    showStartScreen();

})();
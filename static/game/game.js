const { createApp, reactive, ref, computed, onMounted, onUnmounted, nextTick } = Vue;

const API_BASE = 'http://localhost:8001/api';

const GAME_CONFIG = {
    ARROW_COST: 20,
    MANA_MAX: 100,
    MANA_REGEN: 5,
    CRYSTAL_MANA: 50,
    FREEZE_DURATION: 3000,
    ARROW_SPEED: 15,
    ARROW_TRAIL_LENGTH: 20,
    HEAT_WAVE_DURATION: 2000,
    HEAT_WAVE_RADIUS: 150,
    ELITE_HITS_REQUIRED: 3,
    BOSS_WAVE_INTERVAL: 5,
    BASE_ENEMIES_PER_WAVE: 5,
    ENEMY_SPAWN_INTERVAL: 1500,
    PLAYER_MAX_HEALTH: 100
};

createApp({
    setup() {
        const gameCanvas = ref(null);
        const gameState = ref('menu');
        const playerName = ref('');

        const currentWave = ref(1);
        const score = ref(0);
        const enemiesRemaining = ref(0);
        const enemiesPerWave = ref(GAME_CONFIG.BASE_ENEMIES_PER_WAVE);
        const currentMana = ref(GAME_CONFIG.MANA_MAX);
        const maxMana = ref(GAME_CONFIG.MANA_MAX);
        const heatWaveActive = ref(false);
        const waveAnnouncement = ref('');
        const bossActive = ref(false);
        const bossHealth = ref(0);
        const bossMaxHealth = ref(0);

        const stats = ref(null);
        const leaderboard = ref([]);
        const finalStats = reactive({
            wave: 0,
            score: 0,
            kills: 0,
            elite_kills: 0,
            boss_kills: 0,
            damage_dealt: 0,
            arrows_shot: 0,
            crystals_collected: 0,
            survival_time: 0
        });

        let ctx = null;
        let animationId = null;
        let lastTime = 0;
        let gameStartTime = 0;

        const gameObjects = {
            player: null,
            arrows: [],
            enemies: [],
            crystals: [],
            particles: [],
            boss: null,
            bossFireballs: [],
            heatWaves: []
        };

        let mouseX = 0;
        let mouseY = 0;
        let spawnTimer = 0;
        let enemiesSpawned = 0;
        let waveComplete = false;
        let waveTransitionTimer = 0;

        const manaPercent = computed(() => (currentMana.value / maxMana.value) * 100);
        const bossHealthPercent = computed(() => bossMaxHealth.value > 0 ? (bossHealth.value / bossMaxHealth.value) * 100 : 0);

        function initCanvas() {
            const canvas = gameCanvas.value;
            if (!canvas) return;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx = canvas.getContext('2d');

            gameObjects.player = {
                x: 100,
                y: canvas.height / 2,
                angle: 0,
                drawTimer: 0
            };
        }

        function handleMouseMove(e) {
            const rect = gameCanvas.value.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }

        function handleClick() {
            if (gameState.value !== 'playing') return;
            if (currentMana.value < GAME_CONFIG.ARROW_COST) return;

            shootArrow();
        }

        function shootArrow() {
            currentMana.value -= GAME_CONFIG.ARROW_COST;
            finalStats.arrows_shot++;

            const player = gameObjects.player;
            const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

            const arrow = {
                x: player.x + Math.cos(angle) * 40,
                y: player.y + Math.sin(angle) * 40,
                vx: Math.cos(angle) * GAME_CONFIG.ARROW_SPEED,
                vy: Math.sin(angle) * GAME_CONFIG.ARROW_SPEED,
                angle: angle,
                trail: [],
                active: true
            };

            gameObjects.arrows.push(arrow);
        }

        function startGame() {
            resetGameState();
            gameState.value = 'playing';

            nextTick(() => {
                initCanvas();
                startWave(1);
                gameStartTime = Date.now();
                lastTime = performance.now();
                gameLoop();
            });
        }

        function resetGameState() {
            currentWave.value = 1;
            score.value = 0;
            currentMana.value = GAME_CONFIG.MANA_MAX;
            heatWaveActive.value = false;
            waveAnnouncement.value = '';
            bossActive.value = false;
            bossHealth.value = 0;

            gameObjects.arrows = [];
            gameObjects.enemies = [];
            gameObjects.crystals = [];
            gameObjects.particles = [];
            gameObjects.boss = null;
            gameObjects.bossFireballs = [];
            gameObjects.heatWaves = [];

            Object.assign(finalStats, {
                wave: 0,
                score: 0,
                kills: 0,
                elite_kills: 0,
                boss_kills: 0,
                damage_dealt: 0,
                arrows_shot: 0,
                crystals_collected: 0,
                survival_time: 0
            });

            spawnTimer = 0;
            enemiesSpawned = 0;
            waveComplete = false;
            waveTransitionTimer = 0;
        }

        function startWave(wave) {
            currentWave.value = wave;
            waveComplete = false;
            enemiesSpawned = 0;

            const isBossWave = wave % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0;

            if (isBossWave) {
                enemiesPerWave.value = 1;
                enemiesRemaining.value = 1;
                waveAnnouncement.value = `第 ${wave} 波 - 🐉 火龙BOSS来袭！`;
                spawnBoss();
            } else {
                enemiesPerWave.value = GAME_CONFIG.BASE_ENEMIES_PER_WAVE + Math.floor(wave / 2) * 2;
                enemiesRemaining.value = enemiesPerWave.value;
                waveAnnouncement.value = `第 ${wave} 波`;
            }

            setTimeout(() => {
                waveAnnouncement.value = '';
            }, 2000);
        }

        function spawnEnemy() {
            const canvas = gameCanvas.value;
            if (!canvas) return;

            const isElite = currentWave.value >= 3 && Math.random() < 0.15 + (currentWave.value * 0.01);
            const waveMultiplier = 1 + (currentWave.value - 1) * 0.1;

            const enemy = {
                x: canvas.width + 50,
                y: 100 + Math.random() * (canvas.height - 200),
                health: isElite ? 3 : 1,
                maxHealth: isElite ? 3 : 1,
                speed: (isElite ? 0.8 : 1.2) * waveMultiplier,
                frozen: false,
                frozenTimer: 0,
                freezeLevel: 0,
                hits: 0,
                isElite: isElite,
                size: isElite ? 35 : 25,
                active: true,
                wiggleOffset: Math.random() * Math.PI * 2
            };

            gameObjects.enemies.push(enemy);
            enemiesSpawned++;
        }

        function spawnBoss() {
            const canvas = gameCanvas.value;
            bossActive.value = true;
            bossMaxHealth.value = 50 + currentWave.value * 10;
            bossHealth.value = bossMaxHealth.value;

            gameObjects.boss = {
                x: canvas.width - 200,
                y: canvas.height / 2,
                targetY: canvas.height / 2,
                health: bossHealth.value,
                maxHealth: bossMaxHealth.value,
                active: true,
                fireballTimer: 0,
                invincible: false,
                invincibleTimer: 0,
                size: 80
            };
        }

        function spawnFireball() {
            const boss = gameObjects.boss;
            if (!boss) return;

            const player = gameObjects.player;
            const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

            const fireball = {
                x: boss.x - 50,
                y: boss.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                size: 30,
                active: true,
                health: 2
            };

            gameObjects.bossFireballs.push(fireball);
        }

        function spawnCrystal(x, y) {
            const crystal = {
                x: x,
                y: y,
                size: 15,
                active: true,
                pulsePhase: 0
            };

            gameObjects.crystals.push(crystal);
        }

        function createParticles(x, y, color, count, speed = 3) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * speed + 1;
                gameObjects.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    life: 1,
                    decay: 0.02 + Math.random() * 0.02,
                    color: color,
                    size: Math.random() * 4 + 2
                });
            }
        }

        function createHeatWave(x, y) {
            gameObjects.heatWaves.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: GAME_CONFIG.HEAT_WAVE_RADIUS,
                life: 1,
                active: true
            });

            checkHeatWaveEffect();
        }

        function checkHeatWaveEffect() {
            const player = gameObjects.player;
            if (!player) return;

            let inHeatWave = false;
            for (const hw of gameObjects.heatWaves) {
                if (!hw.active) continue;
                const dx = player.x - hw.x;
                const dy = player.y - hw.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < hw.maxRadius) {
                    inHeatWave = true;
                    break;
                }
            }

            heatWaveActive.value = inHeatWave;
        }

        function freezeEnemy(enemy) {
            if (enemy.isElite) {
                enemy.hits++;
                enemy.freezeLevel = enemy.hits / GAME_CONFIG.ELITE_HITS_REQUIRED;
                createParticles(enemy.x, enemy.y, '#87ceeb', 8);

                if (enemy.hits >= GAME_CONFIG.ELITE_HITS_REQUIRED) {
                    shatterEnemy(enemy);
                } else {
                    enemy.frozen = true;
                    enemy.frozenTimer = GAME_CONFIG.FREEZE_DURATION;
                }
            } else {
                if (enemy.frozen) {
                    shatterEnemy(enemy);
                } else {
                    enemy.frozen = true;
                    enemy.frozenTimer = GAME_CONFIG.FREEZE_DURATION;
                    enemy.freezeLevel = 1;
                    createParticles(enemy.x, enemy.y, '#87ceeb', 10);
                }
            }
        }

        function shatterEnemy(enemy) {
            enemy.active = false;
            const points = enemy.isElite ? 50 : 20;
            score.value += points * currentWave.value;
            finalStats.kills++;
            if (enemy.isElite) finalStats.elite_kills++;
            finalStats.damage_dealt += enemy.maxHealth * 10;

            createParticles(enemy.x, enemy.y, '#00ffff', 25, 5);
            createParticles(enemy.x, enemy.y, '#ffffff', 15, 3);
            createHeatWave(enemy.x, enemy.y);

            if (Math.random() < 0.3) {
                spawnCrystal(enemy.x, enemy.y);
            }

            enemiesRemaining.value = Math.max(0, enemiesRemaining.value - 1);

            if (enemiesRemaining.value <= 0 && !waveComplete) {
                waveComplete = true;
                waveTransitionTimer = 2000;
            }
        }

        function damageBoss(damage) {
            const boss = gameObjects.boss;
            if (!boss || !boss.active || boss.invincible) return;

            boss.health -= damage;
            bossHealth.value = boss.health;
            finalStats.damage_dealt += damage;

            createParticles(boss.x, boss.y, '#87ceeb', 15);

            if (boss.health <= 0) {
                killBoss();
            } else {
                boss.invincible = true;
                boss.invincibleTimer = 1000;
                bossActive.value = false;
                setTimeout(() => {
                    bossActive.value = true;
                }, 100);
            }
        }

        function killBoss() {
            const boss = gameObjects.boss;
            if (!boss) return;

            boss.active = false;
            gameObjects.boss = null;
            bossActive.value = false;

            score.value += 500 * currentWave.value;
            finalStats.boss_kills++;
            finalStats.damage_dealt += boss.maxHealth;

            createParticles(boss.x, boss.y, '#ff4400', 50, 8);
            createParticles(boss.x, boss.y, '#ffff00', 30, 5);
            createHeatWave(boss.x, boss.y);

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    spawnCrystal(
                        boss.x + (Math.random() - 0.5) * 200,
                        boss.y + (Math.random() - 0.5) * 200
                    );
                }, i * 100);
            }

            enemiesRemaining.value = 0;
            waveComplete = true;
            waveTransitionTimer = 3000;
        }

        function collectCrystal(crystal) {
            crystal.active = false;
            currentMana.value = Math.min(maxMana.value, currentMana.value + GAME_CONFIG.CRYSTAL_MANA);
            finalStats.crystals_collected++;
            createParticles(crystal.x, crystal.y, '#00ffff', 15, 4);
        }

        function update(deltaTime) {
            if (gameState.value !== 'playing') return;

            const dt = deltaTime / 16.67;
            const canvas = gameCanvas.value;
            if (!canvas) return;

            const player = gameObjects.player;
            player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
            player.drawTimer += deltaTime;

            if (!heatWaveActive.value) {
                currentMana.value = Math.min(maxMana.value, currentMana.value + (GAME_CONFIG.MANA_REGEN / 1000) * deltaTime);
            }

            updateArrows(dt);
            updateEnemies(deltaTime, dt);
            updateBoss(deltaTime, dt);
            updateBossFireballs(dt);
            updateCrystals(dt);
            updateParticles(dt);
            updateHeatWaves(deltaTime);

            if (!bossActive.value && !waveComplete && enemiesSpawned < enemiesPerWave.value) {
                spawnTimer -= deltaTime;
                if (spawnTimer <= 0) {
                    spawnEnemy();
                    spawnTimer = GAME_CONFIG.ENEMY_SPAWN_INTERVAL - Math.min(currentWave.value * 50, 500);
                }
            }

            if (waveComplete) {
                waveTransitionTimer -= deltaTime;
                if (waveTransitionTimer <= 0) {
                    const nextWave = currentWave.value + 1;
                    startWave(nextWave);
                }
            }

            checkHeatWaveEffect();
        }

        function updateArrows(dt) {
            const canvas = gameCanvas.value;

            for (let i = gameObjects.arrows.length - 1; i >= 0; i--) {
                const arrow = gameObjects.arrows[i];

                arrow.trail.unshift({ x: arrow.x, y: arrow.y });
                if (arrow.trail.length > GAME_CONFIG.ARROW_TRAIL_LENGTH) {
                    arrow.trail.pop();
                }

                arrow.x += arrow.vx * dt;
                arrow.y += arrow.vy * dt;

                if (arrow.x < -50 || arrow.x > canvas.width + 50 ||
                    arrow.y < -50 || arrow.y > canvas.height + 50) {
                    arrow.active = false;
                }

                for (const enemy of gameObjects.enemies) {
                    if (!enemy.active || !arrow.active) continue;

                    const dx = arrow.x - enemy.x;
                    const dy = arrow.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < enemy.size + 10) {
                        arrow.active = false;
                        freezeEnemy(enemy);
                        break;
                    }
                }

                for (let j = gameObjects.bossFireballs.length - 1; j >= 0; j--) {
                    const fireball = gameObjects.bossFireballs[j];
                    if (!fireball.active || !arrow.active) continue;

                    const dx = arrow.x - fireball.x;
                    const dy = arrow.y - fireball.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < fireball.size + 10) {
                        arrow.active = false;
                        fireball.health--;
                        createParticles(fireball.x, fireball.y, '#87ceeb', 8);

                        if (fireball.health <= 0) {
                            fireball.active = false;
                            createParticles(fireball.x, fireball.y, '#00ffff', 15, 4);
                            score.value += 10;
                        }
                        break;
                    }
                }

                if (arrow.active && gameObjects.boss && gameObjects.boss.active) {
                    const boss = gameObjects.boss;
                    const dx = arrow.x - boss.x;
                    const dy = arrow.y - boss.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < boss.size + 10) {
                        arrow.active = false;
                        if (!boss.invincible) {
                            damageBoss(5);
                        } else {
                            createParticles(arrow.x, arrow.y, '#888888', 5);
                        }
                    }
                }

                if (!arrow.active) {
                    gameObjects.arrows.splice(i, 1);
                }
            }
        }

        function updateEnemies(deltaTime, dt) {
            const player = gameObjects.player;

            for (let i = gameObjects.enemies.length - 1; i >= 0; i--) {
                const enemy = gameObjects.enemies[i];
                if (!enemy.active) {
                    gameObjects.enemies.splice(i, 1);
                    continue;
                }

                if (enemy.frozen) {
                    enemy.frozenTimer -= deltaTime;
                    if (enemy.frozenTimer <= 0) {
                        enemy.frozen = false;
                        enemy.freezeLevel = enemy.isElite ? enemy.hits / GAME_CONFIG.ELITE_HITS_REQUIRED : 0;
                    }
                }

                if (!enemy.frozen) {
                    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                    enemy.x += Math.cos(angle) * enemy.speed * dt;
                    enemy.wiggleOffset += 0.1 * dt;
                    enemy.y += Math.sin(enemy.wiggleOffset) * 0.5 * dt;

                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < enemy.size + 30) {
                        gameOver();
                        return;
                    }
                }
            }
        }

        function updateBoss(deltaTime, dt) {
            const boss = gameObjects.boss;
            if (!boss || !boss.active) return;

            const canvas = gameCanvas.value;

            if (Math.random() < 0.01) {
                boss.targetY = 100 + Math.random() * (canvas.height - 200);
            }

            const dy = boss.targetY - boss.y;
            boss.y += dy * 0.02 * dt;

            boss.fireballTimer -= deltaTime;
            if (boss.fireballTimer <= 0) {
                spawnFireball();
                boss.fireballTimer = 2500 - Math.min(currentWave.value * 50, 1000);
            }

            if (boss.invincible) {
                boss.invincibleTimer -= deltaTime;
                if (boss.invincibleTimer <= 0) {
                    boss.invincible = false;
                }
            }
        }

        function updateBossFireballs(dt) {
            const player = gameObjects.player;
            const canvas = gameCanvas.value;

            for (let i = gameObjects.bossFireballs.length - 1; i >= 0; i--) {
                const fireball = gameObjects.bossFireballs[i];
                if (!fireball.active) {
                    gameObjects.bossFireballs.splice(i, 1);
                    continue;
                }

                fireball.x += fireball.vx * dt;
                fireball.y += fireball.vy * dt;

                if (fireball.x < -50 || fireball.x > canvas.width + 50 ||
                    fireball.y < -50 || fireball.y > canvas.height + 50) {
                    fireball.active = false;
                    continue;
                }

                const dx = fireball.x - player.x;
                const dy = fireball.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < fireball.size + 30) {
                    fireball.active = false;
                    createParticles(player.x, player.y, '#ff4400', 30, 6);
                    gameOver();
                    return;
                }
            }
        }

        function updateCrystals(dt) {
            const player = gameObjects.player;

            for (let i = gameObjects.crystals.length - 1; i >= 0; i--) {
                const crystal = gameObjects.crystals[i];
                if (!crystal.active) {
                    gameObjects.crystals.splice(i, 1);
                    continue;
                }

                crystal.pulsePhase += 0.1 * dt;

                const dx = player.x - crystal.x;
                const dy = player.y - crystal.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    const pullSpeed = 3 * dt;
                    crystal.x += (dx / dist) * pullSpeed;
                    crystal.y += (dy / dist) * pullSpeed;
                }

                if (dist < 40) {
                    collectCrystal(crystal);
                }
            }
        }

        function updateParticles(dt) {
            for (let i = gameObjects.particles.length - 1; i >= 0; i--) {
                const p = gameObjects.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.life -= p.decay * dt;

                if (p.life <= 0) {
                    gameObjects.particles.splice(i, 1);
                }
            }
        }

        function updateHeatWaves(deltaTime) {
            for (let i = gameObjects.heatWaves.length - 1; i >= 0; i--) {
                const hw = gameObjects.heatWaves[i];
                hw.radius += 5;
                hw.life -= deltaTime / GAME_CONFIG.HEAT_WAVE_DURATION;

                if (hw.life <= 0 || hw.radius >= hw.maxRadius) {
                    hw.active = false;
                    gameObjects.heatWaves.splice(i, 1);
                }
            }
        }

        function render() {
            const canvas = gameCanvas.value;
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawBackground(canvas);
            drawIceWalls(canvas);
            drawHeatWaves();
            drawCrystals();
            drawEnemies();
            drawBoss();
            drawBossFireballs();
            drawArrows();
            drawPlayer();
            drawParticles();
            drawAimLine();
        }

        function drawBackground(canvas) {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a3a5c');
            gradient.addColorStop(0.5, '#2a5a8a');
            gradient.addColorStop(1, '#3a7aba');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 37) % canvas.width;
                const y = (i * 53) % canvas.height;
                const size = (i % 3) + 1;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(200, 220, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(0, canvas.height * 0.7);
            ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height * 0.5, canvas.width * 0.5, canvas.height * 0.65);
            ctx.quadraticCurveTo(canvas.width * 0.7, canvas.height * 0.55, canvas.width, canvas.height * 0.7);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.fill();
        }

        function drawIceWalls(canvas) {
            const leftWallGradient = ctx.createLinearGradient(0, 0, 80, 0);
            leftWallGradient.addColorStop(0, 'rgba(200, 230, 255, 0.9)');
            leftWallGradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.7)');
            leftWallGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
            ctx.fillStyle = leftWallGradient;
            ctx.fillRect(0, 0, 80, canvas.height);

            const rightWallGradient = ctx.createLinearGradient(canvas.width - 80, 0, canvas.width, 0);
            rightWallGradient.addColorStop(0, 'rgba(100, 180, 255, 0)');
            rightWallGradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.7)');
            rightWallGradient.addColorStop(1, 'rgba(200, 230, 255, 0.9)');
            ctx.fillStyle = rightWallGradient;
            ctx.fillRect(canvas.width - 80, 0, 80, canvas.height);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let y = 0; y < canvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(80, y + 20);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(canvas.width, y);
                ctx.lineTo(canvas.width - 80, y + 20);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 60;
                const y = Math.random() * canvas.height;
                const size = 5 + Math.random() * 10;
                drawIceCrystal(x, y, size, 0.6);

                const x2 = canvas.width - Math.random() * 60;
                const y2 = Math.random() * canvas.height;
                drawIceCrystal(x2, y2, size, 0.6);
            }
        }

        function drawIceCrystal(x, y, size, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(x, y);
            ctx.fillStyle = '#b0e0e6';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const px = Math.cos(angle) * size;
                const py = Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }

        function drawPlayer() {
            const player = gameObjects.player;
            if (!player) return;

            ctx.save();
            ctx.translate(player.x, player.y);

            const breathe = Math.sin(player.drawTimer * 0.005) * 2;

            ctx.fillStyle = '#2a4a6a';
            ctx.beginPath();
            ctx.ellipse(0, breathe + 20, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e8d4b8';
            ctx.beginPath();
            ctx.arc(0, breathe - 15, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4a7a9a';
            ctx.beginPath();
            ctx.arc(0, breathe - 20, 12, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1a3a5a';
            ctx.fillRect(-8, breathe - 10, 16, 8);

            ctx.save();
            ctx.rotate(player.angle);

            const bowGradient = ctx.createLinearGradient(0, -25, 0, 25);
            bowGradient.addColorStop(0, '#8b4513');
            bowGradient.addColorStop(0.5, '#cd853f');
            bowGradient.addColorStop(1, '#8b4513');
            ctx.strokeStyle = bowGradient;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(25, 0, 25, -Math.PI / 2.5, Math.PI / 2.5);
            ctx.stroke();

            ctx.strokeStyle = '#f5f5dc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(25, -22);
            ctx.lineTo(10, 0);
            ctx.lineTo(25, 22);
            ctx.stroke();

            ctx.fillStyle = '#8b4513';
            ctx.fillRect(10, -2, 35, 4);

            const arrowTipGradient = ctx.createLinearGradient(40, 0, 50, 0);
            arrowTipGradient.addColorStop(0, '#00ffff');
            arrowTipGradient.addColorStop(1, '#0088ff');
            ctx.fillStyle = arrowTipGradient;
            ctx.beginPath();
            ctx.moveTo(45, 0);
            ctx.lineTo(55, -5);
            ctx.lineTo(60, 0);
            ctx.lineTo(55, 5);
            ctx.closePath();
            ctx.fill();

            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(52, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
            ctx.restore();
        }

        function drawArrows() {
            for (const arrow of gameObjects.arrows) {
                if (!arrow.active) continue;

                for (let i = 0; i < arrow.trail.length; i++) {
                    const t = arrow.trail[i];
                    const alpha = (1 - i / arrow.trail.length) * 0.6;
                    const size = 4 * (1 - i / arrow.trail.length);

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#87ceeb';
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                ctx.save();
                ctx.translate(arrow.x, arrow.y);
                ctx.rotate(arrow.angle);

                ctx.fillStyle = '#0088ff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(10, -5);
                ctx.lineTo(15, 0);
                ctx.lineTo(10, 5);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.moveTo(10, -3);
                ctx.lineTo(18, 0);
                ctx.lineTo(10, 3);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#0088ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(-20, -4);
                ctx.moveTo(-10, 0);
                ctx.lineTo(-20, 4);
                ctx.stroke();

                ctx.restore();
            }
        }

        function drawEnemies() {
            for (const enemy of gameObjects.enemies) {
                if (!enemy.active) continue;

                ctx.save();
                ctx.translate(enemy.x, enemy.y);

                if (enemy.frozen) {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 20;
                }

                const bodyColor = enemy.isElite ? '#ff6600' : '#ff4444';
                const darkColor = enemy.isElite ? '#cc4400' : '#cc2222';

                if (enemy.freezeLevel > 0) {
                    const freezeAmount = enemy.freezeLevel;
                    const r = Math.floor(255 * (1 - freezeAmount * 0.7));
                    const g = Math.floor(68 + freezeAmount * 100);
                    const b = Math.floor(68 + freezeAmount * 150);
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                    ctx.fillStyle = bodyColor;
                }

                const size = enemy.size;
                const wiggle = enemy.frozen ? 0 : Math.sin(enemy.wiggleOffset) * 3;

                ctx.beginPath();
                ctx.ellipse(0, wiggle, size, size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = enemy.freezeLevel > 0 ?
                    `rgb(${Math.floor(204 * (1 - enemy.freezeLevel * 0.7))}, ${Math.floor(68 + enemy.freezeLevel * 100)}, ${Math.floor(68 + enemy.freezeLevel * 150)})` :
                    darkColor;
                ctx.beginPath();
                ctx.ellipse(-size * 0.7, wiggle - size * 0.2, size * 0.4, size * 0.35, -0.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(-size * 0.85, wiggle - size * 0.3, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(-size * 0.88, wiggle - size * 0.3, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = enemy.freezeLevel > 0 ?
                    `rgb(${Math.floor(255 * (1 - enemy.freezeLevel * 0.7))}, ${Math.floor(100 + enemy.freezeLevel * 80)}, ${Math.floor(0 + enemy.freezeLevel * 150)})` :
                    '#ff6600';
                for (let i = 0; i < 4; i++) {
                    const angle = Math.PI * 0.3 + (i / 4) * Math.PI * 0.4;
                    const bx = Math.cos(angle) * size * 0.3;
                    const by = Math.sin(angle) * size * 0.5 + wiggle;
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.lineTo(bx + Math.cos(angle) * 8, by + Math.sin(angle) * 8);
                    ctx.lineTo(bx + Math.cos(angle + 0.3) * 4, by + Math.sin(angle + 0.3) * 4);
                    ctx.closePath();
                    ctx.fill();
                }

                if (enemy.isElite) {
                    ctx.strokeStyle = '#ffcc00';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, wiggle, size + 5, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.fillStyle = '#ffcc00';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('★', 0, wiggle - size - 8);
                }

                if (enemy.frozen) {
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(angle) * (size + 5), Math.sin(angle) * (size + 5) + wiggle);
                        ctx.lineTo(Math.cos(angle) * (size + 15), Math.sin(angle) * (size + 15) + wiggle);
                        ctx.stroke();
                    }

                    ctx.fillStyle = 'rgba(176, 224, 230, 0.5)';
                    ctx.beginPath();
                    ctx.arc(0, wiggle, size + 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        function drawBoss() {
            const boss = gameObjects.boss;
            if (!boss || !boss.active) return;

            ctx.save();
            ctx.translate(boss.x, boss.y);

            const flicker = boss.invincible ? (Math.sin(Date.now() * 0.02) > 0 ? 0.5 : 1) : 1;
            ctx.globalAlpha = flicker;

            ctx.fillStyle = '#cc2200';
            ctx.beginPath();
            ctx.ellipse(0, 0, boss.size, boss.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.ellipse(-20, -20, boss.size * 0.6, boss.size * 0.5, -0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(-40, -25, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(-45, -25, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#cc2200';
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI * 0.6 + (i / 5) * Math.PI * 0.5;
                const hx = Math.cos(angle) * boss.size * 0.5;
                const hy = Math.sin(angle) * boss.size * 0.5 - 20;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.lineTo(hx - 20, hy - 30);
                ctx.lineTo(hx - 10, hy - 5);
                ctx.closePath();
                ctx.fill();
            }

            const wingFlap = Math.sin(Date.now() * 0.008) * 20;
            ctx.fillStyle = '#aa1100';
            ctx.beginPath();
            ctx.moveTo(20, -30);
            ctx.quadraticCurveTo(80, -80 + wingFlap, 100, -20 + wingFlap);
            ctx.quadraticCurveTo(80, 0 + wingFlap, 20, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(20, 30);
            ctx.quadraticCurveTo(80, 80 - wingFlap, 100, 20 - wingFlap);
            ctx.quadraticCurveTo(80, 0 - wingFlap, 20, 0);
            ctx.fill();

            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(60, -40 + wingFlap);
            ctx.lineTo(80, -30 + wingFlap);
            ctx.lineTo(70, -20 + wingFlap);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.moveTo(-boss.size * 0.8, 10);
            ctx.quadraticCurveTo(-boss.size * 1.2, 5, -boss.size * 1.4, 15);
            ctx.quadraticCurveTo(-boss.size * 1.6, 25, -boss.size * 1.8, 10);
            ctx.quadraticCurveTo(-boss.size * 2, -5, -boss.size * 2.2, 5);
            ctx.quadraticCurveTo(-boss.size * 2.4, 15, -boss.size * 2.2, 25);
            ctx.quadraticCurveTo(-boss.size * 2, 35, -boss.size * 1.8, 25);
            ctx.quadraticCurveTo(-boss.size * 1.6, 15, -boss.size * 1.4, 30);
            ctx.quadraticCurveTo(-boss.size * 1.2, 45, -boss.size * 0.8, 35);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(-boss.size * 2.3, 15, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(-boss.size * 2.3, 15, 6, 0, Math.PI * 2);
            ctx.fill();

            if (!boss.invincible) {
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 30;
            }

            ctx.restore();
        }

        function drawBossFireballs() {
            for (const fireball of gameObjects.bossFireballs) {
                if (!fireball.active) continue;

                ctx.save();
                ctx.translate(fireball.x, fireball.y);

                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 25;

                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fireball.size);
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(0.5, '#ff8800');
                gradient.addColorStop(1, '#ff0000');
                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.arc(0, 0, fireball.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-5, -5, fireball.size * 0.3, 0, Math.PI * 2);
                ctx.fill();

                const trailAngle = Math.atan2(fireball.vy, fireball.vx) + Math.PI;
                for (let i = 1; i <= 5; i++) {
                    const alpha = (1 - i / 5) * 0.6;
                    const size = fireball.size * (1 - i / 5);
                    const tx = Math.cos(trailAngle) * i * 8;
                    const ty = Math.sin(trailAngle) * i * 8;

                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#ff6600';
                    ctx.beginPath();
                    ctx.arc(tx, ty, size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        function drawCrystals() {
            for (const crystal of gameObjects.crystals) {
                if (!crystal.active) continue;

                ctx.save();
                ctx.translate(crystal.x, crystal.y);

                const pulse = 1 + Math.sin(crystal.pulsePhase) * 0.2;
                const size = crystal.size * pulse;

                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 20;

                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, '#00ffff');
                gradient.addColorStop(1, '#0066ff');
                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.7, -size * 0.3);
                ctx.lineTo(size * 0.7, size * 0.3);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.7, size * 0.3);
                ctx.lineTo(-size * 0.7, -size * 0.3);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.5);
                ctx.lineTo(size * 0.3, 0);
                ctx.lineTo(0, size * 0.3);
                ctx.lineTo(-size * 0.3, 0);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }
        }

        function drawParticles() {
            for (const p of gameObjects.particles) {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        function drawHeatWaves() {
            for (const hw of gameObjects.heatWaves) {
                if (!hw.active) continue;

                ctx.save();
                ctx.globalAlpha = hw.life * 0.3;

                const gradient = ctx.createRadialGradient(hw.x, hw.y, 0, hw.x, hw.y, hw.radius);
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
                gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.arc(hw.x, hw.y, hw.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(255, 150, 0, ${hw.life * 0.6})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(hw.x, hw.y, hw.radius * 0.8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        }

        function drawAimLine() {
            const player = gameObjects.player;
            if (!player) return;

            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(mouseX - 20, mouseY);
            ctx.lineTo(mouseX - 5, mouseY);
            ctx.moveTo(mouseX + 5, mouseY);
            ctx.lineTo(mouseX + 20, mouseY);
            ctx.moveTo(mouseX, mouseY - 20);
            ctx.lineTo(mouseX, mouseY - 5);
            ctx.moveTo(mouseX, mouseY + 5);
            ctx.lineTo(mouseX, mouseY + 20);
            ctx.stroke();

            ctx.restore();
        }

        function gameLoop(currentTime = 0) {
            if (gameState.value !== 'playing' && gameState.value !== 'paused') {
                return;
            }

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            if (gameState.value === 'playing') {
                update(Math.min(deltaTime, 50));
            }

            render();
            animationId = requestAnimationFrame(gameLoop);
        }

        function gameOver() {
            gameState.value = 'gameover';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }

            finalStats.wave = currentWave.value;
            finalStats.score = score.value;
            finalStats.survival_time = Math.floor((Date.now() - gameStartTime) / 1000);
        }

        async function saveAndRestart() {
            try {
                await fetch(`${API_BASE}/game/save/record`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        player_name: playerName.value || 'Anonymous',
                        wave: finalStats.wave,
                        score: finalStats.score,
                        kills: finalStats.kills,
                        elite_kills: finalStats.elite_kills,
                        boss_kills: finalStats.boss_kills,
                        damage_dealt: finalStats.damage_dealt,
                        arrows_shot: finalStats.arrows_shot,
                        crystals_collected: finalStats.crystals_collected,
                        survival_time: finalStats.survival_time,
                        is_victory: false
                    })
                });
            } catch (e) {
                console.error('Failed to save record:', e);
            }

            startGame();
        }

        function quitToMenu() {
            gameState.value = 'menu';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            loadStats();
        }

        function backToMenu() {
            gameState.value = 'menu';
        }

        function pauseGame() {
            if (gameState.value === 'playing') {
                gameState.value = 'paused';
            }
        }

        function resumeGame() {
            if (gameState.value === 'paused') {
                gameState.value = 'playing';
                lastTime = performance.now();
                gameLoop();
            }
        }

        async function showLeaderboard() {
            try {
                const response = await fetch(`${API_BASE}/game/get/top/scores?limit=20`);
                const data = await response.json();
                if (data.code === 0) {
                    leaderboard.value = data.data.items || [];
                }
            } catch (e) {
                console.error('Failed to load leaderboard:', e);
                leaderboard.value = [];
            }
            gameState.value = 'leaderboard';
        }

        function showHelp() {
            gameState.value = 'help';
        }

        async function loadStats() {
            try {
                const response = await fetch(`${API_BASE}/game/get/stats`);
                const data = await response.json();
                if (data.code === 0) {
                    stats.value = data.data;
                }
            } catch (e) {
                console.error('Failed to load stats:', e);
            }
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        function formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        }

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                if (gameState.value === 'playing') {
                    pauseGame();
                } else if (gameState.value === 'paused') {
                    resumeGame();
                }
            }
        }

        function handleResize() {
            if (gameCanvas.value) {
                gameCanvas.value.width = window.innerWidth;
                gameCanvas.value.height = window.innerHeight;
                if (gameObjects.player) {
                    gameObjects.player.y = window.innerHeight / 2;
                }
            }
        }

        onMounted(() => {
            loadStats();
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('resize', handleResize);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        return {
            gameCanvas,
            gameState,
            playerName,
            currentWave,
            score,
            enemiesRemaining,
            enemiesPerWave,
            currentMana,
            maxMana,
            manaPercent,
            heatWaveActive,
            waveAnnouncement,
            bossActive,
            bossHealthPercent,
            stats,
            leaderboard,
            finalStats,
            startGame,
            pauseGame,
            resumeGame,
            quitToMenu,
            backToMenu,
            showLeaderboard,
            showHelp,
            saveAndRestart,
            handleMouseMove,
            handleClick,
            formatTime,
            formatDate
        };
    }
}).mount('#app');

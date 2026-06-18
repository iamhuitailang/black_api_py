const { createApp, ref, computed, onMounted, onUnmounted, reactive } = Vue;

const TILE_SIZE = 32;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 60;
const PLAYER_SPEED = 120;
const CAMPFIRE_WARM_RADIUS = 150;
const BASE_TEMP_DROP_RATE = 2;
const BLIZZARD_TEMP_DROP_RATE = 8;
const CAMPFIRE_RECOVER_RATE = 15;
const DAY_DURATION = 60000;
const NIGHT_DURATION = 30000;
const BLIZZARD_CHANCE = 0.3;
const BLIZZARD_DURATION = 15000;
const BLIZZARD_INTERVAL = 45000;

const GAME_STATES = {
    EMPTY: 0,
    SNOW: 1,
    WOOD: 2,
    FOOD: 3,
    TREE: 4,
    ROCK: 5
};

createApp({
    setup() {
        const gameCanvas = ref(null);
        const canvasWidth = ref(900);
        const canvasHeight = ref(600);

        const playerName = ref('Survivor');
        const temperature = ref(100);
        const food = ref(5);
        const wood = ref(3);
        const campfireFuel = ref(100);
        const hasShelter = ref(false);
        const teammateCount = ref(0);
        const isBlizzard = ref(false);
        const gameOver = ref(false);
        const survivalTime = ref(0);
        const messages = ref([]);
        const timeOfDay = ref(0);

        const gameState = reactive({
            player: { x: 0, y: 0, dir: 'down' },
            campfire: { x: 0, y: 0 },
            shelter: { x: 0, y: 0, built: false },
            footprints: [],
            resources: [],
            npcs: [],
            map: [],
            keys: {},
            lastTime: 0,
            gameStartTime: 0,
            lastBlizzardTime: 0,
            blizzardEndTime: 0,
            dayNightTimer: 0,
            isNight: false,
            camera: { x: 0, y: 0 },
            particles: [],
            snowParticles: [],
            teammate: []
        });

        const isNearCampfire = computed(() => {
            const dx = gameState.player.x - gameState.campfire.x;
            const dy = gameState.player.y - gameState.campfire.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < CAMPFIRE_WARM_RADIUS;
        });

        const isNight = computed(() => gameState.isNight);

        const timeOfDayLabel = computed(() => {
            if (gameState.isNight) return '🌙 夜晚';
            return '☀️ 白天';
        });

        function addMessage(text, type = 'info') {
            messages.value.unshift({ text, type });
            if (messages.value.length > 20) {
                messages.value.pop();
            }
        }

        function initMap() {
            gameState.map = [];
            for (let y = 0; y < MAP_HEIGHT; y++) {
                gameState.map[y] = [];
                for (let x = 0; x < MAP_WIDTH; x++) {
                    gameState.map[y][x] = GAME_STATES.SNOW;
                }
            }

            const treeCount = 60;
            for (let i = 0; i < treeCount; i++) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);
                const cx = Math.floor(MAP_WIDTH / 2);
                const cy = Math.floor(MAP_HEIGHT / 2);
                const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                if (distFromCenter > 5) {
                    gameState.map[y][x] = GAME_STATES.TREE;
                }
            }

            const rockCount = 30;
            for (let i = 0; i < rockCount; i++) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);
                if (gameState.map[y][x] === GAME_STATES.SNOW) {
                    gameState.map[y][x] = GAME_STATES.ROCK;
                }
            }

            gameState.resources = [];
            for (let i = 0; i < 20; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * MAP_WIDTH);
                    y = Math.floor(Math.random() * MAP_HEIGHT);
                } while (gameState.map[y][x] !== GAME_STATES.SNOW);
                gameState.resources.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    type: Math.random() > 0.5 ? 'wood' : 'food',
                    amount: 1
                });
            }

            gameState.npcs = [];
            for (let i = 0; i < 3; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * MAP_WIDTH);
                    y = Math.floor(Math.random() * MAP_HEIGHT);
                } while (gameState.map[y][x] !== GAME_STATES.SNOW);
                gameState.npcs.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    active: true,
                    recruited: false,
                    wanderTimer: 0,
                    wanderDir: { x: 0, y: 0 }
                });
            }
        }

        function initGame() {
            gameState.player.x = MAP_WIDTH * TILE_SIZE / 2;
            gameState.player.y = MAP_HEIGHT * TILE_SIZE / 2;
            gameState.campfire.x = gameState.player.x;
            gameState.campfire.y = gameState.player.y + TILE_SIZE * 2;
            gameState.shelter.x = gameState.player.x + TILE_SIZE * 3;
            gameState.shelter.y = gameState.player.y;
            gameState.shelter.built = false;
            gameState.footprints = [];
            gameState.particles = [];
            gameState.snowParticles = [];
            gameState.teammate = [];
            gameState.isNight = false;
            gameState.dayNightTimer = 0;
            gameState.lastBlizzardTime = 0;
            gameState.gameStartTime = Date.now();

            temperature.value = 100;
            food.value = 5;
            wood.value = 3;
            campfireFuel.value = 100;
            hasShelter.value = false;
            teammateCount.value = 0;
            isBlizzard.value = false;
            gameOver.value = false;
            survivalTime.value = 0;
            messages.value = [];

            initMap();
            initSnowParticles();
            addMessage('你在冰原醒来，只有一堆篝火和几根火柴...', 'info');
            addMessage('搜集木材维持篝火，狩猎获取食物，搭建庇护所', 'info');
        }

        function initSnowParticles() {
            gameState.snowParticles = [];
            for (let i = 0; i < 100; i++) {
                gameState.snowParticles.push({
                    x: Math.random() * canvasWidth.value,
                    y: Math.random() * canvasHeight.value,
                    speed: 30 + Math.random() * 50,
                    size: 1 + Math.random() * 3
                });
            }
        }

        function updateSnowParticles(deltaTime) {
            const speedMult = isBlizzard.value ? 3 : 1;
            for (let p of gameState.snowParticles) {
                p.y += p.speed * speedMult * deltaTime;
                p.x += (isBlizzard.value ? 80 : 20) * deltaTime;
                if (p.y > canvasHeight.value) {
                    p.y = -10;
                    p.x = Math.random() * canvasWidth.value;
                }
                if (p.x > canvasWidth.value + 20) {
                    p.x = -10;
                }
            }
        }

        function canMoveTo(x, y) {
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
                return false;
            }
            const tile = gameState.map[tileY][tileX];
            return tile !== GAME_STATES.TREE && tile !== GAME_STATES.ROCK;
        }

        function updatePlayer(deltaTime) {
            let dx = 0, dy = 0;
            const speed = PLAYER_SPEED * (isBlizzard.value ? 0.6 : 1);

            if (gameState.keys['w'] || gameState.keys['arrowup']) {
                dy -= speed * deltaTime;
                gameState.player.dir = 'up';
            }
            if (gameState.keys['s'] || gameState.keys['arrowdown']) {
                dy += speed * deltaTime;
                gameState.player.dir = 'down';
            }
            if (gameState.keys['a'] || gameState.keys['arrowleft']) {
                dx -= speed * deltaTime;
                gameState.player.dir = 'left';
            }
            if (gameState.keys['d'] || gameState.keys['arrowright']) {
                dx += speed * deltaTime;
                gameState.player.dir = 'right';
            }

            if (dx !== 0 && dy !== 0) {
                const factor = 0.707;
                dx *= factor;
                dy *= factor;
            }

            const newX = gameState.player.x + dx;
            const newY = gameState.player.y + dy;

            if (canMoveTo(newX, gameState.player.y)) {
                gameState.player.x = newX;
            }
            if (canMoveTo(gameState.player.x, newY)) {
                gameState.player.y = newY;
            }

            if (dx !== 0 || dy !== 0) {
                if (Math.random() < 0.15) {
                    gameState.footprints.push({
                        x: gameState.player.x,
                        y: gameState.player.y,
                        time: Date.now(),
                        fadeTime: isBlizzard.value ? 3000 : 20000
                    });
                }
            }

            gameState.player.x = Math.max(TILE_SIZE / 2, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE / 2, gameState.player.x));
            gameState.player.y = Math.max(TILE_SIZE / 2, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE / 2, gameState.player.y));

            gameState.camera.x = gameState.player.x - canvasWidth.value / 2;
            gameState.camera.y = gameState.player.y - canvasHeight.value / 2;
        }

        function updateFootprints(deltaTime) {
            const now = Date.now();
            gameState.footprints = gameState.footprints.filter(fp => {
                const age = now - fp.time;
                const fadeRate = isBlizzard.value ? 3 : 1;
                return age < fp.fadeTime / fadeRate;
            });
        }

        function updateTemperature(deltaTime) {
            if (gameOver.value) return;

            const near = isNearCampfire.value;
            const inShelter = hasShelter.value && isNearShelter();
            const nightPenalty = gameState.isNight ? 1.5 : 1;
            const blizzardPenalty = isBlizzard.value ? 2.5 : 1;

            if (near) {
                const recoverRate = CAMPFIRE_RECOVER_RATE * (campfireFuel.value > 0 ? 1 : 0.3);
                temperature.value = Math.min(100, temperature.value + recoverRate * deltaTime);
            } else {
                let dropRate = BASE_TEMP_DROP_RATE * nightPenalty * blizzardPenalty;
                if (inShelter) dropRate *= 0.5;
                if (hasShelter.value && isNearShelter()) dropRate *= 0.7;
                temperature.value = Math.max(0, temperature.value - dropRate * deltaTime);
            }

            if (temperature.value <= 0) {
                gameOver.value = true;
                survivalTime.value = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
                addMessage('你的体温降到了零度...', 'danger');
            }

            if (temperature.value < 20 && temperature.value > 19) {
                addMessage('体温过低！快回到篝火边！', 'danger');
            }
        }

        function isNearShelter() {
            if (!hasShelter.value) return false;
            const dx = gameState.player.x - gameState.shelter.x;
            const dy = gameState.player.y - gameState.shelter.y;
            return Math.sqrt(dx * dx + dy * dy) < 80;
        }

        function updateCampfire(deltaTime) {
            const burnRate = gameState.isNight ? 1.5 : 1;
            const teamMult = 1 + teammateCount.value * 0.5;
            campfireFuel.value = Math.max(0, campfireFuel.value - 2 * burnRate * teamMult * deltaTime);

            if (campfireFuel.value > 0 && Math.random() < 0.3) {
                gameState.particles.push({
                    x: gameState.campfire.x + (Math.random() - 0.5) * 20,
                    y: gameState.campfire.y - 10,
                    vy: -30 - Math.random() * 20,
                    life: 1,
                    size: 3 + Math.random() * 5,
                    color: `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%)`
                });
            }

            gameState.particles = gameState.particles.filter(p => {
                p.y += p.vy * deltaTime;
                p.life -= deltaTime;
                return p.life > 0;
            });
        }

        function updateDayNight(deltaTime) {
            gameState.dayNightTimer += deltaTime * 1000;
            
            if (gameState.isNight) {
                if (gameState.dayNightTimer >= NIGHT_DURATION) {
                    gameState.isNight = false;
                    gameState.dayNightTimer = 0;
                    addMessage('天亮了，阳光稍微温暖一些', 'info');
                }
            } else {
                if (gameState.dayNightTimer >= DAY_DURATION) {
                    gameState.isNight = true;
                    gameState.dayNightTimer = 0;
                    addMessage('夜幕降临，气温骤降！', 'warning');
                }
            }
        }

        function updateBlizzard(deltaTime) {
            const now = Date.now();
            
            if (!isBlizzard.value) {
                if (now - gameState.lastBlizzardTime > BLIZZARD_INTERVAL && Math.random() < 0.001) {
                    isBlizzard.value = true;
                    gameState.blizzardEndTime = now + BLIZZARD_DURATION;
                    addMessage('暴风雪来了！视野缩小，体温下降更快！', 'warning');
                }
            } else {
                if (now > gameState.blizzardEndTime) {
                    isBlizzard.value = false;
                    gameState.lastBlizzardTime = now;
                    addMessage('暴风雪停了', 'info');
                }
            }
        }

        function updateNPCs(deltaTime) {
            for (let npc of gameState.npcs) {
                if (!npc.active || npc.recruited) continue;

                npc.wanderTimer -= deltaTime;
                if (npc.wanderTimer <= 0) {
                    npc.wanderTimer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    npc.wanderDir = {
                        x: Math.cos(angle) * 30,
                        y: Math.sin(angle) * 30
                    };
                }

                const newX = npc.x + npc.wanderDir.x * deltaTime;
                const newY = npc.y + npc.wanderDir.y * deltaTime;

                if (canMoveTo(newX, npc.y)) npc.x = newX;
                if (canMoveTo(npc.x, newY)) npc.y = newY;

                npc.x = Math.max(TILE_SIZE, Math.min((MAP_WIDTH - 1) * TILE_SIZE, npc.x));
                npc.y = Math.max(TILE_SIZE, Math.min((MAP_HEIGHT - 1) * TILE_SIZE, npc.y));
            }
        }

        function updateTeammates(deltaTime) {
            const recruited = gameState.npcs.filter(n => n.recruited);
            for (let npc of recruited) {
                const dx = gameState.player.x - npc.x;
                const dy = gameState.player.y - npc.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 50) {
                    const speed = 80 * (isBlizzard.value ? 0.6 : 1);
                    npc.x += (dx / dist) * speed * deltaTime;
                    npc.y += (dy / dist) * speed * deltaTime;
                }
            }
        }

        function updateFood(deltaTime) {
            if (gameOver.value) return;
            
            if (Math.random() < 0.002 * (1 + teammateCount.value * 0.5)) {
                if (food.value > 0) {
                    food.value--;
                    if (food.value === 0) {
                        addMessage('食物吃完了！快去寻找食物吧', 'warning');
                    }
                } else {
                    temperature.value = Math.max(0, temperature.value - 5 * deltaTime);
                }
            }
        }

        function tryCollect() {
            for (let i = gameState.resources.length - 1; i >= 0; i--) {
                const res = gameState.resources[i];
                const dx = gameState.player.x - res.x;
                const dy = gameState.player.y - res.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    if (res.type === 'wood') {
                        wood.value += res.amount;
                        addMessage(`获得 ${res.amount} 木材`, 'success');
                    } else {
                        food.value += res.amount;
                        addMessage(`获得 ${res.amount} 食物`, 'success');
                    }
                    gameState.resources.splice(i, 1);
                    return;
                }
            }

            const tileX = Math.floor(gameState.player.x / TILE_SIZE);
            const tileY = Math.floor(gameState.player.y / TILE_SIZE);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = tileX + dx;
                    const ty = tileY + dy;
                    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                        if (gameState.map[ty][tx] === GAME_STATES.TREE) {
                            gameState.map[ty][tx] = GAME_STATES.SNOW;
                            wood.value += 2;
                            addMessage('砍倒了一棵树，获得 2 木材', 'success');
                            return;
                        }
                    }
                }
            }

            for (let npc of gameState.npcs) {
                if (npc.active && !npc.recruited) {
                    const dx = gameState.player.x - npc.x;
                    const dy = gameState.player.y - npc.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 50) {
                        npc.recruited = true;
                        teammateCount.value++;
                        addMessage('遇到了另一位幸存者，你们组队了！', 'success');
                        addMessage('注意：组队后食物和篝火消耗增加', 'warning');
                        return;
                    }
                }
            }
        }

        function tryBuildShelter() {
            if (hasShelter.value) {
                addMessage('你已经有庇护所了', 'warning');
                return;
            }
            if (wood.value < 5) {
                addMessage('需要 5 木材才能搭建庇护所', 'warning');
                return;
            }
            wood.value -= 5;
            gameState.shelter.x = gameState.player.x;
            gameState.shelter.y = gameState.player.y;
            gameState.shelter.built = true;
            hasShelter.value = true;
            addMessage('搭建了简易庇护所！可以稍微抵御风寒', 'success');
        }

        function tryAddWood() {
            const dx = gameState.player.x - gameState.campfire.x;
            const dy = gameState.player.y - gameState.campfire.y;
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                if (wood.value > 0) {
                    wood.value--;
                    campfireFuel.value = Math.min(100, campfireFuel.value + 20);
                    addMessage('给篝火添加了木材', 'success');
                } else {
                    addMessage('你没有木材了', 'warning');
                }
            } else {
                addMessage('你需要靠近篝火才能添加木材', 'warning');
            }
        }

        function render() {
            const canvas = gameCanvas.value;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

            const camX = gameState.camera.x;
            const camY = gameState.camera.y;

            ctx.fillStyle = '#d4e8f5';
            ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

            const startTileX = Math.max(0, Math.floor(camX / TILE_SIZE));
            const startTileY = Math.max(0, Math.floor(camY / TILE_SIZE));
            const endTileX = Math.min(MAP_WIDTH, Math.ceil((camX + canvasWidth.value) / TILE_SIZE) + 1);
            const endTileY = Math.min(MAP_HEIGHT, Math.ceil((camY + canvasHeight.value) / TILE_SIZE) + 1);

            for (let y = startTileY; y < endTileY; y++) {
                for (let x = startTileX; x < endTileX; x++) {
                    const screenX = x * TILE_SIZE - camX;
                    const screenY = y * TILE_SIZE - camY;
                    const tile = gameState.map[y][x];

                    ctx.fillStyle = '#e8f4fc';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                    if (tile === GAME_STATES.TREE) {
                        ctx.fillStyle = '#2d5a3d';
                        ctx.beginPath();
                        ctx.moveTo(screenX + TILE_SIZE / 2, screenY + 2);
                        ctx.lineTo(screenX + 4, screenY + TILE_SIZE - 4);
                        ctx.lineTo(screenX + TILE_SIZE - 4, screenY + TILE_SIZE - 4);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#5d4037';
                        ctx.fillRect(screenX + TILE_SIZE / 2 - 3, screenY + TILE_SIZE - 10, 6, 8);
                    } else if (tile === GAME_STATES.ROCK) {
                        ctx.fillStyle = '#8899aa';
                        ctx.beginPath();
                        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4, 12, 10, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#aabbcc';
                        ctx.beginPath();
                        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10, 8, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            for (let fp of gameState.footprints) {
                const age = Date.now() - fp.time;
                const alpha = Math.max(0, 1 - age / fp.fadeTime);
                if (alpha > 0) {
                    ctx.fillStyle = `rgba(150, 170, 190, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(fp.x - camX, fp.y - camY, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            for (let res of gameState.resources) {
                const screenX = res.x - camX;
                const screenY = res.y - camY;
                
                if (res.type === 'wood') {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(screenX - 8, screenY - 3, 16, 6);
                    ctx.fillRect(screenX - 6, screenY - 8, 12, 5);
                } else {
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.ellipse(screenX, screenY, 8, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🍖', screenX, screenY + 3);
                }
            }

            for (let npc of gameState.npcs) {
                if (!npc.active) continue;
                const screenX = npc.x - camX;
                const screenY = npc.y - camY;
                
                ctx.fillStyle = npc.recruited ? '#3498db' : '#9b59b6';
                ctx.beginPath();
                ctx.arc(screenX, screenY - 5, 10, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#f5deb3';
                ctx.beginPath();
                ctx.arc(screenX, screenY - 15, 6, 0, Math.PI * 2);
                ctx.fill();

                if (!npc.recruited) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', screenX, screenY - 20);
                }
            }

            if (hasShelter.value) {
                const sx = gameState.shelter.x - camX;
                const sy = gameState.shelter.y - camY;
                
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(sx - 25, sy + 15);
                ctx.lineTo(sx, sy - 20);
                ctx.lineTo(sx + 25, sy + 15);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#654321';
                ctx.fillRect(sx - 20, sy + 15, 40, 15);
                
                ctx.fillStyle = '#3d2817';
                ctx.fillRect(sx - 5, sy + 10, 10, 20);
            }

            const cfX = gameState.campfire.x - camX;
            const cfY = gameState.campfire.y - camY;

            const gradient = ctx.createRadialGradient(cfX, cfY, 0, cfX, cfY, CAMPFIRE_WARM_RADIUS);
            const fireIntensity = campfireFuel.value > 0 ? 0.4 : 0.1;
            gradient.addColorStop(0, `rgba(255, 180, 80, ${fireIntensity})`);
            gradient.addColorStop(0.5, `rgba(255, 140, 50, ${fireIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cfX, cfY, CAMPFIRE_WARM_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#654321';
            ctx.fillRect(cfX - 15, cfY + 5, 30, 6);
            ctx.fillRect(cfX - 12, cfY + 2, 24, 5);

            if (campfireFuel.value > 0) {
                const flicker = Math.sin(Date.now() / 100) * 2;
                
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.moveTo(cfX - 8, cfY + 2);
                ctx.quadraticCurveTo(cfX - 5 + flicker, cfY - 15, cfX, cfY - 20 + flicker);
                ctx.quadraticCurveTo(cfX + 5 - flicker, cfY - 15, cfX + 8, cfY + 2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.moveTo(cfX - 4, cfY);
                ctx.quadraticCurveTo(cfX - 2 + flicker, cfY - 10, cfX, cfY - 15 + flicker);
                ctx.quadraticCurveTo(cfX + 2 - flicker, cfY - 10, cfX + 4, cfY);
                ctx.closePath();
                ctx.fill();
            }

            for (let p of gameState.particles) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x - camX, p.y - camY, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            const px = gameState.player.x - camX;
            const py = gameState.player.y - camY;

            ctx.fillStyle = '#c0392b';
            ctx.fillRect(px - 8, py - 5, 16, 20);
            
            ctx.fillStyle = '#f5deb3';
            ctx.beginPath();
            ctx.arc(px, py - 12, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(px - 9, py - 18, 18, 5);
            ctx.fillRect(px - 6, py - 22, 12, 6);

            const nightAlpha = gameState.isNight ? 0.4 : 0;
            if (nightAlpha > 0) {
                ctx.fillStyle = `rgba(10, 20, 50, ${nightAlpha})`;
                ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
                
                const playerLight = ctx.createRadialGradient(px, py, 0, px, py, 120);
                playerLight.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
                playerLight.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = playerLight;
                ctx.beginPath();
                ctx.arc(px, py, 120, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';

                if (campfireFuel.value > 0) {
                    const fireLight = ctx.createRadialGradient(cfX, cfY, 0, cfX, cfY, CAMPFIRE_WARM_RADIUS * 1.5);
                    fireLight.addColorStop(0, 'rgba(255, 150, 50, 0.5)');
                    fireLight.addColorStop(1, 'rgba(255, 100, 50, 0)');
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = fireLight;
                    ctx.beginPath();
                    ctx.arc(cfX, cfY, CAMPFIRE_WARM_RADIUS * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                }
            }

            if (isBlizzard.value) {
                ctx.fillStyle = 'rgba(180, 200, 220, 0.3)';
                ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

                const viewRadius = 150;
                const fogGradient = ctx.createRadialGradient(px, py, viewRadius * 0.5, px, py, viewRadius);
                fogGradient.addColorStop(0, 'rgba(200, 220, 240, 0)');
                fogGradient.addColorStop(1, 'rgba(180, 200, 220, 0.7)');
                ctx.fillStyle = fogGradient;
                ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
            }

            ctx.fillStyle = '#fff';
            for (let p of gameState.snowParticles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            if (temperature.value < 30) {
                const frostAlpha = (30 - temperature.value) / 30 * 0.5;
                ctx.strokeStyle = `rgba(200, 220, 255, ${frostAlpha})`;
                ctx.lineWidth = 30;
                ctx.strokeRect(15, 15, canvasWidth.value - 30, canvasHeight.value - 30);
            }
        }

        function gameLoop(timestamp) {
            if (gameState.lastTime === 0) {
                gameState.lastTime = timestamp;
            }
            const deltaTime = Math.min(0.1, (timestamp - gameState.lastTime) / 1000);
            gameState.lastTime = timestamp;

            if (!gameOver.value) {
                updatePlayer(deltaTime);
                updateFootprints(deltaTime);
                updateTemperature(deltaTime);
                updateCampfire(deltaTime);
                updateDayNight(deltaTime);
                updateBlizzard(deltaTime);
                updateNPCs(deltaTime);
                updateTeammates(deltaTime);
                updateFood(deltaTime);
                updateSnowParticles(deltaTime);
            }

            render();
            requestAnimationFrame(gameLoop);
        }

        function handleKeyDown(e) {
            const key = e.key.toLowerCase();
            gameState.keys[key] = true;

            if (key === ' ') {
                e.preventDefault();
                tryCollect();
            }
            if (key === 'b') {
                tryBuildShelter();
            }
            if (key === 'e') {
                tryAddWood();
            }
        }

        function handleKeyUp(e) {
            const key = e.key.toLowerCase();
            gameState.keys[key] = false;
        }

        function onCanvasClick(e) {
        }

        async function saveGame() {
            if (!playerName.value.trim()) {
                addMessage('请输入玩家名', 'warning');
                return;
            }

            const gameData = {
                player: { x: gameState.player.x, y: gameState.player.y },
                campfire: { x: gameState.campfire.x, y: gameState.campfire.y },
                shelter: { ...gameState.shelter },
                temperature: temperature.value,
                food: food.value,
                wood: wood.value,
                campfireFuel: campfireFuel.value,
                hasShelter: hasShelter.value,
                teammateCount: teammateCount.value,
                isNight: gameState.isNight,
                dayNightTimer: gameState.dayNightTimer,
                resources: gameState.resources,
                npcs: gameState.npcs,
                map: gameState.map,
                footprints: gameState.footprints,
                survivalTime: (Date.now() - gameState.gameStartTime) / 1000
            };

            try {
                const response = await fetch('/api/game/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        player_name: playerName.value,
                        game_data: gameData
                    })
                });
                const result = await response.json();
                if (result.code === 0) {
                    addMessage('游戏已保存', 'success');
                } else {
                    addMessage('保存失败: ' + result.message, 'danger');
                }
            } catch (err) {
                addMessage('保存失败: 网络错误', 'danger');
            }
        }

        async function loadGame() {
            if (!playerName.value.trim()) {
                addMessage('请输入玩家名', 'warning');
                return;
            }

            try {
                const response = await fetch(`/api/game/get?player_name=${encodeURIComponent(playerName.value)}`);
                const result = await response.json();
                if (result.code === 0 && result.data) {
                    const data = result.data.game_data;
                    
                    gameState.player.x = data.player.x;
                    gameState.player.y = data.player.y;
                    gameState.campfire.x = data.campfire.x;
                    gameState.campfire.y = data.campfire.y;
                    gameState.shelter = { ...data.shelter };
                    temperature.value = data.temperature;
                    food.value = data.food;
                    wood.value = data.wood;
                    campfireFuel.value = data.campfireFuel;
                    hasShelter.value = data.hasShelter;
                    teammateCount.value = data.teammateCount;
                    gameState.isNight = data.isNight;
                    gameState.dayNightTimer = data.dayNightTimer || 0;
                    gameState.resources = data.resources || [];
                    gameState.npcs = data.npcs || [];
                    gameState.map = data.map || [];
                    gameState.footprints = [];
                    gameState.gameStartTime = Date.now() - (data.survivalTime || 0) * 1000;
                    gameOver.value = false;
                    
                    addMessage('存档已读取', 'success');
                } else {
                    addMessage('未找到存档', 'warning');
                }
            } catch (err) {
                addMessage('读取失败: 网络错误', 'danger');
            }
        }

        function newGame() {
            initGame();
            addMessage('新游戏开始！祝你好运！', 'success');
        }

        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            initGame();
            requestAnimationFrame(gameLoop);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        });

        return {
            gameCanvas,
            canvasWidth,
            canvasHeight,
            playerName,
            temperature,
            food,
            wood,
            campfireFuel,
            hasShelter,
            teammateCount,
            isBlizzard,
            gameOver,
            survivalTime,
            messages,
            timeOfDayLabel,
            isNight,
            isNearCampfire,
            onCanvasClick,
            saveGame,
            loadGame,
            newGame
        };
    }
}).mount('#app');

const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

createApp({
    setup() {
        const gameState = ref('menu');
        const showHelp = ref(false);
        const showWanted = ref(true);

        const currentLevel = ref(1);
        const maxLevels = 5;
        const totalScore = ref(0);
        const levelScore = ref(0);

        const playerHealth = ref(100);
        const playerX = ref(100);
        const playerY = ref(100);
        const playerCrouching = ref(false);
        const playerSpeed = 8;

        const weapons = ref([
            { id: 1, name: '左轮手枪', sprite: '🔫', damage: 25, maxAmmo: 6, fireRate: 400, spread: 0, pellets: 1 },
            { id: 2, name: '散弹枪', sprite: '💥', damage: 15, maxAmmo: 2, fireRate: 800, spread: 15, pellets: 5 }
        ]);
        const currentWeaponIndex = ref(0);
        const currentAmmo = ref(6);
        const isReloading = ref(false);
        const lastFireTime = ref(0);
        const gunAngle = ref(0);

        const currentWeapon = computed(() => weapons.value[currentWeaponIndex.value]);

        const bandits = ref([
            { id: 1, name: '独眼杰克', face: '😈', reward: 500, health: 100 },
            { id: 2, name: '疤面比利', face: '👿', reward: 800, health: 150 },
            { id: 3, name: '黑胡子', face: '😡', reward: 1200, health: 200 },
            { id: 4, name: '疯狗麦克', face: '🤬', reward: 1800, health: 250 },
            { id: 5, name: '死神乔', face: '👹', reward: 3000, health: 400 }
        ]);

        const enemies = ref([]);
        const bullets = ref([]);
        const shootEffects = ref([]);
        const covers = ref([]);

        const mouseX = ref(0);
        const mouseY = ref(0);
        const gameCanvas = ref(null);

        const keys = reactive({});
        let gameLoop = null;
        let bulletId = 0;
        let enemyId = 0;
        let effectId = 0;

        const STORAGE_KEY = 'wild_west_sheriff_save';

        function saveGame() {
            const saveData = {
                gameState: gameState.value,
                currentLevel: currentLevel.value,
                totalScore: totalScore.value,
                levelScore: levelScore.value,
                playerHealth: playerHealth.value,
                playerX: playerX.value,
                playerY: playerY.value,
                playerCrouching: playerCrouching.value,
                currentWeaponIndex: currentWeaponIndex.value,
                currentAmmo: currentAmmo.value,
                enemies: enemies.value.map(e => ({
                    id: e.id,
                    face: e.face,
                    x: e.x,
                    y: e.y,
                    health: e.health,
                    maxHealth: e.maxHealth,
                    damage: e.damage,
                    fireRate: e.fireRate,
                    lastFire: e.lastFire,
                    reward: e.reward,
                    isBoss: e.isBoss,
                    name: e.name
                })),
                covers: covers.value
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        }

        function loadGame() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.gameState === 'playing' || data.gameState === 'paused') {
                        gameState.value = 'menu';
                        currentLevel.value = data.currentLevel;
                        totalScore.value = data.totalScore;
                        return true;
                    }
                } catch (e) {
                    console.error('加载存档失败', e);
                }
            }
            return false;
        }

        function clearSave() {
            localStorage.removeItem(STORAGE_KEY);
        }

        function initLevel(keepHealth = false) {
            if (!keepHealth) {
                playerHealth.value = 100;
            }
            playerX.value = 100;
            playerY.value = 100;
            playerCrouching.value = false;
            currentAmmo.value = currentWeapon.value.maxAmmo;
            isReloading.value = false;
            bullets.value = [];
            shootEffects.value = [];
            levelScore.value = 0;

            initCovers();
            initEnemies();
        }

        function initCovers() {
            const canvasWidth = window.innerWidth;
            covers.value = [
                { id: 1, type: 'barrel', sprite: '🛢️', x: canvasWidth * 0.15, y: 80, width: 60, height: 80 },
                { id: 2, type: 'wagon', sprite: '🚃', x: canvasWidth * 0.3, y: 60, width: 120, height: 100 },
                { id: 3, type: 'rock', sprite: '🪨', x: canvasWidth * 0.5, y: 70, width: 80, height: 90 },
                { id: 4, type: 'barrel', sprite: '🛢️', x: canvasWidth * 0.65, y: 80, width: 60, height: 80 }
            ];
        }

        function initEnemies() {
            enemies.value = [];
            const canvasWidth = window.innerWidth;
            const canvasHeight = window.innerHeight;

            const levelConfig = getLevelConfig(currentLevel.value);
            const baseY = canvasHeight * 0.35;

            const minionFaces = ['😠', '😤', '😡', '🤬'];
            for (let i = 0; i < levelConfig.minions; i++) {
                enemies.value.push({
                    id: ++enemyId,
                    face: minionFaces[Math.floor(Math.random() * minionFaces.length)],
                    x: canvasWidth * (0.5 + Math.random() * 0.4),
                    y: baseY + Math.random() * 100,
                    health: levelConfig.minionHealth,
                    maxHealth: levelConfig.minionHealth,
                    damage: levelConfig.minionDamage,
                    fireRate: levelConfig.minionFireRate,
                    lastFire: 0,
                    reward: levelConfig.minionReward,
                    isBoss: false,
                    hit: false
                });
            }

            const bossBandit = bandits.value[currentLevel.value - 1];
            enemies.value.push({
                id: ++enemyId,
                face: bossBandit.face,
                x: canvasWidth * 0.85,
                y: baseY + 50,
                health: bossBandit.health * (1 + (currentLevel.value - 1) * 0.2),
                maxHealth: bossBandit.health * (1 + (currentLevel.value - 1) * 0.2),
                damage: 20 + currentLevel.value * 5,
                fireRate: Math.max(800, 1500 - currentLevel.value * 100),
                lastFire: 0,
                reward: bossBandit.reward,
                isBoss: true,
                hit: false,
                name: bossBandit.name
            });
        }

        function getLevelConfig(level) {
            const configs = {
                1: { minions: 2, minionHealth: 50, minionDamage: 8, minionFireRate: 2000, minionReward: 50 },
                2: { minions: 3, minionHealth: 60, minionDamage: 10, minionFireRate: 1800, minionReward: 75 },
                3: { minions: 4, minionHealth: 70, minionDamage: 12, minionFireRate: 1600, minionReward: 100 },
                4: { minions: 5, minionHealth: 80, minionDamage: 15, minionFireRate: 1400, minionReward: 125 },
                5: { minions: 6, minionHealth: 100, minionDamage: 18, minionFireRate: 1200, minionReward: 150 }
            };
            return configs[level] || configs[1];
        }

        function startGame() {
            currentLevel.value = 1;
            totalScore.value = 0;
            gameState.value = 'playing';
            initLevel();
            startGameLoop();
            clearSave();
        }

        function continueGame() {
            gameState.value = 'playing';
            initLevel();
            startGameLoop();
        }

        function startGameLoop() {
            if (gameLoop) cancelAnimationFrame(gameLoop);
            
            function loop() {
                if (gameState.value === 'playing') {
                    update();
                }
                gameLoop = requestAnimationFrame(loop);
            }
            loop();
        }

        function update() {
            updatePlayer();
            updateBullets();
            updateEnemies();
            checkCollisions();
            updateGunAngle();
        }

        function updatePlayer() {
            const canvasWidth = window.innerWidth;
            
            if (keys['a'] || keys['arrowleft']) {
                playerX.value = Math.max(50, playerX.value - playerSpeed);
            }
            if (keys['d'] || keys['arrowright']) {
                playerX.value = Math.min(canvasWidth * 0.7, playerX.value + playerSpeed);
            }
            
            if (keys['w'] || keys['arrowup']) {
                playerCrouching.value = false;
            }
            if (keys['s'] || keys['arrowdown']) {
                playerCrouching.value = true;
            }
        }

        function updateGunAngle() {
            if (!gameCanvas.value) return;
            const rect = gameCanvas.value.getBoundingClientRect();
            const playerCenterX = playerX.value + 30;
            const playerCenterY = rect.height - playerY.value - (playerCrouching.value ? 35 : 60);
            const dx = mouseX.value - playerCenterX;
            const dy = mouseY.value - playerCenterY;
            gunAngle.value = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
        }

        function updateBullets() {
            bullets.value = bullets.value.filter(bullet => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;

                if (bullet.x < 0 || bullet.x > window.innerWidth || 
                    bullet.y < 0 || bullet.y > window.innerHeight) {
                    return false;
                }
                return true;
            });
        }

        function updateEnemies() {
            const now = Date.now();

            enemies.value.forEach(enemy => {
                if (enemy.health <= 0) return;

                if (now - enemy.lastFire > enemy.fireRate) {
                    enemyShoot(enemy);
                    enemy.lastFire = now;
                }

                enemy.hit = false;
            });

            enemies.value = enemies.value.filter(e => e.health > 0);

            if (enemies.value.length === 0) {
                levelComplete();
            }
        }

        function enemyShoot(enemy) {
            if (!gameCanvas.value) return;
            const rect = gameCanvas.value.getBoundingClientRect();
            
            const targetX = playerX.value + 30;
            const targetY = rect.height - playerY.value - (playerCrouching.value ? 50 : 80);
            
            const enemyX = enemy.x;
            const enemyY = rect.height - enemy.y - 50;

            const angle = Math.atan2(targetY - enemyY, targetX - enemyX);
            const speed = 12;

            bullets.value.push({
                id: ++bulletId,
                x: enemyX,
                y: enemyY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                owner: 'enemy',
                damage: enemy.damage
            });
        }

        function checkCollisions() {
            if (!gameCanvas.value) return;
            const rect = gameCanvas.value.getBoundingClientRect();

            bullets.value = bullets.value.filter(bullet => {
                if (bullet.owner === 'player') {
                    for (let enemy of enemies.value) {
                        if (enemy.health <= 0) continue;
                        
                        const enemyHitY = rect.height - enemy.y - 50;
                        if (Math.abs(bullet.x - enemy.x) < 40 && 
                            Math.abs(bullet.y - enemyHitY) < 40) {
                            enemy.health -= bullet.damage;
                            enemy.hit = true;
                            
                            addShootEffect(bullet.x, rect.height - bullet.y);
                            
                            if (enemy.health <= 0) {
                                levelScore.value += enemy.reward;
                                totalScore.value += enemy.reward;
                                saveGame();
                            }
                            return false;
                        }
                    }
                }

                if (bullet.owner === 'enemy') {
                    if (isBulletHittingCover(bullet)) {
                        addShootEffect(bullet.x, rect.height - bullet.y);
                        return false;
                    }

                    const playerHitY = rect.height - playerY.value - (playerCrouching.value ? 50 : 80);
                    
                    if (Math.abs(bullet.x - playerX.value - 30) < 35 && 
                        Math.abs(bullet.y - playerHitY) < (playerCrouching.value ? 35 : 55)) {
                        
                        if (playerCrouching.value && isPlayerBehindCover()) {
                            addShootEffect(bullet.x, rect.height - bullet.y);
                            return false;
                        }
                        
                        playerHealth.value -= bullet.damage;
                        addShootEffect(bullet.x, rect.height - bullet.y);
                        saveGame();
                        
                        if (playerHealth.value <= 0) {
                            gameOver();
                        }
                        return false;
                    }
                }

                return true;
            });
        }

        function isPlayerBehindCover() {
            for (let cover of covers.value) {
                const playerCenterX = playerX.value + 30;
                if (playerCenterX > cover.x && 
                    playerCenterX < cover.x + cover.width &&
                    playerY.value < cover.y + cover.height) {
                    return true;
                }
            }
            return false;
        }

        function isBulletHittingCover(bullet) {
            if (!gameCanvas.value) return false;
            const rect = gameCanvas.value.getBoundingClientRect();

            for (let cover of covers.value) {
                const coverTopY = rect.height - cover.y - cover.height;
                const coverBottomY = rect.height - cover.y;
                
                if (bullet.x > cover.x && 
                    bullet.x < cover.x + cover.width &&
                    bullet.y > coverTopY &&
                    bullet.y < coverBottomY) {
                    return true;
                }
            }
            return false;
        }

        function addShootEffect(x, y) {
            const effect = {
                id: ++effectId,
                x: x,
                y: y
            };
            shootEffects.value.push(effect);
            
            setTimeout(() => {
                shootEffects.value = shootEffects.value.filter(e => e.id !== effect.id);
            }, 300);
        }

        function handleShoot(event) {
            if (gameState.value !== 'playing') return;
            if (isReloading.value) return;
            if (currentAmmo.value <= 0) {
                reload();
                return;
            }

            const now = Date.now();
            if (now - lastFireTime.value < currentWeapon.value.fireRate) return;
            lastFireTime.value = now;

            const rect = gameCanvas.value.getBoundingClientRect();
            const playerCenterX = playerX.value + 50;
            const playerCenterY = rect.height - playerY.value - (playerCrouching.value ? 50 : 80);

            const weapon = currentWeapon.value;
            const baseAngle = Math.atan2(mouseY.value - playerCenterY, mouseX.value - playerCenterX);

            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
                const angle = baseAngle + spread;
                const speed = 18;

                bullets.value.push({
                    id: ++bulletId,
                    x: playerCenterX,
                    y: playerCenterY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    owner: 'player',
                    damage: weapon.damage
                });
            }

            currentAmmo.value--;
            addShootEffect(playerCenterX + 40, rect.height - playerCenterY);
            saveGame();
        }

        function handleMouseMove(event) {
            if (!gameCanvas.value) return;
            const rect = gameCanvas.value.getBoundingClientRect();
            mouseX.value = event.clientX - rect.left;
            mouseY.value = event.clientY - rect.top;
        }

        function reload() {
            if (isReloading.value) return;
            if (currentAmmo.value === currentWeapon.value.maxAmmo) return;

            isReloading.value = true;
            setTimeout(() => {
                currentAmmo.value = currentWeapon.value.maxAmmo;
                isReloading.value = false;
                saveGame();
            }, 1500);
        }

        function switchWeapon(index) {
            if (currentWeaponIndex.value === index) return;
            currentWeaponIndex.value = index;
            currentAmmo.value = weapons.value[index].maxAmmo;
            isReloading.value = false;
            saveGame();
        }

        function togglePause() {
            if (gameState.value === 'playing') {
                gameState.value = 'paused';
            } else if (gameState.value === 'paused') {
                gameState.value = 'playing';
            }
        }

        function levelComplete() {
            gameState.value = 'levelComplete';
            clearSave();
        }

        function nextLevel() {
            currentLevel.value++;
            if (currentLevel.value > maxLevels) {
                gameState.value = 'victory';
                clearSave();
            } else {
                gameState.value = 'playing';
                initLevel(true);
                saveGame();
            }
        }

        function gameOver() {
            gameState.value = 'gameOver';
            clearSave();
        }

        function restartGame() {
            currentLevel.value = 1;
            totalScore.value = 0;
            gameState.value = 'playing';
            initLevel();
            clearSave();
        }

        function backToMenu() {
            gameState.value = 'menu';
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
                gameLoop = null;
            }
        }

        function handleKeyDown(e) {
            keys[e.key.toLowerCase()] = true;

            if (e.key.toLowerCase() === 'r') {
                reload();
            }
            if (e.key === '1') {
                switchWeapon(0);
            }
            if (e.key === '2') {
                switchWeapon(1);
            }
            if (e.key === 'Escape') {
                togglePause();
            }
        }

        function handleKeyUp(e) {
            keys[e.key.toLowerCase()] = false;
        }

        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            loadGame();
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoop) {
                cancelAnimationFrame(gameLoop);
            }
        });

        return {
            gameState,
            showHelp,
            showWanted,
            currentLevel,
            totalScore,
            levelScore,
            playerHealth,
            playerX,
            playerY,
            playerCrouching,
            weapons,
            currentWeaponIndex,
            currentWeapon,
            currentAmmo,
            isReloading,
            gunAngle,
            bandits,
            enemies,
            bullets,
            shootEffects,
            covers,
            mouseX,
            mouseY,
            gameCanvas,
            startGame,
            continueGame,
            handleShoot,
            handleMouseMove,
            reload,
            switchWeapon,
            togglePause,
            nextLevel,
            restartGame,
            backToMenu,
            loadGame: () => loadGame()
        };
    }
}).mount('#app');

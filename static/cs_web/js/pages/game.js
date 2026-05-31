window.GamePage = {
    template: `
        <div class="game-container">
            <canvas id="gameCanvas" ref="gameCanvas"></canvas>
            <div class="game-hud">
                <div class="crosshair"></div>
                
                <div class="game-stats">
                    <div>击杀: <strong>{{ kills }}</strong></div>
                    <div>死亡: <strong>{{ deaths }}</strong></div>
                    <div>时间: <strong>{{ formatTime(gameTime) }}</strong></div>
                </div>

                <div class="health-bar">
                    <div style="margin-bottom: 5px;">生命值: {{ health }}%</div>
                    <div class="bar">
                        <div class="fill" :style="{ width: health + '%' }"></div>
                    </div>
                </div>

                <div class="weapon-info">
                    <div style="margin-bottom: 5px;">{{ currentWeapon?.name || '无武器' }}</div>
                    <div>{{ ammo }} / {{ currentWeapon?.magazine_size || 0 }}</div>
                    <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
                        按 1-{{ weapons.length }} 切换武器 | R 换弹
                    </div>
                </div>

                <div class="minimap">
                    <div style="padding: 10px; text-align: center; font-size: 12px;">
                        {{ selectedMap?.name || '未知地图' }}
                    </div>
                </div>

                <div v-if="showMenu" class="game-menu">
                    <h2 v-if="gameOver" style="margin-bottom: 20px;">
                        {{ isWin ? '🎉 胜利！' : '💀 游戏结束' }}
                    </h2>
                    <h2 v-else style="margin-bottom: 20px;">游戏暂停</h2>
                    <div class="grid" style="gap: 15px;">
                        <button v-if="!gameOver" class="btn btn-primary" @click="resumeGame">继续游戏</button>
                        <button v-if="gameOver" class="btn btn-primary" @click="restartGame">再来一局</button>
                        <button class="btn btn-secondary" @click="backToHome">返回首页</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const gameCanvas = ref(null);
        const selectedMap = ref(Storage.get('selected_map') || {});
        const user = ref(Storage.getUser() || {});
        
        const kills = ref(0);
        const deaths = ref(0);
        const health = ref(100);
        const ammo = ref(30);
        const gameTime = ref(0);
        const showMenu = ref(false);
        const gameOver = ref(false);
        const isWin = ref(false);
        const weapons = ref([]);
        const currentWeapon = ref(null);
        
        let gameLoop = null;
        let timeInterval = null;
        let ctx = null;
        let enemies = [];
        let bullets = [];
        let keys = {};
        let player = { x: 0, y: 0, z: 0, angle: 0, yAngle: 0 };
        let mapObstacles = [];
        const SAVE_KEY = 'cs_game_state';

        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const loadWeapons = async () => {
            const res = await API.weapon.getList(0, 10);
            if (res.code === 200 && res.data.length > 0) {
                weapons.value = res.data;
                currentWeapon.value = res.data[0];
                ammo.value = res.data[0].magazine_size;
            }
        };

        const initMap = () => {
            const canvas = gameCanvas.value;
            mapObstacles = [];
            const mapId = selectedMap.value?.id || 1;
            
            if (mapId === 1) {
                mapObstacles = [
                    { x: canvas.width * 0.2, y: canvas.height * 0.3, w: 80, h: 80, color: '#d4a574' },
                    { x: canvas.width * 0.7, y: canvas.height * 0.2, w: 100, h: 60, color: '#c4956a' },
                    { x: canvas.width * 0.3, y: canvas.height * 0.6, w: 60, h: 100, color: '#d4a574' },
                    { x: canvas.width * 0.6, y: canvas.height * 0.65, w: 120, h: 70, color: '#b8865a' },
                    { x: canvas.width * 0.15, y: canvas.height * 0.15, w: 50, h: 50, color: '#8b7355' },
                    { x: canvas.width * 0.8, y: canvas.height * 0.8, w: 50, h: 50, color: '#8b7355' }
                ];
            } else if (mapId === 2) {
                mapObstacles = [
                    { x: canvas.width * 0.1, y: canvas.height * 0.2, w: 60, h: 150, color: '#cd853f' },
                    { x: canvas.width * 0.85, y: canvas.height * 0.15, w: 60, h: 120, color: '#cd853f' },
                    { x: canvas.width * 0.25, y: canvas.height * 0.5, w: 100, h: 60, color: '#deb887' },
                    { x: canvas.width * 0.55, y: canvas.height * 0.3, w: 80, h: 80, color: '#d2691e' },
                    { x: canvas.width * 0.4, y: canvas.height * 0.7, w: 150, h: 50, color: '#cd853f' },
                    { x: canvas.width * 0.7, y: canvas.height * 0.55, w: 60, h: 110, color: '#deb887' },
                    { x: canvas.width * 0.15, y: canvas.height * 0.75, w: 70, h: 70, color: '#8b4513' }
                ];
            } else {
                mapObstacles = [
                    { x: canvas.width * 0.2, y: canvas.height * 0.25, w: 120, h: 40, color: '#6b7280' },
                    { x: canvas.width * 0.5, y: canvas.height * 0.25, w: 40, h: 120, color: '#4b5563' },
                    { x: canvas.width * 0.7, y: canvas.height * 0.5, w: 100, h: 40, color: '#6b7280' },
                    { x: canvas.width * 0.25, y: canvas.height * 0.55, w: 40, h: 100, color: '#4b5563' },
                    { x: canvas.width * 0.55, y: canvas.height * 0.7, w: 80, h: 40, color: '#6b7280' },
                    { x: canvas.width * 0.1, y: canvas.height * 0.4, w: 60, h: 60, color: '#374151' },
                    { x: canvas.width * 0.8, y: canvas.height * 0.3, w: 50, h: 80, color: '#374151' },
                    { x: canvas.width * 0.4, y: canvas.height * 0.4, w: 50, h: 50, color: '#1f2937' }
                ];
            }
        };

        const saveGameState = () => {
            if (gameOver.value) {
                localStorage.removeItem(SAVE_KEY);
                return;
            }
            const state = {
                kills: kills.value,
                deaths: deaths.value,
                health: health.value,
                ammo: ammo.value,
                gameTime: gameTime.value,
                currentWeaponIndex: weapons.value.findIndex(w => w.id === currentWeapon.value?.id),
                player: { ...player },
                enemies: enemies.map(e => ({ ...e })),
                bullets: bullets.map(b => ({ ...b })),
                selectedMap: selectedMap.value,
                timestamp: Date.now()
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        };

        const loadGameState = () => {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return false;
            
            try {
                const state = JSON.parse(saved);
                if (Date.now() - state.timestamp > 10 * 60 * 1000) {
                    localStorage.removeItem(SAVE_KEY);
                    return false;
                }
                
                kills.value = state.kills;
                deaths.value = state.deaths;
                health.value = state.health;
                gameTime.value = state.gameTime;
                player = { ...state.player };
                enemies = state.enemies.map(e => ({ ...e }));
                bullets = state.bullets.map(b => ({ ...b }));
                
                if (state.currentWeaponIndex >= 0 && weapons.value[state.currentWeaponIndex]) {
                    currentWeapon.value = weapons.value[state.currentWeaponIndex];
                    ammo.value = state.ammo;
                }
                
                return true;
            } catch (e) {
                localStorage.removeItem(SAVE_KEY);
                return false;
            }
        };

        const initGame = () => {
            const canvas = gameCanvas.value;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx = canvas.getContext('2d');

            initMap();

            const hasSavedState = loadGameState();
            
            if (!hasSavedState) {
                player = { x: canvas.width / 2, y: canvas.height / 2, z: 0, angle: 0, yAngle: 0 };

                for (let i = 0; i < 5; i++) {
                    enemies.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        health: 100,
                        speed: 1 + Math.random()
                    });
                }
            }

            canvas.addEventListener('click', shoot);
            canvas.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
            canvas.addEventListener('click', () => canvas.requestPointerLock());

            gameLoop = setInterval(updateGame, 1000 / 60);
            timeInterval = setInterval(() => {
                gameTime.value++;
                saveGameState();
            }, 1000);
        };

        const shoot = () => {
            if (showMenu.value || gameOver.value) return;
            if (ammo.value <= 0) {
                showToast('弹药不足，按R换弹', 'error');
                return;
            }

            ammo.value--;

            const bullet = {
                x: player.x,
                y: player.y,
                angle: player.angle,
                speed: 15
            };
            bullets.push(bullet);

            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const dist = Math.sqrt(Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2));
                if (dist < 50) {
                    enemy.health -= currentWeapon.value?.damage || 30;
                    if (enemy.health <= 0) {
                        enemies.splice(i, 1);
                        kills.value++;
                        showToast('击杀！+1', 'success');
                        
                        enemies.push({
                            x: Math.random() * gameCanvas.value.width,
                            y: Math.random() * gameCanvas.value.height,
                            health: 100,
                            speed: 1 + Math.random()
                        });

                        if (kills.value >= 10) {
                            endGame(true);
                        }
                    }
                    break;
                }
            }
        };

        const handleMouseMove = (e) => {
            if (document.pointerLockElement === gameCanvas.value) {
                player.angle += e.movementX * 0.002;
                player.yAngle += e.movementY * 0.002;
            }
        };

        const handleKeyDown = (e) => {
            keys[e.key.toLowerCase()] = true;

            if (e.key === 'Escape') {
                showMenu.value = !showMenu.value;
                if (!showMenu.value && !gameOver.value) {
                    gameCanvas.value.requestPointerLock();
                }
            }

            if (!showMenu.value && !gameOver.value) {
                if (e.key.toLowerCase() === 'r') {
                    reload();
                }

                const num = parseInt(e.key);
                if (num >= 1 && num <= weapons.value.length) {
                    switchWeapon(num - 1);
                }
            }
        };

        const handleKeyUp = (e) => {
            keys[e.key.toLowerCase()] = false;
        };

        const switchWeapon = (index) => {
            if (weapons.value[index]) {
                currentWeapon.value = weapons.value[index];
                ammo.value = weapons.value[index].magazine_size;
                showToast(`切换到 ${weapons.value[index].name}`);
            }
        };

        const reload = () => {
            if (currentWeapon.value) {
                ammo.value = currentWeapon.value.magazine_size;
                showToast('换弹完成');
            }
        };

        const updateGame = () => {
            if (showMenu.value || gameOver.value) return;

            const canvas = gameCanvas.value;
            const speed = 5;

            const oldX = player.x;
            const oldY = player.y;

            if (keys['w']) player.y -= speed;
            if (keys['s']) player.y += speed;
            if (keys['a']) player.x -= speed;
            if (keys['d']) player.x += speed;

            if (checkObstacleCollision(player.x, player.y, 20)) {
                player.x = oldX;
                player.y = oldY;
            }

            player.x = Math.max(50, Math.min(canvas.width - 50, player.x));
            player.y = Math.max(50, Math.min(canvas.height - 50, player.y));

            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].x += Math.cos(bullets[i].angle) * bullets[i].speed;
                bullets[i].y += Math.sin(bullets[i].angle) * bullets[i].speed;
                
                if (bullets[i].x < 0 || bullets[i].x > canvas.width ||
                    bullets[i].y < 0 || bullets[i].y > canvas.height) {
                    bullets.splice(i, 1);
                }
            }

            enemies.forEach(enemy => {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 30) {
                    const oldEx = enemy.x;
                    const oldEy = enemy.y;
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                    
                    if (checkObstacleCollision(enemy.x, enemy.y, 25)) {
                        enemy.x = oldEx;
                        enemy.y = oldEy;
                    }
                } else {
                    health.value -= 0.5;
                    if (health.value <= 0) {
                        endGame(false);
                    }
                }
            });

            drawGame();
        };

        const getMapBackground = () => {
            const mapId = selectedMap.value?.id || 1;
            if (mapId === 1) return { bg: '#c2b280', grid: '#a8956a', name: '沙漠2' };
            if (mapId === 2) return { bg: '#f5deb3', grid: '#deb887', name: 'Inferno' };
            return { bg: '#374151', grid: '#4b5563', name: '仓库' };
        };

        const checkObstacleCollision = (x, y, radius) => {
            for (const obs of mapObstacles) {
                const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
                const distX = x - closestX;
                const distY = y - closestY;
                if ((distX * distX + distY * distY) < (radius * radius)) {
                    return true;
                }
            }
            return false;
        };

        const drawGame = () => {
            const canvas = gameCanvas.value;
            const mapStyle = getMapBackground();
            
            ctx.fillStyle = mapStyle.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = mapStyle.grid;
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let i = 0; i < canvas.height; i += 50) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }

            mapObstacles.forEach(obs => {
                ctx.fillStyle = obs.color;
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
                
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(obs.x + 5, obs.y + 5, obs.w, obs.h);
            });

            enemies.forEach(enemy => {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, 25, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.x - 25, enemy.y - 40, 50, 8);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(enemy.x - 25, enemy.y - 40, 50 * (enemy.health / 100), 8);
            });

            ctx.fillStyle = '#e94560';
            ctx.beginPath();
            ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
                player.x + Math.cos(player.angle) * 25,
                player.y + Math.sin(player.angle) * 25,
                5, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            bullets.forEach(bullet => {
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const endGame = async (win) => {
            gameOver.value = true;
            isWin.value = win;
            showMenu.value = true;
            clearInterval(gameLoop);
            clearInterval(timeInterval);
            document.exitPointerLock();
            localStorage.removeItem(SAVE_KEY);

            deaths.value = win ? 0 : 1;
            const res = await API.game.createRecord({
                user_id: user.value.id,
                map_id: selectedMap.value?.id,
                kills: kills.value,
                deaths: deaths.value,
                is_win: win ? 1 : 0,
                game_duration: gameTime.value
            });

            if (res.code === 200 && res.data?.unlocked_achievements?.length > 0) {
                showToast(`解锁成就: ${res.data.unlocked_achievements.map(a => a.name).join(', ')}`, 'success');
            }
        };

        const resumeGame = () => {
            showMenu.value = false;
            gameCanvas.value.requestPointerLock();
        };

        const restartGame = () => {
            localStorage.removeItem(SAVE_KEY);
            kills.value = 0;
            deaths.value = 0;
            health.value = 100;
            ammo.value = currentWeapon.value?.magazine_size || 30;
            gameTime.value = 0;
            showMenu.value = false;
            gameOver.value = false;
            bullets = [];
            enemies = [];

            initMap();

            const canvas = gameCanvas.value;
            player = { x: canvas.width / 2, y: canvas.height / 2, z: 0, angle: 0, yAngle: 0 };

            for (let i = 0; i < 5; i++) {
                enemies.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    health: 100,
                    speed: 1 + Math.random()
                });
            }

            gameLoop = setInterval(updateGame, 1000 / 60);
            timeInterval = setInterval(() => {
                gameTime.value++;
                saveGameState();
            }, 1000);
            canvas.requestPointerLock();
        };

        const backToHome = () => {
            clearInterval(gameLoop);
            clearInterval(timeInterval);
            localStorage.removeItem(SAVE_KEY);
            router.push('/home');
        };

        onMounted(async () => {
            await loadWeapons();
            setTimeout(() => {
                initGame();
            }, 100);
        });

        return {
            gameCanvas, selectedMap, kills, deaths, health, ammo, gameTime,
            showMenu, gameOver, isWin, weapons, currentWeapon, toast,
            formatTime, resumeGame, restartGame, backToHome
        };
    }
};

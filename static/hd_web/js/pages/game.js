(function() {
const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

const GamePage = {
    name: 'GamePage',
    setup() {
        const gameModes = [
            { id: 'parkour', name: '跑酷', icon: '🏃', description: '快速穿越障碍', color: '#4ecdc4' },
            { id: 'battle', name: '战斗', icon: '⚔️', description: '击败所有敌人', color: '#ff6b35' },
            { id: 'stealth', name: '潜入', icon: '🥷', description: '潜行不被发现', color: '#667eea' },
            { id: 'assassination', name: '暗杀', icon: '🗡️', description: '暗杀目标人物', color: '#dc3545' }
        ];

        const selectedMode = ref('parkour');
        const gameState = ref('menu');
        const canvasRef = ref(null);
        const gameLoop = ref(null);
        const keys = reactive({});
        
        const gameData = reactive({
            score: 0,
            time: 0,
            chakra: 100,
            maxChakra: 100,
            isInvisible: false,
            combo: 0,
            detections: 0,
            maxDetections: 3
        });

        const player = reactive({
            x: 50,
            y: 300,
            width: 30,
            height: 40,
            vx: 0,
            vy: 0,
            speed: 5,
            jumpPower: 12,
            gravity: 0.5,
            isJumping: false,
            isOnGround: false,
            facingRight: true,
            isAttacking: false,
            attackCooldown: 0,
            assassinateRange: 50
        });

        const enemies = ref([]);
        const obstacles = ref([]);
        const collectibles = ref([]);
        const particles = ref([]);

        const activeSkills = computed(() => {
            return GameStore.getActiveSkills ? GameStore.getActiveSkills() : [];
        });

        const learnedSkills = computed(() => {
            return GameStore.getLearnedSkills ? GameStore.getLearnedSkills() : [];
        });

        const skills = computed(() => {
            const activeIds = activeSkills.value;
            return learnedSkills.value.filter(s => activeIds.includes(s.id));
        });

        const skillCooldowns = reactive({});

        const mission = reactive({
            title: '',
            description: '',
            target: 0,
            current: 0,
            completed: false
        });

        const gameResult = reactive({
            win: false,
            score: 0,
            time: 0,
            kills: 0,
            detections: 0,
            rewards: { exp: 0, gold: 0 }
        });

        const selectMode = (modeId) => {
            selectedMode.value = modeId;
        };

        const getLevelParams = () => {
            const params = Router.getParams();
            return {
                id: params.id,
                type: params.type
            };
        };

        const initLevelMode = () => {
            const params = getLevelParams();
            if (params.type) {
                const typeMap = {
                    1: 'parkour',
                    2: 'battle',
                    3: 'stealth',
                    4: 'assassination',
                    '1': 'parkour',
                    '2': 'battle',
                    '3': 'stealth',
                    '4': 'assassination',
                    'parkour': 'parkour',
                    'battle': 'battle',
                    'stealth': 'stealth',
                    'assassination': 'assassination'
                };
                if (typeMap[params.type]) {
                    selectedMode.value = typeMap[params.type];
                }
            }
        };

        const initGame = () => {
            player.x = 50;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            player.isJumping = false;
            player.isOnGround = false;
            player.facingRight = true;
            player.isAttacking = false;
            player.attackCooldown = 0;

            gameData.score = 0;
            gameData.time = 0;
            gameData.chakra = 100;
            gameData.isInvisible = false;
            gameData.combo = 0;
            gameData.detections = 0;

            enemies.value = [];
            obstacles.value = [];
            collectibles.value = [];
            particles.value = [];

            Object.keys(skillCooldowns).forEach(key => {
                skillCooldowns[key] = 0;
            });

            const mode = gameModes.find(m => m.id === selectedMode.value);
            
            switch (selectedMode.value) {
                case 'parkour':
                    mission.title = '跑酷挑战';
                    mission.description = '收集所有金币并到达终点';
                    mission.target = 5;
                    mission.current = 0;
                    generateParkourLevel();
                    break;
                case 'battle':
                    mission.title = '战斗模式';
                    mission.description = '击败所有敌人';
                    mission.target = 5;
                    mission.current = 0;
                    generateBattleLevel();
                    break;
                case 'stealth':
                    mission.title = '潜入任务';
                    mission.description = '到达终点不被发现超过3次';
                    mission.target = 1;
                    mission.current = 0;
                    gameData.maxDetections = 3;
                    generateStealthLevel();
                    break;
                case 'assassination':
                    mission.title = '暗杀任务';
                    mission.description = '暗杀目标人物';
                    mission.target = 1;
                    mission.current = 0;
                    generateAssassinationLevel();
                    break;
            }
            mission.completed = false;
        };

        const generateParkourLevel = () => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            for (let i = 0; i < 8; i++) {
                obstacles.value.push({
                    x: 150 + i * 100,
                    y: canvas.height - 60 - Math.random() * 100,
                    width: 60,
                    height: 20,
                    type: 'platform'
                });
            }

            for (let i = 0; i < 5; i++) {
                collectibles.value.push({
                    x: 180 + i * 160,
                    y: canvas.height - 120 - Math.random() * 80,
                    width: 20,
                    height: 20,
                    type: 'coin',
                    collected: false,
                    value: 10
                });
            }

            collectibles.value.push({
                x: 900,
                y: canvas.height - 100,
                width: 40,
                height: 60,
                type: 'goal',
                collected: false
            });
        };

        const generateBattleLevel = () => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            for (let i = 0; i < 5; i++) {
                enemies.value.push({
                    id: i,
                    x: 200 + i * 150,
                    y: canvas.height - 80,
                    width: 30,
                    height: 40,
                    vx: 0,
                    vy: 0,
                    hp: 100,
                    maxHp: 100,
                    speed: 2,
                    direction: 1,
                    patrolStart: 150 + i * 150,
                    patrolEnd: 250 + i * 150,
                    type: 'normal',
                    isTarget: false,
                    facingRight: true,
                    alertLevel: 0,
                    attackCooldown: 0,
                    damage: 10
                });
            }
        };

        const generateStealthLevel = () => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            for (let i = 0; i < 6; i++) {
                enemies.value.push({
                    id: i,
                    x: 150 + i * 130,
                    y: canvas.height - 80,
                    width: 30,
                    height: 40,
                    vx: 0,
                    vy: 0,
                    hp: 100,
                    maxHp: 100,
                    speed: 1.5,
                    direction: 1,
                    patrolStart: 100 + i * 130,
                    patrolEnd: 200 + i * 130,
                    type: 'guard',
                    isTarget: false,
                    facingRight: true,
                    alertLevel: 0,
                    visionRange: 80,
                    visionAngle: 60
                });
            }

            collectibles.value.push({
                x: 900,
                y: canvas.height - 100,
                width: 40,
                height: 60,
                type: 'goal',
                collected: false
            });
        };

        const generateAssassinationLevel = () => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            for (let i = 0; i < 3; i++) {
                enemies.value.push({
                    id: i,
                    x: 200 + i * 150,
                    y: canvas.height - 80,
                    width: 30,
                    height: 40,
                    vx: 0,
                    vy: 0,
                    hp: 100,
                    maxHp: 100,
                    speed: 1.5,
                    direction: 1,
                    patrolStart: 150 + i * 150,
                    patrolEnd: 250 + i * 150,
                    type: 'guard',
                    isTarget: false,
                    facingRight: true,
                    alertLevel: 0,
                    visionRange: 60,
                    visionAngle: 60
                });
            }

            enemies.value.push({
                id: 999,
                x: 700,
                y: canvas.height - 80,
                width: 35,
                height: 45,
                vx: 0,
                vy: 0,
                hp: 200,
                maxHp: 200,
                speed: 1,
                direction: 1,
                patrolStart: 650,
                patrolEnd: 750,
                type: 'target',
                isTarget: true,
                facingRight: true,
                alertLevel: 0,
                visionRange: 70,
                visionAngle: 60
            });
        };

        const saveBattleState = () => {
            if (gameState.value !== 'playing') return;
            const state = {
                selectedMode: selectedMode.value,
                gameData: { ...gameData },
                player: { ...player },
                enemies: enemies.value.map(e => ({ ...e })),
                obstacles: obstacles.value.map(o => ({ ...o })),
                collectibles: collectibles.value.map(c => ({ ...c })),
                mission: { ...mission },
                timestamp: Date.now()
            };
            HdStorage.setBattleState(state);
        };

        const restoreBattleState = () => {
            const savedState = HdStorage.getBattleState();
            if (!savedState) return false;
            if (Date.now() - savedState.timestamp > 30 * 60 * 1000) {
                HdStorage.removeBattleState();
                return false;
            }
            selectedMode.value = savedState.selectedMode;
            Object.assign(gameData, savedState.gameData);
            Object.assign(player, savedState.player);
            enemies.value = savedState.enemies;
            obstacles.value = savedState.obstacles;
            collectibles.value = savedState.collectibles;
            Object.assign(mission, savedState.mission);
            return true;
        };

        const startGame = () => {
            const restored = restoreBattleState();
            if (!restored) {
                initGame();
            }
            gameState.value = 'playing';
            
            setTimeout(() => {
                startGameLoop();
            }, 100);
        };

        const startGameLoop = () => {
            const canvas = canvasRef.value;
            if (!canvas) {
                console.error('Canvas not found!');
                setTimeout(() => startGameLoop(), 100);
                return;
            }

            const ctx = canvas.getContext('2d');
            let lastTime = 0;

            const loop = (timestamp) => {
                if (gameState.value !== 'playing') return;

                const deltaTime = timestamp - lastTime;
                lastTime = timestamp;

                update(deltaTime);
                render(ctx, canvas);

                gameLoop.value = requestAnimationFrame(loop);
            };

            gameLoop.value = requestAnimationFrame(loop);
        };

        let lastSaveTime = 0;
        
        const update = (deltaTime) => {
            const canvas = canvasRef.value;
            if (!canvas) return;

            gameData.time += deltaTime / 1000;
            
            if (gameData.time - lastSaveTime >= 1) {
                saveBattleState();
                lastSaveTime = gameData.time;
            }

            updatePlayer(canvas);
            updateEnemies(canvas);
            updateParticles();
            updateSkillCooldowns();
            checkCollisions(canvas);
            updateChakra();
            checkGameEnd();
        };

        const updatePlayer = (canvas) => {
            if (keys['ArrowLeft'] || keys['a']) {
                player.vx = -player.speed;
                player.facingRight = false;
            } else if (keys['ArrowRight'] || keys['d']) {
                player.vx = player.speed;
                player.facingRight = true;
            } else {
                player.vx = 0;
            }

            if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.isOnGround) {
                player.vy = -player.jumpPower;
                player.isJumping = true;
                player.isOnGround = false;
                createParticles(player.x + player.width / 2, player.y + player.height, 5, '#ff6b35');
            }

            if (keys['Shift']) {
                if (gameData.chakra > 0 && !gameData.isInvisible) {
                    gameData.isInvisible = true;
                }
                if (gameData.isInvisible) {
                    gameData.chakra -= 0.5;
                    if (gameData.chakra <= 0) {
                        gameData.chakra = 0;
                        gameData.isInvisible = false;
                    }
                }
            } else {
                gameData.isInvisible = false;
            }

            if (keys['f']) {
                tryAssassinate();
                keys['f'] = false;
            }

            player.vy += player.gravity;

            player.x += player.vx;
            player.y += player.vy;

            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

            const groundY = canvas.height - 40;
            if (player.y + player.height >= groundY) {
                player.y = groundY - player.height;
                player.vy = 0;
                player.isOnGround = true;
                player.isJumping = false;
            }

            obstacles.value.forEach(obs => {
                if (obs.type === 'platform') {
                    if (player.vy > 0 &&
                        player.x + player.width > obs.x &&
                        player.x < obs.x + obs.width &&
                        player.y + player.height >= obs.y &&
                        player.y + player.height <= obs.y + obs.height + 10) {
                        player.y = obs.y - player.height;
                        player.vy = 0;
                        player.isOnGround = true;
                        player.isJumping = false;
                    }
                }
            });

            if (player.attackCooldown > 0) {
                player.attackCooldown -= deltaTime / 1000;
            }
        };

        const updateEnemies = (canvas) => {
            enemies.value.forEach(enemy => {
                if (enemy.hp <= 0) return;

                enemy.x += enemy.speed * enemy.direction;
                enemy.facingRight = enemy.direction > 0;

                if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
                    enemy.direction *= -1;
                }

                if (!gameData.isInvisible) {
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (enemy.visionRange && distance < enemy.visionRange) {
                        const angleToPlayer = Math.atan2(dy, dx) * 180 / Math.PI;
                        const enemyAngle = enemy.facingRight ? 0 : 180;
                        const angleDiff = Math.abs(angleToPlayer - enemyAngle);

                        if (angleDiff < enemy.visionAngle / 2 || angleDiff > 360 - enemy.visionAngle / 2) {
                            enemy.alertLevel = Math.min(100, enemy.alertLevel + 2);
                            
                            if (enemy.alertLevel >= 100) {
                                if (selectedMode.value === 'stealth' || selectedMode.value === 'assassination') {
                                    gameData.detections++;
                                    Toast.warning('被发现了！');
                                    enemy.alertLevel = 0;
                                } else {
                                    enemy.speed = 3;
                                    enemy.direction = dx > 0 ? 1 : -1;
                                }
                            }
                        }
                    } else {
                        enemy.alertLevel = Math.max(0, enemy.alertLevel - 1);
                    }
                }

                if (selectedMode.value === 'battle' && !gameData.isInvisible) {
                    const dx = player.x - enemy.x;
                    const distance = Math.abs(dx);
                    
                    if (distance < 50 && enemy.attackCooldown <= 0) {
                        playerHit(enemy.damage);
                        enemy.attackCooldown = 2;
                    }
                }

                if (enemy.attackCooldown > 0) {
                    enemy.attackCooldown -= deltaTime / 1000;
                }
            });
        };

        const updateParticles = () => {
            particles.value = particles.value.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.life--;
                p.alpha = p.life / p.maxLife;
                return p.life > 0;
            });
        };

        const updateSkillCooldowns = () => {
            Object.keys(skillCooldowns).forEach(key => {
                if (skillCooldowns[key] > 0) {
                    skillCooldowns[key] -= 1 / 60;
                }
            });
        };

        const updateChakra = () => {
            if (!gameData.isInvisible && gameData.chakra < gameData.maxChakra) {
                gameData.chakra = Math.min(gameData.maxChakra, gameData.chakra + 0.1);
            }
        };

        const checkCollisions = (canvas) => {
            collectibles.value.forEach(item => {
                if (!item.collected && checkAABB(player, item)) {
                    item.collected = true;
                    
                    if (item.type === 'coin') {
                        gameData.score += item.value;
                        gameData.combo++;
                        createParticles(item.x + item.width / 2, item.y + item.height / 2, 8, '#ffc107');
                        
                        if (selectedMode.value === 'parkour') {
                            mission.current++;
                        }
                    } else if (item.type === 'goal') {
                        if (selectedMode.value === 'parkour' || selectedMode.value === 'stealth') {
                            mission.current = mission.target;
                            mission.completed = true;
                            endGame(true);
                        }
                    }
                }
            });
        };

        const checkAABB = (a, b) => {
            return a.x < b.x + b.width &&
                   a.x + a.width > b.x &&
                   a.y < b.y + b.height &&
                   a.y + a.height > b.y;
        };

        const checkGameEnd = () => {
            if (selectedMode.value === 'battle') {
                const aliveEnemies = enemies.value.filter(e => e.hp > 0);
                mission.current = enemies.value.length - aliveEnemies.length;
                if (aliveEnemies.length === 0) {
                    mission.completed = true;
                    endGame(true);
                }
            }

            if (selectedMode.value === 'stealth' && gameData.detections >= gameData.maxDetections) {
                endGame(false);
            }

            if (selectedMode.value === 'assassination') {
                const target = enemies.value.find(e => e.isTarget);
                if (target && target.hp <= 0) {
                    mission.current = 1;
                    mission.completed = true;
                    endGame(true);
                }
            }
        };

        const createParticles = (x, y, count, color) => {
            for (let i = 0; i < count; i++) {
                particles.value.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6 - 2,
                    size: Math.random() * 4 + 2,
                    color: color,
                    life: 30,
                    maxLife: 30,
                    alpha: 1
                });
            }
        };

        const playerAttack = () => {
            if (player.attackCooldown > 0) return;

            player.isAttacking = true;
            player.attackCooldown = 0.5;

            const attackBox = {
                x: player.facingRight ? player.x + player.width : player.x - 40,
                y: player.y,
                width: 40,
                height: player.height
            };

            enemies.value.forEach(enemy => {
                if (enemy.hp > 0 && checkAABB(attackBox, enemy)) {
                    const damage = 25;
                    enemy.hp -= damage;
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10, '#ff6b35');
                    
                    if (enemy.hp <= 0) {
                        gameData.score += 100;
                        gameData.combo++;
                    }
                }
            });

            setTimeout(() => {
                player.isAttacking = false;
            }, 200);
        };

        const useSkill = (skill) => {
            if (skillCooldowns[skill.id] > 0) {
                Toast.warning('技能冷却中！');
                return;
            }

            if (gameData.chakra < skill.chakra) {
                Toast.error('查克拉不足！');
                return;
            }

            gameData.chakra -= skill.chakra;
            skillCooldowns[skill.id] = skill.cooldown;

            const damage = skill.damage;
            const range = skill.type === 'illusion' ? 150 : 100;

            enemies.value.forEach(enemy => {
                if (enemy.hp <= 0) return;
                
                const dx = enemy.x - player.x;
                const distance = Math.abs(dx);
                
                if (distance < range) {
                    const sameDirection = (player.facingRight && dx > 0) || (!player.facingRight && dx < 0);
                    if (sameDirection || skill.type === 'illusion' || skill.type === 'body') {
                        enemy.hp -= damage;
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, getSkillColor(skill.type));
                        
                        if (enemy.hp <= 0) {
                            gameData.score += 150;
                            gameData.combo++;
                        }
                    }
                }
            });

            Toast.success(`使用了 ${skill.name}！`);
        };

        const getSkillColor = (type) => {
            const colors = {
                fire: '#ff6b35',
                water: '#4ecdc4',
                wind: '#a8e6cf',
                thunder: '#ffeaa7',
                earth: '#dfe6e9',
                body: '#fd79a8',
                illusion: '#a29bfe'
            };
            return colors[type] || '#ff6b35';
        };

        const tryAssassinate = () => {
            if (player.attackCooldown > 0) return;

            let assassinated = false;
            
            enemies.value.forEach(enemy => {
                if (enemy.hp <= 0) return;

                const dx = player.x - enemy.x;
                const distance = Math.abs(dx);
                
                if (distance < player.assassinateRange) {
                    const isBehind = (enemy.facingRight && dx < 0) || (!enemy.facingRight && dx > 0);
                    
                    if (isBehind || gameData.isInvisible) {
                        enemy.hp = 0;
                        assassinated = true;
                        createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20, '#dc3545');
                        gameData.score += 200;
                        gameData.combo++;
                        
                        if (enemy.isTarget) {
                            Toast.success('暗杀成功！');
                        }
                    }
                }
            });

            if (assassinated) {
                player.attackCooldown = 1;
            }
        };

        const playerHit = (damage) => {
            createParticles(player.x + player.width / 2, player.y + player.height / 2, 8, '#dc3545');
            gameData.combo = 0;
            Toast.error(`受到 ${damage} 点伤害！`);
        };

        const render = (ctx, canvas) => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#16213e';
            for (let i = 0; i < 10; i++) {
                const x = (i * 120 - (gameData.time * 20) % 120);
                ctx.fillRect(x, 0, 1, canvas.height);
            }

            ctx.fillStyle = '#2d3436';
            ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
            
            ctx.fillStyle = '#636e72';
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.fillRect(i, canvas.height - 40, 2, 40);
            }

            obstacles.value.forEach(obs => {
                if (obs.type === 'platform') {
                    ctx.fillStyle = '#636e72';
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    ctx.fillStyle = '#b2bec3';
                    ctx.fillRect(obs.x, obs.y, obs.width, 4);
                }
            });

            collectibles.value.forEach(item => {
                if (item.collected) return;

                if (item.type === 'coin') {
                    ctx.fillStyle = '#ffc107';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ff9800';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('$', item.x + item.width / 2, item.y + item.height / 2 + 4);
                } else if (item.type === 'goal') {
                    ctx.fillStyle = '#4ecdc4';
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('终点', item.x + item.width / 2, item.y + item.height / 2 + 5);
                }
            });

            enemies.value.forEach(enemy => {
                if (enemy.hp <= 0) return;

                if (enemy.alertLevel > 0) {
                    ctx.fillStyle = `rgba(255, 0, 0, ${enemy.alertLevel / 200})`;
                    const visionX = enemy.facingRight ? enemy.x + enemy.width : enemy.x - enemy.visionRange;
                    ctx.fillRect(visionX, enemy.y - 10, enemy.visionRange, enemy.height + 20);
                }

                ctx.fillStyle = enemy.isTarget ? '#dc3545' : (enemy.type === 'guard' ? '#667eea' : '#e17055');
                
                if (gameData.isInvisible) {
                    ctx.globalAlpha = 0.5;
                }
                
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

                ctx.fillStyle = '#ffffff';
                const eyeX = enemy.facingRight ? enemy.x + enemy.width - 8 : enemy.x + 4;
                ctx.fillRect(eyeX, enemy.y + 10, 4, 4);

                ctx.fillStyle = '#2d3436';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 6);
                ctx.fillStyle = enemy.isTarget ? '#dc3545' : '#4ecdc4';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.hp / enemy.maxHp), 6);

                if (enemy.isTarget) {
                    ctx.fillStyle = '#ffc107';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('目标', enemy.x + enemy.width / 2, enemy.y - 15);
                }

                ctx.globalAlpha = 1;
            });

            if (gameData.isInvisible) {
                ctx.globalAlpha = 0.4;
            }

            ctx.fillStyle = '#ff6b35';
            if (player.isAttacking) {
                ctx.fillStyle = '#ffc107';
            }
            ctx.fillRect(player.x, player.y, player.width, player.height);

            ctx.fillStyle = '#ffffff';
            const playerEyeX = player.facingRight ? player.x + player.width - 8 : player.x + 4;
            ctx.fillRect(playerEyeX, player.y + 10, 4, 4);

            if (player.isAttacking) {
                ctx.fillStyle = 'rgba(255, 193, 7, 0.5)';
                const attackX = player.facingRight ? player.x + player.width : player.x - 40;
                ctx.fillRect(attackX, player.y, 40, player.height);
            }

            ctx.globalAlpha = 1;

            if (gameData.isInvisible) {
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
                ctx.setLineDash([]);
            }

            particles.value.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const endGame = (win) => {
            gameState.value = 'result';
            
            if (gameLoop.value) {
                cancelAnimationFrame(gameLoop.value);
            }
            
            HdStorage.removeBattleState();

            const kills = enemies.value.filter(e => e.hp <= 0).length;
            
            gameResult.win = win;
            gameResult.score = gameData.score;
            gameResult.time = Math.floor(gameData.time);
            gameResult.kills = kills;
            gameResult.detections = gameData.detections;
            
            const baseExp = win ? 100 : 30;
            const baseGold = win ? 200 : 50;
            const timeBonus = Math.max(0, 300 - gameResult.time) * 0.5;
            const killBonus = kills * 20;
            
            gameResult.rewards = {
                exp: Math.floor(baseExp + timeBonus + killBonus),
                gold: Math.floor(baseGold + killBonus)
            };

            if (win) {
                GameStore.addExp(gameResult.rewards.exp);
                GameStore.addGold(gameResult.rewards.gold);
                Toast.success('任务完成！');
            }
        };

        const returnToMenu = () => {
            gameState.value = 'menu';
        };

        const handleKeyDown = (e) => {
            keys[e.key] = true;
            
            if (e.key === ' ' && gameState.value === 'playing') {
                e.preventDefault();
            }
            
            if (e.key >= '1' && e.key <= '4' && gameState.value === 'playing') {
                const skillIndex = parseInt(e.key) - 1;
                if (skills.value[skillIndex]) {
                    useSkill(skills.value[skillIndex]);
                }
            }

            if (e.key === 'j' && gameState.value === 'playing') {
                playerAttack();
            }
        };

        const handleKeyUp = (e) => {
            keys[e.key] = false;
        };

        const handleCanvasClick = () => {
            if (gameState.value === 'playing') {
                playerAttack();
            }
        };

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        onMounted(() => {
            GameStore.init();
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            const canvas = canvasRef.value;
            if (canvas) {
                canvas.width = 960;
                canvas.height = 400;
            }

            initLevelMode();
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoop.value) {
                cancelAnimationFrame(gameLoop.value);
            }
        });

        return {
            gameModes,
            selectedMode,
            gameState,
            canvasRef,
            gameData,
            player,
            mission,
            gameResult,
            skills,
            skillCooldowns,
            selectMode,
            startGame,
            returnToMenu,
            handleCanvasClick,
            useSkill,
            formatTime
        };
    },
    template: `
        <div class="game-page">
            <div v-if="gameState === 'menu'" class="game-menu">
                <div class="section-title">选择游戏模式</div>
                <div class="game-modes-grid">
                    <div 
                        v-for="mode in gameModes" 
                        :key="mode.id"
                        class="game-mode-card"
                        :class="{ active: selectedMode === mode.id }"
                        :style="{ borderColor: selectedMode === mode.id ? mode.color : 'transparent' }"
                        @click="selectMode(mode.id)"
                    >
                        <div class="mode-icon" :style="{ backgroundColor: mode.color + '20', color: mode.color }">{{ mode.icon }}</div>
                        <div class="mode-name">{{ mode.name }}</div>
                        <div class="mode-desc">{{ mode.description }}</div>
                    </div>
                </div>

                <div class="game-controls-info">
                    <div class="section-title">操作说明</div>
                    <div class="controls-grid">
                        <div class="control-item">
                            <span class="key">← →</span>
                            <span class="control-desc">移动</span>
                        </div>
                        <div class="control-item">
                            <span class="key">空格</span>
                            <span class="control-desc">跳跃</span>
                        </div>
                        <div class="control-item">
                            <span class="key">Shift</span>
                            <span class="control-desc">隐身</span>
                        </div>
                        <div class="control-item">
                            <span class="key">J / 点击</span>
                            <span class="control-desc">攻击</span>
                        </div>
                        <div class="control-item">
                            <span class="key">F</span>
                            <span class="control-desc">暗杀</span>
                        </div>
                        <div class="control-item">
                            <span class="key">1-4</span>
                            <span class="control-desc">技能</span>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-lg btn-block start-game-btn" @click="startGame">
                    🎮 开始游戏
                </button>
            </div>

            <div v-if="gameState === 'playing'" class="game-container">
                <div class="game-hud">
                    <div class="hud-left">
                        <div class="hud-item">
                            <span class="hud-icon">⭐</span>
                            <span class="hud-value">{{ gameData.score }}</span>
                        </div>
                        <div class="hud-item">
                            <span class="hud-icon">⏱️</span>
                            <span class="hud-value">{{ formatTime(gameData.time) }}</span>
                        </div>
                        <div class="hud-item">
                            <span class="hud-icon">🔥</span>
                            <span class="hud-value">x{{ gameData.combo }}</span>
                        </div>
                    </div>
                    <div class="hud-center">
                        <div class="mission-info">
                            <span class="mission-title">{{ mission.title }}</span>
                            <span class="mission-progress">{{ mission.current }}/{{ mission.target }}</span>
                        </div>
                        <div class="mission-desc">{{ mission.description }}</div>
                    </div>
                    <div class="hud-right">
                        <div class="chakra-bar">
                            <div class="chakra-label">
                                <span>💫 查克拉</span>
                                <span>{{ Math.floor(gameData.chakra) }}/{{ gameData.maxChakra }}</span>
                            </div>
                            <div class="chakra-progress">
                                <div 
                                    class="chakra-fill" 
                                    :class="{ invisible: gameData.isInvisible }"
                                    :style="{ width: (gameData.chakra / gameData.maxChakra * 100) + '%' }"
                                ></div>
                            </div>
                        </div>
                        <div v-if="gameData.isInvisible" class="invisible-status">
                            👻 隐身中
                        </div>
                        <div v-if="selectedMode === 'stealth' || selectedMode === 'assassination'" class="detection-status">
                            <span>👁️ 被发现: {{ gameData.detections }}/{{ gameData.maxDetections }}</span>
                        </div>
                    </div>
                </div>

                <div class="game-canvas-container">
                    <canvas 
                        ref="canvasRef" 
                        class="game-canvas"
                        @click="handleCanvasClick"
                    ></canvas>
                </div>

                <div class="game-controls">
                    <div class="skills-bar">
                        <div 
                            v-for="(skill, index) in skills" 
                            :key="skill.id"
                            class="skill-slot"
                            :class="{ cooldown: skillCooldowns[skill.id] > 0 }"
                            @click="useSkill(skill)"
                        >
                            <div class="skill-icon">{{ skill.icon }}</div>
                            <div class="skill-key">{{ index + 1 }}</div>
                            <div v-if="skillCooldowns[skill.id] > 0" class="skill-cooldown-overlay">
                                {{ Math.ceil(skillCooldowns[skill.id]) }}
                            </div>
                            <div class="skill-tooltip">{{ skill.name }}</div>
                        </div>
                        <div v-for="i in (4 - skills.length)" :key="'empty-' + i" class="skill-slot empty">
                            <div class="skill-icon">-</div>
                            <div class="skill-key">{{ skills.length + i }}</div>
                        </div>
                    </div>

                    <div class="mobile-controls">
                        <div class="direction-pad">
                            <button class="dir-btn" @mousedown="$event => $event.target.dataset.pressed = 'true'" @mouseup="$event => $event.target.dataset.pressed = 'false'">←</button>
                            <button class="dir-btn jump" @mousedown="$event => $event.target.dataset.pressed = 'true'" @mouseup="$event => $event.target.dataset.pressed = 'false'">↑</button>
                            <button class="dir-btn" @mousedown="$event => $event.target.dataset.pressed = 'true'" @mouseup="$event => $event.target.dataset.pressed = 'false'">→</button>
                        </div>
                        <div class="action-pad">
                            <button class="action-btn attack" @click="handleCanvasClick">攻击</button>
                            <button class="action-btn skill" @mousedown="$event => $event.target.dataset.pressed = 'true'" @mouseup="$event => $event.target.dataset.pressed = 'false'">隐身</button>
                            <button class="action-btn assassinate" @click="() => { const e = {key: 'f'}; $emit('keydown', e); }">暗杀</button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="gameState === 'result'" class="game-result">
                <div class="result-card" :class="{ win: gameResult.win, lose: !gameResult.win }">
                    <div class="result-header">
                        <div class="result-icon">{{ gameResult.win ? '🎉' : '😔' }}</div>
                        <div class="result-title">{{ gameResult.win ? '任务完成！' : '任务失败' }}</div>
                    </div>

                    <div class="result-stats">
                        <div class="stat-row">
                            <span class="stat-label">得分</span>
                            <span class="stat-value">{{ gameResult.score }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">用时</span>
                            <span class="stat-value">{{ formatTime(gameResult.time) }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">击杀</span>
                            <span class="stat-value">{{ gameResult.kills }}</span>
                        </div>
                        <div v-if="selectedMode === 'stealth' || selectedMode === 'assassination'" class="stat-row">
                            <span class="stat-label">被发现</span>
                            <span class="stat-value">{{ gameResult.detections }}</span>
                        </div>
                    </div>

                    <div class="result-rewards">
                        <div class="reward-title">获得奖励</div>
                        <div class="reward-items">
                            <div class="reward-item">
                                <span class="reward-icon">⭐</span>
                                <span class="reward-value">+{{ gameResult.rewards.exp }}</span>
                                <span class="reward-label">经验</span>
                            </div>
                            <div class="reward-item">
                                <span class="reward-icon">💰</span>
                                <span class="reward-value">+{{ gameResult.rewards.gold }}</span>
                                <span class="reward-label">金币</span>
                            </div>
                        </div>
                    </div>

                    <div class="result-actions">
                        <button class="btn btn-primary btn-block" @click="startGame">再来一局</button>
                        <button class="btn btn-block btn-secondary" @click="returnToMenu">返回菜单</button>
                    </div>
                </div>
            </div>
        </div>
    `
};

const GamePageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'game',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(GamePage)
        });
    }
};

window.GamePage = GamePage;
window.GamePageWrapper = GamePageWrapper;
})();

import { bugParts, playerSkills, skills, enemies as enemiesData, versusOpponents, levels, powerupEffects } from './data/gameData.js';
import { gameStorage } from './utils/storage.js';
import { audioManager } from './utils/audio.js';

const { createApp, ref, computed, reactive, onMounted, watch, nextTick } = Vue;

const app = createApp({
    setup() {
        const currentScreen = ref('menu');
        const selectedMode = ref(null);
        const currentLevel = ref(null);
        const currentOpponent = ref(null);
        const playerBug = reactive({
            body: null,
            head: null,
            legs: null,
            weapon: null
        });
        const completedLevels = ref([]);
        const versusWins = ref({ mantis: 0, bee: 0, beetle: 0 });

        const saveNav = () => {
            gameStorage.saveNavigation({
                screen: currentScreen.value,
                mode: selectedMode.value,
                levelId: currentLevel.value?.id || null,
                opponentId: currentOpponent.value?.id || null
            });
        };

        onMounted(() => {
            audioManager.init();
            loadSavedData();
        });

        const loadSavedData = () => {
            const savedBug = gameStorage.loadPlayerBug();
            if (savedBug && savedBug.body) {
                Object.assign(playerBug, savedBug);
            }
            completedLevels.value = gameStorage.loadCompletedLevels();
            versusWins.value = gameStorage.loadVersusWins();

            const nav = gameStorage.loadNavigation();
            if (nav && nav.screen && nav.screen !== 'menu') {
                currentScreen.value = nav.screen;
                selectedMode.value = nav.mode;
                if (nav.levelId) {
                    currentLevel.value = levels.find(l => l.id === nav.levelId) || null;
                }
                if (nav.opponentId) {
                    currentOpponent.value = versusOpponents.find(o => o.id === nav.opponentId) || null;
                }
            }
        };

        const goToScreen = (screen) => {
            audioManager.playClick();
            currentScreen.value = screen;
            if (screen !== 'battle') {
                currentLevel.value = null;
                currentOpponent.value = null;
            }
            saveNav();
        };

        const selectMode = (mode) => {
            audioManager.playClick();
            selectedMode.value = mode;
            if (mode === 'campaign') {
                currentScreen.value = 'levelSelect';
            } else {
                currentScreen.value = 'opponentSelect';
            }
            saveNav();
        };

        const startLevel = (level) => {
            currentLevel.value = level;
            currentScreen.value = 'battle';
            saveNav();
        };

        const startVersus = (opponent) => {
            currentOpponent.value = opponent;
            currentScreen.value = 'battle';
            saveNav();
        };

        const handleLevelComplete = (levelId) => {
            if (!completedLevels.value.includes(levelId)) {
                completedLevels.value.push(levelId);
            }
        };

        const hasBug = computed(() => {
            return playerBug.body && playerBug.head && playerBug.legs && playerBug.weapon;
        });

        return {
            currentScreen,
            selectedMode,
            currentLevel,
            currentOpponent,
            playerBug,
            completedLevels,
            versusWins,
            goToScreen,
            selectMode,
            startLevel,
            startVersus,
            handleLevelComplete,
            hasBug,
            audioManager,
            gameStorage
        };
    },
    template: `
        <div class="game-container">
            <MainMenu 
                v-if="currentScreen === 'menu'"
                :hasBug="hasBug"
                @goToScreen="goToScreen"
                @selectMode="selectMode"
            />
            
            <BugAssembler 
                v-else-if="currentScreen === 'assemble'"
                :playerBug="playerBug"
                @goToScreen="goToScreen"
            />
            
            <LevelSelect 
                v-else-if="currentScreen === 'levelSelect'"
                :completedLevels="completedLevels"
                :hasBug="hasBug"
                @goToScreen="goToScreen"
                @startLevel="startLevel"
            />
            
            <OpponentSelect 
                v-else-if="currentScreen === 'opponentSelect'"
                :versusWins="versusWins"
                :hasBug="hasBug"
                @goToScreen="goToScreen"
                @startVersus="startVersus"
            />
            
            <BattleScreen 
                v-else-if="currentScreen === 'battle'"
                :playerBug="playerBug"
                :level="currentLevel"
                :opponent="currentOpponent"
                :mode="currentLevel ? 'campaign' : 'versus'"
                @goToScreen="goToScreen"
                @levelComplete="handleLevelComplete"
            />
        </div>
    `
});

app.component('MainMenu', {
    props: ['hasBug'],
    emits: ['goToScreen', 'selectMode'],
    template: `
        <div class="main-menu">
            <h1 class="game-title">🐛 机械昆虫战场 🦋</h1>
            <p class="game-subtitle">组装你的机械昆虫，征服所有战场！</p>
            
            <div class="menu-buttons">
                <button class="menu-btn btn-primary" @click="$emit('selectMode', 'campaign')">
                    🏜️ 闯关模式
                </button>
                <button class="menu-btn btn-secondary" @click="$emit('selectMode', 'versus')">
                    ⚔️ 对打模式
                </button>
                <button class="menu-btn btn-assemble" @click="$emit('goToScreen', 'assemble')">
                    🔧 组装昆虫
                </button>
            </div>
            
            <div v-if="hasBug" style="margin-top: 40px; color: #86efac;">
                ✅ 已组装机械昆虫
            </div>
            <div v-else style="margin-top: 40px; color: #fca5a5;">
                ⚠️ 请先组装你的机械昆虫
            </div>
        </div>
    `
});

app.component('BugAssembler', {
    props: ['playerBug'],
    emits: ['goToScreen'],
    setup(props, { emit }) {
        const bugPartsData = bugParts;

        const selectPart = (category, part) => {
            audioManager.playClick();
            props.playerBug[category] = part;
            gameStorage.savePlayerBug({ ...props.playerBug });
        };

        const isSelected = (category, part) => {
            return props.playerBug[category]?.id === part.id;
        };

        const totalStats = computed(() => {
            const parts = [props.playerBug.body, props.playerBug.head, props.playerBug.legs, props.playerBug.weapon];
            return parts.reduce((acc, part) => {
                if (part) {
                    acc.hp += part.hp || 0;
                    acc.attack += part.attack || 0;
                    acc.defense += part.defense || 0;
                    acc.speed += part.speed || 0;
                }
                return acc;
            }, { hp: 0, attack: 0, defense: 0, speed: 0 });
        });

        return {
            bugPartsData,
            selectPart,
            isSelected,
            totalStats,
            audioManager
        };
    },
    template: `
        <div class="assemble-screen">
            <button class="back-btn" @click="$emit('goToScreen', 'menu')">← 返回主菜单</button>
            
            <h2 class="assemble-title">🔧 组装你的机械昆虫</h2>
            
            <div class="bug-preview">
                <div class="mech-bug-display">
                    <div class="mech-bug-svg">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <g class="mech-legs" :style="{ fill: playerBug.legs?.color || '#666' }">
                                <line x1="50" y1="120" x2="20" y2="170" stroke-width="6" stroke-linecap="round"/>
                                <line x1="60" y1="130" x2="30" y2="180" stroke-width="5" stroke-linecap="round"/>
                                <line x1="50" y1="110" x2="15" y2="130" stroke-width="4" stroke-linecap="round"/>
                                <line x1="150" y1="120" x2="180" y2="170" stroke-width="6" stroke-linecap="round"/>
                                <line x1="140" y1="130" x2="170" y2="180" stroke-width="5" stroke-linecap="round"/>
                                <line x1="150" y1="110" x2="185" y2="130" stroke-width="4" stroke-linecap="round"/>
                            </g>
                            <ellipse class="mech-body" cx="100" cy="100" rx="55" ry="35"
                                :fill="playerBug.body?.color || '#4a90d9'"
                                stroke="#333" stroke-width="2"/>
                            <ellipse cx="100" cy="100" rx="45" ry="25"
                                :fill="playerBug.body?.color || '#4a90d9'" opacity="0.7"/>
                            <circle cx="85" cy="92" r="4" fill="#0ff" opacity="0.8"/>
                            <circle cx="115" cy="92" r="4" fill="#0ff" opacity="0.8"/>
                            <g class="mech-head" :style="{ fill: playerBug.head?.color || '#d9d94a' }">
                                <ellipse cx="100" cy="65" rx="25" ry="20"
                                    :fill="playerBug.head?.color || '#d9d94a'"
                                    stroke="#333" stroke-width="2"/>
                                <circle cx="90" cy="60" r="5" fill="#f00" opacity="0.9"/>
                                <circle cx="110" cy="60" r="5" fill="#f00" opacity="0.9"/>
                                <circle cx="90" cy="60" r="2" fill="#fff"/>
                                <circle cx="110" cy="60" r="2" fill="#fff"/>
                                <line x1="95" y1="50" x2="85" y2="30" stroke="#555" stroke-width="2"/>
                                <line x1="105" y1="50" x2="115" y2="30" stroke="#555" stroke-width="2"/>
                                <circle cx="85" cy="28" r="3" fill="#555"/>
                                <circle cx="115" cy="28" r="3" fill="#555"/>
                            </g>
                            <g class="mech-weapon" :style="{ fill: playerBug.weapon?.color || '#ff4444' }">
                                <line x1="155" y1="90" x2="190" y2="70"
                                    :stroke="playerBug.weapon?.color || '#ff4444'"
                                    stroke-width="4" stroke-linecap="round"/>
                                <polygon points="190,70 198,65 195,78"
                                    :fill="playerBug.weapon?.color || '#ff4444'"/>
                                <circle cx="155" cy="90" r="3" fill="#666"/>
                            </g>
                        </svg>
                    </div>
                    <div class="mech-bug-label">
                        <span v-if="playerBug.body">{{ playerBug.body.name }}</span>
                        <span v-else>未组装</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-panel">
                <h3>📊 属性总览</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">❤️ 生命值: {{ totalStats.hp }}</span>
                        <div class="stat-bar">
                            <div class="stat-fill hp" :style="{ width: Math.min(totalStats.hp / 3, 100) + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⚔️ 攻击力: {{ totalStats.attack }}</span>
                        <div class="stat-bar">
                            <div class="stat-fill attack" :style="{ width: Math.min(totalStats.attack / 1.2, 100) + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🛡️ 防御力: {{ totalStats.defense }}</span>
                        <div class="stat-bar">
                            <div class="stat-fill defense" :style="{ width: Math.min(totalStats.defense * 2, 100) + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">💨 速度: {{ totalStats.speed }}</span>
                        <div class="stat-bar">
                            <div class="stat-fill speed" :style="{ width: Math.min(totalStats.speed * 1.5, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="parts-selection">
                <div class="part-category">
                    <h3>🦾 躯干</h3>
                    <div v-for="part in bugPartsData.bodies" :key="part.id"
                         class="part-item"
                         :class="{ selected: isSelected('body', part) }"
                         @click="selectPart('body', part)">
                        <span class="part-color" :style="{ background: part.color }"></span>
                        <div class="part-info">
                            <div class="part-name">{{ part.name }}</div>
                            <div class="part-stats">
                                HP:{{ part.hp }} 防:{{ part.defense }} 攻:{{ part.attack }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="part-category">
                    <h3>👁️ 头部</h3>
                    <div v-for="part in bugPartsData.heads" :key="part.id"
                         class="part-item"
                         :class="{ selected: isSelected('head', part) }"
                         @click="selectPart('head', part)">
                        <span class="part-color" :style="{ background: part.color }"></span>
                        <div class="part-info">
                            <div class="part-name">{{ part.name }}</div>
                            <div class="part-stats">
                                攻:{{ part.attack }} 速:{{ part.speed }} HP:{{ part.hp || 0 }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="part-category">
                    <h3>🦵 腿部</h3>
                    <div v-for="part in bugPartsData.legs" :key="part.id"
                         class="part-item"
                         :class="{ selected: isSelected('legs', part) }"
                         @click="selectPart('legs', part)">
                        <span class="part-color" :style="{ background: part.color }"></span>
                        <div class="part-info">
                            <div class="part-name">{{ part.name }}</div>
                            <div class="part-stats">
                                速:{{ part.speed }} 攻:{{ part.attack }} 防:{{ part.defense || 0 }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="part-category">
                    <h3>⚔️ 武器</h3>
                    <div v-for="part in bugPartsData.weapons" :key="part.id"
                         class="part-item"
                         :class="{ selected: isSelected('weapon', part) }"
                         @click="selectPart('weapon', part)">
                        <span class="part-color" :style="{ background: part.color }"></span>
                        <div class="part-info">
                            <div class="part-name">{{ part.name }}</div>
                            <div class="part-stats">
                                攻:{{ part.attack }} 速:{{ part.speed }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});

app.component('LevelSelect', {
    props: ['completedLevels', 'hasBug'],
    emits: ['goToScreen', 'startLevel'],
    setup(props, { emit }) {
        const levelData = levels;

        const isLevelUnlocked = (levelId) => {
            if (levelId === 1) return true;
            return props.completedLevels.includes(levelId - 1);
        };

        const isLevelCompleted = (levelId) => {
            return props.completedLevels.includes(levelId);
        };

        const startLevel = (level) => {
            if (!props.hasBug) {
                alert('请先组装你的机械昆虫！');
                return;
            }
            if (!isLevelUnlocked(level.id)) return;
            audioManager.playClick();
            emit('startLevel', level);
        };

        return {
            levelData,
            isLevelUnlocked,
            isLevelCompleted,
            startLevel,
            audioManager
        };
    },
    template: `
        <div class="mode-select">
            <button class="back-btn" @click="$emit('goToScreen', 'menu')">← 返回主菜单</button>
            
            <h2 class="mode-title">🏜️ 选择关卡</h2>
            
            <div v-if="!hasBug" style="text-align:center; color: #fca5a5; margin-bottom: 20px;">
                ⚠️ 请先返回组装你的机械昆虫！
            </div>
            
            <div class="level-grid">
                <div v-for="level in levelData" :key="level.id"
                     class="level-card"
                     :class="{ locked: !isLevelUnlocked(level.id) }"
                     @click="startLevel(level)">
                    <div class="level-icon">{{ level.icon }}</div>
                    <div class="level-name">{{ level.name }}</div>
                    <div class="level-desc">{{ level.description }}</div>
                    <div class="level-status" :class="{ completed: isLevelCompleted(level.id), locked: !isLevelUnlocked(level.id) }">
                        <span v-if="isLevelCompleted(level.id)">✅ 已通关</span>
                        <span v-else-if="isLevelUnlocked(level.id)">🔓 可挑战</span>
                        <span v-else>🔒 未解锁</span>
                    </div>
                </div>
            </div>
        </div>
    `
});

app.component('OpponentSelect', {
    props: ['versusWins', 'hasBug'],
    emits: ['goToScreen', 'startVersus'],
    setup(props, { emit }) {
        const opponents = versusOpponents;

        const startVersus = (opponent) => {
            if (!props.hasBug) {
                alert('请先组装你的机械昆虫！');
                return;
            }
            audioManager.playClick();
            emit('startVersus', opponent);
        };

        return {
            opponents,
            startVersus,
            audioManager
        };
    },
    template: `
        <div class="opponent-select">
            <button class="back-btn" @click="$emit('goToScreen', 'menu')">← 返回主菜单</button>
            
            <h2 class="mode-title">⚔️ 选择对手</h2>
            
            <div v-if="!hasBug" style="text-align:center; color: #fca5a5; margin-bottom: 20px;">
                ⚠️ 请先返回组装你的机械昆虫！
            </div>
            
            <div class="opponent-grid">
                <div v-for="opponent in opponents" :key="opponent.id"
                     class="opponent-card"
                     @click="startVersus(opponent)">
                    <div class="opponent-icon">{{ opponent.icon }}</div>
                    <div class="opponent-name">{{ opponent.name }}</div>
                    <div class="opponent-skill">必杀技: {{ opponent.skill.name }}</div>
                    <div class="opponent-stats">
                        <span class="stat-badge">❤️ {{ opponent.hp }}</span>
                        <span class="stat-badge">⚔️ {{ opponent.attack }}</span>
                        <span class="stat-badge">🛡️ {{ opponent.defense }}</span>
                    </div>
                    <div style="margin-top: 15px; color: #86efac;">
                        胜利次数: {{ versusWins[opponent.id] || 0 }}
                    </div>
                </div>
            </div>
        </div>
    `
});

app.component('BattleScreen', {
    props: ['playerBug', 'level', 'opponent', 'mode'],
    emits: ['goToScreen', 'levelComplete'],
    setup(props, { emit }) {
        const battleLog = ref([]);
        const playerHp = ref(0);
        const playerMaxHp = ref(0);
        const currentWave = ref(1);
        const showResult = ref(false);
        const battleResult = ref('');
        const isPlayerTurn = ref(true);
        const playerAttacking = ref(false);
        const playerHit = ref(false);
        const damageNumbers = ref([]);
        const skillCooldowns = ref({});
        const powerupsOnField = ref([]);
        const buffs = ref({ attack: 0, defense: 0 });
        const turnCount = ref(0);
        const enemies = ref([]);
        const selectedEnemyIndex = ref(0);
        const specialEffect = ref(null);
        const waveTransition = ref(false);
        const summonedBees = ref([]);

        const calculateStats = () => {
            const parts = [props.playerBug.body, props.playerBug.head, props.playerBug.legs, props.playerBug.weapon];
            return parts.reduce((acc, part) => {
                if (part) {
                    acc.hp += part.hp || 0;
                    acc.attack += part.attack || 0;
                    acc.defense += part.defense || 0;
                    acc.speed += part.speed || 0;
                }
                return acc;
            }, { hp: 0, attack: 0, defense: 0, speed: 0 });
        };

        const playerStats = computed(calculateStats);

        const getPlayerSkills = computed(() => {
            if (!props.playerBug.weapon) return playerSkills;
            const weapon = props.playerBug.weapon;
            if (weapon.id === 'weapon1') {
                return [
                    { id: 'sickle_slash', name: '镰刀横扫', damage: 35, cooldown: 1, type: 'damage', icon: '⚔️', description: '激光镰刀横扫' },
                    { id: 'sickle_spin', name: '旋风斩', damage: 50, cooldown: 3, type: 'aoe', icon: '🌀', description: '旋转镰刀攻击所有敌人' },
                    { id: 'energy_barrier', name: '能量护盾', defense: 30, cooldown: 3, type: 'defense', icon: '🛡️', description: '激活护盾' },
                    { id: 'nano_repair', name: '纳米修复', heal: 40, cooldown: 4, type: 'heal', icon: '💚', description: '修复生命' }
                ];
            } else if (weapon.id === 'weapon2') {
                return [
                    { id: 'plasma_shot', name: '等离子弹', damage: 45, cooldown: 2, type: 'damage', icon: '🔫', description: '发射等离子弹' },
                    { id: 'plasma_blast', name: '离子爆发', damage: 80, cooldown: 4, type: 'damage', icon: '💥', description: '蓄力高伤害攻击' },
                    { id: 'overcharge', name: '超载模式', attackBoost: 40, cooldown: 5, type: 'buff', icon: '⚡', description: '大幅提升攻击' },
                    { id: 'shield', name: '能量护盾', defense: 25, cooldown: 3, type: 'defense', icon: '🛡️', description: '激活护盾' }
                ];
            } else {
                return [
                    { id: 'poison_sting', name: '毒刺攻击', damage: 25, cooldown: 1, type: 'poison', icon: '💉', description: '注入毒素造成持续伤害' },
                    { id: 'toxic_cloud', name: '毒雾喷射', damage: 30, cooldown: 3, type: 'aoe', icon: '☠️', description: '释放毒雾攻击所有敌人' },
                    { id: 'heal', name: '纳米修复', heal: 45, cooldown: 3, type: 'heal', icon: '💚', description: '修复生命' },
                    { id: 'speed_up', name: '加速', attackBoost: 25, cooldown: 4, type: 'buff', icon: '💨', description: '提升攻击速度' }
                ];
            }
        });

        const addLog = (message, type = 'damage') => {
            battleLog.value.unshift({ message, type, id: Date.now() + Math.random() });
            if (battleLog.value.length > 20) {
                battleLog.value.pop();
            }
        };

        const showDamage = (amount, x, y, isHeal = false, targetIndex = null) => {
            const id = Date.now() + Math.random();
            damageNumbers.value.push({ id, amount, x, y, isHeal, targetIndex });
            setTimeout(() => {
                damageNumbers.value = damageNumbers.value.filter(d => d.id !== id);
            }, 1000);
        };

        const showSpecialEffect = (effectType, duration = 1000) => {
            specialEffect.value = effectType;
            setTimeout(() => { specialEffect.value = null; }, duration);
        };

        const spawnWaveEnemies = () => {
            if (props.mode === 'campaign' && props.level) {
                const enemyCount = Math.min(2 + Math.floor(currentWave.value / 2), 3);
                const newEnemies = [];
                const waveMultiplier = 1 + (currentWave.value - 1) * 0.15;
                
                for (let i = 0; i < enemyCount; i++) {
                    const enemyId = props.level.enemies[Math.floor(Math.random() * props.level.enemies.length)];
                    const template = enemiesData.find(e => e.id === enemyId);
                    if (template) {
                        newEnemies.push({
                            ...template,
                            uid: Date.now() + i,
                            hp: Math.floor(template.hp * waveMultiplier),
                            maxHp: Math.floor(template.hp * waveMultiplier),
                            attack: Math.floor(template.attack * waveMultiplier),
                            attacking: false,
                            hit: false,
                            poisoned: false,
                            poisonDamage: 0,
                            x: 700 - i * 150,
                            y: 350 + (i % 2) * 60
                        });
                    }
                }
                enemies.value = newEnemies;
                selectedEnemyIndex.value = 0;
                waveTransition.value = true;
                setTimeout(() => { waveTransition.value = false; }, 1000);
                addLog(`⚠️ 第 ${currentWave.value} 波敌人来袭！共 ${enemyCount} 个敌人！`, 'skill');
            }
        };

        const spawnVersusEnemy = () => {
            const opp = props.opponent;
            enemies.value = [{
                ...opp,
                uid: Date.now(),
                hp: opp.hp,
                maxHp: opp.maxHp,
                attacking: false,
                hit: false,
                poisoned: false,
                poisonDamage: 0,
                x: 700,
                y: 380,
                comboCount: 0,
                shieldActive: false,
                beesSummoned: 0
            }];
            summonedBees.value = [];
            selectedEnemyIndex.value = 0;
        };

        const initBattle = () => {
            const stats = calculateStats();
            playerMaxHp.value = stats.hp;
            playerHp.value = stats.hp;
            
            if (props.mode === 'campaign' && props.level) {
                currentWave.value = 1;
                spawnWaveEnemies();
                powerupsOnField.value = [...props.level.powerups];
                addLog(`🎯 ${props.level.name} - 开始战斗！`, 'skill');
            } else {
                spawnVersusEnemy();
                addLog(`⚔️ 对战 ${props.opponent.name}！`, 'skill');
            }
            
            showResult.value = false;
            isPlayerTurn.value = true;
            skillCooldowns.value = {};
            buffs.value = { attack: 0, defense: 0 };
            battleLog.value = [];
            turnCount.value = 0;
            summonedBees.value = [];
        };

        const playerAttack = (skillIndex = null) => {
            if (!isPlayerTurn.value || enemies.value.length === 0) return;
            
            const target = enemies.value[selectedEnemyIndex.value];
            if (!target || target.hp <= 0) return;
            
            isPlayerTurn.value = false;
            playerAttacking.value = true;
            audioManager.playAttack();

            setTimeout(() => {
                playerAttacking.value = false;
                const skills = getPlayerSkills.value;
                
                if (skillIndex !== null && skills[skillIndex]) {
                    const skill = skills[skillIndex];
                    if (skillCooldowns.value[skill.id] > 0) {
                        isPlayerTurn.value = true;
                        return;
                    }
                    
                    audioManager.playSkill();
                    
                    if (skill.type === 'damage' || skill.type === 'poison') {
                        const damage = Math.floor((playerStats.value.attack + buffs.value.attack + skill.damage) * (1 - target.defense / 100));
                        target.hp = Math.max(0, target.hp - damage);
                        target.hit = true;
                        showDamage(damage, target.x - 50, target.y - 50);
                        showSpecialEffect('slash');
                        addLog(`使用【${skill.name}】对 ${target.name} 造成 ${damage} 点伤害！`, 'skill');
                        
                        if (skill.type === 'poison') {
                            target.poisoned = true;
                            target.poisonDamage = Math.floor(damage * 0.2);
                            addLog(`${target.name} 中毒了！每回合受到 ${target.poisonDamage} 点伤害`, 'skill');
                        }
                        
                        setTimeout(() => { target.hit = false; }, 300);
                    } else if (skill.type === 'aoe') {
                        showSpecialEffect('explosion');
                        enemies.value.forEach((enemy, idx) => {
                            if (enemy.hp > 0) {
                                const dmg = Math.floor((playerStats.value.attack + buffs.value.attack + skill.damage) * 0.7 * (1 - enemy.defense / 100));
                                enemy.hp = Math.max(0, enemy.hp - dmg);
                                enemy.hit = true;
                                showDamage(dmg, enemy.x - 50, enemy.y - 50, false, idx);
                                setTimeout(() => { enemy.hit = false; }, 300);
                            }
                        });
                        addLog(`使用【${skill.name}】对所有敌人造成范围伤害！`, 'skill');
                    } else if (skill.type === 'heal') {
                        playerHp.value = Math.min(playerMaxHp.value, playerHp.value + skill.heal);
                        showDamage(skill.heal, 150, 300, true);
                        addLog(`使用【${skill.name}】恢复 ${skill.heal} 点生命！`, 'heal');
                        audioManager.playHeal();
                    } else if (skill.type === 'defense') {
                        buffs.value.defense += skill.defense;
                        addLog(`使用【${skill.name}】防御力提升 ${skill.defense}！`, 'skill');
                    } else if (skill.type === 'buff') {
                        buffs.value.attack += skill.attackBoost;
                        addLog(`使用【${skill.name}】攻击力提升 ${skill.attackBoost}！`, 'skill');
                    }
                    
                    skillCooldowns.value[skill.id] = skill.cooldown;
                } else {
                    const damage = Math.floor((playerStats.value.attack + buffs.value.attack) * (1 - target.defense / 100));
                    target.hp = Math.max(0, target.hp - damage);
                    target.hit = true;
                    showDamage(damage, target.x - 50, target.y - 50);
                    audioManager.playHit();
                    addLog(`普通攻击对 ${target.name} 造成 ${damage} 点伤害！`, 'damage');
                    setTimeout(() => { target.hit = false; }, 300);
                }
                
                const allDead = enemies.value.every(e => e.hp <= 0);
                if (allDead) {
                    handleEnemiesDefeated();
                } else {
                    if (target.hp <= 0 && selectedEnemyIndex.value < enemies.value.length - 1) {
                        selectedEnemyIndex.value++;
                    }
                    setTimeout(() => enemiesTurn(), 800);
                }
            }, 500);
        };

        const enemiesTurn = () => {
            turnCount.value++;
            
            enemies.value.forEach(enemy => {
                if (enemy.poisoned && enemy.hp > 0) {
                    enemy.hp = Math.max(0, enemy.hp - enemy.poisonDamage);
                    showDamage(enemy.poisonDamage, enemy.x - 50, enemy.y - 30);
                    addLog(`☠️ ${enemy.name} 受到 ${enemy.poisonDamage} 点毒素伤害！`, 'damage');
                }
            });
            
            let delay = 0;
            const aliveEnemies = enemies.value.filter(e => e.hp > 0);
            
            if (props.mode === 'versus' && aliveEnemies.length > 0) {
                const enemy = aliveEnemies[0];
                setTimeout(() => {
                    executeVersusEnemyTurn(enemy);
                }, delay);
            } else {
                aliveEnemies.forEach((enemy, idx) => {
                    setTimeout(() => {
                        executeCampaignEnemyTurn(enemy);
                    }, delay);
                    delay += 600;
                });
            }
            
            setTimeout(() => {
                Object.keys(skillCooldowns.value).forEach(key => {
                    if (skillCooldowns.value[key] > 0) skillCooldowns.value[key]--;
                });
                if (buffs.value.attack > 0) buffs.value.attack = Math.max(0, buffs.value.attack - 5);
                if (buffs.value.defense > 0) buffs.value.defense = Math.max(0, buffs.value.defense - 5);
                
                if (playerHp.value <= 0) {
                    handleDefeat();
                } else if (enemies.value.every(e => e.hp <= 0)) {
                    handleEnemiesDefeated();
                } else {
                    isPlayerTurn.value = true;
                }
            }, delay + 500);
        };

        const executeCampaignEnemyTurn = (enemy) => {
            if (enemy.hp <= 0 || playerHp.value <= 0) return;
            
            enemy.attacking = true;
            audioManager.playAttack();
            
            setTimeout(() => {
                enemy.attacking = false;
                const damage = Math.max(1, Math.floor(enemy.attack * (1 - (playerStats.value.defense + buffs.value.defense) / 100)));
                playerHp.value = Math.max(0, playerHp.value - damage);
                playerHit.value = true;
                showDamage(damage, 150, 300);
                audioManager.playHit();
                addLog(`${enemy.name} 攻击，造成 ${damage} 点伤害！`, 'damage');
                setTimeout(() => { playerHit.value = false; }, 300);
            }, 300);
        };

        const executeVersusEnemyTurn = (enemy) => {
            if (enemy.hp <= 0 || playerHp.value <= 0) return;
            
            enemy.attacking = true;
            
            const opponent = versusOpponents.find(o => o.id === enemy.id);
            const action = Math.random();
            
            setTimeout(() => {
                enemy.attacking = false;
                
                if (enemy.id === 'mantis') {
                    if (action < 0.4) {
                        const damage = Math.floor((enemy.attack + 25) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        showSpecialEffect('slash');
                        playerHp.value = Math.max(0, playerHp.value - damage);
                        playerHit.value = true;
                        showDamage(damage, 150, 300);
                        addLog(`🦗 ${enemy.name} 使用【刀刃斩击】造成 ${damage} 点伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.7 && enemy.comboCount < 2) {
                        enemy.comboCount++;
                        const damage1 = Math.floor((enemy.attack + 15) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        const damage2 = Math.floor((enemy.attack + 15) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        playerHp.value = Math.max(0, playerHp.value - damage1 - damage2);
                        playerHit.value = true;
                        showDamage(damage1, 150, 290);
                        setTimeout(() => showDamage(damage2, 160, 310), 200);
                        addLog(`🌪️ ${enemy.name} 使用【双刃旋风斩】造成 ${damage1 + damage2} 点连击伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.85) {
                        enemy.shieldActive = true;
                        addLog(`🛡️ ${enemy.name} 使用【螳螂反击】进入防御状态！`, 'skill');
                        audioManager.playSkill();
                    } else {
                        enemy.attack += 20;
                        addLog(`🔥 ${enemy.name} 激活【猎手本能】攻击力大幅提升！`, 'skill');
                        audioManager.playSkill();
                    }
                } else if (enemy.id === 'bee') {
                    if (action < 0.35) {
                        const damage = Math.floor((enemy.attack + 20) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        playerHp.value = Math.max(0, playerHp.value - damage);
                        playerHit.value = true;
                        showDamage(damage, 150, 300);
                        addLog(`💉 ${enemy.name} 使用【毒刺突袭】造成 ${damage} 点伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.6 && summonedBees.value.length < 2) {
                        summonedBees.value.push({ id: Date.now(), x: 600 + summonedBees.value.length * 50, y: 300 });
                        const damage = Math.floor((enemy.attack + 35) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        playerHp.value = Math.max(0, playerHp.value - damage);
                        playerHit.value = true;
                        showDamage(damage, 150, 300);
                        showSpecialEffect('swarm');
                        addLog(`🐝 ${enemy.name} 使用【蜂群轰炸】召唤小蜜蜂造成 ${damage} 点伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.8) {
                        const heal = 30;
                        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                        showDamage(heal, 700, 300, true);
                        addLog(`🍯 ${enemy.name} 使用【蜂蜜修复】恢复 ${heal} 点生命！`, 'heal');
                        audioManager.playHeal();
                    } else {
                        enemy.attack += 15;
                        addLog(`💃 ${enemy.name} 跳【摇摆舞】，攻击力提升！`, 'skill');
                        audioManager.playSkill();
                    }
                } else if (enemy.id === 'beetle') {
                    if (action < 0.3) {
                        const damage = Math.floor((enemy.attack + 25) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        playerHp.value = Math.max(0, playerHp.value - damage);
                        playerHit.value = true;
                        showDamage(damage, 150, 300);
                        addLog(`💥 ${enemy.name} 使用【重型撞击】造成 ${damage} 点伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.55) {
                        const damage = Math.floor((enemy.attack + 50) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        showSpecialEffect('quake');
                        playerHp.value = Math.max(0, playerHp.value - damage);
                        playerHit.value = true;
                        showDamage(damage, 150, 300);
                        addLog(`🌋 ${enemy.name} 使用【地震冲撞】造成 ${damage} 点毁灭性伤害！`, 'skill');
                        audioManager.playSkill();
                    } else if (action < 0.8) {
                        enemy.shieldActive = true;
                        enemy.defense += 30;
                        addLog(`🛡️ ${enemy.name} 缩进【铁壁甲壳】，防御力大幅提升！`, 'skill');
                        audioManager.playSkill();
                    } else {
                        const heal = 50;
                        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                        showDamage(heal, 700, 300, true);
                        addLog(`♻️ ${enemy.name} 使用【甲壳再生】恢复 ${heal} 点生命！`, 'heal');
                        audioManager.playHeal();
                    }
                }
                
                setTimeout(() => { playerHit.value = false; }, 300);
            }, 400);
        };

        const handleEnemiesDefeated = () => {
            addLog('🎉 所有敌人被击败！', 'victory');
            
            if (props.mode === 'campaign') {
                if (currentWave.value < props.level.waves) {
                    currentWave.value++;
                    setTimeout(() => {
                        spawnWaveEnemies();
                        isPlayerTurn.value = true;
                    }, 2000);
                } else {
                    handleVictory();
                }
            } else {
                handleVictory();
            }
        };

        const handleVictory = () => {
            battleResult.value = 'victory';
            showResult.value = true;
            audioManager.playVictory();
            
            if (props.mode === 'campaign') {
                gameStorage.saveCompletedLevel(props.level.id);
                emit('levelComplete', props.level.id);
            } else {
                gameStorage.saveVersusWin(props.opponent.id);
            }
        };

        const handleDefeat = () => {
            battleResult.value = 'defeat';
            showResult.value = true;
            audioManager.playDefeat();
        };

        const exitBattle = () => {
            emit('goToScreen', props.mode === 'campaign' ? 'levelSelect' : 'opponentSelect');
        };

        const collectPowerup = (powerup, index) => {
            audioManager.playPowerup();
            const effect = powerupEffects[powerup.type];
            
            if (effect.type === 'heal') {
                playerHp.value = Math.min(playerMaxHp.value, playerHp.value + effect.value);
                showDamage(effect.value, 150, 300, true);
                addLog(`拾取 ${effect.name}，恢复 ${effect.value} 生命！`, 'heal');
            } else if (effect.type === 'attack') {
                buffs.value.attack += effect.value;
                addLog(`拾取 ${effect.name}，攻击力提升！`, 'skill');
            } else if (effect.type === 'defense') {
                buffs.value.defense += effect.value;
                addLog(`拾取 ${effect.name}，防御力提升！`, 'skill');
            }
            
            powerupsOnField.value.splice(index, 1);
        };

        const selectEnemy = (index) => {
            if (enemies.value[index] && enemies.value[index].hp > 0) {
                selectedEnemyIndex.value = index;
            }
        };

        onMounted(() => {
            initBattle();
        });

        const canUseSkill = (skill) => {
            return !skillCooldowns.value[skill.id] || skillCooldowns.value[skill.id] <= 0;
        };

        return {
            battleLog,
            playerHp,
            playerMaxHp,
            enemies,
            summonedBees,
            currentWave,
            showResult,
            battleResult,
            isPlayerTurn,
            playerAttacking,
            playerHit,
            damageNumbers,
            skillCooldowns,
            powerupsOnField,
            buffs,
            playerStats,
            getPlayerSkills,
            selectedEnemyIndex,
            specialEffect,
            waveTransition,
            playerAttack,
            collectPowerup,
            canUseSkill,
            selectEnemy,
            exitBattle,
            initBattle,
            audioManager
        };
    },
    template: `
        <div class="battle-screen">
            <button class="back-btn" @click="exitBattle">← 退出战斗</button>
            
            <div class="battle-arena" :class="[
                'arena-' + (level?.theme || 'versus'),
                { 'wave-transition': waveTransition }
            ]">
                <div v-if="mode === 'campaign'" class="wave-indicator">
                    第 {{ currentWave }} / {{ level.waves }} 波
                </div>
                <div v-else class="mode-indicator">
                    ⚔️ BOSS战
                </div>
                
                <div v-for="(obs, idx) in level?.obstacles || []" :key="idx"
                     class="obstacle"
                     :style="{ left: obs.x + 'px', top: obs.y + 'px' }">
                    {{ obs.icon }}
                </div>
                
                <div v-for="(pu, idx) in powerupsOnField" :key="idx"
                     class="powerup"
                     :style="{ left: pu.x + 'px', top: pu.y + 'px' }"
                     @click="collectPowerup(pu, idx)">
                    {{ pu.icon }}
                </div>
                
                <div v-for="bee in summonedBees" :key="bee.id"
                     class="summoned-bee"
                     :style="{ left: bee.x + 'px', top: bee.y + 'px' }">
                    🐝
                </div>
                
                <div v-if="specialEffect" class="special-effect" :class="specialEffect">
                    <span v-if="specialEffect === 'slash'">🗡️</span>
                    <span v-if="specialEffect === 'explosion'">💥</span>
                    <span v-if="specialEffect === 'quake'">🌋</span>
                    <span v-if="specialEffect === 'swarm'">🐝🐝🐝</span>
                </div>
                
                <div class="bug-character player" :class="{ hit: playerHit }">
                    <div class="bug-sprite bug-sprite-player"
                         :class="{ attacking: playerAttacking }">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                            <g class="mech-legs" :style="{ stroke: playerBug.legs?.color || '#666' }">
                                <line x1="25" y1="60" x2="10" y2="85" stroke-width="4" stroke-linecap="round"/>
                                <line x1="30" y1="65" x2="15" y2="90" stroke-width="3" stroke-linecap="round"/>
                                <line x1="25" y1="55" x2="8" y2="65" stroke-width="2" stroke-linecap="round"/>
                                <line x1="75" y1="60" x2="90" y2="85" stroke-width="4" stroke-linecap="round"/>
                                <line x1="70" y1="65" x2="85" y2="90" stroke-width="3" stroke-linecap="round"/>
                                <line x1="75" y1="55" x2="92" y2="65" stroke-width="2" stroke-linecap="round"/>
                            </g>
                            <ellipse class="mech-body" cx="50" cy="50" rx="28" ry="18"
                                :fill="playerBug.body?.color || '#4a90d9'"
                                stroke="#333" stroke-width="1"/>
                            <ellipse cx="50" cy="50" rx="22" ry="12"
                                :fill="playerBug.body?.color || '#4a90d9'" opacity="0.7"/>
                            <circle cx="42" cy="46" r="2" fill="#0ff" opacity="0.8"/>
                            <circle cx="58" cy="46" r="2" fill="#0ff" opacity="0.8"/>
                            <g class="mech-head" :style="{ fill: playerBug.head?.color || '#d9d94a' }">
                                <ellipse cx="50" cy="32" rx="12" ry="10"
                                    :fill="playerBug.head?.color || '#d9d94a'"
                                    stroke="#333" stroke-width="1"/>
                                <circle cx="45" cy="30" r="2.5" fill="#f00" opacity="0.9"/>
                                <circle cx="55" cy="30" r="2.5" fill="#f00" opacity="0.9"/>
                                <circle cx="45" cy="30" r="1" fill="#fff"/>
                                <circle cx="55" cy="30" r="1" fill="#fff"/>
                                <line x1="48" y1="25" x2="43" y2="15" stroke="#555" stroke-width="1"/>
                                <line x1="52" y1="25" x2="57" y2="15" stroke="#555" stroke-width="1"/>
                                <circle cx="43" cy="14" r="1.5" fill="#555"/>
                                <circle cx="57" cy="14" r="1.5" fill="#555"/>
                            </g>
                            <g class="mech-weapon" :style="{ fill: playerBug.weapon?.color || '#ff4444' }">
                                <line x1="78" y1="45" x2="95" y2="35"
                                    :stroke="playerBug.weapon?.color || '#ff4444'"
                                    stroke-width="3" stroke-linecap="round"/>
                                <polygon points="95,35 99,32 97,39"
                                    :fill="playerBug.weapon?.color || '#ff4444'"/>
                            </g>
                        </svg>
                    </div>
                    <div class="bug-health-bar">
                        <div class="bug-health-fill" :style="{ width: (playerHp / playerMaxHp * 100) + '%' }"></div>
                    </div>
                    <div class="bug-name">我的昆虫 ({{ playerHp }}/{{ playerMaxHp }})</div>
                </div>
                
                <div v-for="(enemy, idx) in enemies" :key="enemy.uid"
                     v-show="enemy.hp > 0"
                     class="bug-character enemy-card"
                     :class="{ 
                         selected: selectedEnemyIndex === idx, 
                         attacking: enemy.attacking, 
                         hit: enemy.hit,
                         poisoned: enemy.poisoned
                     }"
                     :style="{ right: (100 + idx * 120) + 'px' }"
                     @click="selectEnemy(idx)">
                    <div class="enemy-target-marker" v-if="selectedEnemyIndex === idx">🎯</div>
                    <div class="bug-sprite enemy-sprite">
                        {{ enemy.icon }}
                    </div>
                    <div class="bug-health-bar">
                        <div class="bug-health-fill enemy-health" 
                             :style="{ width: (enemy.hp / enemy.maxHp * 100) + '%' }"></div>
                    </div>
                    <div class="bug-name">{{ enemy.name }} ({{ enemy.hp }}/{{ enemy.maxHp }})</div>
                    <div v-if="enemy.poisoned" class="status-icon poison">☠️</div>
                </div>
                
                <div v-for="dmg in damageNumbers" :key="dmg.id"
                     class="damage-number"
                     :class="{ heal: dmg.isHeal }"
                     :style="{ left: dmg.x + 'px', top: dmg.y + 'px' }">
                    {{ dmg.isHeal ? '+' : '-' }}{{ dmg.amount }}
                </div>
            </div>
            
            <div class="battle-info-bar">
                <div class="enemy-selector">
                    <span style="margin-right: 10px;">选择目标:</span>
                    <button v-for="(enemy, idx) in enemies" :key="enemy.uid"
                            v-show="enemy.hp > 0"
                            class="target-btn"
                            :class="{ active: selectedEnemyIndex === idx }"
                            @click="selectEnemy(idx)">
                        {{ enemy.icon }} {{ enemy.name }}
                    </button>
                </div>
            </div>
            
            <div class="battle-controls">
                <button class="skill-btn" @click="playerAttack(null)" :disabled="!isPlayerTurn">
                    ⚔️ 普通攻击
                </button>
                <button v-for="(skill, idx) in getPlayerSkills" :key="skill.id"
                        class="skill-btn"
                        :class="{ 
                            heal: skill.type === 'heal', 
                            defense: skill.type === 'defense', 
                            buff: skill.type === 'buff',
                            aoe: skill.type === 'aoe',
                            poison: skill.type === 'poison'
                        }"
                        @click="playerAttack(idx)"
                        :disabled="!isPlayerTurn || !canUseSkill(skill)"
                        :title="skill.description">
                    {{ skill.icon }} {{ skill.name }}
                    <div v-if="skillCooldowns[skill.id] > 0" class="skill-cooldown">
                        冷却: {{ skillCooldowns[skill.id] }}
                    </div>
                </button>
            </div>
            
            <div class="battle-log">
                <div v-for="log in battleLog" :key="log.id"
                     class="log-entry"
                     :class="log.type">
                    {{ log.message }}
                </div>
            </div>
            
            <div v-if="showResult" class="modal-overlay">
                <div class="modal-content">
                    <h2 class="modal-title" :class="battleResult">
                        {{ battleResult === 'victory' ? '🎉 胜利！' : '💀 失败...' }}
                    </h2>
                    <p class="modal-text">
                        {{ battleResult === 'victory' ? '恭喜你击败了所有敌人！' : '你的机械昆虫被击败了...' }}
                    </p>
                    <div class="modal-buttons">
                        <button class="modal-btn primary" @click="exitBattle">
                            返回选择
                        </button>
                        <button class="modal-btn secondary" @click="initBattle">
                            再来一次
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});

app.mount('#app');

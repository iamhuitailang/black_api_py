import { bugParts, playerSkills, skills, enemies, versusOpponents, levels, powerupEffects } from './data/gameData.js';
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
        const enemyHp = ref(0);
        const enemyMaxHp = ref(0);
        const currentEnemy = ref(null);
        const currentWave = ref(1);
        const showResult = ref(false);
        const battleResult = ref('');
        const isPlayerTurn = ref(true);
        const playerAttacking = ref(false);
        const enemyAttacking = ref(false);
        const playerHit = ref(false);
        const enemyHit = ref(false);
        const damageNumbers = ref([]);
        const skillCooldowns = ref({});
        const enemySkillCooldowns = ref({});
        const powerupsOnField = ref([]);
        const buffs = ref({ attack: 0, defense: 0 });
        const enemyBuffs = ref({ attack: 0, defense: 0 });
        const enemySkillIndex = ref(0);
        const turnCount = ref(0);

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

        const saveBattleState = () => {
            if (props.mode === 'campaign' && props.level && !showResult.value) {
                gameStorage.saveBattleState({
                    levelId: props.level.id,
                    currentWave: currentWave.value,
                    currentEnemyId: currentEnemy.value?.id,
                    playerHp: playerHp.value,
                    enemyHp: enemyHp.value,
                    enemyMaxHp: enemyMaxHp.value,
                    battleLog: battleLog.value.slice(0, 10)
                });
            }
        };

        const initBattle = () => {
            const stats = calculateStats();
            playerMaxHp.value = stats.hp;
            enemySkillCooldowns.value = {};
            enemySkillIndex.value = 0;
            turnCount.value = 0;
            
            const savedState = gameStorage.loadBattleState();
            
            if (props.mode === 'campaign' && props.level && savedState && savedState.levelId === props.level.id) {
                currentWave.value = savedState.currentWave || 1;
                playerHp.value = savedState.playerHp || stats.hp;
                enemyMaxHp.value = savedState.enemyMaxHp || 0;
                enemyHp.value = savedState.enemyHp || 0;
                battleLog.value = savedState.battleLog || [];
                
                if (savedState.currentEnemyId) {
                    const enemyTemplate = enemies.find(e => e.id === savedState.currentEnemyId);
                    if (enemyTemplate) {
                        const waveMultiplier = 1 + (currentWave.value - 1) * 0.2;
                        currentEnemy.value = {
                            ...enemyTemplate,
                            hp: enemyHp.value,
                            maxHp: enemyMaxHp.value,
                            attack: Math.floor(enemyTemplate.attack * waveMultiplier)
                        };
                    }
                } else {
                    spawnEnemy();
                }
                powerupsOnField.value = [...props.level.powerups];
            } else {
                playerHp.value = stats.hp;
                gameStorage.clearBattleState();
                
                if (props.mode === 'campaign' && props.level) {
                    spawnEnemy();
                    powerupsOnField.value = [...props.level.powerups];
                } else if (props.mode === 'versus' && props.opponent) {
                    currentEnemy.value = { ...props.opponent };
                    enemyMaxHp.value = props.opponent.maxHp;
                    enemyHp.value = props.opponent.hp;
                }
                battleLog.value = [];
            }
            
            showResult.value = false;
            isPlayerTurn.value = true;
            skillCooldowns.value = {};
            buffs.value = { attack: 0, defense: 0 };
            enemyBuffs.value = { attack: 0, defense: 0 };
            if (battleLog.value.length === 0) {
                addLog('战斗开始！', 'skill');
            }
        };

        const spawnEnemy = () => {
            const enemyIds = props.level.enemies;
            const randomEnemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
            const enemyTemplate = enemies.find(e => e.id === randomEnemyId);
            
            const waveMultiplier = 1 + (currentWave.value - 1) * 0.2;
            currentEnemy.value = {
                ...enemyTemplate,
                hp: Math.floor(enemyTemplate.hp * waveMultiplier),
                maxHp: Math.floor(enemyTemplate.hp * waveMultiplier),
                attack: Math.floor(enemyTemplate.attack * waveMultiplier)
            };
            enemyMaxHp.value = currentEnemy.value.maxHp;
            enemyHp.value = currentEnemy.value.hp;
            enemySkillCooldowns.value = {};
            addLog(`第 ${currentWave.value} 波: ${currentEnemy.value.name} 出现了！`, 'skill');
            saveBattleState();
        };

        const addLog = (message, type = 'damage') => {
            battleLog.value.unshift({ message, type, id: Date.now() + Math.random() });
            if (battleLog.value.length > 20) {
                battleLog.value.pop();
            }
        };

        const showDamage = (amount, isPlayer, isHeal = false) => {
            const id = Date.now() + Math.random();
            damageNumbers.value.push({
                id,
                amount,
                isPlayer,
                isHeal
            });
            setTimeout(() => {
                damageNumbers.value = damageNumbers.value.filter(d => d.id !== id);
            }, 1000);
        };

        const playerAttack = (skillIndex = null) => {
            if (!isPlayerTurn.value || !currentEnemy.value) return;
            
            isPlayerTurn.value = false;
            playerAttacking.value = true;
            audioManager.playAttack();

            setTimeout(() => {
                playerAttacking.value = false;
                let damage = 0;
                
                if (skillIndex !== null && playerSkills[skillIndex]) {
                    const skill = playerSkills[skillIndex];
                    if (skillCooldowns.value[skill.id] > 0) {
                        isPlayerTurn.value = true;
                        return;
                    }
                    
                    audioManager.playSkill();
                    
                    if (skill.type === 'damage') {
                        damage = Math.floor((playerStats.value.attack + buffs.value.attack + skill.damage) * (1 - currentEnemy.value.defense / 100));
                        damage = Math.max(1, damage);
                        addLog(`使用 ${skill.name}，造成 ${damage} 点伤害！`, 'skill');
                    } else if (skill.type === 'heal') {
                        const healAmount = skill.heal;
                        playerHp.value = Math.min(playerMaxHp.value, playerHp.value + healAmount);
                        showDamage(healAmount, true, true);
                        addLog(`使用 ${skill.name}，恢复 ${healAmount} 点生命！`, 'heal');
                        audioManager.playHeal();
                    } else if (skill.type === 'defense') {
                        buffs.value.defense += skill.defense;
                        addLog(`使用 ${skill.name}，防御力提升 ${skill.defense}！`, 'skill');
                    } else if (skill.type === 'buff') {
                        buffs.value.attack += skill.attackBoost;
                        addLog(`使用 ${skill.name}，攻击力提升 ${skill.attackBoost}！`, 'skill');
                    }
                    
                    skillCooldowns.value[skill.id] = skill.cooldown;
                } else {
                    damage = Math.floor((playerStats.value.attack + buffs.value.attack) * (1 - currentEnemy.value.defense / 100));
                    damage = Math.max(1, damage);
                    addLog(`普通攻击，造成 ${damage} 点伤害！`, 'damage');
                }
                
                if (damage > 0) {
                    enemyHit.value = true;
                    enemyHp.value = Math.max(0, enemyHp.value - damage);
                    showDamage(damage, false);
                    audioManager.playHit();
                    setTimeout(() => { enemyHit.value = false; }, 300);
                }
                
                saveBattleState();
                
                if (enemyHp.value <= 0) {
                    handleEnemyDefeated();
                } else {
                    setTimeout(() => enemyTurn(), 1000);
                }
            }, 500);
        };

        const chooseEnemySkill = () => {
            if (props.mode === 'versus' && currentEnemy.value.skills) {
                const opponent = versusOpponents.find(o => o.id === currentEnemy.value.id);
                if (opponent && opponent.skills) {
                    const availableSkills = opponent.skills.filter(s => 
                        !enemySkillCooldowns.value[s.id] || enemySkillCooldowns.value[s.id] <= 0
                    );
                    
                    if (availableSkills.length > 0) {
                        if (opponent.aiPattern === 'aggressive') {
                            const hpRatio = enemyHp.value / enemyMaxHp.value;
                            if (hpRatio < 0.4) {
                                const healSkill = availableSkills.find(s => s.type === 'heal');
                                if (healSkill) return healSkill;
                                const buffSkill = availableSkills.find(s => s.type === 'buff');
                                if (buffSkill) return buffSkill;
                            }
                            const damageSkills = availableSkills.filter(s => s.type === 'damage');
                            if (damageSkills.length > 0) {
                                return damageSkills.reduce((a, b) => a.damage > b.damage ? a : b);
                            }
                        } else if (opponent.aiPattern === 'fast') {
                            const hpRatio = enemyHp.value / enemyMaxHp.value;
                            if (hpRatio < 0.6) {
                                const healSkill = availableSkills.find(s => s.type === 'heal');
                                if (healSkill) return healSkill;
                            }
                            const cooldownSkills = availableSkills.filter(s => s.cooldown <= 2 && s.type === 'damage');
                            if (cooldownSkills.length > 0) {
                                return cooldownSkills[Math.floor(Math.random() * cooldownSkills.length)];
                            }
                            return availableSkills[Math.floor(Math.random() * availableSkills.length)];
                        } else if (opponent.aiPattern === 'defensive') {
                            const hpRatio = enemyHp.value / enemyMaxHp.value;
                            if (hpRatio < 0.5) {
                                const healSkill = availableSkills.find(s => s.type === 'heal');
                                if (healSkill) return healSkill;
                            }
                            if (turnCount.value % 3 === 0) {
                                const defSkill = availableSkills.find(s => s.type === 'defense');
                                if (defSkill) return defSkill;
                            }
                            const damageSkills = availableSkills.filter(s => s.type === 'damage');
                            if (damageSkills.length > 0) {
                                return damageSkills[Math.floor(Math.random() * damageSkills.length)];
                            }
                        }
                        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
                    }
                }
            }
            return null;
        };

        const enemyTurn = () => {
            if (!currentEnemy.value || playerHp.value <= 0) return;
            
            enemyAttacking.value = true;
            turnCount.value++;

            const enemySkill = chooseEnemySkill();
            const useSkill = enemySkill && Math.random() > 0.1;

            setTimeout(() => {
                enemyAttacking.value = false;
                let damage = 0;
                
                if (useSkill) {
                    audioManager.playSkill();
                    const s = enemySkill;
                    
                    if (s.type === 'damage') {
                        damage = Math.floor((currentEnemy.value.attack + enemyBuffs.value.attack + s.damage) * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                        damage = Math.max(1, damage);
                        addLog(`💥 ${currentEnemy.value.name} 使用【${s.name}】，造成 ${damage} 点伤害！`, 'skill');
                    } else if (s.type === 'heal') {
                        const healAmount = s.heal;
                        enemyHp.value = Math.min(enemyMaxHp.value, enemyHp.value + healAmount);
                        showDamage(healAmount, false, true);
                        addLog(`💚 ${currentEnemy.value.name} 使用【${s.name}】，恢复 ${healAmount} 点生命！`, 'heal');
                        audioManager.playHeal();
                    } else if (s.type === 'defense') {
                        enemyBuffs.value.defense += s.defense;
                        addLog(`🛡️ ${currentEnemy.value.name} 使用【${s.name}】，防御力提升 ${s.defense}！`, 'skill');
                    } else if (s.type === 'buff') {
                        enemyBuffs.value.attack += s.attackBoost;
                        addLog(`🔥 ${currentEnemy.value.name} 使用【${s.name}】，攻击力提升 ${s.attackBoost}！`, 'skill');
                    }
                    
                    enemySkillCooldowns.value[s.id] = s.cooldown;
                } else {
                    damage = Math.floor(currentEnemy.value.attack * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                    damage = Math.max(1, damage);
                    addLog(`${currentEnemy.value.name} 攻击，造成 ${damage} 点伤害！`, 'damage');
                    audioManager.playAttack();
                }
                
                if (damage > 0) {
                    playerHit.value = true;
                    playerHp.value = Math.max(0, playerHp.value - damage);
                    showDamage(damage, true);
                    audioManager.playHit();
                    setTimeout(() => { playerHit.value = false; }, 300);
                }
                
                Object.keys(skillCooldowns.value).forEach(key => {
                    if (skillCooldowns.value[key] > 0) skillCooldowns.value[key]--;
                });
                Object.keys(enemySkillCooldowns.value).forEach(key => {
                    if (enemySkillCooldowns.value[key] > 0) enemySkillCooldowns.value[key]--;
                });
                
                if (buffs.value.attack > 0) buffs.value.attack = Math.max(0, buffs.value.attack - 5);
                if (buffs.value.defense > 0) buffs.value.defense = Math.max(0, buffs.value.defense - 5);
                if (enemyBuffs.value.attack > 0) enemyBuffs.value.attack = Math.max(0, enemyBuffs.value.attack - 5);
                if (enemyBuffs.value.defense > 0) enemyBuffs.value.defense = Math.max(0, enemyBuffs.value.defense - 5);
                
                saveBattleState();
                
                if (playerHp.value <= 0) {
                    handleDefeat();
                } else {
                    isPlayerTurn.value = true;
                }
            }, 500);
        };

        const handleEnemyDefeated = () => {
            addLog(`${currentEnemy.value.name} 被击败了！`, 'victory');
            
            if (props.mode === 'campaign') {
                if (currentWave.value < props.level.waves) {
                    currentWave.value++;
                    setTimeout(() => {
                        spawnEnemy();
                        isPlayerTurn.value = true;
                    }, 1500);
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
            gameStorage.clearBattleState();
            
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
            gameStorage.clearBattleState();
        };

        const exitBattle = () => {
            gameStorage.clearBattleState();
            emit('goToScreen', props.mode === 'campaign' ? 'levelSelect' : 'opponentSelect');
        };

        const collectPowerup = (powerup, index) => {
            audioManager.playPowerup();
            const effect = powerupEffects[powerup.type];
            
            if (effect.type === 'heal') {
                playerHp.value = Math.min(playerMaxHp.value, playerHp.value + effect.value);
                showDamage(effect.value, true, true);
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
            enemyHp,
            enemyMaxHp,
            currentEnemy,
            currentWave,
            showResult,
            battleResult,
            isPlayerTurn,
            playerAttacking,
            enemyAttacking,
            playerHit,
            enemyHit,
            damageNumbers,
            skillCooldowns,
            powerupsOnField,
            buffs,
            playerStats,
            playerSkills,
            playerAttack,
            collectPowerup,
            canUseSkill,
            exitBattle,
            audioManager
        };
    },
    template: `
        <div class="battle-screen">
            <button class="back-btn" @click="exitBattle">← 退出战斗</button>
            
            <div class="battle-arena" :class="'arena-' + (level?.theme || 'versus')">
                <div v-if="mode === 'campaign'" class="wave-indicator">
                    第 {{ currentWave }} / {{ level.waves }} 波
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
                
                <div class="bug-character player">
                    <div class="bug-sprite bug-sprite-player"
                         :class="{ attacking: playerAttacking, hit: playerHit }">
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
                
                <div v-if="currentEnemy" class="bug-character enemy">
                    <div class="bug-sprite"
                         :class="{ attacking: enemyAttacking, hit: enemyHit }">
                        {{ currentEnemy.icon }}
                    </div>
                    <div class="bug-health-bar">
                        <div class="bug-health-fill" :style="{ width: (enemyHp / enemyMaxHp * 100) + '%' }"></div>
                    </div>
                    <div class="bug-name">{{ currentEnemy.name }} ({{ enemyHp }}/{{ enemyMaxHp }})</div>
                </div>
                
                <div v-for="dmg in damageNumbers" :key="dmg.id"
                     class="damage-number"
                     :class="{ heal: dmg.isHeal }"
                     :style="{ left: dmg.isPlayer ? '150px' : 'calc(100% - 200px)', bottom: '200px' }">
                    {{ dmg.isHeal ? '+' : '-' }}{{ dmg.amount }}
                </div>
            </div>
            
            <div class="battle-controls">
                <button class="skill-btn" @click="playerAttack(null)" :disabled="!isPlayerTurn">
                    ⚔️ 普通攻击
                </button>
                <button v-for="(skill, idx) in playerSkills" :key="skill.id"
                        class="skill-btn"
                        :class="{ heal: skill.type === 'heal', defense: skill.type === 'defense', buff: skill.type === 'buff' }"
                        @click="playerAttack(idx)"
                        :disabled="!isPlayerTurn || !canUseSkill(skill)">
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

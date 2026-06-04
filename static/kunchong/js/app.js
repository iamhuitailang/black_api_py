import { bugParts, skills, enemies, versusOpponents, levels, powerupEffects } from './data/gameData.js';
import { gameStorage } from './utils/storage.js';
import { audioManager } from './utils/audio.js';

const { createApp, ref, computed, reactive, onMounted, watch } = Vue;

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

        onMounted(() => {
            audioManager.init();
            loadSavedData();
        });

        const loadSavedData = () => {
            const savedBug = gameStorage.loadPlayerBug();
            if (savedBug) {
                Object.assign(playerBug, savedBug);
            }
            completedLevels.value = gameStorage.loadCompletedLevels();
            versusWins.value = gameStorage.loadVersusWins();
        };

        const goToScreen = (screen) => {
            audioManager.playClick();
            currentScreen.value = screen;
            currentLevel.value = null;
            currentOpponent.value = null;
        };

        const selectMode = (mode) => {
            audioManager.playClick();
            selectedMode.value = mode;
            if (mode === 'campaign') {
                currentScreen.value = 'levelSelect';
            } else {
                currentScreen.value = 'opponentSelect';
            }
        };

        const startLevel = (level) => {
            currentLevel.value = level;
            currentScreen.value = 'battle';
        };

        const startVersus = (opponent) => {
            currentOpponent.value = opponent;
            currentScreen.value = 'battle';
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
            gameStorage.savePlayerBug(props.playerBug);
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

        const bugDisplay = computed(() => {
            const parts = [];
            if (props.playerBug.weapon) parts.push(props.playerBug.weapon.icon);
            if (props.playerBug.head) parts.push(props.playerBug.head.icon);
            if (props.playerBug.body) parts.push(props.playerBug.body.icon);
            if (props.playerBug.legs) parts.push(props.playerBug.legs.icon);
            return parts.length > 0 ? parts.join('') : '❓';
        });

        return {
            bugPartsData,
            selectPart,
            isSelected,
            totalStats,
            bugDisplay,
            audioManager
        };
    },
    template: `
        <div class="assemble-screen">
            <button class="back-btn" @click="$emit('goToScreen', 'menu')">← 返回主菜单</button>
            
            <h2 class="assemble-title">🔧 组装你的机械昆虫</h2>
            
            <div class="bug-preview">
                <div class="bug-display">{{ bugDisplay }}</div>
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
                        <span class="part-icon">{{ part.icon }}</span>
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
                        <span class="part-icon">{{ part.icon }}</span>
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
                        <span class="part-icon">{{ part.icon }}</span>
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
                        <span class="part-icon">{{ part.icon }}</span>
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
    setup(props) {
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
        const powerupsOnField = ref([]);
        const buffs = ref({ attack: 0, defense: 0 });

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

        const initBattle = () => {
            const stats = calculateStats();
            playerMaxHp.value = stats.hp;
            playerHp.value = stats.hp;
            
            if (props.mode === 'campaign' && props.level) {
                spawnEnemy();
                powerupsOnField.value = [...props.level.powerups];
            } else if (props.mode === 'versus' && props.opponent) {
                currentEnemy.value = { ...props.opponent };
                enemyMaxHp.value = props.opponent.maxHp;
                enemyHp.value = props.opponent.hp;
            }
            
            battleLog.value = [];
            showResult.value = false;
            isPlayerTurn.value = true;
            skillCooldowns.value = {};
            buffs.value = { attack: 0, defense: 0 };
            addLog('战斗开始！', 'skill');
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
            addLog(`第 ${currentWave.value} 波: ${currentEnemy.value.name} 出现了！`, 'skill');
        };

        const addLog = (message, type = 'damage') => {
            battleLog.value.unshift({ message, type, id: Date.now() });
            if (battleLog.value.length > 20) {
                battleLog.value.pop();
            }
        };

        const showDamage = (amount, isPlayer, isHeal = false) => {
            const id = Date.now();
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
                
                if (skillIndex !== null && skills[skillIndex]) {
                    const skill = skills[skillIndex];
                    if (skillCooldowns.value[skill.id] > 0) return;
                    
                    audioManager.playSkill();
                    
                    if (skill.type === 'damage') {
                        damage = Math.floor((playerStats.value.attack + buffs.value.attack + skill.damage) * (1 - currentEnemy.value.defense / 100));
                        addLog(`使用 ${skill.name}，造成 ${damage} 点伤害！`, 'skill');
                    } else if (skill.type === 'heal') {
                        const healAmount = skill.heal;
                        playerHp.value = Math.min(playerMaxHp.value, playerHp.value + healAmount);
                        showDamage(healAmount, true, true);
                        addLog(`使用 ${skill.name}，恢复 ${healAmount} 点生命！`, 'heal');
                        audioManager.playHeal();
                    } else if (skill.type === 'defense') {
                        buffs.value.defense = skill.defense;
                        addLog(`使用 ${skill.name}，防御力提升！`, 'skill');
                    } else if (skill.type === 'buff') {
                        buffs.value.attack = skill.attackBoost;
                        addLog(`使用 ${skill.name}，攻击力提升！`, 'skill');
                    }
                    
                    skillCooldowns.value[skill.id] = skill.cooldown;
                } else {
                    damage = Math.floor((playerStats.value.attack + buffs.value.attack) * (1 - currentEnemy.value.defense / 100));
                    addLog(`普通攻击，造成 ${damage} 点伤害！`, 'damage');
                }
                
                if (damage > 0) {
                    enemyHit.value = true;
                    enemyHp.value = Math.max(0, enemyHp.value - damage);
                    showDamage(damage, false);
                    audioManager.playHit();
                    setTimeout(() => { enemyHit.value = false; }, 300);
                }
                
                if (enemyHp.value <= 0) {
                    handleEnemyDefeated();
                } else {
                    setTimeout(() => enemyTurn(), 1000);
                }
            }, 500);
        };

        const enemyTurn = () => {
            if (!currentEnemy.value || playerHp.value <= 0) return;
            
            enemyAttacking.value = true;
            audioManager.playAttack();

            setTimeout(() => {
                enemyAttacking.value = false;
                
                let damage = Math.floor(currentEnemy.value.attack * (1 - (playerStats.value.defense + buffs.value.defense) / 100));
                damage = Math.max(1, damage);
                
                playerHit.value = true;
                playerHp.value = Math.max(0, playerHp.value - damage);
                showDamage(damage, true);
                addLog(`${currentEnemy.value.name} 攻击，造成 ${damage} 点伤害！`, 'damage');
                audioManager.playHit();
                
                setTimeout(() => { playerHit.value = false; }, 300);
                
                Object.keys(skillCooldowns.value).forEach(key => {
                    if (skillCooldowns.value[key] > 0) {
                        skillCooldowns.value[key]--;
                    }
                });
                
                if (buffs.value.attack > 0) buffs.value.attack = Math.max(0, buffs.value.attack - 1);
                if (buffs.value.defense > 0) buffs.value.defense = Math.max(0, buffs.value.defense - 1);
                
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

        const playerDisplay = computed(() => {
            const parts = [];
            if (props.playerBug.weapon) parts.push(props.playerBug.weapon.icon);
            if (props.playerBug.head) parts.push(props.playerBug.head.icon);
            if (props.playerBug.body) parts.push(props.playerBug.body.icon);
            return parts.join('');
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
            skills,
            playerAttack,
            collectPowerup,
            playerDisplay,
            canUseSkill,
            audioManager
        };
    },
    template: `
        <div class="battle-screen">
            <button class="back-btn" @click="$emit('goToScreen', mode === 'campaign' ? 'levelSelect' : 'opponentSelect')">← 退出战斗</button>
            
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
                    <div class="bug-sprite"
                         :class="{ attacking: playerAttacking, hit: playerHit }">
                        {{ playerDisplay }}
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
                <button v-for="(skill, idx) in skills" :key="skill.id"
                        class="skill-btn"
                        :class="{ heal: skill.type === 'heal' }"
                        @click="playerAttack(idx)"
                        :disabled="!isPlayerTurn || !canUseSkill(skill)">
                    {{ skill.name }}
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
                        <button class="modal-btn primary" @click="$emit('goToScreen', mode === 'campaign' ? 'levelSelect' : 'opponentSelect')">
                            返回选择
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});

app.mount('#app');

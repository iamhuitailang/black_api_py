const { createApp, ref, reactive, computed, onMounted } = Vue;

const ASSIGNMENT_LABELS = {
    'idle': '待命',
    'scavenge': '地表搜寻',
    'maintenance': '维护设施',
    'farming': '种植食物',
    'guard': '守卫大门'
};

const FACILITY_META = {
    'generator': { name: '发电机', icon: '⚡', cssClass: 'generator' },
    'water_cycler': { name: '水循环器', icon: '💧', cssClass: 'water' },
    'medbay': { name: '医疗站', icon: '➕', cssClass: 'medbay' }
};

const ASSIGN_ICONS = {
    'scavenge': '🔍',
    'maintenance': '🔧',
    'farming': '🌱',
    'guard': '🛡️'
};

createApp({
    setup() {
        const screen = ref('boot');
        const saves = ref([]);
        const gameState = ref(null);
        const selectedResident = ref(null);
        const wandererEvent = ref(null);
        const showNewGame = ref(false);
        const newGameName = ref('Vault 101');
        const advancing = ref(false);
        const message = ref('');

        const currentSaveId = computed(() => gameState.value?.data?.save?.id);

        const save = computed(() => gameState.value?.data?.save);
        const residents = computed(() => gameState.value?.data?.residents || []);
        const facilities = computed(() => gameState.value?.data?.facilities || []);
        const logs = computed(() => gameState.value?.data?.logs || []);
        const capacity = computed(() => gameState.value?.data?.capacity || 4);

        const population = computed(() => residents.value.filter(r => r.is_alive).length);
        const isFull = computed(() => population.value >= capacity.value);

        const residentsByAssignment = computed(() => {
            const map = {};
            for (const key in ASSIGNMENT_LABELS) {
                map[key] = [];
            }
            residents.value.forEach(r => {
                if (r.is_alive && map[r.assignment]) {
                    map[r.assignment].push(r);
                }
            });
            return map;
        });

        const vaultLayers = computed(() => {
            return [
                [
                    { id: 'door', type: 'door', name: '大门', icon: '🚪', level: null,
                      workers: residentsByAssignment.value.guard },
                    { id: 'hub-top', type: 'hub', name: '中央枢纽', icon: '◈', level: null, workers: [] },
                    { id: 'surface', type: 'surface', name: '地表通道', icon: '☢️', level: null,
                      workers: residentsByAssignment.value.scavenge }
                ],
                [
                    { id: 'generator', type: 'generator', name: '发电机', icon: '⚡',
                      level: getFacilityLevel('generator'),
                      workers: residentsByAssignment.value.maintenance.filter((_, i) => i < 2),
                      facility: getFacility('generator') },
                    { id: 'hub-mid', type: 'hub', name: '居住区', icon: '⌂', level: null,
                      workers: residentsByAssignment.value.idle },
                    { id: 'water_cycler', type: 'water_cycler', name: '水循环器', icon: '💧',
                      level: getFacilityLevel('water_cycler'),
                      workers: residentsByAssignment.value.maintenance.filter((_, i) => i >= 2),
                      facility: getFacility('water_cycler') }
                ],
                [
                    { id: 'farm', type: 'farm', name: '水培农场', icon: '🌱', level: null,
                      workers: residentsByAssignment.value.farming,
                      farmOutput: 5 + residentsByAssignment.value.farming.length * 12 },
                    { id: 'medbay', type: 'medbay', name: '医疗站', icon: '➕',
                      level: getFacilityLevel('medbay'),
                      workers: [],
                      facility: getFacility('medbay') },
                    { id: 'storage', type: 'hub', name: '储藏室', icon: '📦', level: null, workers: [] }
                ]
            ];
        });

        function getFacility(type) {
            return facilities.value.find(f => f.type === type);
        }

        function getFacilityLevel(type) {
            const f = getFacility(type);
            return f ? f.level : null;
        }

        async function loadSaves() {
            const res = await VaultAPI.listSaves();
            if (res.code === 0) {
                saves.value = res.data;
            }
        }

        async function startNewGame() {
            if (!newGameName.value.trim()) {
                showMessage('请输入避难所名称');
                return;
            }
            const res = await VaultAPI.newGame(newGameName.value.trim());
            if (res.code === 0) {
                gameState.value = res;
                screen.value = 'game';
                showNewGame.value = false;
                localStorage.setItem('vault_current_save', currentSaveId.value);
                showMessage('避难所启动成功！');
            } else {
                showMessage(res.message);
            }
        }

        async function loadSave(saveId) {
            const res = await VaultAPI.getState(saveId);
            if (res.code === 0) {
                gameState.value = res;
                screen.value = 'game';
                localStorage.setItem('vault_current_save', saveId);
                showMessage('存档加载成功');
            } else {
                showMessage(res.message);
            }
        }

        function backToMenu() {
            screen.value = 'boot';
            gameState.value = null;
            selectedResident.value = null;
            wandererEvent.value = null;
            localStorage.removeItem('vault_current_save');
            loadSaves();
        }

        async function confirmDeleteSave(saveId, event) {
            event.stopPropagation();
            if (confirm('确定要删除这个存档吗？')) {
                await VaultAPI.deleteSave(saveId);
                if (currentSaveId.value === saveId) {
                    localStorage.removeItem('vault_current_save');
                }
                await loadSaves();
            }
        }

        async function assignResident(assignment) {
            if (!selectedResident.value || !currentSaveId.value) return;
            const res = await VaultAPI.assignResident(
                currentSaveId.value,
                selectedResident.value.id,
                assignment
            );
            if (res.code === 0) {
                gameState.value = res;
                const updated = residents.value.find(r => r.id === selectedResident.value.id);
                selectedResident.value = updated || null;
            } else {
                showMessage(res.message);
            }
        }

        async function upgradeFacilityUI(facilityType) {
            if (!currentSaveId.value) return;
            const res = await VaultAPI.upgradeFacility(currentSaveId.value, facilityType);
            if (res.code === 0) {
                gameState.value = res;
                showMessage(`${FACILITY_META[facilityType]?.name || facilityType} 升级成功！`);
            } else {
                showMessage(res.message);
            }
        }

        async function advanceDayAction() {
            if (!currentSaveId.value || advancing.value) return;
            advancing.value = true;
            try {
                const res = await VaultAPI.advanceDay(currentSaveId.value);
                if (res.code === 0) {
                    gameState.value = res;
                    if (res.data?.wanderer_event) {
                        wandererEvent.value = res.data.wanderer_event;
                    }
                } else {
                    showMessage(res.message);
                }
            } finally {
                advancing.value = false;
            }
        }

        async function handleWanderer(accept) {
            if (!wandererEvent.value || !currentSaveId.value) return;
            const res = await VaultAPI.handleWanderer(
                currentSaveId.value,
                wandererEvent.value,
                accept
            );
            if (res.code === 0) {
                gameState.value = res;
                wandererEvent.value = null;
                showMessage(accept ? '流浪者已加入避难所！' : '流浪者被送走了...');
            } else {
                showMessage(res.message);
                if (!accept) {
                    wandererEvent.value = null;
                }
            }
        }

        function selectResident(resident) {
            if (!resident.is_alive) return;
            selectedResident.value = resident;
        }

        function showMessage(msg) {
            message.value = msg;
            setTimeout(() => {
                if (message.value === msg) message.value = '';
            }, 3000);
        }

        function pct(value, max) {
            return Math.round((value / max) * 100);
        }

        function isLow(value, threshold = 25) {
            return value <= threshold;
        }

        function formatDate(iso) {
            if (!iso) return '';
            try {
                const d = new Date(iso);
                return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            } catch(e) { return ''; }
        }

        onMounted(async () => {
            await loadSaves();
            const savedId = localStorage.getItem('vault_current_save');
            if (savedId) {
                const id = parseInt(savedId, 10);
                const exists = saves.value.some(s => s.id === id);
                if (exists) {
                    await loadSave(id);
                } else {
                    localStorage.removeItem('vault_current_save');
                }
            }
        });

        return {
            screen, saves, gameState, selectedResident, wandererEvent,
            showNewGame, newGameName, advancing, message,
            save, residents, facilities, logs, capacity,
            population, isFull, vaultLayers, residentsByAssignment,
            currentSaveId,
            loadSaves, startNewGame, loadSave, backToMenu, confirmDeleteSave,
            assignResident, upgradeFacilityUI, advanceDayAction,
            handleWanderer, selectResident,
            ASSIGNMENT_LABELS, FACILITY_META, ASSIGN_ICONS,
            pct, isLow, formatDate
        };
    },
    template: `
    <div class="vault-app">
        <!-- BOOT SCREEN -->
        <div v-if="screen === 'boot'" class="screen-center">
            <h1 class="big-title">VAULT OS</h1>
            <div class="boot-text">// POST-APOCALYPSE SURVIVAL SYSTEM v2.077 //</div>

            <div v-if="!showNewGame">
                <div class="section-title">[ 存档列表 ]</div>
                <div class="save-list">
                    <div v-for="sv in saves" :key="sv.id" class="save-item" @click="loadSave(sv.id)">
                        <div class="save-info">
                            <div class="save-name">{{ sv.name }}</div>
                            <div class="save-meta">
                                第 {{ sv.day }} 天 · 更新于 {{ formatDate(sv.updated_at) }}
                            </div>
                        </div>
                        <button class="crt-btn small danger" @click="confirmDeleteSave(sv.id, $event)">删除</button>
                    </div>
                    <div v-if="saves.length === 0" class="text-dim mt-10">暂无存档，请创建新游戏</div>
                </div>

                <div class="btn-row" style="justify-content:center; margin-top:20px;">
                    <button class="crt-btn primary" @click="showNewGame = true">▶ 创建新避难所</button>
                </div>
            </div>

            <div v-else>
                <div class="section-title">[ 创建新避难所 ]</div>
                <div class="mb-10">
                    <input class="crt-input" v-model="newGameName" placeholder="输入避难所名称 (如 Vault 101)" maxlength="32" />
                </div>
                <div class="btn-row" style="justify-content:center;">
                    <button class="crt-btn" @click="showNewGame = false">取消</button>
                    <button class="crt-btn primary" @click="startNewGame">确认创建</button>
                </div>
            </div>
        </div>

        <!-- GAME SCREEN -->
        <template v-else-if="screen === 'game' && gameState">
            <!-- HEADER -->
            <div class="crt-header">
                <div>
                    <div class="crt-title">{{ save.name }}</div>
                    <div class="crt-subtitle">// 地下避难所管理终端 // 核战生存协议 //</div>
                </div>
                <div style="display:flex; gap:30px; align-items:center;">
                    <div class="day-indicator">DAY <span class="num">{{ save.day }}</span></div>
                    <div class="population-display">
                        人口: {{ population }} / 
                        <span :class="isFull ? 'full' : 'cap'">{{ capacity }}</span>
                        <span v-if="isFull"> [容量已满]</span>
                    </div>
                    <div class="btn-row">
                        <button class="crt-btn primary" :disabled="advancing" @click="advanceDayAction">
                            {{ advancing ? '推进中...' : '▶ 推进一天' }}
                        </button>
                        <button class="crt-btn small" @click="backToMenu">返回菜单</button>
                    </div>
                </div>
            </div>

            <!-- MAIN -->
            <div class="crt-main">
                <!-- LEFT: Resources + Facilities -->
                <div class="crt-panel">
                    <div class="crt-panel-title">[ 资源储备 ]</div>

                    <div class="resource-bar">
                        <div class="resource-label"><span class="icon">⚡</span> 能源 <span>{{ save.current_energy }}/{{ save.max_energy }}</span></div>
                        <div class="resource-track"><div class="resource-fill energy" :class="{low: isLow(save.current_energy)}" :style="{width: pct(save.current_energy, save.max_energy)+'%'}"></div></div>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-label"><span class="icon">💧</span> 净水 <span>{{ save.current_water }}/{{ save.max_water }}</span></div>
                        <div class="resource-track"><div class="resource-fill water" :class="{low: isLow(save.current_water)}" :style="{width: pct(save.current_water, save.max_water)+'%'}"></div></div>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-label"><span class="icon">🍖</span> 食物 <span>{{ save.current_food }}/{{ save.max_food }}</span></div>
                        <div class="resource-track"><div class="resource-fill food" :class="{low: isLow(save.current_food)}" :style="{width: pct(save.current_food, save.max_food)+'%'}"></div></div>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-label"><span class="icon">💊</span> 药品 <span>{{ save.current_medicine }}/{{ save.max_medicine }}</span></div>
                        <div class="resource-track"><div class="resource-fill medicine" :class="{low: isLow(save.current_medicine, 10)}" :style="{width: pct(save.current_medicine, save.max_medicine)+'%'}"></div></div>
                    </div>

                    <div class="section-title">[ 设施管理 ]</div>

                    <div v-for="f in facilities" :key="f.id" class="mb-10" style="padding:6px; border:1px solid var(--crt-green-dark);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:20px;">{{ FACILITY_META[f.type]?.icon }}</span>
                                <strong style="font-size:16px;">{{ FACILITY_META[f.type]?.name || f.type }}</strong>
                                <span class="text-cyan" style="margin-left:8px;">Lv.{{ f.level }}</span>
                            </div>
                            <button class="crt-btn small" :disabled="f.level >= 5" @click="upgradeFacilityUI(f.type)">
                                {{ f.level >= 5 ? '已满级' : '升级' }}
                            </button>
                        </div>
                        <div class="facility-info" style="margin-top:4px;">
                            <span v-if="f.type==='generator'">每日产电: <strong>{{ 10 * f.level }}</strong></span>
                            <span v-else-if="f.type==='water_cycler'">每日产水: <strong>{{ 10 * f.level }}</strong></span>
                            <span v-else-if="f.type==='medbay'">每日制药: <strong>{{ 5 * f.level }}</strong></span>
                            <span class="text-dim" style="margin-left:8px;" v-if="f.upgrade_cost">
                                升级消耗: 
                                <span v-if="f.type==='generator'">🍖 {{ f.upgrade_cost.food }}</span>
                                <span v-else-if="f.type==='water_cycler'">⚡ {{ f.upgrade_cost.energy }}</span>
                                <span v-else-if="f.type==='medbay'">💧 {{ f.upgrade_cost.water }}</span>
                            </span>
                            <span class="text-dim" style="margin-left:8px;" v-else>
                                已满级
                            </span>
                        </div>
                        <div class="text-dim" style="font-size:13px; margin-top:3px;">
                            {{ f.type==='water_cycler' || f.type==='generator' ? '人口容量 +' + (f.level * 2) : '' }}
                        </div>
                    </div>

                    <div class="section-title">[ 容量说明 ]</div>
                    <div class="facility-info">
                        基础容量: <strong>4</strong><br>
                        每级水循环器: <strong>+2</strong><br>
                        每级发电机: <strong>+2</strong>
                    </div>
                </div>

                <!-- CENTER: Vault Cross-Section -->
                <div class="crt-panel cross-section">
                    <div class="crt-panel-title">[ 避难所截面图 ]</div>

                    <div class="vault-visual">
                        <div v-for="(layer, li) in vaultLayers" :key="li" class="vault-layer">
                            <div v-for="room in layer" :key="room.id"
                                 class="vault-room"
                                 :class="room.cssClass || room.type">
                                <span v-if="room.level !== null" class="room-level">Lv.{{ room.level }}</span>
                                <div class="room-icon">{{ room.icon }}</div>
                                <div class="room-name">{{ room.name }}</div>
                                <div v-if="room.workers && room.workers.length" class="room-workers">
                                    <span v-for="w in room.workers" :key="w.id" class="worker-badge" :title="w.name">
                                        {{ w.name.slice(0,2) }}
                                    </span>
                                </div>
                                <div v-if="room.facility" style="margin-top:4px; font-size:12px;">
                                    <button class="crt-btn small" @click="upgradeFacilityUI(room.type)" :disabled="room.level >= 5">
                                        {{ room.level >= 5 ? '满级' : '↑升级' }}
                                    </button>
                                    <span v-if="room.facility.upgrade_cost" class="text-dim" style="margin-left:4px;">
                                        <span v-if="room.type==='generator'">🍖{{ room.facility.upgrade_cost.food }}</span>
                                        <span v-else-if="room.type==='water_cycler'">⚡{{ room.facility.upgrade_cost.energy }}</span>
                                        <span v-else-if="room.type==='medbay'">💧{{ room.facility.upgrade_cost.water }}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-title">[ 工作分配统计 ]</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:14px;">
                        <div>🔍 地表搜寻: <span class="text-cyan">{{ residentsByAssignment.scavenge.length }}</span></div>
                        <div>🔧 维护设施: <span class="text-cyan">{{ residentsByAssignment.maintenance.length }}</span></div>
                        <div>🌱 种植食物: <span class="text-cyan">{{ residentsByAssignment.farming.length }}</span></div>
                        <div>🛡️ 守卫大门: <span class="text-cyan">{{ residentsByAssignment.guard.length }}</span></div>
                        <div>◈ 待命: <span class="text-cyan">{{ residentsByAssignment.idle.length }}</span></div>
                    </div>

                    <div v-if="message" class="mt-20 text-amber" style="font-size:16px; text-align:center;">
                        >> {{ message }} <<
                    </div>
                </div>

                <!-- RIGHT: Residents + Logs -->
                <div class="crt-panel">
                    <div class="crt-panel-title">[ 居民档案 ]</div>

                    <div v-for="r in residents" :key="r.id"
                         class="resident-card"
                         :class="{selected: selectedResident?.id === r.id, dead: !r.is_alive}"
                         @click="selectResident(r)">
                        <div class="resident-name">
                            <span>{{ r.name }}</span>
                            <span class="resident-assign">[{{ ASSIGNMENT_LABELS[r.assignment] }}]</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">🍖饥饿</span>
                            <div class="stat-track"><div class="stat-fill" :class="{low: isLow(r.hunger, 30)}" :style="{width: r.hunger+'%', background: isLow(r.hunger, 30)?'var(--crt-red)':'var(--crt-green)'}"></div></div>
                            <span class="stat-value">{{ r.hunger }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">❤健康</span>
                            <div class="stat-track"><div class="stat-fill" :class="{low: isLow(r.health, 30)}" :style="{width: r.health+'%', background: isLow(r.health, 30)?'var(--crt-red)':'#00ff41'}"></div></div>
                            <span class="stat-value">{{ r.health }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">☺心情</span>
                            <div class="stat-track"><div class="stat-fill" :class="{low: isLow(r.mood, 30)}" :style="{width: r.mood+'%', background: isLow(r.mood, 30)?'var(--crt-red)':'var(--crt-amber)'}"></div></div>
                            <span class="stat-value">{{ r.mood }}</span>
                        </div>
                    </div>

                    <div v-if="selectedResident" class="mt-10" style="padding:8px; border:1px dashed var(--crt-cyan);">
                        <div class="text-cyan" style="font-size:16px; margin-bottom:6px;">▶ 分配 {{ selectedResident.name }}:</div>
                        <div class="assignment-grid">
                            <button v-for="(label, key) in ASSIGNMENT_LABELS" :key="key"
                                    class="crt-btn small assign-btn"
                                    :class="{active: selectedResident.assignment === key}"
                                    @click="assignResident(key)">
                                {{ ASSIGN_ICONS[key] || '◈' }} {{ label }}
                            </button>
                        </div>
                    </div>

                    <div class="section-title">[ 事件日志 ]</div>
                    <div class="log-panel">
                        <div v-for="log in logs" :key="log.id" class="log-entry" :class="log.type">
                            <span class="log-day">D{{ log.day }}</span>{{ log.message }}
                        </div>
                        <div v-if="logs.length === 0" class="text-dim">暂无事件记录</div>
                    </div>
                </div>
            </div>
        </template>

        <!-- WANDERER MODAL -->
        <div v-if="wandererEvent" class="modal-overlay" @click.self="wandererEvent = null">
            <div class="modal-box">
                <div class="modal-title">⚠ 流浪者请求入境</div>
                <div class="modal-body">
                    检测到外部生命信号。一名流浪者正敲响避难所大门，请求入住。
                    <br><br>
                    <div class="wanderer-stats">
                        <div style="font-size:20px; margin-bottom:8px;">
                            姓名: <span class="highlight">{{ wandererEvent.name }}</span>
                        </div>
                        <div style="font-size:14px;">
                            饥饿: <span :class="isLow(wandererEvent.hunger, 30)?'text-red':'text-cyan'">{{ wandererEvent.hunger }}</span> |
                            健康: <span :class="isLow(wandererEvent.health, 30)?'text-red':'text-cyan'">{{ wandererEvent.health }}</span> |
                            心情: <span :class="isLow(wandererEvent.mood, 30)?'text-red':'text-cyan'">{{ wandererEvent.mood }}</span>
                        </div>
                    </div>
                    <div v-if="isFull" class="text-red">
                        ⚠ 避难所人口已满 ({{ population }}/{{ capacity }})，无法接纳！
                    </div>
                    <div v-else class="text-amber">
                        接纳: 增加 1 名居民，但每日资源消耗上升。<br>
                        拒绝: 所有居民心情下降 8 点。
                    </div>
                </div>
                <div class="btn-row" style="justify-content:center;">
                    <button class="crt-btn danger" @click="handleWanderer(false)" :disabled="isFull">✗ 拒绝</button>
                    <button class="crt-btn primary" @click="handleWanderer(true)" :disabled="isFull">✓ 接纳</button>
                </div>
            </div>
        </div>
    </div>
    `
}).mount('#app');

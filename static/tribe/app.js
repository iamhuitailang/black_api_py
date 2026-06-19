const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

const API_BASE = '/api/tribe';

const ERA_NAMES = { stone: '石器时代', copper: '铜器时代', iron: '铁器时代', firearm: '火器时代' };
const ERA_STYLE_CLASS = { stone: 'era-stone', copper: 'era-copper', iron: 'era-iron', firearm: 'era-firearm' };
const SEASON_INFO = {
    spring: { name: '春', icon: '🌸' },
    summer: { name: '夏', icon: '🌞' },
    autumn: { name: '秋', icon: '🍂' },
    winter: { name: '冬', icon: '❄️' }
};
const RESOURCE_INFO = {
    food: { icon: '🍖', name: '食物' },
    wood: { icon: '🪵', name: '木材' },
    stone: { icon: '🪨', name: '石料' },
    metal: { icon: '⚙️', name: '金属' },
    knowledge: { icon: '📚', name: '知识' }
};
const JOB_NAMES = {
    idle: '待命', gatherer: '采集者', hunter: '猎人', builder: '建造者',
    researcher: '研究者', soldier: '士兵', trader: '商人', farmer: '农夫', miner: '矿工'
};
const JOB_ICONS = {
    idle: '🧍', gatherer: '🧺', hunter: '🏹', builder: '🔨',
    researcher: '📖', soldier: '⚔️', trader: '💰', farmer: '🌾', miner: '⛏️'
};
const RELATION_NAMES = {
    war: '战争', hostile: '敌对', neutral: '中立', friendly: '友好', ally: '同盟', peace: '和平'
};
const SKILL_LABELS = {
    skill_gathering: '采集', skill_hunting: '狩猎', skill_building: '建造',
    skill_research: '研究', skill_military: '军事', skill_trade: '贸易'
};
const SKILL_COLORS = {
    skill_gathering: '#22c55e', skill_hunting: '#ef4444', skill_building: '#f59e0b',
    skill_research: '#3b82f6', skill_military: '#dc2626', skill_trade: '#a855f7'
};
const BRANCH_COLORS = {
    military: '#ef4444', economy: '#22c55e', civic: '#3b82f6', root: '#a855f7'
};
const BRANCH_NAMES = {
    military: '军事', economy: '经济', civic: '文化', root: '核心'
};

async function api(endpoint, method = 'GET', body = null, params = null) {
    let url = API_BASE + endpoint;
    if (params) {
        const qs = new URLSearchParams(params).toString();
        url += '?' + qs;
    }
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
        const resp = await fetch(url, opts);
        return await resp.json();
    } catch (e) {
        return { code: 1, message: '网络错误: ' + e.message, data: null };
    }
}

const App = {
    setup() {
        const view = ref('start');
        const activeTab = ref('panorama');
        const tribeId = ref(null);
        const gameState = ref(null);
        const savedGames = ref([]);
        const toasts = ref([]);

        const showBuildModal = ref(false);
        const showTradeModal = ref(false);
        const showTechModal = ref(false);
        const currentTradeTribe = ref(null);
        const currentTechInfo = ref(null);
        const newGameName = ref('');
        const battleResult = ref(null);

        const tradeForm = reactive({
            offered_resource: 'food', offered_amount: 10, requested_resource: 'wood'
        });

        const techTreeData = ref({ nodes: [], edges: [] });

        function showToast(msg, type = 'info') {
            const id = Date.now() + Math.random();
            toasts.value.push({ id, message: msg, type });
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            }, 4000);
        }

        async function loadSavedGames() {
            const r = await api('/game/list/get');
            if (r.code === 0 && r.data) savedGames.value = r.data;
        }

        async function createGame() {
            if (!newGameName.value.trim()) {
                showToast('请输入部落名称', 'error');
                return;
            }
            const r = await api('/game/create', 'POST', { name: newGameName.value.trim() });
            if (r.code === 0) {
                showToast('游戏创建成功！', 'success');
                await loadGame(r.data.tribe_id);
            } else {
                showToast(r.message, 'error');
            }
        }

        async function loadGame(id) {
            tribeId.value = id;
            view.value = 'game';
            await refreshState();
            await loadTechTree();
            applySeasonClass();
        }

        async function refreshState() {
            const r = await api('/state/get', 'GET', null, { tribe_id: tribeId.value });
            if (r.code === 0 && r.data) {
                gameState.value = r.data;
                applySeasonClass();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function loadTechTree() {
            const r = await api('/tech/tree/get');
            if (r.code === 0 && r.data) techTreeData.value = r.data;
        }

        function applySeasonClass() {
            if (!gameState.value) return;
            document.body.className = '';
            document.body.classList.add('season-' + gameState.value.tribe.season);
        }

        async function deleteGame(id, event) {
            event.stopPropagation();
            if (!confirm('确定要删除这个存档吗？')) return;
            const r = await api('/game/delete', 'DELETE', null, { tribe_id: id });
            if (r.code === 0) {
                showToast('存档已删除', 'success');
                await loadSavedGames();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function advanceTurn() {
            const r = await api('/turn/advance', 'POST', { tribe_id: tribeId.value });
            if (r.code === 0) {
                await refreshState();
                const d = r.data;
                if (d.era_advance_notice) {
                    showToast('🎉 进入' + ERA_NAMES[d.era_advance_notice] + '!', 'success');
                }
                const season = SEASON_INFO[d.season];
                showToast(`第${d.year}年 ${season.icon}${season.name} | 食物产出+${d.production.food}`, 'info');
            } else {
                showToast(r.message, 'error');
            }
        }

        async function advanceEra() {
            if (!confirm('确定要进入下一时代吗？')) return;
            const r = await api('/era/advance', 'POST', { tribe_id: tribeId.value });
            if (r.code === 0) {
                showToast('🏛️ 时代晋级成功！', 'success');
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function assignJob(personId, job) {
            const r = await api('/job/assign', 'POST', {
                tribe_id: tribeId.value, person_id: personId, job
            });
            if (r.code === 0) {
                showToast('已分配工作', 'success');
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function researchTech(techId) {
            if (!confirm(`确定要研究该科技吗？`)) return;
            const r = await api('/research', 'POST', { tribe_id: tribeId.value, tech_id: techId });
            if (r.code === 0) {
                showToast('🔬 研究完成！', 'success');
                showTechModal.value = false;
                currentTechInfo.value = null;
                await refreshState();
                await loadTechTree();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function buildBuilding(buildingType) {
            const r = await api('/build', 'POST', { tribe_id: tribeId.value, building_type: buildingType });
            if (r.code === 0) {
                showToast('🏗️ 开始建造！', 'success');
                showBuildModal.value = false;
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function upgradeBuilding(buildingId) {
            const r = await api('/upgrade', 'POST', { tribe_id: tribeId.value, building_id: buildingId });
            if (r.code === 0) {
                showToast('⬆️ 升级开始！', 'success');
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function declareWar(foreignTribeId) {
            if (!confirm('确定要宣战吗？')) return;
            const r = await api('/war/declare', 'POST', { tribe_id: tribeId.value, foreign_tribe_id: foreignTribeId });
            if (r.code === 0) {
                showToast('⚔️ 宣战！', 'warning');
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function makePeace(foreignTribeId) {
            const r = await api('/peace', 'POST', { tribe_id: tribeId.value, foreign_tribe_id: foreignTribeId });
            if (r.code === 0) {
                if (r.data && r.data.accepted) {
                    showToast('🕊️ 和谈成功！', 'success');
                } else {
                    showToast('对方拒绝和谈', 'warning');
                }
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        async function doBattle(foreignTribeId) {
            const r = await api('/battle', 'POST', { tribe_id: tribeId.value, foreign_tribe_id: foreignTribeId });
            if (r.code === 0) {
                battleResult.value = r.data;
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        function openTradeModal(ft) {
            currentTradeTribe.value = ft;
            showTradeModal.value = true;
        }

        const tradePreview = computed(() => {
            if (!currentTradeTribe.value) return null;
            const rates = { food: 1, wood: 1.5, stone: 2, metal: 3, knowledge: 4 };
            const attitudeMult = { friendly: 1.2, neutral: 1, hostile: 0.6, ally: 1.4, peace: 1 };
            const mult = attitudeMult[currentTradeTribe.value.attitude] || 1;
            let value = tradeForm.offered_amount * rates[tradeForm.offered_resource] * mult * 0.8;
            if (currentTradeTribe.value.specialty_resource === tradeForm.requested_resource) {
                value *= 1.5;
            }
            return Math.max(1, Math.floor(value / rates[tradeForm.requested_resource]));
        });

        async function doTrade() {
            const r = await api('/trade', 'POST', {
                tribe_id: tribeId.value,
                foreign_tribe_id: currentTradeTribe.value.foreign_tribe_id,
                offered_resource: tradeForm.offered_resource,
                offered_amount: tradeForm.offered_amount,
                requested_resource: tradeForm.requested_resource
            });
            if (r.code === 0) {
                showToast('💰 贸易完成！', 'success');
                showTradeModal.value = false;
                currentTradeTribe.value = null;
                await refreshState();
            } else {
                showToast(r.message, 'error');
            }
        }

        function techNodeColor(node) {
            const researched = (gameState.value?.researched_ids || []).includes(node.id);
            if (researched) return BRANCH_COLORS[node.position.branch] || '#9ca3af';
            const available = gameState.value?.available_techs?.some(t => t.tech_id === node.id);
            if (available) return BRANCH_COLORS[node.position.branch] || '#9ca3af';
            return '#374151';
        }

        function techNodeClass(node) {
            const researched = (gameState.value?.researched_ids || []).includes(node.id);
            if (researched) return 'tech-node tech-node-researched';
            const available = gameState.value?.available_techs?.some(t => t.tech_id === node.id);
            if (available) return 'tech-node tech-node-available available';
            return 'tech-node tech-node-locked locked';
        }

        function clickTechNode(node) {
            const researched = (gameState.value?.researched_ids || []).includes(node.id);
            if (researched) return;
            const available = gameState.value?.available_techs?.some(t => t.tech_id === node.id);
            currentTechInfo.value = { ...node, is_available: available };
            showTechModal.value = true;
        }

        function getTechSvgPath() {
            const nodes = techTreeData.value.nodes;
            const edges = techTreeData.value.edges;
            const NODE_W = 120, NODE_H = 60, GAP_X = 150, GAP_Y = 90;
            const OFFSET_X = 450, OFFSET_Y = 50;

            function nodePos(n) {
                return {
                    x: OFFSET_X + n.position.x * GAP_X,
                    y: OFFSET_Y + n.position.y * GAP_Y
                };
            }

            let svg = '';

            const eras = [
                { era: 'stone', y: OFFSET_Y - 20 },
                { era: 'copper', y: OFFSET_Y + 3 * GAP_Y - 20 },
                { era: 'iron', y: OFFSET_Y + 6 * GAP_Y - 20 },
                { era: 'firearm', y: OFFSET_Y + 9 * GAP_Y - 20 },
            ];
            for (const e of eras) {
                svg += `<line class="era-divider" x1="50" y1="${e.y}" x2="900" y2="${e.y}"/>`;
                svg += `<text class="era-label" x="30" y="${e.y + 18}">${ERA_NAMES[e.era]}</text>`;
            }

            for (const e of edges) {
                if (e.type === 'exclusive') {
                    const from = nodes.find(n => n.id === e.from);
                    const to = nodes.find(n => n.id === e.to);
                    if (from && to) {
                        const fp = nodePos(from), tp = nodePos(to);
                        const mx = (fp.x + tp.x) / 2;
                        const my = (fp.y + tp.y) / 2 - 15;
                        svg += `<path class="tech-exclusive-line" d="M${fp.x},${fp.y + NODE_H/2} Q${mx},${my} ${tp.x},${tp.y + NODE_H/2}" fill="none"/>`;
                        svg += `<text class="tech-exclusive-label" x="${mx}" y="${my + 3}">互斥 ✕</text>`;
                    }
                } else {
                    const from = nodes.find(n => n.id === e.from);
                    const to = nodes.find(n => n.id === e.to);
                    if (from && to) {
                        const fp = nodePos(from), tp = nodePos(to);
                        const fromResearched = (gameState.value?.researched_ids || []).includes(e.from);
                        const toResearched = (gameState.value?.researched_ids || []).includes(e.to);
                        const isComplete = fromResearched && toResearched;
                        const strokeColor = isComplete ? 'var(--success)' : 'rgba(255,255,255,0.2)';
                        svg += `<line x1="${fp.x}" y1="${fp.y + NODE_H/2}" x2="${tp.x}" y2="${tp.y - NODE_H/2}" stroke="${strokeColor}" stroke-width="2"/>`;
                    }
                }
            }

            for (const n of nodes) {
                const pos = nodePos(n);
                const color = techNodeColor(n);
                const cls = techNodeClass(n);
                const researched = (gameState.value?.researched_ids || []).includes(n.id);
                const available = gameState.value?.available_techs?.some(t => t.tech_id === n.id);
                const x = pos.x - NODE_W / 2;
                const y = pos.y - NODE_H / 2;
                const check = researched ? ' ✓' : '';

                svg += `<g class="tech-node-group" onclick="window.__clickTech('${n.id}')">`;
                svg += `<rect class="${cls}" x="${x}" y="${y}" rx="10" ry="10" width="${NODE_W}" height="${NODE_H}" 
                      fill="${color}" stroke="${researched ? 'var(--success)' : (available ? 'var(--accent)' : '#1f2937')}" 
                      stroke-width="${researched || available ? 2.5 : 1}"/>`;
                svg += `<text class="tech-label" x="${pos.x}" y="${y + 24}">${n.name}${check}</text>`;
                if (!researched) {
                    svg += `<text class="tech-cost-label" x="${pos.x}" y="${y + 44}">📚 ${n.cost}</text>`;
                }
                svg += `</g>`;
            }

            return svg;
        }

        function setupTechClickHandler() {
            window.__clickTech = (id) => {
                const n = techTreeData.value.nodes.find(x => x.id === id);
                if (n) clickTechNode(n);
            };
        }

        function getBestSkill(person) {
            let best = null, maxVal = -1;
            for (const k of Object.keys(SKILL_LABELS)) {
                if (person[k] > maxVal) { maxVal = person[k]; best = k; }
            }
            return best;
        }

        function bestJobForSkill(skillKey) {
            const map = {
                skill_gathering: 'gatherer',
                skill_hunting: 'hunter',
                skill_building: 'builder',
                skill_research: 'researcher',
                skill_military: 'soldier',
                skill_trade: 'trader'
            };
            return map[skillKey] || 'idle';
        }

        function displayEra(buildingType) {
            const map = {
                stone: ['hut', 'farm', 'pasture', 'stone_quarry', 'herb_garden', 'palisade'],
                copper: ['smelter', 'armory', 'mine', 'kiln', 'barracks', 'market', 'scribe_office'],
                iron: ['forge', 'stone_wall', 'watchtower', 'academy', 'courthouse', 'stable', 'workshop'],
                firearm: ['powder_mill', 'armory_ii', 'printing_house', 'harbor', 'cannon_foundry', 'war_college', 'university', 'colony']
            };
            for (const e of Object.keys(map)) {
                if (map[e].includes(buildingType)) return e;
            }
            return gameState.value?.tribe?.era || 'stone';
        }

        function eraBuildingClass(buildingType) {
            const tEra = gameState.value?.tribe?.era || 'stone';
            const bEra = displayEra(buildingType);
            const displayEra = Math.min(
                Object.keys(ERA_STYLE_CLASS).indexOf(tEra),
                Object.keys(ERA_STYLE_CLASS).indexOf(bEra)
            );
            return 'building-card-era-' + Object.keys(ERA_STYLE_CLASS)[displayEra];
        }

        function countByJob(job) {
            if (!gameState.value || !gameState.value.tribespeople) return 0;
            let count = 0;
            for (let i = 0; i < gameState.value.tribespeople.length; i++) {
                if (gameState.value.tribespeople[i].job === job) count++;
            }
            return count;
        }

        function countSoldiers() {
            return countByJob('soldier');
        }

        function roundPercent(val) {
            return Math.round(val * 100);
        }

        function calcStrengthWidth(strength) {
            return Math.min(100, strength / 3) + '%';
        }

        onMounted(() => {
            loadSavedGames();
            setupTechClickHandler();
        });

        return {
            view, activeTab, tribeId, gameState, savedGames, toasts,
            showBuildModal, showTradeModal, showTechModal,
            currentTradeTribe, currentTechInfo, newGameName, battleResult,
            tradeForm, techTreeData, tradePreview,

            ERA_NAMES, ERA_STYLE_CLASS, SEASON_INFO, RESOURCE_INFO,
            JOB_NAMES, JOB_ICONS, RELATION_NAMES, SKILL_LABELS, SKILL_COLORS,
            BRANCH_COLORS, BRANCH_NAMES,

            loadSavedGames, createGame, loadGame, deleteGame,
            advanceTurn, advanceEra, assignJob, researchTech,
            buildBuilding, upgradeBuilding, declareWar, makePeace,
            doBattle, openTradeModal, doTrade,
            getTechSvgPath, getBestSkill, bestJobForSkill, eraBuildingClass,
            countByJob, countSoldiers, roundPercent, calcStrengthWidth,
        };
    }
,
    template: `
        <div class="game-container">
            <div class="toast-container">
                <div v-for="t in toasts" :key="t.id"
                     :class="'toast toast-' + (t.type === 'success' ? 'success' : t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : 'info')">
                    {{ t.message }}
                </div>
            </div>

            <div v-if="view === 'start'" class="start-screen">
                <h1 class="start-title">🏛️ 部落崛起</h1>
                <p class="start-subtitle">从石器时代的几个帐篷到火器时代的城邦</p>
                <div class="start-card">
                    <input v-model="newGameName" class="start-input" placeholder="输入部落名称..." @keyup.enter="createGame">
                    <button class="btn btn-primary" @click="createGame">🌱 创建新部落</button>
                </div>
                <div class="saved-games">
                    <h3>已保存的游戏</h3>
                    <div class="game-list" v-if="savedGames.length > 0">
                        <div v-for="g in savedGames" :key="g.id" class="game-item" @click="loadGame(g.id)">
                            <div class="game-item-info">
                                <h4>{{ g.name }} <span class="era-badge" :class="ERA_STYLE_CLASS[g.era]">{{ ERA_NAMES[g.era] }}</span></h4>
                                <p>第{{ g.year }}年 {{ SEASON_INFO[g.season].icon }}{{ SEASON_INFO[g.season].name }} · 人口 {{ g.population }} · 回合 {{ g.turn }}</p>
                            </div>
                            <button class="game-item-delete" @click="deleteGame(g.id, $event)">删除</button>
                        </div>
                    </div>
                    <div v-else class="empty-state">
                        <div class="empty-icon">📜</div>
                        <div>暂无存档</div>
                    </div>
                </div>
            </div>

            <div v-else-if="view === 'game' && gameState" class="game-container">
                <div class="top-bar">
                    <div class="game-title-bar">
                        <span class="game-name">🏛️ {{ gameState.tribe.name }}</span>
                        <span class="era-badge" :class="ERA_STYLE_CLASS[gameState.tribe.era]">
                            {{ ERA_NAMES[gameState.tribe.era] }}
                        </span>
                        <div class="season-display">
                            <span class="season-icon">{{ SEASON_INFO[gameState.tribe.season].icon }}</span>
                            <span>第{{ gameState.tribe.year }}年 {{ SEASON_INFO[gameState.tribe.season].name }} · 回合{{ gameState.tribe.turn }}</span>
                        </div>
                    </div>
                    <div class="top-actions">
                        <button v-if="gameState.can_advance_era" class="btn btn-era" @click="advanceEra">⭐ 晋级时代</button>
                        <button class="btn btn-turn" @click="advanceTurn">⏭️ 下一回合</button>
                    </div>
                </div>

                <div class="resource-bar">
                    <div v-for="(info, key) in RESOURCE_INFO" :key="key" class="resource-item">
                        <span class="resource-icon">{{ info.icon }}</span>
                        <span class="resource-value">{{ gameState.tribe[key] || 0 }}</span>
                        <span class="resource-delta"
                              :class="{
                                  'delta-positive': (gameState.production && gameState.production[key] || 0) > 0 && key !== 'food',
                                  'delta-negative': key === 'food' && ((gameState.production && gameState.production.food || 0) - (gameState.food_consumption || 0)) < 0
                              }">
                            <span v-if="key === 'food'">({{ (gameState.production && gameState.production.food || 0) > 0 ? '+' : '' }}{{ gameState.production && gameState.production.food || 0 }}/-{{ gameState.food_consumption || 0 }})</span>
                            <span v-else-if="gameState.production && gameState.production[key] > 0">(+{{ gameState.production[key] }})</span>
                        </span>
                    </div>
                    <div class="resource-item">
                        <span class="resource-icon">👥</span>
                        <span class="resource-value">{{ gameState.tribe.population }}/{{ gameState.tribe.max_population }}</span>
                    </div>
                    <div class="resource-item">
                        <span class="resource-icon">😊</span>
                        <span class="resource-value">{{ gameState.tribe.morale }}%</span>
                    </div>
                </div>

                <div class="main-content">
                    <nav class="sidebar">
                        <div :class="['nav-item', { active: activeTab === 'panorama' }]" @click="activeTab = 'panorama'">
                            <span class="nav-icon">🏘️</span><span>部落全景</span>
                        </div>
                        <div :class="['nav-item', { active: activeTab === 'tech' }]" @click="activeTab = 'tech'">
                            <span class="nav-icon">🔬</span><span>科技树</span>
                        </div>
                        <div :class="['nav-item', { active: activeTab === 'people' }]" @click="activeTab = 'people'">
                            <span class="nav-icon">👥</span><span>族人管理</span>
                        </div>
                        <div :class="['nav-item', { active: activeTab === 'diplomacy' }]" @click="activeTab = 'diplomacy'">
                            <span class="nav-icon">🤝</span><span>外交贸易</span>
                        </div>
                        <div :class="['nav-item', { active: activeTab === 'resources' }]" @click="activeTab = 'resources'">
                            <span class="nav-icon">📊</span><span>资源统计</span>
                        </div>
                    </nav>

                    <div class="content-area">
                        <div v-if="activeTab === 'panorama'">
                            <h2 class="view-title">🏘️ 部落全景</h2>
                            <div class="stats-grid" style="margin-bottom: 20px;">
                                <div class="stat-card">
                                    <div class="stat-label">军事实力</div>
                                    <div class="stat-value" style="color: #ef4444;">⚔️ {{ gameState.military_strength }}</div>
                                    <div class="stat-meta">士兵 × 军事加成</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">已研究科技</div>
                                    <div class="stat-value" style="color: #3b82f6;">📚 {{ gameState.researched_ids.length }}</div>
                                    <div class="stat-meta">可用 {{ gameState.available_techs.length }} 项</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">已建造</div>
                                    <div class="stat-value" style="color: #22c55e;">🏗️ {{ gameState.buildings.length }}</div>
                                    <div class="stat-meta">建筑数</div>
                                </div>
                            </div>
                            <div class="building-grid">
                                <div v-for="b in gameState.buildings" :key="b.id"
                                     :class="['building-card', eraBuildingClass(b.building_type)]"
                                     @click="b.is_constructing ? null : upgradeBuilding(b.id)">
                                    <div>
                                        <div class="building-name">{{ gameState.building_names && gameState.building_names[b.building_type] || b.building_type }}</div>
                                        <div class="building-level">等级 {{ b.level }}</div>
                                    </div>
                                    <div v-if="b.is_constructing" class="building-constructing">建造中</div>
                                    <div class="building-progress" v-if="b.is_constructing">
                                        <div class="building-progress-bar" :style="{ width: (b.progress / b.total_progress * 100) + '%' }"></div>
                                    </div>
                                    <div class="building-level" v-if="!b.is_constructing" style="font-size: 0.7rem; background: rgba(0,0,0,0.4);">
                                        点击升级
                                    </div>
                                </div>
                                <div class="building-card building-card-empty" @click="showBuildModal = true">
                                    <div class="building-plus">+</div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'tech'">
                            <h2 class="view-title">🔬 科技树</h2>
                            <div class="branch-legend">
                                <div class="branch-legend-item"><div class="branch-dot" style="background: var(--branch-root);"></div>核心科技</div>
                                <div class="branch-legend-item"><div class="branch-dot" style="background: var(--branch-military);"></div>军事分支</div>
                                <div class="branch-legend-item"><div class="branch-dot" style="background: var(--branch-economy);"></div>经济分支</div>
                                <div class="branch-legend-item"><div class="branch-dot" style="background: var(--branch-civic);"></div>文化分支</div>
                                <div class="branch-legend-item" style="color: var(--danger); margin-left: auto;">═══ 红色虚线 = 互斥关系（只能选一个）</div>
                            </div>
                            <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                                <div class="stat-card"><div class="stat-label">当前知识</div><div class="stat-value">📚 {{ gameState.tribe.knowledge }}</div></div>
                                <div class="stat-card"><div class="stat-label">已研究</div><div class="stat-value" style="color: var(--success);">{{ gameState.researched_ids.length }}项</div></div>
                                <div class="stat-card"><div class="stat-label">可研究</div><div class="stat-value" style="color: var(--accent);">{{ gameState.available_techs.length }}项</div></div>
                                <div class="stat-card"><div class="stat-label">晋级要求</div><div class="stat-value" style="color: var(--warning);">{{ gameState.era_advance_requirements || '-' }}</div></div>
                            </div>
                            <div class="tech-tree-container">
                                <svg class="tech-tree-svg" width="950" height="1150" viewBox="0 0 950 1150" v-html="getTechSvgPath()"></svg>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'people'">
                            <h2 class="view-title">👥 族人管理 <span style="font-size: 1rem; color: var(--text-dim); font-weight: normal;">（{{ gameState.tribespeople.length }}人）</span></h2>
                            <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                                <div v-for="(name, job) in JOB_NAMES" :key="job" class="stat-card">
                                    <div class="stat-label">{{ JOB_ICONS[job] }} {{ name }}</div>
                                    <div class="stat-value" style="font-size: 1.3rem;">{{ countByJob(job) }}</div>
                                </div>
                            </div>
                            <div class="people-list" style="margin-top: 24px;">
                                <div v-for="p in gameState.tribespeople" :key="p.id" class="person-card">
                                    <div class="person-header">
                                        <div>
                                            <div class="person-name">{{ p.name }}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">擅长: {{ SKILL_LABELS[getBestSkill(p)] }}</div>
                                        </div>
                                        <div class="person-job"><span style="font-size: 1.5rem;">{{ JOB_ICONS[p.job] }}</span></div>
                                    </div>
                                    <div v-for="(label, key) in SKILL_LABELS" :key="key" class="skill-row">
                                        <div class="skill-label">
                                            <span :class="{ 'skill-best': key === getBestSkill(p) }">{{ label }}</span>
                                            <span>{{ roundPercent(p[key]) }}%</span>
                                        </div>
                                        <div class="skill-bar"><div class="skill-fill" :style="{ width: (p[key] * 100) + '%', background: SKILL_COLORS[key] }"></div></div>
                                    </div>
                                    <select class="job-select" :value="p.job" @change="assignJob(p.id, $event.target.value)">
                                        <option v-for="(jname, jkey) in JOB_NAMES" :key="jkey" :value="jkey">{{ JOB_ICONS[jkey] }} 分配为 {{ jname }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'diplomacy'">
                            <h2 class="view-title">🤝 外交与贸易</h2>
                            <div class="diplomacy-list">
                                <div v-for="ft in gameState.diplomacy" :key="ft.foreign_tribe_id" class="diplomacy-card">
                                    <div class="diplomacy-header">
                                        <div>
                                            <div class="diplomacy-name">{{ ft.foreign_name }}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 2px;">
                                                <span class="era-badge" :class="ERA_STYLE_CLASS[ft.foreign_era]" style="font-size: 0.7rem; margin-right: 6px;">{{ ERA_NAMES[ft.foreign_era] }}</span>
                                                特产: {{ RESOURCE_INFO[ft.specialty_resource] && RESOURCE_INFO[ft.specialty_resource].icon }} {{ RESOURCE_INFO[ft.specialty_resource] && RESOURCE_INFO[ft.specialty_resource].name || ft.specialty_resource }}
                                            </div>
                                        </div>
                                        <span class="relation-badge" :class="'relation-' + (ft.relation === 'war' ? 'war' : ft.attitude === 'hostile' ? 'hostile' : ft.attitude === 'friendly' ? 'friendly' : 'neutral')">
                                            {{ ft.relation === 'war' ? '⚔️ ' + RELATION_NAMES[ft.relation] : RELATION_NAMES[ft.attitude] || RELATION_NAMES[ft.relation] }}
                                        </span>
                                    </div>
                                    <div style="font-size: 0.85rem; margin: 8px 0 4px; color: var(--text-dim);">
                                        军事实力: <strong style="color: var(--warning);">{{ ft.strength }}</strong>
                                    </div>
                                    <div class="strength-bar"><div class="strength-fill" :style="{ width: calcStrengthWidth(ft.strength) }"></div></div>
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 8px;">
                                        {{ ft.attitude === 'hostile' ? '🏹 敌方部落' : ft.attitude === 'friendly' ? '🕊️ 友好邻邦' : '🤝 中立部落' }}
                                        <span v-if="ft.trade_cooldown > 0" style="margin-left: 10px; color: var(--warning);">⏳ 贸易冷却: {{ ft.trade_cooldown }}回合</span>
                                    </div>
                                    <div class="diplomacy-actions">
                                        <button class="btn-diplomacy" style="background: var(--branch-economy);" :disabled="ft.relation === 'war' || ft.trade_cooldown > 0 || !ft.trade_available" @click="openTradeModal(ft)">💰 贸易</button>
                                        <button v-if="ft.relation !== 'war'" class="btn-diplomacy btn-danger" @click="declareWar(ft.foreign_tribe_id)">⚔️ 宣战</button>
                                        <button v-if="ft.relation === 'war'" class="btn-diplomacy" style="background: var(--danger);" @click="doBattle(ft.foreign_tribe_id)">🎯 发起战斗</button>
                                        <button v-if="ft.relation === 'war'" class="btn-diplomacy" style="background: var(--warning); color: #333;" @click="makePeace(ft.foreign_tribe_id)">🕊️ 求和</button>
                                    </div>
                                    <div v-if="battleResult && battleResult.foreign_tribe_id === ft.foreign_tribe_id" class="battle-log">
                                        <div :class="['battle-result', battleResult.result]">{{ battleResult.result === 'victory' ? '🎉 大捷！' : battleResult.result === 'defeat' ? '💀 战败...' : '⚔️ 僵持战' }}</div>
                                        <div style="font-size: 0.85rem; line-height: 1.8;">
                                            <div>我方伤亡: <span style="color: var(--danger);">{{ battleResult.losses }}</span>人</div>
                                            <div v-if="battleResult.loot && battleResult.result === 'victory'">战利品: 🍖{{ battleResult.loot.food }} 🪵{{ battleResult.loot.wood }} ⚙️{{ battleResult.loot.metal }}</div>
                                            <div v-if="battleResult.penalty">损失: 🍖{{ battleResult.penalty.food }} 🪵{{ battleResult.penalty.wood }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'resources'">
                            <h2 class="view-title">📊 资源统计</h2>
                            <div class="stats-grid">
                                <div class="stat-card"><div class="stat-label">🍖 食物</div><div class="stat-value">{{ gameState.tribe.food }}</div><div class="stat-meta">产出: +{{ gameState.production && gameState.production.food || 0 }} / 消耗: -{{ gameState.food_consumption || 0 }}</div></div>
                                <div class="stat-card"><div class="stat-label">🪵 木材</div><div class="stat-value">{{ gameState.tribe.wood }}</div><div class="stat-meta">每回合: +{{ gameState.production && gameState.production.wood || 0 }}</div></div>
                                <div class="stat-card"><div class="stat-label">🪨 石料</div><div class="stat-value">{{ gameState.tribe.stone }}</div><div class="stat-meta">每回合: +{{ gameState.production && gameState.production.stone || 0 }}</div></div>
                                <div class="stat-card"><div class="stat-label">⚙️ 金属</div><div class="stat-value">{{ gameState.tribe.metal }}</div><div class="stat-meta">每回合: +{{ gameState.production && gameState.production.metal || 0 }}</div></div>
                                <div class="stat-card"><div class="stat-label">📚 知识</div><div class="stat-value">{{ gameState.tribe.knowledge }}</div><div class="stat-meta">每回合: +{{ gameState.production && gameState.production.knowledge || 0 }}</div></div>
                                <div class="stat-card"><div class="stat-label">👥 人口</div><div class="stat-value">{{ gameState.tribe.population }} / {{ gameState.tribe.max_population }}</div><div class="stat-meta">士气: {{ gameState.tribe.morale }}%</div></div>
                                <div class="stat-card"><div class="stat-label">⚔️ 军事</div><div class="stat-value" style="color: var(--danger);">{{ gameState.military_strength }}</div><div class="stat-meta">士兵: {{ countSoldiers() }}人</div></div>
                                <div class="stat-card"><div class="stat-label">📅 季节</div><div class="stat-value">{{ SEASON_INFO[gameState.tribe.season].icon }} {{ SEASON_INFO[gameState.tribe.season].name }}</div><div class="stat-meta">第{{ gameState.tribe.year }}年 · 回合{{ gameState.tribe.turn }}</div></div>
                            </div>
                            <div style="margin-top: 30px;">
                                <h3 style="margin-bottom: 14px; color: var(--text-dim);">📜 已研究科技</h3>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    <span v-for="techId in gameState.researched_ids" :key="techId" style="background: var(--bg-card); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem;">✅ {{ gameState.tech_names && gameState.tech_names[techId] || techId }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showBuildModal" class="modal-overlay" @click.self="showBuildModal = false">
                <div class="modal">
                    <h3 class="modal-title">🏗️ 建造建筑</h3>
                    <div class="modal-body">
                        <div v-if="gameState && gameState.available_buildings && gameState.available_buildings.length > 0">
                            <div v-for="b in gameState.available_buildings" :key="b.building_type"
                                 class="build-option" :class="{ disabled: !b.can_afford }"
                                 @click="b.can_afford && buildBuilding(b.building_type)">
                                <div class="build-option-info">
                                    <h4>{{ b.name }} <span class="era-badge" :class="ERA_STYLE_CLASS[b.era]" style="font-size: 0.7rem;">{{ ERA_NAMES[b.era] }}</span></h4>
                                    <p>{{ b.description }}</p>
                                    <p v-for="(v, k) in b.effects" :key="k" style="font-size: 0.75rem; color: var(--success); margin-top: 2px;">+ {{ k }}: {{ v }}</p>
                                </div>
                                <div class="build-option-cost">
                                    <div v-for="(amt, r) in b.cost" :key="r" :class="['cost-item', { insufficient: amt > 0 && (gameState.tribe[r] || 0) < amt }]">
                                        <span>{{ RESOURCE_INFO[r] && RESOURCE_INFO[r].icon || '' }}</span><span>{{ amt }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="empty-state"><div class="empty-icon">🔒</div><div>暂无可建造的建筑，研究更多科技以解锁</div></div>
                    </div>
                    <div class="modal-actions"><button class="btn btn-secondary" @click="showBuildModal = false">关闭</button></div>
                </div>
            </div>

            <div v-if="showTechModal && currentTechInfo" class="modal-overlay" @click.self="showTechModal = false">
                <div class="modal">
                    <h3 class="modal-title">
                        <span style="margin-right: 8px;">🔬</span>{{ currentTechInfo.name }}
                        <span class="era-badge" :class="ERA_STYLE_CLASS[currentTechInfo.era]" style="margin-left: 10px;">{{ ERA_NAMES[currentTechInfo.era] }}</span>
                        <span class="relation-badge" style="margin-left: 8px; background: var(--bg-card); color: var(--text-dim); font-weight: normal;">{{ BRANCH_NAMES[currentTechInfo.position.branch] }}分支</span>
                    </h3>
                    <div class="modal-body">
                        <p style="line-height: 1.6; margin-bottom: 16px;">{{ currentTechInfo.description }}</p>
                        <div v-if="currentTechInfo.mutually_exclusive_with && currentTechInfo.mutually_exclusive_with.length > 0" class="mutual-excl-note">
                            ⚠️ 互斥选择：与以下科技二选一，不可同时研究<br>
                            <strong v-for="eid in currentTechInfo.mutually_exclusive_with" :key="eid" style="color: #f87171;">❌ {{ gameState.tech_names && gameState.tech_names[eid] || eid }}</strong>
                        </div>
                        <div style="background: var(--bg-card); padding: 14px; border-radius: 8px; margin-top: 14px;">
                            <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">科技效果：</div>
                            <div v-for="(v, k) in currentTechInfo.effects" :key="k" style="color: var(--success); font-size: 0.9rem;">✦ {{ k }} +{{ v }}{{ typeof v === 'number' && v < 1 ? ' (' + (v * 100) + '%)' : '' }}</div>
                        </div>
                        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.9rem;">研究消耗：<strong style="color: var(--warning);">📚 {{ currentTechInfo.cost }}</strong><span style="color: var(--text-dim); margin-left: 6px;">(当前: {{ gameState.tribe.knowledge }})</span></div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" @click="showTechModal = false">关闭</button>
                        <button v-if="currentTechInfo.is_available" class="btn btn-primary" @click="researchTech(currentTechInfo.id)">🧪 开始研究</button>
                        <button v-else class="btn" style="background: #374151;" disabled>{{ (gameState.researched_ids || []).includes(currentTechInfo.id) ? '✅ 已完成' : '🔒 条件未满足' }}</button>
                    </div>
                </div>
            </div>

            <div v-if="showTradeModal && currentTradeTribe" class="modal-overlay" @click.self="showTradeModal = false">
                <div class="modal">
                    <h3 class="modal-title">💰 与 {{ currentTradeTribe.foreign_name }} 贸易</h3>
                    <div class="modal-body">
                        <div style="background: var(--bg-card); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem;">
                            对方特产: <strong style="color: var(--success);">{{ RESOURCE_INFO[currentTradeTribe.specialty_resource] && RESOURCE_INFO[currentTradeTribe.specialty_resource].icon }} {{ RESOURCE_INFO[currentTradeTribe.specialty_resource] && RESOURCE_INFO[currentTradeTribe.specialty_resource].name }}</strong>
                            <span style="color: var(--text-dim);">（购买特产 +50%）</span>
                        </div>
                        <div class="trade-form-group">
                            <label>我方提供：</label>
                            <div class="trade-form-row">
                                <select v-model="tradeForm.offered_resource" class="trade-select">
                                    <option v-for="(info, key) in RESOURCE_INFO" :key="key" :value="key">{{ info.icon }} {{ info.name }} ({{ gameState.tribe[key] }})</option>
                                </select>
                                <input v-model.number="tradeForm.offered_amount" type="number" min="1" class="trade-input">
                            </div>
                        </div>
                        <div class="trade-preview">
                            <div style="font-size: 0.9rem; color: var(--text-dim);">{{ tradeForm.offered_amount }} {{ RESOURCE_INFO[tradeForm.offered_resource].icon }}</div>
                            <div class="trade-arrow">➡️</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: var(--success);">~ {{ tradePreview }} {{ RESOURCE_INFO[tradeForm.requested_resource].icon }}</div>
                        </div>
                        <div class="trade-form-group">
                            <label>请求换取：</label>
                            <select v-model="tradeForm.requested_resource" class="trade-select" style="width: 100%;">
                                <option v-for="(info, key) in RESOURCE_INFO" :key="key" :value="key">{{ info.icon }} {{ info.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" @click="showTradeModal = false">取消</button>
                        <button class="btn btn-primary" @click="doTrade" :disabled="tradeForm.offered_amount <= 0 || tradeForm.offered_amount > (gameState.tribe[tradeForm.offered_resource] || 0)">🤝 完成交易</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`};

try {
    const app = createApp(App);
    app.config.errorHandler = (err, instance, info) => {
        console.error('Vue Error:', err, info);
        var el = document.getElementById('debug-output');
        if (el) el.textContent += ' | VueErr: ' + err.message + ' at ' + info;
    };
    app.config.warnHandler = (msg, instance, trace) => {
        console.warn('Vue Warn:', msg);
        var el = document.getElementById('debug-output');
        if (el) el.textContent += ' | VueWarn: ' + msg;
    };
    app.mount('#app');
    console.log('Vue app mounted successfully');
} catch(e) {
    console.error('Mount Error:', e);
    var el = document.getElementById('debug-output');
    if (el) el.textContent = 'Mount Error: ' + e.message + ' | ' + e.stack;
}

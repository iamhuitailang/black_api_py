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
};

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

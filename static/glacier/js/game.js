const API_BASE = '/api/glacier';
const STORAGE_KEY_GAME_ID = 'glacier_game_id_v2';
const STORAGE_KEY_LOGS = 'glacier_logs_v2';

let currentGameId = null;
let gameState = null;

async function apiRequest(endpoint, method = 'GET', params = null) {
    let url = API_BASE + endpoint;
    
    if (params && method === 'GET') {
        const searchParams = new URLSearchParams(params);
        url += '?' + searchParams.toString();
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    };

    if (params && method !== 'GET') {
        options.body = JSON.stringify(params);
    }

    console.log('[API]', method, url, params || '');

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('[API Response]', data.code, data.message || 'success');
        return data;
    } catch (error) {
        console.error('[API Error]', error);
        addLog('网络错误，请检查服务器连接: ' + error.message, 'danger');
        return { code: 1, message: '网络错误', data: null };
    }
}

function saveGameId(gameId) {
    try {
        localStorage.setItem(STORAGE_KEY_GAME_ID, gameId.toString());
        sessionStorage.setItem(STORAGE_KEY_GAME_ID, gameId.toString());
        console.log('[Storage] 保存 gameId:', gameId);
    } catch (e) {
        console.warn('[Storage] 无法保存到localStorage:', e);
    }
}

function loadGameId() {
    try {
        let saved = localStorage.getItem(STORAGE_KEY_GAME_ID);
        if (!saved) {
            saved = sessionStorage.getItem(STORAGE_KEY_GAME_ID);
        }
        const result = saved ? parseInt(saved) : null;
        console.log('[Storage] 读取 gameId:', result);
        return result;
    } catch (e) {
        console.warn('[Storage] 无法从localStorage读取:', e);
        return null;
    }
}

function clearGameId() {
    try {
        localStorage.removeItem(STORAGE_KEY_GAME_ID);
        sessionStorage.removeItem(STORAGE_KEY_GAME_ID);
    } catch (e) {}
}

function saveLogs(logs) {
    try {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
        sessionStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {}
}

function loadLogs() {
    try {
        let saved = localStorage.getItem(STORAGE_KEY_LOGS);
        if (!saved) {
            saved = sessionStorage.getItem(STORAGE_KEY_LOGS);
        }
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function clearLogs() {
    try {
        localStorage.removeItem(STORAGE_KEY_LOGS);
        sessionStorage.removeItem(STORAGE_KEY_LOGS);
    } catch (e) {}
}

async function newGame() {
    setButtonsDisabled(true);
    addLog('正在创建新游戏...', 'system');

    const result = await apiRequest('/new/game', 'POST');
    if (result.code === 0 && result.data) {
        currentGameId = result.data.game_id;
        gameState = result.data;
        saveGameId(currentGameId);
        clearLogs();
        renderGame();
        addLog('✅ 新任务开始！5名队员已就位，准备渗透冰盖。', 'system');
        hideOverlay();
    } else {
        addLog('❌ 创建游戏失败: ' + (result.message || '未知错误'), 'danger');
    }

    setButtonsDisabled(false);
}

async function refreshGameState() {
    if (!currentGameId) return false;

    const result = await apiRequest('/state/get', 'GET', { game_id: currentGameId });
    if (result.code === 0 && result.data) {
        gameState = result.data;
        renderGame();
        return true;
    }
    return false;
}

async function dig() {
    if (!currentGameId) {
        addLog('⚠ 请先点击"新游戏"开始任务！', 'danger');
        return;
    }

    setButtonsDisabled(true);
    addLog('⛏ 小队正在挖掘...', 'dig');

    const result = await apiRequest('/dig', 'POST', { game_id: currentGameId });
    if (result.code === 0 && result.data) {
        gameState = result.data;
        saveGameId(currentGameId);

        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                if (event.includes('冻伤') || event.includes('损失') || event.includes('牺牲') || event.includes('陷阱')) {
                    addLog('⚠ ' + event, 'danger');
                } else if (event.includes('发现') || event.includes('突破') || event.includes('成功') || event.includes('恭喜')) {
                    addLog('✨ ' + event, 'success');
                } else {
                    addLog('➤ ' + event, 'dig');
                }
            });
        }

        renderGame();
        checkGameOver();
    } else {
        addLog('❌ 操作失败: ' + (result.message || '未知错误'), 'danger');
        await refreshGameState();
    }

    setButtonsDisabled(false);
}

async function useCrack() {
    if (!currentGameId) {
        addLog('⚠ 请先开始新游戏！', 'danger');
        return;
    }

    setButtonsDisabled(true);
    addLog('🕳 正在穿越裂缝...', 'dig');

    const result = await apiRequest('/crack/use', 'POST', { game_id: currentGameId });
    if (result.code === 0 && result.data) {
        gameState = result.data;
        saveGameId(currentGameId);

        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                addLog('✨ ' + event, 'success');
            });
        }

        renderGame();
        checkGameOver();
    } else {
        addLog('❌ 操作失败: ' + (result.message || '未知错误'), 'danger');
        await refreshGameState();
    }

    setButtonsDisabled(false);
}

async function useSupply() {
    if (!currentGameId) {
        addLog('⚠ 请先开始新游戏！', 'danger');
        return;
    }

    setButtonsDisabled(true);
    addLog('🏕 正在使用补给站...', 'dig');

    const result = await apiRequest('/supply/use', 'POST', { game_id: currentGameId });
    if (result.code === 0 && result.data) {
        gameState = result.data;
        saveGameId(currentGameId);

        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                if (event.includes('陷阱') || event.includes('损失')) {
                    addLog('💥 ' + event, 'danger');
                } else {
                    addLog('🎁 ' + event, 'success');
                }
            });
        }

        renderGame();
        checkGameOver();
    } else {
        addLog('❌ 操作失败: ' + (result.message || '未知错误'), 'danger');
        await refreshGameState();
    }

    setButtonsDisabled(false);
}

function onLayerClick(layerIndex) {
    if (!gameState || !gameState.layers) return;

    const layer = gameState.layers.find(l => l.layer_index === layerIndex);
    if (!layer) return;

    let info = `━━━ 【第 ${layerIndex} 层】━━━\n`;
    info += `厚度: ${layer.thickness.toFixed(1)} 单位\n`;
    info += `温度: ${layer.temperature.toFixed(1)}°C\n`;

    if (layer.is_passed) {
        info += `状态: ✅ 已通过\n`;
        info += `挖掘进度: 100%\n`;
    } else if (layer.is_current) {
        const progress = (layer.dug_progress / layer.thickness) * 100;
        info += `状态: ⛏ 正在挖掘\n`;
        info += `挖掘进度: ${layer.dug_progress.toFixed(1)} / ${layer.thickness.toFixed(1)} (${progress.toFixed(1)}%)\n`;
    } else {
        info += `状态: ❄ 未到达\n`;
    }

    if (layer.has_crack) {
        if (layer.crack_found) {
            info += `🕳 裂缝: 已发现，可直接穿越\n`;
            info += `裂缝影响: 温度额外 -10°C\n`;
        } else if (layer.is_current || layer.is_passed) {
            info += `🕳 裂缝: 未发现\n`;
        } else {
            info += `🕳 裂缝: 未知（待探索）\n`;
        }
    }

    if (layer.has_supply) {
        if (layer.supply_used) {
            if (layer.supply_trapped) {
                info += `🏕 补给站: 💥 已触发陷阱\n`;
            } else {
                info += `🏕 补给站: ✅ 已使用\n`;
            }
        } else if (layer.is_current) {
            info += `🏕 补给站: 可点击【补给站】使用\n`;
            info += `补给效果: +20%体能，+15耐寒值\n`;
            info += `陷阱概率: 35%\n`;
        } else if (layer.is_passed) {
            info += `🏕 补给站: 未使用（已错过）\n`;
        } else {
            info += `🏕 补给站: 待到达\n`;
        }
    }

    addLog(info, 'system');
}

function renderGame() {
    if (!gameState) {
        updateButtons();
        return;
    }

    console.log('[Render] 渲染游戏状态 - 回合:', gameState.turn_count, '层:', gameState.current_layer);

    document.getElementById('turnCount').textContent = gameState.turn_count;
    document.getElementById('currentLayer').textContent = gameState.current_layer;
    document.getElementById('totalLayers').textContent = gameState.total_layers;

    const staminaPercent = Math.max(0, (gameState.stamina / gameState.max_stamina) * 100);
    document.getElementById('staminaFill').style.width = staminaPercent + '%';
    document.getElementById('staminaValue').textContent = Math.round(gameState.stamina);
    document.getElementById('staminaMax').textContent = gameState.max_stamina;

    const staminaWarning = document.getElementById('staminaWarning');
    if (gameState.is_stamina_depleted) {
        staminaWarning.style.display = 'block';
    } else {
        staminaWarning.style.display = 'none';
    }

    renderTeam();
    renderIceLayers();
    renderLayerInfo();
    updateButtons();
}

function renderTeam() {
    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';

    if (!gameState.team_members || gameState.team_members.length === 0) {
        teamList.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:20px;">暂无队员数据</div>';
        return;
    }

    gameState.team_members.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';

        if (member.is_frostbitten) {
            memberDiv.classList.add('frostbitten');
        }
        if (member.health <= 0) {
            memberDiv.classList.add('dead');
        }

        const coldPercent = Math.max(0, (member.cold_resistance / member.max_cold_resistance) * 100);
        const healthPercent = Math.max(0, (member.health / member.max_health) * 100);
        const coldLow = member.is_frostbitten || coldPercent < 20;

        memberDiv.innerHTML = `
            <div class="member-name">${member.name}</div>
            <div class="member-stats">
                <div class="stat-row">
                    <span class="stat-label">耐寒</span>
                    <div class="stat-bar">
                        <div class="stat-fill-cold ${coldLow ? 'low' : ''}" style="width: ${coldPercent}%"></div>
                    </div>
                    <span>${Math.round(member.cold_resistance)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">生命</span>
                    <div class="stat-bar">
                        <div class="stat-fill-health" style="width: ${healthPercent}%"></div>
                    </div>
                    <span>${Math.round(member.health)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">效率</span>
                    <span style="color: #a5f3fc;">${Number(member.dig_efficiency).toFixed(1)}/回合</span>
                </div>
            </div>
            ${member.is_frostbitten ? '<div class="member-status">❄ 冻伤状态（效率降为1）</div>' : ''}
            ${member.health <= 0 ? '<div class="member-status">💀 已牺牲</div>' : ''}
        `;

        teamList.appendChild(memberDiv);
    });
}

function renderIceLayers() {
    const iceLayers = document.getElementById('iceLayers');
    iceLayers.innerHTML = '';

    if (!gameState.layers || gameState.layers.length === 0) {
        iceLayers.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:40px;">暂无冰层数据</div>';
        return;
    }

    const layers = [...gameState.layers].reverse();

    layers.forEach(layer => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'ice-layer';

        if (layer.is_passed) {
            layerDiv.classList.add('passed');
        } else if (layer.is_current) {
            layerDiv.classList.add('current');
        } else {
            layerDiv.classList.add('normal');
        }

        if (layer.has_crack && layer.crack_found) {
            layerDiv.classList.add('has-crack');
        }

        if (layer.has_supply) {
            layerDiv.classList.add('has-supply');
        }

        const progressPercent = layer.is_passed ? 100 :
            (layer.is_current ? Math.max(0, (layer.dug_progress / layer.thickness) * 100) : 0);

        layerDiv.innerHTML = `
            <span class="layer-label">第 ${layer.layer_index} 层</span>
            <span class="layer-temp">${Number(layer.temperature).toFixed(1)}°C</span>
            ${layer.is_current ? `<div class="layer-progress" style="width: ${progressPercent}%"></div>` : ''}
        `;

        layerDiv.addEventListener('click', () => {
            onLayerClick(layer.layer_index);
        });
        layerDiv.title = `点击查看第${layer.layer_index}层详情`;

        iceLayers.appendChild(layerDiv);
    });
}

function renderLayerInfo() {
    const layer = gameState.current_layer_info;
    if (!layer) {
        document.getElementById('layerThickness').textContent = '-';
        document.getElementById('layerTemp').textContent = '-';
        document.getElementById('layerProgress').textContent = '-';
        document.getElementById('layerProgressFill').style.width = '0%';
        return;
    }

    document.getElementById('layerThickness').textContent = Number(layer.thickness).toFixed(1) + ' 单位';
    document.getElementById('layerTemp').textContent = Number(layer.temperature).toFixed(1) + '°C';

    const progress = Math.max(0, (layer.dug_progress / layer.thickness) * 100);
    document.getElementById('layerProgress').textContent =
        Number(layer.dug_progress).toFixed(1) + ' / ' + Number(layer.thickness).toFixed(1) +
        ' (' + progress.toFixed(1) + '%)';
    document.getElementById('layerProgressFill').style.width = progress + '%';
}

function updateButtons() {
    const btnDig = document.getElementById('btnDig');
    const btnCrack = document.getElementById('btnCrack');
    const btnSupply = document.getElementById('btnSupply');

    if (!gameState) {
        btnDig.disabled = true;
        btnCrack.disabled = true;
        btnSupply.disabled = true;
        btnDig.title = '请先开始新游戏';
        btnCrack.title = '请先开始新游戏';
        btnSupply.title = '请先开始新游戏';
        return;
    }

    const isPlaying = gameState.status === 'playing';
    const layer = gameState.current_layer_info;

    btnDig.disabled = !isPlaying;
    btnDig.title = isPlaying ? '小队全员挖掘（消耗体能和耐寒值）' : '游戏已结束';

    const canUseCrack = isPlaying && layer && layer.has_crack && layer.crack_found && !gameState.is_stamina_depleted;
    btnCrack.disabled = !canUseCrack;
    if (canUseCrack) {
        btnCrack.title = '使用裂缝穿越当前层（需体能充足）';
    } else if (!layer || !layer.has_crack) {
        btnCrack.title = '当前层没有裂缝';
    } else if (!layer.crack_found) {
        btnCrack.title = '尚未发现裂缝，继续挖掘可能发现';
    } else if (gameState.is_stamina_depleted) {
        btnCrack.title = '体能耗尽，无法执行特殊操作';
    }

    const canUseSupply = isPlaying && layer && layer.has_supply && !layer.supply_used;
    btnSupply.disabled = !canUseSupply;
    if (canUseSupply) {
        btnSupply.title = '使用补给站（35%概率触发陷阱）';
    } else if (!layer || !layer.has_supply) {
        btnSupply.title = '当前层没有补给站';
    } else if (layer.supply_used) {
        btnSupply.title = '补给站已使用';
    }
}

function setButtonsDisabled(disabled) {
    document.getElementById('btnDig').disabled = disabled;
    document.getElementById('btnCrack').disabled = disabled;
    document.getElementById('btnSupply').disabled = disabled;
    document.getElementById('btnNew').disabled = disabled;

    if (!disabled) {
        updateButtons();
    }
}

function addLog(message, type = 'dig') {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;

    const lines = message.split('\n');
    lines.forEach(line => {
        const logItem = document.createElement('p');
        logItem.className = 'log-item log-' + type;
        logItem.style.whiteSpace = 'pre';
        logItem.textContent = line;
        logContent.appendChild(logItem);
    });

    logContent.scrollTop = logContent.scrollHeight;

    const logs = loadLogs();
    logs.push({ message, type, time: Date.now() });
    while (logs.length > 200) {
        logs.shift();
    }
    saveLogs(logs);
}

function restoreLogs() {
    const logContent = document.getElementById('logContent');
    if (!logContent) return;

    const logs = loadLogs();
    logContent.innerHTML = '';

    if (logs.length === 0) {
        return;
    }

    logs.forEach(log => {
        const lines = (log.message || '').split('\n');
        lines.forEach(line => {
            const logItem = document.createElement('p');
            logItem.className = 'log-item log-' + (log.type || 'dig');
            logItem.style.whiteSpace = 'pre';
            logItem.textContent = line;
            logContent.appendChild(logItem);
        });
    });

    logContent.scrollTop = logContent.scrollHeight;
}

function checkGameOver() {
    if (!gameState) return;

    if (gameState.status === 'victory') {
        showOverlay('victory', '🎉 任务成功！', '恭喜你带领渗透小队成功穿越所有冰层，完成了冰川渗透行动！');
    } else if (gameState.status === 'defeat') {
        showOverlay('defeat', '💀 任务失败', '小队全员阵亡，冰川渗透行动失败。再接再厉！');
    }
}

function showOverlay(type, title, message) {
    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');

    overlayTitle.textContent = title;
    overlayTitle.className = type;
    overlayMessage.textContent = message;
    overlay.style.display = 'flex';
}

function hideOverlay() {
    document.getElementById('gameOverlay').style.display = 'none';
}

async function initGame() {
    console.log('[Init] 游戏初始化开始...');

    restoreLogs();

    let restored = false;

    const savedGameId = loadGameId();
    if (savedGameId) {
        console.log('[Init] 从存储读取到 gameId:', savedGameId);
        currentGameId = savedGameId;
        const ok = await refreshGameState();
        if (ok) {
            addLog('🔄 游戏状态已恢复，继续上次的任务。', 'system');
            restored = true;
        } else {
            console.warn('[Init] 根据存储的 gameId 恢复失败，尝试清除');
            clearGameId();
            currentGameId = null;
        }
    }

    if (!restored) {
        console.log('[Init] 尝试获取最新游戏...');
        const result = await apiRequest('/latest/get', 'GET');
        if (result.code === 0 && result.data) {
            currentGameId = result.data.game_id;
            gameState = result.data;
            saveGameId(currentGameId);
            renderGame();
            addLog('📂 找到最近的游戏记录，继续任务。', 'system');
            restored = true;
        }
    }

    if (!restored) {
        addLog('👆 点击【🔄 新游戏】开始冰川渗透行动。', 'system');
    }

    console.log('[Init] 初始化完成，currentGameId:', currentGameId);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 100);
});

window.addEventListener('beforeunload', () => {
    if (currentGameId) {
        saveGameId(currentGameId);
    }
});

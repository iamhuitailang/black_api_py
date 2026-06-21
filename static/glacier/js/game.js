const API_BASE = '/api/glacier';
const STORAGE_KEY_GAME_ID = 'glacier_game_id';
const STORAGE_KEY_LOGS = 'glacier_logs';

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
            'Content-Type': 'application/json'
        }
    };

    if (params && method !== 'GET') {
        options.body = JSON.stringify(params);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        addLog('网络错误，请检查服务器连接', 'danger');
        return { code: 1, message: '网络错误', data: null };
    }
}

function saveGameId(gameId) {
    try {
        localStorage.setItem(STORAGE_KEY_GAME_ID, gameId.toString());
    } catch (e) {
        console.warn('无法保存到localStorage:', e);
    }
}

function loadGameId() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_GAME_ID);
        return saved ? parseInt(saved) : null;
    } catch (e) {
        console.warn('无法从localStorage读取:', e);
        return null;
    }
}

function clearGameId() {
    try {
        localStorage.removeItem(STORAGE_KEY_GAME_ID);
    } catch (e) {
        console.warn('无法清除localStorage:', e);
    }
}

function saveLogs(logs) {
    try {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
        console.warn('无法保存日志到localStorage:', e);
    }
}

function loadLogs() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_LOGS);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.warn('无法从localStorage读取日志:', e);
        return [];
    }
}

function clearLogs() {
    try {
        localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch (e) {
        console.warn('无法清除localStorage日志:', e);
    }
}

async function newGame() {
    setButtonsDisabled(true);
    
    const result = await apiRequest('/new/game', 'POST');
    if (result.code === 0) {
        currentGameId = result.data.game_id;
        gameState = result.data;
        saveGameId(currentGameId);
        clearLogs();
        renderGame();
        addLog('新任务开始！5名队员已就位，准备渗透冰盖。', 'system');
        hideOverlay();
    } else {
        addLog('创建游戏失败: ' + result.message, 'danger');
    }
    
    setButtonsDisabled(false);
}

async function getGameState() {
    if (!currentGameId) return;
    
    const result = await apiRequest('/state/get', 'GET', { game_id: currentGameId });
    if (result.code === 0) {
        gameState = result.data;
        renderGame();
    } else {
        addLog('获取游戏状态失败: ' + result.message, 'danger');
    }
}

async function dig() {
    if (!currentGameId) {
        addLog('请先开始新游戏！', 'danger');
        return;
    }
    
    setButtonsDisabled(true);
    
    const result = await apiRequest('/dig', 'POST', { game_id: currentGameId });
    if (result.code === 0) {
        gameState = result.data;
        
        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                if (event.includes('冻伤') || event.includes('损失') || event.includes('牺牲')) {
                    addLog(event, 'danger');
                } else if (event.includes('发现') || event.includes('突破') || event.includes('成功')) {
                    addLog(event, 'success');
                } else {
                    addLog(event, 'dig');
                }
            });
        }
        
        renderGame();
        checkGameOver();
    } else {
        addLog('操作失败: ' + result.message, 'danger');
    }
    
    setButtonsDisabled(false);
}

async function useCrack() {
    if (!currentGameId) {
        addLog('请先开始新游戏！', 'danger');
        return;
    }
    
    setButtonsDisabled(true);
    
    const result = await apiRequest('/crack/use', 'POST', { game_id: currentGameId });
    if (result.code === 0) {
        gameState = result.data;
        
        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                addLog(event, 'success');
            });
        }
        
        renderGame();
        checkGameOver();
    } else {
        addLog('操作失败: ' + result.message, 'danger');
    }
    
    setButtonsDisabled(false);
}

async function useSupply() {
    if (!currentGameId) {
        addLog('请先开始新游戏！', 'danger');
        return;
    }
    
    setButtonsDisabled(true);
    
    const result = await apiRequest('/supply/use', 'POST', { game_id: currentGameId });
    if (result.code === 0) {
        gameState = result.data;
        
        if (result.data.turn_events) {
            result.data.turn_events.forEach(event => {
                if (event.includes('陷阱') || event.includes('损失')) {
                    addLog(event, 'danger');
                } else {
                    addLog(event, 'success');
                }
            });
        }
        
        renderGame();
        checkGameOver();
    } else {
        addLog('操作失败: ' + result.message, 'danger');
    }
    
    setButtonsDisabled(false);
}

function onLayerClick(layerIndex) {
    if (!gameState || !gameState.layers) return;
    
    const layer = gameState.layers.find(l => l.layer_index === layerIndex);
    if (!layer) return;
    
    let info = `【第 ${layerIndex} 层】\n`;
    info += `厚度: ${layer.thickness.toFixed(1)} 单位\n`;
    info += `温度: ${layer.temperature.toFixed(1)}°C\n`;
    
    if (layer.is_passed) {
        info += `状态: 已通过 ✓\n`;
        info += `挖掘进度: 100%\n`;
    } else if (layer.is_current) {
        const progress = (layer.dug_progress / layer.thickness) * 100;
        info += `状态: 正在挖掘 ⛏\n`;
        info += `挖掘进度: ${layer.dug_progress.toFixed(1)} / ${layer.thickness.toFixed(1)} (${progress.toFixed(1)}%)\n`;
    } else {
        info += `状态: 未到达 ❄\n`;
    }
    
    if (layer.has_crack) {
        if (layer.crack_found) {
            info += `发现裂缝通道！可直接穿越\n`;
            info += `裂缝温度惩罚: -10°C\n`;
        } else if (layer.is_current || layer.is_passed) {
            info += `未发现裂缝\n`;
        }
    }
    
    if (layer.has_supply) {
        if (layer.supply_used) {
            if (layer.supply_trapped) {
                info += `补给站: 已触发陷阱 💥\n`;
            } else {
                info += `补给站: 已使用 ✅\n`;
            }
        } else if (layer.is_current) {
            info += `补给站: 可使用 🏕\n`;
        } else if (layer.is_passed) {
            info += `补给站: 未使用 (已错过)\n`;
        } else {
            info += `补给站: 待到达 🏕\n`;
        }
    }
    
    addLog(info, 'system');
}

function renderGame() {
    if (!gameState) return;

    document.getElementById('turnCount').textContent = gameState.turn_count;
    document.getElementById('currentLayer').textContent = gameState.current_layer;
    document.getElementById('totalLayers').textContent = gameState.total_layers;

    const staminaPercent = (gameState.stamina / gameState.max_stamina) * 100;
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

    gameState.team_members.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';
        
        if (member.is_frostbitten) {
            memberDiv.classList.add('frostbitten');
        }
        if (member.health <= 0) {
            memberDiv.classList.add('dead');
        }

        const coldPercent = (member.cold_resistance / member.max_cold_resistance) * 100;
        const healthPercent = (member.health / member.max_health) * 100;
        const coldLow = member.is_frostbitten || coldPercent < 20;

        memberDiv.innerHTML = `
            <div class="member-name">${member.name}</div>
            <div class="member-stats">
                <div class="stat-row">
                    <span class="stat-label">耐寒</span>
                    <div class="stat-bar">
                        <div class="stat-fill-cold ${coldLow ? 'low' : ''}" style="width: ${Math.max(0, coldPercent)}%"></div>
                    </div>
                    <span>${Math.round(member.cold_resistance)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">生命</span>
                    <div class="stat-bar">
                        <div class="stat-fill-health" style="width: ${Math.max(0, healthPercent)}%"></div>
                    </div>
                    <span>${Math.round(member.health)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">效率</span>
                    <span style="color: #a5f3fc;">${member.dig_efficiency.toFixed(1)}/回合</span>
                </div>
            </div>
            ${member.is_frostbitten ? '<div class="member-status">❄ 冻伤状态</div>' : ''}
            ${member.health <= 0 ? '<div class="member-status">💀 已牺牲</div>' : ''}
        `;

        teamList.appendChild(memberDiv);
    });
}

function renderIceLayers() {
    const iceLayers = document.getElementById('iceLayers');
    iceLayers.innerHTML = '';

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

        const progressPercent = layer.is_passed ? 100 : (layer.is_current ? (layer.dug_progress / layer.thickness) * 100 : 0);
        
        layerDiv.innerHTML = `
            <span class="layer-label">第 ${layer.layer_index} 层</span>
            <span class="layer-temp">${layer.temperature.toFixed(1)}°C</span>
            ${layer.is_current ? `<div class="layer-progress" style="width: ${progressPercent}%"></div>` : ''}
        `;

        layerDiv.addEventListener('click', () => {
            onLayerClick(layer.layer_index);
        });
        layerDiv.style.cursor = 'pointer';

        iceLayers.appendChild(layerDiv);
    });
}

function renderLayerInfo() {
    const layer = gameState.current_layer_info;
    if (!layer) return;

    document.getElementById('layerThickness').textContent = layer.thickness.toFixed(1) + ' 单位';
    document.getElementById('layerTemp').textContent = layer.temperature.toFixed(1) + '°C';
    
    const progress = (layer.dug_progress / layer.thickness) * 100;
    document.getElementById('layerProgress').textContent = 
        layer.dug_progress.toFixed(1) + ' / ' + layer.thickness.toFixed(1) + 
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
        return;
    }

    const isPlaying = gameState.status === 'playing';
    const layer = gameState.current_layer_info;

    btnDig.disabled = !isPlaying;

    const canUseCrack = isPlaying && layer && layer.has_crack && layer.crack_found && !gameState.is_stamina_depleted;
    btnCrack.disabled = !canUseCrack;

    const canUseSupply = isPlaying && layer && layer.has_supply && !layer.supply_used;
    btnSupply.disabled = !canUseSupply;
}

function setButtonsDisabled(disabled) {
    document.getElementById('btnDig').disabled = disabled;
    document.getElementById('btnCrack').disabled = disabled;
    document.getElementById('btnSupply').disabled = disabled;
    document.getElementById('btnNew').disabled = disabled;
}

function addLog(message, type = 'dig') {
    const logContent = document.getElementById('logContent');
    const logItem = document.createElement('p');
    logItem.className = 'log-item log-' + type;
    logItem.textContent = '▸ ' + message;
    logContent.appendChild(logItem);
    logContent.scrollTop = logContent.scrollHeight;

    const logs = loadLogs();
    logs.push({ message, type, time: Date.now() });
    while (logs.length > 100) {
        logs.shift();
    }
    saveLogs(logs);
}

function restoreLogs() {
    const logs = loadLogs();
    const logContent = document.getElementById('logContent');
    logContent.innerHTML = '';
    
    logs.forEach(log => {
        const logItem = document.createElement('p');
        logItem.className = 'log-item log-' + log.type;
        logItem.textContent = '▸ ' + log.message;
        logContent.appendChild(logItem);
    });
    
    logContent.scrollTop = logContent.scrollHeight;
}

function checkGameOver() {
    if (gameState.status === 'victory') {
        showOverlay('victory', '任务成功！', '恭喜你带领渗透小队成功穿越所有冰层，完成了冰川渗透行动！');
    } else if (gameState.status === 'defeat') {
        showOverlay('defeat', '任务失败', '小队全员阵亡，冰川渗透行动失败。再接再厉！');
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
    restoreLogs();
    
    const savedGameId = loadGameId();
    if (savedGameId) {
        currentGameId = savedGameId;
        const result = await apiRequest('/state/get', 'GET', { game_id: currentGameId });
        if (result.code === 0 && result.data) {
            gameState = result.data;
            renderGame();
            addLog('游戏已恢复，继续上次的任务。', 'system');
            return;
        } else {
            clearGameId();
            clearLogs();
        }
    }
    
    const result = await apiRequest('/latest/get', 'GET');
    if (result.code === 0 && result.data) {
        currentGameId = result.data.game_id;
        gameState = result.data;
        saveGameId(currentGameId);
        renderGame();
        addLog('找到最近的游戏记录，继续任务。', 'system');
    } else {
        addLog('点击"新游戏"开始冰川渗透行动。', 'system');
    }
}

document.addEventListener('DOMContentLoaded', initGame);

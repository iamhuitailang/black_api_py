const API_BASE = '/api/glacier';

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
        return { code: 1, message: '网络错误', data: null };
    }
}

async function newGame() {
    const result = await apiRequest('/new/game', 'POST');
    if (result.code === 0) {
        currentGameId = result.data.game_id;
        gameState = result.data;
        renderGame();
        addLog('新任务开始！5名队员已就位，准备渗透冰盖。', 'system');
        hideOverlay();
    } else {
        addLog('创建游戏失败: ' + result.message, 'danger');
    }
}

async function getGameState() {
    if (!currentGameId) return;
    
    const result = await apiRequest('/state/get', 'GET', { game_id: currentGameId });
    if (result.code === 0) {
        gameState = result.data;
        renderGame();
    }
}

async function dig() {
    if (!currentGameId) return;
    
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
    if (!currentGameId) return;
    
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
    if (!currentGameId) return;
    
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
    const result = await apiRequest('/latest/get', 'GET');
    if (result.code === 0 && result.data) {
        currentGameId = result.data.game_id;
        gameState = result.data;
        renderGame();
        addLog('继续上次的任务。', 'system');
    } else {
        addLog('点击"新游戏"开始冰川渗透行动。', 'system');
    }
}

document.addEventListener('DOMContentLoaded', initGame);

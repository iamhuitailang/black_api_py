let battleState = null;
let isProcessing = false;

const INTENT_NAMES = {
    'gang': '刚拳意',
    'rou': '柔拳意',
    'hua': '化拳意'
};

const API_BASE = '/api';

async function initGame() {
    try {
        const activeResponse = await fetch(`${API_BASE}/fighter/activebattle/get`);
        const activeResult = await activeResponse.json();
        
        if (activeResult.code === 0 && activeResult.data) {
            battleState = activeResult.data;
            updateUI(true);
            updateBattleLog();
            
            if (battleState.is_over) {
                showWinner();
            } else if (battleState.round > 0) {
                addLogEntry('恢复上次战斗进度...');
            }
            showBattleArea();
            return;
        }

        const response = await fetch(`${API_BASE}/fighter/newbattle/get`);
        const result = await response.json();
        if (result.code === 0) {
            battleState = result.data;
            updateUI(true);
            addLogEntry('战斗开始！双方以化拳意对峙。');
            showBattleArea();
        }
    } catch (error) {
        console.error('初始化游戏失败:', error);
        document.getElementById('loading-indicator').innerHTML = 
            '<p style="color: #ff6b6b;">连接服务器失败，请刷新页面重试。</p>';
    }
}

function showBattleArea() {
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('battle-arena').classList.remove('hidden-init');
    document.getElementById('control-panel').classList.remove('hidden-init');
    document.getElementById('battle-log-section').classList.remove('hidden-init');
}

async function doAction(action) {
    if (isProcessing || !battleState || battleState.is_over) {
        return;
    }

    isProcessing = true;
    setButtonsEnabled(false);

    try {
        const response = await fetch(`${API_BASE}/fighter/executeround`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: battleState,
                action: action
            })
        });

        const result = await response.json();
        
        if (result.code === 0) {
            const oldState = battleState;
            battleState = result.data;
            
            playActionAnimations(action, battleState, oldState);
            
            setTimeout(() => {
                updateUI();
                updateBattleLog();
                
                if (battleState.is_over) {
                    showWinner();
                }
                
                isProcessing = false;
                setButtonsEnabled(true);
            }, 500);
        } else {
            isProcessing = false;
            setButtonsEnabled(true);
            addLogEntry('错误: ' + result.message);
        }
    } catch (error) {
        console.error('执行动作失败:', error);
        isProcessing = false;
        setButtonsEnabled(true);
        addLogEntry('网络错误，请重试。');
    }
}

function playActionAnimations(playerAction, newState, oldState) {
    const playerChar = document.getElementById('player-character');
    const enemyChar = document.getElementById('enemy-character');

    if (playerAction === 'light' || playerAction === 'heavy') {
        playerChar.classList.add('attack-anim');
        setTimeout(() => playerChar.classList.remove('attack-anim'), 500);
    } else if (playerAction === 'defend') {
        playerChar.classList.add('defend-anim');
        setTimeout(() => playerChar.classList.remove('defend-anim'), 500);
    }

    const lastRound = newState.battle_log[newState.battle_log.length - 1];
    if (lastRound) {
        const enemyAction = lastRound.enemy_action;
        if (enemyAction === 'light' || enemyAction === 'heavy') {
            setTimeout(() => {
                enemyChar.classList.add('attack-anim');
                setTimeout(() => enemyChar.classList.remove('attack-anim'), 500);
            }, 200);
        } else if (enemyAction === 'defend') {
            setTimeout(() => {
                enemyChar.classList.add('defend-anim');
                setTimeout(() => enemyChar.classList.remove('defend-anim'), 500);
            }, 200);
        }

        const hasPlayerHit = lastRound.events.some(e => e.side === 'player' && e.type === 'hit');
        const hasEnemyHit = lastRound.events.some(e => e.side === 'enemy' && e.type === 'hit');

        if (hasPlayerHit) {
            setTimeout(() => {
                enemyChar.classList.add('hit-anim');
                setTimeout(() => enemyChar.classList.remove('hit-anim'), 300);
            }, 300);
        }
        if (hasEnemyHit) {
            setTimeout(() => {
                playerChar.classList.add('hit-anim');
                setTimeout(() => playerChar.classList.remove('hit-anim'), 300);
            }, 300);
        }
    }
}

function updateUI(isInitial = false) {
    if (!battleState) return;

    const player = battleState.player;
    const enemy = battleState.enemy;

    document.getElementById('player-hp-text').textContent = `${player.hp}/${player.max_hp}`;
    document.getElementById('enemy-hp-text').textContent = `${enemy.hp}/${enemy.max_hp}`;

    const playerHpPercent = (player.hp / player.max_hp) * 100;
    const enemyHpPercent = (enemy.hp / enemy.max_hp) * 100;
    
    const playerHpBar = document.getElementById('player-hp-bar');
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    
    if (isInitial) {
        playerHpBar.style.transition = 'none';
        enemyHpBar.style.transition = 'none';
    }
    
    playerHpBar.style.width = `${playerHpPercent}%`;
    enemyHpBar.style.width = `${enemyHpPercent}%`;
    
    if (isInitial) {
        void playerHpBar.offsetWidth;
        playerHpBar.style.transition = '';
        enemyHpBar.style.transition = '';
    }

    const playerIntentBadge = document.getElementById('player-intent-badge');
    const enemyIntentBadge = document.getElementById('enemy-intent-badge');
    
    playerIntentBadge.textContent = INTENT_NAMES[player.intent];
    playerIntentBadge.className = `intent-badge intent-${player.intent}`;
    
    enemyIntentBadge.textContent = INTENT_NAMES[enemy.intent];
    enemyIntentBadge.className = `intent-badge intent-${enemy.intent}`;

    const playerChar = document.getElementById('player-character');
    const enemyChar = document.getElementById('enemy-character');
    
    playerChar.className = `fighter-character intent-${player.intent}`;
    enemyChar.className = `fighter-character intent-${enemy.intent}`;

    document.getElementById('player-attack-bonus').textContent = `${player.attack_multiplier >= 0 ? '+' : ''}${player.attack_multiplier}%`;
    document.getElementById('player-defense-bonus').textContent = `${player.defense_multiplier >= 0 ? '+' : ''}${player.defense_multiplier}%`;
    document.getElementById('player-combo').textContent = player.combo_count;

    document.getElementById('enemy-attack-bonus').textContent = `${enemy.attack_multiplier >= 0 ? '+' : ''}${enemy.attack_multiplier}%`;
    document.getElementById('enemy-defense-bonus').textContent = `${enemy.defense_multiplier >= 0 ? '+' : ''}${enemy.defense_multiplier}%`;
    document.getElementById('enemy-combo').textContent = enemy.combo_count;

    document.getElementById('round-count').textContent = battleState.round;
}

function updateBattleLog() {
    const logContainer = document.getElementById('battle-log');
    
    if (!battleState || !battleState.battle_log || battleState.battle_log.length === 0) {
        logContainer.innerHTML = '<p style="color: #a0a0a0;">等待出招...</p>';
        return;
    }

    let html = '';
    const recentLogs = battleState.battle_log.slice(-10);
    
    for (const round of recentLogs) {
        html += `<div class="log-round">`;
        html += `<div class="log-round-header">第 ${round.round} 回合</div>`;
        
        for (const event of round.events) {
            let eventClass = 'log-event ';
            if (event.type === 'intent_switch') {
                eventClass += 'intent-switch';
            } else if (event.type === 'ko') {
                eventClass += 'ko';
            } else {
                eventClass += event.side || 'both';
            }
            html += `<div class="${eventClass}">${event.message}</div>`;
        }
        
        html += `</div>`;
    }

    logContainer.innerHTML = html;
    logContainer.scrollTop = logContainer.scrollHeight;
}

function addLogEntry(message) {
    const logContainer = document.getElementById('battle-log');
    const entry = document.createElement('div');
    entry.className = 'log-event both';
    entry.textContent = message;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function setButtonsEnabled(enabled) {
    document.getElementById('btn-light').disabled = !enabled;
    document.getElementById('btn-heavy').disabled = !enabled;
    document.getElementById('btn-defend').disabled = !enabled;
}

function showWinner() {
    setButtonsEnabled(false);
    
    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    overlay.id = 'winner-overlay';
    
    const content = document.createElement('div');
    content.className = 'winner-content';
    
    const winnerText = document.createElement('div');
    winnerText.className = `winner-text ${battleState.winner === 'player' ? 'player-win' : 'enemy-win'}`;
    winnerText.textContent = battleState.winner === 'player' ? '胜利！' : '失败...';
    
    const statsText = document.createElement('p');
    statsText.style.fontSize = '1.2rem';
    statsText.style.color = '#a0a0a0';
    statsText.style.marginBottom = '20px';
    statsText.textContent = `经过 ${battleState.round} 回合，你造成了 ${battleState.player.damage_dealt} 点伤害`;
    
    const restartBtn = document.createElement('button');
    restartBtn.className = 'restart-btn';
    restartBtn.style.display = 'inline-block';
    restartBtn.textContent = '再来一局';
    restartBtn.onclick = restartBattle;
    
    content.appendChild(winnerText);
    content.appendChild(statsText);
    content.appendChild(restartBtn);
    overlay.appendChild(content);
    
    document.body.appendChild(overlay);
}

function restartBattle() {
    const overlay = document.getElementById('winner-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    document.getElementById('battle-log').innerHTML = '';
    setButtonsEnabled(true);
    
    document.getElementById('battle-arena').classList.add('hidden-init');
    document.getElementById('control-panel').classList.add('hidden-init');
    document.getElementById('battle-log-section').classList.add('hidden-init');
    document.getElementById('loading-indicator').style.display = 'block';
    document.getElementById('loading-indicator').innerHTML = 
        '<div class="loading-spinner"></div><p>加载战斗状态中...</p>';
    
    initGame();
}

document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

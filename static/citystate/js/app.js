class CityStateGame {
    constructor() {
        this.apiBase = '/api';
        this.playerId = localStorage.getItem('citystate_player_id') || null;
        this.gameState = null;
        this.selectedBuildingType = null;
        this.selectedBuildingId = null;
        this.selectedGridX = null;
        this.selectedGridY = null;
        this.autoRefreshInterval = null;
        
        this.buildingIcons = {
            farm: '🌾',
            barracks: '⚔️',
            market: '🏪',
            wall: '🧱',
            house: '🏠'
        };
        
        this.buildingDescriptions = {
            farm: '农田 - 每分钟产出6单位粮食',
            barracks: '兵营 - 每分钟训练1名士兵，消耗3粮食',
            market: '市场 - 可进行资源交易，汇率每小时刷新',
            wall: '城墙 - 增加防御力（石头数×2）',
            house: '房屋 - 每座容纳8人口'
        };
        
        this.resourceIcons = {
            food: '🌾',
            stone: '🪨',
            wood: '🪵',
            gold: '💰'
        };
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.initGame();
        this.startAutoRefresh();
    }
    
    bindEvents() {
        document.getElementById('advance-season-btn').addEventListener('click', () => this.advanceSeason());
        document.getElementById('trigger-invasion-btn').addEventListener('click', () => this.triggerInvasion());
        document.getElementById('trade-btn').addEventListener('click', () => this.openTradeModal());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshState());
        
        document.getElementById('close-trade-modal').addEventListener('click', () => this.closeTradeModal());
        document.getElementById('confirm-trade-btn').addEventListener('click', () => this.executeTrade());
        
        document.getElementById('from-resource').addEventListener('change', () => this.updateTradePreview());
        document.getElementById('to-resource').addEventListener('change', () => this.updateTradePreview());
        document.getElementById('trade-amount').addEventListener('input', () => this.updateTradePreview());
        
        document.getElementById('close-invasion-modal').addEventListener('click', () => this.closeInvasionModal());
        
        document.getElementById('demolish-btn').addEventListener('click', () => this.demolishBuilding());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTradeModal();
                this.closeInvasionModal();
                this.clearSelection();
            }
        });
    }
    
    async initGame() {
        try {
            const storedPlayerId = localStorage.getItem('citystate_player_id') || sessionStorage.getItem('citystate_player_id');
            if (storedPlayerId) {
                this.playerId = storedPlayerId;
            }
            
            const url = `${this.apiBase}/citystate/init${this.playerId ? `?player_id=${encodeURIComponent(this.playerId)}` : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.code === 0 && result.data) {
                this.playerId = result.data.player_id;
                localStorage.setItem('citystate_player_id', this.playerId);
                sessionStorage.setItem('citystate_player_id', this.playerId);
                
                await this.refreshState();
                
                if (storedPlayerId === this.playerId) {
                    this.addLog('success', '游戏状态已恢复！');
                } else {
                    this.addLog('success', '游戏初始化成功！');
                }
            } else {
                this.addLog('danger', `初始化失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Init error:', error);
            this.addLog('danger', '网络错误，请刷新页面重试');
        }
    }
    
    async refreshState() {
        if (!this.playerId) {
            console.warn('No player ID, cannot refresh state');
            return;
        }
        
        try {
            const url = `${this.apiBase}/citystate/state/get?player_id=${encodeURIComponent(this.playerId)}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.code === 0 && result.data) {
                this.gameState = result.data;
                this.render();
            } else {
                this.addLog('danger', `获取状态失败: ${result.message}`);
                console.error('Refresh state failed:', result);
            }
        } catch (error) {
            console.error('Refresh error:', error);
        }
    }
    
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        this.autoRefreshInterval = setInterval(() => this.refreshState(), 10000);
    }
    
    render() {
        if (!this.gameState || !this.gameState.city_state) {
            console.warn('Game state not ready, skipping render');
            return;
        }
        
        this.renderResources();
        this.renderStatus();
        this.renderBuildingList();
        this.renderGrid();
        this.renderMarketRates();
        this.renderInvasionHistory();
        this.updateHeader();
        this.updateInvasionButton();
    }
    
    renderResources() {
        const city = this.gameState.city_state;
        document.getElementById('food-value').textContent = city.food;
        document.getElementById('stone-value').textContent = city.stone;
        document.getElementById('wood-value').textContent = city.wood;
        document.getElementById('gold-value').textContent = city.gold;
    }
    
    renderStatus() {
        const city = this.gameState.city_state;
        document.getElementById('pop-value').textContent = city.population;
        document.getElementById('max-pop-value').textContent = city.max_population;
        document.getElementById('soldiers-value').textContent = city.soldiers;
        document.getElementById('prosperity-value').textContent = city.prosperity;
        document.getElementById('defense-value').textContent = city.defense_power;
    }
    
    renderBuildingList() {
        const container = document.getElementById('building-list');
        const buildingTypes = this.gameState.building_types;
        const city = this.gameState.city_state;
        
        container.innerHTML = '';
        
        for (const [type, info] of Object.entries(buildingTypes)) {
            const count = this.gameState.building_counts[type] || 0;
            const canAfford = this.canAfford(info.cost, city);
            
            const div = document.createElement('div');
            div.className = `building-option ${this.selectedBuildingType === type ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`;
            div.dataset.type = type;
            
            const costText = Object.entries(info.cost)
                .map(([res, amt]) => `${this.resourceIcons[res]}${amt}`)
                .join(' ');
            
            div.innerHTML = `
                <span class="building-icon">${this.buildingIcons[type]}</span>
                <div class="building-info">
                    <div class="building-name">${info.name} (${count})</div>
                    <div class="building-cost">${costText}</div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                if (canAfford) {
                    this.selectBuildingType(type);
                } else {
                    this.addLog('warning', `资源不足，无法建造${info.name}`);
                }
            });
            
            div.title = this.buildingDescriptions[type];
            
            container.appendChild(div);
        }
    }
    
    canAfford(cost, resources) {
        for (const [res, amt] of Object.entries(cost)) {
            if (resources[res] < amt) return false;
        }
        return true;
    }
    
    selectBuildingType(type) {
        this.selectedBuildingType = type;
        this.selectedBuildingId = null;
        this.renderBuildingList();
        this.renderGrid();
        this.hideBuildingInfo();
        this.addLog('info', `已选择建造${this.gameState.building_types[type].name}，点击空地放置`);
    }
    
    clearSelection() {
        this.selectedBuildingType = null;
        this.selectedBuildingId = null;
        this.selectedGridX = null;
        this.selectedGridY = null;
        this.renderBuildingList();
        this.renderGrid();
        this.hideBuildingInfo();
    }
    
    renderGrid() {
        const container = document.getElementById('city-grid');
        const grid = this.gameState.grid;
        const gridSize = this.gameState.grid_size;
        
        container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        container.innerHTML = '';
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const building = grid[y][x];
                
                if (building) {
                    cell.classList.add('has-building', `${building.type}-cell`);
                    cell.textContent = this.buildingIcons[building.type];
                    
                    if (this.selectedBuildingId === building.id) {
                        cell.classList.add('selected');
                    }
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'building-tooltip';
                    tooltip.textContent = building.name;
                    cell.appendChild(tooltip);
                    
                    cell.addEventListener('click', () => this.selectBuilding(building, x, y));
                } else {
                    if (this.selectedBuildingType) {
                        cell.classList.add('build-preview');
                    }
                    
                    if (this.selectedGridX === x && this.selectedGridY === y) {
                        cell.classList.add('selected');
                    }
                    
                    cell.addEventListener('click', () => this.placeBuilding(x, y));
                }
                
                container.appendChild(cell);
            }
        }
    }
    
    selectBuilding(building, x, y) {
        this.selectedBuildingType = null;
        this.selectedBuildingId = building.id;
        this.selectedGridX = x;
        this.selectedGridY = y;
        
        this.renderBuildingList();
        this.renderGrid();
        this.showBuildingInfo(building);
    }
    
    showBuildingInfo(building) {
        const panel = document.getElementById('building-info-panel');
        const info = this.gameState.building_types[building.type];
        
        document.getElementById('selected-building-name').textContent = `${this.buildingIcons[building.type]} ${building.name}`;
        
        let details = `<p>${this.buildingDescriptions[building.type]}</p>`;
        details += `<p>等级: ${building.level}</p>`;
        details += `<p>位置: (${this.selectedGridX}, ${this.selectedGridY})</p>`;
        
        const refund = Object.entries(info.cost)
            .map(([res, amt]) => `${this.resourceIcons[res]}${Math.floor(amt / 2)}`)
            .join(' ');
        details += `<p>拆除返还: ${refund}</p>`;
        
        document.getElementById('selected-building-details').innerHTML = details;
        panel.style.display = 'block';
    }
    
    hideBuildingInfo() {
        document.getElementById('building-info-panel').style.display = 'none';
    }
    
    async placeBuilding(x, y) {
        if (!this.selectedBuildingType) {
            this.addLog('warning', '请先选择要建造的建筑类型');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/citystate/build/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    building_type: this.selectedBuildingType,
                    grid_x: x,
                    grid_y: y
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                const buildingName = this.gameState.building_types[this.selectedBuildingType].name;
                this.addLog('success', `${buildingName}建造成功！`);
                this.clearSelection();
                await this.refreshState();
            } else {
                this.addLog('danger', `建造失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Build error:', error);
            this.addLog('danger', '网络错误');
        }
    }
    
    async demolishBuilding() {
        if (!this.selectedBuildingId) return;
        
        if (!confirm('确定要拆除此建筑吗？将返还50%的资源。')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/citystate/demolish/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    building_id: this.selectedBuildingId
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                this.addLog('success', '建筑拆除成功，已返还50%资源');
                this.clearSelection();
                await this.refreshState();
            } else {
                this.addLog('danger', `拆除失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Demolish error:', error);
            this.addLog('danger', '网络错误');
        }
    }
    
    async advanceSeason() {
        try {
            const response = await fetch(`${this.apiBase}/citystate/season/advance/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                const data = result.data;
                this.addLog('info', `季节推进到第${data.new_year}年 ${data.new_season_name}`);
                
                if (data.is_winter) {
                    this.addLog('warning', '⚠️ 冬季已至！蛮族即将入侵，请做好防御准备！');
                }
                
                await this.refreshState();
            } else {
                this.addLog('danger', `推进失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Advance season error:', error);
            this.addLog('danger', '网络错误');
        }
    }
    
    updateHeader() {
        const city = this.gameState.city_state;
        document.getElementById('player-id').textContent = `玩家ID: ${this.playerId}`;
        document.getElementById('year-info').textContent = `第 ${city.current_year} 年 ${city.current_season_name}`;
        
        const alertDiv = document.getElementById('invasion-alert');
        alertDiv.style.display = city.current_season === 'winter' ? 'block' : 'none';
    }
    
    updateInvasionButton() {
        const btn = document.getElementById('trigger-invasion-btn');
        const city = this.gameState.city_state;
        const lastInvasion = this.gameState.last_invasion;
        
        const canTrigger = city.current_season === 'winter' && 
                          (!lastInvasion || lastInvasion.invasion_year !== city.current_year);
        
        btn.disabled = !canTrigger;
    }
    
    async triggerInvasion() {
        if (!confirm('确定要触发蛮族入侵吗？请确保已做好防御准备！')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/citystate/invasion/trigger/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                this.showInvasionResult(result.data);
                await this.refreshState();
            } else {
                this.addLog('danger', `入侵失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Invasion error:', error);
            this.addLog('danger', '网络错误');
        }
    }
    
    showInvasionResult(data) {
        const modal = document.getElementById('invasion-modal');
        const title = document.getElementById('invasion-result-title');
        const content = document.getElementById('invasion-result-content');
        
        title.textContent = `第${data.year}年 - 蛮族入侵`;
        
        const resultClass = data.result === 'victory' ? 'victory' : 'defeat';
        const resultText = data.result === 'victory' ? '🎉 胜利！城邦成功抵御了入侵' : '💀 失败！城邦被蛮族攻破';
        
        let stats = '';
        if (data.food_lost > 0) stats += `<p>🌾 粮食损失: ${data.food_lost}</p>`;
        if (data.gold_lost > 0) stats += `<p>💰 金币损失: ${data.gold_lost}</p>`;
        if (data.soldiers_lost > 0) stats += `<p>⚔️ 士兵损失: ${data.soldiers_lost}</p>`;
        if (data.population_lost > 0) stats += `<p>👥 人口损失: ${data.population_lost}</p>`;
        
        if (!stats) {
            stats = '<p>本次入侵没有造成资源损失</p>';
        }
        
        content.innerHTML = `
            <div class="result-${resultClass}">${resultText}</div>
            <div class="result-desc">${data.description}</div>
            <div class="result-stats">
                <p>⚔️ 敌军兵力: ${data.invasion_strength}</p>
                <p>🛡️ 我方防御: ${data.total_defense}</p>
                ${stats}
            </div>
        `;
        
        modal.style.display = 'flex';
        
        if (data.result === 'victory') {
            this.addLog('success', `第${data.year}年入侵 - 胜利！`);
        } else {
            this.addLog('danger', `第${data.year}年入侵 - 失败！损失惨重`);
        }
    }
    
    closeInvasionModal() {
        document.getElementById('invasion-modal').style.display = 'none';
    }
    
    openTradeModal() {
        const markets = this.gameState.building_counts.market || 0;
        const hint = document.querySelector('#trade-modal .modal-hint');
        
        if (markets === 0) {
            hint.textContent = '⚠️ 需要先建造市场才能进行交易';
            hint.style.color = '#fc8181';
        } else {
            hint.textContent = '汇率每小时刷新，把握时机进行交易';
            hint.style.color = '#a0aec0';
        }
        
        this.updateTradePreview();
        document.getElementById('trade-modal').style.display = 'flex';
    }
    
    closeTradeModal() {
        document.getElementById('trade-modal').style.display = 'none';
    }
    
    updateTradePreview() {
        const from = document.getElementById('from-resource').value;
        const to = document.getElementById('to-resource').value;
        const amount = parseInt(document.getElementById('trade-amount').value) || 0;
        
        const rates = this.gameState.market_rates;
        const rateKey = `${from}_to_${to}`;
        let rate = rates[rateKey];
        
        if (rate === undefined) {
            const reverseKey = `${to}_to_${from}`;
            const reverseRate = rates[reverseKey];
            if (reverseRate && reverseRate > 0) {
                rate = 1.0 / reverseRate;
            } else {
                rate = 1.0;
            }
        }
        
        const received = Math.floor(amount * rate);
        document.getElementById('trade-preview-text').textContent = 
            `预计获得: ${this.resourceIcons[to]} ${received} (汇率: ${rate.toFixed(2)})`;
    }
    
    async executeTrade() {
        const markets = this.gameState.building_counts.market || 0;
        if (markets === 0) {
            this.addLog('warning', '需要先建造市场才能进行交易');
            return;
        }
        
        const from = document.getElementById('from-resource').value;
        const to = document.getElementById('to-resource').value;
        const amount = parseInt(document.getElementById('trade-amount').value) || 0;
        
        if (amount <= 0) {
            this.addLog('warning', '请输入有效的交易数量');
            return;
        }
        
        if (from === to) {
            this.addLog('warning', '不能交易相同的资源');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/citystate/trade/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    from_resource: from,
                    to_resource: to,
                    amount: amount
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                const data = result.data;
                this.addLog('success', 
                    `交易成功: ${this.resourceIcons[data.from]}${data.given} → ${this.resourceIcons[data.to]}${data.received}`);
                this.closeTradeModal();
                await this.refreshState();
            } else {
                this.addLog('danger', `交易失败: ${result.message}`);
            }
        } catch (error) {
            console.error('Trade error:', error);
            this.addLog('danger', '网络错误');
        }
    }
    
    renderMarketRates() {
        const container = document.getElementById('rate-list');
        const rates = this.gameState.market_rates;
        
        const displayRates = [
            { key: 'food_to_gold', label: '🌾 粮食 → 💰 金币' },
            { key: 'stone_to_gold', label: '🪨 石头 → 💰 金币' },
            { key: 'wood_to_gold', label: '🪵 木材 → 💰 金币' },
            { key: 'gold_to_food', label: '💰 金币 → 🌾 粮食' },
            { key: 'gold_to_stone', label: '💰 金币 → 🪨 石头' },
            { key: 'gold_to_wood', label: '💰 金币 → 🪵 木材' }
        ];
        
        container.innerHTML = '';
        
        for (const rate of displayRates) {
            const value = rates[rate.key];
            if (value === undefined) continue;
            
            const div = document.createElement('div');
            div.className = 'rate-item';
            
            if (value > 1.2) div.classList.add('highlight');
            if (value < 0.8) div.classList.add('lowlight');
            
            div.innerHTML = `
                <span class="rate-label">${rate.label}</span>
                <span class="rate-value">${value.toFixed(2)}</span>
            `;
            
            container.appendChild(div);
        }
    }
    
    async renderInvasionHistory() {
        if (!this.playerId) return;
        
        try {
            const url = `${this.apiBase}/citystate/invasion/history/get?player_id=${encodeURIComponent(this.playerId)}&limit=10`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.code === 0 && result.data && result.data.history) {
                const container = document.getElementById('invasion-history');
                const history = result.data.history;
                
                if (history.length === 0) {
                    container.innerHTML = '<p class="no-history">暂无入侵记录</p>';
                    return;
                }
                
                container.innerHTML = '';
                
                for (const record of history) {
                    const div = document.createElement('div');
                    div.className = `invasion-record ${record.result}`;
                    
                    const resultText = record.result === 'victory' ? '✅ 胜利' : '❌ 失败';
                    const resultClass = record.result === 'victory' ? 'victory' : 'defeat';
                    
                    div.innerHTML = `
                        <div class="invasion-year">第${record.invasion_year}年</div>
                        <div class="invasion-result ${resultClass}">${resultText}</div>
                        <div class="invasion-stats">
                            敌军${record.invasion_strength} vs 防御${record.city_defense + record.city_soldiers * 10}
                        </div>
                    `;
                    
                    container.appendChild(div);
                }
            }
        } catch (error) {
            console.error('History error:', error);
        }
    }
    
    addLog(type, message) {
        const container = document.getElementById('event-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        entry.innerHTML = `
            <div class="log-time">[${timeStr}]</div>
            <div class="log-message">${message}</div>
        `;
        
        container.insertBefore(entry, container.firstChild);
        
        while (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new CityStateGame();
});

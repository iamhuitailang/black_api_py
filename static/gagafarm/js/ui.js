/**
 * 咯咯农场 - UI界面模块
 * 负责用户交互和界面更新
 */

const UI = (function() {
    let elements = {};
    
    function init() {
        cacheElements();
        bindEvents();
        return true;
    }
    
    function cacheElements() {
        elements = {
            goldDisplay: document.getElementById('gold-display'),
            eggDisplay: document.getElementById('egg-display'),
            chickenDisplay: document.getElementById('chicken-display'),
            
            currentCoop: document.getElementById('current-coop'),
            currentCapacity: document.getElementById('current-capacity'),
            maxCapacity: document.getElementById('max-capacity'),
            autoCollectStatus: document.getElementById('auto-collect-status'),
            
            collectEggsBtn: document.getElementById('collect-eggs-btn'),
            sellEggsBtn: document.getElementById('sell-eggs-btn'),
            autoCollectToggle: document.getElementById('auto-collect-toggle'),
            
            chickenShopList: document.getElementById('chicken-shop-list'),
            coopUpgradeList: document.getElementById('coop-upgrade-list'),
            dogShopList: document.getElementById('dog-shop-list'),
            
            statTotalGold: document.getElementById('stat-total-gold'),
            statTotalEggs: document.getElementById('stat-total-eggs'),
            statSoldEggs: document.getElementById('stat-sold-eggs'),
            statPlayTime: document.getElementById('stat-play-time'),
            statEggsPerHour: document.getElementById('stat-eggs-per-hour'),
            statGoldPerHour: document.getElementById('stat-gold-per-hour'),
            
            resetGameBtn: document.getElementById('reset-game-btn'),
            
            eventNotification: document.getElementById('event-notification'),
            eventIcon: document.querySelector('.event-icon'),
            eventTitle: document.querySelector('.event-title'),
            eventMessage: document.querySelector('.event-message'),
            eventClose: document.querySelector('.event-close'),
            
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),
            
            gameCanvas: document.getElementById('game-canvas')
        };
    }
    
    function bindEvents() {
        elements.collectEggsBtn.addEventListener('click', handleCollectEggs);
        elements.sellEggsBtn.addEventListener('click', handleSellEggs);
        elements.autoCollectToggle.addEventListener('click', handleAutoCollectToggle);
        
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => handleTabSwitch(btn));
        });
        
        elements.eventClose.addEventListener('click', hideEventNotification);
        
        elements.resetGameBtn.addEventListener('click', handleResetGame);
        
        elements.gameCanvas.addEventListener('click', handleCanvasClick);
    }
    
    function handleCollectEggs() {
        const result = Game.collectEggs();
        if (result.success) {
            showToast(`收集了 ${result.count} 个鸡蛋！`);
        } else {
            showToast('没有鸡蛋可收集');
        }
    }
    
    function handleSellEggs() {
        const result = Game.sellEggs();
        if (result.success) {
            showToast(`出售了 ${result.eggs} 个鸡蛋，获得 ${result.gold} 金币！`);
        } else {
            showToast('没有鸡蛋可出售');
        }
    }
    
    function handleAutoCollectToggle() {
        const result = Game.toggleAutoCollect();
        if (result.success) {
            const state = result.enabled ? '开启' : '关闭';
            showToast(`自动收集已${state}`);
            updateUI(Game.getGameState());
        } else {
            showToast(result.reason);
        }
    }
    
    function handleTabSwitch(btn) {
        const tabName = btn.dataset.tab;
        
        elements.tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        elements.tabPanels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`tab-${tabName}`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        
        if (tabName === 'shop') {
            renderChickenShop();
        } else if (tabName === 'upgrade') {
            renderCoopUpgrade();
            renderDogShop();
        }
    }
    
    function renderDogShop() {
        const gameState = Game.getGameState();
        let html = '';
        
        const dogConfig = DOG_CONFIG;
        const isUnlocked = Game.isDogUnlocked();
        const hasDog = gameState.hasDog;
        const canAfford = gameState.gold >= dogConfig.price;
        
        const unlockText = getUnlockText(dogConfig.unlockCondition, gameState);
        
        html += `
            <div class="shop-item ${!isUnlocked && !hasDog ? 'locked' : ''}">
                <div class="shop-item-header">
                    <span class="shop-item-icon">${dogConfig.icon}</span>
                    <span class="shop-item-price">
                        ${hasDog ? '已拥有' : formatNumber(dogConfig.price) + ' 💰'}
                    </span>
                </div>
                <div class="shop-item-details">
                    <p><strong>${dogConfig.name}</strong></p>
                    <p>${dogConfig.description}</p>
                    <p>减少黄鼠狼概率: ${Math.floor(dogConfig.weaselReductionRate * 100)}%</p>
                    <p>作用: 夜晚看家护院</p>
                </div>
                ${!isUnlocked && !hasDog ? `<div class="shop-item-unlock">🔒 ${unlockText}</div>` : ''}
                <div class="shop-item-footer">
                    ${hasDog ? '<span style="color: #228B22; font-weight: bold;">✓ 已购买</span>' : ''}
                    ${!hasDog ? `
                        <button class="buy-btn dog-buy-btn" 
                                data-type="${dogConfig.id}" 
                                ${!isUnlocked || !canAfford ? 'disabled' : ''}>
                            购买
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        elements.dogShopList.innerHTML = html;
        
        const dogBuyBtn = elements.dogShopList.querySelector('.dog-buy-btn');
        if (dogBuyBtn) {
            dogBuyBtn.addEventListener('click', () => {
                handleBuyDog();
            });
        }
    }
    
    function handleBuyDog() {
        const result = Game.buyDog();
        if (result.success) {
            showToast(`购买了 ${DOG_CONFIG.name}！夜晚它会帮你看家护院！`);
            updateUI(Game.getGameState());
            renderDogShop();
        } else {
            showToast(result.reason);
        }
    }
    
    function handleBuyChicken(chickenTypeId) {
        const result = Game.buyChicken(chickenTypeId);
        if (result.success) {
            const chickenType = getChickenTypeById(chickenTypeId);
            showToast(`购买了一只 ${chickenType.name}！`);
            updateUI(Game.getGameState());
            renderChickenShop();
        } else {
            showToast(result.reason);
        }
    }
    
    function handleUpgradeCoop(coopTypeId) {
        const result = Game.upgradeCoop(coopTypeId);
        if (result.success) {
            showToast(`升级到 ${result.newCoop.name}！`);
            updateUI(Game.getGameState());
            renderCoopUpgrade();
        } else {
            showToast(result.reason);
        }
    }
    
    function handleResetGame() {
        if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
            Game.resetGame();
            Game.init();
            Game.startGameLoop();
            updateUI(Game.getGameState());
            showToast('游戏已重置');
        }
    }
    
    function handleCanvasClick(event) {
        const coords = Renderer.getCanvasCoordinates(event);
        const chicken = Renderer.findChickenAtPosition(coords.x, coords.y);
        
        if (chicken) {
            showChickenInfo(chicken);
        }
    }
    
    function showChickenInfo(chicken) {
        const chickenType = getChickenTypeById(chicken.type);
        const statusText = {
            [CHICKEN_STATUS.CHICK]: '小鸡',
            [CHICKEN_STATUS.ADULT]: '成年鸡',
            [CHICKEN_STATUS.SENIOR]: '老年鸡'
        };
        
        const growthProgress = ChickenManager.getChickenGrowthProgress(chicken);
        const nextLayRemaining = ChickenManager.getNextLayTimeRemaining(chicken);
        
        let info = `${chickenType.icon} ${chickenType.name}\n`;
        info += `状态: ${statusText[chicken.status]}\n`;
        info += `年龄: ${formatTime(chicken.ageMs)}\n`;
        info += `已产蛋: ${chicken.eggsLaid} 个\n`;
        
        if (chicken.status === CHICKEN_STATUS.CHICK) {
            info += `成长进度: ${Math.floor(growthProgress * 100)}%\n`;
        } else {
            info += `下次产蛋: ${formatTime(nextLayRemaining)}\n`;
        }
        
        if (chicken.status === CHICKEN_STATUS.SENIOR) {
            const chickenType = getChickenTypeById(chicken.type);
            const slaughterValue = Math.floor(chickenType.price * CONFIG.SLAUGHTER_VALUE_RATE);
            info += `\n💡 这是一只老年鸡，淘汰可获得 ${slaughterValue} 金币`;
        }
        
        showToast(info);
    }
    
    function updateUI(gameState) {
        if (!gameState) return;
        
        elements.goldDisplay.textContent = formatNumber(Math.floor(gameState.gold));
        elements.eggDisplay.textContent = formatNumber(gameState.eggs);
        elements.chickenDisplay.textContent = gameState.chickens.length;
        
        const coop = getCoopTypeById(gameState.currentCoopId);
        elements.currentCoop.textContent = coop.name;
        elements.currentCapacity.textContent = gameState.chickens.length;
        elements.maxCapacity.textContent = coop.capacity;
        
        if (coop.hasAutoCollect) {
            elements.autoCollectStatus.textContent = gameState.autoCollectEnabled ? '已开启' : '已关闭';
            const btnText = gameState.autoCollectEnabled ? '自动收集: 开' : '自动收集: 关';
            elements.autoCollectToggle.querySelector('.btn-text').textContent = btnText;
            elements.autoCollectToggle.disabled = false;
        } else {
            elements.autoCollectStatus.textContent = '未解锁';
            elements.autoCollectToggle.disabled = true;
        }
        
        const stats = Game.getStats();
        elements.statTotalGold.textContent = formatNumber(Math.floor(stats.totalGoldEarned));
        elements.statTotalEggs.textContent = formatNumber(stats.totalEggsLaid);
        elements.statSoldEggs.textContent = formatNumber(stats.totalEggsSold);
        elements.statPlayTime.textContent = formatPlayTime(stats.totalPlayTimeMs);
        elements.statEggsPerHour.textContent = formatNumber(stats.eggsPerHour);
        elements.statGoldPerHour.textContent = formatNumber(stats.goldPerHour);
        
        Renderer.updateState(gameState);
    }
    
    function renderChickenShop() {
        const gameState = Game.getGameState();
        let html = '';
        
        for (const chickenType of CHICKEN_TYPES) {
            const isUnlocked = Game.isChickenTypeUnlocked(chickenType.id);
            const canAfford = gameState.gold >= chickenType.price;
            const ownedCount = gameState.chickens.filter(c => c.type === chickenType.id).length;
            
            const unlockText = getUnlockText(chickenType.unlockCondition, gameState);
            
            html += `
                <div class="shop-item ${!isUnlocked ? 'locked' : ''}">
                    <div class="shop-item-header">
                        <span class="shop-item-icon">${chickenType.icon}</span>
                        <span class="shop-item-price">${formatNumber(chickenType.price)} 💰</span>
                    </div>
                    <div class="shop-item-details">
                        <p><strong>${chickenType.name}</strong></p>
                        <p>${chickenType.description}</p>
                        <p>成长时间: ${chickenType.growthTimeMinutes} 分钟</p>
                        <p>产蛋间隔: ${chickenType.layIntervalSeconds} 秒</p>
                        <p>鸡蛋价值: ${chickenType.eggValue} 金币</p>
                    </div>
                    ${!isUnlocked ? `<div class="shop-item-unlock">🔒 ${unlockText}</div>` : ''}
                    <div class="shop-item-footer">
                        <span class="owned-count">拥有: ${ownedCount} 只</span>
                        <button class="buy-btn" 
                                data-type="${chickenType.id}" 
                                ${!isUnlocked || !canAfford ? 'disabled' : ''}>
                            购买
                        </button>
                    </div>
                </div>
            `;
        }
        
        elements.chickenShopList.innerHTML = html;
        
        elements.chickenShopList.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const typeId = btn.dataset.type;
                handleBuyChicken(typeId);
            });
        });
    }
    
    function renderCoopUpgrade() {
        const gameState = Game.getGameState();
        const currentCoopId = gameState.currentCoopId;
        const currentIndex = COOP_TYPES.findIndex(t => t.id === currentCoopId);
        
        let html = '';
        
        for (let i = 0; i < COOP_TYPES.length; i++) {
            const coopType = COOP_TYPES[i];
            const isUnlocked = Game.isCoopTypeUnlocked(coopType.id);
            const isCurrent = coopType.id === currentCoopId;
            const isNext = i === currentIndex + 1;
            const canAfford = gameState.gold >= coopType.price;
            
            const unlockText = getUnlockText(coopType.unlockCondition, gameState);
            
            const showBuy = isNext && !isCurrent;
            
            html += `
                <div class="shop-item ${!isUnlocked && !isCurrent ? 'locked' : ''}">
                    <div class="shop-item-header">
                        <span class="shop-item-icon">🏠</span>
                        <span class="shop-item-price">
                            ${coopType.price === 0 ? '免费' : formatNumber(coopType.price) + ' 💰'}
                        </span>
                    </div>
                    <div class="shop-item-details">
                        <p><strong>${coopType.name}</strong></p>
                        <p>${coopType.description}</p>
                        <p>容量: ${coopType.capacity} 只</p>
                        <p>自动收集: ${coopType.hasAutoCollect ? '✅ 支持' : '❌ 不支持'}</p>
                    </div>
                    ${!isUnlocked && !isCurrent ? `<div class="shop-item-unlock">🔒 ${unlockText}</div>` : ''}
                    <div class="shop-item-footer">
                        ${isCurrent ? '<span style="color: #228B22; font-weight: bold;">✓ 当前使用</span>' : ''}
                        ${showBuy ? `
                            <button class="buy-btn" 
                                    data-type="${coopType.id}" 
                                    ${!isUnlocked || !canAfford ? 'disabled' : ''}>
                                升级
                            </button>
                        ` : ''}
                        ${!isCurrent && !showBuy ? '<span style="color: #999;">按顺序升级</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        elements.coopUpgradeList.innerHTML = html;
        
        elements.coopUpgradeList.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const typeId = btn.dataset.type;
                handleUpgradeCoop(typeId);
            });
        });
    }
    
    function getUnlockText(condition, gameState) {
        switch (condition.type) {
            case 'initial':
                return '初始解锁';
            case 'sold_eggs':
                const soldProgress = gameState.stats.totalEggsSold;
                return `需卖出 ${condition.value} 个鸡蛋 (${soldProgress}/${condition.value})`;
            case 'gold':
                const goldProgress = Math.max(gameState.gold, gameState.stats.totalGoldEarned);
                return `需累计 ${condition.value} 金币 (${Math.floor(goldProgress)}/${condition.value})`;
            default:
                return '未解锁';
        }
    }
    
    function showEventNotification(eventResult) {
        if (!eventResult || !eventResult.event) return;
        
        elements.eventIcon.textContent = eventResult.event.icon;
        elements.eventTitle.textContent = eventResult.event.name;
        elements.eventMessage.textContent = eventResult.message;
        
        elements.eventNotification.classList.remove('hidden');
        
        setTimeout(() => {
            hideEventNotification();
        }, 5000);
    }
    
    function hideEventNotification() {
        elements.eventNotification.classList.add('hidden');
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: toastIn 0.3s ease-out;
            white-space: pre-line;
            text-align: center;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    function formatPlayTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}天${hours % 24}小时`;
        } else if (hours > 0) {
            return `${hours}小时${minutes % 60}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟`;
        } else {
            return `${seconds}秒`;
        }
    }
    
    function handleGameEvent(eventType, data, gameState) {
        switch (eventType) {
            case Game.GAME_EVENTS.STATE_CHANGED:
                updateUI(gameState);
                break;
            case Game.GAME_EVENTS.RANDOM_EVENT:
                showEventNotification(data);
                break;
            case Game.GAME_EVENTS.EGG_LAID:
                break;
            case Game.GAME_EVENTS.EGG_SOLD:
                if (!data.auto) {
                    showToast(`出售了 ${data.count} 个鸡蛋，获得 ${data.gold} 金币！`);
                }
                break;
            case Game.GAME_EVENTS.TIME_PERIOD_CHANGED:
                const periodNames = {
                    [TIME_PERIOD.DAY]: '☀️ 白天来了！',
                    [TIME_PERIOD.NIGHT]: '🌙 夜幕降临！小心黄鼠狼！',
                    [TIME_PERIOD.DAWN]: '🌄 黎明来临！新的一天开始了！',
                    [TIME_PERIOD.DUSK]: '🌅 黄昏来临！夜晚即将到来！'
                };
                if (gameState.hasDog && data.newPeriod === TIME_PERIOD.NIGHT) {
                    showToast('🐕 小狗开始晚上看家了！黄鼠狼不敢轻易靠近！');
                } else {
                    showToast(periodNames[data.newPeriod] || '时间变化了');
                }
                break;
            case Game.GAME_EVENTS.DOG_BOUGHT:
                showToast('🐕 小狗已购买！夜晚它会为你看家护院！');
                break;
        }
    }
    
    return {
        init,
        updateUI,
        renderChickenShop,
        renderCoopUpgrade,
        showEventNotification,
        showToast,
        handleGameEvent
    };
})();

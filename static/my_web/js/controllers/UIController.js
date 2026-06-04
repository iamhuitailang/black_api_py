const UIController = {
  currentView: CONSTANTS.VIEWS.MAP,
  gameState: null,
  activeEvent: null,
  notificationQueue: [],
  starMapCanvas: null,
  ctx: null,
  animationFrame: null,
  stars: [],

  init(gameState) {
    this.gameState = gameState;
    this.setupEventListeners();
    this.setupStarMap();
    this.setupEventBusListeners();
    this.render();
    this.startAnimation();
  },

  setupEventListeners() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      ThemeController.toggleTheme();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      GameController.saveGame();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      GameController.togglePause();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        this.gameState = GameController.resetGame();
        this.render();
      }
    });
  },

  setupEventBusListeners() {
    eventBus.on(CONSTANTS.EVENTS.GAME_TICK, () => {
      this.updateStatusBar();
      if (this.currentView === CONSTANTS.VIEWS.MAP) {
        this.renderMap();
      }
    });

    eventBus.on(CONSTANTS.EVENTS.NAVIGATE_START, (data) => {
      this.showNotification(`正在前往 ${data.to.name}...`, 'info');
    });

    eventBus.on(CONSTANTS.EVENTS.NAVIGATE_COMPLETE, (data) => {
      this.showNotification(`已到达 ${data.system.name}`, 'success');
      this.render();
    });

    eventBus.on(CONSTANTS.EVENTS.RANDOM_EVENT_TRIGGER, (data) => {
      if (data.event) {
        this.showEventModal(data.event);
      }
    });

    eventBus.on(CONSTANTS.EVENTS.TRADE_BUY, (data) => {
      this.showNotification(`购买成功！`, 'success');
      if (this.currentView === CONSTANTS.VIEWS.TRADE) {
        this.renderTradeView();
      }
    });

    eventBus.on(CONSTANTS.EVENTS.TRADE_SELL, (data) => {
      const profitText = data.profit >= 0 ? `盈利 ${Helpers.formatCredits(data.profit)}` : `亏损 ${Helpers.formatCredits(Math.abs(data.profit))}`;
      this.showNotification(`出售成功！${profitText}`, data.profit >= 0 ? 'success' : 'warning');
      if (this.currentView === CONSTANTS.VIEWS.TRADE) {
        this.renderTradeView();
      }
    });

    eventBus.on(CONSTANTS.EVENTS.UPGRADE_PURCHASE, (data) => {
      this.showNotification(`${UpgradeService.getUpgradeName(data.type)} 升级到 Lv.${data.toLevel}！`, 'success');
      if (this.currentView === CONSTANTS.VIEWS.UPGRADE) {
        this.renderUpgradeView();
      }
    });

    eventBus.on(CONSTANTS.EVENTS.INVESTMENT_COMPLETE, (data) => {
      const text = data.success ? `投资成功！收益 ${Helpers.formatCredits(data.returns)}` : `投资失败！仅收回 ${Helpers.formatCredits(data.returns)}`;
      this.showNotification(text, data.success ? 'success' : 'error');
      if (this.currentView === CONSTANTS.VIEWS.INVESTMENT) {
        this.renderInvestmentView();
      }
    });

    eventBus.on(CONSTANTS.EVENTS.UI_NOTIFICATION, (data) => {
      this.showNotification(data.message, data.type);
    });

    eventBus.on(CONSTANTS.EVENTS.UI_THEME_CHANGE, () => {
      this.render();
    });

    eventBus.on(CONSTANTS.EVENTS.GAME_PAUSE, (data) => {
      const btn = document.getElementById('pauseBtn');
      btn.textContent = data.paused ? '▶️ 继续' : '⏸️ 暂停';
    });
  },

  setupStarMap() {
    this.starMapCanvas = document.getElementById('starMap');
    if (!this.starMapCanvas) return;
    
    this.ctx = this.starMapCanvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.generateBackgroundStars();

    this.starMapCanvas.addEventListener('click', (e) => this.handleMapClick(e));
  },

  generateBackgroundStars() {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
  },

  resizeCanvas() {
    if (!this.starMapCanvas) return;
    const rect = this.starMapCanvas.parentElement.getBoundingClientRect();
    this.starMapCanvas.width = rect.width;
    this.starMapCanvas.height = rect.height;
  },

  handleMapClick(e) {
    if (!this.starMapCanvas || !this.gameState || this.gameState.isNavigating) return;

    const rect = this.starMapCanvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (const system of this.gameState.systems) {
      const distance = Math.sqrt(Math.pow(x - system.x, 2) + Math.pow(y - system.y, 2));
      if (distance < 5) {
        if (system.id === this.gameState.currentSystemId) {
          this.switchView(CONSTANTS.VIEWS.TRADE);
        } else {
          this.confirmNavigation(system.id);
        }
        return;
      }
    }
  },

  confirmNavigation(systemId) {
    const routeInfo = NavigationService.getSystemRouteInfo(this.gameState, systemId);
    if (!routeInfo) return;

    if (!routeInfo.canNavigate) {
      this.showNotification('燃料不足！', 'error');
      return;
    }

    const message = `
      目的地: ${routeInfo.to.name}
      距离: ${routeInfo.distance.toFixed(1)} 光年
      燃料消耗: ${routeInfo.fuelCost.toFixed(1)}
      预计时间: ${(routeInfo.travelTime / 1000).toFixed(1)} 秒
      是否出发？
    `;

    if (confirm(message)) {
      GameController.navigateTo(systemId);
    }
  },

  switchView(view) {
    if (!Object.values(CONSTANTS.VIEWS).includes(view)) return;
    
    this.currentView = view;
    
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    document.querySelectorAll('.view-container').forEach(v => {
      v.classList.add('hidden');
    });

    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    eventBus.emit(CONSTANTS.EVENTS.UI_VIEW_CHANGE, { view });
    this.render();
  },

  render() {
    this.updateStatusBar();
    
    switch (this.currentView) {
      case CONSTANTS.VIEWS.MAP:
        this.renderMap();
        break;
      case CONSTANTS.VIEWS.TRADE:
        this.renderTradeView();
        break;
      case CONSTANTS.VIEWS.UPGRADE:
        this.renderUpgradeView();
        break;
      case CONSTANTS.VIEWS.INVESTMENT:
        this.renderInvestmentView();
        break;
      case CONSTANTS.VIEWS.LEADERBOARD:
        this.renderLeaderboardView();
        break;
      case CONSTANTS.VIEWS.SETTINGS:
        this.renderSettingsView();
        break;
    }
  },

  updateStatusBar() {
    if (!this.gameState) return;

    document.getElementById('credits').textContent = Helpers.formatCredits(this.gameState.player.credits);
    document.getElementById('totalAssets').textContent = Helpers.formatCredits(this.gameState.player.totalAssets);
    document.getElementById('marketShare').textContent = this.gameState.player.marketShare.toFixed(1) + '%';
    document.getElementById('gameTime').textContent = Helpers.formatDate(this.gameState.gameTime);
    document.getElementById('currentSystem').textContent = this.gameState.getCurrentSystem()?.name || '深空';

    const hullPercent = (this.gameState.ship.hull / this.gameState.ship.maxHull) * 100;
    const shieldPercent = (this.gameState.ship.shield / this.gameState.ship.maxShield) * 100;
    const fuelPercent = (this.gameState.ship.fuel / this.gameState.ship.maxFuel) * 100;
    const cargoPercent = (this.gameState.ship.cargo / this.gameState.ship.maxCargo) * 100;

    document.getElementById('hullBar').style.width = hullPercent + '%';
    document.getElementById('shieldBar').style.width = shieldPercent + '%';
    document.getElementById('fuelBar').style.width = fuelPercent + '%';
    document.getElementById('cargoBar').style.width = cargoPercent + '%';

    document.getElementById('hullText').textContent = `${Math.floor(this.gameState.ship.hull)}/${this.gameState.ship.maxHull}`;
    document.getElementById('shieldText').textContent = `${Math.floor(this.gameState.ship.shield)}/${this.gameState.ship.maxShield}`;
    document.getElementById('fuelText').textContent = `${Math.floor(this.gameState.ship.fuel)}/${this.gameState.ship.maxFuel}`;
    document.getElementById('cargoText').textContent = `${this.gameState.ship.cargo}/${this.gameState.ship.maxCargo}`;

    document.getElementById('currentTheme').textContent = ThemeController.getThemeName(ThemeController.getCurrentTheme());
  },

  startAnimation() {
    const animate = () => {
      if (this.currentView === CONSTANTS.VIEWS.MAP) {
        this.renderMap();
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  },

  renderMap() {
    if (!this.ctx || !this.gameState) return;

    const canvas = this.starMapCanvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;
    const theme = ThemeController.getCurrentTheme();

    ctx.clearRect(0, 0, width, height);

    this.renderBackgroundStars(ctx, width, height, theme);

    if (this.gameState.isNavigating && this.gameState.navigationTarget) {
      this.renderNavigationRoute(ctx, width, height, theme);
    }

    this.renderTradeRoutes(ctx, width, height, theme);
    this.renderSystems(ctx, width, height, theme);
  },

  renderBackgroundStars(ctx, width, height, theme) {
    const time = Date.now() * 0.001;
    this.stars.forEach(star => {
      if (theme === CONSTANTS.THEMES.SCI_FI) {
        const twinkle = Math.sin(time * star.twinkleSpeed * 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(
          (star.x / 100) * width,
          (star.y / 100) * height,
          star.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        const flicker = Math.sin(time * star.twinkleSpeed * 3) * 0.2 + 0.8;
        const hue = 20 + Math.random() * 20;
        ctx.fillStyle = `hsla(${hue}, 30%, ${40 + star.opacity * 30}%, ${flicker * 0.6})`;
        ctx.fillRect(
          (star.x / 100) * width - star.size / 2,
          (star.y / 100) * height - star.size / 2,
          star.size,
          star.size
        );
      }
    });
  },

  renderTradeRoutes(ctx, width, height, theme) {
    const currentSystem = this.gameState.getCurrentSystem();
    if (!currentSystem) return;

    if (theme === CONSTANTS.THEMES.SCI_FI) {
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-primary') || '#00d4ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.3;
    } else {
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5, 2, 5]);
      ctx.globalAlpha = 0.5;
    }

    this.gameState.systems.forEach(system => {
      if (system.id !== currentSystem.id) {
        ctx.beginPath();
        ctx.moveTo(
          (currentSystem.x / 100) * width,
          (currentSystem.y / 100) * height
        );
        ctx.lineTo(
          (system.x / 100) * width,
          (system.y / 100) * height
        );
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  renderNavigationRoute(ctx, width, height, theme) {
    const currentSystem = this.gameState.getCurrentSystem();
    const targetSystem = this.gameState.getSystemById(this.gameState.navigationTarget);
    if (!currentSystem || !targetSystem) return;

    if (theme === CONSTANTS.THEMES.SCI_FI) {
      const gradient = ctx.createLinearGradient(
        (currentSystem.x / 100) * width,
        (currentSystem.y / 100) * height,
        (targetSystem.x / 100) * width,
        (targetSystem.y / 100) * height
      );
      gradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--accent-primary') || '#00d4ff');
      gradient.addColorStop(1, getComputedStyle(document.body).getPropertyValue('--accent-secondary') || '#7c3aed');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = getComputedStyle(document.body).getPropertyValue('--accent-primary') || '#00d4ff';
    } else {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 5]);
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#7f1d1d';
    }

    const progressX = Helpers.lerp(currentSystem.x, targetSystem.x, this.gameState.navigationProgress);
    const progressY = Helpers.lerp(currentSystem.y, targetSystem.y, this.gameState.navigationProgress);

    ctx.beginPath();
    ctx.moveTo(
      (currentSystem.x / 100) * width,
      (currentSystem.y / 100) * height
    );
    ctx.lineTo(
      (progressX / 100) * width,
      (progressY / 100) * height
    );
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    this.renderShip(ctx, (progressX / 100) * width, (progressY / 100) * height, theme);
  },

  renderSystems(ctx, width, height, theme) {
    const currentSystem = this.gameState.getCurrentSystem();
    if (!currentSystem) return;

    this.gameState.systems.forEach(system => {
      const x = (system.x / 100) * width;
      const y = (system.y / 100) * height;
      const isCurrent = system.id === currentSystem.id;
      const isDiscovered = this.gameState.discoveredSystems.includes(system.id);

      if (theme === CONSTANTS.THEMES.SCI_FI) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, isCurrent ? 30 : 20);
        gradient.addColorStop(0, system.color);
        gradient.addColorStop(0.5, system.color + '80');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, isCurrent ? 30 : 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDiscovered ? system.color : '#666';
        ctx.beginPath();
        ctx.arc(x, y, isCurrent ? 12 : 8, 0, Math.PI * 2);
        ctx.fill();

        if (isCurrent) {
          const pulseSize = 15 + Math.sin(Date.now() * 0.005) * 5;
          ctx.strokeStyle = system.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        const baseColor = isDiscovered ? system.color : '#555';
        const size = isCurrent ? 16 : 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - size - 2, y - size - 2, size * 2 + 4, size * 2 + 4);
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        
        ctx.fillStyle = isDiscovered ? 'rgba(255,255,255,0.3)' : 'rgba(100,100,100,0.3)';
        ctx.fillRect(x - size, y - size, size * 2, 3);
        ctx.fillRect(x - size, y - size, 3, size * 2);

        if (isCurrent) {
          const pulseSize = 20 + Math.sin(Date.now() * 0.003) * 4;
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(x - pulseSize, y - pulseSize, pulseSize * 2, pulseSize * 2);
          ctx.setLineDash([]);
        }
      }

      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#fff';
      ctx.font = theme === CONSTANTS.THEMES.SCI_FI ? '12px Orbitron, sans-serif' : 'bold 11px Courier Prime, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isDiscovered ? system.name : '???', x, y + 35);
    });

    if (!this.gameState.isNavigating) {
      const currentX = (currentSystem.x / 100) * width;
      const currentY = (currentSystem.y / 100) * height;
      this.renderShip(ctx, currentX, currentY - 18, theme);
    }
  },

  renderShip(ctx, x, y, theme) {
    ctx.save();
    ctx.translate(x, y);

    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-primary') || '#00d4ff';

    if (theme === CONSTANTS.THEMES.SCI_FI) {
      ctx.fillStyle = accentColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = accentColor;

      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-8, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(0, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#78350f';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#451a03';
      
      ctx.fillRect(-9, -8, 18, 14);
      
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-7, -6, 14, 10);
      
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, -4, 6, 4);
      
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-10, 4, 3, 4);
      ctx.fillRect(7, 4, 3, 4);
      
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, 6, 4, 3 + Math.random() * 3);
      }
    }

    ctx.restore();
  },

  renderTradeView() {
    if (!this.gameState) return;

    const system = this.gameState.getCurrentSystem();
    if (!system) return;

    document.getElementById('tradeSystemName').textContent = system.name;
    document.getElementById('tradeSystemDesc').textContent = system.description;

    if (system.tradeBan) {
      document.getElementById('tradeBanWarning').classList.remove('hidden');
    } else {
      document.getElementById('tradeBanWarning').classList.add('hidden');
    }

    const tbody = document.getElementById('goodsTableBody');
    tbody.innerHTML = '';

    system.goods.forEach(stationGood => {
      const good = GOODS[stationGood.goodId];
      if (!good) return;

      const cargoQty = this.gameState.ship.getCargoQuantity(stationGood.goodId);
      const cargoItem = this.gameState.ship.cargoItems.find(i => i.goodId === stationGood.goodId);
      const buyPrice = cargoItem ? cargoItem.buyPrice : 0;
      const profitPerUnit = stationGood.price - buyPrice;
      const trendColor = Helpers.getTrendColor(stationGood.trend);
      const trendIcon = Helpers.getTrendIcon(stationGood.trend);

      const priceHistory = stationGood.priceHistory || [];
      const sparkline = this.generateSparkline(priceHistory, stationGood.basePrice);

      const maxBuy = TradeService.getMaxBuyQuantity(this.gameState, stationGood.goodId);
      const maxSell = TradeService.getMaxSellQuantity(this.gameState, stationGood.goodId);

      const row = document.createElement('tr');
      row.className = 'goods-row';
      row.innerHTML = `
        <td><span class="good-icon">${good.icon}</span> ${good.name}</td>
        <td>
          <span style="color: ${trendColor}">${Helpers.formatCredits(stationGood.price)}</span>
          ${trendIcon}
        </td>
        <td>${stationGood.quantity}</td>
        <td>${cargoQty}</td>
        <td>
          <span style="color: ${profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${profitPerUnit >= 0 ? '+' : ''}${profitPerUnit.toFixed(0)}
          </span>
        </td>
        <td><div class="sparkline">${sparkline}</div></td>
        <td>
          <div class="trade-actions">
            <input type="number" min="1" max="999" value="1" 
                   id="qty-${stationGood.goodId}" 
                   class="trade-input">
            <button class="btn btn-small btn-buy" 
                    onclick="UIController.handleBuy('${stationGood.goodId}')"
                    ${maxBuy <= 0 || system.tradeBan ? 'disabled' : ''}>
              买入
            </button>
            <button class="btn btn-small btn-sell" 
                    onclick="UIController.handleSell('${stationGood.goodId}')"
                    ${maxSell <= 0 || system.tradeBan ? 'disabled' : ''}>
              卖出
            </button>
            <button class="btn btn-small btn-max" 
                    onclick="document.getElementById('qty-${stationGood.goodId}').value=${maxBuy}">
              最大
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    this.renderCargoList();
  },

  generateSparkline(prices, basePrice) {
    if (prices.length < 2) return '';
    
    const min = Math.min(...prices, basePrice * 0.7);
    const max = Math.max(...prices, basePrice * 1.3);
    const range = max - min || 1;
    
    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * 60;
      const y = 20 - ((p - min) / range) * 16;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] > prices[0];
    const color = isUp ? '#10b981' : '#ef4444';

    return `
      <svg width="60" height="20" viewBox="0 0 60 20">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/>
      </svg>
    `;
  },

  renderCargoList() {
    const cargoDiv = document.getElementById('cargoList');
    if (!cargoDiv) return;

    const themeContent = ThemeController.getContent('cargoTitle');
    const themeEmpty = ThemeController.getContent('cargoEmpty');

    if (this.gameState.ship.cargoItems.length === 0) {
      cargoDiv.innerHTML = `<p class="empty-cargo">${themeEmpty}</p>`;
      return;
    }

    cargoDiv.innerHTML = `<h4>${themeContent}</h4>` + this.gameState.ship.cargoItems.map(item => {
      const good = GOODS[item.goodId];
      return `
        <div class="cargo-item">
          <span>${good?.icon} ${good?.name || item.goodId}</span>
          <span>x${item.quantity}</span>
          <span class="muted">成本: ${Helpers.formatCredits(item.buyPrice)}</span>
        </div>
      `;
    }).join('');
  },

  handleBuy(goodId) {
    const input = document.getElementById(`qty-${goodId}`);
    const quantity = parseInt(input.value) || 1;
    const result = GameController.buyGood(goodId, quantity);
    if (!result.success) {
      this.showNotification(result.message, 'error');
    }
  },

  handleSell(goodId) {
    const input = document.getElementById(`qty-${goodId}`);
    const quantity = parseInt(input.value) || 1;
    const result = GameController.sellGood(goodId, quantity);
    if (!result.success) {
      this.showNotification(result.message, 'error');
    }
  },

  renderUpgradeView() {
    if (!this.gameState) return;

    const upgradeTypes = ['cargo', 'engine', 'shield', 'weapon'];
    const container = document.getElementById('upgradeList');
    container.innerHTML = '';

    upgradeTypes.forEach(type => {
      const currentLevel = this.gameState.ship.upgrades[type];
      const currentValue = Helpers.calculateUpgradeValue(type, currentLevel);
      const nextValue = currentLevel < 10 ? Helpers.calculateUpgradeValue(type, currentLevel + 1) : null;
      const cost = Helpers.calculateUpgradeCost(type, currentLevel);
      const canUpgrade = UpgradeService.canUpgrade(this.gameState, type);
      const isMaxLevel = currentLevel >= 10;

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-header">
          <span class="upgrade-icon">${UpgradeService.getUpgradeIcon(type)}</span>
          <div>
            <h3>${UpgradeService.getUpgradeName(type)}</h3>
            <p class="upgrade-desc">${UpgradeService.getUpgradeDescription(type)}</p>
          </div>
        </div>
        <div class="upgrade-stats">
          <div class="stat-row">
            <span>等级</span>
            <span class="level-badge">Lv.${currentLevel}/10</span>
          </div>
          <div class="stat-row">
            <span>当前值</span>
            <span>${type === 'engine' ? currentValue.toFixed(1) + 'x' : currentValue}</span>
          </div>
          ${nextValue ? `
          <div class="stat-row upgrade-next">
            <span>升级后</span>
            <span>→ ${type === 'engine' ? nextValue.toFixed(1) + 'x' : nextValue}</span>
          </div>
          ` : ''}
        </div>
        <div class="upgrade-level-bar">
          ${Array(10).fill(0).map((_, i) => `
            <div class="level-segment ${i < currentLevel ? 'filled' : ''}"></div>
          `).join('')}
        </div>
        <button class="btn btn-upgrade ${canUpgrade && !isMaxLevel ? '' : 'disabled'}"
                onclick="UIController.handleUpgrade('${type}')"
                ${!canUpgrade || isMaxLevel ? 'disabled' : ''}>
          ${isMaxLevel ? '已满级' : `升级 - ${Helpers.formatCredits(cost)}`}
        </button>
      `;
      container.appendChild(card);
    });

    this.renderShipStats();
  },

  renderShipStats() {
    const ship = this.gameState.ship;
    const statsDiv = document.getElementById('shipStats');
    const theme = ThemeController.getCurrentTheme();
    
    const shipName = ThemeController.getContent('shipName');
    const isSciFi = theme === CONSTANTS.THEMES.SCI_FI;
    
    statsDiv.innerHTML = `
      <h3>${isSciFi ? '🚀' : '🚗'} ${ship.name}</h3>
      <div class="ship-stat-grid">
        <div class="stat-box">
          <div class="stat-label">${isSciFi ? '船体' : '车身'}</div>
          <div class="stat-value">${Math.floor(ship.hull)}/${ship.maxHull}</div>
          <button class="btn btn-small" onclick="UIController.handleRepair()">${isSciFi ? '维修' : '修补'} (₵10/点)</button>
        </div>
        <div class="stat-box">
          <div class="stat-label">${isSciFi ? '护盾' : '装甲'}</div>
          <div class="stat-value">${Math.floor(ship.shield)}/${ship.maxShield}</div>
          <button class="btn btn-small" onclick="UIController.handleRecharge()">${isSciFi ? '充能' : '加固'} (₵5/点)</button>
        </div>
        <div class="stat-box">
          <div class="stat-label">${isSciFi ? '燃料' : '燃油'}</div>
          <div class="stat-value">${Math.floor(ship.fuel)}/${ship.maxFuel}</div>
          <button class="btn btn-small" onclick="UIController.handleRefuel()">${isSciFi ? '补充' : '加注'} (₵2/点)</button>
        </div>
      </div>
    `;
  },

  handleUpgrade(type) {
    const result = GameController.purchaseUpgrade(type);
    if (!result.success) {
      this.showNotification(result.message, 'error');
    }
  },

  handleRepair() {
    const damage = this.gameState.ship.maxHull - this.gameState.ship.hull;
    if (damage <= 0) {
      this.showNotification('船体完好，无需维修', 'info');
      return;
    }
    const amount = Math.min(damage, 10);
    const result = GameController.repairShip(amount);
    if (result.success) {
      this.renderUpgradeView();
    } else {
      this.showNotification(result.message, 'error');
    }
  },

  handleRecharge() {
    const needed = this.gameState.ship.maxShield - this.gameState.ship.shield;
    if (needed <= 0) {
      this.showNotification('护盾已满', 'info');
      return;
    }
    const amount = Math.min(needed, 20);
    const result = GameController.rechargeShield(amount);
    if (result.success) {
      this.renderUpgradeView();
    } else {
      this.showNotification(result.message, 'error');
    }
  },

  handleRefuel() {
    const needed = this.gameState.ship.maxFuel - this.gameState.ship.fuel;
    if (needed <= 0) {
      this.showNotification('燃料已满', 'info');
      return;
    }
    const amount = Math.min(needed, 50);
    const result = GameController.refuel(amount);
    if (result.success) {
      this.renderUpgradeView();
    } else {
      this.showNotification(result.message, 'error');
    }
  },

  renderInvestmentView() {
    if (!this.gameState) return;

    const availableContainer = document.getElementById('availableInvestments');
    const activeContainer = document.getElementById('activeInvestments');

    const available = InvestmentService.getAvailableInvestments(this.gameState);
    const active = InvestmentService.getPlayerInvestments(this.gameState);

    availableContainer.innerHTML = '<h3>💼 可投资项目</h3>' + (available.length === 0 
      ? '<p class="empty-text">当前星系无可投资项目</p>'
      : available.map(inv => this.renderInvestmentCard(inv, false)).join(''));

    activeContainer.innerHTML = '<h3>📈 进行中的投资</h3>' + (active.length === 0
      ? '<p class="empty-text">暂无进行中的投资</p>'
      : active.map(inv => this.renderInvestmentCard(inv, true)).join(''));
  },

  renderInvestmentCard(inv, isActive) {
    const riskColor = Helpers.getRiskColor(inv.risk);
    const riskText = Helpers.getRiskText(inv.risk);
    const progress = isActive ? inv.progress * 100 : 0;

    return `
      <div class="investment-card">
        <div class="investment-header">
          <span class="investment-icon">${inv.icon}</span>
          <div>
            <h4>${inv.name}</h4>
            <p class="investment-desc">${inv.description}</p>
          </div>
        </div>
        <div class="investment-stats">
          <div class="stat-row">
            <span>投资金额</span>
            <span>${Helpers.formatCredits(inv.cost)}</span>
          </div>
          <div class="stat-row">
            <span>预期收益</span>
            <span class="success">+${(inv.returnRate * 100).toFixed(0)}%</span>
          </div>
          <div class="stat-row">
            <span>风险等级</span>
            <span style="color: ${riskColor}">${riskText}</span>
          </div>
          <div class="stat-row">
            <span>投资周期</span>
            <span>${inv.duration} 游戏天</span>
          </div>
          ${isActive ? `
          <div class="stat-row">
            <span>剩余时间</span>
            <span>${inv.remainingTime.toFixed(1)} 天</span>
          </div>
          ` : ''}
        </div>
        ${isActive ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        ` : ''}
        ${!isActive ? `
        <button class="btn btn-invest ${this.gameState.player.canAfford(inv.cost) ? '' : 'disabled'}"
                onclick="UIController.handleInvest('${inv.id}')"
                ${!this.gameState.player.canAfford(inv.cost) ? 'disabled' : ''}>
          投资 ${Helpers.formatCredits(inv.cost)}
        </button>
        ` : ''}
      </div>
    `;
  },

  handleInvest(investmentId) {
    const system = this.gameState.getCurrentSystem();
    const investment = system.investments.find(i => i.id === investmentId);
    if (!investment) return;

    const result = GameController.startInvestment(investment);
    if (result.success) {
      this.renderInvestmentView();
    } else {
      this.showNotification(result.message, 'error');
    }
  },

  renderLeaderboardView() {
    if (!this.gameState) return;

    const allTraders = [
      {
        name: this.gameState.player.name + ' (你)',
        credits: this.gameState.player.totalAssets,
        marketShare: this.gameState.player.marketShare,
        isPlayer: true
      },
      ...this.gameState.aiTraders.map(t => ({
        name: t.name,
        avatar: t.avatar,
        credits: t.credits + t.ship.calculateCargoValue(),
        marketShare: t.marketShare,
        isPlayer: false
      }))
    ].sort((a, b) => b.credits - a.credits);

    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = allTraders.map((trader, index) => {
      const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : '';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

      return `
        <tr class="${trader.isPlayer ? 'player-row' : ''} ${rankClass}">
          <td class="rank-cell">${medal}</td>
          <td>${trader.avatar || '👤'} ${trader.name}</td>
          <td>${Helpers.formatCredits(trader.credits)}</td>
          <td>
            <div class="share-bar-container">
              <div class="share-bar" style="width: ${trader.marketShare}%"></div>
              <span class="share-text">${trader.marketShare.toFixed(1)}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderSettingsView() {
    const container = document.getElementById('settingsContainer');
    const theme = ThemeController.getCurrentTheme();
    const isSciFi = theme === CONSTANTS.THEMES.SCI_FI;
    
    container.innerHTML = `
      <div class="settings-section">
        <h3>🎨 ${isSciFi ? '主题设置' : '风格选择'}</h3>
        <p class="settings-desc">${isSciFi ? '选择你喜欢的界面风格' : '选择你的废土生存风格'}</p>
        <div class="theme-selector">
          <div class="theme-option ${ThemeController.getCurrentTheme() === CONSTANTS.THEMES.SCI_FI ? 'selected' : ''}"
               onclick="UIController.handleThemeChange('${CONSTANTS.THEMES.SCI_FI}')">
            <div class="theme-preview theme-preview-sci-fi"></div>
            <span>深空科幻</span>
          </div>
          <div class="theme-option ${ThemeController.getCurrentTheme() === CONSTANTS.THEMES.WASTELAND ? 'selected' : ''}"
               onclick="UIController.handleThemeChange('${CONSTANTS.THEMES.WASTELAND}')">
            <div class="theme-preview theme-preview-wasteland"></div>
            <span>末日废土</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>💾 ${isSciFi ? '存档管理' : '记录管理'}</h3>
        <div class="settings-actions">
          <button class="btn" onclick="GameController.saveGame()">${isSciFi ? '手动保存' : '保存记录'}</button>
          <button class="btn btn-danger" onclick="UIController.handleReset()">${isSciFi ? '重置游戏' : '重新开始'}</button>
        </div>
        <p class="settings-hint">${isSciFi ? '游戏每5秒自动保存，关闭页面时也会自动保存' : '每5秒自动记录，离开时也会保存'}</p>
      </div>

      <div class="settings-section">
        <h3>📊 游戏数据</h3>
        <div class="data-grid">
          <div class="data-item">
            <span>游戏时间</span>
            <span>${Helpers.formatDate(this.gameState.gameTime)}</span>
          </div>
          <div class="data-item">
            <span>已发现星系</span>
            <span>${this.gameState.discoveredSystems.length}/${this.gameState.systems.length}</span>
          </div>
          <div class="data-item">
            <span>总资产</span>
            <span>${Helpers.formatCredits(this.gameState.player.totalAssets)}</span>
          </div>
          <div class="data-item">
            <span>当前飞船</span>
            <span>${this.gameState.ship.name}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>🎮 操作说明</h3>
        <ul class="help-list">
          <li><strong>星系地图</strong>：点击其他星系可前往，点击当前星系进入交易</li>
          <li><strong>交易</strong>：低买高卖，注意价格走势和库存</li>
          <li><strong>升级</strong>：提升飞船性能，解锁更多可能性</li>
          <li><strong>投资</strong>：长期项目，高风险高回报</li>
          <li><strong>随机事件</strong>：航行中可能遇到各种事件，谨慎选择</li>
        </ul>
      </div>
    `;
  },

  handleThemeChange(theme) {
    ThemeController.setTheme(theme);
    this.renderSettingsView();
  },

  handleReset() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
      this.gameState = GameController.resetGame();
      this.switchView(CONSTANTS.VIEWS.MAP);
      this.render();
    }
  },

  showEventModal(event) {
    this.activeEvent = event;
    const modal = document.getElementById('eventModal');
    const overlay = document.getElementById('modalOverlay');

    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDescription').textContent = event.description;

    const choicesContainer = document.getElementById('eventChoices');
    choicesContainer.innerHTML = event.choices.map((choice, index) => `
      <button class="btn btn-event-choice" onclick="UIController.handleEventChoice(${index})">
        ${choice.text}
      </button>
    `).join('');

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('animate-in');
  },

  handleEventChoice(index) {
    if (!this.activeEvent) return;

    const result = GameController.resolveEvent(this.activeEvent, index);
    
    document.getElementById('eventResult').textContent = result.message;
    document.getElementById('eventChoices').innerHTML = `
      <button class="btn btn-event-choice" onclick="UIController.closeEventModal()">
        继续
      </button>
    `;

    this.activeEvent = null;
  },

  closeEventModal() {
    const modal = document.getElementById('eventModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    document.getElementById('eventResult').textContent = '';
    this.render();
  },

  showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const id = Helpers.generateId();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.id = `notif-${id}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="UIController.removeNotification('${id}')">×</button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('slide-in');
    }, 10);

    setTimeout(() => {
      this.removeNotification(id);
    }, 4000);
  },

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info':
      default: return 'ℹ️';
    }
  },

  removeNotification(id) {
    const notification = document.getElementById(`notif-${id}`);
    if (notification) {
      notification.classList.remove('slide-in');
      notification.classList.add('slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  },

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
};

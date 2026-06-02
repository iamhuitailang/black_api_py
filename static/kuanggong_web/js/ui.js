var UI = {
  currentView: 'dashboard',
  miningAnimFrame: null,
  notificationTimers: [],
  starfieldInterval: null,

  init: function() {
    UI.bindNavigation();
    UI.bindGlobalEvents();
    UI.startStarfield();
    UI.startMiningUIUpdate();
    UI.updateAll();
    if (Game.state.isMining) {
      UI.switchView('mining');
    } else {
      UI.switchView('dashboard');
    }
  },

  bindNavigation: function() {
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', function(e) {
        var view = this.getAttribute('data-view');
        if (view === 'mining' && !Game.state.isMining) {
          Game.startMining();
          return;
        }
        UI.switchView(view);
      });
    }
  },

  bindGlobalEvents: function() {
    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space' && UI.currentView === 'mining' && Game.state.isMining) {
        e.preventDefault();
        UI.handleMineClick();
      }
    });
  },

  switchView: function(view) {
    UI.currentView = view;
    var views = document.querySelectorAll('.game-view');
    for (var i = 0; i < views.length; i++) {
      views[i].classList.remove('active');
    }
    var target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');

    var navItems = document.querySelectorAll('.nav-item');
    for (var j = 0; j < navItems.length; j++) {
      navItems[j].classList.remove('active');
      if (navItems[j].getAttribute('data-view') === view) {
        navItems[j].classList.add('active');
      }
    }

    UI.renderCurrentView();
    UI.updateStatusBar();
  },

  renderCurrentView: function() {
    switch (UI.currentView) {
      case 'dashboard': UI.renderDashboard(); break;
      case 'starmap': UI.renderStarmap(); break;
      case 'mining': UI.renderMining(); break;
      case 'station': UI.renderStation(); break;
      case 'ship': UI.renderShip(); break;
      case 'achievements': UI.renderAchievements(); break;
    }
  },

  updateAll: function() {
    UI.updateStatusBar();
    UI.renderCurrentView();
  },

  updateStatusBar: function() {
    var s = Game.state;
    var coinsEl = document.getElementById('status-coins');
    var areaEl = document.getElementById('status-area');
    var cargoEl = document.getElementById('status-cargo');
    var hullEl = document.getElementById('status-hull');
    var shieldEl = document.getElementById('status-shield');

    if (coinsEl) coinsEl.textContent = s.player.coins.toLocaleString();
    if (areaEl) areaEl.textContent = GameData.areas[s.currentArea].name;
    if (cargoEl) cargoEl.textContent = Game.getCargoUsed() + '/' + s.ship.maxCargo;
    if (hullEl) {
      hullEl.textContent = Math.ceil(s.ship.hull) + '/' + s.ship.maxHull;
      hullEl.parentElement.className = 'status-item hull ' + (s.ship.hull < 30 ? 'critical' : s.ship.hull < 60 ? 'warning' : 'good');
    }
    if (shieldEl) {
      shieldEl.textContent = Math.ceil(s.ship.shield) + '/' + s.ship.maxShield;
      shieldEl.parentElement.className = 'status-item shield ' + (s.ship.shield < 20 ? 'critical' : s.ship.shield < 50 ? 'warning' : 'good');
    }
  },

  renderDashboard: function() {
    var s = Game.state;
    var area = GameData.areas[s.currentArea];
    var container = document.getElementById('view-dashboard');
    if (!container) return;

    var cargoHtml = '<div class="cargo-list">';
    var cargoKeys = Object.keys(s.ship.cargo);
    if (cargoKeys.length === 0) {
      cargoHtml += '<div class="empty-cargo">货舱为空</div>';
    } else {
      for (var i = 0; i < cargoKeys.length; i++) {
        var oreId = cargoKeys[i];
        var ore = UI.getOreById(oreId);
        if (ore) {
          cargoHtml += '<div class="cargo-item"><span class="ore-icon" style="color:' + ore.color + '">' + ore.icon + '</span><span class="ore-name">' + ore.name + '</span><span class="ore-count">x' + s.ship.cargo[oreId] + '</span></div>';
        }
      }
    }
    cargoHtml += '</div>';

    var equippedHtml = '';
    var cats = ['laser', 'shield', 'cargo', 'engine'];
    var catNames = { laser: '采矿激光', shield: '能量护盾', cargo: '货舱容量', engine: '推进引擎' };
    for (var j = 0; j < cats.length; j++) {
      var cat = cats[j];
      var eq = GameData.equipment[cat][s.equipment[cat]];
      equippedHtml += '<div class="equip-brief"><span class="equip-cat">' + catNames[cat] + '</span><span class="equip-name">' + eq.name + '</span></div>';
    }

    var recentNotifications = Game.notifications.slice(0, 5);
    var notifHtml = '';
    for (var k = 0; k < recentNotifications.length; k++) {
      notifHtml += '<div class="log-item log-' + recentNotifications[k].type + '">' + recentNotifications[k].message + '</div>';
    }

    container.innerHTML = '<div class="dashboard-grid">' +
      '<div class="panel ship-panel">' +
        '<h3 class="panel-title">🚀 ' + s.ship.name + '</h3>' +
        '<div class="ship-visual"><div class="ship-mini ' + (s.ship.color === 'rainbow' ? 'ship-rainbow' : '') + '"' + (s.ship.color !== 'rainbow' ? ' style="--ship-color:' + s.ship.color + '"' : '') + '><div class="mini-hull"></div><div class="mini-wing mini-left"></div><div class="mini-wing mini-right"></div><div class="mini-cockpit"></div><div class="mini-nose"></div></div></div>' +
        '<div class="ship-bars">' +
          '<div class="bar-group"><label>船体</label><div class="bar"><div class="bar-fill hull-bar" style="width:' + (s.ship.hull / s.ship.maxHull * 100) + '%"></div></div><span class="bar-value">' + Math.ceil(s.ship.hull) + '/' + s.ship.maxHull + '</span></div>' +
          '<div class="bar-group"><label>护盾</label><div class="bar"><div class="bar-fill shield-bar" style="width:' + (s.ship.shield / s.ship.maxShield * 100) + '%"></div></div><span class="bar-value">' + Math.ceil(s.ship.shield) + '/' + s.ship.maxShield + '</span></div>' +
          '<div class="bar-group"><label>货舱</label><div class="bar"><div class="bar-fill cargo-bar" style="width:' + (Game.getCargoUsed() / s.ship.maxCargo * 100) + '%"></div></div><span class="bar-value">' + Game.getCargoUsed() + '/' + s.ship.maxCargo + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="panel location-panel">' +
        '<h3 class="panel-title">📍 当前位置</h3>' +
        '<div class="location-info"><div class="area-name" style="color:' + area.color + '">' + area.name + '</div><div class="area-desc">' + area.desc + '</div><div class="area-danger">危险等级：' + '⚠️'.repeat(area.danger) + '</div></div>' +
        '<div class="dashboard-actions">' +
          (s.isMining ? '<button class="btn btn-primary" onclick="UI.switchView(\'mining\')">⛏️ 继续采矿</button>' : '<button class="btn btn-primary" onclick="Game.startMining()">⛏️ 开始采矿</button>') +
          '<button class="btn btn-secondary" onclick="UI.switchView(\'starmap\')">🗺️ 星图</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel cargo-panel">' +
        '<h3 class="panel-title">📦 货舱</h3>' +
        cargoHtml +
      '</div>' +
      '<div class="panel equip-panel">' +
        '<h3 class="panel-title">🔧 装备</h3>' +
        equippedHtml +
      '</div>' +
      '<div class="panel stats-panel">' +
        '<h3 class="panel-title">📊 统计</h3>' +
        '<div class="stats-grid">' +
          '<div class="stat-item"><span class="stat-value">' + s.stats.totalOresMined + '</span><span class="stat-label">矿石开采</span></div>' +
          '<div class="stat-item"><span class="stat-value">' + s.stats.totalCoinsEarned.toLocaleString() + '</span><span class="stat-label">金币收入</span></div>' +
          '<div class="stat-item"><span class="stat-value">' + s.stats.asteroidsDestroyed + '</span><span class="stat-label">小行星摧毁</span></div>' +
          '<div class="stat-item"><span class="stat-value">' + s.stats.totalTrips + '</span><span class="stat-label">采矿航行</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="panel log-panel">' +
        '<h3 class="panel-title">📜 日志</h3>' +
        '<div class="log-list">' + (notifHtml || '<div class="empty-log">暂无日志</div>') + '</div>' +
      '</div>' +
    '</div>';
  },

  renderStarmap: function() {
    var s = Game.state;
    var container = document.getElementById('view-starmap');
    if (!container) return;

    var areasHtml = '';
    for (var i = 0; i < GameData.areas.length; i++) {
      var area = GameData.areas[i];
      var unlocked = s.unlockedAreas.indexOf(i) !== -1;
      var isCurrent = s.currentArea === i;

      var areaOres = '';
      for (var j = 0; j < GameData.ores.length; j++) {
        if (GameData.ores[j].minArea <= i && area.oreTiers.indexOf(GameData.ores[j].tier) !== -1) {
          areaOres += '<span class="ore-tag" style="border-color:' + GameData.tierColors[GameData.ores[j].tier] + ';color:' + GameData.tierColors[GameData.ores[j].tier] + '">' + GameData.ores[j].name + '</span>';
        }
      }

      areasHtml += '<div class="area-card' + (isCurrent ? ' current' : '') + (!unlocked ? ' locked' : '') + '">' +
        '<div class="area-header" style="border-color:' + area.color + '">' +
          '<div class="area-icon" style="background:' + area.color + '">' + (unlocked ? '🌌' : '🔒') + '</div>' +
          '<div class="area-title"><h4>' + area.name + '</h4><span class="area-danger-level">危险 ' + '⚠️'.repeat(area.danger) + '</span></div>' +
        '</div>' +
        '<p class="area-desc">' + area.desc + '</p>' +
        '<div class="area-ores">' + areaOres + '</div>' +
        '<div class="area-actions">' +
          (isCurrent ? '<span class="btn btn-current">当前区域</span>' :
            unlocked ? '<button class="btn btn-primary" onclick="Game.travelToArea(' + i + ');UI.renderStarmap()">前往</button>' :
            '<button class="btn btn-unlock" onclick="UI.handleUnlockArea(' + i + ')">解锁 (' + area.unlockCost + ' 💰)</button>'
          ) +
        '</div>' +
      '</div>';
    }

    container.innerHTML = '<div class="starmap-header"><h2>🗺️ 星际地图</h2><p class="starmap-desc">探索银河系中的不同星系，发现更稀有的矿石</p></div><div class="areas-grid">' + areasHtml + '</div>';
  },

  handleUnlockArea: function(areaId) {
    var area = GameData.areas[areaId];
    if (Game.state.player.coins < area.unlockCost) {
      UI.showNotification('warning', '⚠️ 金币不足！需要' + area.unlockCost + '金币');
      return;
    }
    if (confirm('确定花费' + area.unlockCost + '金币解锁' + area.name + '吗？')) {
      if (Game.unlockArea(areaId)) {
        UI.renderStarmap();
      } else {
        UI.showNotification('danger', '解锁失败');
      }
    }
  },

  renderMining: function() {
    var s = Game.state;
    var container = document.getElementById('view-mining');
    if (!container) return;

    if (!s.isMining) {
      container.innerHTML = '<div class="mining-idle"><h2>⛏️ 采矿场</h2><p>选择一个星系开始采矿</p><button class="btn btn-primary btn-large" onclick="Game.startMining()">开始采矿</button></div>';
      return;
    }

    var asteroid = s.currentAsteroid;
    var weather = Game.getWeatherData(s.weather);
    var hpPercent = Math.max(0, asteroid.hp / asteroid.maxHp * 100);

    container.innerHTML = '<div class="mining-layout">' +
      '<div class="mining-top">' +
        '<div class="mining-weather ' + s.weather + '">' +
          '<span class="weather-icon">' + weather.icon + '</span>' +
          '<span class="weather-name">' + weather.name + '</span>' +
          '<span class="weather-timer">' + s.weatherTimer + 's</span>' +
        '</div>' +
        '<div class="mining-area-badge" style="background:' + GameData.areas[s.currentArea].color + '">' + GameData.areas[s.currentArea].name + '</div>' +
      '</div>' +
      '<div class="mining-field weather-bg-' + s.weather + '" id="mining-field" onclick="UI.handleMineClick()">' +
        '<div class="weather-overlay weather-' + s.weather + '"></div>' +
        '<div class="mining-ship ' + (s.ship.color === 'rainbow' ? 'ship-rainbow' : '') + '" id="mining-ship"' + (s.ship.color !== 'rainbow' ? ' style="--ship-color:' + s.ship.color + '"' : '') + '>' +
          '<div class="ship-hull"></div>' +
          '<div class="ship-wing ship-wing-left"></div>' +
          '<div class="ship-wing ship-wing-right"></div>' +
          '<div class="ship-cockpit"></div>' +
          '<div class="ship-nose"></div>' +
          '<div class="ship-engine-left"></div>' +
          '<div class="ship-engine-right"></div>' +
          '<div class="ship-glow"></div>' +
        '</div>' +
        '<div class="asteroid" id="asteroid" style="width:' + asteroid.size + 'px;height:' + asteroid.size + 'px">' +
          '<div class="asteroid-inner">' +
            '<div class="asteroid-crack" style="opacity:' + (1 - hpPercent / 100) + '"></div>' +
            '<span class="asteroid-ore-icon" style="color:' + asteroid.mainOre.color + '">' + asteroid.mainOre.icon + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="asteroid-info">' +
          '<div class="asteroid-name">' + asteroid.name + '</div>' +
          '<div class="asteroid-hp-bar"><div class="hp-fill" style="width:' + hpPercent + '%"></div></div>' +
          '<div class="asteroid-ore-info">主要矿石：<span style="color:' + asteroid.mainOre.color + '">' + asteroid.mainOre.name + '</span></div>' +
        '</div>' +
        '<div class="mine-hint">点击小行星或按空格键采矿</div>' +
        '<div id="mining-effects"></div>' +
      '</div>' +
      '<div class="mining-bottom">' +
        '<div class="mining-ship-status">' +
          '<div class="mini-bar"><label>船体</label><div class="mini-bar-track"><div class="mini-bar-fill hull" style="width:' + (s.ship.hull / s.ship.maxHull * 100) + '%"></div></div><span>' + Math.ceil(s.ship.hull) + '</span></div>' +
          '<div class="mini-bar"><label>护盾</label><div class="mini-bar-track"><div class="mini-bar-fill shield" style="width:' + (s.ship.shield / s.ship.maxShield * 100) + '%"></div></div><span>' + Math.ceil(s.ship.shield) + '</span></div>' +
          '<div class="mini-bar"><label>货舱</label><div class="mini-bar-track"><div class="mini-bar-fill cargo" style="width:' + (Game.getCargoUsed() / s.ship.maxCargo * 100) + '%"></div></div><span>' + Game.getCargoUsed() + '/' + s.ship.maxCargo + '</span></div>' +
        '</div>' +
        '<button class="btn btn-danger" onclick="Game.returnToStation()">🏠 返回空间站</button>' +
      '</div>' +
    '</div>';
  },

  handleMineClick: function() {
    if (!Game.state.isMining || !Game.state.currentAsteroid) return;

    var result = Game.mineAsteroid();
    if (!result) return;

    var field = document.getElementById('mining-field');
    var effects = document.getElementById('mining-effects');
    if (!field || !effects) return;

    var asteroid = document.getElementById('asteroid');
    if (asteroid) {
      asteroid.classList.remove('hit');
      void asteroid.offsetWidth;
      asteroid.classList.add('hit');
    }

    var laserEl = document.createElement('div');
    laserEl.className = 'laser-beam';
    if (result.isCrit) laserEl.classList.add('crit');
    effects.appendChild(laserEl);
    setTimeout(function() { laserEl.remove(); }, 300);

    if (result.damage) {
      var dmgEl = document.createElement('div');
      dmgEl.className = 'damage-number' + (result.isCrit ? ' crit' : '');
      dmgEl.textContent = (result.isCrit ? '💥' : '') + '-' + result.damage;
      var rect = asteroid ? asteroid.getBoundingClientRect() : { left: 200, top: 200 };
      dmgEl.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 60) + 'px';
      dmgEl.style.top = (rect.top + (Math.random() - 0.5) * 40) + 'px';
      document.body.appendChild(dmgEl);
      setTimeout(function() { dmgEl.remove(); }, 800);
    }

    if (result.oreFound && result.oreFound !== 'full') {
      var oreEl = document.createElement('div');
      oreEl.className = 'ore-popup';
      oreEl.style.color = result.oreFound.color;
      oreEl.textContent = result.oreFound.icon + ' ' + result.oreFound.name;
      effects.appendChild(oreEl);
      setTimeout(function() { oreEl.remove(); }, 1000);
    } else if (result.oreFound === 'full') {
      var fullEl = document.createElement('div');
      fullEl.className = 'ore-popup full';
      fullEl.textContent = '📦 货舱已满！';
      effects.appendChild(fullEl);
      setTimeout(function() { fullEl.remove(); }, 1000);
    }

    var currentName = Game.state.currentAsteroid.name;
    var nameEl = document.querySelector('.asteroid-name');
    if (nameEl && nameEl.textContent !== currentName) {
      UI.renderMining();
    } else {
      var hpPercent = Math.max(0, Game.state.currentAsteroid.hp / Game.state.currentAsteroid.maxHp * 100);
      var hpFill = document.querySelector('.hp-fill');
      if (hpFill) hpFill.style.width = hpPercent + '%';
      var crack = document.querySelector('.asteroid-crack');
      if (crack) crack.style.opacity = (1 - hpPercent / 100);
    }

    UI.updateStatusBar();
    UI.updateMiningBars();
  },

  updateMiningBars: function() {
    var s = Game.state;
    var bars = document.querySelectorAll('.mini-bar-fill.hull');
    for (var i = 0; i < bars.length; i++) bars[i].style.width = (s.ship.hull / s.ship.maxHull * 100) + '%';
    var shieldBars = document.querySelectorAll('.mini-bar-fill.shield');
    for (var j = 0; j < shieldBars.length; j++) shieldBars[j].style.width = (s.ship.shield / s.ship.maxShield * 100) + '%';
    var cargoBars = document.querySelectorAll('.mini-bar-fill.cargo');
    for (var k = 0; k < cargoBars.length; k++) cargoBars[k].style.width = (Game.getCargoUsed() / s.ship.maxCargo * 100) + '%';
    var cargoTexts = document.querySelectorAll('.mini-bar:last-child span');
    for (var l = 0; l < cargoTexts.length; l++) cargoTexts[l].textContent = Game.getCargoUsed() + '/' + s.ship.maxCargo;
  },

  updateCargoDisplay: function() {
    if (UI.currentView === 'dashboard') UI.renderDashboard();
    if (UI.currentView === 'mining') UI.updateMiningBars();
  },

  updateShipStatus: function() {
    UI.updateStatusBar();
    if (UI.currentView === 'mining') UI.updateMiningBars();
  },

  updateWeatherDisplay: function() {
    if (UI.currentView === 'mining') {
      UI.renderMining();
      var ship = document.getElementById('mining-ship');
      if (ship && Game.state.weather !== 'calm' && Game.state.weather !== 'nebula') {
        ship.classList.add('shake');
        setTimeout(function() { ship.classList.remove('shake'); }, 500);
      }
    }
  },

  startMiningUIUpdate: function() {
    setInterval(function() {
      if (UI.currentView === 'mining' && Game.state.isMining) {
        var timerEl = document.querySelector('.weather-timer');
        if (timerEl) timerEl.textContent = Game.state.weatherTimer + 's';
        UI.updateMiningBars();
        UI.updateStatusBar();
      }
    }, 1000);
  },

  showDamageFlash: function() {
    var field = document.getElementById('mining-field');
    if (field) {
      field.classList.remove('damage-flash');
      void field.offsetWidth;
      field.classList.add('damage-flash');
    }
  },

  renderStation: function() {
    var s = Game.state;
    var container = document.getElementById('view-station');
    if (!container) return;

    var marketHtml = '<div class="market-table"><table><thead><tr><th>矿石</th><th>品质</th><th>数量</th><th>单价</th><th>趋势</th><th>操作</th></tr></thead><tbody>';
    var cargoKeys = Object.keys(s.ship.cargo);
    for (var i = 0; i < cargoKeys.length; i++) {
      var oreId = cargoKeys[i];
      var ore = UI.getOreById(oreId);
      if (!ore) continue;
      var price = s.marketPrices[oreId] || ore.basePrice;
      var trend = price > ore.basePrice ? 'up' : price < ore.basePrice ? 'down' : 'same';
      var trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
      marketHtml += '<tr>' +
        '<td><span style="color:' + ore.color + '">' + ore.icon + '</span> ' + ore.name + '</td>' +
        '<td><span class="tier-badge tier-' + ore.tier + '">' + GameData.tierNames[ore.tier] + '</span></td>' +
        '<td>' + s.ship.cargo[oreId] + '</td>' +
        '<td>' + price.toFixed(1) + ' 💰</td>' +
        '<td>' + trendIcon + '</td>' +
        '<td><button class="btn btn-sm btn-sell" onclick="UI.handleSellOre(\'' + oreId + '\')">出售</button></td>' +
      '</tr>';
    }
    if (cargoKeys.length === 0) {
      marketHtml += '<tr><td colspan="6" class="empty-row">货舱为空，去采矿吧！</td></tr>';
    }
    marketHtml += '</tbody></table></div>';

    var totalValue = 0;
    for (var j = 0; j < cargoKeys.length; j++) {
      var oid = cargoKeys[j];
      var o = UI.getOreById(oid);
      if (o) totalValue += (s.marketPrices[oid] || o.basePrice) * s.ship.cargo[oid];
    }

    var shopHtml = '';
    var cats = ['laser', 'shield', 'cargo', 'engine'];
    var catNames = { laser: '采矿激光', shield: '能量护盾', cargo: '货舱容量', engine: '推进引擎' };
    var catIcons = { laser: '⚡', shield: '🛡️', cargo: '📦', engine: '🚀' };
    for (var k = 0; k < cats.length; k++) {
      var cat = cats[k];
      var currentLevel = s.equipment[cat];
      var nextLevel = currentLevel + 1;
      var currentItem = GameData.equipment[cat][currentLevel];
      var nextItem = GameData.equipment[cat][nextLevel];

      shopHtml += '<div class="shop-item' + (!nextItem ? ' maxed' : '') + '">' +
        '<div class="shop-item-header"><span class="shop-icon">' + catIcons[cat] + '</span><span class="shop-name">' + catNames[cat] + '</span></div>' +
        '<div class="shop-current">当前：' + currentItem.name + ' - ' + currentItem.desc + '</div>';
      if (nextItem) {
        var canAfford = s.player.coins >= nextItem.price;
        shopHtml += '<div class="shop-next">升级：' + nextItem.name + ' - ' + nextItem.desc + '</div>' +
          '<div class="shop-price' + (!canAfford ? ' cant-afford' : '') + '">' + nextItem.price + ' 💰</div>' +
          '<button class="btn btn-upgrade' + (!canAfford ? ' disabled' : '') + '" onclick="UI.handleBuyEquipment(\'' + cat + '\',' + nextLevel + ')"' + (!canAfford ? ' disabled' : '') + '>升级</button>';
      } else {
        shopHtml += '<div class="shop-maxed">✨ 已达最高等级</div>';
      }
      shopHtml += '</div>';
    }

    var priceOverviewHtml = '<div class="price-overview"><h4>📈 市场行情</h4><div class="price-grid">';
    for (var m = 0; m < GameData.ores.length; m++) {
      var pOre = GameData.ores[m];
      var pPrice = s.marketPrices[pOre.id] || pOre.basePrice;
      var pTrend = pPrice > pOre.basePrice ? 'up' : pPrice < pOre.basePrice ? 'down' : 'same';
      var pTrendIcon = pTrend === 'up' ? '▲' : pTrend === 'down' ? '▼' : '—';
      var pTrendClass = pTrend === 'up' ? 'price-up' : pTrend === 'down' ? 'price-down' : 'price-same';
      priceOverviewHtml += '<div class="price-item"><span class="price-ore" style="color:' + pOre.color + '">' + pOre.icon + '</span><span class="price-name">' + pOre.name + '</span><span class="price-val ' + pTrendClass + '">' + pPrice.toFixed(1) + ' ' + pTrendIcon + '</span></div>';
    }
    priceOverviewHtml += '</div></div>';

    container.innerHTML = '<div class="station-layout">' +
      '<div class="station-header"><h2>🏪 空间站</h2></div>' +
      priceOverviewHtml +
      '<div class="station-section market-section">' +
        '<h3>💰 交易市场</h3>' +
        marketHtml +
        '<div class="market-actions">' +
          '<div class="market-total">货舱总价值：<span class="total-value">' + Math.floor(totalValue).toLocaleString() + ' 💰</span></div>' +
          '<button class="btn btn-primary" onclick="UI.handleSellAll()">全部出售</button>' +
        '</div>' +
      '</div>' +
      '<div class="station-section shop-section">' +
        '<h3>🔧 装备商店</h3>' +
        '<div class="shop-grid">' + shopHtml + '</div>' +
      '</div>' +
      '<div class="station-section danger-zone">' +
        '<h3>⚠️ 危险操作</h3>' +
        '<button class="btn btn-danger" onclick="UI.handleResetGame()">重置游戏</button>' +
      '</div>' +
    '</div>';
  },

  handleSellOre: function(oreId) {
    var result = Game.sellOre(oreId, Game.state.ship.cargo[oreId] || 0);
    if (result) {
      UI.renderStation();
      UI.updateStatusBar();
    }
  },

  handleSellAll: function() {
    var result = Game.sellAllOres();
    if (result) {
      UI.renderStation();
      UI.updateStatusBar();
    }
  },

  handleBuyEquipment: function(category, level) {
    if (Game.buyEquipment(category, level)) {
      UI.renderStation();
      UI.updateStatusBar();
    } else {
      UI.showNotification('warning', '⚠️ 金币不足或无法升级');
    }
  },

  handleResetGame: function() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
      if (confirm('再次确认：重置后无法恢复，确定继续吗？')) {
        Game.resetGame();
        UI.switchView('dashboard');
      }
    }
  },

  renderShip: function() {
    var s = Game.state;
    var container = document.getElementById('view-ship');
    if (!container) return;

    var colorsHtml = '';
    for (var i = 0; i < GameData.shipColors.length; i++) {
      var sc = GameData.shipColors[i];
      var isCurrent = s.ship.color === sc.color;
      var owned = sc.price === 0 || isCurrent;
      colorsHtml += '<div class="color-option' + (isCurrent ? ' current' : '') + (owned ? ' owned' : '') + '" style="background:' + (sc.color === 'rainbow' ? 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)' : sc.color) + '" onclick="UI.handleChangeColor(\'' + sc.id + '\')" title="' + sc.name + (sc.price > 0 && !owned ? ' (' + sc.price + '💰)' : '') + '">' +
        '<span class="color-check">' + (isCurrent ? '✓' : '') + '</span>' +
        '<span class="color-name">' + sc.name + '</span>' +
      '</div>';
    }

    var equipDetailHtml = '';
    var cats = ['laser', 'shield', 'cargo', 'engine'];
    var catNames = { laser: '采矿激光', shield: '能量护盾', cargo: '货舱容量', engine: '推进引擎' };
    for (var j = 0; j < cats.length; j++) {
      var cat = cats[j];
      var eq = GameData.equipment[cat][s.equipment[cat]];
      var statKey = cat === 'laser' ? 'damage' : cat === 'shield' ? 'defense' : cat === 'cargo' ? 'capacity' : 'evasion';
      equipDetailHtml += '<div class="equip-detail"><div class="equip-detail-name">' + catNames[cat] + '</div><div class="equip-detail-item">' + eq.name + '</div><div class="equip-detail-stat">' + eq.desc + ' (' + eq[statKey] + ')</div></div>';
    }

    container.innerHTML = '<div class="ship-layout">' +
      '<div class="ship-header"><h2>🚀 飞船改装</h2></div>' +
      '<div class="ship-customize">' +
        '<div class="ship-preview">' +
          '<div class="ship-large-icon" style="color:' + s.ship.color + (s.ship.color === 'rainbow' ? ';animation:rainbow 3s linear infinite' : '') + '">▲</div>' +
          '<div class="ship-name-display">' + s.ship.name + '</div>' +
        '</div>' +
        '<div class="ship-name-edit">' +
          '<label>飞船名称</label>' +
          '<input type="text" id="ship-name-input" value="' + s.ship.name + '" maxlength="12" />' +
          '<button class="btn btn-sm" onclick="UI.handleShipNameChange()">确认</button>' +
        '</div>' +
      '</div>' +
      '<div class="ship-colors"><h3>🎨 涂装</h3><div class="color-grid">' + colorsHtml + '</div></div>' +
      '<div class="ship-equipment"><h3>🔧 装备详情</h3><div class="equip-details-grid">' + equipDetailHtml + '</div></div>' +
    '</div>';
  },

  handleShipNameChange: function() {
    var input = document.getElementById('ship-name-input');
    if (input && Game.changeShipName(input.value)) {
      UI.renderShip();
    }
  },

  handleChangeColor: function(colorId) {
    if (Game.changeShipColor(colorId)) {
      UI.renderShip();
      UI.updateStatusBar();
    } else {
      UI.showNotification('warning', '⚠️ 金币不足');
    }
  },

  renderAchievements: function() {
    var s = Game.state;
    var container = document.getElementById('view-achievements');
    if (!container) return;

    var completedCount = s.achievements.length;
    var totalCount = GameData.achievements.length;

    var achHtml = '';
    for (var i = 0; i < GameData.achievements.length; i++) {
      var ach = GameData.achievements[i];
      var completed = s.achievements.indexOf(ach.id) !== -1;
      achHtml += '<div class="achievement-card' + (completed ? ' completed' : '') + '">' +
        '<div class="achievement-icon">' + ach.icon + '</div>' +
        '<div class="achievement-info">' +
          '<div class="achievement-name">' + ach.name + '</div>' +
          '<div class="achievement-desc">' + ach.desc + '</div>' +
        '</div>' +
        '<div class="achievement-reward">' + (completed ? '✅ 已完成' : ach.reward + ' 💰') + '</div>' +
      '</div>';
    }

    container.innerHTML = '<div class="achievements-layout">' +
      '<div class="achievements-header"><h2>🏆 成就</h2><div class="achievements-progress">' + completedCount + '/' + totalCount + '</div></div>' +
      '<div class="achievements-progress-bar"><div class="progress-fill" style="width:' + (completedCount / totalCount * 100) + '%"></div></div>' +
      '<div class="achievements-grid">' + achHtml + '</div>' +
    '</div>';
  },

  getOreById: function(oreId) {
    for (var i = 0; i < GameData.ores.length; i++) {
      if (GameData.ores[i].id === oreId) return GameData.ores[i];
    }
    return null;
  },

  showNotification: function(type, message) {
    var container = document.getElementById('notification-container');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'notification notif-' + type;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(function() {
      el.classList.add('fade-out');
      setTimeout(function() { el.remove(); }, 300);
    }, 2500);
  },

  startStarfield: function() {
    var canvas = document.getElementById('starfield');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var numStars = 150;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var j = 0; j < stars.length; j++) {
        var star = stars[j];
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + star.opacity + ')';
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
};

window.addEventListener('DOMContentLoaded', function() {
  Game.init();
  UI.init();
});

class TowerPanel {
  constructor(app) {
    this.app = app;
    this.deployPanel = document.getElementById('deployPanel');
    this.upgradePanel = document.getElementById('upgradePanel');
    this.selectedNode = null;
    this.selectedTower = null;
    this.init();
  }

  init() {
    this.createTowerCards();
    this.bindEvents();
  }

  createTowerCards() {
    var container = document.getElementById('towerCards');
    if (!container) return;
    container.innerHTML = '';

    var types = ['electromagnetic', 'laser', 'flame', 'freeze'];
    var self = this;

    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var cfg = TOWER_TYPES[type];
      var card = document.createElement('div');
      card.className = 'tower-card';
      card.setAttribute('data-type', type);
      card.innerHTML =
        '<div class="tower-card-icon" style="border-color:' + cfg.color + ';box-shadow:0 0 8px ' + cfg.color + '40">' +
        '<span style="color:' + cfg.color + '">' + cfg.name.charAt(0) + '</span>' +
        '</div>' +
        '<div class="tower-card-info">' +
        '<div class="tower-card-name">' + cfg.name + '</div>' +
        '<div class="tower-card-cost">' + cfg.cost + ' 样本</div>' +
        '</div>';

      card.addEventListener('click', (function (t) {
        return function () {
          self.onTowerSelect(t);
        };
      })(type));

      container.appendChild(card);
    }
  }

  bindEvents() {
    var self = this;

    var closeDeploy = document.getElementById('closeDeployPanel');
    if (closeDeploy) {
      closeDeploy.addEventListener('click', function () {
        self.hideDeployPanel();
      });
    }

    var closeUpgrade = document.getElementById('closeUpgradePanel');
    if (closeUpgrade) {
      closeUpgrade.addEventListener('click', function () {
        self.hideUpgradePanel();
      });
    }

    var upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', function () {
        self.onUpgrade();
      });
    }

    var sellBtn = document.getElementById('sellBtn');
    if (sellBtn) {
      sellBtn.addEventListener('click', function () {
        self.onSell();
      });
    }
  }

  showDeployPanel(node) {
    this.selectedNode = node;
    this.selectedTower = null;
    if (this.upgradePanel) {
      this.upgradePanel.classList.remove('visible');
    }
    if (this.deployPanel) {
      this.populateDeployPanel();
      this.deployPanel.classList.add('visible');
      this.updateTowerCardStates();
    }
  }

  populateDeployPanel() {
    var list = document.getElementById('deployTowerList');
    if (!list) return;
    list.innerHTML = '';

    var types = ['electromagnetic', 'laser', 'flame', 'freeze'];
    var self = this;

    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      var cfg = TOWER_TYPES[type];
      var canAfford = this.app.samples >= cfg.cost;
      var option = document.createElement('div');
      option.className = 'panel-tower-option' + (canAfford ? '' : ' disabled');
      option.innerHTML =
        '<div class="tower-card-icon" style="border-color:' + cfg.color + ';box-shadow:0 0 8px ' + cfg.color + '40;width:30px;height:30px;font-size:13px">' +
        '<span style="color:' + cfg.color + '">' + cfg.name.charAt(0) + '</span>' +
        '</div>' +
        '<div>' +
        '<div style="font-size:13px;font-weight:600;color:' + cfg.color + '">' + cfg.name + '</div>' +
        '<div style="font-size:11px;color:#39ff14">' + cfg.cost + ' 样本</div>' +
        '</div>';

      if (canAfford) {
        option.addEventListener('click', (function (t) {
          return function () {
            self.onTowerSelect(t);
          };
        })(type));
      }

      list.appendChild(option);
    }
  }

  hideDeployPanel() {
    this.selectedNode = null;
    if (this.deployPanel) {
      this.deployPanel.classList.remove('visible');
    }
    if (this.app && this.app.renderer) {
      this.app.renderer.selectedNode = null;
    }
  }

  showUpgradePanel(tower) {
    this.selectedTower = tower;
    this.selectedNode = null;
    if (this.deployPanel) {
      this.deployPanel.classList.remove('visible');
    }

    if (this.upgradePanel) {
      var stats = this.app.upgradeSystem.getTowerStats(tower);
      document.getElementById('upgradeTowerName').textContent = TOWER_TYPES[tower.type].name;
      document.getElementById('upgradeTowerLevel').textContent = 'Lv.' + stats.level;
      document.getElementById('upgradeTowerDamage').textContent = stats.damage;
      document.getElementById('upgradeTowerRange').textContent = stats.range;
      document.getElementById('upgradeTowerSpeed').textContent = stats.attackSpeed;

      var upgradeCostEl = document.getElementById('upgradeCostValue');
      var upgradeBtn = document.getElementById('upgradeBtn');

      if (stats.upgradeCost < 0) {
        upgradeCostEl.textContent = 'MAX';
        upgradeBtn.disabled = true;
        upgradeBtn.classList.add('disabled');
      } else {
        upgradeCostEl.textContent = stats.upgradeCost;
        upgradeBtn.disabled = stats.upgradeCost > this.app.samples;
        if (stats.upgradeCost > this.app.samples) {
          upgradeBtn.classList.add('disabled');
        } else {
          upgradeBtn.classList.remove('disabled');
        }
      }

      document.getElementById('sellValue').textContent = stats.sellValue;
      this.upgradePanel.classList.add('visible');
    }
  }

  hideUpgradePanel() {
    this.selectedTower = null;
    if (this.upgradePanel) {
      this.upgradePanel.classList.remove('visible');
    }
    if (this.app && this.app.renderer) {
      this.app.renderer.hoveredTower = null;
    }
  }

  updateTowerCardStates() {
    var cards = document.querySelectorAll('.tower-card');
    for (var i = 0; i < cards.length; i++) {
      var type = cards[i].getAttribute('data-type');
      var cost = TOWER_TYPES[type].cost;
      if (this.app && cost > this.app.samples) {
        cards[i].classList.add('disabled');
      } else {
        cards[i].classList.remove('disabled');
      }
    }
  }

  onTowerSelect(type) {
    if (!this.selectedNode) return;
    var cost = TOWER_TYPES[type].cost;
    if (this.app.samples < cost) return;

    this.app.samples -= cost;
    var tower = new Tower(type, this.selectedNode.x, this.selectedNode.y);
    this.app.towers.push(tower);
    this.app.levelMap.deployNodes = this.app.levelMap.deployNodes.map(function (n) {
      if (n.x === tower.gx && n.y === tower.gy) {
        return { x: n.x, y: n.y, tower: tower };
      }
      return n;
    });
    this.hideDeployPanel();
    if (this.app.onTowerChange) this.app.onTowerChange();
  }

  onUpgrade() {
    if (!this.selectedTower) return;
    var cost = this.app.upgradeSystem.getUpgradeCost(this.selectedTower);
    if (cost < 0 || this.app.samples < cost) return;

    this.app.samples -= cost;
    this.app.upgradeSystem.upgradeTower(this.selectedTower);
    this.showUpgradePanel(this.selectedTower);
    if (this.app.onTowerChange) this.app.onTowerChange();
  }

  onSell() {
    if (!this.selectedTower) return;

    var value = this.app.upgradeSystem.sellTower(this.selectedTower);
    this.app.samples += value;

    var tx = this.selectedTower.gx;
    var ty = this.selectedTower.gy;
    var idx = -1;
    for (var i = 0; i < this.app.towers.length; i++) {
      if (this.app.towers[i].gx === tx && this.app.towers[i].gy === ty) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      this.app.towers.splice(idx, 1);
    }

    this.app.levelMap.deployNodes = this.app.levelMap.deployNodes.map(function (n) {
      if (n.x === tx && n.y === ty) {
        return { x: n.x, y: n.y };
      }
      return n;
    });

    this.hideUpgradePanel();
    if (this.app.onTowerChange) this.app.onTowerChange();
  }
}

// ui.js - UI/HUD 模块

const UI = {
  menu: null,
  gameContainer: null,
  hud: null,
  hpBar: null,
  hpText: null,
  timeText: null,
  stageText: null,
  skillIcon: null,
  skillCooldownBar: null,
  dashCooldownBar: null,
  charIcon: null,
  charName: null,
  skillName: null,
  gameOver: null,
  pauseOverlay: null,
  stageBanner: null,
  canvasContainer: null,
  continueBtn: null,
  menuBtnGroup: null,

  init() {
    this.menu = document.getElementById('menu');
    this.gameContainer = document.getElementById('gameContainer');
    this.hud = document.getElementById('hud');
    this.hpBar = document.getElementById('hpBar');
    this.hpText = document.getElementById('hpText');
    this.timeText = document.getElementById('timeText');
    this.stageText = document.getElementById('stageText');
    this.skillCooldownBar = document.getElementById('skillCooldownBar');
    this.dashCooldownBar = document.getElementById('dashCooldownBar');
    this.charIcon = document.getElementById('charIcon');
    this.charName = document.getElementById('charName');
    this.skillName = document.getElementById('skillName');
    this.gameOver = document.getElementById('gameOver');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.stageBanner = document.getElementById('stageBanner');
    this.canvasContainer = document.getElementById('canvasContainer');
    this.continueBtn = document.getElementById('continueBtn');
    this.menuBtnGroup = document.getElementById('menuBtnGroup');

    this.buildMenu();
  },

  buildMenu() {
    const data = GameState.data;

    if (this.continueBtn) {
      if (Storage.hasGame()) {
        this.continueBtn.style.display = 'inline-block';
        const save = Storage.loadGame();
        if (save) {
          const min = Math.floor(save.elapsedTime / 60000);
          const sec = Math.floor((save.elapsedTime % 60000) / 1000);
          const stageName = CONFIG.STAGES[Math.min(save.stageIdx, CONFIG.STAGES.length - 1)].name;
          this.continueBtn.textContent = `继 续 游 戏 (${min}:${sec.toString().padStart(2, '0')} / ${stageName})`;
        }
      } else {
        this.continueBtn.style.display = 'none';
      }
    }

    const bestTime = document.getElementById('bestTime');
    const bestStage = document.getElementById('bestStage');
    const totalRuns = document.getElementById('totalRuns');

    if (bestTime) {
      bestTime.textContent = this.formatTime(data.bestTime);
    }
    if (bestStage) {
      bestStage.textContent = data.bestStage >= CONFIG.STAGES.length
        ? '终极狂暴' : CONFIG.STAGES[data.bestStage].name;
    }
    if (totalRuns) {
      totalRuns.textContent = data.totalRuns;
    }

    const charList = document.getElementById('charList');
    if (charList) {
      charList.innerHTML = '';
      Object.values(CHARACTERS).forEach(char => {
        const div = document.createElement('div');
        div.className = 'char-card' + (char.id === data.lastChar ? ' selected' : '');
        div.dataset.charId = char.id;
        div.innerHTML = `
          <div class="char-icon" style="color:${char.color};text-shadow:0 0 15px ${char.glowColor}">${char.icon}</div>
          <div class="char-info">
            <div class="char-title">${char.name}</div>
            <div class="char-stats">
              <span>❤ ${char.maxHp}</span>
              <span>⚡ ${char.speed.toFixed(1)}</span>
              <span>💥 ${char.damagePerHit}</span>
            </div>
            <div class="char-skill">
              <span class="skill-label">${char.skillName}</span>
              <span class="skill-cd">CD ${char.skillCooldown / 1000}s</span>
            </div>
            <div class="char-desc">${char.skillDesc}</div>
          </div>
        `;
        div.onclick = () => {
          document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
          div.classList.add('selected');
          data.lastChar = char.id;
          GameState.save();
        };
        charList.appendChild(div);
      });
    }

    const themeList = document.getElementById('themeList');
    if (themeList) {
      themeList.innerHTML = '';
      Object.values(THEMES).forEach(theme => {
        const div = document.createElement('div');
        div.className = 'theme-card' + (theme.id === data.lastTheme ? ' selected' : '');
        div.dataset.themeId = theme.id;
        div.innerHTML = `
          <div class="theme-preview" style="background:${theme.bg}">
            <div class="theme-ball" style="background:radial-gradient(circle, #fff 0%, ${theme.accentColor} 70%, ${theme.bgColor} 100%)"></div>
          </div>
          <div class="theme-name">${theme.icon} ${theme.name}</div>
        `;
        div.onclick = () => {
          document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
          div.classList.add('selected');
          Theme.set(theme.id);
          this.applyTheme();
        };
        themeList.appendChild(div);
      });
    }

    this.applyTheme();
  },

  applyTheme() {
    const t = Theme.get();
    document.documentElement.style.setProperty('--theme-bg', t.bgColor);
    document.documentElement.style.setProperty('--theme-text', t.textColor);
    document.documentElement.style.setProperty('--theme-accent', t.accentColor);
    document.documentElement.style.setProperty('--theme-glow', t.glowColor || 'rgba(255,255,255,0.1)');
    document.documentElement.style.setProperty('--theme-particle', t.particleColor);
  },

  showGame() {
    this.menu.style.display = 'none';
    this.gameContainer.style.display = 'block';
    this.gameOver.style.display = 'none';
    this.pauseOverlay.style.display = 'none';

    const char = CHARACTERS[Game.player.charId];
    this.charIcon.textContent = char.icon;
    this.charIcon.style.color = char.color;
    this.charIcon.style.textShadow = `0 0 15px ${char.glowColor}`;
    this.charName.textContent = char.name;
    this.skillName.textContent = char.skillName;
  },

  showMenu() {
    Game.stop();
    this.menu.style.display = 'block';
    this.gameContainer.style.display = 'none';
    this.gameOver.style.display = 'none';
    this.pauseOverlay.style.display = 'none';
    this.buildMenu();
  },

  updateHUD(game) {
    const p = game.player;
    if (!p) return;

    const hpPct = (p.hp / p.maxHp) * 100;
    this.hpBar.style.width = hpPct + '%';
    this.hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;

    const totalSec = Math.floor(game.elapsedTime / 1000);
    const remainSec = Math.max(0, Math.floor((CONFIG.WIN_SURVIVAL_TIME - game.elapsedTime) / 1000));
    this.timeText.textContent = `存活 ${this.formatTime(game.elapsedTime)} / 通关 ${this.formatTime(CONFIG.WIN_SURVIVAL_TIME)}`;

    this.stageText.textContent = `阶段：${game.stage.name}`;

    const char = CHARACTERS[p.charId];
    if (p.skillCooldown > 0) {
      const cdPct = (p.skillCooldown / char.skillCooldown) * 100;
      this.skillCooldownBar.style.width = cdPct + '%';
      this.skillCooldownBar.classList.add('active');
    } else {
      this.skillCooldownBar.style.width = '0%';
      this.skillCooldownBar.classList.remove('active');
    }

    if (p.dashCooldown > 0) {
      const cdPct = (p.dashCooldown / CONFIG.DASH_COOLDOWN) * 100;
      this.dashCooldownBar.style.width = cdPct + '%';
      this.dashCooldownBar.classList.add('active');
    } else {
      this.dashCooldownBar.style.width = '0%';
      this.dashCooldownBar.classList.remove('active');
    }
  },

  showStageBanner(name) {
    this.stageBanner.textContent = `⚡ ${name} ⚡`;
    this.stageBanner.classList.add('show');
    setTimeout(() => {
      this.stageBanner.classList.remove('show');
    }, 2500);
  },

  updatePause(paused) {
    this.pauseOverlay.style.display = paused ? 'flex' : 'none';
  },

  showGameOver(won, data) {
    const title = this.gameOver.querySelector('.go-title');
    const stats = this.gameOver.querySelector('.go-stats');
    const winText = this.gameOver.querySelector('.go-win');

    title.textContent = won ? '🏆 通关胜利！' : '💀 游戏结束';
    title.className = 'go-title' + (won ? ' win' : ' lose');

    const char = CHARACTERS[data.charId];
    stats.innerHTML = `
      <div>存活时长：<span class="val">${this.formatTime(data.time * 1000)}</span></div>
      <div>到达阶段：<span class="val">${data.stage}</span></div>
      <div>操控角色：<span class="val" style="color:${char.color}">${char.icon} ${char.name}</span></div>
    `;

    winText.textContent = won
      ? '你在地狱中生存了下来，真是个狠角色！'
      : '再接再厉，下一次撑得更久！';

    this.gameOver.style.display = 'flex';
  },

  shake() {
    this.canvasContainer.classList.add('shake');
    setTimeout(() => {
      this.canvasContainer.classList.remove('shake');
    }, 300);
  },

  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  restart() {
    Game.start(GameState.data.lastChar);
  },

  backToMenu() {
    this.showMenu();
  },
};
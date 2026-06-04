const ThemeController = {
  currentTheme: CONSTANTS.THEMES.SCI_FI,

  themeContent: {
    [CONSTANTS.THEMES.SCI_FI]: {
      mapTitle: '🌌 银河贸易网',
      mapSubtitle: '点击星系前往航行，点击当前星系进入交易',
      upgradeTitle: '🚀 飞船升级',
      upgradeSubtitle: '提升你的飞船性能，在银河贸易中占据优势',
      investmentTitle: '💼 星球投资',
      investmentSubtitle: '投资星球开发项目，获取长期稳定收益',
      leaderboardTitle: '🏆 银河富豪榜',
      leaderboardSubtitle: '与其他星际贸易商竞争，争夺市场份额',
      settingsTitle: '⚙️ 系统设置',
      settingsSubtitle: '自定义你的星际贸易体验',
      cargoTitle: '📦 货舱',
      cargoEmpty: '货舱空空如也',
      shipName: '星舰',
      icons: {
        trade: '💰',
        upgrade: '⚙️',
        investment: '📈',
        leaderboard: '🏆',
        cargo: '📦'
      }
    },
    [CONSTANTS.THEMES.WASTELAND]: {
      mapTitle: '☢️ 废土航线图',
      mapSubtitle: '点击据点前往跋涉，点击当前据点进入黑市交易',
      upgradeTitle: '🔧 战车改装',
      upgradeSubtitle: '强化你的战车，在废土中生存下去',
      investmentTitle: '📊 据点投资',
      investmentSubtitle: '投资据点发展，在乱世中谋取利益',
      leaderboardTitle: '👑 废土霸主榜',
      leaderboardSubtitle: '与其他废土商人竞争，争夺资源控制权',
      settingsTitle: '⚙️ 生存设置',
      settingsSubtitle: '调整你的废土生存体验',
      cargoTitle: '🎒 背包',
      cargoEmpty: '背包空空如也',
      shipName: '战车',
      icons: {
        trade: '💵',
        upgrade: '🔧',
        investment: '📊',
        leaderboard: '👑',
        cargo: '🎒'
      }
    }
  },

  init(initialTheme = null) {
    const savedSettings = StorageService.loadSettings();
    const theme = initialTheme || savedSettings?.theme || CONSTANTS.THEMES.SCI_FI;
    this.setTheme(theme);
  },

  setTheme(theme) {
    if (!Object.values(CONSTANTS.THEMES).includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }

    if (theme === this.currentTheme) return;

    document.body.classList.add('theme-transitioning');

    setTimeout(() => {
      document.body.classList.remove('theme-sci-fi', 'theme-wasteland');
      document.body.classList.add(`theme-${theme}`);
      
      const deco = document.getElementById('themeDecoration');
      if (deco) {
        deco.classList.remove('theme-decoration-sci-fi', 'theme-decoration-wasteland');
        deco.classList.add(`theme-decoration-${theme}`);
      }

      this.currentTheme = theme;
      this.updateThemeContent();
      this.updateNavIcons();

      StorageService.saveSettings({ theme });
      eventBus.emit(CONSTANTS.EVENTS.UI_THEME_CHANGE, { theme });

      setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 100);
    }, 300);
  },

  updateThemeContent() {
    const content = this.themeContent[this.currentTheme];
    
    const mapTitle = document.getElementById('mapTitle');
    const mapSubtitle = document.getElementById('mapSubtitle');
    const upgradeTitle = document.getElementById('upgradeTitle');
    const upgradeSubtitle = document.getElementById('upgradeSubtitle');
    const investmentTitle = document.getElementById('investmentTitle');
    const investmentSubtitle = document.getElementById('investmentSubtitle');
    const leaderboardTitle = document.getElementById('leaderboardTitle');
    const leaderboardSubtitle = document.getElementById('leaderboardSubtitle');
    const settingsTitle = document.getElementById('settingsTitle');
    const settingsSubtitle = document.getElementById('settingsSubtitle');

    if (mapTitle) mapTitle.textContent = content.mapTitle;
    if (mapSubtitle) mapSubtitle.textContent = content.mapSubtitle;
    if (upgradeTitle) upgradeTitle.textContent = content.upgradeTitle;
    if (upgradeSubtitle) upgradeSubtitle.textContent = content.upgradeSubtitle;
    if (investmentTitle) investmentTitle.textContent = content.investmentTitle;
    if (investmentSubtitle) investmentSubtitle.textContent = content.investmentSubtitle;
    if (leaderboardTitle) leaderboardTitle.textContent = content.leaderboardTitle;
    if (leaderboardSubtitle) leaderboardSubtitle.textContent = content.leaderboardSubtitle;
    if (settingsTitle) settingsTitle.textContent = content.settingsTitle;
    if (settingsSubtitle) settingsSubtitle.textContent = content.settingsSubtitle;
  },

  updateNavIcons() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      const iconSpan = btn.querySelector('.icon');
      if (!iconSpan) return;
      
      const iconKey = btn.dataset.view;
      const iconAttr = `data-icon-${this.currentTheme}`;
      const icon = btn.getAttribute(iconAttr);
      if (icon) {
        iconSpan.textContent = icon;
      }
    });
  },

  getContent(key) {
    return this.themeContent[this.currentTheme][key];
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === CONSTANTS.THEMES.SCI_FI
      ? CONSTANTS.THEMES.WASTELAND
      : CONSTANTS.THEMES.SCI_FI;
    this.setTheme(nextTheme);
  },

  getCurrentTheme() {
    return this.currentTheme;
  },

  getThemeName(theme) {
    const names = {
      [CONSTANTS.THEMES.SCI_FI]: '深空科幻',
      [CONSTANTS.THEMES.WASTELAND]: '末日废土'
    };
    return names[theme] || theme;
  }
};

window.LobbyPage = {
  template: `
    <div class="page lobby-page">
      <div class="top-bar">
        <div class="player-info">
          <span class="player-name">{{ GameStore.get('playerName') }}</span>
          <span class="player-level">Lv.{{ GameStore.get('level') }}</span>
        </div>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
          <span class="gems">💎 {{ GameStore.get('gems') }}</span>
        </div>
      </div>

      <div class="lobby-center">
        <div class="hamster-logo">
          <span class="hamster-emoji">🐹</span>
          <span class="snowflake-emoji">❄️</span>
        </div>
        <h1 class="game-title">小仓鼠推雪球</h1>
      </div>

      <div class="action-grid">
        <button class="action-btn action-btn-primary" @click="startGame">
          <span class="action-icon">⚔️</span>
          <span class="action-text">开始对战</span>
        </button>
        <button class="action-btn" @click="navigateTo('maps')">
          <span class="action-icon">🗺️</span>
          <span class="action-text">地图选择</span>
        </button>
        <button class="action-btn" @click="navigateTo('props')">
          <span class="action-icon">🎒</span>
          <span class="action-text">道具背包</span>
        </button>
        <button class="action-btn" @click="navigateTo('dress')">
          <span class="action-icon">👗</span>
          <span class="action-text">装扮中心</span>
        </button>
      </div>

      <div class="difficulty-section">
        <div class="difficulty-label">难度选择</div>
        <div class="difficulty-options">
          <button
            v-for="d in difficulties"
            :key="d.key"
            class="difficulty-btn"
            :class="{ active: difficulty === d.key }"
            :style="difficulty === d.key ? { borderColor: d.color, backgroundColor: d.color + '22', color: d.color } : {}"
            @click="difficulty = d.key"
          >
            <span class="diff-icon">{{ d.icon }}</span>
            <span class="diff-name">{{ d.name }}</span>
          </button>
        </div>
      </div>

      <div class="bottom-nav">
        <div class="nav-item active" @click="navigateTo('lobby')">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">大厅</span>
        </div>
        <div class="nav-item" @click="navigateTo('shop')">
          <span class="nav-icon">🛒</span>
          <span class="nav-label">商店</span>
        </div>
        <div class="nav-item" @click="navigateTo('dress')">
          <span class="nav-icon">👗</span>
          <span class="nav-label">装扮</span>
        </div>
        <div class="nav-item" @click="navigateTo('activity')">
          <span class="nav-icon">🎉</span>
          <span class="nav-label">活动</span>
        </div>
        <div class="nav-item" @click="navigateTo('profile')">
          <span class="nav-icon">👤</span>
          <span class="nav-label">我的</span>
        </div>
      </div>

      <div class="daily-reward-overlay" v-if="showDailyReward" @click.self="showDailyReward = false">
        <div class="daily-reward-popup">
          <div class="reward-title">🎁 每日奖励</div>
          <div class="reward-desc">每天登录领取丰厚奖励！</div>
          <div class="reward-result" v-if="rewardResult">
            <div>获得 🪙 {{ rewardResult.coins }} 金币</div>
            <div>获得 {{ propIcon(rewardResult.prop) }} {{ propName(rewardResult.prop) }} ×1</div>
          </div>
          <button
            class="reward-btn"
            v-if="!rewardResult"
            @click="claimReward"
          >领取每日奖励</button>
          <button
            class="reward-btn"
            v-else
            @click="showDailyReward = false"
          >确定</button>
        </div>
      </div>
    </div>
  `,

  data: function () {
    return {
      difficulty: GameStore.get('settings').difficulty || 'normal',
      showDailyReward: GameStore.get('dailyRewardClaimed') !== new Date().toISOString().slice(0, 10),
      rewardResult: null,
      GameStore: GameStore
    };
  },

  computed: {
    difficulties: function () {
      return [
        { key: 'easy', name: '简单', icon: '🟢', color: '#4CAF50' },
        { key: 'normal', name: '普通', icon: '🟡', color: '#FF9800' },
        { key: 'hard', name: '困难', icon: '🔴', color: '#F44336' },
        { key: 'expert', name: '专家', icon: '💜', color: '#9C27B0' }
      ];
    }
  },

  watch: {
    difficulty: function (val) {
      var settings = GameStore.get('settings');
      settings.difficulty = val;
      GameStore.set('settings', settings);
    }
  },

  methods: {
    startGame: function () {
      var settings = GameStore.get('settings');
      settings.difficulty = this.difficulty;
      GameStore.set('settings', settings);
      var currentMap = GameStore.get('unlockedMaps')[0] || 'ice_world';
      GameRouter.navigate('game', { map: currentMap, difficulty: this.difficulty });
    },

    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    claimReward: function () {
      var result = GameStore.claimDailyReward();
      if (result) {
        this.rewardResult = result;
      }
    },

    propName: function (propKey) {
      var def = GameStore.PROP_DEFS[propKey];
      return def ? def.name : propKey;
    },

    propIcon: function (propKey) {
      var def = GameStore.PROP_DEFS[propKey];
      return def ? def.icon : '📦';
    }
  }
};

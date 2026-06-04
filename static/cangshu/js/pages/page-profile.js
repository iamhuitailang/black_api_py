window.ProfilePage = {
  template: `
    <div class="page profile-page">
      <div class="profile-top">
        <div
          class="avatar-area"
          :style="avatarStyle"
        >
          <span class="avatar-emoji">🐹</span>
        </div>
        <div class="player-info-area">
          <div class="player-name-row">
            <span v-if="!editingName" class="player-name" @click="editName">{{ GameStore.get('playerName') }}</span>
            <input
              v-else
              class="name-input"
              v-model="tempName"
              @blur="saveName"
              @keyup.enter="saveName"
              autofocus
            />
            <span v-if="!editingName" class="edit-hint">✏️</span>
          </div>
          <div class="level-badge">Lv.{{ GameStore.get('level') }}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ GameStore.get('stats').totalGames }}</div>
          <div class="stat-label">总场次</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ GameStore.get('stats').wins }}</div>
          <div class="stat-label">胜场</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ getWinRate() }}%</div>
          <div class="stat-label">胜率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ GameStore.get('stats').biggestSnowball }}</div>
          <div class="stat-label">最大雪球</div>
        </div>
        <div class="stat-card stat-card-wide">
          <div class="stat-value">🪙 {{ GameStore.get('stats').totalCoinsEarned }}</div>
          <div class="stat-label">总赚取金币</div>
        </div>
      </div>

      <div class="exp-section">
        <div class="exp-label">经验值 {{ GameStore.get('exp') }} / 100</div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: GameStore.get('exp') + '%' }"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🏆 成就</div>
        <div class="achievement-list" v-if="getAchievements().length > 0">
          <div
            v-for="ach in getAchievements()"
            :key="ach.id"
            class="achievement-item"
          >
            <span class="ach-icon">{{ ach.icon }}</span>
            <span class="ach-name">{{ ach.name }}</span>
          </div>
        </div>
        <div v-else class="empty-hint">暂未解锁任何成就</div>
      </div>

      <div class="section">
        <div class="section-title">⚙️ 设置</div>
        <div class="settings-row">
          <span class="settings-label">难度</span>
          <div class="difficulty-options">
            <button
              v-for="d in difficulties"
              :key="d.key"
              class="difficulty-btn"
              :class="{ active: currentDifficulty === d.key }"
              @click="setDifficulty(d.key)"
            >{{ d.name }}</button>
          </div>
        </div>
        <button class="reset-btn" @click="confirmReset = true">重置数据</button>
        <div v-if="confirmReset" class="confirm-box">
          <span>确定要重置所有数据吗？</span>
          <button class="confirm-yes" @click="resetData">确定</button>
          <button class="confirm-no" @click="confirmReset = false">取消</button>
        </div>
      </div>

      <div class="section" v-if="specialGuests.length > 0">
        <div class="section-title">🌟 遇见的特别嘉宾</div>
        <div class="guest-list">
          <div
            v-for="guest in specialGuests"
            :key="guest.id"
            class="guest-item"
          >
            <span class="guest-icon" :style="{ backgroundColor: guest.color }">🐹</span>
            <span class="guest-name">{{ guest.name }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" @click="navigateTo('lobby')">
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
        <div class="nav-item active" @click="navigateTo('profile')">
          <span class="nav-icon">👤</span>
          <span class="nav-label">我的</span>
        </div>
      </div>
    </div>
  `,

  data: function () {
    return {
      editingName: false,
      tempName: '',
      confirmReset: false,
      currentDifficulty: GameStore.get('settings').difficulty || 'normal',
      GameStore: GameStore
    };
  },

  computed: {
    avatarStyle: function () {
      var skinId = GameStore.get('currentSkin');
      var skin = GameStore.SKINS[skinId];
      if (!skin) return { backgroundColor: '#F4A460' };
      if (skin.color === 'rainbow') {
        return { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)' };
      }
      return { backgroundColor: skin.color };
    },

    difficulties: function () {
      return [
        { key: 'easy', name: '简单' },
        { key: 'normal', name: '普通' },
        { key: 'hard', name: '困难' },
        { key: 'expert', name: '专家' }
      ];
    },

    specialGuests: function () {
      var met = GameStore.get('specialGuestMet') || [];
      var guestMap = {
        special_penguin: { name: '企鹅嘉宾', color: '#1C1C1C' },
        special_snowman: { name: '雪人嘉宾', color: '#FFFACD' }
      };
      return met.map(function (id) {
        var info = guestMap[id] || { name: id, color: '#999' };
        return { id: id, name: info.name, color: info.color };
      });
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    editName: function () {
      this.tempName = GameStore.get('playerName');
      this.editingName = true;
    },

    saveName: function () {
      this.editingName = false;
      if (this.tempName.trim()) {
        GameStore.set('playerName', this.tempName.trim());
      }
    },

    getWinRate: function () {
      var stats = GameStore.get('stats');
      if (stats.totalGames === 0) return 0;
      return Math.round(stats.wins / stats.totalGames * 100);
    },

    getAchievements: function () {
      var definitions = [
        { id: 'first_win', icon: '🎉', name: '初尝胜果' },
        { id: 'snowball_50', icon: '⛄', name: '雪球新手' },
        { id: 'snowball_80', icon: '🏔️', name: '雪球大师' },
        { id: 'win_10', icon: '🏅', name: '十战十胜' },
        { id: 'win_50', icon: '👑', name: '常胜将军' },
        { id: 'earn_1000', icon: '💰', name: '小富翁' },
        { id: 'meet_guest', icon: '🌟', name: '贵客临门' },
        { id: 'all_maps', icon: '🗺️', name: '探索者' }
      ];
      var unlocked = GameStore.get('achievements') || [];
      return definitions.filter(function (a) {
        return unlocked.indexOf(a.id) !== -1;
      });
    },

    setDifficulty: function (key) {
      this.currentDifficulty = key;
      var settings = GameStore.get('settings');
      settings.difficulty = key;
      GameStore.set('settings', settings);
    },

    resetData: function () {
      GameStore.resetData();
      this.confirmReset = false;
      this.currentDifficulty = 'normal';
    }
  }
};

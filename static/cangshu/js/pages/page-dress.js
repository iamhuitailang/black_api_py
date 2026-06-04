window.DressPage = {
  template: `
    <div class="page dress-page">
      <div class="top-bar">
        <button class="back-btn" @click="navigateTo('lobby')">←</button>
        <span class="top-title">装扮中心</span>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
          <span class="gems">💎 {{ GameStore.get('gems') }}</span>
        </div>
      </div>

      <div class="dress-preview">
        <div
          class="hamster-preview-circle"
          :style="previewStyle"
        >
          <span class="hamster-emoji">🐹</span>
        </div>
        <div class="preview-info">
          <div class="preview-effect">{{ currentEffectName }}</div>
          <div class="preview-decor">{{ currentDecorName }}</div>
        </div>
      </div>

      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.name }}</button>
      </div>

      <div class="dress-content">
        <div v-if="activeTab === 'skins'" class="item-grid">
          <div
            v-for="item in getCurrentItems()"
            :key="item.id"
            class="item-card"
          >
            <div
              class="skin-color-circle"
              :style="item.style"
            ></div>
            <div class="item-name">{{ item.name }}</div>
            <button
              v-if="!item.equipped"
              class="item-btn equip-btn"
              @click="equipSkin(item.id)"
            >装备</button>
            <span v-else class="equipped-badge">已装备</span>
          </div>
        </div>

        <div v-if="activeTab === 'effects'" class="item-grid">
          <div
            v-for="item in getCurrentItems()"
            :key="item.id"
            class="item-card"
          >
            <div class="effect-icon">{{ item.icon }}</div>
            <div class="item-name">{{ item.name }}</div>
            <button
              v-if="!item.equipped"
              class="item-btn equip-btn"
              @click="equipEffect(item.id)"
            >装备</button>
            <span v-else class="equipped-badge">已装备</span>
          </div>
        </div>

        <div v-if="activeTab === 'decors'" class="item-grid">
          <div
            v-for="item in getCurrentItems()"
            :key="item.id"
            class="item-card"
          >
            <div class="decor-icon">🎨</div>
            <div class="item-name">{{ item.name }}</div>
            <button
              v-if="!item.equipped"
              class="item-btn equip-btn"
              @click="equipDecor(item.id)"
            >装备</button>
            <span v-else class="equipped-badge">已装备</span>
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
        <div class="nav-item active" @click="navigateTo('dress')">
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
    </div>
  `,

  data: function () {
    return {
      activeTab: 'skins',
      GameStore: GameStore
    };
  },

  computed: {
    tabs: function () {
      return [
        { key: 'skins', name: '皮肤' },
        { key: 'effects', name: '雪球特效' },
        { key: 'decors', name: '装饰' }
      ];
    },

    previewStyle: function () {
      var skinId = GameStore.get('currentSkin');
      var skin = GameStore.SKINS[skinId];
      if (!skin) return {};
      if (skin.color === 'rainbow') {
        return { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)' };
      }
      return { backgroundColor: skin.color };
    },

    currentEffectName: function () {
      var effectId = GameStore.get('currentSnowballEffect');
      var effect = GameStore.SNOWBALL_EFFECTS[effectId];
      return effect ? effect.name : '普通雪球';
    },

    currentDecorName: function () {
      var decorId = GameStore.get('currentMapDecor');
      var decor = GameStore.MAP_DECORS[decorId];
      return decor ? decor.name : '默认装饰';
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    equipSkin: function (id) {
      GameStore.set('currentSkin', id);
    },

    equipEffect: function (id) {
      GameStore.set('currentSnowballEffect', id);
    },

    equipDecor: function (id) {
      GameStore.set('currentMapDecor', id);
    },

    getCurrentItems: function () {
      var self = this;
      if (this.activeTab === 'skins') {
        var unlocked = GameStore.get('unlockedSkins');
        var currentSkin = GameStore.get('currentSkin');
        return unlocked.map(function (skinId) {
          var skin = GameStore.SKINS[skinId];
          if (!skin) return null;
          var style = {};
          if (skin.color === 'rainbow') {
            style = { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)' };
          } else {
            style = { backgroundColor: skin.color };
          }
          return {
            id: skinId,
            name: skin.name,
            equipped: currentSkin === skinId,
            style: style
          };
        }).filter(Boolean);
      }

      if (this.activeTab === 'effects') {
        var unlockedEffects = GameStore.get('unlockedSnowballEffects');
        var currentEffect = GameStore.get('currentSnowballEffect');
        var effectIcons = {
          default: '⚪',
          sparkle: '✨',
          flame: '🔥',
          ice: '💎',
          rainbow: '🌈'
        };
        return unlockedEffects.map(function (effectId) {
          var effect = GameStore.SNOWBALL_EFFECTS[effectId];
          if (!effect) return null;
          return {
            id: effectId,
            name: effect.name,
            equipped: currentEffect === effectId,
            icon: effectIcons[effectId] || '❄️'
          };
        }).filter(Boolean);
      }

      if (this.activeTab === 'decors') {
        var unlockedDecors = GameStore.get('unlockedMapDecors');
        var currentDecor = GameStore.get('currentMapDecor');
        return unlockedDecors.map(function (decorId) {
          var decor = GameStore.MAP_DECORS[decorId];
          if (!decor) return null;
          return {
            id: decorId,
            name: decor.name,
            equipped: currentDecor === decorId
          };
        }).filter(Boolean);
      }

      return [];
    }
  }
};

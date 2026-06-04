window.ShopPage = {
  template: `
    <div class="page shop-page">
      <div class="top-bar">
        <button class="back-btn" @click="navigateTo('lobby')">←</button>
        <span class="top-title">商店</span>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
          <span class="gems">💎 {{ GameStore.get('gems') }}</span>
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

      <div class="shop-content">
        <div v-if="activeTab === 'skins'" class="item-grid">
          <div
            v-for="(skin, skinId) in GameStore.SKINS"
            :key="skinId"
            class="item-card"
          >
            <div
              class="skin-preview"
              :style="{ backgroundColor: skin.color === 'rainbow' ? '' : skin.color, background: skin.color === 'rainbow' ? 'linear-gradient(135deg, red, orange, yellow, green, blue, purple)' : undefined }"
            ></div>
            <div class="item-name">{{ skin.name }}</div>
            <div class="item-price">
              <span v-if="skin.price > 0">
                <span v-if="skin.type === 'coin'">🪙 {{ skin.price }}</span>
                <span v-else-if="skin.type === 'gem'">💎 {{ skin.price }}</span>
                <span v-else>🔒 特殊</span>
              </span>
              <span v-else>免费</span>
            </div>
            <button
              class="item-btn"
              :class="itemBtnClass(skinId, 'skin')"
              :disabled="isEquipped(skinId, 'skin')"
              @click="handleItemAction(skinId, 'skin', skin)"
            >{{ itemBtnText(skinId, 'skin', skin) }}</button>
          </div>
        </div>

        <div v-if="activeTab === 'effects'" class="item-grid">
          <div
            v-for="(effect, effectId) in GameStore.SNOWBALL_EFFECTS"
            :key="effectId"
            class="item-card"
          >
            <div class="effect-icon">❄️</div>
            <div class="item-name">{{ effect.name }}</div>
            <div class="item-price">
              <span v-if="effect.price > 0">
                <span v-if="effect.type === 'coin'">🪙 {{ effect.price }}</span>
                <span v-else>💎 {{ effect.price }}</span>
              </span>
              <span v-else>免费</span>
            </div>
            <button
              class="item-btn"
              :class="itemBtnClass(effectId, 'effect')"
              :disabled="isEquipped(effectId, 'effect')"
              @click="handleItemAction(effectId, 'effect', effect)"
            >{{ itemBtnText(effectId, 'effect', effect) }}</button>
          </div>
        </div>

        <div v-if="activeTab === 'props'" class="item-list">
          <div
            v-for="(prop, propId) in GameStore.PROP_DEFS"
            :key="propId"
            class="prop-item"
          >
            <div class="prop-icon">{{ prop.icon }}</div>
            <div class="prop-info">
              <div class="prop-name">{{ prop.name }}</div>
              <div class="prop-desc">{{ prop.desc }}</div>
            </div>
            <div class="prop-count">×{{ getPropCount(propId) }}</div>
            <div class="prop-price">
              <span v-if="prop.type === 'coin'">🪙 {{ prop.price }}</span>
              <span v-else>💎 {{ prop.price }}</span>
            </div>
            <button
              class="item-btn buy-btn"
              :class="{ disabled: !canAfford(prop) }"
              :disabled="!canAfford(prop)"
              @click="buyProp(propId, prop)"
            >购买</button>
          </div>
        </div>

        <div v-if="activeTab === 'decors'" class="item-grid">
          <div
            v-for="(decor, decorId) in GameStore.MAP_DECORS"
            :key="decorId"
            class="item-card"
          >
            <div class="decor-icon">🎨</div>
            <div class="item-name">{{ decor.name }}</div>
            <div class="item-price">
              <span v-if="decor.price > 0">
                <span v-if="decor.type === 'coin'">🪙 {{ decor.price }}</span>
                <span v-else>💎 {{ decor.price }}</span>
              </span>
              <span v-else>免费</span>
            </div>
            <button
              class="item-btn"
              :class="itemBtnClass(decorId, 'decor')"
              :disabled="isEquipped(decorId, 'decor')"
              @click="handleItemAction(decorId, 'decor', decor)"
            >{{ itemBtnText(decorId, 'decor', decor) }}</button>
          </div>
        </div>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" @click="navigateTo('lobby')">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">大厅</span>
        </div>
        <div class="nav-item active" @click="navigateTo('shop')">
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
        { key: 'props', name: '道具' },
        { key: 'decors', name: '装饰' }
      ];
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    isOwned: function (itemId, type) {
      if (type === 'skin') return GameStore.get('unlockedSkins').indexOf(itemId) !== -1;
      if (type === 'effect') return GameStore.get('unlockedSnowballEffects').indexOf(itemId) !== -1;
      if (type === 'decor') return GameStore.get('unlockedMapDecors').indexOf(itemId) !== -1;
      return false;
    },

    isEquipped: function (itemId, type) {
      if (type === 'skin') return GameStore.get('currentSkin') === itemId;
      if (type === 'effect') return GameStore.get('currentSnowballEffect') === itemId;
      if (type === 'decor') return GameStore.get('currentMapDecor') === itemId;
      return false;
    },

    canAfford: function (item) {
      if (item.type === 'coin') return GameStore.get('coins') >= item.price;
      if (item.type === 'gem') return GameStore.get('gems') >= item.price;
      return false;
    },

    buyItem: function (item, type) {
      var success = false;
      if (item.type === 'coin') {
        success = GameStore.spendCoins(item.price);
      } else if (item.type === 'gem') {
        success = GameStore.spendGems(item.price);
      }
      if (!success) return false;

      if (type === 'skin') GameStore.unlockSkin(item);
      if (type === 'effect') GameStore.unlockSnowballEffect(item);
      if (type === 'decor') GameStore.unlockMapDecor(item);
      return true;
    },

    equipItem: function (itemId, type) {
      if (type === 'skin') GameStore.set('currentSkin', itemId);
      if (type === 'effect') GameStore.set('currentSnowballEffect', itemId);
      if (type === 'decor') GameStore.set('currentMapDecor', itemId);
    },

    buyProp: function (propId, prop) {
      if (!this.canAfford(prop)) return;
      var success = false;
      if (prop.type === 'coin') {
        success = GameStore.spendCoins(prop.price);
      } else {
        success = GameStore.spendGems(prop.price);
      }
      if (success) {
        GameStore.addProp(propId, 1);
      }
    },

    getPropCount: function (propId) {
      var props = GameStore.get('props');
      return props[propId] || 0;
    },

    handleItemAction: function (itemId, type, item) {
      if (this.isEquipped(itemId, type)) return;
      if (this.isOwned(itemId, type)) {
        this.equipItem(itemId, type);
      } else if (this.canAfford(item)) {
        this.buyItem(itemId, type);
        this.equipItem(itemId, type);
      }
    },

    itemBtnText: function (itemId, type, item) {
      if (this.isEquipped(itemId, type)) return '已装备';
      if (this.isOwned(itemId, type)) return '装备';
      if (item.type === 'special') return '锁定';
      if (this.canAfford(item)) return '购买';
      return '不足';
    },

    itemBtnClass: function (itemId, type) {
      if (this.isEquipped(itemId, type)) return 'equipped-btn';
      if (this.isOwned(itemId, type)) return 'equip-btn';
      return 'buy-btn';
    }
  }
};

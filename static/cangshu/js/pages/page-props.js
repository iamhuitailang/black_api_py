window.PropsPage = {
  template: `
    <div class="page props-page">
      <div class="top-bar">
        <button class="back-btn" @click="navigateTo('lobby')">←</button>
        <span class="top-title">道具背包</span>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
        </div>
      </div>

      <div class="props-content">
        <div class="section-title">📦 我的道具</div>
        <div class="props-list">
          <div
            v-for="(prop, propId) in GameStore.PROP_DEFS"
            :key="propId"
            class="prop-row"
          >
            <span class="prop-icon">{{ prop.icon }}</span>
            <div class="prop-info">
              <div class="prop-name">{{ prop.name }}</div>
              <div class="prop-desc">{{ prop.desc }}</div>
            </div>
            <div class="prop-count">×{{ getPropCount(propId) }}</div>
            <div class="prop-equipped" v-if="equippedProps[propId] > 0">
              装备 {{ equippedProps[propId] }}
            </div>
            <button
              class="buy-btn"
              :class="{ disabled: GameStore.get('coins') < prop.price }"
              :disabled="GameStore.get('coins') < prop.price"
              @click="buyProp(propId)"
            >🪙 {{ prop.price }}</button>
          </div>
        </div>

        <div class="section-title">🎒 装备道具</div>
        <div class="equip-hint">选择下一局携带的道具（最多5个）</div>
        <div class="equip-list">
          <div
            v-for="(prop, propId) in GameStore.PROP_DEFS"
            :key="propId"
            class="equip-row"
          >
            <span class="prop-icon">{{ prop.icon }}</span>
            <span class="prop-name">{{ prop.name }}</span>
            <span class="equip-stock">库存: {{ getPropCount(propId) }}</span>
            <div class="equip-controls">
              <button
                class="equip-btn minus"
                :disabled="!equippedProps[propId] || equippedProps[propId] <= 0"
                @click="adjustEquip(propId, -1)"
              >−</button>
              <span class="equip-count">{{ equippedProps[propId] || 0 }}</span>
              <button
                class="equip-btn plus"
                :disabled="totalEquipped >= 5 || (equippedProps[propId] || 0) >= getPropCount(propId)"
                @click="adjustEquip(propId, 1)"
              >+</button>
            </div>
          </div>
        </div>

        <div class="shop-link" @click="navigateTo('shop')">
          🛒 去商店购买更多
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
    </div>
  `,

  data: function () {
    var props = GameStore.get('props');
    return {
      equippedProps: {
        freeze: props.freeze || 0,
        speed: props.speed || 0,
        split: props.split || 0,
        obstacle: props.obstacle || 0,
        invisible: props.invisible || 0
      },
      GameStore: GameStore
    };
  },

  computed: {
    totalEquipped: function () {
      var total = 0;
      var keys = Object.keys(this.equippedProps);
      for (var i = 0; i < keys.length; i++) {
        total += this.equippedProps[keys[i]] || 0;
      }
      return total;
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    getPropCount: function (propId) {
      var props = GameStore.get('props');
      return props[propId] || 0;
    },

    buyProp: function (propId) {
      var prop = GameStore.PROP_DEFS[propId];
      if (!prop) return;
      if (prop.type === 'coin') {
        var success = GameStore.spendCoins(prop.price);
        if (success) {
          GameStore.addProp(propId, 1);
        }
      } else {
        var success = GameStore.spendGems(prop.price);
        if (success) {
          GameStore.addProp(propId, 1);
        }
      }
    },

    adjustEquip: function (propId, delta) {
      var current = this.equippedProps[propId] || 0;
      var newVal = current + delta;
      var stock = this.getPropCount(propId);
      if (newVal < 0) return;
      if (newVal > stock) return;
      if (delta > 0 && this.totalEquipped >= 5) return;
      this.equippedProps[propId] = newVal;
    }
  }
};

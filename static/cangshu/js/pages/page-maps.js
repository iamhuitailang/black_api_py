window.MapsPage = {
  template: `
    <div class="page maps-page">
      <div class="top-bar">
        <button class="back-btn" @click="navigateTo('lobby')">←</button>
        <span class="top-title">地图选择</span>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
          <span class="gems">💎 {{ GameStore.get('gems') }}</span>
        </div>
      </div>

      <div class="maps-list">
        <div
          v-for="mapId in GameMaps.MAP_LIST"
          :key="mapId"
          class="map-card"
          :class="{ selected: selectedMap === mapId }"
        >
          <div class="map-header">
            <div class="map-name">{{ GameMaps.MAPS[mapId].name }}</div>
            <div class="map-difficulty">
              <span
                v-for="n in 5"
                :key="n"
              >{{ n <= getDifficultyLevel(mapId) ? '★' : '☆' }}</span>
            </div>
          </div>

          <div class="map-desc">{{ GameMaps.MAPS[mapId].desc }}</div>

          <div
            class="map-preview"
            :style="{ background: 'linear-gradient(135deg, ' + GameMaps.MAPS[mapId].bgColor + ', ' + GameMaps.MAPS[mapId].groundColor + ')' }"
          ></div>

          <div class="map-guest">
            特邀嘉宾: {{ GameMaps.MAPS[mapId].specialGuest.name }} (出现率 {{ Math.round(GameMaps.MAPS[mapId].specialGuest.spawnChance * 100) }}%)
          </div>

          <div class="map-actions">
            <template v-if="isUnlocked(mapId)">
              <button
                class="map-btn select-btn"
                :class="{ active: selectedMap === mapId }"
                @click="selectMap(mapId)"
              >{{ selectedMap === mapId ? '当前选择' : '选择' }}</button>
            </template>
            <template v-else>
              <div class="unlock-price">
                <span v-if="GameMaps.MAPS[mapId].unlockType === 'coin'">🪙 {{ GameMaps.MAPS[mapId].unlockPrice }}</span>
                <span v-else>💎 {{ GameMaps.MAPS[mapId].unlockPrice }}</span>
              </div>
              <button
                class="map-btn unlock-btn"
                :class="{ disabled: !canAffordMap(mapId) }"
                :disabled="!canAffordMap(mapId)"
                @click="unlockMap(mapId)"
              >解锁</button>
            </template>
          </div>
        </div>
      </div>

      <div class="maps-bottom">
        <div class="difficulty-section">
          <div class="difficulty-label">难度选择</div>
          <div class="difficulty-options">
            <button
              v-for="d in difficulties"
              :key="d.key"
              class="difficulty-btn"
              :class="{ active: difficulty === d.key }"
              :style="difficulty === d.key ? { borderColor: d.color, backgroundColor: d.color + '22', color: d.color } : {}"
              @click="setDifficulty(d.key)"
            >
              <span class="diff-icon">{{ d.icon }}</span>
              <span class="diff-name">{{ d.name }}</span>
            </button>
          </div>
        </div>
        <button class="start-game-btn" @click="startGame">
          开始游戏 · {{ currentMapName }} · {{ difficultyName }}
        </button>
      </div>
    </div>
  `,

  data: function () {
    return {
      selectedMap: GameStore.get('unlockedMaps')[0] || 'ice_world',
      difficulty: GameStore.get('settings').difficulty || 'normal',
      GameStore: GameStore,
      GameMaps: GameMaps
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
    },

    currentMapName: function () {
      var map = GameMaps.getMap(this.selectedMap);
      return map ? map.name : '冰雪世界';
    },

    difficultyName: function () {
      var found = this.difficulties.find(function (d) { return d.key === this.difficulty; }.bind(this));
      return found ? found.name : '普通';
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    selectMap: function (id) {
      if (this.isUnlocked(id)) {
        this.selectedMap = id;
      }
    },

    unlockMap: function (id) {
      var map = GameMaps.getMap(id);
      if (!map) return;
      var success = false;
      if (map.unlockType === 'coin') {
        success = GameStore.spendCoins(map.unlockPrice);
      } else if (map.unlockType === 'gem') {
        success = GameStore.spendGems(map.unlockPrice);
      }
      if (success) {
        GameStore.unlockMap(id);
        this.selectedMap = id;
      }
    },

    startGame: function () {
      var settings = GameStore.get('settings');
      settings.difficulty = this.difficulty;
      GameStore.set('settings', settings);
      GameRouter.navigate('game', { map: this.selectedMap, difficulty: this.difficulty });
    },

    setDifficulty: function (key) {
      this.difficulty = key;
      var settings = GameStore.get('settings');
      settings.difficulty = key;
      GameStore.set('settings', settings);
    },

    isUnlocked: function (mapId) {
      return GameStore.get('unlockedMaps').indexOf(mapId) !== -1;
    },

    canAffordMap: function (mapId) {
      var map = GameMaps.getMap(mapId);
      if (!map) return false;
      if (map.unlockType === 'coin') return GameStore.get('coins') >= map.unlockPrice;
      if (map.unlockType === 'gem') return GameStore.get('gems') >= map.unlockPrice;
      return false;
    },

    getDifficultyLevel: function (mapId) {
      var levels = {
        ice_world: 1,
        antarctic: 2,
        snow_peak: 3,
        aurora_field: 4
      };
      return levels[mapId] || 1;
    }
  }
};

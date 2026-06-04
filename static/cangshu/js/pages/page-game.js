window.GamePage = {
  template: `
    <div class="page game-page">
      <div v-if="gameState === 'setup'" class="game-setup">
        <div class="top-bar">
          <button class="back-btn" @click="backToLobby">←</button>
          <span class="top-title">准备出发</span>
          <div class="currency-info">
            <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
          </div>
        </div>

        <div class="setup-content">
          <div class="map-info-card">
            <div
              class="map-preview"
              :style="{ background: 'linear-gradient(135deg, ' + mapData.bgColor + ', ' + mapData.groundColor + ')' }"
            ></div>
            <div class="map-info-text">
              <div class="map-name">{{ mapData.name }}</div>
              <div class="map-desc">{{ mapData.desc }}</div>
              <div class="map-guest">特邀嘉宾: {{ mapData.specialGuest ? mapData.specialGuest.name : '无' }}</div>
            </div>
          </div>

          <div class="equipment-summary">
            <div class="equip-title">装备概览</div>
            <div class="equip-item">
              <span class="equip-label">当前皮肤</span>
              <span class="equip-value">{{ currentSkinName }}</span>
            </div>
            <div class="equip-item">
              <span class="equip-label">雪球特效</span>
              <span class="equip-value">{{ currentEffectName }}</span>
            </div>
            <div class="equip-item">
              <span class="equip-label">道具装备</span>
              <span class="equip-value">{{ propsSummary }}</span>
            </div>
          </div>

          <button class="start-btn" @click="startGame">准备出发!</button>
        </div>
      </div>

      <div v-if="gameState === 'playing'" class="game-playing">
        <div class="canvas-wrapper">
          <canvas ref="gameCanvas" width="800" height="600"></canvas>

          <div class="hud-overlay">
            <div class="hud-top">
              <div class="hud-timer">{{ formatTime(currentTime) }}</div>
              <div class="hud-snowball">雪球: {{ currentSnowballSize }}</div>
              <div class="hud-rank">排名: 第{{ currentRank }}名</div>
              <button class="pause-btn" @click="pauseGame">⏸</button>
            </div>

            <div class="hud-props">
              <div
                v-for="prop in propsBar"
                :key="prop.key"
                class="prop-slot"
                :class="{ 'on-cooldown': prop.cooldown > 0 }"
              >
                <span class="prop-key">{{ prop.key }}</span>
                <span class="prop-icon">{{ prop.icon }}</span>
                <span class="prop-name">{{ prop.name }}</span>
                <div v-if="prop.cooldown > 0" class="cooldown-overlay" :style="{ height: (prop.cooldown / 8 * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="mini-leaderboard">
            <div class="lb-title">排名</div>
            <div
              v-for="(h, idx) in leaderboard"
              :key="h.id"
              class="lb-item"
              :class="{ 'is-player': h.isPlayer }"
            >
              <span class="lb-rank">{{ idx + 1 }}</span>
              <span class="lb-name">{{ h.name }}</span>
              <span class="lb-size">{{ Math.round(h.snowballSize) }}</span>
            </div>
          </div>
        </div>

        <div v-if="showPause" class="pause-overlay" @click.self="resumeGame">
          <div class="pause-popup">
            <div class="pause-title">游戏暂停</div>
            <button class="pause-action-btn" @click="resumeGame">继续游戏</button>
            <button class="pause-action-btn" @click="restartGame">重新开始</button>
            <button class="pause-action-btn" @click="backToLobby">返回大厅</button>
          </div>
        </div>
      </div>

      <div v-if="gameState === 'result'" class="game-result">
        <div class="canvas-wrapper">
          <canvas ref="gameCanvas" width="800" height="600"></canvas>
          <div class="result-overlay">
            <div class="result-card">
              <div class="result-rank">
                <span class="medal">{{ rankMedal }}</span>
                <span class="rank-text">第{{ gameResults.playerRank }}名</span>
              </div>

              <div class="result-stats">
                <div class="stat-item">
                  <span class="stat-icon">🪙</span>
                  <span class="stat-value coins-animate">+{{ gameResults.coinsEarned }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">⭐</span>
                  <span class="stat-value">+{{ gameResults.expEarned }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">❄️</span>
                  <span class="stat-value">{{ gameResults.playerSnowballSize }}</span>
                </div>
              </div>

              <div v-if="newSkinUnlocked" class="guest-unlock">
                <span class="unlock-icon">✨</span>
                <span>遇见特殊嘉宾! 解锁新皮肤: {{ newSkinName }}</span>
              </div>

              <div class="result-ranking">
                <div
                  v-for="(h, idx) in gameResults.hamsterStats"
                  :key="h.name"
                  class="ranking-item"
                  :class="{ 'is-player': h.name === GameStore.get('playerName') }"
                >
                  <span class="rk-pos">{{ idx + 1 }}</span>
                  <span class="rk-name">{{ h.name }}</span>
                  <span class="rk-size">❄️ {{ h.snowballSize }}</span>
                </div>
              </div>

              <div class="result-actions">
                <button class="result-btn" @click="restartGame">再来一局</button>
                <button class="result-btn secondary" @click="backToLobby">返回大厅</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data: function () {
    return {
      gameState: 'setup',
      mapId: '',
      difficulty: 'normal',
      engine: null,
      canvas: null,
      gameResults: null,
      showPause: false,
      currentRank: 1,
      currentTime: 90,
      currentSnowballSize: 10,
      propsBar: [
        { key: '1', id: 'freeze', icon: '❄️', name: '冰冻', cooldown: 0 },
        { key: '2', id: 'speed', icon: '⚡', name: '加速', cooldown: 0 },
        { key: '3', id: 'split', icon: '💥', name: '分裂', cooldown: 0 },
        { key: '4', id: 'obstacle', icon: '🪨', name: '障碍', cooldown: 0 },
        { key: '5', id: 'invisible', icon: '👻', name: '隐身', cooldown: 0 }
      ],
      leaderboard: [],
      newSkinUnlocked: null,
      GameStore: GameStore,
      GameMaps: GameMaps
    };
  },

  computed: {
    mapData: function () {
      var map = GameMaps.getMap(this.mapId || 'ice_world');
      return map || GameMaps.getMap('ice_world');
    },

    currentSkinName: function () {
      var skin = GameStore.SKINS[GameStore.get('currentSkin')];
      return skin ? skin.name : '默认仓鼠';
    },

    currentEffectName: function () {
      var effect = GameStore.SNOWBALL_EFFECTS[GameStore.get('currentSnowballEffect')];
      return effect ? effect.name : '普通雪球';
    },

    propsSummary: function () {
      var props = GameStore.get('props') || {};
      var parts = [];
      if (props.freeze > 0) parts.push('❄️×' + props.freeze);
      if (props.speed > 0) parts.push('⚡×' + props.speed);
      if (props.split > 0) parts.push('💥×' + props.split);
      if (props.obstacle > 0) parts.push('🪨×' + props.obstacle);
      if (props.invisible > 0) parts.push('👻×' + props.invisible);
      return parts.length > 0 ? parts.join(' ') : '无';
    },

    rankMedal: function () {
      if (!this.gameResults) return '';
      var medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      return medals[this.gameResults.playerRank] || '';
    },

    newSkinName: function () {
      if (!this.newSkinUnlocked) return '';
      var skin = GameStore.SKINS[this.newSkinUnlocked];
      return skin ? skin.name : this.newSkinUnlocked;
    }
  },

  mounted: function () {
    var route = GameRouter.getCurrentRoute();
    var params = route.params || {};
    var savedSession = sessionStorage.getItem('hamster_game_session');
    if (savedSession) {
      try {
        var session = JSON.parse(savedSession);
        this.mapId = params.map || session.mapId || 'ice_world';
        this.difficulty = params.difficulty || session.difficulty || 'normal';
      } catch (e) {
        this.mapId = params.map || 'ice_world';
        this.difficulty = params.difficulty || 'normal';
      }
    } else {
      this.mapId = params.map || 'ice_world';
      this.difficulty = params.difficulty || 'normal';
    }
    if (route.route === 'game') {
      sessionStorage.setItem('hamster_game_session', JSON.stringify({
        mapId: this.mapId,
        difficulty: this.difficulty
      }));
    }
  },

  beforeUnmount: function () {
    if (this.engine) {
      this.engine.stop();
      this.engine = null;
    }
  },

  methods: {
    startGame: function () {
      var self = this;
      sessionStorage.setItem('hamster_game_session', JSON.stringify({
        mapId: this.mapId,
        difficulty: this.difficulty
      }));
      this.gameState = 'playing';
      this.$nextTick(function () {
        self.canvas = self.$refs.gameCanvas;
        if (!self.canvas) return;

        var currentSkin = GameStore.get('currentSkin') || 'default';
        var currentEffect = GameStore.get('currentSnowballEffect') || 'default';
        self.engine = new GameEngine.GameEngine(self.canvas, self.mapId, self.difficulty, currentSkin, currentEffect);
        self.engine.onGameEnd = self.onGameEnd;
        self.engine.onGameUpdate = self.onGameUpdate;
        self.engine.init();
      });
    },

    onGameUpdate: function (status) {
      this.currentTime = status.timeRemaining;
      this.currentRank = status.playerRank || this.currentRank;
      this.currentSnowballSize = Math.round(status.playerSnowballSize || this.currentSnowballSize);

      if (status.hamsters) {
        var sorted = status.hamsters.slice().sort(function (a, b) {
          return b.snowballSize - a.snowballSize;
        });
        this.leaderboard = sorted.map(function (h) {
          return { id: h.id, name: h.name, snowballSize: h.snowballSize, isPlayer: h.isPlayer };
        });
        for (var i = 0; i < sorted.length; i++) {
          if (sorted[i].isPlayer) {
            this.currentRank = i + 1;
            break;
          }
        }
      }

      if (status.playerCooldowns) {
        var bar = this.propsBar;
        for (var i = 0; i < bar.length; i++) {
          bar[i].cooldown = status.playerCooldowns[bar[i].id] || 0;
        }
        this.propsBar = bar.slice();
      }
    },

    onGameEnd: function (results) {
      this.gameResults = results;
      this.gameState = 'result';
      if (results.metSpecialGuest) {
        this.newSkinUnlocked = 'special_' + results.metSpecialGuest;
      }
    },

    pauseGame: function () {
      this.showPause = true;
      if (this.engine) {
        this.engine.gameState = 'paused';
      }
    },

    resumeGame: function () {
      this.showPause = false;
      if (this.engine) {
        this.engine.gameState = 'playing';
      }
    },

    restartGame: function () {
      if (this.engine) {
        this.engine.stop();
        this.engine = null;
      }
      this.gameState = 'setup';
      this.gameResults = null;
      this.showPause = false;
      this.currentRank = 1;
      this.currentTime = 90;
      this.currentSnowballSize = 10;
      this.leaderboard = [];
      this.newSkinUnlocked = null;
      this.propsBar = [
        { key: '1', id: 'freeze', icon: '❄️', name: '冰冻', cooldown: 0 },
        { key: '2', id: 'speed', icon: '⚡', name: '加速', cooldown: 0 },
        { key: '3', id: 'split', icon: '💥', name: '分裂', cooldown: 0 },
        { key: '4', id: 'obstacle', icon: '🪨', name: '障碍', cooldown: 0 },
        { key: '5', id: 'invisible', icon: '👻', name: '隐身', cooldown: 0 }
      ];
    },

    backToLobby: function () {
      if (this.engine) {
        this.engine.stop();
        this.engine = null;
      }
      sessionStorage.removeItem('hamster_game_session');
      GameRouter.navigate('lobby');
    },

    formatTime: function (seconds) {
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60);
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
  }
};

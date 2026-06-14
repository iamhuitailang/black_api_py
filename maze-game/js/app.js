const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

const GameHUD = {
  props: ['lives', 'floor', 'keys', 'totalFloors', 'time', 'soundEnabled', 'doorOpen'],
  emits: ['toggle-sound', 'pause'],
  template: `
    <div class="hud">
      <div class="hud-left">
        <div class="hud-item">
          <span class="hud-label">层数</span>
          <span class="hud-value">{{ floor }} / {{ totalFloors }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">生命</span>
          <span class="hud-lives">
            <span v-for="i in 3" :key="i" class="heart" :class="{ active: i <= lives }">♥</span>
          </span>
        </div>
        <div class="hud-item">
          <span class="hud-label">钥匙</span>
          <span class="hud-keys">
            <span class="key-icon red" :class="{ collected: hasKey('red') }">🔑</span>
            <span class="key-icon blue" :class="{ collected: hasKey('blue') }">🔑</span>
            <span class="key-icon green" :class="{ collected: hasKey('green') }">🔑</span>
          </span>
        </div>
        <div class="hud-item" v-if="doorOpen">
          <span class="hud-label door-status">🚪 出口已开启!</span>
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-item">
          <span class="hud-label">时间</span>
          <span class="hud-value time-value">{{ formatTime(time) }}</span>
        </div>
        <button class="hud-btn" @click="$emit('toggle-sound')" :title="soundEnabled ? '关闭音效' : '开启音效'">
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
        <button class="hud-btn" @click="$emit('pause')" title="暂停">
          ⏸
        </button>
      </div>
    </div>
  `,
  methods: {
    hasKey(color) {
      return this.keys.includes(color);
    },
    formatTime(ms) {
      return Utils.formatTime(ms);
    },
  },
};

const MiniMap = {
  props: ['maze', 'player', 'guards', 'fog'],
  template: `
    <div class="mini-map-container">
      <div class="mini-map-title">小地图</div>
      <canvas ref="miniCanvas" class="mini-map" width="140" height="140"></canvas>
    </div>
  `,
  data() {
    return {
      animationId: null,
    };
  },
  methods: {
    render() {
      if (!this.$refs.miniCanvas || !this.maze || !this.fog || !this.player) return;
      const ctx = this.$refs.miniCanvas.getContext('2d');
      const w = this.$refs.miniCanvas.width;
      const h = this.$refs.miniCanvas.height;
      const cellW = w / this.maze.width;
      const cellH = h / this.maze.height;

      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < this.maze.height; y++) {
        for (let x = 0; x < this.maze.width; x++) {
          if (!this.fog.isExplored(x, y)) continue;
          const px = x * cellW;
          const py = y * cellH;
          if (this.maze.isWall(x, y)) {
            ctx.fillStyle = '#333';
          } else {
            ctx.fillStyle = '#1a1a2e';
          }
          ctx.fillRect(px, py, cellW, cellH);
        }
      }

      if (this.fog.isExplored(this.maze.exitPos.x, this.maze.exitPos.y)) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(
          this.maze.exitPos.x * cellW,
          this.maze.exitPos.y * cellH,
          cellW, cellH
        );
      }

      if (this.guards) {
        this.guards.forEach(guard => {
          const gx = guard.renderX !== undefined ? guard.renderX : guard.x;
          const gy = guard.renderY !== undefined ? guard.renderY : guard.y;
          if (this.fog.isVisible(Math.floor(gx), Math.floor(gy))) {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(
              gx * cellW + cellW / 2,
              gy * cellH + cellH / 2,
              Math.max(cellW, cellH) * 0.4,
              0, Math.PI * 2
            );
            ctx.fill();
          }
        });
      }

      const px = this.player.renderX !== undefined ? this.player.renderX : this.player.x;
      const py = this.player.renderY !== undefined ? this.player.renderY : this.player.y;
      ctx.fillStyle = '#4a9eff';
      ctx.beginPath();
      ctx.arc(
        px * cellW + cellW / 2,
        py * cellH + cellH / 2,
        Math.max(cellW, cellH) * 0.5,
        0, Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    },
    startLoop() {
      const loop = () => {
        this.render();
        this.animationId = requestAnimationFrame(loop);
      };
      loop();
    },
  },
  mounted() {
    this.startLoop();
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
};

const StartScreen = {
  props: ['hasSave', 'maxFloor', 'totalTime'],
  emits: ['new-game', 'continue-game'],
  template: `
    <div class="overlay start-screen">
      <div class="overlay-content">
        <h1 class="game-title">🏰 迷宫逃脱 🏰</h1>
        <p class="game-subtitle">收集钥匙 · 躲避守卫 · 逃出10层迷宫</p>

        <div class="stats-panel" v-if="hasSave">
          <div class="stat-item">
            <span class="stat-label">最远到达</span>
            <span class="stat-value">第 {{ maxFloor }} 层</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总时间</span>
            <span class="stat-value">{{ formatTime(totalTime) }}</span>
          </div>
        </div>

        <div class="button-group">
          <button class="game-btn primary" @click="$emit('new-game')">🎮 新游戏</button>
          <button class="game-btn secondary" v-if="hasSave" @click="$emit('continue-game')">📂 继续游戏</button>
        </div>

        <div class="instructions">
          <h3>操作说明</h3>
          <ul>
            <li>⬆️⬇️⬅️➡️ 方向键移动</li>
            <li>🔑 收集3把钥匙开启出口</li>
            <li>👁️ 避开守卫的视野</li>
            <li>🚪 到达出口进入下一层</li>
            <li>❤️ 你有3条命</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  methods: {
    formatTime(ms) {
      return Utils.formatTime(ms);
    },
  },
};

const PauseScreen = {
  emits: ['resume', 'restart', 'quit'],
  template: `
    <div class="overlay pause-screen">
      <div class="overlay-content small">
        <h2>⏸️ 游戏暂停</h2>
        <div class="button-group">
          <button class="game-btn primary" @click="$emit('resume')">▶️ 继续游戏</button>
          <button class="game-btn secondary" @click="$emit('restart')">🔄 重新开始</button>
          <button class="game-btn danger" @click="$emit('quit')">🚪 返回主菜单</button>
        </div>
      </div>
    </div>
  `,
};

const GameOverScreen = {
  props: ['floor', 'time'],
  emits: ['restart', 'quit'],
  template: `
    <div class="overlay gameover-screen">
      <div class="overlay-content">
        <h2 class="gameover-title">💀 游戏结束 💀</h2>
        <p class="gameover-sub">你在第 {{ floor }} 层被抓住了...</p>
        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-label">到达层数</span>
            <span class="stat-value">第 {{ floor }} 层</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">存活时间</span>
            <span class="stat-value">{{ formatTime(time) }}</span>
          </div>
        </div>
        <div class="button-group">
          <button class="game-btn primary" @click="$emit('restart')">🔄 再试一次</button>
          <button class="game-btn secondary" @click="$emit('quit')">🚪 返回主菜单</button>
        </div>
      </div>
    </div>
  `,
  methods: {
    formatTime(ms) {
      return Utils.formatTime(ms);
    },
  },
};

const VictoryScreen = {
  props: ['totalTime', 'bestTimes'],
  emits: ['restart', 'quit'],
  template: `
    <div class="overlay victory-screen">
      <div class="overlay-content">
        <h2 class="victory-title">🎉 恭喜通关! 🎉</h2>
        <p class="victory-sub">你成功逃出了10层迷宫!</p>
        <div class="stats-panel">
          <div class="stat-item big">
            <span class="stat-label">总通关时间</span>
            <span class="stat-value golden">{{ formatTime(totalTime) }}</span>
          </div>
        </div>
        <div class="floor-times">
          <h3>每层最佳时间</h3>
          <div class="times-grid">
            <div v-for="(time, floor) in sortedBestTimes" :key="floor" class="time-item">
              <span class="floor-num">第{{ floor }}层</span>
              <span class="floor-time">{{ formatTime(time) }}</span>
            </div>
          </div>
        </div>
        <div class="button-group">
          <button class="game-btn primary" @click="$emit('restart')">🔄 再玩一次</button>
          <button class="game-btn secondary" @click="$emit('quit')">🚪 返回主菜单</button>
        </div>
      </div>
    </div>
  `,
  computed: {
    sortedBestTimes() {
      const entries = Object.entries(this.bestTimes || {});
      entries.sort((a, b) => Number(a[0]) - Number(b[0]));
      return Object.fromEntries(entries);
    },
  },
  methods: {
    formatTime(ms) {
      return Utils.formatTime(ms);
    },
  },
};

const App = {
  components: {
    GameHUD,
    MiniMap,
    StartScreen,
    PauseScreen,
    GameOverScreen,
    VictoryScreen,
  },
  template: `
    <div class="game-container" ref="gameContainer">
      <div class="game-header" v-if="gameState !== 'start'">
        <GameHUD
          :lives="lives"
          :floor="currentFloor"
          :keys="collectedKeys"
          :total-floors="totalFloors"
          :time="elapsedTime"
          :sound-enabled="soundEnabled"
          :door-open="doorOpen"
          @toggle-sound="toggleSound"
          @pause="pauseGame"
        />
      </div>

      <div class="game-main" v-if="gameState !== 'start'">
        <div class="game-canvas-wrapper">
          <canvas ref="gameCanvas" class="game-canvas"></canvas>
        </div>
        <div class="game-sidebar">
          <MiniMap
            :maze="maze"
            :player="player"
            :guards="guards"
            :fog="fog"
          />
          <div class="controls-hint">
            <p>⬆️⬇️⬅️➡️ 移动</p>
            <p>ESC 暂停</p>
          </div>
        </div>
      </div>

      <StartScreen
        v-if="gameState === 'start'"
        :has-save="hasSave"
        :max-floor="maxFloor"
        :total-time="savedTotalTime"
        @new-game="startNewGame"
        @continue-game="continueGame"
      />

      <PauseScreen
        v-if="gameState === 'paused'"
        @resume="resumeGame"
        @restart="restartGame"
        @quit="quitToMenu"
      />

      <GameOverScreen
        v-if="gameState === 'gameover'"
        :floor="currentFloor"
        :time="elapsedTime"
        @restart="restartGame"
        @quit="quitToMenu"
      />

      <VictoryScreen
        v-if="gameState === 'victory'"
        :total-time="elapsedTime"
        :best-times="floorBestTimes"
        @restart="restartGame"
        @quit="quitToMenu"
      />
    </div>
  `,
  setup() {
    const gameContainer = ref(null);
    const gameCanvas = ref(null);
    const game = ref(null);
    const renderer = ref(null);

    const gameState = ref('start');
    const currentFloor = ref(1);
    const maxFloor = ref(1);
    const lives = ref(3);
    const collectedKeys = ref([]);
    const elapsedTime = ref(0);
    const floorBestTimes = ref({});
    const doorOpen = ref(false);
    const soundEnabled = ref(true);
    const hasSave = ref(false);
    const savedTotalTime = ref(0);

    const maze = ref(null);
    const player = ref(null);
    const guards = ref([]);
    const fog = ref(null);

    const totalFloors = GameConstants.TOTAL_FLOORS;
    let animationFrameId = null;
    let saveTimer = null;

    const checkSave = () => {
      const storage = new GameStorage();
      hasSave.value = storage.hasSave();
      const data = storage.load();
      if (data) {
        maxFloor.value = data.maxFloor || 1;
        savedTotalTime.value = data.totalTime || 0;
      }
    };

    const initRenderer = () => {
      if (!gameCanvas.value) return;

      const canvas = gameCanvas.value;
      const cs = GameConstants.CELL_SIZE;
      canvas.width = GameConstants.MAZE_WIDTH * cs;
      canvas.height = GameConstants.MAZE_HEIGHT * cs;

      renderer.value = new GameRenderer(canvas, cs);
      window.gameRenderer = renderer.value;
    };

    const gameLoop = () => {
      if (!game.value || !renderer.value) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const currentTime = performance.now();

      if (game.value.isRunning && !game.value.isPaused) {
        game.value.tick(currentTime);
        elapsedTime.value = currentTime - game.value.gameStartTime;

        if (game.value.player) {
          lives.value = game.value.player.lives;
          collectedKeys.value = [...game.value.player.collectedKeys];
        }
        if (game.value.maze) {
          maze.value = game.value.maze;
          player.value = game.value.player;
          guards.value = game.value.guards;
          fog.value = game.value.fog;
        }
        doorOpen.value = game.value.doorOpen;
        currentFloor.value = game.value.currentFloor;
        maxFloor.value = game.value.maxFloor;

        if (game.value.isGameOver) {
          gameState.value = 'gameover';
          game.value.stop();
        } else if (game.value.isVictory) {
          gameState.value = 'victory';
          game.value.stop();
          floorBestTimes.value = { ...game.value.floorBestTimes };
        }
      }

      renderer.value.update(currentTime);

      if (game.value.maze && game.value.player && game.value.fog) {
        const state = {
          maze: game.value.maze,
          player: game.value.player,
          guards: game.value.guards,
          keys: game.value.keys,
          fog: game.value.fog,
          doorOpen: game.value.doorOpen,
        };
        renderer.value.render(state);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const syncState = () => {
      if (!game.value) return;

      const state = game.value.getState();
      currentFloor.value = state.currentFloor;
      maxFloor.value = state.maxFloor;
      lives.value = state.player ? state.player.lives : 3;
      collectedKeys.value = state.player ? [...state.player.collectedKeys] : [];
      doorOpen.value = state.doorOpen;
      floorBestTimes.value = { ...state.floorBestTimes };
      soundEnabled.value = state.soundEnabled;

      maze.value = state.maze;
      player.value = state.player;
      guards.value = state.guards;
      fog.value = state.fog;

      if (state.isGameOver) {
        gameState.value = 'gameover';
      } else if (state.isVictory) {
        gameState.value = 'victory';
      }
    };

    const startNewGame = () => {
      if (game.value) {
        game.value.destroy();
      }

      game.value = new GameController();
      game.value.onStateChange = () => {
        syncState();
      };
      game.value.onNeedSave = () => {
        scheduleSave();
      };

      game.value.newGame();
      gameState.value = 'playing';

      nextTick(() => {
        initRenderer();
        game.value.start();

        if (!animationFrameId) {
          gameLoop();
        }

        if (gameContainer.value) {
          gameContainer.value.focus();
        }

        scheduleSave();
      });
    };

    const continueGame = () => {
      if (game.value) {
        game.value.destroy();
      }

      game.value = new GameController();
      game.value.onStateChange = () => {
        syncState();
      };
      game.value.onNeedSave = () => {
        scheduleSave();
      };

      const loaded = game.value.loadGame();
      if (loaded) {
        gameState.value = 'playing';

        nextTick(() => {
          initRenderer();
          game.value.start();

          if (!animationFrameId) {
            gameLoop();
          }

          if (gameContainer.value) {
            gameContainer.value.focus();
          }

          scheduleSave();
        });
      }
    };

    const pauseGame = () => {
      if (game.value && game.value.isRunning) {
        game.value.pause();
        gameState.value = 'paused';
        saveGame();
      }
    };

    const resumeGame = () => {
      if (game.value) {
        game.value.resume();
        gameState.value = 'playing';
        if (gameContainer.value) {
          gameContainer.value.focus();
        }
      }
    };

    const restartGame = () => {
      startNewGame();
    };

    const quitToMenu = () => {
      if (game.value) {
        saveGame();
        game.value.destroy();
        game.value = null;
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      gameState.value = 'start';
      checkSave();
    };

    const saveGame = () => {
      if (game.value && game.value.maze) {
        game.value.saveGame();
        hasSave.value = true;
      }
    };

    const scheduleSave = () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(() => {
        saveGame();
      }, 500);
    };

    const toggleSound = () => {
      if (game.value) {
        soundEnabled.value = game.value.toggleSound();
      }
    };

    const handleKeyDown = (e) => {
      if (gameState.value === 'start') return;

      if (e.key === 'Escape') {
        if (gameState.value === 'playing') {
          pauseGame();
        } else if (gameState.value === 'paused') {
          resumeGame();
        }
        e.preventDefault();
        return;
      }

      if (gameState.value !== 'playing' || !game.value) return;

      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1;
          break;
      }

      if (dx !== 0 || dy !== 0) {
        game.value.movePlayer(dx, dy);
        e.preventDefault();
      }
    };

    onMounted(() => {
      checkSave();
      document.addEventListener('keydown', handleKeyDown);
      if (!animationFrameId) {
        gameLoop();
      }
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      if (game.value) {
        game.value.destroy();
      }
    });

    return {
      gameContainer,
      gameCanvas,
      gameState,
      currentFloor,
      maxFloor,
      lives,
      collectedKeys,
      elapsedTime,
      floorBestTimes,
      doorOpen,
      soundEnabled,
      hasSave,
      savedTotalTime,
      totalFloors,
      maze,
      player,
      guards,
      fog,
      handleKeyDown,
      startNewGame,
      continueGame,
      pauseGame,
      resumeGame,
      restartGame,
      quitToMenu,
      toggleSound,
    };
  },
};

const app = createApp(App);
app.mount('#app');

// storage.js - localStorage 本地存储模块

const STORAGE_KEY = 'xiaoqiu_hell_ball_data_v1';
const SAVE_KEY = 'xiaoqiu_hell_ball_save_v1';

const Storage = {
  _default() {
    return {
      bestTime: 0,
      bestStage: 0,
      totalRuns: 0,
      lastChar: 'balanced',
      lastTheme: 'hell',
      unlockedThemes: ['hell'],
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this._default();
      const data = JSON.parse(raw);
      const def = this._default();
      return Object.assign(def, data);
    } catch (e) {
      return this._default();
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  },

  update(key, value) {
    const data = this.load();
    data[key] = value;
    this.save(data);
    return data;
  },

  recordRun(survivalTime, stageIdx) {
    const data = this.load();
    data.totalRuns++;
    if (survivalTime > data.bestTime) data.bestTime = survivalTime;
    if (stageIdx > data.bestStage) data.bestStage = stageIdx;
    this.save(data);
    return data;
  },

  saveGame(game) {
    try {
      const state = {
        player: {
          charId: game.player.charId,
          x: game.player.x,
          y: game.player.y,
          hp: game.player.hp,
          maxHp: game.player.maxHp,
          skillCooldown: game.player.skillCooldown,
          dashCooldown: game.player.dashCooldown,
          shieldActive: game.player.shieldActive,
          shieldUntil: game.player.shieldUntil,
          invincible: game.player.invincible,
          invincibleUntil: game.player.invincibleUntil,
          frozen: game.player.frozen,
          frozenUntil: game.player.frozenUntil,
          dashing: game.player.dashing,
          dashTime: game.player.dashTime,
        },
        elapsedTime: game.elapsedTime,
        stageIdx: game.stageIdx,
        stageTimer: game.stageTimer,
        paused: game.paused,
        enemies: EnemyManager.enemies.map(e => ({
          type: e.type, x: e.x, y: e.y, vx: e.vx, vy: e.vy,
          radius: e.radius, damage: e.damage,
          slowFactor: e.slowFactor, slowUntil: e.slowUntil,
          exploding: e.exploding, explodeStartTime: e.explodeStartTime,
        })),
        slowFields: SkillSystem.slowFields.map(f => ({
          x: f.x, y: f.y, radius: f.radius, duration: f.duration,
          startTime: f.startTime, slowFactor: f.slowFactor,
        })),
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Game save failed', e);
    }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      const age = Date.now() - state.savedAt;
      if (age > 3600000) {
        this.clearGame();
        return null;
      }
      return state;
    } catch (e) {
      return null;
    }
  },

  hasGame() {
    return !!localStorage.getItem(SAVE_KEY);
  },

  clearGame() {
    localStorage.removeItem(SAVE_KEY);
  },
};

const GameState = {
  data: null,
  init() {
    this.data = Storage.load();
  },
  save() {
    if (this.data) Storage.save(this.data);
  },
};

GameState.init();
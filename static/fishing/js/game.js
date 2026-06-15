(() => {
  'use strict';

  // ===============================
  // 配置
  // ===============================
  const FISH_TYPES = {
    crucian: {
      id: 'crucian',
      name: '鲫鱼',
      color: '#b8a070',
      minWeight: 0.5, maxWeight: 2,
      score: 10,
      struggleBase: 0,
      struggleChance: 0,
      struggleInterval: 9999,
      pullStrength: 2.5,
      tensionDecay: 1.2
    },
    carp: {
      id: 'carp',
      name: '鲤鱼',
      color: '#c85030',
      minWeight: 2, maxWeight: 5,
      score: 25,
      struggleBase: 18,
      struggleChance: 0.35,
      struggleInterval: 5,
      pullStrength: 1.8,
      tensionDecay: 1.5
    },
    grass: {
      id: 'grass',
      name: '草鱼',
      color: '#6aa84a',
      minWeight: 3, maxWeight: 8,
      score: 50,
      struggleBase: 20,
      struggleChance: 0.7,
      struggleInterval: 3,
      pullStrength: 1.4,
      tensionDecay: 1.8
    },
    bass: {
      id: 'bass',
      name: '鲈鱼',
      color: '#5080b0',
      minWeight: 1, maxWeight: 3,
      score: 80,
      struggleBase: 28,
      struggleChance: 0.9,
      struggleInterval: 2.2,
      pullStrength: 2.2,
      tensionDecay: 2.5
    },
    arowana: {
      id: 'arowana',
      name: '金龙鱼',
      color: '#f0c040',
      minWeight: 5, maxWeight: 10,
      score: 200,
      struggleBase: 26,
      struggleChance: 1.0,
      struggleInterval: 2,
      pullStrength: 1.1,
      tensionDecay: 3.2,
      bigStruggles: 2,
      bigStruggleAmount: 35
    }
  };

  const FISH_WEIGHTS = [
    ['crucian', 0.40],
    ['carp',    0.30],
    ['grass',   0.20],
    ['bass',    0.08],
    ['arowana', 0.02]
  ];

  const SCENES = {
    pond: {
      id: 'pond',
      name: '池塘',
      icon: '🌿',
      cssClass: 'scene-pond',
      unlockFish: 10,
      castDistance: { min: 0.25, max: 0.55 },
      chargeMaxMs: 1800,
      hookSinkMs: 1400,
      fishPool: ['crucian', 'carp'],
      fishSpawnInterval: 1400,
      maxFish: 6
    },
    river: {
      id: 'river',
      name: '河流',
      icon: '🌉',
      cssClass: 'scene-river',
      unlockFish: 30,
      castDistance: { min: 0.35, max: 0.75 },
      chargeMaxMs: 2000,
      hookSinkMs: 1800,
      fishPool: ['crucian', 'carp', 'grass'],
      fishSpawnInterval: 1100,
      maxFish: 8
    },
    ocean: {
      id: 'ocean',
      name: '深海',
      icon: '⛰️',
      cssClass: 'scene-ocean',
      unlockFish: Infinity,
      castDistance: { min: 0.45, max: 0.95 },
      chargeMaxMs: 2500,
      hookSinkMs: 2400,
      fishPool: ['crucian', 'carp', 'grass', 'bass', 'arowana'],
      fishSpawnInterval: 900,
      maxFish: 10
    }
  };

  const BITE_WINDOW_MS = 1500;
  const GAME_DURATION = 3 * 60 * 1000;
  const DANGER_TENSION = 80;
  const MAX_TENSION = 100;
  const STORAGE_KEYS = {
    TOTAL_FISH: 'fishing.totalFish',
    BEST_SCORE: 'fishing.bestScore',
    PLAYER_NAME: 'fishing.playerName'
  };

  const State = {
    IDLE: 'idle',
    CHARGING: 'charging',
    CASTING: 'casting',
    WAITING: 'waiting',
    BITE: 'bite',
    REELING: 'reeling',
    CAUGHT: 'caught',
    FAILED: 'failed'
  };

  // ===============================
  // 全局游戏状态
  // ===============================
  const game = {
    state: State.IDLE,
    scene: SCENES.pond,
    score: 0,
    fishCount: 0,
    biggestFish: 0,
    basket: [],
    timeLeft: GAME_DURATION,
    timerId: null,
    rafId: null,
    chargeStart: 0,
    chargeTimerId: null,
    biteDeadline: 0,
    biteTimerId: null,
    hookedFish: null,
    fishes: [],
    fishSpawnAcc: 0,
    lastFrameTs: 0,
    tension: 0,
    reelingKeyBuffer: { left: 0, right: 0 },
    lastReelKey: null,
    reelingStruggle: null,
    reelingBigStruggles: 0,
    nextStruggleAt: 0,
    reelingProgress: 0,
    hookPos: { x: 0, y: 0 },
    hookStartPos: { x: 0, y: 0 },
    hookTargetPos: { x: 0, y: 0 },
    castProgress: 0
  };

  // ===============================
  // DOM 引用
  // ===============================
  const $ = (sel) => document.querySelector(sel);
  const dom = {
    screens: {
      start:  $('#start-screen'),
      game:   $('#game-screen'),
      result: $('#result-screen')
    },
    start: {
      sceneList: $('#scene-list'),
      playerName: $('#player-name'),
      totalFish: $('#total-fish'),
      bestScore: $('#best-score'),
      btnStart: $('#btn-start'),
      btnLeaderboard: $('#btn-show-leaderboard')
    },
    game: {
      hud: {
        timer: $('#timer'),
        score: $('#score'),
        fishCount: $('#fish-count'),
        sceneName: $('#current-scene-name')
      },
      stage: $('#game-stage'),
      bg: $('#bg-layer'),
      fisherman: $('#fisherman'),
      rod: $('#fishing-rod'),
      line: $('#fishing-line'),
      hook: $('#hook'),
      float: $('#float'),
      splashes: $('#splashes'),
      fishLayer: $('#fish-layer'),
      fishDisplay: $('#fish-display'),
      tensionWrap: $('#tension-wrap'),
      tensionFill: $('#tension-fill'),
      tensionHint: $('.tension-hint'),
      toast: $('#bubble-toast'),
      btnCast: $('#btn-cast'),
      btnReel: $('#btn-reel')
    },
    result: {
      score: $('#result-score'),
      fishCount: $('#result-fish-count'),
      biggest: $('#result-biggest'),
      basket: $('#basket-list'),
      playerName: $('#result-player-name'),
      btnSubmit: $('#btn-submit-score'),
      btnLeaderboard: $('#btn-show-leaderboard2'),
      btnHome: $('#btn-back-home')
    },
    leaderboard: {
      modal: $('#leaderboard-modal'),
      list: $('#leaderboard-list'),
      btnClose: $('#btn-close-leaderboard')
    }
  };

  // ===============================
  // 工具
  // ===============================
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function pickWeighted(pool = null) {
    const weights = pool
      ? FISH_WEIGHTS.filter(([id]) => pool.includes(id))
      : FISH_WEIGHTS;
    const total = weights.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of weights) {
      if ((r -= w) <= 0) return id;
    }
    return weights[0][0];
  }

  function getTotalFish() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_FISH) || '0', 10);
  }
  function getBestScore() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.BEST_SCORE) || '0', 10);
  }
  function addTotalFish(n) {
    const total = getTotalFish() + n;
    localStorage.setItem(STORAGE_KEYS.TOTAL_FISH, String(total));
    return total;
  }
  function setBestScore(s) {
    const cur = getBestScore();
    if (s > cur) {
      localStorage.setItem(STORAGE_KEYS.BEST_SCORE, String(s));
      return true;
    }
    return false;
  }

  function showScreen(name) {
    Object.entries(dom.screens).forEach(([k, el]) => {
      el.classList.toggle('active', k === name);
    });
  }

  function showToast(msg, type = '', duration = 1400) {
    const el = dom.game.toast;
    el.textContent = msg;
    el.className = `bubble-toast show ${type}`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  // ===============================
  // 音效 (Web Audio API)
  // ===============================
  const audio = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { this.ctx = null; }
      }
      return this.ctx;
    },
    beep(freq = 440, dur = 0.1, type = 'sine', vol = 0.2) {
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    splash() {
      this.beep(260, 0.08, 'triangle', 0.12);
      setTimeout(() => this.beep(200, 0.1, 'sine', 0.1), 40);
    },
    bite() {
      const ctx = this.ensure();
      if (!ctx) return;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.beep(180 + i * 40, 0.06, 'square', 0.18), i * 60);
      }
    },
    reelStep() { this.beep(700, 0.03, 'triangle', 0.08); },
    caught() {
      this.beep(660, 0.1, 'sine', 0.2);
      setTimeout(() => this.beep(880, 0.1, 'sine', 0.2), 90);
      setTimeout(() => this.beep(1100, 0.18, 'sine', 0.22), 180);
    },
    fail() { this.beep(160, 0.25, 'sawtooth', 0.15); },
    tick() { this.beep(1200, 0.05, 'square', 0.06); }
  };

  // ===============================
  // 场景布局计算
  // ===============================
  function getStageMetrics() {
    const stage = dom.game.stage;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    // 地面顶部占52%，水面顶部52%，水下从55%开始
    const shoreLeftPct = 0.06 + 0.06; // 渔夫位置右侧
    const waterStartY = h * 0.52;
    const waterBottomY = h;
    const rodTipX = w * 0.20;
    const rodTipY = h * 0.34;
    return { w, h, waterStartY, waterBottomY, rodTipX, rodTipY };
  }

  function updateFishermanHat() {
    // 渔夫的帽子元素，确保存在
    let hat = dom.game.fisherman.querySelector('.hat');
    if (!hat) {
      hat = document.createElement('div');
      hat.className = 'hat';
      dom.game.fisherman.appendChild(hat);
    }
  }

  // ===============================
  // 场景渲染 & 解锁
  // ===============================
  function renderSceneSelect() {
    const total = getTotalFish();
    dom.start.sceneList.innerHTML = '';
    Object.values(SCENES).forEach(scene => {
      const locked = scene.id !== 'pond' && total < scene.unlockFish;
      const card = document.createElement('div');
      card.className = `scene-card ${locked ? 'locked' : ''} ${game.scene.id === scene.id ? 'selected' : ''}`;
      card.dataset.scene = scene.id;
      let reqText = '';
      if (locked) {
        reqText = `需钓 ${scene.unlockFish} 条鱼（${total}/${scene.unlockFish}）`;
      } else if (scene.unlockFish < Infinity) {
        reqText = '已解锁 ✓';
      } else if (scene.id === 'pond') {
        reqText = '初始场景';
      } else {
        reqText = '高级场景';
      }
      card.innerHTML = `
        <span class="sc-icon">${scene.icon}</span>
        <span class="sc-name">${scene.name}</span>
        <span class="sc-req">${reqText}</span>
        ${locked ? '<span class="lock-badge">🔒</span>' : ''}
      `;
      if (!locked) {
        card.addEventListener('click', () => {
          game.scene = scene;
          renderSceneSelect();
        });
      }
      dom.start.sceneList.appendChild(card);
    });
  }

  function applyScene() {
    const stage = dom.game.stage;
    stage.classList.remove('scene-pond', 'scene-river', 'scene-ocean');
    stage.classList.add(game.scene.cssClass);
    dom.game.hud.sceneName.textContent = `${game.scene.icon} ${game.scene.name}`;
  }

  // ===============================
  // 钓鱼线 & 鱼钩位置更新
  // ===============================
  function updateRodAndHook(x, y) {
    const m = getStageMetrics();
    const tipX = m.rodTipX;
    const tipY = m.rodTipY;
    game.hookPos.x = x;
    game.hookPos.y = y;

    dom.game.hook.style.left = (x - 6) + 'px';
    dom.game.hook.style.top = (y - 8) + 'px';

    // 鱼线
    const dx = x - tipX;
    const dy = y - tipY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    dom.game.line.style.left = tipX + 'px';
    dom.game.line.style.top = tipY + 'px';
    dom.game.line.style.width = len + 'px';
    dom.game.line.style.transform = `rotate(${ang}deg)`;

    // 浮标: 沿鱼线找与水面的交点
    if (y >= m.waterStartY) {
      const t = (m.waterStartY - tipY) / (y - tipY);
      const fx = tipX + (x - tipX) * clamp(t, 0, 1);
      const fy = m.waterStartY;
      dom.game.float.style.left = (fx - 10) + 'px';
      dom.game.float.style.top = (fy - 20) + 'px';
      dom.game.float.style.display = 'block';
    } else {
      dom.game.float.style.display = 'none';
    }
  }

  function resetHookToRod() {
    const m = getStageMetrics();
    updateRodAndHook(m.rodTipX + 30, m.rodTipY + 20);
    dom.game.float.classList.remove('shaking', 'settling');
  }

  // ===============================
  // 水花
  // ===============================
  function spawnSplash(x, y) {
    const s = document.createElement('div');
    s.className = 'splash';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    dom.game.splashes.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  // ===============================
  // 鱼生成和管理
  // ===============================
  function createFishDOM(fishData) {
    const el = document.createElement('div');
    el.className = `fish ${fishData.dir > 0 ? 'fish-right' : 'fish-left'} swimming`;
    const body = document.createElement('div');
    body.className = 'fish-body';
    body.style.background = fishData.color;
    body.style.width = fishData.width + 'px';
    body.style.height = fishData.height + 'px';
    const tail = document.createElement('div');
    tail.className = 'fish-tail';
    tail.style.color = fishData.color;
    tail.style.borderWidth = (fishData.height * 0.6) + 'px '
                          + (fishData.width * 0.4) + 'px '
                          + (fishData.height * 0.6) + 'px '
                          + (fishData.width * 0.4) + 'px';
    if (fishData.dir > 0) {
      tail.style.left = (-fishData.width * 0.35) + 'px';
      tail.style.borderWidth = `${fishData.height * 0.6}px ${fishData.width * 0.4}px ${fishData.height * 0.6}px 0`;
      tail.style.borderColor = `transparent ${fishData.color} transparent transparent`;
    } else {
      tail.style.right = (-fishData.width * 0.35) + 'px';
      tail.style.borderWidth = `${fishData.height * 0.6}px 0 ${fishData.height * 0.6}px ${fishData.width * 0.4}px`;
      tail.style.borderColor = `transparent transparent transparent ${fishData.color}`;
    }
    const fin = document.createElement('div');
    fin.className = 'fish-fin';
    fin.style.color = fishData.color;
    fin.style.borderWidth = `0 ${fishData.width * 0.14}px ${fishData.height * 0.4}px ${fishData.width * 0.14}px`;
    el.appendChild(tail);
    el.appendChild(body);
    el.appendChild(fin);
    return el;
  }

  function spawnFish() {
    const m = getStageMetrics();
    const typeId = pickWeighted(game.scene.fishPool);
    const type = FISH_TYPES[typeId];
    const weight = rand(type.minWeight, type.maxWeight);
    const sizeK = 0.4 + (weight - type.minWeight) / Math.max(0.1, type.maxWeight - type.minWeight) * 1.2;
    const width = 36 + sizeK * 28;
    const height = 18 + sizeK * 14;

    const fromRight = Math.random() < 0.5;
    const dir = fromRight ? -1 : 1;
    const x = fromRight ? m.w + 20 : -width - 20;
    const y = rand(m.waterStartY + 10, m.waterBottomY - height - 6);
    const speed = (20 + sizeK * 12 + Math.random() * 18) * dir; // px/sec

    const f = {
      id: Math.random().toString(36).slice(2),
      typeId,
      type,
      weight,
      color: type.color,
      width,
      height,
      x, y,
      dir,
      speed,
      sizeK,
      biteInited: false,
      el: null
    };
    f.el = createFishDOM(f);
    f.el.style.left = x + 'px';
    f.el.style.top = y + 'px';
    dom.game.fishLayer.appendChild(f.el);
    game.fishes.push(f);
  }

  function updateFishes(dtSec) {
    const m = getStageMetrics();
    const hook = game.hookPos;
    const hookW = 12, hookH = 16;

    for (let i = game.fishes.length - 1; i >= 0; i--) {
      const f = game.fishes[i];
      f.x += f.speed * dtSec;
      // y 轻微波动
      f.y += Math.sin((performance.now() / 400) + i * 1.3) * 12 * dtSec;
      f.y = clamp(f.y, m.waterStartY + 6, m.waterBottomY - f.height - 4);

      // 出界移除
      if ((f.dir > 0 && f.x > m.w + 40) || (f.dir < 0 && f.x < -f.width - 40)) {
        f.el.remove();
        game.fishes.splice(i, 1);
        continue;
      }
      f.el.style.left = f.x + 'px';
      f.el.style.top = f.y + 'px';

      // 上钩检测：鱼钩等待状态 & 有接触
      if (game.state === State.WAITING && !f.biteInited) {
        const fx = f.x + f.width / 2;
        const fy = f.y + f.height / 2;
        const hx = hook.x + hookW / 2;
        const hy = hook.y + hookH / 2;
        const dx = fx - hx;
        const dy = fy - hy;
        const r = Math.max(f.width * 0.55, hookW * 1.2);
        if (dx * dx + dy * dy <= r * r) {
          f.biteInited = true;
          triggerBite(f);
        }
      }
    }
  }

  function clearAllFishes() {
    game.fishes.forEach(f => f.el.remove());
    game.fishes = [];
  }

  // ===============================
  // 抛竿
  // ===============================
  function startCharging() {
    if (game.state !== State.IDLE) return;
    game.state = State.CHARGING;
    game.chargeStart = performance.now();
    dom.game.btnCast.classList.add('charging');
    dom.game.btnCast.disabled = true;
    dom.game.btnReel.disabled = true;
  }

  function releaseCast() {
    if (game.state !== State.CHARGING) return;
    const chargeMs = Math.min(performance.now() - game.chargeStart, game.scene.chargeMaxMs);
    const chargeRatio = chargeMs / game.scene.chargeMaxMs;
    const distRatio = game.scene.castDistance.min +
                     (game.scene.castDistance.max - game.scene.castDistance.min) * chargeRatio;

    dom.game.btnCast.classList.remove('charging');

    // 动画
    game.state = State.CASTING;
    dom.game.fisherman.classList.add('casting');
    dom.game.rod.classList.add('casting');
    setTimeout(() => {
      dom.game.fisherman.classList.remove('casting');
      dom.game.rod.classList.remove('casting');
    }, 800);

    const m = getStageMetrics();
    const startX = m.rodTipX + 40;
    const startY = m.rodTipY + 20;
    const targetX = m.w * distRatio;
    const targetY = m.waterStartY + 20 + (m.waterBottomY - m.waterStartY - 40) * (0.25 + chargeRatio * 0.55);

    game.hookStartPos = { x: startX, y: startY };
    game.hookTargetPos = { x: targetX, y: targetY };
    game.castProgress = 0;
    const castDuration = 600 + chargeRatio * 200;
    const startTime = performance.now();

    // 水平抛物线
    const arcHeight = 60 + chargeRatio * 40;

    const animate = (now) => {
      const t = clamp((now - startTime) / castDuration, 0, 1);
      game.castProgress = t;
      // 线性水平
      const x = startX + (targetX - startX) * t;
      // 抛物线
      const linY = startY + (targetY - startY) * t;
      const arc = -4 * arcHeight * t * (1 - t);
      const y = linY + arc;
      updateRodAndHook(x, y);

      // 入水检测
      if (y >= m.waterStartY && !game._splashCast) {
        game._splashCast = true;
        spawnSplash(x, m.waterStartY + 2);
        audio.splash();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        game._splashCast = false;
        // 下沉
        startSinking(targetY + 40);
      }
    };
    requestAnimationFrame(animate);
  }

  function startSinking(targetBottomY) {
    const startX = game.hookPos.x;
    const startY = game.hookPos.y;
    const startTime = performance.now();
    const duration = game.scene.hookSinkMs;

    // 浮标就位
    dom.game.float.classList.add('settling');
    setTimeout(() => dom.game.float.classList.remove('settling'), 1000);

    const animate = (now) => {
      const t = clamp((now - startTime) / duration, 0, 1);
      const y = startY + (targetBottomY - startY) * t;
      updateRodAndHook(startX, y);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        enterWaiting();
      }
    };
    requestAnimationFrame(animate);
  }

  function enterWaiting() {
    game.state = State.WAITING;
    dom.game.btnCast.disabled = true;
    dom.game.btnReel.disabled = true;
    // 收竿按钮保持禁用，直到上钩
  }

  // ===============================
  // 上钩
  // ===============================
  function triggerBite(fish) {
    game.state = State.BITE;
    game.hookedFish = fish;
    game.biteDeadline = performance.now() + BITE_WINDOW_MS;

    dom.game.float.classList.add('shaking');
    dom.game.btnReel.disabled = false;
    dom.game.btnReel.classList.add('urgent');
    audio.bite();

    clearTimeout(game.biteTimerId);
    // 剩余窗口倒计时
    const tick = () => {
      if (game.state !== State.BITE) return;
      const left = game.biteDeadline - performance.now();
      if (left <= 0) {
        fishEscaped('超时未收竿!');
        return;
      }
      if (left < 500) audio.tick();
      game.biteTimerId = setTimeout(tick, 100);
    };
    game.biteTimerId = setTimeout(tick, 100);
  }

  function handleReel() {
    clearTimeout(game.biteTimerId);
    if (game.state === State.BITE) {
      dom.game.btnReel.classList.remove('urgent');
      dom.game.float.classList.remove('shaking');
      startReeling();
    }
  }

  function fishEscaped(msg) {
    game.state = State.FAILED;
    clearTimeout(game.biteTimerId);
    dom.game.float.classList.remove('shaking');
    dom.game.btnReel.classList.remove('urgent');
    audio.fail();
    showToast(msg || '鱼跑了!', 'escape');

    game.hookedFish = null;
    // 收回鱼钩
    setTimeout(retrieveHook, 600);
  }

  function retrieveHook() {
    const startX = game.hookPos.x;
    const startY = game.hookPos.y;
    const m = getStageMetrics();
    const endX = m.rodTipX + 30;
    const endY = m.rodTipY + 20;
    const startTime = performance.now();
    const duration = 500;
    const animate = (now) => {
      const t = clamp((now - startTime) / duration, 0, 1);
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t - 40 * Math.sin(t * Math.PI);
      updateRodAndHook(x, y);
      if (t < 1) requestAnimationFrame(animate);
      else {
        game.state = State.IDLE;
        dom.game.btnCast.disabled = false;
        dom.game.btnReel.disabled = true;
      }
    };
    requestAnimationFrame(animate);
  }

  // ===============================
  // 拉鱼阶段
  // ===============================
  function startReeling() {
    game.state = State.REELING;
    game.tension = 20;
    game.reelingProgress = 0;
    game.lastReelKey = null;
    game.reelingKeyBuffer = { left: 0, right: 0 };
    game.reelingBigStruggles = 0;
    game.reelingStruggle = null;
    game.nextStruggleAt = performance.now() + rand(1500, 2500);

    dom.game.fisherman.classList.add('reeling');
    setTimeout(() => dom.game.fisherman.classList.remove('reeling'), 400);

    dom.game.tensionWrap.classList.add('active');
    dom.game.tensionFill.classList.remove('danger');
    dom.game.tensionHint.classList.remove('struggling');
    dom.game.btnCast.disabled = true;
    dom.game.btnReel.disabled = true;

    // 鱼附着在钩上
    if (game.hookedFish && game.hookedFish.el) {
      game.hookedFish.el.classList.remove('swimming');
    }
  }

  function handleReelKey(isLeft) {
    if (game.state !== State.REELING) return;
    // 需要交替
    if (game.lastReelKey === (isLeft ? 'L' : 'R')) {
      return;
    }
    game.lastReelKey = isLeft ? 'L' : 'R';
    audio.reelStep();
    dom.game.fisherman.classList.remove('reeling');
    void dom.game.fisherman.offsetWidth;
    dom.game.fisherman.classList.add('reeling');
    setTimeout(() => dom.game.fisherman.classList.remove('reeling'), 400);

    // 张力减少挣扎惩罚
    if (game.reelingStruggle) {
      game.tension = clamp(game.tension + 1.5, 0, MAX_TENSION);
    } else {
      const fish = game.hookedFish;
      const type = fish ? fish.type : FISH_TYPES.crucian;
      const add = type.pullStrength + 2.5;
      game.tension = clamp(game.tension + add, 0, MAX_TENSION);
      game.reelingProgress = clamp(game.reelingProgress + type.pullStrength * 0.9, 0, 100);
    }
  }

  function updateReeling(dtSec, now) {
    const fish = game.hookedFish;
    if (!fish) { return; }
    const type = fish.type;

    // 张力衰减
    let decay = type.tensionDecay * 8 * dtSec;
    if (game.reelingStruggle) {
      decay = 0; // 挣扎期间不衰减
    }
    game.tension = clamp(game.tension - decay, 0, MAX_TENSION);

    // 挣扎逻辑
    if (!game.reelingStruggle && now >= game.nextStruggleAt) {
      // 发起挣扎
      const chance = type.struggleChance;
      const isBig = type.bigStruggles && game.reelingBigStruggles < type.bigStruggles && Math.random() < 0.4;
      if (isBig || Math.random() < chance) {
        const amount = isBig ? (type.bigStruggleAmount || 35) : (type.struggleBase + rand(-4, 6));
        const dur = isBig ? 900 : 500;
        game.reelingStruggle = {
          amount, dur,
          start: now,
          applied: false
        };
        if (isBig) game.reelingBigStruggles++;
        dom.game.tensionHint.classList.add('struggling');
        dom.game.tensionHint.textContent = isBig ? '⚠️ 大挣扎！暂停按键！' : '💢 鱼在挣扎，注意张力！';
      } else {
        game.nextStruggleAt = now + (type.struggleInterval * 1000) * rand(0.7, 1.3);
      }
    }

    // 挣扎期间
    if (game.reelingStruggle) {
      const st = game.reelingStruggle;
      const t = (now - st.start) / st.dur;
      if (!st.applied) {
        st.applied = true;
        game.tension = clamp(game.tension + st.amount, 0, MAX_TENSION);
      }
      if (t >= 1) {
        game.reelingStruggle = null;
        dom.game.tensionHint.classList.remove('struggling');
        dom.game.tensionHint.textContent = '快速交替按 ← → 收线！';
        game.nextStruggleAt = now + (type.struggleInterval * 1000) * rand(0.6, 1.2);
      }
    }

    // 更新UI
    dom.game.tensionFill.style.width = game.tension + '%';
    if (game.tension >= DANGER_TENSION) {
      dom.game.tensionFill.classList.add('danger');
    } else {
      dom.game.tensionFill.classList.remove('danger');
    }

    // 线断判定
    if (game.tension >= MAX_TENSION) {
      lineBreak();
      return;
    }

    // 鱼跟随鱼钩移动 (根据拉鱼进度逐渐拉向岸边)
    updateReelingFishPosition();

    // 完成判定
    if (game.reelingProgress >= 100) {
      catchFish();
    }
  }

  function updateReelingFishPosition() {
    const m = getStageMetrics();
    const p = game.reelingProgress / 100;
    // 从上钩点移动到岸边上方
    const sx = game.hookedFish._biteX !== undefined ? game.hookedFish._biteX : game.hookPos.x;
    const sy = game.hookedFish._biteY !== undefined ? game.hookedFish._biteY : game.hookPos.y;
    if (game.hookedFish._biteX === undefined) {
      game.hookedFish._biteX = sx;
      game.hookedFish._biteY = sy;
    }

    const endX = m.rodTipX + 80;
    const endY = m.waterStartY - 40;
    // 出水后抖动
    const progressInWater = clamp(p / 0.7, 0, 1);
    const landX = sx + (endX - sx) * p;
    const waterExitY = Math.min(sy, m.waterStartY - 10);
    let landY;
    if (p < 0.7) {
      landY = sy + (waterExitY - sy) * progressInWater;
    } else {
      const t = (p - 0.7) / 0.3;
      landY = waterExitY + (endY - waterExitY) * t;
      // 鱼身摆动
      if (game.hookedFish && game.hookedFish.el) {
        const deg = Math.sin(performance.now() / 80) * 30 * t;
        game.hookedFish.el.style.transform = `rotate(${deg}deg)`;
      }
    }
    updateRodAndHook(landX, landY);
    // 鱼跟着钩
    if (game.hookedFish && game.hookedFish.el) {
      game.hookedFish.el.style.left = (landX - game.hookedFish.width / 2 - 10) + 'px';
      game.hookedFish.el.style.top  = (landY - game.hookedFish.height / 2) + 'px';
      if (p > 0.7 && !game.hookedFish._splashed) {
        game.hookedFish._splashed = true;
        spawnSplash(landX, m.waterStartY + 2);
        spawnSplash(landX + 10, m.waterStartY + 10);
        audio.splash();
      }
    }
  }

  function lineBreak() {
    game.state = State.FAILED;
    audio.fail();
    showToast('💥 鱼线断了！', 'failed');
    if (game.hookedFish && game.hookedFish.el) {
      game.hookedFish.el.remove();
    }
    game.hookedFish = null;
    dom.game.tensionWrap.classList.remove('active');
    setTimeout(retrieveHook, 700);
  }

  function catchFish() {
    game.state = State.CAUGHT;
    const fish = game.hookedFish;
    if (!fish) return;

    // 分数 (根据重量加成)
    const type = fish.type;
    const weightBonus = Math.floor((fish.weight / type.maxWeight) * 0.5 * type.score);
    const totalScore = type.score + weightBonus;
    game.score += totalScore;
    game.fishCount++;
    game.biggestFish = Math.max(game.biggestFish, fish.weight);
    game.basket.push({
      typeId: fish.typeId,
      name: type.name,
      color: type.color,
      weight: fish.weight,
      score: totalScore
    });

    audio.caught();
    showToast(`🎣 ${type.name} ${fish.weight.toFixed(1)}kg +${totalScore}`, 'caught', 1700);

    // 更新HUD
    updateHUD();

    // 大鱼展示
    showBigFishAnimation(fish, totalScore);

    // 清理 & 重置
    if (fish.el) fish.el.remove();
    game.hookedFish = null;
    dom.game.tensionWrap.classList.remove('active');

    setTimeout(() => {
      retrieveHook();
      addTotalFish(1);
    }, 900);
  }

  function showBigFishAnimation(fish, score) {
    const m = getStageMetrics();
    const el = document.createElement('div');
    el.className = 'big-fish-show';
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '45%';
    el.style.transform = 'translate(-50%,-50%) scale(0.4)';
    el.style.opacity = '0';
    el.style.transition = 'all 0.35s cubic-bezier(.2,1.4,.4,1)';
    el.style.zIndex = 25;
    el.style.textAlign = 'center';
    el.style.pointerEvents = 'none';

    const body = document.createElement('div');
    body.style.display = 'inline-block';
    body.style.position = 'relative';
    const w = fish.width * 3;
    const h = fish.height * 3;
    body.innerHTML = `
      <div style="
        position:absolute;
        left: ${-w*0.3}px; top:50%;
        transform: translateY(-50%);
        width:0; height:0;
        border-style:solid;
        border-width: ${h*0.6}px ${w*0.4}px ${h*0.6}px 0;
        border-color: transparent ${fish.color} transparent transparent;
      "></div>
      <div style="
        width:${w}px; height:${h}px;
        background:${fish.color};
        border: 3px solid rgba(0,0,0,0.3);
        border-radius:50%;
        box-shadow: inset -4px -4px 0 rgba(0,0,0,0.1), inset 4px 4px 0 rgba(255,255,255,0.3);
        position:relative;
      ">
        <div style="position:absolute; left:12%; top:25%;
          font-size:${Math.floor(h*0.3)}px; line-height:1; color:#111;">●</div>
      </div>
      <div style="
        position:absolute; top: -${h*0.35}px; left:50%; transform: translateX(-50%);
        width:0; height:0;
        border-style:solid;
        border-width: 0 ${w*0.13}px ${h*0.4}px ${w*0.13}px;
        border-color: transparent transparent ${fish.color} transparent;
      "></div>
    `;
    el.appendChild(body);

    const name = document.createElement('div');
    name.style.marginTop = '10px';
    name.style.color = 'white';
    name.style.fontSize = '22px';
    name.style.fontWeight = '800';
    name.style.textShadow = '2px 2px 0 rgba(0,0,0,0.55)';
    name.textContent = `${fish.type.name} ${fish.weight.toFixed(1)}kg  +${score}`;
    el.appendChild(name);

    dom.game.fishDisplay.appendChild(el);
    // 入场
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '1';
    });
    setTimeout(() => {
      el.style.transform = 'translate(-50%,-50%) scale(1.15)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    }, 900);
  }

  // ===============================
  // 计时 / HUD
  // ===============================
  function fmtTime(ms) {
    if (ms < 0) ms = 0;
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }

  function updateHUD() {
    dom.game.hud.timer.textContent = fmtTime(game.timeLeft);
    dom.game.hud.score.textContent = String(game.score);
    dom.game.hud.fishCount.textContent = String(game.fishCount);
  }

  function startGameTimer() {
    stopGameTimer();
    const tick = () => {
      game.timeLeft -= 1000;
      if (game.timeLeft <= 10000 && game.timeLeft > 0) {
        dom.game.hud.timer.style.color = game.timeLeft % 2000 < 1000 ? '#e74c3c' : 'var(--primary-dark)';
      }
      updateHUD();
      if (game.timeLeft <= 0) {
        endGame();
      }
    };
    game.timerId = setInterval(tick, 1000);
  }
  function stopGameTimer() {
    if (game.timerId) clearInterval(game.timerId);
    game.timerId = null;
  }

  // ===============================
  // 主循环
  // ===============================
  function mainLoop(ts) {
    if (!game.lastFrameTs) game.lastFrameTs = ts;
    const dt = Math.min(0.1, (ts - game.lastFrameTs) / 1000);
    game.lastFrameTs = ts;

    // 鱼生成
    if (game.state === State.WAITING || game.state === State.CASTING || game.state === State.IDLE || game.state === State.BITE) {
      game.fishSpawnAcc += dt * 1000;
      if (game.fishSpawnAcc >= game.scene.fishSpawnInterval && game.fishes.length < game.scene.maxFish) {
        game.fishSpawnAcc = 0;
        spawnFish();
      }
    }
    updateFishes(dt);

    if (game.state === State.REELING) {
      updateReeling(dt, ts);
    }

    game.rafId = requestAnimationFrame(mainLoop);
  }

  // ===============================
  // 开始/结束游戏
  // ===============================
  function startGame() {
    // 重置
    game.state = State.IDLE;
    game.score = 0;
    game.fishCount = 0;
    game.biggestFish = 0;
    game.basket = [];
    game.timeLeft = GAME_DURATION;
    game.fishes = [];
    game.hookedFish = null;
    game.tension = 0;
    game.reelingProgress = 0;
    game.fishSpawnAcc = 0;

    clearAllFishes();
    dom.game.fishLayer.innerHTML = '';
    dom.game.fishDisplay.innerHTML = '';
    dom.game.tensionWrap.classList.remove('active');
    dom.game.btnCast.disabled = false;
    dom.game.btnReel.disabled = true;
    dom.game.hud.timer.style.color = 'var(--primary-dark)';

    updateFishermanHat();
    applyScene();
    resetHookToRod();
    updateHUD();

    showScreen('game');

    // 强制回流一次以获得准确尺寸
    requestAnimationFrame(() => {
      resetHookToRod();
      startGameTimer();
      game.lastFrameTs = 0;
      if (game.rafId) cancelAnimationFrame(game.rafId);
      game.rafId = requestAnimationFrame(mainLoop);
    });
  }

  function endGame() {
    stopGameTimer();
    if (game.rafId) cancelAnimationFrame(game.rafId);
    game.rafId = null;

    // 保存最高分
    setBestScore(game.score);

    // 构建结算
    dom.result.score.textContent = String(game.score);
    dom.result.fishCount.textContent = String(game.fishCount);
    dom.result.biggest.textContent = game.biggestFish.toFixed(1) + ' kg';

    const nameInput = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
    dom.result.playerName.value = nameInput;

    // 鱼篓
    const list = dom.result.basket;
    list.innerHTML = '';
    if (game.basket.length === 0) {
      list.innerHTML = '<div class="basket-empty">😅 这次没钓到鱼，下次加油！</div>';
    } else {
      game.basket.forEach(item => {
        const row = document.createElement('div');
        row.className = 'basket-item';
        row.innerHTML = `
          <div class="bi-icon" style="background:${item.color}"></div>
          <div class="bi-info">
            <div class="bi-name">${item.name}</div>
            <div class="bi-detail">${item.weight.toFixed(2)} kg</div>
          </div>
          <div class="bi-score">+${item.score}</div>
        `;
        list.appendChild(row);
      });
    }

    showScreen('result');
  }

  // ===============================
  // 排行榜
  // ===============================
  async function fetchLeaderboard() {
    const list = dom.leaderboard.list;
    list.innerHTML = '<div class="loading">加载中...</div>';
    try {
      const res = await fetch('/api/fishing/leaderboard?limit=50');
      const json = await res.json();
      if (json.code !== 0 || !json.data) throw new Error(json.message || '加载失败');
      const items = json.data.items || [];
      list.innerHTML = `
        <div class="lb-row head">
          <div>#</div><div>玩家</div><div class="lb-score">分数</div>
          <div class="lb-fc">鱼数</div><div class="lb-date">日期</div>
        </div>
      `;
      if (items.length === 0) {
        const r = document.createElement('div');
        r.className = 'lb-row';
        r.style.gridColumn = '1/-1';
        r.style.justifyContent = 'center';
        r.style.color = 'var(--text-light)';
        r.style.textAlign = 'center';
        r.style.display = 'block';
        r.style.padding = '24px';
        r.textContent = '还没有记录，快来第一个上榜！';
        list.appendChild(r);
        return;
      }
      items.forEach((it, idx) => {
        const rank = idx + 1;
        let rankCls = '';
        let rankTxt = rank;
        if (rank === 1) { rankCls = 'gold'; rankTxt = '🥇'; }
        else if (rank === 2) { rankCls = 'silver'; rankTxt = '🥈'; }
        else if (rank === 3) { rankCls = 'bronze'; rankTxt = '🥉'; }
        const d = (it.created_at || '').slice(0, 10);
        const row = document.createElement('div');
        row.className = 'lb-row';
        row.innerHTML = `
          <div class="lb-rank ${rankCls}">${rankTxt}</div>
          <div class="lb-name" title="${escapeHtml(it.player_name)}">${escapeHtml(it.player_name)}</div>
          <div class="lb-score">${it.score}</div>
          <div class="lb-fc">${it.fish_count}</div>
          <div class="lb-date">${d}</div>
        `;
        list.appendChild(row);
      });
    } catch (e) {
      list.innerHTML = `<div class="loading" style="color:#e74c3c">加载失败: ${e.message}</div>`;
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  async function submitScore() {
    const name = (dom.result.playerName.value || '').trim() || '匿名玩家';
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);

    try {
      const res = await fetch('/api/fishing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: name,
          score: game.score,
          fish_count: game.fishCount,
          biggest_fish: +game.biggestFish.toFixed(2)
        })
      });
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.message || '提交失败');
      showToast('✅ 成绩已提交！', 'caught', 1800);
      setTimeout(() => {
        dom.leaderboard.modal.classList.add('active');
        fetchLeaderboard();
      }, 900);
    } catch (e) {
      showToast('❌ 提交失败: ' + e.message, 'failed', 2000);
    }
  }

  // ===============================
  // 事件绑定
  // ===============================
  function bindEvents() {
    // 开始界面
    dom.start.btnStart.addEventListener('click', () => {
      const name = dom.start.playerName.value.trim();
      if (name) localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
      audio.ensure();
      startGame();
    });
    dom.start.btnLeaderboard.addEventListener('click', () => {
      dom.leaderboard.modal.classList.add('active');
      fetchLeaderboard();
    });

    // 结算界面
    dom.result.btnSubmit.addEventListener('click', submitScore);
    dom.result.btnLeaderboard.addEventListener('click', () => {
      dom.leaderboard.modal.classList.add('active');
      fetchLeaderboard();
    });
    dom.result.btnHome.addEventListener('click', () => {
      dom.start.totalFish.textContent = String(getTotalFish());
      dom.start.bestScore.textContent = String(getBestScore());
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (saved) dom.start.playerName.value = saved;
      renderSceneSelect();
      showScreen('start');
    });

    // 排行榜
    dom.leaderboard.btnClose.addEventListener('click', () => {
      dom.leaderboard.modal.classList.remove('active');
    });
    dom.leaderboard.modal.addEventListener('click', (e) => {
      if (e.target === dom.leaderboard.modal) {
        dom.leaderboard.modal.classList.remove('active');
      }
    });

    // 抛竿 - 支持鼠标/触摸长按
    const castEl = dom.game.btnCast;
    const startCharge = (e) => {
      e.preventDefault();
      if (game.state !== State.IDLE) return;
      audio.ensure();
      startCharging();
    };
    const endCharge = (e) => {
      e.preventDefault();
      if (game.state === State.CHARGING) releaseCast();
    };
    castEl.addEventListener('mousedown', startCharge);
    window.addEventListener('mouseup', endCharge);
    castEl.addEventListener('touchstart', startCharge, { passive: false });
    window.addEventListener('touchend', endCharge, { passive: false });

    // 收竿按钮
    dom.game.btnReel.addEventListener('click', () => {
      if (game.state === State.BITE) handleReel();
    });

    // 键盘
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (dom.screens.game.classList.contains('active')) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          if (game.state === State.BITE) handleReel();
        }
        if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleReelKey(true);
        }
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleReelKey(false);
        }
      }
    });

    // 触摸：在拉鱼阶段左/右半屏点击当左右键
    let touchSideMap = new Map();
    dom.game.stage.addEventListener('touchstart', (e) => {
      if (game.state !== State.REELING) return;
      e.preventDefault();
      const rect = dom.game.stage.getBoundingClientRect();
      for (const t of e.changedTouches) {
        const x = t.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        touchSideMap.set(t.identifier, isLeft);
        handleReelKey(isLeft);
      }
    }, { passive: false });
    dom.game.stage.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) touchSideMap.delete(t.identifier);
    });

    // 窗口变化：重置位置
    window.addEventListener('resize', () => {
      if (game.state === State.IDLE) resetHookToRod();
    });
  }

  // ===============================
  // 初始化
  // ===============================
  function init() {
    // 初始值填充
    dom.start.totalFish.textContent = String(getTotalFish());
    dom.start.bestScore.textContent = String(getBestScore());
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    if (saved) dom.start.playerName.value = saved;

    renderSceneSelect();
    bindEvents();
    updateFishermanHat();
    resetHookToRod();

    // 确保渔夫帽子初始化
    updateFishermanHat();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

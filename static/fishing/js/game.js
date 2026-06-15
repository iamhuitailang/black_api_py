(() => {
  'use strict';

  const FISH_TYPES = {
    crucian: {
      id: 'crucian', name: '鲫鱼', color: '#b8a070', colorLight: '#d4c49a',
      minWeight: 0.5, maxWeight: 2, score: 10,
      struggleBase: 0, struggleChance: 0, struggleInterval: 9999,
      pullStrength: 2.5, tensionDecay: 1.2
    },
    carp: {
      id: 'carp', name: '鲤鱼', color: '#c85030', colorLight: '#e08060',
      minWeight: 2, maxWeight: 5, score: 25,
      struggleBase: 18, struggleChance: 0.35, struggleInterval: 5,
      pullStrength: 1.8, tensionDecay: 1.5
    },
    grass: {
      id: 'grass', name: '草鱼', color: '#6aa84a', colorLight: '#90c870',
      minWeight: 3, maxWeight: 8, score: 50,
      struggleBase: 20, struggleChance: 0.7, struggleInterval: 3,
      pullStrength: 1.4, tensionDecay: 1.8
    },
    bass: {
      id: 'bass', name: '鲈鱼', color: '#5080b0', colorLight: '#78a8d0',
      minWeight: 1, maxWeight: 3, score: 80,
      struggleBase: 28, struggleChance: 0.9, struggleInterval: 2.2,
      pullStrength: 2.2, tensionDecay: 2.5
    },
    arowana: {
      id: 'arowana', name: '金龙鱼', color: '#f0c040', colorLight: '#f8dc80',
      minWeight: 5, maxWeight: 10, score: 200,
      struggleBase: 26, struggleChance: 1.0, struggleInterval: 2,
      pullStrength: 1.1, tensionDecay: 3.2,
      bigStruggles: 2, bigStruggleAmount: 35
    }
  };

  const FISH_WEIGHTS = [
    ['crucian', 0.40], ['carp', 0.30], ['grass', 0.20],
    ['bass', 0.08], ['arowana', 0.02]
  ];

  const SCENES = {
    pond: {
      id: 'pond', name: '池塘', icon: '🌿', cssClass: 'scene-pond',
      unlockFish: 10,
      castDistance: { min: 0.25, max: 0.55 },
      chargeMaxMs: 1800, hookSinkMs: 1400,
      fishPool: ['crucian', 'carp'],
      fishSpawnInterval: 1400, maxFish: 6
    },
    river: {
      id: 'river', name: '河流', icon: '🌉', cssClass: 'scene-river',
      unlockFish: 30,
      castDistance: { min: 0.35, max: 0.75 },
      chargeMaxMs: 2000, hookSinkMs: 1800,
      fishPool: ['crucian', 'carp', 'grass'],
      fishSpawnInterval: 1100, maxFish: 8
    },
    ocean: {
      id: 'ocean', name: '深海', icon: '⛰️', cssClass: 'scene-ocean',
      unlockFish: Infinity,
      castDistance: { min: 0.45, max: 0.95 },
      chargeMaxMs: 2500, hookSinkMs: 2400,
      fishPool: ['crucian', 'carp', 'grass', 'bass', 'arowana'],
      fishSpawnInterval: 900, maxFish: 10
    }
  };

  const BITE_WINDOW_MS = 1500;
  const GAME_DURATION = 3 * 60 * 1000;
  const DANGER_TENSION = 80;
  const MAX_TENSION = 100;
  const STORAGE_KEYS = {
    TOTAL_FISH: 'fishing.totalFish',
    BEST_SCORE: 'fishing.bestScore',
    PLAYER_NAME: 'fishing.playerName',
    GAME_STATE: 'fishing.gameState'
  };

  const State = {
    IDLE: 'idle', CHARGING: 'charging', CASTING: 'casting',
    WAITING: 'waiting', BITE: 'bite', REELING: 'reeling',
    CAUGHT: 'caught', FAILED: 'failed'
  };

  const game = {
    state: State.IDLE,
    scene: SCENES.pond,
    score: 0, fishCount: 0, biggestFish: 0,
    basket: [],
    timeLeft: GAME_DURATION,
    timerId: null, rafId: null,
    chargeStart: 0, chargeTimerId: null,
    biteDeadline: 0, biteTimerId: null,
    hookedFish: null,
    fishes: [], fishSpawnAcc: 0, lastFrameTs: 0,
    tension: 0,
    reelingKeyBuffer: { left: 0, right: 0 },
    lastReelKey: null,
    reelingStruggle: null, reelingBigStruggles: 0,
    nextStruggleAt: 0, reelingProgress: 0,
    hookPos: { x: 0, y: 0 },
    hookStartPos: { x: 0, y: 0 },
    hookTargetPos: { x: 0, y: 0 },
    castProgress: 0
  };

  const $ = (sel) => document.querySelector(sel);
  const dom = {
    screens: {
      start: $('#start-screen'), game: $('#game-screen'), result: $('#result-screen')
    },
    start: {
      sceneList: $('#scene-list'), playerName: $('#player-name'),
      totalFish: $('#total-fish'), bestScore: $('#best-score'),
      btnStart: $('#btn-start'), btnLeaderboard: $('#btn-show-leaderboard'),
      nameError: $('#name-error'), btnResume: $('#btn-resume')
    },
    game: {
      hud: {
        timer: $('#timer'), score: $('#score'),
        fishCount: $('#fish-count'), sceneName: $('#current-scene-name')
      },
      stage: $('#game-stage'), bg: $('#bg-layer'),
      fisherman: $('#fisherman'), rod: $('#fishing-rod'),
      line: $('#fishing-line'), hook: $('#hook'),
      float: $('#float'), splashes: $('#splashes'),
      fishLayer: $('#fish-layer'), fishDisplay: $('#fish-display'),
      tensionWrap: $('#tension-wrap'), tensionFill: $('#tension-fill'),
      tensionHint: $('.tension-hint'), toast: $('#bubble-toast'),
      btnCast: $('#btn-cast'), btnReel: $('#btn-reel')
    },
    result: {
      score: $('#result-score'), fishCount: $('#result-fish-count'),
      biggest: $('#result-biggest'), basket: $('#basket-list'),
      playerName: $('#result-player-name'), btnSubmit: $('#btn-submit-score'),
      btnLeaderboard: $('#btn-show-leaderboard2'), btnHome: $('#btn-back-home')
    },
    leaderboard: {
      modal: $('#leaderboard-modal'), list: $('#leaderboard-list'),
      btnClose: $('#btn-close-leaderboard')
    }
  };

  const rand = (min, max) => Math.random() * (max - min) + min;
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

  function saveGameState() {
    const data = {
      sceneId: game.scene.id,
      gameState: game.state,
      score: game.score,
      fishCount: game.fishCount,
      biggestFish: game.biggestFish,
      basket: game.basket,
      timeLeft: game.timeLeft,
      hookX: game.hookPos.x,
      hookY: game.hookPos.y,
      playerName: localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '',
      ts: Date.now(),
      version: 2
    };
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function loadGameState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.sceneId || data.timeLeft === undefined) return null;
      if (!data.playerName || !data.playerName.trim()) return null;
      if (data.timeLeft <= 0) {
        clearGameState();
        return null;
      }
      const elapsed = Date.now() - (data.ts || 0);
      if (elapsed > GAME_DURATION + 60000) {
        clearGameState();
        return null;
      }
      // 游戏进行中时，扣除离线流逝的时间
      if (data.gameState && data.gameState !== 'idle') {
        data.timeLeft = Math.max(1000, data.timeLeft - elapsed);
      }
      return data;
    } catch (e) { return null; }
  }

  function clearGameState() {
    try { localStorage.removeItem(STORAGE_KEYS.GAME_STATE); } catch (e) { /* ignore */ }
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
    el._timer = setTimeout(() => { el.classList.remove('show'); }, duration);
  }

  const audio = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.ctx = null; }
      }
      return this.ctx;
    },
    beep(freq = 440, dur = 0.1, type = 'sine', vol = 0.2) {
      const ctx = this.ensure(); if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur);
    },
    splash() {
      this.beep(260, 0.08, 'triangle', 0.12);
      setTimeout(() => this.beep(200, 0.1, 'sine', 0.1), 40);
    },
    bite() {
      for (let i = 0; i < 3; i++)
        setTimeout(() => this.beep(180 + i * 40, 0.06, 'square', 0.18), i * 60);
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

  function getStageMetrics() {
    const stage = dom.game.stage;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    return {
      w, h,
      waterStartY: h * 0.52,
      waterBottomY: h,
      rodTipX: w * 0.20,
      rodTipY: h * 0.34
    };
  }

  function updateFishermanHat() {
    let hat = dom.game.fisherman.querySelector('.hat');
    if (!hat) {
      hat = document.createElement('div');
      hat.className = 'hat';
      dom.game.fisherman.appendChild(hat);
    }
  }

  function renderSceneSelect() {
    const total = getTotalFish();
    dom.start.sceneList.innerHTML = '';
    Object.values(SCENES).forEach(scene => {
      const locked = scene.id !== 'pond' && total < scene.unlockFish;
      const card = document.createElement('div');
      card.className = `scene-card ${locked ? 'locked' : ''} ${game.scene.id === scene.id ? 'selected' : ''}`;
      card.dataset.scene = scene.id;
      let reqText = '';
      if (locked) reqText = `需钓 ${scene.unlockFish} 条鱼（${total}/${scene.unlockFish}）`;
      else if (scene.unlockFish < Infinity) reqText = '已解锁 ✓';
      else if (scene.id === 'pond') reqText = '初始场景';
      else reqText = '高级场景';
      card.innerHTML = `
        <span class="sc-icon">${scene.icon}</span>
        <span class="sc-name">${scene.name}</span>
        <span class="sc-req">${reqText}</span>
        ${locked ? '<span class="lock-badge">🔒</span>' : ''}
      `;
      if (!locked) {
        card.addEventListener('click', () => { game.scene = scene; renderSceneSelect(); });
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

  function updateRodAndHook(x, y) {
    const m = getStageMetrics();
    const tipX = m.rodTipX;
    const tipY = m.rodTipY;
    game.hookPos.x = x;
    game.hookPos.y = y;

    dom.game.hook.style.left = (x - 6) + 'px';
    dom.game.hook.style.top = (y - 8) + 'px';

    const dx = x - tipX;
    const dy = y - tipY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    dom.game.line.style.left = tipX + 'px';
    dom.game.line.style.top = tipY + 'px';
    dom.game.line.style.width = len + 'px';
    dom.game.line.style.height = '3px';
    dom.game.line.style.transform = `rotate(${ang}deg)`;

    if (y >= m.waterStartY) {
      const t = (m.waterStartY - tipY) / (y - tipY);
      const fx = tipX + (x - tipX) * clamp(t, 0, 1);
      dom.game.float.style.left = (fx - 10) + 'px';
      dom.game.float.style.top = (m.waterStartY - 20) + 'px';
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

  function spawnSplash(x, y) {
    const s = document.createElement('div');
    s.className = 'splash';
    s.style.left = x + 'px'; s.style.top = y + 'px';
    dom.game.splashes.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  // ===============================
  // SVG 鱼绘制
  // ===============================
  function createFishSVG(fishData) {
    const w = fishData.width;
    const h = fishData.height;
    const color = fishData.color;
    const colorLight = fishData.colorLight || lightenColor(color, 30);
    const colorDark = lightenColor(color, -20);
    const flip = fishData.dir < 0;

    const svgW = w * 1.5;
    const svgH = h * 1.8;
    const bodyCx = svgW * 0.58;
    const bodyCy = svgH * 0.5;
    const bodyRx = w * 0.48;
    const bodyRy = h * 0.42;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}`);
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', svgH);
    svg.style.overflow = 'visible';
    svg.style.display = 'block';

    if (flip) svg.style.transform = 'scaleX(-1)';

    // ========== 尾巴组（用于摆动动画） ==========
    const tailG = document.createElementNS(ns, 'g');
    tailG.classList.add('fish-tail-group');
    const tailPivotX = bodyCx - bodyRx * 0.85;
    tailG.setAttribute('transform-origin', `${tailPivotX}px ${bodyCy}px`);

    // 尾巴上半叶
    const tailTopPath = document.createElementNS(ns, 'path');
    const topTipX = tailPivotX - bodyRx * 0.65;
    const topTipY = bodyCy - bodyRy * 1.25;
    const topMidX = tailPivotX - bodyRx * 0.25;
    const topMidY = bodyCy - bodyRy * 0.8;
    const topBaseY = bodyCy - bodyRy * 0.25;
    tailTopPath.setAttribute('d', [
      `M ${tailPivotX},${topBaseY}`,
      `C ${tailPivotX - bodyRx * 0.08},${bodyCy - bodyRy * 0.5} ${topMidX},${topMidY - bodyRy * 0.1} ${topTipX},${topTipY}`,
      `Q ${topTipX + bodyRx * 0.05},${topTipY + bodyRy * 0.25} ${topMidX + bodyRx * 0.05},${topMidY + bodyRy * 0.15}`,
      `C ${tailPivotX - bodyRx * 0.05},${topBaseY - bodyRy * 0.1} ${tailPivotX},${topBaseY} ${tailPivotX},${topBaseY}`,
      'Z'
    ].join(' '));
    tailTopPath.setAttribute('fill', color);
    tailTopPath.setAttribute('opacity', '0.92');

    // 尾巴下半叶
    const tailBotPath = document.createElementNS(ns, 'path');
    const botTipX = tailPivotX - bodyRx * 0.65;
    const botTipY = bodyCy + bodyRy * 1.25;
    const botMidX = tailPivotX - bodyRx * 0.25;
    const botMidY = bodyCy + bodyRy * 0.8;
    const botBaseY = bodyCy + bodyRy * 0.25;
    tailBotPath.setAttribute('d', [
      `M ${tailPivotX},${botBaseY}`,
      `C ${tailPivotX - bodyRx * 0.08},${bodyCy + bodyRy * 0.5} ${botMidX},${botMidY + bodyRy * 0.1} ${botTipX},${botTipY}`,
      `Q ${botTipX + bodyRx * 0.05},${botTipY - bodyRy * 0.25} ${botMidX + bodyRx * 0.05},${botMidY - bodyRy * 0.15}`,
      `C ${tailPivotX - bodyRx * 0.05},${botBaseY + bodyRy * 0.1} ${tailPivotX},${botBaseY} ${tailPivotX},${botBaseY}`,
      'Z'
    ].join(' '));
    tailBotPath.setAttribute('fill', color);
    tailBotPath.setAttribute('opacity', '0.92');

    // 尾巴中骨（分叉间的连接）
    const tailMid = document.createElementNS(ns, 'path');
    tailMid.setAttribute('d', [
      `M ${tailPivotX},${topBaseY}`,
      `Q ${tailPivotX - bodyRx * 0.3},${bodyCy} ${tailPivotX},${botBaseY}`,
      'Z'
    ].join(' '));
    tailMid.setAttribute('fill', color);
    tailMid.setAttribute('opacity', '0.7');

    // 尾鳍纹路（3条）
    const finLines = [0.3, 0, -0.3];
    finLines.forEach(ratio => {
      const line = document.createElementNS(ns, 'path');
      const ly = bodyCy + ratio * bodyRy;
      const tipX = tailPivotX - bodyRx * 0.55;
      const tipY = bodyCy + ratio * bodyRy * 1.4;
      line.setAttribute('d', [
        `M ${tailPivotX - bodyRx * 0.1},${ly}`,
        `Q ${tailPivotX - bodyRx * 0.35},${ly + ratio * bodyRy * 0.3} ${tipX},${tipY}`
      ].join(' '));
      line.setAttribute('stroke', colorLight);
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('fill', 'none');
      line.setAttribute('opacity', '0.45');
      tailG.appendChild(line);
    });

    tailG.appendChild(tailBotPath);
    tailG.appendChild(tailMid);
    tailG.appendChild(tailTopPath);
    svg.appendChild(tailG);

    // ========== 身体 ==========
    const body = document.createElementNS(ns, 'ellipse');
    body.setAttribute('cx', bodyCx);
    body.setAttribute('cy', bodyCy);
    body.setAttribute('rx', bodyRx);
    body.setAttribute('ry', bodyRy);
    body.setAttribute('fill', color);
    body.setAttribute('stroke', colorDark);
    body.setAttribute('stroke-width', '1.5');
    svg.appendChild(body);

    // 腹部高光
    const belly = document.createElementNS(ns, 'ellipse');
    belly.setAttribute('cx', bodyCx + bodyRx * 0.05);
    belly.setAttribute('cy', bodyCy + bodyRy * 0.38);
    belly.setAttribute('rx', bodyRx * 0.7);
    belly.setAttribute('ry', bodyRy * 0.42);
    belly.setAttribute('fill', colorLight);
    belly.setAttribute('opacity', '0.4');
    svg.appendChild(belly);

    // 侧线（鱼身中线）
    const sideLine = document.createElementNS(ns, 'path');
    sideLine.setAttribute('d', [
      `M ${bodyCx - bodyRx * 0.7},${bodyCy}`,
      `Q ${bodyCx},${bodyCy + bodyRy * 0.02} ${bodyCx + bodyRx * 0.7},${bodyCy}`
    ].join(' '));
    sideLine.setAttribute('stroke', colorDark);
    sideLine.setAttribute('stroke-width', '1');
    sideLine.setAttribute('fill', 'none');
    sideLine.setAttribute('opacity', '0.35');
    svg.appendChild(sideLine);

    // 背鳍
    const dorsal = document.createElementNS(ns, 'path');
    const dorsalStartX = bodyCx - bodyRx * 0.25;
    const dorsalPeakX = bodyCx + bodyRx * 0.02;
    const dorsalPeakY = bodyCy - bodyRy - bodyRy * 0.5;
    const dorsalEndX = bodyCx + bodyRx * 0.32;
    dorsal.setAttribute('d', [
      `M ${dorsalStartX},${bodyCy - bodyRy * 0.85}`,
      `C ${dorsalStartX + bodyRx * 0.1},${dorsalPeakY + bodyRy * 0.2} ${dorsalPeakX - bodyRx * 0.05},${dorsalPeakY} ${dorsalPeakX},${dorsalPeakY}`,
      `C ${dorsalPeakX + bodyRx * 0.05},${dorsalPeakY + bodyRy * 0.1} ${dorsalEndX - bodyRx * 0.05},${bodyCy - bodyRy * 0.55} ${dorsalEndX},${bodyCy - bodyRy * 0.78}`,
      'Z'
    ].join(' '));
    dorsal.setAttribute('fill', color);
    dorsal.setAttribute('stroke', colorDark);
    dorsal.setAttribute('stroke-width', '1');
    dorsal.setAttribute('opacity', '0.88');
    svg.appendChild(dorsal);

    // 胸鳍（侧面）
    const pFin = document.createElementNS(ns, 'path');
    const pfx = bodyCx + bodyRx * 0.12;
    const pfy = bodyCy + bodyRy * 0.25;
    pFin.setAttribute('d', [
      `M ${pfx},${pfy}`,
      `C ${pfx + bodyRx * 0.08},${pfy + bodyRy * 0.55} ${pfx - bodyRx * 0.18},${pfy + bodyRy * 0.55} ${pfx - bodyRx * 0.22},${pfy + bodyRy * 0.2}`,
      'Z'
    ].join(' '));
    pFin.setAttribute('fill', color);
    pFin.setAttribute('opacity', '0.72');
    svg.appendChild(pFin);

    // 腹鳍
    const vFin = document.createElementNS(ns, 'path');
    const vfx = bodyCx - bodyRx * 0.05;
    const vfy = bodyCy + bodyRy * 0.7;
    vFin.setAttribute('d', [
      `M ${vfx},${vfy}`,
      `Q ${vfx - bodyRx * 0.02},${vfy + bodyRy * 0.35} ${vfx - bodyRx * 0.18},${vfy + bodyRy * 0.45}`,
      `Q ${vfx - bodyRx * 0.05},${vfy + bodyRy * 0.15} ${vfx},${vfy}`,
      'Z'
    ].join(' '));
    vFin.setAttribute('fill', color);
    vFin.setAttribute('opacity', '0.65');
    svg.appendChild(vFin);

    // 鳃盖
    const gill = document.createElementNS(ns, 'path');
    const gx = bodyCx + bodyRx * 0.35;
    gill.setAttribute('d', [
      `M ${gx},${bodyCy - bodyRy * 0.5}`,
      `Q ${gx + bodyRx * 0.08},${bodyCy} ${gx},${bodyCy + bodyRy * 0.5}`
    ].join(' '));
    gill.setAttribute('stroke', colorDark);
    gill.setAttribute('stroke-width', '1');
    gill.setAttribute('fill', 'none');
    gill.setAttribute('opacity', '0.45');
    svg.appendChild(gill);

    // 眼白
    const eyeX = bodyCx + bodyRx * 0.52;
    const eyeY = bodyCy - bodyRy * 0.18;
    const eyeR = Math.max(3, bodyRy * 0.22);
    const eyeWhite = document.createElementNS(ns, 'circle');
    eyeWhite.setAttribute('cx', eyeX);
    eyeWhite.setAttribute('cy', eyeY);
    eyeWhite.setAttribute('r', eyeR);
    eyeWhite.setAttribute('fill', 'white');
    eyeWhite.setAttribute('stroke', colorDark);
    eyeWhite.setAttribute('stroke-width', '1');
    svg.appendChild(eyeWhite);

    // 瞳孔
    const pupil = document.createElementNS(ns, 'circle');
    pupil.setAttribute('cx', eyeX + eyeR * 0.25);
    pupil.setAttribute('cy', eyeY);
    pupil.setAttribute('r', eyeR * 0.58);
    pupil.setAttribute('fill', '#1a1a1a');
    svg.appendChild(pupil);

    // 眼睛高光
    const highlight = document.createElementNS(ns, 'circle');
    highlight.setAttribute('cx', eyeX + eyeR * 0.4);
    highlight.setAttribute('cy', eyeY - eyeR * 0.28);
    highlight.setAttribute('r', eyeR * 0.22);
    highlight.setAttribute('fill', 'white');
    svg.appendChild(highlight);

    // 嘴巴
    const mouth = document.createElementNS(ns, 'path');
    const mx = bodyCx + bodyRx * 0.85;
    const my = bodyCy + bodyRy * 0.12;
    mouth.setAttribute('d', [
      `M ${mx},${my}`,
      `Q ${mx + bodyRx * 0.06},${my + bodyRy * 0.1} ${mx - bodyRx * 0.04},${my + bodyRy * 0.16}`
    ].join(' '));
    mouth.setAttribute('stroke', colorDark);
    mouth.setAttribute('stroke-width', '1.2');
    mouth.setAttribute('fill', 'none');
    mouth.setAttribute('opacity', '0.6');
    svg.appendChild(mouth);

    // 鱼鳞（几片弧形，装饰用）
    for (let i = 0; i < 3; i++) {
      const scale = document.createElementNS(ns, 'path');
      const sx = bodyCx - bodyRx * 0.35 + i * bodyRx * 0.18;
      const sy = bodyCy + bodyRy * 0.05;
      scale.setAttribute('d', `M ${sx - bodyRx * 0.08},${sy} Q ${sx},${sy + bodyRy * 0.18} ${sx + bodyRx * 0.08},${sy}`);
      scale.setAttribute('stroke', colorLight);
      scale.setAttribute('stroke-width', '1');
      scale.setAttribute('fill', 'none');
      scale.setAttribute('opacity', '0.35');
      svg.appendChild(scale);
    }

    const wrapper = document.createElement('div');
    wrapper.className = `fish ${fishData.dir > 0 ? 'fish-right' : 'fish-left'} swimming`;
    wrapper.appendChild(svg);
    return wrapper;
  }

  function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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
    const speed = (20 + sizeK * 12 + Math.random() * 18) * dir;

    const f = {
      id: Math.random().toString(36).slice(2),
      typeId, type, weight, color: type.color,
      colorLight: type.colorLight,
      width, height, x, y, dir, speed, sizeK,
      biteInited: false, el: null
    };
    f.el = createFishSVG(f);
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
      f.y += Math.sin((performance.now() / 400) + i * 1.3) * 12 * dtSec;
      f.y = clamp(f.y, m.waterStartY + 6, m.waterBottomY - f.height - 4);

      if ((f.dir > 0 && f.x > m.w + 40) || (f.dir < 0 && f.x < -f.width - 40)) {
        f.el.remove(); game.fishes.splice(i, 1); continue;
      }
      f.el.style.left = f.x + 'px';
      f.el.style.top = f.y + 'px';

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
    const arcHeight = 60 + chargeRatio * 40;

    const animate = (now) => {
      const t = clamp((now - startTime) / castDuration, 0, 1);
      const x = startX + (targetX - startX) * t;
      const linY = startY + (targetY - startY) * t;
      const arc = -4 * arcHeight * t * (1 - t);
      const y = linY + arc;
      updateRodAndHook(x, y);

      if (y >= m.waterStartY && !game._splashCast) {
        game._splashCast = true;
        spawnSplash(x, m.waterStartY + 2);
        audio.splash();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        game._splashCast = false;
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

    dom.game.float.classList.add('settling');
    setTimeout(() => dom.game.float.classList.remove('settling'), 1000);

    const animate = (now) => {
      const t = clamp((now - startTime) / duration, 0, 1);
      const y = startY + (targetBottomY - startY) * t;
      updateRodAndHook(startX, y);
      if (t < 1) requestAnimationFrame(animate);
      else enterWaiting();
    };
    requestAnimationFrame(animate);
  }

  function enterWaiting() {
    game.state = State.WAITING;
    dom.game.btnCast.disabled = true;
    dom.game.btnReel.disabled = true;
    saveGameState();
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
    dom.game.btnReel.textContent = '🪝 收竿';
    audio.bite();
    saveGameState(); // 立即保存上钩状态

    clearTimeout(game.biteTimerId);
    const tick = () => {
      if (game.state !== State.BITE) return;
      const left = game.biteDeadline - performance.now();
      if (left <= 0) { fishEscaped('超时未收竿!'); return; }
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
        dom.game.btnReel.textContent = '🪝 收竿';
        game._resumeNeedRetrieve = false;
        saveGameState();
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

    if (game.hookedFish && game.hookedFish.el) {
      game.hookedFish.el.classList.remove('swimming');
    }
  }

  function handleReelKey(isLeft) {
    if (game.state !== State.REELING) return;
    if (game.lastReelKey === (isLeft ? 'L' : 'R')) return;
    game.lastReelKey = isLeft ? 'L' : 'R';
    audio.reelStep();
    dom.game.fisherman.classList.remove('reeling');
    void dom.game.fisherman.offsetWidth;
    dom.game.fisherman.classList.add('reeling');
    setTimeout(() => dom.game.fisherman.classList.remove('reeling'), 400);

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
    if (!fish) return;
    const type = fish.type;

    let decay = type.tensionDecay * 8 * dtSec;
    if (game.reelingStruggle) decay = 0;
    game.tension = clamp(game.tension - decay, 0, MAX_TENSION);

    if (!game.reelingStruggle && now >= game.nextStruggleAt) {
      const chance = type.struggleChance;
      const isBig = type.bigStruggles && game.reelingBigStruggles < type.bigStruggles && Math.random() < 0.4;
      if (isBig || Math.random() < chance) {
        const amount = isBig ? (type.bigStruggleAmount || 35) : (type.struggleBase + rand(-4, 6));
        const dur = isBig ? 900 : 500;
        game.reelingStruggle = { amount, dur, start: now, applied: false };
        if (isBig) game.reelingBigStruggles++;
        dom.game.tensionHint.classList.add('struggling');
        dom.game.tensionHint.textContent = isBig ? '⚠️ 大挣扎！暂停按键！' : '💢 鱼在挣扎，注意张力！';
      } else {
        game.nextStruggleAt = now + (type.struggleInterval * 1000) * rand(0.7, 1.3);
      }
    }

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

    dom.game.tensionFill.style.width = game.tension + '%';
    dom.game.tensionFill.classList.toggle('danger', game.tension >= DANGER_TENSION);

    if (game.tension >= MAX_TENSION) { lineBreak(); return; }

    updateReelingFishPosition();

    if (game.reelingProgress >= 100) catchFish();
  }

  function updateReelingFishPosition() {
    const m = getStageMetrics();
    const p = game.reelingProgress / 100;
    const sx = game.hookedFish._biteX !== undefined ? game.hookedFish._biteX : game.hookPos.x;
    const sy = game.hookedFish._biteY !== undefined ? game.hookedFish._biteY : game.hookPos.y;
    if (game.hookedFish._biteX === undefined) {
      game.hookedFish._biteX = sx;
      game.hookedFish._biteY = sy;
    }

    const endX = m.rodTipX + 80;
    const endY = m.waterStartY - 40;
    const progressInWater = clamp(p / 0.7, 0, 1);
    const landX = sx + (endX - sx) * p;
    const waterExitY = Math.min(sy, m.waterStartY - 10);
    let landY;
    if (p < 0.7) {
      landY = sy + (waterExitY - sy) * progressInWater;
    } else {
      const t = (p - 0.7) / 0.3;
      landY = waterExitY + (endY - waterExitY) * t;
      if (game.hookedFish && game.hookedFish.el) {
        const deg = Math.sin(performance.now() / 80) * 30 * t;
        game.hookedFish.el.style.transform = `rotate(${deg}deg)`;
      }
    }
    updateRodAndHook(landX, landY);
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
    if (game.hookedFish && game.hookedFish.el) game.hookedFish.el.remove();
    game.hookedFish = null;
    dom.game.tensionWrap.classList.remove('active');
    setTimeout(retrieveHook, 700);
  }

  function catchFish() {
    game.state = State.CAUGHT;
    const fish = game.hookedFish;
    if (!fish) return;

    const type = fish.type;
    const weightBonus = Math.floor((fish.weight / type.maxWeight) * 0.5 * type.score);
    const totalScore = type.score + weightBonus;
    game.score += totalScore;
    game.fishCount++;
    game.biggestFish = Math.max(game.biggestFish, fish.weight);
    game.basket.push({
      typeId: fish.typeId, name: type.name,
      color: type.color, weight: fish.weight, score: totalScore
    });

    audio.caught();
    showToast(`🎣 ${type.name} ${fish.weight.toFixed(1)}kg +${totalScore}`, 'caught', 1700);
    updateHUD();
    showBigFishAnimation(fish, totalScore);

    if (fish.el) fish.el.remove();
    game.hookedFish = null;
    dom.game.tensionWrap.classList.remove('active');

    saveGameState();
    addTotalFish(1);

    setTimeout(() => { retrieveHook(); }, 900);
  }

  function showBigFishAnimation(fish, score) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(0.4);opacity:0;transition:all 0.35s cubic-bezier(.2,1.4,.4,1);z-index:25;text-align:center;pointer-events:none;`;

    const scale = 3;
    const w = fish.width * scale;
    const h = fish.height * scale;
    const color = fish.color;
    const colorLight = fish.colorLight || lightenColor(color, 30);

    const svgHtml = `<svg viewBox="0 0 100 60" width="${w}" height="${h}" style="overflow:visible;display:inline-block">
      <g class="fish-tail-group">
        <path d="M 18,30 C 12,18 5,8 2,5 Q 8,22 8,30 Q 8,38 2,55 C 5,52 12,42 18,30 Z" fill="${color}" opacity="0.9"/>
        <line x1="16" y1="24" x2="4" y2="10" stroke="${colorLight}" stroke-width="1.2" opacity="0.4"/>
        <line x1="16" y1="30" x2="4" y2="30" stroke="${colorLight}" stroke-width="1.2" opacity="0.4"/>
        <line x1="16" y1="36" x2="4" y2="50" stroke="${colorLight}" stroke-width="1.2" opacity="0.4"/>
      </g>
      <ellipse cx="52" cy="30" rx="38" ry="20" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
      <ellipse cx="52" cy="36" rx="28" ry="9" fill="${colorLight}" opacity="0.3"/>
      <path d="M 42,10 Q 50,2 58,10" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="1" opacity="0.85"/>
      <path d="M 56,40 Q 60,50 52,48" fill="${color}" opacity="0.7"/>
      <circle cx="70" cy="25" r="5" fill="white" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <circle cx="71" cy="25" r="2.8" fill="#1a1a1a"/>
      <circle cx="72" cy="24" r="1" fill="white"/>
      <path d="M 88,32 Q 90,34 88,37" stroke="rgba(0,0,0,0.25)" stroke-width="1" fill="none"/>
    </svg>`;

    el.innerHTML = `<div style="display:inline-block;position:relative">${svgHtml}</div>
      <div style="margin-top:10px;color:white;font-size:22px;font-weight:800;text-shadow:2px 2px 0 rgba(0,0,0,0.55)">${fish.type.name} ${fish.weight.toFixed(1)}kg  +${score}</div>`;

    dom.game.fishDisplay.appendChild(el);
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
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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
      saveGameState();
      if (game.timeLeft <= 0) endGame();
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

    // 每2秒保存一次状态，确保刷新不丢进度
    if (!game._lastSaveTs || ts - game._lastSaveTs > 2000) {
      if (game.state !== State.CAUGHT && game.state !== State.FAILED) {
        saveGameState();
      }
      game._lastSaveTs = ts;
    }

    game.rafId = requestAnimationFrame(mainLoop);
  }

  // ===============================
  // 开始/结束游戏
  // ===============================
  function startGame(savedData) {
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

    const isResume = !!savedData;
    let resumeHookPos = null;

    if (savedData) {
      game.scene = SCENES[savedData.sceneId] || SCENES.pond;
      game.score = savedData.score || 0;
      game.fishCount = savedData.fishCount || 0;
      game.biggestFish = savedData.biggestFish || 0;
      game.basket = savedData.basket || [];
      game.timeLeft = savedData.timeLeft || GAME_DURATION;
      // 如果之前鱼钩已抛出，恢复鱼钩位置
      if (savedData.gameState && savedData.gameState !== 'idle' && savedData.hookX && savedData.hookY) {
        resumeHookPos = { x: savedData.hookX, y: savedData.hookY };
      }
    }

    clearAllFishes();
    dom.game.fishLayer.innerHTML = '';
    dom.game.fishDisplay.innerHTML = '';
    dom.game.tensionWrap.classList.remove('active');
    dom.game.hud.timer.style.color = 'var(--primary-dark)';

    // 恢复游戏时：鱼钩在水下则收竿按钮可用，抛竿禁用
    if (isResume && resumeHookPos) {
      dom.game.btnCast.disabled = true;
      dom.game.btnReel.disabled = false;
      dom.game.btnReel.textContent = '🪝 收回鱼钩';
      game._resumeNeedRetrieve = true;
    } else {
      dom.game.btnCast.disabled = false;
      dom.game.btnReel.disabled = true;
      dom.game.btnReel.textContent = '🪝 收竿';
      game._resumeNeedRetrieve = false;
    }

    updateFishermanHat();
    applyScene();
    updateHUD();

    // 新游戏清存档，恢复游戏不清（继续保存）
    if (!isResume) {
      clearGameState();
      resetHookToRod();
    }

    showScreen('game');

    requestAnimationFrame(() => {
      if (isResume && resumeHookPos) {
        // 恢复鱼钩位置（水下状态）
        updateRodAndHook(resumeHookPos.x, resumeHookPos.y);
        // 给玩家恢复提示
        setTimeout(() => {
          const stateText = savedData.gameState === 'waiting' ? '等待鱼上钩中' : '准备抛竿';
          showToast(`✅ 已恢复进度：${game.score}分 · ${stateText}`, 'caught', 2500);
          saveGameState(); // 恢复后立即保存
        }, 500);
      } else {
        resetHookToRod();
      }
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
    clearGameState();

    setBestScore(game.score);

    dom.result.score.textContent = String(game.score);
    dom.result.fishCount.textContent = String(game.fishCount);
    dom.result.biggest.textContent = game.biggestFish.toFixed(1) + ' kg';

    const nameInput = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
    dom.result.playerName.value = nameInput;

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
        r.style.cssText = 'padding:24px;text-align:center;color:var(--text-light)';
        r.textContent = '还没有记录，快来第一个上榜！';
        list.appendChild(r); return;
      }
      items.forEach((it, idx) => {
        const rank = idx + 1;
        let rankCls = '', rankTxt = rank;
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
          player_name: name, score: game.score,
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

  function validatePlayerName() {
    const name = dom.start.playerName.value.trim();
    if (!name) {
      dom.start.playerName.classList.add('input-error');
      dom.start.nameError.classList.add('show');
      dom.start.playerName.focus();
      return null;
    }
    dom.start.playerName.classList.remove('input-error');
    dom.start.nameError.classList.remove('show');
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    return name;
  }

  // ===============================
  // 事件绑定
  // ===============================
  function bindEvents() {
    // 开始界面 - 名称校验
    dom.start.btnStart.addEventListener('click', () => {
      if (!validatePlayerName()) return;
      clearGameState();
      audio.ensure();
      startGame(null);
    });

    dom.start.playerName.addEventListener('input', () => {
      if (dom.start.playerName.value.trim()) {
        dom.start.playerName.classList.remove('input-error');
        dom.start.nameError.classList.remove('show');
      }
    });

    dom.start.playerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') dom.start.btnStart.click();
    });

    // 继续游戏
    dom.start.btnResume.addEventListener('click', () => {
      const saved = loadGameState();
      if (!saved) {
        dom.start.btnResume.style.display = 'none';
        return;
      }
      // 存档里有名字就用存档的，没有就校验输入框
      const savedName = saved.playerName && saved.playerName.trim();
      if (savedName) {
        dom.start.playerName.value = savedName;
        localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, savedName);
      } else {
        if (!validatePlayerName()) return;
      }
      audio.ensure();
      startGame(saved);
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
      checkResume();
      showScreen('start');
    });

    // 排行榜
    dom.leaderboard.btnClose.addEventListener('click', () => {
      dom.leaderboard.modal.classList.remove('active');
    });
    dom.leaderboard.modal.addEventListener('click', (e) => {
      if (e.target === dom.leaderboard.modal)
        dom.leaderboard.modal.classList.remove('active');
    });

    // 抛竿
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
      if (game.state === State.BITE) {
        handleReel();
      } else if (game._resumeNeedRetrieve && game.state === State.IDLE) {
        // 恢复游戏后收回鱼钩
        dom.game.btnReel.disabled = true;
        retrieveHook();
        game._resumeNeedRetrieve = false;
        setTimeout(() => {
          dom.game.btnReel.textContent = '🪝 收竿';
        }, 600);
      }
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
          e.preventDefault(); handleReelKey(true);
        }
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault(); handleReelKey(false);
        }
      }
    });

    // 触摸拉鱼
    dom.game.stage.addEventListener('touchstart', (e) => {
      if (game.state !== State.REELING) return;
      e.preventDefault();
      const rect = dom.game.stage.getBoundingClientRect();
      for (const t of e.changedTouches) {
        handleReelKey((t.clientX - rect.left) < rect.width / 2);
      }
    }, { passive: false });

    // 窗口变化
    window.addEventListener('resize', () => {
      if (game.state === State.IDLE) resetHookToRod();
    });

    // 页面关闭/刷新时保存状态
    window.addEventListener('beforeunload', () => {
      if (dom.screens.game.classList.contains('active') && game.timeLeft > 0) {
        saveGameState();
      }
    });

    // 页面可见性变化时保存
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && dom.screens.game.classList.contains('active') && game.timeLeft > 0) {
        saveGameState();
      }
    });
  }

  function checkResume() {
    const saved = loadGameState();
    if (saved) {
      dom.start.btnResume.style.display = '';
      dom.start.btnResume.textContent = `▶ 继续上次游戏（${SCENES[saved.sceneId]?.name || ''} · ${fmtTime(saved.timeLeft)} · ${saved.score}分）`;
    } else {
      dom.start.btnResume.style.display = 'none';
    }
  }

  // ===============================
  // 初始化
  // ===============================
  function init() {
    dom.start.totalFish.textContent = String(getTotalFish());
    dom.start.bestScore.textContent = String(getBestScore());
    const savedName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    if (savedName) dom.start.playerName.value = savedName;

    renderSceneSelect();
    bindEvents();
    updateFishermanHat();

    // 自动检测未完成游戏，有则直接恢复
    const saved = loadGameState();
    if (saved && saved.playerName && saved.playerName.trim()) {
      dom.start.playerName.value = saved.playerName;
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, saved.playerName);
      game.scene = SCENES[saved.sceneId] || SCENES.pond;
      renderSceneSelect();
      startGame(saved);
    } else {
      checkResume();
      showScreen('start');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

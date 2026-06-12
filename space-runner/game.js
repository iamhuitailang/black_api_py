/* ==========================================================
   星际狂奔 Space Runner - 核心游戏逻辑
   ========================================================== */
(() => {
  'use strict';

  // ========== 基础工具 ==========
  const rand  = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick  = arr => arr[randi(0, arr.length)];

  // AABB 碰撞检测
  const aabb = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;

  // ========== 画布初始化 ==========
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');
  let W = 0, H = 0, DPR = window.devicePixelRatio || 1;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    GROUND_Y = H - 120;
  }
  window.addEventListener('resize', resize);

  // ========== 关卡配置 ==========
  const LEVELS = [
    {
      name: '沙漠星球',
      target: 2000,
      baseSpeed: 5.5,
      speedGrowth: 0.00025,
      bg:   ['#3a1500', '#8b3a0f', '#ff6b35'],
      sky:  ['#ff9f43', '#ffbe76', '#ffe0b2'],
      ground: ['#8b3a0f', '#5a2708'],
      mountain: ['#6b2d08', '#3a1500'],
      obstacles: ['cactus', 'rock', 'quicksand'],
      enemies:   ['sandworm'],
      particles: 'sandstorm',
    },
    {
      name: '丛林星球',
      target: 3000,
      baseSpeed: 6.0,
      speedGrowth: 0.0003,
      bg:   ['#0b2e1e', '#1b4332', '#2d6a4f'],
      sky:  ['#52b788', '#74c69d', '#b7e4c7'],
      ground: ['#1b4332', '#081c15'],
      mountain: ['#14402e', '#0a2419'],
      obstacles: ['vine', 'flytrap', 'mushroom'],
      enemies:   ['monkey'],
      particles: 'rain',
    },
    {
      name: '冰雪星球',
      target: 4000,
      baseSpeed: 6.5,
      speedGrowth: 0.00035,
      bg:   ['#03045e', '#023e8a', '#0077b6'],
      sky:  ['#90e0ef', '#ade8f4', '#caf0f8'],
      ground: ['#caf0f8', '#48cae4'],
      mountain: ['#48cae4', '#0077b6'],
      obstacles: ['spike_ice', 'snowball', 'crack'],
      enemies:   ['yeti'],
      particles: 'snow',
    },
    {
      name: '机械星球',
      target: 5000,
      baseSpeed: 7.0,
      speedGrowth: 0.0004,
      bg:   ['#0b0b12', '#1e1e2a', '#343a40'],
      sky:  ['#495057', '#6c757d', '#adb5bd'],
      ground: ['#343a40', '#1e1e2a'],
      mountain: ['#2b2b38', '#14141e'],
      obstacles: ['laser', 'spike_metal', 'gear'],
      enemies:   ['robot'],
      particles: 'spark',
    },
  ];

  // ========== 全局游戏状态 ==========
  const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, WIN: 3, LOSE: 4 };
  let state   = STATE.MENU;
  let levelIdx = 0;
  let level   = LEVELS[0];
  let speed   = 0;
  let distance = 0;
  let crystals = 0;
  let lives   = 3;
  let boost   = 0;
  let boostActive = false;
  let frame   = 0;
  let shakeT  = 0;

  let GROUND_Y = 0;

  // ========== 玩家（宇航员）==========
  const player = {
    x: 0, y: 0,
    w: 40, h: 56,
    vy: 0,
    gravity: 0.9,
    jumpV: -16,
    jumps: 0,
    maxJumps: 2,
    sliding: false,
    slideT: 0,
    inv: 0,      // 无敌帧
    legPhase: 0, // 跑步动画相位
  };
  function resetPlayer() {
    player.x = 120;
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.jumps = 0;
    player.sliding = false;
    player.slideT = 0;
    player.inv = 90;
    player.legPhase = 0;
  }

  function jump() {
    if (state !== STATE.PLAYING) return;
    if (player.jumps < player.maxJumps) {
      player.vy = player.jumpV * (player.jumps === 0 ? 1 : 0.85);
      player.jumps++;
      player.sliding = false;
      spawnParticles(player.x + player.w / 2, player.y + player.h, 6, level.ground[0]);
    }
  }
  function slide() {
    if (state !== STATE.PLAYING) return;
    if (!player.sliding && player.jumps === 0) {
      player.sliding = true;
      player.slideT = 30;
    }
  }

  // ========== 实体数组 ==========
  let obstacles = [];
  let enemies   = [];
  let crystalsA = [];
  let bullets   = [];
  let particles = [];
  let bgLayers  = []; // 视差元素

  // ========== 视差背景 ==========
  function initBgLayers() {
    bgLayers = [];
    // 远山
    for (let i = 0; i < 8; i++) {
      bgLayers.push({ type: 'mtn', x: i * 300, y: GROUND_Y, w: 400, h: 220, speed: 0.15 });
    }
    // 近山
    for (let i = 0; i < 6; i++) {
      bgLayers.push({ type: 'mtn2', x: i * 400, y: GROUND_Y, w: 500, h: 150, speed: 0.3 });
    }
  }

  // ========== 粒子系统 ==========
  function spawnParticles(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: rand(-3, 3),
        vy: rand(-5, -1),
        life: randi(20, 40),
        max: 40,
        size: rand(2, 5),
        color: color || '#ffffff',
        g: 0.2,
      });
    }
  }

  function spawnCrystalBurst(x, y) {
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      particles.push({
        x, y,
        vx: Math.cos(ang) * rand(2, 5),
        vy: Math.sin(ang) * rand(2, 5) - 2,
        life: 35, max: 35,
        size: rand(3, 6),
        color: '#00f5d4',
        g: 0.15,
      });
    }
  }

  // 环境粒子（持续）
  function spawnEnvParticle() {
    const type = level.particles;
    if (type === 'sandstorm') {
      particles.push({
        x: W + 10, y: rand(0, H),
        vx: -rand(6, 12), vy: rand(-0.5, 0.5),
        life: 200, max: 200,
        size: rand(1, 3),
        color: 'rgba(255, 190, 118, 0.55)',
        g: 0,
      });
    } else if (type === 'rain') {
      particles.push({
        x: rand(0, W), y: -10,
        vx: -1, vy: rand(8, 12),
        life: 200, max: 200,
        size: 1.5,
        color: 'rgba(155, 221, 255, 0.6)',
        g: 0,
        line: true,
      });
    } else if (type === 'snow') {
      particles.push({
        x: rand(0, W), y: -10,
        vx: rand(-1, 1), vy: rand(1, 3),
        life: 400, max: 400,
        size: rand(2, 5),
        color: 'rgba(255,255,255,0.85)',
        g: 0,
        wobble: rand(0, Math.PI * 2),
      });
    } else if (type === 'spark') {
      particles.push({
        x: W + 10, y: rand(0, H),
        vx: -rand(3, 7), vy: 0,
        life: 150, max: 150,
        size: rand(1, 3),
        color: Math.random() < 0.5 ? '#00f5d4' : '#ffbe0b',
        g: 0,
      });
    }
  }

  // ========== 障碍物生成 ==========
  const spawnCooldowns = { obstacle: 0, enemy: 0, crystal: 0 };

  function spawnObstacle() {
    const types = level.obstacles;
    const t = pick(types);
    let ob = { type: t, x: W + 40 };

    switch (t) {
      case 'cactus':
        ob.w = 28; ob.h = randi(50, 80);
        ob.y = GROUND_Y - ob.h;
        break;
      case 'rock':
        ob.w = randi(40, 70); ob.h = randi(30, 45);
        ob.y = GROUND_Y - ob.h;
        ob.vx = -rand(1, 2);
        break;
      case 'quicksand':
        ob.w = randi(80, 140); ob.h = 14;
        ob.y = GROUND_Y - 4;
        break;
      case 'vine':
        ob.w = 22; ob.h = randi(130, 180);
        ob.y = 0;
        ob.swing = rand(0, Math.PI * 2);
        ob.baseX = ob.x;
        break;
      case 'flytrap':
        ob.w = 50; ob.h = 60;
        ob.y = GROUND_Y - ob.h;
        ob.t = 0;
        break;
      case 'mushroom':
        ob.w = 36; ob.h = 40;
        ob.y = GROUND_Y - ob.h;
        break;
      case 'spike_ice':
        ob.w = randi(30, 55); ob.h = randi(40, 70);
        ob.y = GROUND_Y - ob.h;
        break;
      case 'snowball':
        ob.w = 50; ob.h = 50;
        ob.y = GROUND_Y - ob.h;
        ob.vx = -rand(2, 4);
        ob.t = 0;
        break;
      case 'crack':
        ob.w = randi(70, 120); ob.h = 18;
        ob.y = GROUND_Y - 4;
        break;
      case 'laser':
        ob.w = 16; ob.h = randi(90, 160);
        ob.y = GROUND_Y - ob.h - 20;
        ob.t = 0;
        ob.period = 120;
        break;
      case 'spike_metal':
        ob.w = randi(35, 60); ob.h = randi(40, 65);
        ob.y = GROUND_Y - ob.h;
        break;
      case 'gear':
        ob.w = 70; ob.h = 70;
        ob.y = GROUND_Y - ob.h - randi(0, 60);
        ob.t = 0;
        break;
    }
    obstacles.push(ob);
  }

  function spawnEnemy() {
    const t = pick(level.enemies);
    let e = { type: t, x: W + 50 };

    switch (t) {
      case 'sandworm':
        e.w = 80; e.h = 50;
        e.y = GROUND_Y - 10;
        e.state = 'hide';
        e.t = randi(30, 80);
        break;
      case 'monkey':
        e.w = 50; e.h = 50;
        e.y = GROUND_Y - e.h - randi(60, 140);
        e.vy = 0;
        e.t = 0;
        break;
      case 'yeti':
        e.w = 70; e.h = 90;
        e.y = GROUND_Y - e.h;
        e.vx = -rand(0.5, 1.5);
        e.t = 0;
        break;
      case 'robot':
        e.w = 60; e.h = 70;
        e.y = GROUND_Y - e.h;
        e.t = 0;
        e.shootT = 60;
        break;
    }
    enemies.push(e);
  }

  function spawnCrystalLine() {
    const n = randi(3, 7);
    const startX = W + 30;
    const yPick = Math.random();
    let cy;
    if (yPick < 0.4) cy = GROUND_Y - 40;
    else if (yPick < 0.75) cy = GROUND_Y - 100;
    else cy = GROUND_Y - 170;

    const arc = Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      let yy = cy;
      if (arc) {
        const t = i / (n - 1);
        yy = cy - Math.sin(t * Math.PI) * 50;
      }
      crystalsA.push({
        x: startX + i * 32,
        y: yy,
        w: 22, h: 26,
        t: rand(0, Math.PI * 2),
      });
    }
  }

  // ========== 开始 / 重置关卡 ==========
  function startLevel(idx) {
    levelIdx = idx;
    level = LEVELS[idx];
    speed = level.baseSpeed;
    distance = 0;
    crystals = 0;
    lives = 3;
    boost = 0;
    boostActive = false;
    obstacles = [];
    enemies = [];
    crystalsA = [];
    bullets = [];
    particles = [];
    frame = 0;
    shakeT = 0;
    spawnCooldowns.obstacle = 90;
    spawnCooldowns.enemy    = 240;
    spawnCooldowns.crystal  = 120;
    resize();
    resetPlayer();
    initBgLayers();
    state = STATE.PLAYING;

    showScreen('hud');
    updateHUD();
  }

  // ========== 更新 ==========
  function update() {
    if (state !== STATE.PLAYING) return;
    frame++;

    // 速度增长
    speed = level.baseSpeed + distance * level.speedGrowth;
    if (boostActive) {
      speed *= 1.55;
      boost -= 0.6;
      if (boost <= 0) { boost = 0; boostActive = false; }
    }

    distance += speed * 0.1;
    if (distance >= level.target) { return endLevel(true); }

    // 玩家物理
    player.vy += player.gravity;
    player.y  += player.vy;

    const effH = player.sliding ? player.h * 0.55 : player.h;
    const groundTop = GROUND_Y - effH;
    if (player.y >= groundTop) {
      player.y = groundTop;
      player.vy = 0;
      player.jumps = 0;
    }
    if (player.sliding) {
      player.slideT--;
      if (player.slideT <= 0) player.sliding = false;
    }
    if (player.inv > 0) player.inv--;
    player.legPhase += speed * 0.08;

    // 视差背景
    for (const b of bgLayers) {
      b.x -= speed * b.speed;
      if (b.x + b.w < 0) b.x += bgLayers.length * (b.type === 'mtn' ? 300 : 400);
    }

    // 生成
    spawnCooldowns.obstacle--;
    spawnCooldowns.enemy--;
    spawnCooldowns.crystal--;
    if (spawnCooldowns.obstacle <= 0) {
      spawnObstacle();
      spawnCooldowns.obstacle = randi(70, 130) - Math.min(40, distance * 0.01);
    }
    if (spawnCooldowns.enemy <= 0 && distance > 400) {
      spawnEnemy();
      spawnCooldowns.enemy = randi(260, 460) - Math.min(120, distance * 0.03);
    }
    if (spawnCooldowns.crystal <= 0) {
      spawnCrystalLine();
      spawnCooldowns.crystal = randi(150, 280);
    }

    // 环境粒子
    if (frame % 2 === 0) spawnEnvParticle();
    if (boostActive && frame % 3 === 0) {
      spawnParticles(player.x, player.y + player.h / 2, 1, '#ffbe0b');
    }

    // 障碍物更新
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed + (o.vx || 0);
      if (o.type === 'vine') {
        o.swing += 0.04;
        o.x = o.baseX - Math.sin(o.swing) * 30;
        o.baseX -= speed;
      } else if (o.type === 'flytrap') {
        o.t = (o.t || 0) + 0.08;
      } else if (o.type === 'snowball') {
        o.t = (o.t || 0) + 0.15;
        o.y = GROUND_Y - o.h - Math.abs(Math.sin(o.t)) * 20;
      } else if (o.type === 'laser') {
        o.t = (o.t || 0) + 1;
      } else if (o.type === 'gear') {
        o.t = (o.t || 0) + 0.1;
      }

      if (o.x + o.w < -50) { obstacles.splice(i, 1); continue; }
      if (player.inv > 0) continue;

      const pbox = { x: player.x + 6, y: player.y + (player.sliding ? player.h * 0.45 : 4),
                     w: player.w - 12, h: (player.sliding ? player.h * 0.55 : player.h) - 8 };
      const laserOn = o.type === 'laser' ? Math.sin(o.t * Math.PI * 2 / o.period) > 0 : true;
      if (!laserOn) continue;

      if (aabb(pbox, o)) {
        if (o.type === 'quicksand' || o.type === 'crack') {
          speed *= 0.6;
          hurtPlayer();
        } else {
          hurtPlayer();
        }
      }
    }

    // 敌人更新
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x -= speed + (e.vx || 0);

      if (e.type === 'sandworm') {
        e.t--;
        if (e.state === 'hide' && e.t <= 0) {
          e.state = 'rise'; e.t = 30;
        } else if (e.state === 'rise') {
          e.y -= 1.5;
          if (e.t <= 0) { e.state = 'attack'; e.t = 60; }
        } else if (e.state === 'attack' && e.t <= 0) {
          e.state = 'dive'; e.t = 30;
        } else if (e.state === 'dive') {
          e.y += 1.5;
          if (e.t <= 0) { e.state = 'hide'; e.t = randi(40, 100); e.y = GROUND_Y - 10; }
        }
      } else if (e.type === 'monkey') {
        e.t = (e.t || 0) + 0.06;
        e.y = GROUND_Y - e.h - 80 + Math.sin(e.t) * 60;
      } else if (e.type === 'yeti') {
        e.t = (e.t || 0) + 0.1;
      } else if (e.type === 'robot') {
        e.t = (e.t || 0) + 1;
        e.shootT--;
        if (e.shootT <= 0 && e.x < W - 50) {
          bullets.push({ x: e.x, y: e.y + 20, vx: -9, w: 10, h: 6, life: 200 });
          e.shootT = randi(80, 140);
        }
      }

      if (e.x + e.w < -60) { enemies.splice(i, 1); continue; }
      if (player.inv > 0) continue;

      const visible = !(e.type === 'sandworm' && e.state === 'hide');
      if (!visible) continue;

      const pbox = { x: player.x + 6, y: player.y + (player.sliding ? player.h * 0.45 : 4),
                     w: player.w - 12, h: (player.sliding ? player.h * 0.55 : player.h) - 8 };
      const ebox = { x: e.x + 4, y: e.y + 4, w: e.w - 8, h: e.h - 8 };
      if (aabb(pbox, ebox)) hurtPlayer();
    }

    // 子弹更新
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.life--;
      if (b.x < -20 || b.life <= 0) { bullets.splice(i, 1); continue; }
      if (player.inv > 0) continue;
      const pbox = { x: player.x + 6, y: player.y + 4, w: player.w - 12, h: player.h - 8 };
      if (aabb(pbox, b)) { bullets.splice(i, 1); hurtPlayer(); }
    }

    // 晶体收集
    for (let i = crystalsA.length - 1; i >= 0; i--) {
      const c = crystalsA[i];
      c.x -= speed;
      c.t += 0.08;
      if (c.x + c.w < -20) { crystalsA.splice(i, 1); continue; }

      const pbox = { x: player.x, y: player.y, w: player.w, h: player.h };
      if (aabb(pbox, c)) {
        crystalsA.splice(i, 1);
        crystals++;
        boost = Math.min(100, boost + 14);
        if (boost >= 100) { boostActive = true; }
        spawnCrystalBurst(c.x + c.w / 2, c.y + c.h / 2);
      }
    }

    // 粒子更新
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.g) p.vy += p.g;
      if (p.wobble !== undefined) {
        p.wobble += 0.03;
        p.x += Math.sin(p.wobble) * 0.5;
      }
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (shakeT > 0) shakeT--;
    updateHUD();
  }

  function hurtPlayer() {
    lives--;
    player.inv = 90;
    shakeT = 14;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, 16, '#ff006e');
    if (lives <= 0) { endLevel(false); }
  }

  function endLevel(win) {
    state = win ? STATE.WIN : STATE.LOSE;
    hideScreen('hud');
    const titleEl    = document.getElementById('result-title');
    const starsEl    = document.getElementById('result-stars');
    const distEl     = document.getElementById('result-distance');
    const crystalEl  = document.getElementById('result-crystals');

    titleEl.textContent = win ? '通关成功！' : '任务失败';
    titleEl.classList.toggle('lose', !win);

    const prog = Math.min(1, distance / level.target);
    const stars = win ? (prog > 0.95 && crystals > 15 ? 3 : prog > 0.85 || crystals > 10 ? 2 : 1) : 0;
    starsEl.textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);

    distEl.textContent = Math.floor(distance) + ' / ' + level.target + ' m';
    crystalEl.textContent = crystals;

    showScreen('result-screen');
  }

  // ========== 渲染 ==========
  function draw() {
    ctx.save();
    if (shakeT > 0) {
      ctx.translate(rand(-shakeT / 3, shakeT / 3), rand(-shakeT / 3, shakeT / 3));
    }

    // 天空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, level.bg[0]);
    skyGrad.addColorStop(0.5, level.bg[1]);
    skyGrad.addColorStop(1, level.bg[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // 星空
    if (frame % 3 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + frame * 0.3) % W;
        const sy = (i * 53) % (H * 0.45);
        const sz = (i % 3) + 0.5;
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin((frame + i * 20) * 0.05);
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.globalAlpha = 1;
    }

    // 远山层
    for (const b of bgLayers) {
      if (b.type === 'mtn') {
        ctx.fillStyle = level.mountain[0];
        drawMountain(b.x, b.y - b.h, b.w, b.h, 0.55);
      }
    }
    // 近山层
    for (const b of bgLayers) {
      if (b.type === 'mtn2') {
        ctx.fillStyle = level.mountain[1];
        drawMountain(b.x, b.y - b.h, b.w, b.h, 0.7);
      }
    }

    // 地面
    const gg = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    gg.addColorStop(0, level.ground[0]);
    gg.addColorStop(1, level.ground[1]);
    ctx.fillStyle = gg;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // 地面纹理线
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const lx = ((i * 160) - (distance * 2) % 160);
      ctx.beginPath();
      ctx.moveTo(lx, GROUND_Y + 10 + i * 4);
      ctx.lineTo(lx + 100, GROUND_Y + 10 + i * 4);
      ctx.stroke();
    }

    // 晶体
    for (const c of crystalsA) drawCrystal(c);

    // 障碍物
    for (const o of obstacles) drawObstacle(o);

    // 敌人
    for (const e of enemies) drawEnemy(e);

    // 子弹
    for (const b of bullets) {
      ctx.fillStyle = '#ff006e';
      ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 14;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
    }

    // 玩家
    drawPlayer();

    // 粒子
    for (const p of particles) {
      const a = p.life / p.max;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = p.color;
      if (p.line) {
        ctx.fillRect(p.x, p.y, 1.5, 8);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // 机械星球扫描线
    if (level.particles === 'spark') {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#00f5d4';
      for (let y = (frame * 3) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = 1;
    }
    // 冰雪星球结冰边框
    if (level.particles === 'snow') {
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawMountain(x, y, w, h, ratio) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.2, y + h * (1 - ratio * 0.8));
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.75, y + h * (1 - ratio * 0.5));
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function drawPlayer() {
    const px = player.x, py = player.y;
    const flashing = player.inv > 0 && Math.floor(player.inv / 5) % 2 === 0;
    if (flashing) { ctx.globalAlpha = 0.4; }

    const sliding = player.sliding;
    const ph = sliding ? player.h * 0.55 : player.h;
    const pw = player.w;
    const oy = sliding ? player.h - ph : 0;

    // 喷射尾焰（加速时）
    if (boostActive) {
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowColor = '#ffbe0b'; ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(px - 4, py + oy + ph * 0.5);
      ctx.lineTo(px - 24 - Math.sin(frame * 0.5) * 6, py + oy + ph * 0.4);
      ctx.lineTo(px - 30 - Math.sin(frame * 0.5) * 10, py + oy + ph * 0.55);
      ctx.lineTo(px - 24 - Math.sin(frame * 0.5) * 6, py + oy + ph * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 身体（宇航服）
    ctx.fillStyle = '#e8ecf7';
    roundRect(px, py + oy + ph * 0.25, pw, ph * 0.6, 8);
    ctx.fill();

    // 胸口装置
    ctx.fillStyle = '#00f5d4';
    ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 8;
    ctx.fillRect(px + pw * 0.35, py + oy + ph * 0.45, pw * 0.3, 6);
    ctx.shadowBlur = 0;

    // 背包
    ctx.fillStyle = '#a5b1d9';
    ctx.fillRect(px - 4, py + oy + ph * 0.3, 8, ph * 0.45);

    // 头盔
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + oy + ph * 0.2, ph * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 面罩
    const faceGrad = ctx.createLinearGradient(px, py, px + pw, py + ph * 0.4);
    faceGrad.addColorStop(0, '#00bbf9');
    faceGrad.addColorStop(1, '#9b5de5');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + oy + ph * 0.2, ph * 0.16, 0, Math.PI * 2);
    ctx.fill();
    // 面罩反光
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(px + pw * 0.4, py + oy + ph * 0.14, 3, 0, Math.PI * 2);
    ctx.fill();

    // 腿（跑步动画）
    if (!sliding && player.jumps === 0) {
      const legSwing = Math.sin(player.legPhase) * 8;
      ctx.fillStyle = '#d0d7ee';
      ctx.fillRect(px + 6, py + oy + ph * 0.8, 10, ph * 0.2 + legSwing);
      ctx.fillRect(px + pw - 16, py + oy + ph * 0.8, 10, ph * 0.2 - legSwing);
    } else {
      ctx.fillStyle = '#d0d7ee';
      ctx.fillRect(px + 6, py + oy + ph * 0.8, 10, ph * 0.2);
      ctx.fillRect(px + pw - 16, py + oy + ph * 0.8, 10, ph * 0.2);
    }

    ctx.globalAlpha = 1;
  }

  function drawCrystal(c) {
    ctx.save();
    ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + Math.sin(c.t) * 4);
    ctx.rotate(Math.sin(c.t * 0.5) * 0.1);
    ctx.fillStyle = '#00f5d4';
    ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, -c.h / 2);
    ctx.lineTo(c.w / 2, -2);
    ctx.lineTo(c.w / 3, c.h / 2);
    ctx.lineTo(-c.w / 3, c.h / 2);
    ctx.lineTo(-c.w / 2, -2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(-3, -c.h / 2 + 4);
    ctx.lineTo(3, -c.h / 2 + 4);
    ctx.lineTo(0, c.h / 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ===== 障碍物绘制 =====
  function drawObstacle(o) {
    switch (o.type) {
      case 'cactus':
        ctx.fillStyle = '#2d6a4f';
        roundRect(o.x, o.y, o.w, o.h, 6); ctx.fill();
        ctx.fillRect(o.x - 8, o.y + o.h * 0.35, 10, o.h * 0.3);
        ctx.fillRect(o.x + o.w - 2, o.y + o.h * 0.2, 10, o.h * 0.35);
        ctx.fillStyle = '#95d5b2';
        for (let i = 0; i < 5; i++) ctx.fillRect(o.x + o.w / 2 - 1, o.y + 4 + i * 12, 2, 4);
        break;
      case 'rock':
        ctx.fillStyle = '#6b4226';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.6, o.w / 2, o.h / 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w * 0.4, o.y + o.h * 0.4, o.w * 0.2, o.h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'quicksand':
        ctx.fillStyle = '#c49a6c';
        roundRect(o.x, o.y, o.w, o.h, 4); ctx.fill();
        ctx.strokeStyle = '#8b6914'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 8 + i * 12 + Math.sin(frame * 0.1 + i) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      case 'vine':
        ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = o.w; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, 0);
        ctx.quadraticCurveTo(o.x + o.w / 2 + Math.sin(o.swing) * 20, o.h / 2, o.x + o.w / 2, o.h);
        ctx.stroke();
        // 叶子
        ctx.fillStyle = '#52b788';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.h * 0.3, 16, 8, Math.sin(o.swing) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.h * 0.7, 14, 7, -Math.sin(o.swing) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'flytrap':
        ctx.fillStyle = '#40916c';
        ctx.fillRect(o.x + o.w / 2 - 5, o.y + o.h * 0.5, 10, o.h * 0.5);
        const open = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(o.t || 0));
        ctx.fillStyle = '#d00000';
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h * 0.45);
        ctx.rotate(-open);
        ctx.beginPath();
        ctx.ellipse(0, -12, o.w / 2, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h * 0.45);
        ctx.rotate(open);
        ctx.beginPath();
        ctx.ellipse(0, 12, o.w / 2, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      case 'mushroom':
        ctx.fillStyle = '#f8edeb';
        ctx.fillRect(o.x + o.w * 0.35, o.y + o.h * 0.5, o.w * 0.3, o.h * 0.5);
        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.5, o.w / 2, o.h * 0.5, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(o.x + o.w * 0.3, o.y + o.h * 0.3, 4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(o.x + o.w * 0.7, o.y + o.h * 0.35, 3, 0, 7); ctx.fill();
        break;
      case 'spike_ice':
        ctx.fillStyle = '#caf0f8';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 3, o.y);
        ctx.lineTo(o.x + o.w * 2 / 3, o.y + o.h * 0.3);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 3 + 4, o.y + 6);
        ctx.lineTo(o.x + o.w / 3 + 8, o.y + 6);
        ctx.lineTo(o.x + o.w / 3 + 2, o.y + o.h * 0.6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'snowball':
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(150,200,230,0.6)';
        ctx.beginPath();
        ctx.arc(o.x + o.w * 0.35, o.y + o.h * 0.6, o.w * 0.08, 0, 7); ctx.fill();
        ctx.beginPath();
        ctx.arc(o.x + o.w * 0.65, o.y + o.h * 0.4, o.w * 0.06, 0, 7); ctx.fill();
        break;
      case 'crack':
        ctx.fillStyle = '#03045e';
        roundRect(o.x, o.y, o.w, o.h, 2); ctx.fill();
        ctx.strokeStyle = '#023e8a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h / 2);
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(o.x + (i + 0.5) * (o.w / 6), o.y + (i % 2 ? 2 : o.h - 2));
        }
        ctx.lineTo(o.x + o.w, o.y + o.h / 2);
        ctx.stroke();
        break;
      case 'laser': {
        const on = Math.sin((o.t || 0) * Math.PI * 2 / o.period) > 0;
        ctx.fillStyle = '#343a40';
        ctx.fillRect(o.x - 4, o.y - 10, o.w + 8, 12);
        ctx.fillRect(o.x - 4, o.y + o.h - 2, o.w + 8, 12);
        if (on) {
          ctx.fillStyle = '#ff006e';
          ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 20;
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(255,0,110,0.4)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(o.x + o.w / 2, o.y); ctx.lineTo(o.x + o.w / 2, o.y + o.h); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }
      case 'spike_metal':
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(o.x + (i + 0.5) * (o.w / 4), o.y);
          ctx.lineTo(o.x + (i + 1) * (o.w / 4), o.y + o.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#adb5bd';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(o.x + (i + 0.45) * (o.w / 4), o.y + 4, 2, o.h * 0.5);
        }
        break;
      case 'gear': {
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        ctx.rotate(o.t || 0);
        ctx.fillStyle = '#6c757d';
        const teeth = 10;
        ctx.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
          const ang = (i / (teeth * 2)) * Math.PI * 2;
          const r = i % 2 === 0 ? o.w / 2 : o.w / 2.6;
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e1e2a';
        ctx.beginPath();
        ctx.arc(0, 0, o.w / 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, o.w / 3.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }

  // ===== 敌人绘制 =====
  function drawEnemy(e) {
    switch (e.type) {
      case 'sandworm':
        if (e.state === 'hide') break;
        ctx.fillStyle = '#d4a373';
        ctx.beginPath();
        ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 环节
        ctx.strokeStyle = '#a47148'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x + 10 + i * 16, e.y + 8);
          ctx.lineTo(e.x + 10 + i * 16, e.y + e.h - 8);
          ctx.stroke();
        }
        // 嘴
        ctx.fillStyle = '#6a040f';
        ctx.beginPath();
        ctx.arc(e.x + e.w * 0.8, e.y + e.h / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        // 牙
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(e.x + e.w * 0.8 + Math.cos(a) * 8, e.y + e.h / 2 + Math.sin(a) * 8);
          ctx.lineTo(e.x + e.w * 0.8 + Math.cos(a) * 14, e.y + e.h / 2 + Math.sin(a) * 14);
          ctx.lineTo(e.x + e.w * 0.8 + Math.cos(a + 0.3) * 8, e.y + e.h / 2 + Math.sin(a + 0.3) * 8);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'monkey':
        // 尾巴
        ctx.strokeStyle = '#774936'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x + 6, e.y + e.h * 0.5);
        ctx.quadraticCurveTo(e.x - 10, e.y, e.x + 4, e.y - 10);
        ctx.stroke();
        // 身体
        ctx.fillStyle = '#774936';
        roundRect(e.x, e.y + e.h * 0.25, e.w, e.h * 0.65, 10); ctx.fill();
        // 脸
        ctx.fillStyle = '#efc3a4';
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y + e.h * 0.3, e.h * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // 眼
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.4, e.y + e.h * 0.28, 3, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.6, e.y + e.h * 0.28, 3, 0, 7); ctx.fill();
        // 耳朵
        ctx.fillStyle = '#774936';
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.15, e.y + e.h * 0.25, 7, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.85, e.y + e.h * 0.25, 7, 0, 7); ctx.fill();
        break;
      case 'yeti':
        // 身体
        ctx.fillStyle = '#ffffff';
        roundRect(e.x, e.y + e.h * 0.1, e.w, e.h * 0.9, 16); ctx.fill();
        // 毛
        ctx.fillStyle = '#e9ecef';
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.arc(e.x + 6 + i * 10, e.y + e.h * 0.15, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        // 脸
        ctx.fillStyle = '#6c757d';
        roundRect(e.x + e.w * 0.2, e.y + e.h * 0.18, e.w * 0.6, e.h * 0.25, 8); ctx.fill();
        // 眼
        ctx.fillStyle = '#ff006e';
        ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.35, e.y + e.h * 0.28, 4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + e.w * 0.65, e.y + e.h * 0.28, 4, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        // 牙
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + e.w * 0.4, e.y + e.h * 0.38, 4, 8);
        ctx.fillRect(e.x + e.w * 0.55, e.y + e.h * 0.38, 4, 8);
        // 脚
        ctx.fillStyle = '#dee2e6';
        roundRect(e.x + 6, e.y + e.h - 10, 18, 14, 4); ctx.fill();
        roundRect(e.x + e.w - 24, e.y + e.h - 10, 18, 14, 4); ctx.fill();
        break;
      case 'robot':
        // 腿
        ctx.fillStyle = '#495057';
        ctx.fillRect(e.x + 10, e.y + e.h - 16, 12, 16);
        ctx.fillRect(e.x + e.w - 22, e.y + e.h - 16, 12, 16);
        // 身体
        ctx.fillStyle = '#6c757d';
        roundRect(e.x, e.y + e.h * 0.3, e.w, e.h * 0.55, 6); ctx.fill();
        // 头
        ctx.fillStyle = '#adb5bd';
        roundRect(e.x + 8, e.y, e.w - 16, e.h * 0.35, 6); ctx.fill();
        // 眼（扫描）
        const scan = (Math.sin(e.t * 0.1) + 1) / 2;
        ctx.fillStyle = '#ff006e';
        ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 10;
        ctx.fillRect(e.x + 12 + scan * (e.w - 36), e.y + e.h * 0.12, e.w * 0.2, 6);
        ctx.shadowBlur = 0;
        // 胸口灯
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y + e.h * 0.55, 6, 0, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        // 炮管
        ctx.fillStyle = '#343a40';
        ctx.fillRect(e.x - 8, e.y + e.h * 0.45, 16, 8);
        break;
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ========== UI 辅助 ==========
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'menu-screen') state = STATE.MENU;
  }
  function hideScreen(id) {
    document.getElementById(id).classList.remove('active');
  }

  function updateHUD() {
    document.getElementById('crystal-num').textContent = crystals;
    document.getElementById('distance-text').textContent =
      Math.floor(distance) + ' / ' + level.target + ' m';
    document.getElementById('distance-fill').style.width =
      Math.min(100, (distance / level.target) * 100) + '%';
    document.getElementById('boost-fill').style.width = boost + '%';

    const hearts = document.querySelectorAll('#lives-hearts .heart');
    hearts.forEach((h, i) => h.classList.toggle('lost', i >= lives));
  }

  // ========== 主循环 ==========
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ========== 输入 ==========
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); slide(); }
    else if (e.code === 'KeyP') { togglePause(); }
  });

  // 鼠标/触屏
  canvas.addEventListener('pointerdown', e => {
    if (state !== STATE.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < H * 0.6) jump(); else slide();
  });

  // 菜单按钮
  document.querySelectorAll('.planet-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.level, 10);
      startLevel(idx);
    });
  });

  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('menu-from-pause').addEventListener('click', () => {
    state = STATE.MENU;
    hideScreen('pause-screen');
    showScreen('menu-screen');
  });
  document.getElementById('retry-btn').addEventListener('click', () => {
    hideScreen('result-screen');
    startLevel(levelIdx);
  });
  document.getElementById('menu-btn').addEventListener('click', () => {
    hideScreen('result-screen');
    showScreen('menu-screen');
  });

  // 移动端按键
  document.getElementById('mobile-jump').addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  document.getElementById('mobile-slide').addEventListener('touchstart', e => { e.preventDefault(); slide(); });
  document.getElementById('mobile-jump').addEventListener('mousedown', e => { e.preventDefault(); jump(); });
  document.getElementById('mobile-slide').addEventListener('mousedown', e => { e.preventDefault(); slide(); });

  function togglePause() {
    if (state === STATE.PLAYING) {
      state = STATE.PAUSED;
      showScreen('pause-screen');
    } else if (state === STATE.PAUSED) {
      state = STATE.PLAYING;
      hideScreen('pause-screen');
    }
  }

  // ========== 启动 ==========
  resize();
  showScreen('menu-screen');
  loop();

})();

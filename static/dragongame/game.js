// ==================== 游戏配置 ====================
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;
const CANYON_LEFT = 80;
const CANYON_RIGHT = GAME_WIDTH - 80;

const BASE_FLAME_DAMAGE_PER_SEC = 8;
const CHARGE_DAMAGE = 30;
const MAX_CHARGE_TIME = 2.0;
const CHARGE_COOLDOWN = 3.0;
const ESSENCE_DROP_RATE = 0.3;
const DRAGON_MAX_HP = 150;

// ==================== 游戏状态 ====================
let canvas, ctx;
let animationId = null;
let lastTime = 0;
let gameState = 'start'; // start, playing, gameover

// 玩家信息
let playerName = 'DragonRider';
let recordId = null;
let statusId = null;

// 游戏数据
let wave = 1;
let enemiesKilled = 0;
let score = 0;
let essenceCount = 0;
let flameLevel = 1;
let currentHp = DRAGON_MAX_HP;

// 蓄力相关
let isCharging = false;
let chargingTime = 0;
let chargePercent = 0;

// 冲锋冷却
let chargeCooldownTimer = 0;
let isChargeOnCooldown = false;

// 龙
const dragon = {
  x: GAME_WIDTH * 0.3,
  y: GAME_HEIGHT * 0.5,
  width: 90,
  height: 55,
  speed: 320,
  wingPhase: 0,
  isChargingForward: false,
  chargeTimer: 0,
  invulnerable: 0,
  hitFlash: 0
};

// 输入
const keys = {};

// 游戏对象
const enemies = [];
const flameBreaths = [];
const projectiles = [];
const essenceOrbs = [];
const particles = [];
const floatingTexts = [];

// 波次管理
let enemiesSpawnedThisWave = 0;
let enemiesRemaining = 0;
let waveSpawnTimer = 0;
let nextEnemyIndex = 0;
let waveSpawnQueue = [];
let waveTransition = false;

// ==================== 工具函数 ====================
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function checkRectCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function checkPointInRect(px, py, r, padding = 0) {
  return px >= r.x - padding &&
         px <= r.x + r.width + padding &&
         py >= r.y - padding &&
         py <= r.y + r.height + padding;
}

function getFlameDamageMultiplier() {
  return 1 + (flameLevel - 1) * 0.15;
}

function getUpgradeCost() {
  return Math.ceil(flameLevel * 1.5);
}

// ==================== 粒子与文字特效 ====================
function spawnParticles(x, y, color, count, speed = 100) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = speed * (0.3 + Math.random() * 0.7);
    particles.push({
      x, y,
      vx: Math.cos(angle) * sp,
      vy: Math.sin(angle) * sp,
      life: 0.4 + Math.random() * 0.6,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 4
    });
  }
}

function spawnFloatingText(x, y, text, color = '#fff', size = 18) {
  floatingTexts.push({
    x, y, text, color, size,
    life: 1.2,
    vy: -60
  });
}

// ==================== 敌人系统 ====================
function spawnEnemy(type, fromLeft) {
  const x = fromLeft ? CANYON_LEFT - 30 : CANYON_RIGHT + 30;
  const y = 80 + Math.random() * (GAME_HEIGHT - 160);
  let enemy;

  switch (type) {
    case 'stone':
      enemy = {
        id: generateId(),
        type: 'stone',
        x, y,
        width: 55,
        height: 65,
        hp: 40,
        maxHp: 40,
        speed: 55,
        damage: 15,
        attackRange: 70,
        attackCooldown: 0,
        fromLeft,
        scoreValue: 100,
        animPhase: Math.random() * Math.PI * 2
      };
      break;
    case 'hawk':
      enemy = {
        id: generateId(),
        type: 'hawk',
        x, y,
        width: 50,
        height: 35,
        hp: 20,
        maxHp: 20,
        speed: 130,
        damage: 10,
        attackRange: 280,
        attackCooldown: 1.5 + Math.random(),
        fromLeft,
        scoreValue: 150,
        animPhase: Math.random() * Math.PI * 2,
        hoverOffset: Math.random() * Math.PI * 2
      };
      break;
    case 'rock':
      enemy = {
        id: generateId(),
        type: 'rock',
        x, y,
        width: 70,
        height: 75,
        hp: 80,
        maxHp: 80,
        speed: 35,
        damage: 25,
        attackRange: 350,
        attackCooldown: 5,
        fromLeft,
        scoreValue: 250,
        animPhase: Math.random() * Math.PI * 2
      };
      break;
  }

  if (enemy) {
    enemies.push(enemy);
    enemiesSpawnedThisWave++;
  }
}

function planWave(waveNum) {
  const queue = [];
  const baseCount = 3 + waveNum * 2;

  for (let i = 0; i < baseCount; i++) {
    let type;
    const roll = Math.random();

    if (waveNum <= 2) {
      type = roll < 0.7 ? 'stone' : 'hawk';
    } else if (waveNum <= 4) {
      if (roll < 0.5) type = 'stone';
      else if (roll < 0.85) type = 'hawk';
      else type = 'rock';
    } else {
      if (roll < 0.35) type = 'stone';
      else if (roll < 0.7) type = 'hawk';
      else type = 'rock';
    }

    queue.push({
      type,
      fromLeft: Math.random() < 0.5,
      delay: i * (0.6 + Math.random() * 0.4)
    });
  }

  return queue;
}

function startWave(waveNum) {
  wave = waveNum;
  enemiesSpawnedThisWave = 0;
  enemiesRemaining = 0;
  nextEnemyIndex = 0;
  waveSpawnQueue = planWave(waveNum);
  enemiesRemaining = waveSpawnQueue.length;
  waveSpawnTimer = 0;
  waveTransition = false;

  // 更新UI
  document.getElementById('waveNumber').textContent = wave;

  // 显示波次横幅
  const banner = document.getElementById('waveBanner');
  document.getElementById('bannerWave').textContent = `第 ${wave} 波`;
  document.getElementById('bannerEnemyCount').textContent = `${waveSpawnQueue.length} 个敌人来袭！`;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 2000);
}

function damageEnemy(enemy, damage, source = 'flame') {
  enemy.hp -= damage;
  spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2,
    source === 'charge' ? '#ffdd00' : '#ff6600', 6, 80);
  spawnFloatingText(enemy.x + enemy.width / 2, enemy.y,
    `-${Math.round(damage)}`, source === 'charge' ? '#ffdd00' : '#ff8800', 16);

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  const idx = enemies.findIndex(e => e.id === enemy.id);
  if (idx === -1) return;

  spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff4400', 18, 150);
  spawnFloatingText(enemy.x + enemy.width / 2, enemy.y, `+${enemy.scoreValue}`, '#ffd700', 20);

  // 掉落精华
  if (Math.random() < ESSENCE_DROP_RATE || enemy.type === 'rock') {
    const drops = enemy.type === 'rock' ? 2 : 1;
    for (let i = 0; i < drops; i++) {
      essenceOrbs.push({
        id: generateId(),
        x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 30,
        y: enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 60,
        vy: -80 - Math.random() * 60,
        size: 14,
        phase: Math.random() * Math.PI * 2,
        life: 8
      });
    }
  }

  enemies.splice(idx, 1);
  enemiesKilled++;
  score += enemy.scoreValue;
  enemiesRemaining--;

  // 更新HUD
  updateHUD();

  // 检查波次完成
  if (enemiesRemaining <= 0 && nextEnemyIndex >= waveSpawnQueue.length) {
    onWaveCleared();
  }
}

function onWaveCleared() {
  waveTransition = true;
  score += wave * 500;
  spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2,
    `波次完成！+${wave * 500}`, '#ffd700', 32);
  updateHUD();

  // 显示"下一波"提示
  document.getElementById('waveIncoming').classList.remove('hidden');

  setTimeout(() => {
    document.getElementById('waveIncoming').classList.add('hidden');
    saveProgress();
    startWave(wave + 1);
  }, 2500);
}

// ==================== 龙的系统 ====================
function damageDragon(damage) {
  if (dragon.invulnerable > 0) return;

  currentHp = Math.max(0, currentHp - damage);
  dragon.invulnerable = 0.8;
  dragon.hitFlash = 0.3;
  spawnFloatingText(dragon.x, dragon.y - 30, `-${damage}`, '#ff3333', 20);
  updateHUD();

  if (currentHp <= 0) {
    onGameOver();
  }
}

function fireFlameBreath() {
  const chargeMul = 1 + (chargePercent / 100) * 2;
  const dps = BASE_FLAME_DAMAGE_PER_SEC * getFlameDamageMultiplier() * chargeMul;
  const length = 180 + chargePercent * 0.8;
  const width = 50 + chargePercent * 0.3;

  flameBreaths.push({
    id: generateId(),
    x: dragon.x + dragon.width,
    y: dragon.y + dragon.height / 2,
    length,
    width,
    dps,
    duration: chargePercent >= 100 ? 0.8 : 0.4,
    life: 0,
    hitSet: new Set()
  });
}

function doChargeAttack() {
  if (isChargeOnCooldown) return;

  dragon.isChargingForward = true;
  dragon.chargeTimer = 0.25;
  dragon.invulnerable = Math.max(dragon.invulnerable, 0.25);

  isChargeOnCooldown = true;
  chargeCooldownTimer = CHARGE_COOLDOWN;
  document.getElementById('cooldownIndicator').classList.remove('hidden');

  spawnParticles(dragon.x + dragon.width / 2, dragon.y + dragon.height / 2, '#ffff00', 20, 200);
}

function tryUpgradeFlame() {
  const cost = getUpgradeCost();
  if (essenceCount < cost) return;

  essenceCount -= cost;
  flameLevel++;

  spawnFloatingText(dragon.x, dragon.y - 50,
    `🔥 龙焰升级！Lv.${flameLevel}`, '#ffd700', 24);
  spawnParticles(dragon.x + dragon.width / 2, dragon.y + dragon.height / 2, '#ffd700', 30, 180);

  updateHUD();
  checkUpgradeHint();

  // 通知后端
  if (statusId) {
    fetch('/api/dragongame/upgradeflame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_id: statusId, essence_cost: cost })
    }).catch(() => {});
  }
}

function collectEssence(orb) {
  essenceCount++;
  spawnFloatingText(orb.x, orb.y, '+1 精华', '#ff88ff', 14);
  spawnParticles(orb.x, orb.y, '#ff88ff', 8, 60);
  updateHUD();
  checkUpgradeHint();

  // 通知后端
  if (statusId) {
    fetch('/api/dragongame/collectessence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_id: statusId, amount: 1 })
    }).catch(() => {});
  }
}

// ==================== 更新函数 ====================
function updateDragon(dt) {
  let mx = 0, my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;

  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }

  let speed = dragon.speed;
  if (dragon.isChargingForward) {
    speed = 900;
    mx = 1;
    my = 0;
    dragon.chargeTimer -= dt;
    if (dragon.chargeTimer <= 0) {
      dragon.isChargingForward = false;
    }
  }

  dragon.x += mx * speed * dt;
  dragon.y += my * speed * dt;

  // 边界限制
  dragon.x = Math.max(CANYON_LEFT, Math.min(CANYON_RIGHT - dragon.width, dragon.x));
  dragon.y = Math.max(30, Math.min(GAME_HEIGHT - dragon.height - 30, dragon.y));

  dragon.wingPhase += dt * (dragon.isChargingForward ? 15 : 8);

  if (dragon.invulnerable > 0) dragon.invulnerable -= dt;
  if (dragon.hitFlash > 0) dragon.hitFlash -= dt;

  // 冲锋冷却
  if (isChargeOnCooldown) {
    chargeCooldownTimer -= dt;
    if (chargeCooldownTimer <= 0) {
      isChargeOnCooldown = false;
      document.getElementById('cooldownIndicator').classList.add('hidden');
    }
  }

  // 蓄力
  if (keys[' ']) {
    isCharging = true;
    chargingTime += dt;
    chargePercent = Math.min(100, (chargingTime / MAX_CHARGE_TIME) * 100);

    const indicator = document.getElementById('chargingIndicator');
    indicator.classList.remove('hidden');
    if (chargePercent >= 100) {
      indicator.classList.add('max-charge');
      indicator.textContent = '🔥 满蓄力！';
    } else {
      indicator.classList.remove('max-charge');
      indicator.textContent = '蓄力中...';
    }

    document.getElementById('flameText').textContent = Math.round(chargePercent) + '%';
    document.getElementById('flameBarFill').style.width = chargePercent + '%';
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.animPhase += dt * 3;

    const dx = (dragon.x + dragon.width / 2) - (e.x + e.width / 2);
    const dy = (dragon.y + dragon.height / 2) - (e.y + e.height / 2);
    const dist = Math.hypot(dx, dy);
    let nx = dx / (dist || 1);
    let ny = dy / (dist || 1);

    switch (e.type) {
      case 'stone': {
        if (dist > e.attackRange * 0.8) {
          e.x += nx * e.speed * dt;
          e.y += ny * e.speed * 0.7 * dt;
        }
        if (dist < e.attackRange && e.attackCooldown <= 0) {
          if (checkRectCollision(e, dragon)) {
            damageDragon(e.damage);
            e.attackCooldown = 1.2;
          }
        }
        if (e.attackCooldown > 0) e.attackCooldown -= dt;
        break;
      }
      case 'hawk': {
        e.hoverOffset += dt * 2;
        const preferredDist = 220;
        if (dist < preferredDist - 30) {
          e.x -= nx * e.speed * dt;
          e.y -= ny * e.speed * 0.5 * dt;
        } else if (dist > preferredDist + 30) {
          e.x += nx * e.speed * 0.8 * dt;
          e.y += ny * e.speed * 0.4 * dt;
        }
        e.y += Math.sin(e.hoverOffset) * 30 * dt;

        if (e.attackCooldown > 0) {
          e.attackCooldown -= dt;
        } else if (dist < e.attackRange && dist > 80) {
          const sx = e.x + e.width / 2;
          const sy = e.y + e.height / 2;
          const tx = dragon.x + dragon.width / 2;
          const ty = dragon.y + dragon.height / 2;
          const angle = Math.atan2(ty - sy, tx - sx);

          projectiles.push({
            id: generateId(),
            type: 'arrow',
            x: sx, y: sy,
            vx: Math.cos(angle) * 350,
            vy: Math.sin(angle) * 350,
            size: 10,
            damage: e.damage,
            fromEnemy: true,
            life: 3
          });
          e.attackCooldown = 2.0 + Math.random() * 0.8;
        }
        break;
      }
      case 'rock': {
        const preferredDist = 280;
        if (dist < preferredDist - 50) {
          e.x -= nx * e.speed * dt;
          e.y -= ny * e.speed * 0.3 * dt;
        } else if (dist > preferredDist + 50) {
          e.x += nx * e.speed * 0.5 * dt;
          e.y += ny * e.speed * 0.3 * dt;
        }

        if (e.attackCooldown > 0) {
          e.attackCooldown -= dt;
        } else if (dist < e.attackRange) {
          const sx = e.x + e.width / 2;
          const sy = e.y + e.height / 2;
          const tx = dragon.x + dragon.width / 2;
          const ty = dragon.y + dragon.height / 2;
          const angle = Math.atan2(ty - sy, tx - sx);

          projectiles.push({
            id: generateId(),
            type: 'boulder',
            x: sx, y: sy,
            vx: Math.cos(angle) * 220,
            vy: Math.sin(angle) * 220,
            size: 24,
            damage: e.damage,
            fromEnemy: true,
            life: 4,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 6
          });
          e.attackCooldown = 5.0;
        }
        break;
      }
    }

    // 边界
    e.x = Math.max(CANYON_LEFT - 60, Math.min(CANYON_RIGHT + 20, e.x));
    e.y = Math.max(40, Math.min(GAME_HEIGHT - e.height - 40, e.y));

    // 冲锋撞击
    if (dragon.isChargingForward && checkRectCollision(dragon, e)) {
      const dmg = CHARGE_DAMAGE * getFlameDamageMultiplier();
      damageEnemy(e, dmg, 'charge');
      dragon.invulnerable = Math.max(dragon.invulnerable, 0.2);
    }
  }
}

function updateFlameBreaths(dt) {
  for (let i = flameBreaths.length - 1; i >= 0; i--) {
    const f = flameBreaths[i];
    f.life += dt;
    f.x = dragon.x + dragon.width;
    f.y = dragon.y + dragon.height / 2;

    // 检测命中
    for (const e of enemies) {
      if (f.hitSet.has(e.id)) continue;

      const ex = e.x + e.width / 2;
      const ey = e.y + e.height / 2;
      const dx = ex - f.x;
      const dy = ey - f.y;

      if (dx >= 0 && dx <= f.length) {
        const perpY = Math.abs(dy);
        if (perpY <= f.width / 2) {
          damageEnemy(e, f.dps * dt, 'flame');
          f.hitSet.add(e.id);
          setTimeout(() => f.hitSet.delete(e.id), 100);
        }
      }
    }

    if (f.life >= f.duration) {
      flameBreaths.splice(i, 1);
    }
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.type === 'boulder') {
      p.rotation += p.rotSpeed * dt;
    }

    if (p.fromEnemy && checkPointInRect(p.x, p.y, dragon)) {
      damageDragon(p.damage);
      spawnParticles(p.x, p.y, p.type === 'boulder' ? '#888' : '#aaa', 8);
      projectiles.splice(i, 1);
      continue;
    }

    if (p.x < -50 || p.x > GAME_WIDTH + 50 ||
        p.y < -50 || p.y > GAME_HEIGHT + 50 ||
        p.life <= 0) {
      projectiles.splice(i, 1);
    }
  }
}

function updateEssenceOrbs(dt) {
  for (let i = essenceOrbs.length - 1; i >= 0; i--) {
    const orb = essenceOrbs[i];
    orb.phase += dt * 4;
    orb.life -= dt;

    // 重力
    orb.vy += 180 * dt;
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;

    // 地面反弹
    if (orb.y > GAME_HEIGHT - 50) {
      orb.y = GAME_HEIGHT - 50;
      orb.vy *= -0.5;
      orb.vx *= 0.8;
    }

    // 磁吸效果
    const dx = (dragon.x + dragon.width / 2) - orb.x;
    const dy = (dragon.y + dragon.height / 2) - orb.y;
    const dist = Math.hypot(dx, dy);
    const pickupRange = 140;

    if (dist < pickupRange) {
      const pullSpeed = 500 * (1 - dist / pickupRange);
      orb.x += (dx / dist) * pullSpeed * dt;
      orb.y += (dy / dist) * pullSpeed * dt;
    }

    // 拾取
    if (checkPointInRect(orb.x, orb.y, dragon, 15)) {
      collectEssence(orb);
      essenceOrbs.splice(i, 1);
      continue;
    }

    if (orb.life <= 0) {
      essenceOrbs.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateFloatingTexts(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const f = floatingTexts[i];
    f.y += f.vy * dt;
    f.vy *= 0.98;
    f.life -= dt;
    if (f.life <= 0) floatingTexts.splice(i, 1);
  }
}

function updateWaveSpawning(dt) {
  if (waveTransition) return;

  waveSpawnTimer += dt;
  while (nextEnemyIndex < waveSpawnQueue.length &&
         waveSpawnTimer >= waveSpawnQueue[nextEnemyIndex].delay) {
    const spawn = waveSpawnQueue[nextEnemyIndex];
    spawnEnemy(spawn.type, spawn.fromLeft);
    nextEnemyIndex++;
  }
}

// ==================== 渲染函数 ====================
function drawCanyonBackground() {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  skyGrad.addColorStop(0, '#1a0a2e');
  skyGrad.addColorStop(0.5, '#3d1a2e');
  skyGrad.addColorStop(1, '#5c2a1a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 星星/火星
  const time = Date.now() * 0.001;
  for (let i = 0; i < 30; i++) {
    const x = (i * 137 + time * 20) % GAME_WIDTH;
    const y = 50 + (i * 73) % 150;
    const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 左崖壁
  const leftGrad = ctx.createLinearGradient(0, 0, CANYON_LEFT, 0);
  leftGrad.addColorStop(0, '#1a1410');
  leftGrad.addColorStop(0.5, '#3a2a1a');
  leftGrad.addColorStop(1, '#5a3a2a');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, CANYON_LEFT, GAME_HEIGHT);

  // 右崖壁
  const rightGrad = ctx.createLinearGradient(CANYON_RIGHT, 0, GAME_WIDTH, 0);
  rightGrad.addColorStop(0, '#5a3a2a');
  rightGrad.addColorStop(0.5, '#3a2a1a');
  rightGrad.addColorStop(1, '#1a1410');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(CANYON_RIGHT, 0, GAME_WIDTH - CANYON_RIGHT, GAME_HEIGHT);

  // 岩层纹理
  ctx.strokeStyle = 'rgba(100, 60, 30, 0.6)';
  ctx.lineWidth = 2;
  for (let y = 0; y < GAME_HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANYON_LEFT, y + 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANYON_RIGHT, y + 30);
    ctx.lineTo(GAME_WIDTH, y + 10);
    ctx.stroke();
  }

  // 地面
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
  const floorGrad = ctx.createLinearGradient(0, GAME_HEIGHT - 30, 0, GAME_HEIGHT);
  floorGrad.addColorStop(0, 'rgba(255,100,50,0.15)');
  floorGrad.addColorStop(1, 'rgba(255,50,0,0.3)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
}

function drawDragon() {
  ctx.save();

  if (dragon.invulnerable > 0 && Math.floor(dragon.invulnerable * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const cx = dragon.x + dragon.width / 2;
  const cy = dragon.y + dragon.height / 2;

  // 发光
  if (dragon.hitFlash > 0) {
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
  } else if (dragon.isChargingForward) {
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur = 40;
  } else {
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 20;
  }

  const wingOffset = Math.sin(dragon.wingPhase) * 15;

  // 翅膀
  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 18 + wingOffset, 25, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cc3300';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy + 18 - wingOffset, 25, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.ellipse(cx, cy, dragon.width / 2 - 5, dragon.height / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6347';
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy, dragon.width / 2 - 15, dragon.height / 2 - 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 头
  const hx = cx + 30;
  const hy = cy - 5;
  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.ellipse(hx, hy, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // 角
  ctx.fillStyle = '#ff6347';
  ctx.beginPath();
  ctx.moveTo(hx + 5, hy - 10);
  ctx.lineTo(hx + 12, hy - 28);
  ctx.lineTo(hx + 15, hy - 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 12);
  ctx.lineTo(hx - 5, hy - 30);
  ctx.lineTo(hx + 3, hy - 10);
  ctx.fill();

  // 眼睛
  ctx.fillStyle = '#ffffcc';
  ctx.beginPath();
  ctx.arc(hx + 12, hy - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(hx + 14, hy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 尾巴
  ctx.fillStyle = '#cc3300';
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy);
  ctx.quadraticCurveTo(cx - 65, cy - 5 + wingOffset * 0.3, cx - 80, cy + 8);
  ctx.quadraticCurveTo(cx - 65, cy + 5, cx - 40, cy + 8);
  ctx.fill();

  // 蓄力时嘴中冒火
  if (keys[' '] || chargePercent > 5) {
    const puff = 10 + Math.sin(Date.now() * 0.02) * 5;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(hx + 25, hy + 5, puff, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(hx + 28, hy + 5, puff * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    const cx = e.x + e.width / 2;
    const cy = e.y + e.height / 2;

    switch (e.type) {
      case 'stone': {
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 10;
        // 身体
        ctx.fillStyle = '#708090';
        ctx.fillRect(e.x + 8, e.y + 20, e.width - 16, e.height - 25);
        // 头
        ctx.fillStyle = '#8899aa';
        ctx.fillRect(e.x + 12, e.y + 5, e.width - 24, 25);
        // 眼睛
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 10, cy - 10, 5, 6);
        ctx.fillRect(cx + 5, cy - 10, 5, 6);
        // 纹理
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 2;
        ctx.strokeRect(e.x + 10, e.y + 22, e.width - 20, 5);
        ctx.strokeRect(e.x + 10, e.y + 35, e.width - 20, 5);
        break;
      }
      case 'hawk': {
        ctx.shadowColor = '#8b4513';
        ctx.shadowBlur = 8;
        const flap = Math.sin(e.animPhase) * 12;
        // 翅膀
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(cx - 15, cy - 5 + flap, 18, 7, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 15, cy - 5 + flap, 18, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // 身体
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.ellipse(cx, cy, e.width / 2 - 5, e.height / 2 - 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头
        const dir = e.fromLeft ? 1 : -1;
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(cx + dir * 18, cy - 3, 10, 0, Math.PI * 2);
        ctx.fill();
        // 喙
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(cx + dir * 25, cy - 3);
        ctx.lineTo(cx + dir * 35, cy);
        ctx.lineTo(cx + dir * 25, cy + 3);
        ctx.fill();
        // 眼
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx + dir * 20, cy - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'rock': {
        ctx.shadowColor = '#4a5a2a';
        ctx.shadowBlur = 15;
        // 身体 - 不规则多边形
        ctx.fillStyle = '#556b2f';
        ctx.beginPath();
        ctx.moveTo(e.x + 10, e.y + e.height);
        ctx.lineTo(e.x, cy + 5);
        ctx.lineTo(e.x + 8, e.y + 15);
        ctx.lineTo(e.x + e.width / 2, e.y);
        ctx.lineTo(e.x + e.width - 8, e.y + 18);
        ctx.lineTo(e.x + e.width, cy + 10);
        ctx.lineTo(e.x + e.width - 10, e.y + e.height);
        ctx.closePath();
        ctx.fill();
        // 高光面
        ctx.fillStyle = '#6b8e23';
        ctx.beginPath();
        ctx.moveTo(e.x + 15, cy);
        ctx.lineTo(e.x + 20, e.y + 18);
        ctx.lineTo(e.x + e.width / 2, e.y + 10);
        ctx.lineTo(e.x + e.width - 18, e.y + 25);
        ctx.lineTo(e.x + e.width - 15, cy + 10);
        ctx.closePath();
        ctx.fill();
        // 眼睛
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.fillRect(cx - 15, cy - 5, 8, 10);
        ctx.fillRect(cx + 7, cy - 5, 8, 10);
        // 攻击预警
        if (e.attackCooldown < 1) {
          const warnAlpha = 1 - e.attackCooldown;
          ctx.strokeStyle = `rgba(255,100,0,${warnAlpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, e.width / 2 + 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.shadowBlur = 0;

    // 血条
    if (e.hp < e.maxHp) {
      const barW = e.width;
      const barH = 5;
      const barY = e.y - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x, barY, barW, barH);
      const hpRatio = e.hp / e.maxHp;
      const hpColor = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillStyle = hpColor;
      ctx.fillRect(e.x, barY, barW * hpRatio, barH);
    }

    ctx.restore();
  }
}

function drawFlameBreaths() {
  for (const f of flameBreaths) {
    ctx.save();
    const progress = f.life / f.duration;
    const alpha = 1 - progress * 0.5;

    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const layerLen = f.length * (1 - t * 0.3);
      const layerW = f.width * (1 - t * 0.5);
      const hue = 30 + t * 30;
      const a = alpha * (1 - t * 0.4);

      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 25;

      const grad = ctx.createLinearGradient(f.x, f.y, f.x + layerLen, f.y);
      grad.addColorStop(0, `hsla(${hue + 20}, 100%, 80%, ${a})`);
      grad.addColorStop(0.4, `hsla(${hue}, 100%, 60%, ${a * 0.9})`);
      grad.addColorStop(1, `hsla(${hue - 10}, 100%, 40%, 0)`);

      ctx.fillStyle = grad;
      const wobble = Math.sin(Date.now() * 0.01 + i) * 6;
      ctx.beginPath();
      ctx.ellipse(f.x + layerLen / 2, f.y + wobble, layerLen / 2, layerW / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    if (p.type === 'arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.strokeStyle = '#aa7744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(14, -4);
      ctx.lineTo(14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#aa4444';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-18, -4);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'boulder') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.shadowColor = '#666';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = p.size * (0.8 + Math.sin(i * 2.3) * 0.2);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.arc(-p.size * 0.2, -p.size * 0.2, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawEssenceOrbs() {
  for (const orb of essenceOrbs) {
    ctx.save();
    const pulse = 1 + Math.sin(orb.phase) * 0.15;
    const alpha = orb.life > 1 ? 1 : orb.life;

    ctx.shadowColor = '#ff88ff';
    ctx.shadowBlur = 20;

    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size * pulse);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.4, `rgba(255,180,255,${alpha})`);
    grad.addColorStop(0.8, `rgba(255,100,255,${alpha * 0.8})`);
    grad.addColorStop(1, `rgba(200,50,255,0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,200,${alpha})`;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 0.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  for (const f of floatingTexts) {
    const alpha = f.life > 0.3 ? 1 : f.life / 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${f.size}px 'Segoe UI', 'Microsoft YaHei', sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 10;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawCanyonBackground();
  drawEssenceOrbs();
  drawFlameBreaths();
  drawEnemies();
  drawDragon();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
}

// ==================== HUD 更新 ====================
function updateHUD() {
  document.getElementById('hpText').textContent = `${Math.round(currentHp)} / ${DRAGON_MAX_HP}`;
  document.getElementById('hpBarFill').style.width = (currentHp / DRAGON_MAX_HP * 100) + '%';
  document.getElementById('killsValue').textContent = enemiesKilled;
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('essenceValue').textContent = essenceCount;
  document.getElementById('flameLevelValue').textContent = `Lv.${flameLevel}`;
  document.getElementById('flameBonusValue').textContent = `(+${Math.round((getFlameDamageMultiplier() - 1) * 100)}%)`;
}

function checkUpgradeHint() {
  const hint = document.getElementById('upgradeHint');
  const cost = getUpgradeCost();
  document.getElementById('upgradeCost').textContent = cost;

  if (essenceCount >= cost) {
    hint.classList.remove('hidden');
  } else {
    hint.classList.add('hidden');
  }
}

// ==================== 游戏主循环 ====================
function gameLoop(timestamp) {
  if (gameState !== 'playing') return;

  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  updateWaveSpawning(dt);
  updateDragon(dt);
  updateEnemies(dt);
  updateFlameBreaths(dt);
  updateProjectiles(dt);
  updateEssenceOrbs(dt);
  updateParticles(dt);
  updateFloatingTexts(dt);

  render();

  animationId = requestAnimationFrame(gameLoop);
}

// ==================== 游戏状态管理 ====================
function startGame() {
  playerName = document.getElementById('playerName').value || 'DragonRider';

  // 重置游戏状态
  wave = 1;
  enemiesKilled = 0;
  score = 0;
  essenceCount = 0;
  flameLevel = 1;
  currentHp = DRAGON_MAX_HP;
  chargePercent = 0;
  chargingTime = 0;
  isCharging = false;
  isChargeOnCooldown = false;
  chargeCooldownTimer = 0;

  dragon.x = GAME_WIDTH * 0.3;
  dragon.y = GAME_HEIGHT * 0.5;
  dragon.wingPhase = 0;
  dragon.isChargingForward = false;
  dragon.invulnerable = 0;
  dragon.hitFlash = 0;

  enemies.length = 0;
  flameBreaths.length = 0;
  projectiles.length = 0;
  essenceOrbs.length = 0;
  particles.length = 0;
  floatingTexts.length = 0;

  // 更新UI
  updateHUD();
  checkUpgradeHint();
  document.getElementById('chargingIndicator').classList.add('hidden');
  document.getElementById('cooldownIndicator').classList.add('hidden');

  // 切换界面
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  gameState = 'playing';

  // 请求后端创建游戏记录
  fetch('/api/dragongame/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name: playerName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === 0 && data.data) {
      recordId = data.data.record.id;
      statusId = data.data.dragon_status.id;
    }
  })
  .catch(() => {
    // 离线模式也可以玩
    recordId = null;
    statusId = null;
  });

  // 开始第一波
  startWave(1);

  // 启动游戏循环
  lastTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function saveProgress() {
  if (recordId) {
    fetch('/api/dragongame/saveprogress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_id: recordId,
        wave_reached: wave,
        enemies_killed: enemiesKilled,
        score: score
      })
    }).catch(() => {});
  }
}

function onGameOver() {
  gameState = 'gameover';
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // 提交最终成绩
  if (recordId) {
    fetch('/api/dragongame/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_id: recordId,
        wave_reached: wave,
        enemies_killed: enemiesKilled,
        score: score
      })
    }).catch(() => {});
  }

  setTimeout(() => {
    // 更新结束界面数据
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('finalKills').textContent = enemiesKilled;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalFlameLevel').textContent = `Lv.${flameLevel}`;
    document.getElementById('finalEssence').textContent = essenceCount;
    document.getElementById('finalDmg').textContent = `+${Math.round((getFlameDamageMultiplier() - 1) * 100)}%`;

    // 评级
    let grade, gradeClass, gradeDesc;
    if (score >= 10000) {
      grade = 'S+'; gradeClass = 'grade-s'; gradeDesc = '传奇龙骑士！你是真正的火龙王者！';
    } else if (score >= 7000) {
      grade = 'S'; gradeClass = 'grade-s'; gradeDesc = '卓越表现！峡谷因你而震颤！';
    } else if (score >= 5000) {
      grade = 'A'; gradeClass = 'grade-a'; gradeDesc = '出色的战斗！你是勇者中的强者！';
    } else if (score >= 3000) {
      grade = 'B'; gradeClass = 'grade-b'; gradeDesc = '不错的表现！继续磨砺你的火焰！';
    } else if (score >= 1500) {
      grade = 'C'; gradeClass = 'grade-c'; gradeDesc = '合格的战绩，但你可以做得更好！';
    } else if (score >= 500) {
      grade = 'D'; gradeClass = 'grade-low'; gradeDesc = '勉强通关，多加练习吧！';
    } else {
      grade = 'E'; gradeClass = 'grade-low'; gradeDesc = '初出茅庐，勇敢地再战一次吧！';
    }

    const gradeEl = document.getElementById('grade');
    gradeEl.textContent = grade;
    gradeEl.className = 'grade ' + gradeClass;
    document.getElementById('gradeDesc').textContent = gradeDesc;

    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }, 800);
}

function restartGame() {
  startGame();
}

function backToMenu() {
  gameState = 'start';
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
}

// ==================== 输入处理 ====================
function handleKeyDown(e) {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === ' ' || k === 'shift' || k === 'e') {
    e.preventDefault();
  }

  if (k === 'shift' && gameState === 'playing') {
    doChargeAttack();
  }

  if (k === 'e' && gameState === 'playing') {
    tryUpgradeFlame();
  }
}

function handleKeyUp(e) {
  const k = e.key.toLowerCase();
  keys[k] = false;

  if (k === ' ' && isCharging) {
    if (chargingTime >= 0.15) {
      fireFlameBreath();
    }
    isCharging = false;
    chargingTime = 0;
    chargePercent = 0;
    document.getElementById('chargingIndicator').classList.add('hidden');
    document.getElementById('flameBarFill').style.width = '0%';
    document.getElementById('flameText').textContent = '0%';
  }
}

// ==================== 初始化 ====================
function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

function resizeCanvas() {
  if (!canvas) return;
  const wrapper = canvas.parentElement;
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;
  const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
  canvas.style.width = (GAME_WIDTH * scale) + 'px';
  canvas.style.height = (GAME_HEIGHT * scale) + 'px';
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

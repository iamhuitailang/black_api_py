<template>
  <div class="game-wrapper">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <div class="hud">
      <div class="hud-left">
        <div class="hp-bar-wrapper">
          <div class="hp-label">
            <span>🐉 龙的生命</span>
            <span class="hp-text">{{ currentHp }} / {{ maxHp }}</span>
          </div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill" :style="{ width: hpPercent + '%' }"></div>
          </div>
        </div>

        <div class="flame-bar-wrapper">
          <div class="flame-label">
            <span>🔥 蓄力</span>
            <span class="flame-text">{{ Math.round(chargePercent) }}%</span>
          </div>
          <div class="flame-bar-bg">
            <div
              class="flame-bar-fill"
              :style="{ width: chargePercent + '%', background: flameBarGradient }"
            ></div>
          </div>
        </div>
      </div>

      <div class="hud-center">
        <div class="wave-display">
          <span class="wave-label">波次</span>
          <span class="wave-number">{{ wave }}</span>
          <span v-if="waveTransition" class="wave-incoming">
            下一波即将来袭！
          </span>
        </div>
      </div>

      <div class="hud-right">
        <div class="stat-item">
          <span class="stat-icon">💀</span>
          <span class="stat-label">击杀</span>
          <span class="stat-value">{{ enemiesKilled }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <span class="stat-label">得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-item essence">
          <span class="stat-icon">✨</span>
          <span class="stat-label">精华</span>
          <span class="stat-value">{{ essenceCount }}</span>
        </div>
        <div class="stat-item flame-level" :title="flameUpgradeTooltip">
          <span class="stat-icon">🔥</span>
          <span class="stat-label">龙焰</span>
          <span class="stat-value">Lv.{{ flameLevel }}</span>
          <span class="stat-sub">(+{{ flameBonusPercent }}%)</span>
        </div>
      </div>
    </div>

    <div v-if="canUpgrade" class="upgrade-hint">
      按 [E] 升级龙焰 (消耗 {{ upgradeCost }} 精华)
    </div>

    <div v-if="showWaveBanner" class="wave-banner">
      <span class="banner-wave">第 {{ wave }} 波</span>
      <span class="banner-enemy-count">{{ currentWaveTotal }} 个敌人来袭！</span>
    </div>

    <div v-if="isCharging" class="charging-indicator" :class="{ 'max-charge': chargePercent >= 100 }">
      {{ chargePercent >= 100 ? '🔥 满蓄力！' : '蓄力中...' }}
    </div>

    <div v-if="isChargingCooldown" class="cooldown-indicator">
      冲锋冷却中...
    </div>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
const props = defineProps({
 dragonStatus: {
 type: Object,
 default: () => ({ flame_level: 1, flame_damage_multiplier: 1.0, essence_collected: 0, charge_damage: 30, max_hp: 150 })
 },
 recordData: {
 type: Object,
 default: () => ({ wave_reached: 1, enemies_killed: 0, score: 0 })
 }
});
const emit = defineEmits(['gameOver', 'waveComplete', 'enemyKilled', 'essenceCollected', 'flameUpgrade']);
const canvas = ref(null);
let ctx = null;
let animationId = null;
let lastTime = 0;
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;
const CANYON_LEFT = 80;
const CANYON_RIGHT = GAME_WIDTH - 80;
const BASE_FLAME_DAMAGE_PER_SEC = 8;
const CHARGE_DAMAGE_BASE = 30;
const MAX_CHARGE_TIME = 2.0;
const CHARGE_COOLDOWN = 3.0;
const ESSENCE_DROP_RATE = 0.3;
const wave = ref(1);
const enemiesKilled = ref(0);
const score = ref(0);
const essenceCount = ref(0);
const flameLevel = ref(1);
const maxHp = ref(150);
const currentHp = ref(150);
const chargePercent = ref(0);
const isCharging = ref(false);
const isChargingCooldown = ref(false);
const canUpgrade = ref(false);
const showWaveBanner = ref(false);
const waveTransition = ref(false);
const currentWaveTotal = ref(0);
let chargingTime = 0;
let cooldownTimer = 0;
const hpPercent = computed(() => Math.max(0, (currentHp.value / maxHp.value) * 100));
const flameBonusPercent = computed(() => Math.round((flameDamageMultiplier - 1) * 100));
const flameDamageMultiplier = computed(() => 1 + (flameLevel.value - 1) * 0.15);
const upgradeCost = computed(() => Math.ceil(flameLevel.value * 1.5));
const flameBarGradient = computed(() => {
 const p = chargePercent.value;
 if (p < 50)
 return 'linear-gradient(90deg, #ff8c00, #ffa500)';
 if (p < 100)
 return 'linear-gradient(90deg, #ff4500, #ff6347)';
 return 'linear-gradient(90deg, #fff, #ffd700, #ff4500)';
});
const flameUpgradeTooltip = computed(() => {
 return `升级龙焰可获得 +15% 火焰伤害加成\n当前伤害加成: +${flameBonusPercent.value}%\n升级消耗: ${upgradeCost.value} 精华`;
});
const dragon = reactive({
 x: GAME_WIDTH * 0.3,
 y: GAME_HEIGHT * 0.5,
 width: 90,
 height: 55,
 speed: 320,
 vx: 0,
 vy: 0,
 wingPhase: 0,
 isChargingForward: false,
 chargeDirection: { x: 1, y: 0 },
 chargeTimer: 0,
 invulnerable: 0,
 hitFlash: 0
});
const keys = reactive({});
const enemies = reactive([]);
const flameBreaths = reactive([]);
const projectiles = reactive([]);
const essenceOrbs = reactive([]);
const particles = reactive([]);
const floatingTexts = reactive([]);
let enemiesSpawnedThisWave = 0;
let enemiesRemaining = 0;
let waveSpawnTimer = 0;
let waveSpawnInterval = 0;
let nextEnemyIndex = 0;
let waveSpawnQueue = [];
const spawnEnemy = (type, fromLeft) => {
 const x = fromLeft ? CANYON_LEFT - 30 : CANYON_RIGHT + 30;
 const y = 80 + Math.random() * (GAME_HEIGHT - 160);
 let enemy;
 switch (type) {
 case 'stone':
 enemy = {
 id: Math.random().toString(36).substr(2, 9),
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
 id: Math.random().toString(36).substr(2, 9),
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
 id: Math.random().toString(36).substr(2, 9),
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
};
const planWave = (waveNum) => {
 const queue = [];
 const baseCount = 3 + waveNum * 2;
 for (let i = 0; i < baseCount; i++) {
 let type;
 const roll = Math.random();
 if (waveNum <= 2) {
 type = roll < 0.7 ? 'stone' : 'hawk';
 }
 else if (waveNum <= 4) {
 if (roll < 0.5)
 type = 'stone';
 else if (roll < 0.85)
 type = 'hawk';
 else
 type = 'rock';
 }
 else {
 if (roll < 0.35)
 type = 'stone';
 else if (roll < 0.7)
 type = 'hawk';
 else
 type = 'rock';
 }
 queue.push({
 type,
 fromLeft: Math.random() < 0.5,
 delay: i * (0.6 + Math.random() * 0.4)
 });
 }
 currentWaveTotal.value = queue.length;
 return queue;
};
const startWave = (waveNum) => {
 wave.value = waveNum;
 enemiesSpawnedThisWave = 0;
 enemiesRemaining = 0;
 nextEnemyIndex = 0;
 waveSpawnQueue = planWave(waveNum);
 enemiesRemaining = waveSpawnQueue.length;
 waveSpawnTimer = 0;
 showWaveBanner.value = true;
 setTimeout(() => { showWaveBanner.value = false; }, 2000);
};
const spawnParticles = (x, y, color, count, speed = 100) => {
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
};
const spawnFloatingText = (x, y, text, color = '#fff', size = 18) => {
 floatingTexts.push({
 x, y, text, color, size,
 life: 1.2,
 vy: -60
 });
};
const damageEnemy = (enemy, damage, source = 'flame') => {
 enemy.hp -= damage;
 spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, source === 'charge' ? '#ffdd00' : '#ff6600', 6, 80);
 spawnFloatingText(enemy.x + enemy.width / 2, enemy.y, `-${Math.round(damage)}`, source === 'charge' ? '#ffdd00' : '#ff8800', 16);
 if (enemy.hp <= 0) {
 killEnemy(enemy);
 }
};
const killEnemy = (enemy) => {
 const idx = enemies.findIndex(e => e.id === enemy.id);
 if (idx === -1)
 return;
 spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff4400', 18, 150);
 spawnFloatingText(enemy.x + enemy.width / 2, enemy.y, `+${enemy.scoreValue}`, '#ffd700', 20);
 if (Math.random() < ESSENCE_DROP_RATE || enemy.type === 'rock') {
 const drops = enemy.type === 'rock' ? 2 : 1;
 for (let i = 0; i < drops; i++) {
 essenceOrbs.push({
 id: Math.random().toString(36).substr(2, 9),
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
 enemiesKilled.value += 1;
 score.value += enemy.scoreValue;
 enemiesRemaining--;
 emit('enemyKilled', enemiesKilled.value, score.value);
 if (enemiesRemaining <= 0 && nextEnemyIndex >= waveSpawnQueue.length) {
 onWaveCleared();
 }
};
const onWaveCleared = () => {
 waveTransition.value = true;
 score.value += wave.value * 500;
 spawnFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `波次完成！+${wave.value * 500}`, '#ffd700', 32);
 setTimeout(() => {
 waveTransition.value = false;
 emit('waveComplete', wave.value, enemiesKilled.value, score.value);
 startWave(wave.value + 1);
 }, 2500);
};
const damageDragon = (damage) => {
 if (dragon.invulnerable > 0)
 return;
 currentHp.value = Math.max(0, currentHp.value - damage);
 dragon.invulnerable = 0.8;
 dragon.hitFlash = 0.3;
 spawnFloatingText(dragon.x, dragon.y - 30, `-${damage}`, '#ff3333', 20);
 if (currentHp.value <= 0) {
 onGameOver();
 }
};
const onGameOver = () => {
 if (animationId) {
 cancelAnimationFrame(animationId);
 animationId = null;
 }
 setTimeout(() => {
 emit('gameOver', {
 wave_reached: wave.value,
 enemies_killed: enemiesKilled.value,
 score: score.value
 });
 }, 800);
};
const collectEssence = (orb) => {
 essenceCount.value += 1;
 emit('essenceCollected', 1);
 canUpgrade.value = essenceCount.value >= upgradeCost.value;
 spawnFloatingText(orb.x, orb.y, '+1 精华', '#ff88ff', 14);
 spawnParticles(orb.x, orb.y, '#ff88ff', 8, 60);
};
const tryUpgradeFlame = () => {
 if (essenceCount.value < upgradeCost.value) {
 canUpgrade.value = false;
 return;
 }
 essenceCount.value -= upgradeCost.value;
 flameLevel.value += 1;
 emit('flameUpgrade');
 canUpgrade.value = essenceCount.value >= upgradeCost.value;
 spawnFloatingText(dragon.x, dragon.y - 50, `🔥 龙焰升级！Lv.${flameLevel.value}`, '#ffd700', 24);
 spawnParticles(dragon.x + dragon.width / 2, dragon.y + dragon.height / 2, '#ffd700', 30, 180);
};
const fireFlameBreath = () => {
 const chargeMul = 1 + (chargePercent.value / 100) * 2;
 const dps = BASE_FLAME_DAMAGE_PER_SEC * flameDamageMultiplier.value * chargeMul;
 const length = 180 + chargePercent.value * 0.8;
 const width = 50 + chargePercent.value * 0.3;
 flameBreaths.push({
 id: Math.random().toString(36).substr(2, 9),
 x: dragon.x + dragon.width,
 y: dragon.y + dragon.height / 2,
 length,
 width,
 dps,
 duration: chargePercent.value >= 100 ? 0.8 : 0.4,
 life: 0,
 hitSet: new Set()
 });
};
const doChargeAttack = () => {
 if (isChargingCooldown.value)
 return;
 dragon.isChargingForward = true;
 dragon.chargeTimer = 0.25;
 dragon.chargeDirection = { x: 1, y: 0 };
 dragon.invulnerable = Math.max(dragon.invulnerable, 0.25);
 isChargingCooldown.value = true;
 cooldownTimer = CHARGE_COOLDOWN;
 spawnParticles(dragon.x + dragon.width / 2, dragon.y + dragon.height / 2, '#ffff00', 20, 200);
};
const updateDragon = (dt) => {
 let mx = 0, my = 0;
 if (keys['w'] || keys['arrowup'])
 my -= 1;
 if (keys['s'] || keys['arrowdown'])
 my += 1;
 if (keys['a'] || keys['arrowleft'])
 mx -= 1;
 if (keys['d'] || keys['arrowright'])
 mx += 1;
 const len = Math.hypot(mx, my);
 if (len > 0) {
 mx /= len;
 my /= len;
 }
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
 dragon.x = Math.max(CANYON_LEFT, Math.min(CANYON_RIGHT - dragon.width, dragon.x));
 dragon.y = Math.max(30, Math.min(GAME_HEIGHT - dragon.height - 30, dragon.y));
 dragon.wingPhase += dt * (dragon.isChargingForward ? 15 : 8);
 if (dragon.invulnerable > 0)
 dragon.invulnerable -= dt;
 if (dragon.hitFlash > 0)
 dragon.hitFlash -= dt;
 if (isChargingCooldown.value) {
 cooldownTimer -= dt;
 if (cooldownTimer <= 0) {
 isChargingCooldown.value = false;
 }
 }
 if (keys[' ']) {
 isCharging.value = true;
 chargingTime += dt;
 chargePercent.value = Math.min(100, (chargingTime / MAX_CHARGE_TIME) * 100);
 }
};
const updateEnemies = (dt) => {
 for (let i = enemies.length - 1; i >= 0; i--) {
 const e = enemies[i];
 e.animPhase += dt * 3;
 let dx = dragon.x + dragon.width / 2 - (e.x + e.width / 2);
 let dy = dragon.y + dragon.height / 2 - (e.y + e.height / 2);
 const dist = Math.hypot(dx, dy);
 if (dist > 0) {
 dx /= dist;
 dy /= dist;
 }
 switch (e.type) {
 case 'stone': {
 if (dist > e.attackRange * 0.8) {
 e.x += dx * e.speed * dt;
 e.y += dy * e.speed * 0.7 * dt;
 }
 if (dist < e.attackRange && e.attackCooldown <= 0) {
 if (checkRectCollision(e, dragon)) {
 damageDragon(e.damage);
 e.attackCooldown = 1.2;
 }
 }
 break;
 }
 case 'hawk': {
 e.hoverOffset += dt * 2;
 const preferredDist = 220;
 if (dist < preferredDist - 30) {
 e.x -= dx * e.speed * dt;
 e.y -= dy * e.speed * 0.5 * dt;
 }
 else if (dist > preferredDist + 30) {
 e.x += dx * e.speed * 0.8 * dt;
 e.y += dy * e.speed * 0.4 * dt;
 }
 e.y += Math.sin(e.hoverOffset) * 30 * dt;
 if (e.attackCooldown > 0) {
 e.attackCooldown -= dt;
 }
 else if (dist < e.attackRange && dist > 80) {
 const sx = e.x + e.width / 2;
 const sy = e.y + e.height / 2;
 const tx = dragon.x + dragon.width / 2;
 const ty = dragon.y + dragon.height / 2;
 const angle = Math.atan2(ty - sy, tx - sx);
 projectiles.push({
 id: Math.random().toString(36).substr(2, 9),
 type: 'arrow',
 x: sx,
 y: sy,
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
 e.x -= dx * e.speed * dt;
 e.y -= dy * e.speed * 0.3 * dt;
 }
 else if (dist > preferredDist + 50) {
 e.x += dx * e.speed * 0.5 * dt;
 e.y += dy * e.speed * 0.3 * dt;
 }
 if (e.attackCooldown > 0) {
 e.attackCooldown -= dt;
 }
 else if (dist < e.attackRange) {
 const sx = e.x + e.width / 2;
 const sy = e.y + e.height / 2;
 const tx = dragon.x + dragon.width / 2;
 const ty = dragon.y + dragon.height / 2;
 const angle = Math.atan2(ty - sy, tx - sx);
 projectiles.push({
 id: Math.random().toString(36).substr(2, 9),
 type: 'boulder',
 x: sx,
 y: sy,
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
 e.x = Math.max(CANYON_LEFT - 60, Math.min(CANYON_RIGHT + 20, e.x));
 e.y = Math.max(40, Math.min(GAME_HEIGHT - e.height - 40, e.y));
 if (dragon.isChargingForward && checkRectCollision(dragon, e)) {
 const dmg = (CHARGE_DAMAGE_BASE + props.dragonStatus.charge_damage * 0) * flameDamageMultiplier.value;
 damageEnemy(e, dmg, 'charge');
 dragon.invulnerable = Math.max(dragon.invulnerable, 0.2);
 }
 }
};
const updateFlameBreaths = (dt) => {
 for (let i = flameBreaths.length - 1; i >= 0; i--) {
 const f = flameBreaths[i];
 f.life += dt;
 f.x = dragon.x + dragon.width;
 f.y = dragon.y + dragon.height / 2;
 for (const e of enemies) {
 if (f.hitSet.has(e.id))
 continue;
 const ex = e.x + e.width / 2;
 const ey = e.y + e.height / 2;
 const dx = ex - f.x;
 const dy = ey - f.y;
 const projX = dx;
 if (projX >= 0 && projX <= f.length) {
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
};
const updateProjectiles = (dt) => {
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
};
const updateEssenceOrbs = (dt) => {
 for (let i = essenceOrbs.length - 1; i >= 0; i--) {
 const orb = essenceOrbs[i];
 orb.phase += dt * 4;
 orb.life -= dt;
 orb.vy += 180 * dt;
 orb.x += orb.vx * dt;
 orb.y += orb.vy * dt;
 if (orb.y > GAME_HEIGHT - 50) {
 orb.y = GAME_HEIGHT - 50;
 orb.vy *= -0.5;
 orb.vx *= 0.8;
 }
 const dx = (dragon.x + dragon.width / 2) - orb.x;
 const dy = (dragon.y + dragon.height / 2) - orb.y;
 const dist = Math.hypot(dx, dy);
 const pickupRange = 140;
 if (dist < pickupRange) {
 const pullSpeed = 500 * (1 - dist / pickupRange);
 orb.x += (dx / dist) * pullSpeed * dt;
 orb.y += (dy / dist) * pullSpeed * dt;
 }
 if (checkPointInRect(orb.x, orb.y, dragon, 15)) {
 collectEssence(orb);
 essenceOrbs.splice(i, 1);
 continue;
 }
 if (orb.life <= 0) {
 essenceOrbs.splice(i, 1);
 }
 }
};
const updateParticles = (dt) => {
 for (let i = particles.length - 1; i >= 0; i--) {
 const p = particles[i];
 p.x += p.vx * dt;
 p.y += p.vy * dt;
 p.vx *= 0.96;
 p.vy *= 0.96;
 p.life -= dt;
 if (p.life <= 0)
 particles.splice(i, 1);
 }
};
const updateFloatingTexts = (dt) => {
 for (let i = floatingTexts.length - 1; i >= 0; i--) {
 const f = floatingTexts[i];
 f.y += f.vy * dt;
 f.vy *= 0.98;
 f.life -= dt;
 if (f.life <= 0)
 floatingTexts.splice(i, 1);
 }
};
const updateWaveSpawning = (dt) => {
 if (waveTransition.value)
 return;
 waveSpawnTimer += dt;
 while (nextEnemyIndex < waveSpawnQueue.length &&
 waveSpawnTimer >= waveSpawnQueue[nextEnemyIndex].delay) {
 const spawn = waveSpawnQueue[nextEnemyIndex];
 spawnEnemy(spawn.type, spawn.fromLeft);
 nextEnemyIndex++;
 }
};
const checkRectCollision = (a, b) => {
 return a.x < b.x + b.width &&
 a.x + a.width > b.x &&
 a.y < b.y + b.height &&
 a.y + a.height > b.y;
};
const checkPointInRect = (px, py, r, padding = 0) => {
 return px >= r.x - padding &&
 px <= r.x + r.width + padding &&
 py >= r.y - padding &&
 py <= r.y + r.height + padding;
};
const drawCanyonBackground = () => {
 const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
 skyGrad.addColorStop(0, '#1a0a2e');
 skyGrad.addColorStop(0.5, '#3d1a2e');
 skyGrad.addColorStop(1, '#5c2a1a');
 ctx.fillStyle = skyGrad;
 ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
 for (let i = 0; i < 30; i++) {
 const x = (i * 137 + Date.now() * 0.005) % GAME_WIDTH;
 const y = 50 + (i * 73) % 150;
 const alpha = 0.3 + Math.sin(Date.now() * 0.002 + i) * 0.2;
 ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
 ctx.beginPath();
 ctx.arc(x, y, 1.5, 0, Math.PI * 2);
 ctx.fill();
 }
 const leftGrad = ctx.createLinearGradient(0, 0, CANYON_LEFT, 0);
 leftGrad.addColorStop(0, '#1a1410');
 leftGrad.addColorStop(0.5, '#3a2a1a');
 leftGrad.addColorStop(1, '#5a3a2a');
 ctx.fillStyle = leftGrad;
 ctx.fillRect(0, 0, CANYON_LEFT, GAME_HEIGHT);
 const rightGrad = ctx.createLinearGradient(CANYON_RIGHT, 0, GAME_WIDTH, 0);
 rightGrad.addColorStop(0, '#5a3a2a');
 rightGrad.addColorStop(0.5, '#3a2a1a');
 rightGrad.addColorStop(1, '#1a1410');
 ctx.fillStyle = rightGrad;
 ctx.fillRect(CANYON_RIGHT, 0, GAME_WIDTH - CANYON_RIGHT, GAME_HEIGHT);
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
 ctx.fillStyle = '#2a1a0a';
 ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
 const floorGrad = ctx.createLinearGradient(0, GAME_HEIGHT - 30, 0, GAME_HEIGHT);
 floorGrad.addColorStop(0, 'rgba(255,100,50,0.15)');
 floorGrad.addColorStop(1, 'rgba(255,50,0,0.3)');
 ctx.fillStyle = floorGrad;
 ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
};
const drawDragon = () => {
 ctx.save();
 if (dragon.invulnerable > 0 && Math.floor(dragon.invulnerable * 20) % 2 === 0) {
 ctx.globalAlpha = 0.5;
 }
 const cx = dragon.x + dragon.width / 2;
 const cy = dragon.y + dragon.height / 2;
 if (dragon.hitFlash > 0) {
 ctx.shadowColor = '#ff0000';
 ctx.shadowBlur = 30;
 }
 else if (dragon.isChargingForward) {
 ctx.shadowColor = '#ffdd00';
 ctx.shadowBlur = 40;
 }
 else {
 ctx.shadowColor = '#ff4500';
 ctx.shadowBlur = 20;
 }
 const wingOffset = Math.sin(dragon.wingPhase) * 15;
 ctx.fillStyle = '#ff4500';
 ctx.beginPath();
 ctx.ellipse(cx - 10, cy - 18 + wingOffset, 25, 12, -0.3, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#cc3300';
 ctx.beginPath();
 ctx.ellipse(cx - 10, cy + 18 - wingOffset, 25, 12, 0.3, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#ff4500';
 ctx.beginPath();
 ctx.ellipse(cx, cy, dragon.width / 2 - 5, dragon.height / 2 - 5, 0, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#ff6347';
 ctx.beginPath();
 ctx.ellipse(cx + 5, cy, dragon.width / 2 - 15, dragon.height / 2 - 12, 0, 0, Math.PI * 2);
 ctx.fill();
 const hx = cx + 30;
 const hy = cy - 5;
 ctx.fillStyle = '#ff4500';
 ctx.beginPath();
 ctx.ellipse(hx, hy, 22, 16, 0, 0, Math.PI * 2);
 ctx.fill();
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
 ctx.fillStyle = '#ffffcc';
 ctx.beginPath();
 ctx.arc(hx + 12, hy - 3, 5, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#111';
 ctx.beginPath();
 ctx.arc(hx + 14, hy - 3, 2.5, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#cc3300';
 ctx.beginPath();
 ctx.moveTo(cx - 40, cy);
 ctx.quadraticCurveTo(cx - 65, cy - 5 + wingOffset * 0.3, cx - 80, cy + 8);
 ctx.quadraticCurveTo(cx - 65, cy + 5, cx - 40, cy + 8);
 ctx.fill();
 if (keys[' '] || chargePercent.value > 5) {
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
};
const drawEnemies = () => {
 for (const e of enemies) {
 ctx.save();
 const cx = e.x + e.width / 2;
 const cy = e.y + e.height / 2;
 switch (e.type) {
 case 'stone': {
 ctx.shadowColor = '#666';
 ctx.shadowBlur = 10;
 ctx.fillStyle = '#708090';
 ctx.fillRect(e.x + 8, e.y + 20, e.width - 16, e.height - 25);
 ctx.fillStyle = '#8899aa';
 ctx.fillRect(e.x + 12, e.y + 5, e.width - 24, 25);
 ctx.fillStyle = '#ff3300';
 ctx.shadowColor = '#ff3300';
 ctx.shadowBlur = 8;
 ctx.fillRect(cx - 10, cy - 10, 5, 6);
 ctx.fillRect(cx + 5, cy - 10, 5, 6);
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
 ctx.fillStyle = '#8b4513';
 ctx.beginPath();
 ctx.ellipse(cx - 15, cy - 5 + flap, 18, 7, -0.4, 0, Math.PI * 2);
 ctx.fill();
 ctx.beginPath();
 ctx.ellipse(cx + 15, cy - 5 + flap, 18, 7, 0.4, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#a0522d';
 ctx.beginPath();
 ctx.ellipse(cx, cy, e.width / 2 - 5, e.height / 2 - 3, 0, 0, Math.PI * 2);
 ctx.fill();
 const dir = e.fromLeft ? 1 : -1;
 ctx.fillStyle = '#654321';
 ctx.beginPath();
 ctx.arc(cx + dir * 18, cy - 3, 10, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#ffcc00';
 ctx.beginPath();
 ctx.moveTo(cx + dir * 25, cy - 3);
 ctx.lineTo(cx + dir * 35, cy);
 ctx.lineTo(cx + dir * 25, cy + 3);
 ctx.fill();
 ctx.fillStyle = '#ff0000';
 ctx.beginPath();
 ctx.arc(cx + dir * 20, cy - 5, 2.5, 0, Math.PI * 2);
 ctx.fill();
 break;
 }
 case 'rock': {
 ctx.shadowColor = '#4a5a2a';
 ctx.shadowBlur = 15;
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
 ctx.fillStyle = '#6b8e23';
 ctx.beginPath();
 ctx.moveTo(e.x + 15, cy);
 ctx.lineTo(e.x + 20, e.y + 18);
 ctx.lineTo(e.x + e.width / 2, e.y + 10);
 ctx.lineTo(e.x + e.width - 18, e.y + 25);
 ctx.lineTo(e.x + e.width - 15, cy + 10);
 ctx.closePath();
 ctx.fill();
 ctx.fillStyle = '#ff6600';
 ctx.shadowColor = '#ff6600';
 ctx.shadowBlur = 10;
 ctx.fillRect(cx - 15, cy - 5, 8, 10);
 ctx.fillRect(cx + 7, cy - 5, 8, 10);
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
};
const drawFlameBreaths = () => {
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
};
const drawProjectiles = () => {
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
 }
 else if (p.type === 'boulder') {
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
 if (i === 0)
 ctx.moveTo(x, y);
 else
 ctx.lineTo(x, y);
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
};
const drawEssenceOrbs = () => {
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
};
const drawParticles = () => {
 for (const p of particles) {
 const alpha = Math.max(0, p.life / p.maxLife);
 ctx.globalAlpha = alpha;
 ctx.fillStyle = p.color;
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
 ctx.fill();
 }
 ctx.globalAlpha = 1;
};
const drawFloatingTexts = () => {
 for (const f of floatingTexts) {
 const alpha = f.life > 0.3 ? 1 : f.life / 0.3;
 ctx.save();
 ctx.globalAlpha = alpha;
 ctx.font = `bold ${f.size}px 'Segoe UI', sans-serif`;
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
};
const render = () => {
 if (!ctx)
 return;
 ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
 drawCanyonBackground();
 drawEssenceOrbs();
 drawFlameBreaths();
 drawEnemies();
 drawDragon();
 drawProjectiles();
 drawParticles();
 drawFloatingTexts();
};
const gameLoop = (timestamp) => {
 if (!lastTime)
 lastTime = timestamp;
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
};
const onKeyDown = (e) => {
 const k = e.key.toLowerCase();
 keys[k] = true;
 if (k === ' ' || k === 'shift' || k === 'e') {
 e.preventDefault();
 }
 if (k === 'shift') {
 doChargeAttack();
 }
 if (k === 'e') {
 tryUpgradeFlame();
 }
};
const onKeyUp = (e) => {
 const k = e.key.toLowerCase();
 keys[k] = false;
 if (k === ' ' && isCharging.value) {
 if (chargingTime >= 0.15) {
 fireFlameBreath();
 }
 isCharging.value = false;
 chargingTime = 0;
 chargePercent.value = 0;
 }
};
const setupCanvas = () => {
 if (!canvas.value)
 return;
 ctx = canvas.value.getContext('2d');
 canvas.value.width = GAME_WIDTH;
 canvas.value.height = GAME_HEIGHT;
 const resize = () => {
 if (!canvas.value)
 return;
 const wrapper = canvas.value.parentElement;
 const w = wrapper.clientWidth;
 const h = wrapper.clientHeight;
 const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
 canvas.value.style.width = `${GAME_WIDTH * scale}px`;
 canvas.value.style.height = `${GAME_HEIGHT * scale}px`;
 };
 resize();
 window.addEventListener('resize', resize);
 return resize;
};
let cleanupResize = null;
onMounted(() => {
 cleanupResize = setupCanvas();
 window.addEventListener('keydown', onKeyDown);
 window.addEventListener('keyup', onKeyUp);
 maxHp.value = props.dragonStatus.max_hp;
 currentHp.value = props.dragonStatus.max_hp;
 flameLevel.value = props.dragonStatus.flame_level;
 essenceCount.value = props.dragonStatus.essence_collected || 0;
 enemiesKilled.value = props.recordData.enemies_killed || 0;
 score.value = props.recordData.score || 0;
 wave.value = Math.max(1, props.recordData.wave_reached || 1);
 startWave(wave.value);
 lastTime = 0;
 animationId = requestAnimationFrame(gameLoop);
});
onUnmounted(() => {
 if (animationId) {
 cancelAnimationFrame(animationId);
 }
 if (cleanupResize) {
 window.removeEventListener('resize', cleanupResize);
 }
 window.removeEventListener('keydown', onKeyDown);
 window.removeEventListener('keyup', onKeyUp);
});
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.game-canvas {
  display: block;
  border-radius: 8px;
  box-shadow: 0 0 60px rgba(255, 100, 50, 0.3);
}

.hud {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1200px;
  padding: 15px 25px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  pointer-events: none;
  z-index: 100;
  box-sizing: border-box;
}

.hud-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 280px;
}

.hp-bar-wrapper,
.flame-bar-wrapper {
  background: rgba(0, 0, 0, 0.65);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.hp-label,
.flame-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 5px;
  color: #ccc;
}

.hp-text {
  color: #fff;
  font-weight: bold;
}

.flame-text {
  color: #ffaa00;
  font-weight: bold;
}

.hp-bar-bg,
.flame-bar-bg {
  height: 10px;
  background: rgba(50, 50, 50, 0.8);
  border-radius: 5px;
  overflow: hidden;
}

.hp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff3333, #ff6666);
  border-radius: 5px;
  transition: width 0.2s;
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.5);
}

.flame-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.05s;
  box-shadow: 0 0 12px rgba(255, 140, 0, 0.6);
}

.hud-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-display {
  text-align: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 30px;
  border-radius: 10px;
  border: 2px solid rgba(255, 200, 100, 0.4);
  position: relative;
}

.wave-label {
  display: block;
  font-size: 0.7rem;
  color: #ffaa55;
  letter-spacing: 3px;
}

.wave-number {
  display: block;
  font-size: 2rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 15px #ffaa00;
  line-height: 1.2;
}

.wave-incoming {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  white-space: nowrap;
  font-size: 0.9rem;
  color: #ff8866;
  animation: blink 0.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hud-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  max-width: 280px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  min-width: 150px;
}

.stat-icon {
  font-size: 1.1rem;
}

.stat-label {
  flex: 1;
  font-size: 0.75rem;
  color: #aaa;
}

.stat-value {
  font-weight: bold;
  color: #fff;
  font-size: 0.95rem;
}

.stat-sub {
  font-size: 0.7rem;
  color: #ffaa00;
}

.stat-item.essence .stat-value {
  color: #ff88ff;
}

.stat-item.flame-level .stat-value {
  color: #ff6347;
}

.upgrade-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.9), rgba(255, 69, 0, 0.9));
  color: #fff;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: 1px;
  animation: hintPulse 1s ease-in-out infinite;
  z-index: 100;
  box-shadow: 0 0 30px rgba(255, 140, 0, 0.6);
}

@keyframes hintPulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
}

.wave-banner {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 200;
  pointer-events: none;
  animation: bannerIn 2s ease-out forwards;
}

.banner-wave {
  display: block;
  font-size: 5rem;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 30px #ffaa00, 0 0 60px #ff6600, 4px 4px 0 #331100;
  letter-spacing: 10px;
  margin-bottom: 10px;
}

.banner-enemy-count {
  display: block;
  font-size: 1.5rem;
  color: #ff6666;
  text-shadow: 2px 2px 0 #330000;
  letter-spacing: 3px;
}

@keyframes bannerIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  40% { transform: translate(-50%, -50%) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

.charging-indicator {
  position: absolute;
  top: 130px;
  left: 25px;
  padding: 8px 16px;
  background: rgba(255, 140, 0, 0.9);
  color: #fff;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 100;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.6);
}

.charging-indicator.max-charge {
  background: linear-gradient(135deg, #ffd700, #ff6600);
  animation: maxCharge 0.3s ease-in-out infinite alternate;
}

@keyframes maxCharge {
  from { box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
  to { box-shadow: 0 0 35px rgba(255, 215, 0, 1); }
}

.cooldown-indicator {
  position: absolute;
  bottom: 25px;
  left: 25px;
  padding: 8px 16px;
  background: rgba(100, 100, 100, 0.85);
  color: #ccc;
  border-radius: 6px;
  font-size: 0.85rem;
  z-index: 100;
}
</style>

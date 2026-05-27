<template>
  <div class="game-container" ref="gameContainer">
    <div class="game-header">
      <div class="player-info">
        <div class="player-name">{{ player.nickname }}</div>
        <div class="hp-bar">
          <div class="hp-fill player-hp" :style="{ width: player.hp + '%' }"></div>
        </div>
        <div class="hp-text">{{ Math.max(0, player.hp) }}/100</div>
      </div>
      
      <div class="game-info">
        <div class="game-title">🪑 椅子大战 🪑</div>
        <div class="game-time">时间: {{ formatTime(gameTime) }}</div>
        <div v-if="gameState === 'playing'" class="combo-text" :class="{ pulse: comboCount > 0 }">
          连击: {{ comboCount }}
        </div>
      </div>
      
      <div class="enemy-info">
        <div class="player-name">{{ enemy.name }}</div>
        <div class="hp-bar">
          <div class="hp-fill enemy-hp" :style="{ width: enemy.hp + '%' }"></div>
        </div>
        <div class="hp-text">{{ Math.max(0, enemy.hp) }}/100</div>
      </div>
    </div>
    
    <div class="game-arena" ref="arenaRef">
      <div class="arena-floor"></div>
      <div class="arena-boundary left"></div>
      <div class="arena-boundary right"></div>
      
      <div 
        class="chair player-chair"
        :class="{ 
          'is-jumping': player.isJumping,
          'is-crouching': player.isCrouching,
          'is-attacking': player.isAttacking,
          'is-hit': player.isHit,
          'is-ultimate': player.isUltimate,
          'facing-right': player.facingRight,
          'facing-left': !player.facingRight
        }"
        :style="{ left: player.x + 'px', bottom: player.y + 'px' }"
      >
        <div class="chair-body">
          <div class="chair-back"></div>
          <div class="chair-seat"></div>
          <div class="chair-legs">
            <div class="leg"></div>
            <div class="leg"></div>
          </div>
        </div>
        <div v-if="player.isAttacking" class="attack-effect" :class="player.attackType"></div>
        <div v-if="player.isUltimate" class="ultimate-effect">磐石重压!</div>
      </div>
      
      <div 
        class="chair enemy-chair"
        :class="{ 
          'is-jumping': enemy.isJumping,
          'is-crouching': enemy.isCrouching,
          'is-attacking': enemy.isAttacking,
          'is-hit': enemy.isHit,
          'facing-right': !enemy.facingRight,
          'facing-left': enemy.facingRight
        }"
        :style="{ left: enemy.x + 'px', bottom: enemy.y + 'px' }"
      >
        <div class="chair-body enemy">
          <div class="chair-back"></div>
          <div class="chair-seat"></div>
          <div class="chair-legs">
            <div class="leg"></div>
            <div class="leg"></div>
          </div>
        </div>
        <div v-if="enemy.isAttacking" class="attack-effect" :class="enemy.attackType"></div>
      </div>
      
      <div v-for="hit in hitEffects" :key="hit.id" class="hit-effect" :style="{ left: hit.x + 'px', bottom: hit.y + 'px' }">
        💥
      </div>
    </div>
    
    <div class="game-controls">
      <div class="control-info">
        <div class="control-group">
          <span class="key">←→</span> 移动
          <span class="key">↑</span> 跳跃
          <span class="key">↓</span> 下蹲
        </div>
        <div class="control-group">
          <span class="key">J</span> 轻拍
          <span class="key">K</span> 重砸
          <span class="key">L</span> 横撞
          <span class="key">↓↓+J</span> 必杀
        </div>
      </div>
      
      <div class="action-buttons">
        <button v-if="gameState === 'idle'" class="btn btn-primary" @click="startGame">开始游戏</button>
        <button v-if="gameState === 'playing'" class="btn btn-secondary" @click="pauseGame">暂停</button>
        <button v-if="gameState === 'paused'" class="btn btn-primary" @click="resumeGame">继续</button>
        <button v-if="gameState !== 'idle'" class="btn btn-secondary" @click="resetGame">重新开始</button>
        <button class="btn btn-secondary" @click="logout">退出登录</button>
      </div>
    </div>
    
    <div v-if="gameState === 'gameover'" class="game-over-overlay">
      <div class="game-over-card">
        <h2 class="result-title" :class="isWin ? 'win' : 'lose'">
          {{ isWin ? '🎉 胜利!' : '💀 失败...' }}
        </h2>
        <p class="result-desc">{{ resultDesc }}</p>
        <div class="result-stats">
          <div>对局时间: {{ formatTime(gameTime) }}</div>
          <div>剩余血量: {{ Math.max(0, player.hp) }}%</div>
          <div>最高连击: {{ maxCombo }}</div>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" @click="resetGame">再来一局</button>
          <button class="btn btn-secondary" @click="viewRecords">查看战绩</button>
        </div>
      </div>
    </div>
    
    <div v-if="showRecords" class="records-overlay">
      <div class="records-card">
        <h2>📊 战斗记录</h2>
        <div class="records-list">
          <div v-for="(record, index) in gameRecords" :key="index" class="record-item">
            <span class="record-result" :class="record.result">{{ record.result === 'win' ? '胜' : '负' }}</span>
            <span class="record-type">{{ record.enemy_type }}</span>
            <span class="record-time">{{ formatTime(record.duration) }}</span>
          </div>
          <div v-if="gameRecords.length === 0" class="no-records">暂无战斗记录</div>
        </div>
        <button class="btn btn-secondary" @click="showRecords = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { storage } from '@/utils/storage';
import { gameApi } from '@/api/game';
const router = useRouter();
const gameContainer = ref(null);
const arenaRef = ref(null);
const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 500;
const GROUND_Y = 60;
const GRAVITY = 0.8;
const JUMP_FORCE = 15;
const MOVE_SPEED = 5;
const CHAIR_WIDTH = 60;
const CHAIR_HEIGHT = 80;
const user = storage.getUser();
const gameState = ref('idle');
const gameTime = ref(0);
const comboCount = ref(0);
const maxCombo = ref(0);
const isWin = ref(false);
const resultDesc = ref('');
const showRecords = ref(false);
const gameRecords = ref([]);
const hitEffects = ref([]);
let gameLoop = null;
let timeInterval = null;
let hitEffectId = 0;
let resumeProtection = 0;
const player = reactive({
 x: 150,
 y: GROUND_Y,
 vx: 0,
 vy: 0,
 hp: 100,
 maxHp: 100,
 isJumping: false,
 isCrouching: false,
 isAttacking: false,
 isHit: false,
 isUltimate: false,
 attackType: '',
 attackCooldown: 0,
 facingRight: true,
 nickname: user?.nickname || '玩家',
 invincible: 0
});
const enemy = reactive({
 x: 650,
 y: GROUND_Y,
 vx: 0,
 vy: 0,
 hp: 100,
 maxHp: 100,
 isJumping: false,
 isCrouching: false,
 isAttacking: false,
 isHit: false,
 attackType: '',
 attackCooldown: 0,
 facingRight: false,
 name: 'AI椅斗士',
 aiState: 'idle',
 aiTimer: 0,
 invincible: 0
});
const keys = reactive({
 ArrowLeft: false,
 ArrowRight: false,
 ArrowUp: false,
 ArrowDown: false,
 KeyJ: false,
 KeyK: false,
 KeyL: false
});
let downPressedCount = 0;
let lastDownTime = 0;
const formatTime = (seconds) => {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}:${secs.toString().padStart(2, '0')}`;
};
const startGame = () => {
 resetPlayer();
 resetEnemy();
 gameState.value = 'playing';
 gameTime.value = 0;
 comboCount.value = 0;
 maxCombo.value = 0;
 resumeProtection = 0;
 storage.removeGameState();
 startGameLoop();
 setTimeout(() => {
 saveGameState();
 }, 100);
};
const resetPlayer = () => {
 player.x = 150;
 player.y = GROUND_Y;
 player.vx = 0;
 player.vy = 0;
 player.hp = 100;
 player.isJumping = false;
 player.isCrouching = false;
 player.isAttacking = false;
 player.isHit = false;
 player.isUltimate = false;
 player.attackType = '';
 player.attackCooldown = 0;
 player.facingRight = true;
 player.invincible = 0;
};
const resetEnemy = () => {
 enemy.x = 650;
 enemy.y = GROUND_Y;
 enemy.vx = 0;
 enemy.vy = 0;
 enemy.hp = 100;
 enemy.isJumping = false;
 enemy.isCrouching = false;
 enemy.isAttacking = false;
 enemy.isHit = false;
 enemy.attackType = '';
 enemy.attackCooldown = 0;
 enemy.facingRight = false;
 enemy.aiState = 'idle';
 enemy.aiTimer = 0;
 enemy.invincible = 0;
};
const pauseGame = () => {
 gameState.value = 'paused';
 stopGameLoop();
 saveGameState();
};
const resumeGame = () => {
 resumeProtection = 120;
 player.invincible = 60;
 enemy.invincible = 60;
 enemy.aiTimer = 120;
 gameState.value = 'playing';
 startGameLoop();
};
const resetGame = () => {
 stopGameLoop();
 gameState.value = 'idle';
 resetPlayer();
 resetEnemy();
 gameTime.value = 0;
 comboCount.value = 0;
 maxCombo.value = 0;
 storage.removeGameState();
};
const logout = () => {
 stopGameLoop();
 storage.clearAll();
 router.push('/login');
};
const startGameLoop = () => {
 gameLoop = requestAnimationFrame(update);
 timeInterval = setInterval(() => {
 if (gameState.value === 'playing') {
 gameTime.value++;
 }
 }, 1000);
};
const stopGameLoop = () => {
 if (gameLoop) {
 cancelAnimationFrame(gameLoop);
 gameLoop = null;
 }
 if (timeInterval) {
 clearInterval(timeInterval);
 timeInterval = null;
 }
};
const update = () => {
 if (gameState.value !== 'playing')
 return;
 if (resumeProtection > 0) {
 resumeProtection--;
 }
 updatePlayer();
 updateEnemy();
 updateAI();
 checkCollisions();
 checkWinCondition();
 saveGameState();
 gameLoop = requestAnimationFrame(update);
};
const updatePlayer = () => {
 if (player.attackCooldown > 0)
 player.attackCooldown--;
 if (player.invincible > 0)
 player.invincible--;
 if (player.isHit && player.invincible <= 0) {
 player.isHit = false;
 }
 if (player.isAttacking && player.attackCooldown <= 0) {
 player.isAttacking = false;
 player.attackType = '';
 }
 if (player.isUltimate && player.attackCooldown <= 0) {
 player.isUltimate = false;
 }
 if (!player.isAttacking && !player.isUltimate) {
 if (keys.ArrowLeft) {
 player.vx = -MOVE_SPEED;
 player.facingRight = false;
 }
 else if (keys.ArrowRight) {
 player.vx = MOVE_SPEED;
 player.facingRight = true;
 }
 else {
 player.vx = 0;
 }
 if (keys.ArrowUp && !player.isJumping) {
 player.vy = JUMP_FORCE;
 player.isJumping = true;
 }
 player.isCrouching = keys.ArrowDown && !player.isJumping;
 }
 player.vy -= GRAVITY;
 player.x += player.vx;
 player.y += player.vy;
 if (player.y <= GROUND_Y) {
 player.y = GROUND_Y;
 player.vy = 0;
 player.isJumping = false;
 }
 player.x = Math.max(5, Math.min(ARENA_WIDTH - CHAIR_WIDTH - 5, player.x));
};
const updateEnemy = () => {
 if (enemy.attackCooldown > 0)
 enemy.attackCooldown--;
 if (enemy.invincible > 0)
 enemy.invincible--;
 if (enemy.isHit && enemy.invincible <= 0) {
 enemy.isHit = false;
 }
 if (enemy.isAttacking && enemy.attackCooldown <= 0) {
 enemy.isAttacking = false;
 enemy.attackType = '';
 }
 enemy.vy -= GRAVITY;
 enemy.x += enemy.vx;
 enemy.y += enemy.vy;
 if (enemy.y <= GROUND_Y) {
 enemy.y = GROUND_Y;
 enemy.vy = 0;
 enemy.isJumping = false;
 }
 enemy.x = Math.max(5, Math.min(ARENA_WIDTH - CHAIR_WIDTH - 5, enemy.x));
};
const updateAI = () => {
 enemy.aiTimer--;
 if (enemy.aiTimer > 0)
 return;
 if (enemy.isAttacking || enemy.isHit)
 return;
 const distance = Math.abs(player.x - enemy.x);
 const playerOnLeft = player.x < enemy.x;
 const random = Math.random();
 enemy.facingRight = !playerOnLeft;
 if (distance > 300) {
 enemy.vx = playerOnLeft ? MOVE_SPEED * 0.8 : -MOVE_SPEED * 0.8;
 enemy.aiTimer = 30;
 }
 else if (distance > 150) {
 if (random < 0.3) {
 enemy.vx = playerOnLeft ? MOVE_SPEED : -MOVE_SPEED;
 }
 else if (random < 0.5) {
 enemy.vx = 0;
 }
 else if (random < 0.7) {
 performEnemyAttack('light');
 }
 else {
 enemy.vx = playerOnLeft ? -MOVE_SPEED : MOVE_SPEED;
 }
 enemy.aiTimer = 20;
 }
 else {
 if (random < 0.4) {
 performEnemyAttack('light');
 }
 else if (random < 0.6) {
 performEnemyAttack('heavy');
 }
 else if (random < 0.8) {
 performEnemyAttack('charge');
 }
 else if (random < 0.9) {
 enemy.vx = playerOnLeft ? -MOVE_SPEED * 1.5 : MOVE_SPEED * 1.5;
 }
 else if (!enemy.isJumping && random < 0.95) {
 enemy.vy = JUMP_FORCE;
 enemy.isJumping = true;
 }
 enemy.aiTimer = 25;
 }
};
const performEnemyAttack = (type) => {
 if (enemy.attackCooldown > 0)
 return;
 enemy.isAttacking = true;
 enemy.attackType = type;
 if (type === 'light') {
 enemy.attackCooldown = 20;
 }
 else if (type === 'heavy') {
 enemy.attackCooldown = 40;
 }
 else if (type === 'charge') {
 enemy.attackCooldown = 35;
 enemy.vx = enemy.facingRight ? MOVE_SPEED * 3 : -MOVE_SPEED * 3;
 }
};
const playerAttack = (type) => {
 if (player.attackCooldown > 0 || player.isUltimate)
 return;
 player.isAttacking = true;
 player.attackType = type;
 if (type === 'light') {
 player.attackCooldown = 15;
 }
 else if (type === 'heavy') {
 player.attackCooldown = 35;
 }
 else if (type === 'charge') {
 player.attackCooldown = 30;
 player.vx = player.facingRight ? MOVE_SPEED * 4 : -MOVE_SPEED * 4;
 }
};
const performUltimate = () => {
 if (player.attackCooldown > 0 || player.isUltimate)
 return;
 player.isAttacking = true;
 player.isUltimate = true;
 player.attackType = 'ultimate';
 player.attackCooldown = 60;
};
const checkCollisions = () => {
 const playerRect = {
 x: player.x,
 y: player.y,
 width: CHAIR_WIDTH,
 height: player.isCrouching ? CHAIR_HEIGHT * 0.6 : CHAIR_HEIGHT
 };
 const enemyRect = {
 x: enemy.x,
 y: enemy.y,
 width: CHAIR_WIDTH,
 height: enemy.isCrouching ? CHAIR_HEIGHT * 0.6 : CHAIR_HEIGHT
 };
 const isColliding = playerRect.x < enemyRect.x + enemyRect.width &&
 playerRect.x + playerRect.width > enemyRect.x &&
 playerRect.y < enemyRect.y + enemyRect.height &&
 playerRect.y + playerRect.height > enemyRect.y;
 if (player.isAttacking && player.invincible <= 0) {
 const attackRange = player.attackType === 'charge' ? 80 : player.attackType === 'ultimate' ? 120 : 50;
 const attackX = player.facingRight ? player.x + CHAIR_WIDTH : player.x - attackRange;
 if (enemy.invincible <= 0 &&
 attackX < enemy.x + CHAIR_WIDTH &&
 attackX + attackRange > enemy.x &&
 Math.abs(player.y - enemy.y) < 80) {
 let damage = 0;
 let knockback = 0;
 if (player.attackType === 'light') {
 damage = 8;
 knockback = 20;
 }
 else if (player.attackType === 'heavy') {
 damage = 20;
 knockback = 40;
 }
 else if (player.attackType === 'charge') {
 damage = 15;
 knockback = 60;
 }
 else if (player.attackType === 'ultimate') {
 damage = 35;
 knockback = 100;
 }
 enemy.hp -= damage;
 enemy.isHit = true;
 enemy.invincible = 20;
 enemy.vx = player.facingRight ? knockback * 0.5 : -knockback * 0.5;
 comboCount.value++;
 maxCombo.value = Math.max(maxCombo.value, comboCount.value);
 addHitEffect(enemy.x + CHAIR_WIDTH / 2, enemy.y + CHAIR_HEIGHT / 2);
 player.attackCooldown = Math.max(player.attackCooldown, 10);
 }
 }
 if (enemy.isAttacking && enemy.invincible <= 0) {
 const attackRange = enemy.attackType === 'charge' ? 80 : 50;
 const attackX = enemy.facingRight ? enemy.x + CHAIR_WIDTH : enemy.x - attackRange;
 if (player.invincible <= 0 &&
 attackX < player.x + CHAIR_WIDTH &&
 attackX + attackRange > player.x &&
 Math.abs(enemy.y - player.y) < 80) {
 let damage = 0;
 let knockback = 0;
 if (enemy.attackType === 'light') {
 damage = 6;
 knockback = 15;
 }
 else if (enemy.attackType === 'heavy') {
 damage = 15;
 knockback = 30;
 }
 else if (enemy.attackType === 'charge') {
 damage = 12;
 knockback = 50;
 }
 player.hp -= damage;
 player.isHit = true;
 player.invincible = 20;
 player.vx = enemy.facingRight ? knockback * 0.5 : -knockback * 0.5;
 comboCount.value = 0;
 addHitEffect(player.x + CHAIR_WIDTH / 2, player.y + CHAIR_HEIGHT / 2);
 }
 }
 if (isColliding && !player.isAttacking && !enemy.isAttacking) {
 if (player.x < enemy.x) {
 player.x -= 2;
 enemy.x += 2;
 }
 else {
 player.x += 2;
 enemy.x -= 2;
 }
 }
};
const addHitEffect = (x, y) => {
 const id = hitEffectId++;
 hitEffects.value.push({ id, x, y });
 setTimeout(() => {
 hitEffects.value = hitEffects.value.filter(h => h.id !== id);
 }, 300);
};
const checkWinCondition = () => {
 if (gameTime.value < 3) return;
 if (resumeProtection > 0) return;
 if (player.hp <= 0) {
 endGame(false, '被打空血量！');
 return;
 }
 if (enemy.hp <= 0) {
 endGame(true, '打空敌方血量！');
 return;
 }
 if (player.x < 5 || player.x > ARENA_WIDTH - CHAIR_WIDTH - 5) {
 if (player.y <= GROUND_Y + 5) {
 endGame(false, '被撞出擂台！');
 return;
 }
 }
 if (enemy.x < 5 || enemy.x > ARENA_WIDTH - CHAIR_WIDTH - 5) {
 if (enemy.y <= GROUND_Y + 5) {
 endGame(true, '敌方被撞出擂台！');
 return;
 }
 }
};
const endGame = (win, desc) => {
 stopGameLoop();
 gameState.value = 'gameover';
 isWin.value = win;
 resultDesc.value = desc;
 storage.removeGameState();
 saveGameRecord(win);
};
const saveGameRecord = async (win) => {
 try {
 await gameApi.saveRecord({
 player_id: user.id,
 enemy_type: enemy.name,
 result: win ? 'win' : 'lose',
 player_hp_remaining: Math.max(0, player.hp),
 enemy_hp_remaining: Math.max(0, enemy.hp),
 duration: gameTime.value
 });
 }
 catch (e) {
 console.error('保存记录失败', e);
 }
};
const saveGameState = () => {
 if (gameState.value === 'playing' || gameState.value === 'paused') {
 storage.setGameState({
 player: { ...player },
 enemy: { ...enemy },
 gameTime: gameTime.value,
 comboCount: comboCount.value,
 maxCombo: maxCombo.value,
 gameState: gameState.value
 });
 }
};
const viewRecords = async () => {
 try {
 const res = await gameApi.getMyRecords();
 if (res.code === 200) {
 gameRecords.value = res.data;
 }
 }
 catch (e) {
 console.error('获取记录失败', e);
 }
 showRecords.value = true;
};
const handleKeyDown = (e) => {
 if (gameState.value !== 'playing')
 return;
 if (e.code in keys) {
 keys[e.code] = true;
 if (e.code === 'KeyJ') {
 const now = Date.now();
 if (keys.ArrowDown && now - lastDownTime < 500) {
 downPressedCount++;
 if (downPressedCount >= 2) {
 performUltimate();
 downPressedCount = 0;
 }
 }
 else {
 playerAttack('light');
 }
 lastDownTime = now;
 }
 else if (e.code === 'KeyK') {
 playerAttack('heavy');
 }
 else if (e.code === 'KeyL') {
 playerAttack('charge');
 }
 }
 e.preventDefault();
};
const handleKeyUp = (e) => {
 if (e.code in keys) {
 keys[e.code] = false;
 }
};
const isValidGameState = (saved) => {
 if (!saved || !saved.player || !saved.enemy) return false;
 if (saved.gameState !== 'playing' && saved.gameState !== 'paused') return false;
 if (saved.player.hp <= 0 || saved.player.hp > 100) return false;
 if (saved.enemy.hp <= 0 || saved.enemy.hp > 100) return false;
 if (saved.player.x < 10 || saved.player.x > ARENA_WIDTH - CHAIR_WIDTH - 10) return false;
 if (saved.enemy.x < 10 || saved.enemy.x > ARENA_WIDTH - CHAIR_WIDTH - 10) return false;
 return true;
};
onMounted(() => {
 window.addEventListener('keydown', handleKeyDown);
 window.addEventListener('keyup', handleKeyUp);
 const saved = storage.getGameState();
 if (isValidGameState(saved)) {
 Object.assign(player, saved.player);
 Object.assign(enemy, saved.enemy);
 player.vx = 0;
 player.vy = 0;
 player.isAttacking = false;
 player.isHit = false;
 player.isUltimate = false;
 player.attackType = '';
 player.attackCooldown = 0;
 player.invincible = 60;
 enemy.vx = 0;
 enemy.vy = 0;
 enemy.isAttacking = false;
 enemy.isHit = false;
 enemy.attackType = '';
 enemy.attackCooldown = 0;
 enemy.aiTimer = 120;
 enemy.invincible = 60;
 gameTime.value = saved.gameTime || 0;
 comboCount.value = saved.comboCount || 0;
 maxCombo.value = saved.maxCombo || 0;
 gameState.value = 'paused';
 resumeProtection = 120;
 } else {
 storage.removeGameState();
 }
});
onUnmounted(() => {
 window.removeEventListener('keydown', handleKeyDown);
 window.removeEventListener('keyup', handleKeyUp);
 stopGameLoop();
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

.player-info, .enemy-info {
  width: 250px;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #4ecdc4;
}

.enemy-info .player-name {
  color: #ff6b6b;
  text-align: right;
}

.hp-bar {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.hp-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 8px;
}

.player-hp {
  background: linear-gradient(90deg, #4ecdc4, #44a08d);
}

.enemy-hp {
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
}

.hp-text {
  font-size: 14px;
  margin-top: 5px;
  text-align: center;
}

.game-info {
  text-align: center;
}

.game-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd93d;
  margin-bottom: 5px;
}

.game-time {
  font-size: 18px;
  color: #aaa;
}

.combo-text {
  font-size: 16px;
  color: #ffd93d;
  margin-top: 5px;
}

.game-arena {
  flex: 1;
  position: relative;
  width: 900px;
  margin: 20px auto;
  background: linear-gradient(180deg, #2d3436 0%, #636e72 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0, 0, 0, 0.3);
}

.arena-floor {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, #b2bec3 0%, #636e72 100%);
  border-top: 4px solid #ffd93d;
}

.arena-boundary {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  background: linear-gradient(90deg, #ff6b6b, transparent);
}

.arena-boundary.right {
  right: 0;
  background: linear-gradient(-90deg, #ff6b6b, transparent);
}

.chair {
  position: absolute;
  width: 60px;
  height: 80px;
  transition: transform 0.1s ease;
}

.chair-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.chair-back {
  position: absolute;
  top: 0;
  left: 5px;
  right: 5px;
  height: 45px;
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  border-radius: 8px 8px 0 0;
  border: 3px solid #2d3436;
}

.chair-body.enemy .chair-back {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
}

.chair-seat {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(135deg, #81ecec 0%, #00cec9 100%);
  border-radius: 4px;
  border: 3px solid #2d3436;
}

.chair-body.enemy .chair-seat {
  background: linear-gradient(135deg, #fab1a0 0%, #e17055 100%);
}

.chair-legs {
  position: absolute;
  bottom: 0;
  left: 5px;
  right: 5px;
  height: 20px;
  display: flex;
  justify-content: space-between;
}

.leg {
  width: 8px;
  height: 100%;
  background: #2d3436;
  border-radius: 0 0 4px 4px;
}

.chair.is-jumping {
  transform: scale(0.95);
}

.chair.is-crouching {
  transform: scaleY(0.6);
  transform-origin: bottom;
}

.chair.is-attacking .chair-body {
  animation: attackShake 0.1s ease-in-out;
}

.chair.is-hit {
  animation: hitFlash 0.2s ease-in-out;
}

.chair.is-ultimate .chair-body {
  animation: ultimateGlow 0.5s ease-in-out infinite;
}

.chair.facing-left {
  transform: scaleX(-1);
}

.chair.facing-left.is-crouching {
  transform: scaleX(-1) scaleY(0.6);
  transform-origin: bottom;
}

@keyframes attackShake {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

@keyframes hitFlash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; filter: brightness(2); }
}

@keyframes ultimateGlow {
  0%, 100% { filter: drop-shadow(0 0 10px #ffd93d); }
  50% { filter: drop-shadow(0 0 30px #ffd93d); }
}

.attack-effect {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  pointer-events: none;
}

.attack-effect.light {
  right: -50px;
  background: radial-gradient(circle, rgba(255,217,61,0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: attackPulse 0.2s ease-out;
}

.attack-effect.heavy {
  right: -60px;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, rgba(255,107,107,0.9) 0%, transparent 70%);
  border-radius: 50%;
  animation: attackPulse 0.3s ease-out;
}

.attack-effect.charge {
  right: -80px;
  width: 100px;
  height: 40px;
  background: linear-gradient(90deg, rgba(78,205,196,0.8), transparent);
  animation: chargeEffect 0.3s ease-out;
}

@keyframes attackPulse {
  0% { transform: translateY(-50%) scale(0.5); opacity: 1; }
  100% { transform: translateY(-50%) scale(1.5); opacity: 0; }
}

@keyframes chargeEffect {
  0% { transform: translateY(-50%) translateX(-20px); opacity: 1; }
  100% { transform: translateY(-50%) translateX(20px); opacity: 0; }
}

.ultimate-effect {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  font-weight: bold;
  color: #ffd93d;
  text-shadow: 0 0 10px #ff6b6b;
  animation: ultimateText 0.5s ease-out;
  white-space: nowrap;
}

@keyframes ultimateText {
  0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
  50% { transform: translateX(-50%) translateY(-10px); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
}

.hit-effect {
  position: absolute;
  font-size: 30px;
  animation: hitExplode 0.3s ease-out forwards;
  pointer-events: none;
}

@keyframes hitExplode {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.game-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.5);
}

.control-info {
  display: flex;
  gap: 30px;
  color: #aaa;
  font-size: 14px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: white;
  font-weight: bold;
  font-family: monospace;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.game-over-overlay, .records-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-card, .records-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  min-width: 400px;
  animation: popIn 0.5s ease-out;
}

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-title {
  font-size: 48px;
  margin-bottom: 10px;
}

.result-title.win {
  color: #44a08d;
}

.result-title.lose {
  color: #e74c3c;
}

.result-desc {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.result-stats {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.result-stats div {
  margin: 5px 0;
  color: #333;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.records-card h2 {
  margin-bottom: 20px;
  color: #333;
}

.records-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.record-result {
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 5px;
}

.record-result.win {
  background: #d4edda;
  color: #155724;
}

.record-result.lose {
  background: #f8d7da;
  color: #721c24;
}

.no-records {
  color: #999;
  padding: 20px;
}
</style>

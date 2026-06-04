<template>
  <div class="min-h-screen bg-black flex flex-col items-center justify-center p-4">
    <div class="relative">
      <canvas
        ref="canvasRef"
        :width="CANVAS_WIDTH"
        :height="CANVAS_HEIGHT"
        :class="[
          'border-4 border-purple-600 rounded-lg shadow-2xl shadow-purple-500/30 transition-opacity duration-300',
          gameReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
        ]"
      ></canvas>

      <div v-if="!gameReady" class="absolute inset-0 flex flex-col items-center justify-center bg-black rounded-lg">
        <div class="text-4xl text-white mb-4 font-pixel animate-pulse">加载中...</div>
        <div class="text-sm text-gray-400 mb-4">{{ debugMessage }}</div>
        <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      </div>

      <div v-if="isPaused && gameReady" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
        <h2 class="text-4xl font-bold text-white mb-8 font-pixel">游戏暂停</h2>
        <div class="flex flex-col gap-4">
          <button @click="resumeGame" class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">继续游戏</button>
          <button @click="restartLevel" class="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">重新开始</button>
          <button @click="exitToMenu" class="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">返回主菜单</button>
        </div>
      </div>

      <div v-if="isGameOver && gameReady" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
        <h2 class="text-5xl font-bold text-red-500 mb-4 font-pixel">游戏结束</h2>
        <p class="text-2xl text-white mb-2">得分: <span class="text-yellow-400">{{ finalScore }}</span></p>
        <p class="text-xl text-gray-400 mb-8">金币: <span class="text-yellow-400">{{ finalCoins }}</span></p>
        <div class="flex gap-4">
          <button @click="restartLevel" class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">重试</button>
          <button @click="exitToMenu" class="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">返回主菜单</button>
        </div>
      </div>

      <div v-if="isVictory && gameReady" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
        <h2 class="text-5xl font-bold text-yellow-400 mb-4 font-pixel animate-pixel-bounce">胜利！</h2>
        <div class="flex items-center gap-2 mb-4">
          <span v-for="star in 3" :key="star" :class="['text-4xl', star <= earnedStars ? 'text-yellow-400 animate-pixel-bounce' : 'text-gray-600']" :style="{ animationDelay: `${star * 200}ms` }">★</span>
        </div>
        <p class="text-2xl text-white mb-2">得分: <span class="text-yellow-400">{{ finalScore }}</span></p>
        <p class="text-xl text-gray-400 mb-8">获得金币: <span class="text-yellow-400">+{{ finalCoins }}</span></p>
        <div class="flex gap-4">
          <button v-if="hasNextLevel" @click="nextLevel" class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">下一关</button>
          <button @click="restartLevel" class="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">重玩</button>
          <button @click="exitToMenu" class="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg font-pixel transition-all active:scale-95">返回主菜单</button>
        </div>
      </div>

      <div class="absolute -bottom-12 left-0 right-0 flex justify-between items-center text-white/60 text-sm font-pixel">
        <div class="flex items-center gap-4">
          <span>WASD/方向键 移动</span>
          <span>空格 跳跃</span>
          <span>J/K 攻击</span>
        </div>
        <button @click="togglePause" class="px-4 py-1 bg-white/10 hover:bg-white/20 rounded transition-all">ESC 暂停</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { GameEngine } from '@/game/engine';
import { GameRenderer } from '@/game/renderer';
import { getLevelById } from '@/game/levels';
import { CANVAS_WIDTH, CANVAS_HEIGHT, KEY_BINDINGS } from '@/utils/constants';
import type { KeyboardState, Item } from '@/types/game';

const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const gameReady = ref(false);
const debugMessage = ref('初始化游戏...');
const finalScore = ref(0);
const finalCoins = ref(0);
const earnedStars = ref(0);

let engine: GameEngine | null = null;
let renderer: GameRenderer | null = null;
let animFrameId: number | null = null;
let lastTime = 0;
let isInitialized = false;
let sessionSaveTimer: number | null = null;

const keysState: KeyboardState = {
  left: false, right: false, up: false, down: false,
  jump: false, attack: false, pause: false
};

const justPressedKeys = new Set<string>();

const isPaused = computed(() => gameStore.gameStatus === 'paused');
const isGameOver = computed(() => gameStore.gameStatus === 'gameover');
const isVictory = computed(() => gameStore.gameStatus === 'victory');
const hasNextLevel = computed(() => gameStore.currentLevelId < 4);

function getActionForKeyCode(code: string): keyof KeyboardState | null {
  for (const [action, codes] of Object.entries(KEY_BINDINGS)) {
    if ((codes as string[]).includes(code)) return action as keyof KeyboardState;
  }
  return null;
}

function handleKeyDown(event: KeyboardEvent) {
  const action = getActionForKeyCode(event.code);
  if (action) {
    event.preventDefault();
    keysState[action] = true;
    if (action === 'pause' && !justPressedKeys.has('pause_handled')) {
      justPressedKeys.add('pause_handled');
      togglePause();
    }
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const action = getActionForKeyCode(event.code);
  if (action) {
    event.preventDefault();
    keysState[action] = false;
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    justPressedKeys.delete('pause_handled');
  }
}

function clearFrameKeys() {
  justPressedKeys.clear();
}

function saveCurrentSession() {
  if (!engine || gameStore.gameStatus !== 'playing') return;
  const player = engine.getPlayer();
  if (!player || player.health <= 0) return;

  const state = engine.getState();
  gameStore.saveGameSession(
    {
      x: player.x,
      y: player.y,
      health: player.health,
      maxHealth: player.maxHealth,
      coins: player.coins,
      score: player.score,
      hasShield: player.hasShield,
      speedBoost: player.speedBoost,
      powerBoost: player.powerBoost,
      boostTimer: player.boostTimer,
      invincible: player.invincible,
      invincibleTimer: player.invincibleTimer
    },
    state.cameraX,
    state.cameraY,
    state.gameTime
  );
  gameStore.persist();
}

function startSessionAutoSave() {
  stopSessionAutoSave();
  sessionSaveTimer = window.setInterval(saveCurrentSession, 5000);
}

function stopSessionAutoSave() {
  if (sessionSaveTimer !== null) {
    clearInterval(sessionSaveTimer);
    sessionSaveTimer = null;
  }
}

function handleBeforeUnload() {
  saveCurrentSession();
}

function gameLoop(currentTime: number) {
  if (!engine || !renderer || !gameReady.value) {
    animFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  const delta = Math.min(currentTime - lastTime, 32);
  lastTime = currentTime;

  if (gameStore.gameStatus === 'playing') {
    engine.update(delta);
  }

  const state = engine.getState();
  renderer.render(state);
  clearFrameKeys();

  animFrameId = requestAnimationFrame(gameLoop);
}

async function initGame() {
  console.log('[Game] ========== initGame 开始 ==========');
  gameReady.value = false;
  debugMessage.value = '等待Canvas就绪...';

  await nextTick();

  if (!canvasRef.value) {
    console.error('[Game] Canvas ref 不存在!');
    debugMessage.value = 'Canvas未就绪，重试...';
    setTimeout(initGame, 100);
    return;
  }

  let levelId = 1;
  if (route.params.levelId) {
    levelId = parseInt(route.params.levelId as string);
  } else {
    levelId = gameStore.currentLevelId;
  }

  if (isNaN(levelId) || levelId < 1 || levelId > 4) levelId = 1;

  debugMessage.value = `加载关卡 ${levelId}...`;

  const level = getLevelById(levelId);
  if (!level) {
    debugMessage.value = '关卡不存在，返回主菜单...';
    setTimeout(() => router.push('/'), 1000);
    return;
  }

  if (!gameStore.isLevelUnlocked(levelId)) {
    debugMessage.value = '关卡未解锁，返回选择页面...';
    setTimeout(() => router.push('/level-select'), 1000);
    return;
  }

  debugMessage.value = '初始化游戏引擎...';
  gameStore.setCurrentLevelId(levelId);
  gameStore.setCurrentLevel(level);
  gameStore.resetLevelEntities();
  gameStore.setGameStatus('menu');

  try {
    renderer = new GameRenderer(canvasRef.value);

    engine = new GameEngine(keysState, {
      onPlayerDeath: () => handleGameOver(),
      onEnemyDeath: () => {},
      onBossDeath: () => {},
      onItemCollected: (item: Item) => {
        if (item.itemType === 'coin') {
          gameStore.addCoins(item.value);
        }
      },
      onVictory: () => handleVictory(),
      onGameOver: () => handleGameOver(),
      onCameraUpdate: () => {}
    });

    engine.loadLevel(level, gameStore.currentCharacter);

    const session = gameStore.loadGameSession();
    if (session && session.levelId === levelId && session.playerState) {
      console.log('[Game] 恢复游戏会话');
      const p = session.playerState;
      const player = engine.getPlayer();
      if (player) {
        player.x = p.x;
        player.y = p.y;
        player.health = p.health;
        player.maxHealth = p.maxHealth;
        player.coins = p.coins;
        player.score = p.score;
        player.hasShield = p.hasShield;
        player.speedBoost = p.speedBoost;
        player.powerBoost = p.powerBoost;
        player.boostTimer = p.boostTimer;
        player.invincible = p.invincible;
        player.invincibleTimer = p.invincibleTimer;
      }
    }

    gameStore.setGameStatus('playing');
    gameReady.value = true;
    lastTime = performance.now();

    if (animFrameId === null) {
      animFrameId = requestAnimationFrame(gameLoop);
    }

    startSessionAutoSave();
    isInitialized = true;
    console.log('[Game] ========== initGame 完成 ==========');
  } catch (error) {
    console.error('[Game] 初始化失败:', error);
    debugMessage.value = `错误: ${error}`;
    setTimeout(() => router.push('/'), 2000);
  }
}

function cleanupGame() {
  stopSessionAutoSave();
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (engine) {
    engine.stop();
    engine = null;
  }
  renderer = null;
  gameReady.value = false;
  isInitialized = false;
  gameStore.resetLevelEntities();
}

function togglePause() {
  if (gameStore.gameStatus === 'playing') {
    saveCurrentSession();
    gameStore.setGameStatus('paused');
    engine?.pause();
  } else if (gameStore.gameStatus === 'paused') {
    resumeGame();
  }
}

function resumeGame() {
  gameStore.setGameStatus('playing');
  engine?.resume();
  lastTime = performance.now();
}

function handleGameOver() {
  stopSessionAutoSave();
  gameStore.clearGameSession();
  const player = engine?.getPlayer();
  finalScore.value = player?.score || 0;
  finalCoins.value = player?.coins || 0;
  gameStore.setGameStatus('gameover');
  engine?.pause();
}

function handleVictory() {
  stopSessionAutoSave();
  gameStore.clearGameSession();
  const player = engine?.getPlayer();
  finalScore.value = player?.score || 0;
  finalCoins.value = player?.coins || 0;
  earnedStars.value = calculateStars(finalScore.value, finalCoins.value);

  gameStore.updateLevelProgress(gameStore.currentLevelId, finalScore.value, earnedStars.value);
  if (hasNextLevel.value) {
    gameStore.unlockLevel(gameStore.currentLevelId + 1);
  }
  gameStore.saveProgress();
  gameStore.setGameStatus('victory');
  engine?.pause();
}

function calculateStars(score: number, coins: number): number {
  let stars = 1;
  if (score >= 1000) stars = 2;
  if (score >= 2000 && coins >= 50) stars = 3;
  return stars;
}

function restartLevel() {
  gameStore.clearGameSession();
  cleanupGame();
  setTimeout(initGame, 200);
}

function nextLevel() {
  gameStore.clearGameSession();
  const nextLevelId = gameStore.currentLevelId + 1;
  gameStore.setCurrentLevelId(nextLevelId);
  router.push(`/game/${nextLevelId}`);
}

function exitToMenu() {
  saveCurrentSession();
  cleanupGame();
  gameStore.setGameStatus('menu');
  router.push('/');
}

watch(
  () => route.params.levelId,
  (newLevelId, oldLevelId) => {
    if (newLevelId !== oldLevelId && newLevelId) {
      gameStore.clearGameSession();
      cleanupGame();
      setTimeout(initGame, 100);
    }
  }
);

onMounted(async () => {
  console.log('[Game] onMounted 触发');
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('beforeunload', handleBeforeUnload);

  if (animFrameId === null) {
    animFrameId = requestAnimationFrame(gameLoop);
  }

  await nextTick();
  await initGame();
});

onUnmounted(() => {
  console.log('[Game] onUnmounted 触发');
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  saveCurrentSession();
  cleanupGame();
});
</script>

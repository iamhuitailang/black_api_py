<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Game } from '../game/Game';
import type { GameState } from '../game/types';
import { GAME_CONFIG, SKINS } from '../game/config';
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX, Lock, Star, Zap, Heart } from 'lucide-vue-next';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let game: Game | null = null;

const gameState = ref<GameState | null>(null);
const soundEnabled = ref(true);
const isNewHighScore = ref(false);

const formattedScore = computed(() => {
  if (!gameState.value) return '0';
  return gameState.value.score.toLocaleString();
});

const formattedHighScore = computed(() => {
  if (!gameState.value) return '0';
  return gameState.value.highScore.toLocaleString();
});

const formattedTotalScore = computed(() => {
  if (!gameState.value) return '0';
  return gameState.value.totalScore.toLocaleString();
});

const frenzyProgress = computed(() => {
  if (!gameState.value || !gameState.value.frenzyMode) return 0;
  return (gameState.value.frenzyTimeLeft / 5000) * 100;
});

const skins = computed(() => {
  if (!game) return [];
  return game.getSkins();
});

const onStateChange = (state: GameState) => {
  if (state.status === 'gameover' && gameState.value) {
    isNewHighScore.value = state.score > gameState.value.highScore;
  }
  gameState.value = state;
};

const startGame = () => {
  if (game) {
    isNewHighScore.value = false;
    game.start();
  }
};

const pauseGame = () => {
  if (game) {
    game.pause();
  }
};

const resumeGame = () => {
  if (game) {
    game.resume();
  }
};

const restartGame = () => {
  if (game) {
    isNewHighScore.value = false;
    game.start();
  }
};

const goToMenu = () => {
  if (game) {
    game.goToMenu();
  }
};

const selectSkin = (skinId: string) => {
  if (game) {
    game.selectSkin(skinId);
  }
};

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value;
};

const getSkinPreviewColor = (skinId: string): string => {
  const skin = SKINS.find(s => s.id === skinId);
  return skin?.color || '#ffffff';
};

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = GAME_CONFIG.CANVAS_WIDTH;
    canvasRef.value.height = GAME_CONFIG.CANVAS_HEIGHT;
    game = new Game(canvasRef.value, onStateChange);
    gameState.value = game.getState();
  }
});

onUnmounted(() => {
  if (game) {
    game.destroy();
  }
});
</script>

<template>
  <div class="game-container flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a] p-4">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap" rel="stylesheet">
    
    <div class="relative" :style="{ width: GAME_CONFIG.CANVAS_WIDTH + 'px', height: GAME_CONFIG.CANVAS_HEIGHT + 'px' }">
      <canvas
        ref="canvasRef"
        class="rounded-xl shadow-2xl shadow-purple-900/50"
      />

      <div v-if="gameState?.status === 'menu'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
        <div class="text-center mb-8">
          <h1 class="text-5xl font-black mb-2 bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent" style="font-family: 'Orbitron', sans-serif;">
            极速颜色
          </h1>
          <h2 class="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse" style="font-family: 'Orbitron', sans-serif;">
            穿越
          </h2>
          <p class="text-gray-400 mt-2 text-sm" style="font-family: 'Rajdhani', sans-serif;">
            手残党退散！
          </p>
        </div>

        <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">最高分</p>
              <p class="text-2xl font-bold text-yellow-400" style="font-family: 'Orbitron', sans-serif;">{{ formattedHighScore }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">累计分</p>
              <p class="text-2xl font-bold text-cyan-400" style="font-family: 'Orbitron', sans-serif;">{{ formattedTotalScore }}</p>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <p class="text-gray-400 text-sm mb-3 text-center" style="font-family: 'Rajdhani', sans-serif;">选择皮肤</p>
          <div class="flex gap-3">
            <button
              v-for="skin in skins"
              :key="skin.id"
              @click="selectSkin(skin.id)"
              class="relative w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center"
              :class="[
                skin.selected ? 'ring-4 ring-white shadow-lg scale-110' : 'ring-2 ring-white/20 hover:ring-white/50',
                skin.unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              ]"
              :style="{ 
                backgroundColor: skin.unlocked ? getSkinPreviewColor(skin.id) + '40' : '#333',
                boxShadow: skin.selected && skin.unlocked ? `0 0 20px ${getSkinPreviewColor(skin.id)}` : 'none'
              }"
              :disabled="!skin.unlocked"
            >
              <div 
                class="w-8 h-8 rounded-full"
                :style="{ 
                  background: skin.unlocked 
                    ? `radial-gradient(circle at 30% 30%, #fff, ${getSkinPreviewColor(skin.id)})`
                    : '#444'
                }"
              />
              <Lock v-if="!skin.unlocked" class="absolute w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div class="flex gap-3 mt-2">
            <p v-for="skin in skins" :key="skin.id" class="text-[10px] text-center w-14 text-gray-400" style="font-family: 'Rajdhani', sans-serif;">
              {{ skin.name }}<br>
              <span v-if="!skin.unlocked" class="text-yellow-500/70">{{ skin.unlockScore }}分解锁</span>
            </p>
          </div>
        </div>

        <button
          @click="startGame"
          class="px-12 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xl font-bold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/50 active:scale-95"
          style="font-family: 'Orbitron', sans-serif;"
        >
          开始游戏
        </button>

        <div class="mt-6 text-gray-500 text-xs text-center" style="font-family: 'Rajdhani', sans-serif;">
          <p>点击屏幕或按空格键跳跃</p>
          <p class="mt-1">穿越匹配颜色的圆环段</p>
        </div>
      </div>

      <div v-if="gameState?.status === 'playing' || gameState?.status === 'paused'" class="absolute inset-0 pointer-events-none">
        <div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div class="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <p class="text-gray-400 text-[10px] uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">分数</p>
            <p 
              class="text-2xl font-bold" 
              :class="gameState?.frenzyMode ? 'text-pink-400 animate-pulse' : 'text-white'"
              style="font-family: 'Orbitron', sans-serif;"
            >
              {{ formattedScore }}
              <span v-if="gameState?.frenzyMode" class="text-sm text-pink-400">×3</span>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div class="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
              <div class="flex items-center gap-1">
                <Heart v-for="i in 3" :key="i" class="w-5 h-5" :class="i <= (gameState?.lives || 0) ? 'text-red-500 fill-red-500' : 'text-gray-600'" />
              </div>
            </div>
            <button
              @click="gameState?.status === 'playing' ? pauseGame() : resumeGame()"
              class="bg-black/50 backdrop-blur-md rounded-xl p-2 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Pause v-if="gameState?.status === 'playing'" class="w-6 h-6 text-white" />
              <Play v-else class="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div v-if="gameState?.frenzyMode" class="absolute top-20 left-4 right-4">
          <div class="bg-gradient-to-r from-pink-600/80 to-purple-600/80 backdrop-blur-md rounded-xl px-4 py-2 border border-pink-400/30">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <Zap class="w-5 h-5 text-yellow-300 animate-pulse" />
                <span class="text-white font-bold" style="font-family: 'Orbitron', sans-serif;">狂热模式 ×3</span>
              </div>
              <span class="text-yellow-300 text-sm" style="font-family: 'Rajdhani', sans-serif;">
                {{ Math.ceil((gameState?.frenzyTimeLeft || 0) / 1000) }}s
              </span>
            </div>
            <div class="h-1 bg-black/30 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-yellow-400 to-pink-400 transition-all duration-100"
                :style="{ width: frenzyProgress + '%' }"
              />
            </div>
          </div>
        </div>

        <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
          <div class="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <p class="text-gray-400 text-[10px] uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">连击</p>
            <p 
              class="text-xl font-bold"
              :class="gameState && gameState.combo >= 10 ? 'text-yellow-400' : 'text-white'"
              style="font-family: 'Orbitron', sans-serif;"
            >
              {{ gameState?.combo || 0 }}
              <span v-if="gameState && gameState.combo >= 10" class="text-yellow-400 text-sm">🔥</span>
            </p>
          </div>

          <div class="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <p class="text-gray-400 text-[10px] uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">已通过</p>
            <p class="text-xl font-bold text-cyan-400" style="font-family: 'Orbitron', sans-serif;">
              {{ gameState?.ringsPassed || 0 }}
            </p>
          </div>

          <div class="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <div class="flex items-center gap-1">
              <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span class="text-xl font-bold text-yellow-400" style="font-family: 'Orbitron', sans-serif;">
                {{ gameState?.starsCollected || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="gameState?.status === 'paused'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl">
        <h2 class="text-4xl font-black text-white mb-8" style="font-family: 'Orbitron', sans-serif;">暂停</h2>
        <div class="flex flex-col gap-4">
          <button
            @click="resumeGame"
            class="px-10 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-lg font-bold rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style="font-family: 'Orbitron', sans-serif;"
          >
            <Play class="w-5 h-5" />
            继续
          </button>
          <button
            @click="restartGame"
            class="px-10 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white text-lg font-bold rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style="font-family: 'Orbitron', sans-serif;"
          >
            <RotateCcw class="w-5 h-5" />
            重新开始
          </button>
          <button
            @click="goToMenu"
            class="px-10 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-lg font-bold rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style="font-family: 'Orbitron', sans-serif;"
          >
            <Home class="w-5 h-5" />
            返回菜单
          </button>
        </div>
      </div>

      <div v-if="gameState?.status === 'gameover'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md rounded-xl">
        <div v-if="isNewHighScore" class="mb-4 text-center">
          <p class="text-yellow-400 text-2xl font-black animate-bounce" style="font-family: 'Orbitron', sans-serif;">
            🎉 新纪录！🎉
          </p>
        </div>
        
        <h2 class="text-4xl font-black text-red-500 mb-6" style="font-family: 'Orbitron', sans-serif;">游戏结束</h2>

        <div class="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10 w-64">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">本局得分</p>
              <p class="text-3xl font-bold text-white" style="font-family: 'Orbitron', sans-serif;">{{ formattedScore }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">最高分</p>
              <p class="text-3xl font-bold text-yellow-400" style="font-family: 'Orbitron', sans-serif;">{{ formattedHighScore }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">最大连击</p>
              <p class="text-2xl font-bold text-cyan-400" style="font-family: 'Orbitron', sans-serif;">{{ gameState?.maxCombo || 0 }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider" style="font-family: 'Rajdhani', sans-serif;">通过环数</p>
              <p class="text-2xl font-bold text-purple-400" style="font-family: 'Orbitron', sans-serif;">{{ gameState?.ringsPassed || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            @click="restartGame"
            class="px-10 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-lg font-bold rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style="font-family: 'Orbitron', sans-serif;"
          >
            <RotateCcw class="w-5 h-5" />
            再来一局
          </button>
          <button
            @click="goToMenu"
            class="px-10 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-lg font-bold rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style="font-family: 'Orbitron', sans-serif;"
          >
            <Home class="w-5 h-5" />
            返回菜单
          </button>
        </div>
      </div>

      <button
        @click="toggleSound"
        class="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-2 border border-white/10 hover:bg-white/10 transition-colors z-10"
        :class="{ 'pointer-events-none': gameState?.status !== 'menu' }"
      >
        <Volume2 v-if="soundEnabled" class="w-5 h-5 text-white" />
        <VolumeX v-else class="w-5 h-5 text-gray-500" />
      </button>
    </div>

    <div class="mt-4 text-gray-500 text-xs text-center max-w-md" style="font-family: 'Rajdhani', sans-serif;">
      <p>小球颜色每0.8秒自动轮换 | 重力加速度: {{ GAME_CONFIG.GRAVITY }}px/帧²</p>
      <p class="mt-1">每通过10环难度+0.05 | 连续20环触发狂热模式×3得分</p>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

canvas {
  display: block;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px currentColor;
  }
  50% {
    box-shadow: 0 0 40px currentColor;
  }
}
</style>

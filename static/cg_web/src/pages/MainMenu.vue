<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
    <div class="text-center mb-12">
      <h1 class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 drop-shadow-lg">
        像素大闯关
      </h1>
      <p class="text-xl text-gray-300">Pixel Adventure</p>
    </div>

    <div class="flex flex-col gap-4 w-full max-w-md">
      <button
        v-if="hasSession"
        @click="continueGame"
        class="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden animate-pulse"
      >
        <span class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-2xl">⚡</span>
          继续游戏
          <span class="bg-white/20 px-3 py-1 rounded-full text-sm">关卡 {{ sessionLevelId }}</span>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      <button
        @click="startGame"
        class="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <span class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-2xl">🎮</span>
          {{ hasSession ? '重新开始' : '开始游戏' }}
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      <button
        @click="goToLevelSelect"
        class="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <span class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-2xl">🗺️</span>
          关卡选择
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      <button
        @click="goToShop"
        class="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <span class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-2xl">🛒</span>
          商店
          <span class="bg-white/20 px-3 py-1 rounded-full text-sm">{{ gameStore.totalCoins }} 💰</span>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      <button
        @click="goToCharacterSelect"
        class="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
      >
        <span class="relative z-10 flex items-center justify-center gap-3">
          <span class="text-2xl">👤</span>
          角色选择
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </div>

    <div class="mt-12 text-center">
      <p class="text-gray-400 text-sm">
        当前角色: <span class="text-purple-400 font-bold">{{ currentCharacterName }}</span>
      </p>
      <p class="text-gray-500 text-xs mt-2">
        使用 WASD 或 方向键 移动 | 空格 跳跃 | J/K 攻击 | ESC 暂停
      </p>
    </div>

    <div class="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
      <span class="text-yellow-400 text-xl">💰</span>
      <span class="text-white font-bold">{{ gameStore.totalCoins }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { CHARACTERS } from '@/utils/constants';

const router = useRouter();
const gameStore = useGameStore();

const currentCharacterName = computed(() => {
  const charId = gameStore.currentCharacter;
  return CHARACTERS[charId]?.name || '像素英雄';
});

const hasSession = computed(() => gameStore.hasGameSession());
const sessionLevelId = computed(() => {
  const session = gameStore.loadGameSession();
  return session?.levelId || 1;
});

function continueGame() {
  const session = gameStore.loadGameSession();
  if (session) {
    gameStore.setCurrentLevelId(session.levelId);
    router.push(`/game/${session.levelId}`);
  }
}

function startGame() {
  gameStore.clearGameSession();
  gameStore.setCurrentLevelId(1);
  router.push('/game/1');
}

function goToLevelSelect() {
  router.push('/level-select');
}

function goToShop() {
  router.push('/shop');
}

function goToCharacterSelect() {
  router.push('/character-select');
}
</script>

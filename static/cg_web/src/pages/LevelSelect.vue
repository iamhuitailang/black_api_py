<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <button @click="goBack" class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <span>←</span> 返回
        </button>
        <h1 class="text-4xl font-bold text-white">关卡选择</h1>
        <div class="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
          <span class="text-yellow-400 text-xl">💰</span>
          <span class="text-white font-bold">{{ gameStore.totalCoins }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="level in levels" :key="level.id" @click="selectLevel(level.id)" :class="[
          'relative rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300',
          level.unlocked ? 'hover:scale-105 hover:shadow-2xl' : 'opacity-60 cursor-not-allowed grayscale'
        ]">
          <div :class="['h-64 p-6 flex flex-col', level.unlocked ? level.bgClass : 'bg-gray-700']">
            <div class="flex justify-between items-start mb-4">
              <div class="text-5xl">{{ level.icon }}</div>
              <div class="bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                <span class="text-white font-bold">关卡 {{ level.id }}</span>
              </div>
            </div>

            <h3 class="text-2xl font-bold text-white mb-2">{{ level.name }}</h3>
            <p class="text-white/70 text-sm flex-grow">{{ level.description }}</p>

            <div v-if="level.unlocked" class="mt-4">
              <div class="flex items-center gap-1 mb-2">
                <span v-for="star in 3" :key="star" :class="[
                  'text-2xl transition-all duration-300',
                  star <= level.stars ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-500'
                ]">★</span>
              </div>
              <div class="text-white/80 text-sm">
                最高分: <span class="text-yellow-400 font-bold">{{ level.highScore }}</span>
              </div>
            </div>

            <div v-else class="mt-4 flex items-center gap-2">
              <span class="text-3xl">🔒</span>
              <span class="text-white/60 text-sm">完成上一关解锁</span>
            </div>
          </div>

          <div v-if="level.unlocked" :class="['absolute bottom-0 left-0 right-0 h-2', level.progressClass]" :style="{ width: `${level.progress}%` }"></div>
        </div>
      </div>

      <div class="mt-12 text-center">
        <div class="inline-flex items-center gap-4 bg-black/30 backdrop-blur-sm px-8 py-4 rounded-2xl">
          <div class="text-center">
            <div class="text-3xl mb-1">🏆</div>
            <div class="text-white/60 text-xs">总星数</div>
            <div class="text-yellow-400 font-bold text-xl">{{ totalStars }} / 12</div>
          </div>
          <div class="w-px h-12 bg-white/20"></div>
          <div class="text-center">
            <div class="text-3xl mb-1">🎯</div>
            <div class="text-white/60 text-xs">已解锁</div>
            <div class="text-green-400 font-bold text-xl">{{ unlockedCount }} / 4</div>
          </div>
          <div class="w-px h-12 bg-white/20"></div>
          <div class="text-center">
            <div class="text-3xl mb-1">⭐</div>
            <div class="text-white/60 text-xs">最高分</div>
            <div class="text-cyan-400 font-bold text-xl">{{ maxScore }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { LEVEL_NAMES } from '@/utils/constants';

const router = useRouter();
const gameStore = useGameStore();

interface LevelInfo {
  id: number;
  name: string;
  description: string;
  icon: string;
  bgClass: string;
  progressClass: string;
  unlocked: boolean;
  stars: number;
  highScore: number;
  progress: number;
}

const levelConfig: Record<string, { bgClass: string; progressClass: string }> = {
  forest: {
    bgClass: 'bg-gradient-to-br from-emerald-900 to-green-600',
    progressClass: 'bg-gradient-to-r from-green-400 to-green-700'
  },
  volcano: {
    bgClass: 'bg-gradient-to-br from-red-900 to-orange-600',
    progressClass: 'bg-gradient-to-r from-orange-400 to-red-700'
  },
  ice: {
    bgClass: 'bg-gradient-to-br from-slate-800 to-cyan-400',
    progressClass: 'bg-gradient-to-r from-cyan-300 to-blue-600'
  },
  space: {
    bgClass: 'bg-gradient-to-br from-purple-900 to-violet-500',
    progressClass: 'bg-gradient-to-r from-violet-400 to-purple-700'
  }
};

const levelThemes = [
  { theme: 'forest', icon: '🌲', desc: '神秘的森林深处，隐藏着未知的危险' },
  { theme: 'volcano', icon: '🌋', desc: '炽热的火山地带，小心熔岩和怪物' },
  { theme: 'ice', icon: '❄️', desc: '寒冷的冰雪世界，注意脚下的冰面' },
  { theme: 'space', icon: '🚀', desc: '浩瀚的宇宙空间，对抗外星入侵者' }
];

const levels = computed<LevelInfo[]>(() => {
  return levelThemes.map((theme, index) => {
    const levelId = index + 1;
    const unlocked = gameStore.isLevelUnlocked(levelId);
    const stars = gameStore.getLevelStars(levelId);
    const highScore = gameStore.getLevelScore(levelId);
    const config = levelConfig[theme.theme];
    
    return {
      id: levelId,
      name: LEVEL_NAMES[theme.theme] || `关卡 ${levelId}`,
      description: theme.desc,
      icon: theme.icon,
      bgClass: config.bgClass,
      progressClass: config.progressClass,
      unlocked,
      stars,
      highScore,
      progress: Math.min(100, (stars / 3) * 100)
    };
  });
});

const totalStars = computed(() => levels.value.reduce((sum, level) => sum + level.stars, 0));
const unlockedCount = computed(() => levels.value.filter(level => level.unlocked).length);
const maxScore = computed(() => Math.max(...levels.value.map(level => level.highScore), 0));

function goBack() {
  router.push('/');
}

function selectLevel(levelId: number) {
  const level = levels.value.find(l => l.id === levelId);
  if (!level?.unlocked) return;
  
  gameStore.setCurrentLevelId(levelId);
  router.push(`/game/${levelId}`);
}
</script>

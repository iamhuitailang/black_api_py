<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 p-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <button @click="goBack" class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
          <span>←</span> 返回
        </button>
        <h1 class="text-4xl font-bold text-white">角色选择</h1>
        <div class="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
          <span class="text-yellow-400 text-xl">💰</span>
          <span class="text-white font-bold">{{ gameStore.totalCoins }}</span>
        </div>
      </div>

      <div v-if="message" :class="[
        'mb-6 p-4 rounded-lg text-center font-bold',
        messageType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      ]">{{ message }}</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="character in characters" :key="character.id"
          @click="selectCharacter(character.id)" :class="[
            'relative rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300',
            character.unlocked ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed grayscale',
            character.selected ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50' : ''
          ]">
          <div :class="['p-6', character.bgClass]">
            <div class="absolute top-4 right-4">
              <div v-if="character.selected" class="bg-purple-500 px-3 py-1 rounded-full">
                <span class="text-white font-bold text-sm">▶ 已选择</span>
              </div>
              <div v-else-if="!character.unlocked" class="bg-gray-700 px-3 py-1 rounded-full">
                <span class="text-white font-bold text-sm">🔒 未解锁</span>
              </div>
            </div>

            <div class="flex items-start gap-6">
              <div class="text-8xl flex-shrink-0">{{ character.icon }}</div>
              <div class="flex-grow">
                <h3 class="text-2xl font-bold text-white mb-2">{{ character.name }}</h3>
                <p class="text-white/70 text-sm mb-4">{{ character.description }}</p>

                <div class="grid grid-cols-2 gap-3 mb-4">
                  <div class="bg-black/30 rounded-lg p-3">
                    <div class="text-red-400 text-xs mb-1">❤️ 生命值</div>
                    <div class="flex items-center gap-1">
                      <div v-for="i in 10" :key="i" :class="[
                        'w-3 h-3 rounded', i <= character.health ? 'bg-red-500' : 'bg-gray-600'
                      ]"></div>
                    </div>
                  </div>
                  <div class="bg-black/30 rounded-lg p-3">
                    <div class="text-blue-400 text-xs mb-1">⚡ 速度</div>
                    <div class="flex items-center gap-1">
                      <div v-for="i in 10" :key="i" :class="[
                        'w-3 h-3 rounded', i <= character.speed ? 'bg-blue-500' : 'bg-gray-600'
                      ]"></div>
                    </div>
                  </div>
                  <div class="bg-black/30 rounded-lg p-3">
                    <div class="text-orange-400 text-xs mb-1">⚔️ 攻击力</div>
                    <div class="flex items-center gap-1">
                      <div v-for="i in 10" :key="i" :class="[
                        'w-3 h-3 rounded', i <= character.attack * 5 ? 'bg-orange-500' : 'bg-gray-600'
                      ]"></div>
                    </div>
                  </div>
                  <div class="bg-black/30 rounded-lg p-3">
                    <div class="text-purple-400 text-xs mb-1">🎯 特殊能力</div>
                    <div class="text-white text-sm">{{ character.ranged ? '远程攻击' : '近战攻击' }}</div>
                  </div>
                </div>

                <div v-if="!character.unlocked && character.price" class="mt-4">
                  <button @click.stop="unlockCharacter(character.id)"
                    :disabled="gameStore.totalCoins < character.price" :class="[
                      'w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2',
                      gameStore.totalCoins >= character.price
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/50'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    ]">
                    <span>💰</span> <span>{{ character.price }} 解锁</span>
                  </button>
                </div>

                <div v-else-if="character.unlocked && !character.selected" class="mt-4">
                  <button @click.stop="selectCharacter(character.id)"
                    class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                    选择出战
                  </button>
                </div>

                <div v-else-if="character.selected" class="mt-4">
                  <div class="w-full py-3 bg-green-500/30 text-green-400 font-bold rounded-lg text-center">
                    ✓ 当前出战角色
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-400 text-sm">提示: 不同角色有不同的属性和能力，选择适合你的角色开始冒险吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { useShopStore } from '@/stores/shopStore';
import { CHARACTERS } from '@/utils/constants';

const router = useRouter();
const gameStore = useGameStore();
const shopStore = useShopStore();

const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const characterIcons: Record<string, string> = {
  hero: '🦸', ninja: '🥷', knight: '🛡️', mage: '🧙'
};

const characterBgs: Record<string, string> = {
  hero: 'bg-gradient-to-br from-blue-600 to-blue-900',
  ninja: 'bg-gradient-to-br from-gray-700 to-gray-900',
  knight: 'bg-gradient-to-br from-slate-600 to-slate-900',
  mage: 'bg-gradient-to-br from-purple-600 to-purple-900'
};

interface CharacterDisplay {
  id: string;
  name: string;
  description: string;
  health: number;
  speed: number;
  attack: number;
  ranged?: boolean;
  price?: number;
  icon: string;
  bgClass: string;
  unlocked: boolean;
  selected: boolean;
}

const characters = computed<CharacterDisplay[]>(() => {
  return Object.values(CHARACTERS).map(char => ({
    ...char,
    icon: characterIcons[char.id] || '👤',
    bgClass: characterBgs[char.id] || 'bg-gradient-to-br from-gray-600 to-gray-900',
    unlocked: gameStore.unlockedCharacters.includes(char.id),
    selected: gameStore.currentCharacter === char.id
  }));
});

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 3000);
}

function selectCharacter(charId: string) {
  const char = characters.value.find(c => c.id === charId);
  if (!char) return;
  
  if (!char.unlocked) {
    showMessage('该角色尚未解锁', 'error');
    return;
  }

  const success = gameStore.setCurrentCharacter(charId);
  if (success) {
    showMessage(`已选择 ${char.name}！`, 'success');
    gameStore.saveProgress();
  }
}

function unlockCharacter(charId: string) {
  const result = shopStore.purchaseItem(charId);
  showMessage(result.message, result.success ? 'success' : 'error');
  if (result.success) gameStore.saveProgress();
}

function goBack() {
  router.push('/');
}
</script>

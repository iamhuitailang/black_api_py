<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-900 via-amber-900 to-slate-900 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <button @click="goBack" class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
          <span>←</span> 返回
        </button>
        <h1 class="text-4xl font-bold text-white">商店</h1>
        <div class="flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border-2 border-yellow-500/50">
          <span class="text-yellow-400 text-2xl">💰</span>
          <span class="text-yellow-300 font-bold text-xl">{{ gameStore.totalCoins }}</span>
        </div>
      </div>

      <div class="mb-6">
        <div class="flex gap-2">
          <button @click="activeTab = 'items'" :class="[
            'px-6 py-3 font-bold rounded-lg transition-all',
            activeTab === 'items'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          ]">🎒 道具</button>
          <button @click="activeTab = 'characters'" :class="[
            'px-6 py-3 font-bold rounded-lg transition-all',
            activeTab === 'characters'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          ]">👤 角色</button>
        </div>
      </div>

      <div v-if="message" :class="[
        'mb-6 p-4 rounded-lg text-center font-bold',
        messageType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      ]">{{ message }}</div>

      <div v-if="activeTab === 'items'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in shopStore.consumableShopItems" :key="item.id"
          class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="text-5xl">{{ item.icon }}</div>
            <div class="bg-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1">
              <span class="text-yellow-400">💰</span>
              <span class="text-yellow-300 font-bold">{{ item.price }}</span>
            </div>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">{{ item.name }}</h3>
          <p class="text-gray-400 text-sm mb-4">{{ item.description }}</p>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              拥有: <span class="text-green-400 font-bold">{{ shopStore.getItemCount(item.id) }}</span>
            </div>
            <button @click="purchaseItem(item.id)" :disabled="!shopStore.canAfford(item.price)" :class="[
              'px-6 py-2 font-bold rounded-lg transition-all',
              shopStore.canAfford(item.price)
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/50'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            ]">购买</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'characters'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="item in shopStore.characterShopItems" :key="item.id" :class="[
          'bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border transition-all',
          item.owned ? 'border-purple-500/50' : 'border-slate-700 hover:border-purple-500/50'
        ]">
          <div class="flex items-start justify-between mb-4">
            <div class="text-6xl">{{ item.icon }}</div>
            <div v-if="item.owned" class="bg-green-500/20 px-3 py-1 rounded-full">
              <span class="text-green-400 font-bold">✓ 已拥有</span>
            </div>
            <div v-else class="bg-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1">
              <span class="text-yellow-400">💰</span>
              <span class="text-yellow-300 font-bold">{{ item.price }}</span>
            </div>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">{{ item.name }}</h3>
          <p class="text-gray-400 text-sm mb-4">{{ item.description }}</p>
          <div class="flex items-center justify-between">
            <div v-if="item.owned && gameStore.currentCharacter === item.id" class="text-purple-400 font-bold">
              ▶ 当前出战
            </div>
            <button v-if="item.owned && gameStore.currentCharacter !== item.id"
              @click="selectCharacter(item.id)"
              class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg">
              选择出战
            </button>
            <button v-else-if="!item.owned"
              @click="purchaseItem(item.id)" :disabled="!shopStore.canAfford(item.price)" :class="[
                'px-6 py-2 font-bold rounded-lg transition-all',
                shopStore.canAfford(item.price)
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              ]">解锁</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { useShopStore } from '@/stores/shopStore';

const router = useRouter();
const gameStore = useGameStore();
const shopStore = useShopStore();

const activeTab = ref<'items' | 'characters'>('items');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 3000);
}

function purchaseItem(itemId: string) {
  const result = shopStore.purchaseItem(itemId);
  showMessage(result.message, result.success ? 'success' : 'error');
  if (result.success) gameStore.saveProgress();
}

function selectCharacter(charId: string) {
  const success = gameStore.setCurrentCharacter(charId);
  showMessage(success ? '角色已更换！' : '角色未解锁', success ? 'success' : 'error');
  if (success) gameStore.saveProgress();
}

function goBack() {
  router.push('/');
}
</script>
